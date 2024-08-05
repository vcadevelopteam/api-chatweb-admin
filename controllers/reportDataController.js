const { buildQueryDynamic2 } = require('../config/triggerfunctions');
const { executesimpletransaction } = require('../config/triggerfunctions');
const logger = require('../config/winston');
const CryptoJS = require('crypto-js');

const validateBearerToken = async (token) => {
    if (token) {
        const authHeader = String(token);
        if (authHeader.startsWith('Bearer ')) {
            const apikey = authHeader.substring(7, authHeader.length);
            const resApikey = await executesimpletransaction("QUERY_GET_DATA_FROM_APIKEY", { apikey })

            if ((resApikey instanceof Array) && resApikey.length > 0) {
                return resApikey[0];
            } else {
                const key = process.env?.SECRETA ?? "palabrasecreta";
                try {
                    const jsonData = CryptoJS.AES.decrypt(apikey, key).toString(CryptoJS.enc.Utf8)
                    const user = JSON.parse(jsonData);
                    if (user.admin) {
                        return JSON.parse(jsonData);
                    }
                } catch (error) {

                }
            }
        }
    }
    throw new Error("token is not valid")
}

const verifyIP = async (clientIP, params) => {
    const whitelist = await executesimpletransaction("QUERY_WHITELIST", params);
    
    if (whitelist.length > 0) {
        const isAllowed = whitelist.some(ipRange => clientIP === ipRange.ipstart || ipRange.ipstart === "0.0.0.0/0");
    
        if (!isAllowed) {
            // Si la IP no está permitida, envía una respuesta de acceso denegado
            throw new Error("The ip is not on the whitelist")
        }
    }
};

exports.drawReport = async (req, res) => {
    try {
        const { reportname } = req.params;
        logger.child({ _requestid: req._requestid, ctx: req.body, ip: req.ip }).info(`api drawReport: ${reportname}`);

        const filters = req.body;

        if (!reportname) {
            throw new Error("The report name is necessary.")
        }

        const params = await validateBearerToken(req.headers['authorization'])

        await verifyIP(req.ip, params);

        const dataReport = await executesimpletransaction("QUERY_GET_DATA_FROM_REPORT", { ...params, reportname });

        if (!(dataReport instanceof Array && dataReport.length > 0)) {
            throw new Error("The report name not exists.")
        }
        const { columnjson, filterjson, summaryjson } = dataReport[0];

        const filtersBD = JSON.parse(filterjson);

        const allFilters = filtersBD.every(x => filters.find(y => y.columnname === x.columnname) || x.type_filter === "unique_value");

        if (!allFilters) {
            throw new Error("Filters are necessary.")
        }

        for (const filter of filtersBD) {
            const filterFound = filters.find(y => y.columnname === filter.columnname);
            filter.value = filterFound.value;
            filter.start = filterFound.start;
            filter.end = filterFound.end;
        }

        const result = await buildQueryDynamic2(JSON.parse(columnjson), filtersBD, { ...params, offset: -5.0 }, JSON.parse(summaryjson));
        if (!result.error)
            return res.json(result);
        else
            return res.status(result.rescode).json(result);
    } catch (error) {
        return res.status(400).json({ error: true, message: error.message })
    }
}