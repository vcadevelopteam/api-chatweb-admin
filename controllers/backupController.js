const { errors, getErrorCode } = require('../config/helpers');
const { executesimpletransaction: exeMethod } = require('../config/triggerfunctions');
const { Pool } = require('pg');
const Cursor = require('pg-cursor');
const BATCH_SIZE = 100_000;
let clientBackup = null;
let tables_success = [];

const processCursor = async (cursor, table, dt, columns, lastdate) => {
    return new Promise((resolve, reject) => {
        (function read() {
            cursor.read(table.batchsize || BATCH_SIZE, async (err, rows) => {
                try {
                    if (err) {
                        console.error({ error: err });
                        return reject({ error: true, err });
                    }
                    // no more rows, so we're done!
                    if (!rows.length) {
                        return resolve({ error: false, success: true });
                    }

                    await insertMassive(table, rows, dt, columns, lastdate);

                    return read();
                } catch (error) {
                    console.log(error);
                    return reject(error);
                }
            });
        })();
    });
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

        console.log(`${tablename} insert: ${data.inserts.length} update: ${data.updates.length}`);

        if (data.inserts.length > 0) {
            console.time(`inserting ${tablename} (${data.inserts.length})`);

            const where = columnpk ? `xins.${columnpk} = dt.${columnpk}` : insertwhere;

            const query = `INSERT INTO "${tablename}"
                OVERRIDING SYSTEM VALUE
                SELECT dt.*
                FROM json_populate_recordset(null::record, $1)
                AS dt (${dt})
                WHERE NOT EXISTS(SELECT 1 FROM "${tablename}" xins WHERE ${where})`.replace('\n', ' ');

            await clientBackup.query(query, [JSON.stringify(data.inserts)]);
            console.timeEnd(`inserting ${tablename} (${data.inserts.length})`);
        }
        if (data.updates.length > 0) {
            console.time(`updating ${tablename} (${data.updates.length})`);
            const where = columnpk ? `xupd.${columnpk} = dt.${columnpk}` : `${updatewhere}`;

            const query = `UPDATE "${tablename}" xupd
            SET ${columns.split(', ').map(c => `"${c}" = dt.${c}`).join(', ')}
            FROM json_populate_recordset(null::record, $1)
            AS dt (${dt})
            WHERE ${where}`.replace('\n', ' ');

            await clientBackup.query(query, [JSON.stringify(data.updates)]);
            console.timeEnd(`updating ${tablename} (${data.updates.length})`);
        }
        tables_success.push(tablename)
    } catch (error) {
        console.log(error);
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
    try {
        const tablesToBackup = await exeMethod("QUERY_SEL_TABLESETTING_BACKUP", {});
        const infoSelect = await exeMethod("UFN_LOGBACKUP_SEL", {});

        if (!Array.isArray(tablesToBackup) || !Array.isArray(infoSelect)) {
            return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
        }
        const { lastconsulteddate: lastdate, nextconsulteddate: todate } = infoSelect[0];

        if (tablesToBackup.length === 0) {
            return res.status(400).json({ error: false, success: false, message: "there are not tables" });
        }

        const client = await connectToDB();
        clientBackup = await connectToDB(true);
        
        for (const table of tablesToBackup) {
            const { tablename, selectwhere, columnpk } = table;
            // Si desea ejecutar algunas tablas, descomentar 
            // if (!["interaction"].includes(tablename)) continue;

            let querySelect = "";

            const dtResult = await client.query(
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
                console.log(`BACKUP: executing SELECT MAX(${columnpk}) max FROM ${tablename}`);
                const maxResult = await clientBackup.query(`SELECT MAX(${columnpk}) max FROM ${tablename}`);
                table.idMax = maxResult.rows[0].max;
            }
            const where = selectwhere
                .replace('###FROMDATE###', lastdate)
                .replace('###TODATE###', todate)
                .replace('###ID###', table.idMax);

            querySelect = `SELECT ${fixsel} FROM "${tablename}" WHERE ${where}`;
            console.log(`BD: executing `, `SELECT FROM "${tablename}" WHERE ${where}`);

            const cursor = client.query(new Cursor(querySelect));

            await processCursor(cursor, table, dt, columns, lastdate);

            cursor.close(); // Cerrar el cursor después de procesarlo
        }
        client.release();
        clientBackup.release();

        return res.status(200).json({ success: true });
    } catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
};
