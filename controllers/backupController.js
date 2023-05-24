const fs = require('fs');
const { errors, getErrorCode, axiosObservable } = require('../config/helpers');
const { executesimpletransaction: exeMethod, executeQuery } = require('../config/triggerfunctions');
const backupSeq = require("../config/databasebackup");
const sequelize = require('../config/database');


exports.incremental = async (req, res) => {
    // const { data: { usr, password, facebookid, googleid } } = req.body;

    try {
        const tablesToBackup = await exeMethod("QUERY_SEL_TABLESETTING_BACKUP", {});
        // const infoSelect = await exeMethod("QUERY_SEL_TABLESETTING_BACKUP", {});
        const infoSelect = [{
            lastdate: "2023-05-23 00:05:00",
            todate: "2023-05-23 00:06:00",
            interval: 1,
        }];

        if (!(tablesToBackup instanceof Array)) {
            return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
        }
        if (!(infoSelect instanceof Array)) {
            return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
        }
        const { lastdate, interval, todate } = infoSelect[0];

        if (tablesToBackup.length == 0) {
            return res.status(200).json({ error: false, success: false, message: "there are not tables" });
        }
        let queryGG = ""
        console.log("tablesToBackup", tablesToBackup)
        for (const table of tablesToBackup) {
            const { tablename } = table;
            console.log("executing ", tablename)
            const querySelect = `
                SELECT tb.* FROM "${tablename}" tb 
                WHERE tb.changedate > '${lastdate}'
                AND tb.changedate <= '${todate}'
            `;

            const resultbd = await executeQuery(querySelect, {}, req._requestid);

            const data = resultbd.reduce((acc, item) => ({
                ...acc,
                [(item.changedate > item.createdate && item.createdate < lastdate) ? "inserts" : "updates"]: [item, ...acc[(item.changedate > item.createdate && item.createdate < lastdate) ? "inserts" : "updates"]]
            }), { inserts: [], updates: [] });

            if (data.inserts.length === 0) {
                continue;
            }
            console.log("data.inserts", data.inserts)

            const query = data.inserts.reduce((acc, item) => {
                const values = Object.values(item).map(value => {
                    return typeof value === "string" ? `'${value.replace(/[\n'"]/gi, '')}'` : JSON.stringify(value)
                }).join(', ');
                return acc + `(${values});\n`
            }, `INSERT INTO ${tablename} (${Object.keys(data.inserts[0]).join(", ")}) VALUES\n`);

            console.log(`query ${tablename}: `, query)

            queryGG += query;
        }
        const stream = fs.createWriteStream('./sqlinsert.sql');

        stream.write(queryGG, 'utf8', (error) => {
            if (error) {
                return res.status(200).json({ error: false, success: false, message: "there are not tables" });
            }
            stream.end();
        });

        // Evento 'finish' se dispara cuando se completa la escritura del archivo
        stream.on('finish', () => {
            return res.status(200).json({ error: false, success: true, query: queryGG });
        });

    } catch (exception) {
        console.log("aaaa")
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}