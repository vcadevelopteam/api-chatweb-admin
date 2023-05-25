const { errors, getErrorCode } = require('../config/helpers');
const { executesimpletransaction: exeMethod } = require('../config/triggerfunctions');
const { Pool } = require('pg');
const Cursor = require('pg-cursor');
const BATCH_SIZE = 100_000;

let client = null;
let clientBackup = null;

const processCursor = async (cursor, table, dt, columns) => {
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

                    insertMassive(table, rows, dt, columns);

                } catch (error) {
                    console.log(error)
                    throw error
                }

                return read();
            });
        })();
    });
};

const insertMassive = async (table, rows, dt, columns) => {
    try {
        const { columnpk, tablename, update, insertwhere, updatewhere, idMax } = table;

        const data = update ? resultbd.reduce((acc, item) => {
            let trigger = "";
            //aplicariamos una logica de validacion, si el id > maxId es un INSERT, si es menor es un update ya q fue CERRADO y entro por el finishdate
            //condicion: conversationid > ###ID### OR (finishdate > '###FROMDATE###' AND finishdate <= '###TODATE###')
            if (tablename === "conversation") {
                trigger = item.conversationid > idMax ? "inserts" : "updates"
            } else {
                trigger = (item.changedate > item.createdate && item.createdate < lastdate) ? "inserts" : "updates";
            }
            return {
                ...acc,
                [trigger]: [item, ...acc[trigger]]
            }
        }, { inserts: [], updates: [] }) : { inserts: rows, updates: [] };

        if (data.inserts.length > 0) {
            console.time(`inserting ${tablename}`);
            const where = columnpk ? `WHERE NOT EXISTS(SELECT 1 FROM "${tablename}" xins WHERE xins.${columnpk} = dt.${columnpk})` : `WHERE ${insertwhere}`;
            await clientBackup.query(`
                INSERT INTO ${tablename}
                OVERRIDING SYSTEM VALUE
                SELECT dt.*
                FROM json_populate_recordset(null::record, $1)
                AS dt (${dt})
                ${where}`.replace('\n', ' '),
                [JSON.stringify(data)], (error, result) => {
                    if (error) {
                        console.error('Error al ejecutar la consulta:', error);
                    } else {
                        console.log('El insert se realizó correctamente.');
                    }
                });
            console.timeEnd(`inserting ${tablename}`);
        }
        if (data.updates.length > 0) {
            console.time(`updating ${tablename}`);
            const where = columnpk ? `WHERE xupd.${columnpk} = dt.${columnpk}` : `WHERE ${updatewhere}`;
            await clientBackup.query(`
                UPDATE ${tablename} xupd
                SET ${columns.split(', ').map(c => `"${c}" = dt.${c}`).join(', ')}
                FROM json_populate_recordset(null::record, $datatable)
                AS dt (${dt})
                ${where}`.replace('\n', ' '),
                [JSON.stringify(data)], (error, result) => {
                    if (error) {
                        console.error('Error al ejecutar la consulta:', error);
                    } else {
                        console.log('El update se realizó correctamente.');
                    }
                });
            console.timeEnd(`updating ${tablename}`);
        }

    } catch (error) {
        console.log("err", error);
        throw error;
    }
}

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
        const infoSelect = [{
            lastdate: "2023-05-19 00:05:00",
            todate: "2023-05-19 08:00:00",
            interval: 1,
        }];

        if (!Array.isArray(tablesToBackup) || !Array.isArray(infoSelect)) {
            return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
        }

        const { lastdate, interval, todate } = infoSelect[0];

        if (tablesToBackup.length === 0) {
            return res.status(200).json({ error: false, success: false, message: "there are not tables" });
        }

        client = await connectToDB();
        clientBackup = await connectToDB(true);

        for (const table of tablesToBackup) {
            const { tablename, selectwhere, columnpk } = table;
            if (!["interaction"].includes(tablename)) {
                continue;
            }
            let querySelect = "";

            console.time(tablename);

            const dtResult = await client.query(`SELECT
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
                AND c.table_name = '${tablename}'
                ORDER BY c.ordinal_position
            ) c`);

            const fixsel = dtResult.rows?.[0]?.fixsel;
            const dt = dtResult.rows?.[0]?.cnd;
            const columns = dtResult.rows?.[0]?.columns;

            if (selectwhere.includes("###ID###")) {
                console.log(`BACKUP: executing SELECT MAX(${columnpk}) max FROM ${tablename}`)
                const maxResult = await clientBackup.query(`SELECT MAX(${columnpk}) max FROM ${tablename}`);
                table.idMax = maxResult.rows[0].max;
                console.log("idMax", table.idMax)
            }
            const where = selectwhere
                .replace('###FROMDATE###', lastdate)
                .replace('###TODATE###', todate)
                .replace('###ID###', table.idMax);

            querySelect = `SELECT ${fixsel} FROM "${tablename}" WHERE ${where} LIMIT 10`;
            console.log(`BD: executing `, `SELECT FROM "${tablename}" WHERE ${where} LIMIT 10`);

            const cursor = client.query(new Cursor(querySelect));

            await processCursor(cursor, table, dt, columns);

            cursor.close(); // Cerrar el cursor después de procesarlo

            console.timeEnd(tablename);
        }
        client.release();
        clientBackup.release();

        return res.status(200).json({ success: true });
    } catch (exception) {
        console.log("aaaa");
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
};