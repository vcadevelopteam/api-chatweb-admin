const logger = require('../config/winston');
const { errors, getErrorCode } = require('../config/helpers');
const { executesimpletransaction: exeMethod } = require('../config/triggerfunctions');
const { Pool } = require('pg');
const Cursor = require('pg-cursor');
const BATCH_SIZE = 100_000;
let clientBackup = null;
let _requestid = "", tables_success = [], logbackupid = 0;

const processCursor = async (cursor, table, dt, columns, lastdate) => {
    try {
        return new Promise((resolve, reject) => {
            (function read() {
                cursor.read(table.batchsize || BATCH_SIZE, async (err, rows) => {
                    try {
                        if (err) {
                            return reject(err);
                        }
                        if (!rows.length) { // no more rows, so we're done!
                            return resolve({ error: false, success: true });
                        }

                        await insertMassive(table, rows, dt, columns, lastdate);

                        return read();
                    } catch (error) {
                        return reject(error);
                    }
                });
            })();
        });
    } catch (error) {
        throw error; // Si ocurre algún error al crear la promesa, lanza el error para ser manejado fuera de la función
    }
};

const insertMassive = async (table, rows, dt, columns, lastdate) => {
    try {
        const { columnpk, tablename, update, insertwhere, updatewhere, idMax } = table;

        const data = update
            ? rows.reduce(
                (acc, item) => {
                    const trigger = item.changedate > item.createdate && item.createdate < lastdate ? "updates" : "inserts";
                    return {
                        ...acc,
                        [trigger]: [item, ...acc[trigger]],
                    };
                },
                { inserts: [], updates: [] }
            )
            : { inserts: rows, updates: [] };

        logger.child({ _requestid }).debug(`${tablename} insert: ${data.inserts.length} update: ${data.updates.length}`)

        if (data.inserts.length > 0) {
            if (tablename === "conversation") {
                data.inserts = data.inserts.map(x => ({
                    ...x,
                    chatflowcontext: null,
                    variablecontext: null
                }))
            }

            const where = columnpk ? `xins.${columnpk} = dt.${columnpk}` : insertwhere;

            const query = `INSERT INTO "${tablename}"
                OVERRIDING SYSTEM VALUE
                SELECT dt.*
                FROM json_populate_recordset(null::record, $1)
                AS dt (${dt})
                WHERE NOT EXISTS(SELECT 1 FROM "${tablename}" xins WHERE ${where})`.replace('\n', ' ');
            
            await clientBackup.query(query, [JSON.stringify(data.inserts)]);
        }
        if (data.updates.length > 0) {
            const where = columnpk ? `xupd.${columnpk} = dt.${columnpk}` : `${updatewhere}`;

            const query = `UPDATE "${tablename}" xupd
            SET ${columns.split(', ').map(c => `"${c}" = dt.${c}`).join(', ')}
            FROM json_populate_recordset(null::record, $1)
            AS dt (${dt})
            WHERE ${where}`.replace('\n', ' ');

            await clientBackup.query(query, [JSON.stringify(data.updates)]);
        }
        tables_success.push(tablename)
    } catch (error) {
        throw error;
    }
};

const connectToDB = async (backup = false) => {
    const pool = new Pool({
        user: backup ? process.env.BACKUP_DBUSER : process.env.DBUSER,
        host: backup ? process.env.BACKUP_DBHOST : process.env.DBHOST,
        database: backup ? process.env.BACKUP_DBNAME : process.env.DBNAME,
        password: backup ? process.env.BACKUP_DBPASSWORD : process.env.DBPASSWORD,
        port: backup ? process.env.BACKUP_DBPORT : (process.env.DBPORT || "30503"),
        max: 50,
        idleTimeoutMillis: 30000,
        allowExitOnIdle: true,
        ssl: {
            rejectUnauthorized: false,
        },
    });
    return await pool.connect();
};

exports.incremental = async (req, res) => {
    let infoSelect = null;
    const client = await connectToDB();
    clientBackup = await connectToDB(true);
    try {

        _requestid = req._requestid;

        const ResultTablesToBackup = await client.query(
            `select tablename, columnpk, tableorder, selectwhere, update, batchsize, insertwhere, updatewhere from tablesettingbackup where status = 'ACTIVO' order by tableorder asc`
        );
        const ResultInfoSelect = await client.query(
            `select * FROM ufn_logbackup_sel()`
        );

        const tablesToBackup = ResultTablesToBackup.rows;
        infoSelect = ResultInfoSelect.rows;

        if (!Array.isArray(tablesToBackup) || !Array.isArray(infoSelect)) {
            return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
        }
        logbackupid = infoSelect[0].logbackupid;

        logger.child({ ctx: infoSelect[0].logbackupid, _requestid }).debug(`Run backup incremental`)

        const { lastconsulteddate: lastdate, nextconsulteddate: todate } = infoSelect[0];

        if (tablesToBackup.length === 0) {
            return res.status(400).json({ error: false, success: false, message: "there are not tables" });
        }

        for (const table of tablesToBackup) {
            const { tablename, selectwhere, columnpk } = table;
            // Si desea ejecutar algunas tablas, descomentar 
            // if (!["conversation"].includes(tablename)) continue;

            const dtResult = await clientBackup.query(
                `SELECT
            string_agg(c.column_name, ', ') filter (WHERE c.is_identity = 'NO') as columns,
            string_agg(c.fixsel, ', ') as fixsel,
            string_agg(c.cnd, ', ') as cnd
            FROM (
                SELECT
                c.column_name,
                c.is_identity,
                CONCAT('"', c.column_name, '"', '::', CASE WHEN c.data_type IN ('interval') THEN 'text' ELSE c.data_type END) as fixsel,
                CONCAT('"', c.column_name, '"', ' ', c.data_type) as cnd
                FROM information_schema.columns c
                WHERE c.table_schema = 'public'
                AND c.table_name = $1
                ORDER BY c.ordinal_position
            ) c`,
                [tablename]
            );

            const fixsel = dtResult.rows?.[0]?.fixsel;
            const dt = dtResult.rows?.[0]?.cnd;
            const columns = dtResult.rows?.[0]?.columns;

            if (selectwhere.includes("###ID###")) {
                const maxResult = await clientBackup.query(`SELECT MAX(${columnpk}) max FROM ${tablename}`);
                table.idMax = maxResult.rows[0].max;
            }
            const where = selectwhere
                .replace('###FROMDATE###', lastdate)
                .replace('###TODATE###', todate)
                .replace('###ID###', table.idMax);

            const querySelect = `SELECT ${fixsel} FROM "${tablename}" WHERE ${where}`;

            const cursor = client.query(new Cursor(querySelect));

            try {
                await processCursor(cursor, table, dt, columns, lastdate);
            } catch (error) {
                throw error;
            } finally {
                await cursor.close(); // Cerrar el cursor después de procesarlo
            }
        }

        await client.query(`select * FROM ufn_logbackup_upd($1, $2, $3, $4)`, [logbackupid, "", tables_success.join(","), "EXITO"])
        logger.child({ ctx: infoSelect[0].logbackupid, _requestid }).debug(`Finish backup incremental successfully`)

        client.release();
        clientBackup.release();
        return res.status(200).json({ success: true, logbackupid });
    } catch (exception) {
        client.query(`select * FROM ufn_logbackup_upd($1, $2, $3, $4)`, [logbackupid, `${exception}`, tables_success.join(","), "ERROR"])
        logger.child({ ctx: infoSelect?.[0].logbackupid, _requestid: req._requestid }).debug(`Finish backup incremental ERROR`)

        client.release();
        clientBackup.release();

        return res.status(500).json(getErrorCode(null, exception, `Finish backup incremental ERROR ${req.originalUrl}`, req._requestid));
    }
};