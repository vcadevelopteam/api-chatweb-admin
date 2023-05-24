const fs = require('fs');
const { errors, getErrorCode, axiosObservable } = require('../config/helpers');
const { executesimpletransaction: exeMethod, executeQuery } = require('../config/triggerfunctions');
const backupSeq = require("../config/databasebackup");
const sequelize = require('../config/database');
const { Pool } = require('pg');
const Cursor = require('pg-cursor');
const BATCH_SIZE = 100_000;

const processCursor = async (cursor, tablename, type, columnpk, client, lastdate) => {
    let indexPart = 1;

    return new Promise((resolve, reject) => {
        (function read() {
            cursor.read(BATCH_SIZE, async (err, rows) => {
                if (err) {
                    logger.error({ error: err });
                    return resolve({ error: true, err });
                }
                // no more rows, so we're done!
                if (!rows.length) {
                    return resolve({ error: false, success: true });
                }

                console.log(`${tablename}|part ${indexPart}|${rows.length}`);
                const query = toQuery(rows, lastdate, tablename, type, columnpk, client);

                const stream = fs.createWriteStream(`./queries/${tablename}-${indexPart}.sql`);

                stream.write(query.insert, 'utf8', (error) => {
                    if (error) {
                        return reject(error);
                    }
                    stream.end();
                });

                // Evento 'finish' se dispara cuando se completa la escritura del archivo
                stream.on('finish', () => {
                    // Aquí puedes realizar alguna acción después de completar la escritura del archivo
                });

                indexPart++;

                return read();
            });
        })();
    });
};

const connectX = async (query) => {
    const pool = new Pool({
        user: process.env.DBUSER,
        host: process.env.DBHOST,
        database: process.env.DBNAME,
        password: process.env.DBPASSWORD,
        port: process.env.DBPORT || "30503",
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
            lastdate: "2023-05-23 15:00:00",
            todate: "2023-05-23 16:00:00",
            interval: 1,
        }];

        if (!Array.isArray(tablesToBackup) || !Array.isArray(infoSelect)) {
            return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
        }

        const { lastdate, interval, todate } = infoSelect[0];

        if (tablesToBackup.length === 0) {
            return res.status(200).json({ error: false, success: false, message: "there are not tables" });
        }

        for (const table of tablesToBackup) {
            const { tablename, type: typeFromBD, columnpk } = table;
            // if (!["conversation", "interaction"].includes(tablename)) {
            //     continue;
            // }
            let querySelect = "";
            let type = "";
            if (typeFromBD === "NINGUNO") {
                querySelect = `
                SELECT tb.* FROM "${tablename}" tb
                WHERE tb.changedate > '${lastdate}'
                AND tb.changedate <= '${todate}'
                `;
            } else {
                const info = typeFromBD.split(":");
                type = info[0];
                if (info[0] === "WHERE") {
                    querySelect = `
                        SELECT tb.* 
                        FROM "${tablename}" tb
                        WHERE conversationid = 3618603944077`;
            //         querySelect = `
            // SELECT tb.* 
            // FROM "${tablename}" tb
            // WHERE ${info[1].toLowerCase()} > '${lastdate}'
            // AND ${info[1].toLowerCase()} <= '${todate}'`;
                } else if (info[0] === "LASTID") {
                    querySelect = `
            SELECT tb.* 
            FROM "${tablename}" tb
            WHERE ${columnpk} > '${info[1]}'`;
                }
            }

            console.time(tablename);

            const client = await connectX(querySelect);
            const cursor = client.query(new Cursor(querySelect));

            await processCursor(cursor, tablename, type, columnpk, client, lastdate);
            console.timeEnd(tablename);

            if (type === "LASTID") {
                // Realiza alguna acción adicional si el tipo es "LASTID"
            }

            return res.status(200).json({ success: true });

        }
    } catch (exception) {
        console.log("aaaa");
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
};

const toQuery = (data, lastdate, tablename, type = "NINGUNO", columnpk, client) => {
    const newData = data.reduce((acc, item) => {
        const isNew = type !== "NINGUNO" || (item.changedate > item.createdate && item.createdate < lastdate);
        if (isNew) {
            const values = Object.values(item).map(value => {
                return typeof value === "string" ? `'${value.replace(/[\n'"]/gi, '')}'` : JSON.stringify(value);
            }).join(', ');
            acc.insert += `(${values}),\n`;
            return acc;
        } else {
            // Por desarrollar
        }
    }, {
        insert: `INSERT INTO ${tablename} (${Object.keys(data[0]).join(", ")}) VALUES\n`,
        update: `UPDATE ${tablename} SET `,
    });

    newData.insert = newData.insert ? newData.insert.slice(0, -2) : "";
    // newData.update = newData.update ? newData.update.slice(0, -2) : "";
    return newData;
};