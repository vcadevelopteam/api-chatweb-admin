const { executesimpletransaction } = require("../config/triggerfunctions");
const logger = require("../config/winston");
const { google } = require("googleapis");
const xlsx = require("xlsx");

const GOOGLE_CLIENTID = process.env.GOOGLE_CLIENTID;
const GOOGLE_CLIENTSECRET = process.env.GOOGLE_CLIENTSECRET;
const GOOGLE_REDIRECTURI = process.env.GOOGLE_REDIRECTURI;

exports.sync = async (req, res) => {
    try {
        const { corpid, orgid, integrationmanagerid } = req.body;

        const integration_data = await executesimpletransaction("QUERY_INTEGRATIONMANAGER_SYNC_SEL", {
            corpid,
            orgid,
            username: "task",
            id: integrationmanagerid,
            all: false,
        });

        if (!(integration_data instanceof Array) || integration_data[0].status !== "ACTIVO") {
            return res.status(400).json(integration_data);
        }

        const result = await getFileDataFromGoogle({
            requestid: req._requestid,
            ...integration_data[0],
        });
        if (!result.success) {
            await updateIntegrationSyncStatus(
                req.body,
                "ERROR",
                JSON.parse(result.msg).error.message ?? "Error fetching data from Google"
            );
            return res.status(400).json({
                code: "error_unexpected_error",
                error: true,
                message: "Invalid credentials",
                success: false,
            });
        }

        const importResult = await executesimpletransaction("UFN_INTEGRATIONMANAGER_IMPORT", {
            corpid,
            orgid,
            id: integrationmanagerid,
            table: JSON.stringify(result.data),
        });
        if (!(importResult instanceof Array)) {
            await updateIntegrationSyncStatus(
                req.body,
                "ERROR",
                importResult.code === "ALREADY_EXISTS_RECORD" ? "Duplicate data in document" : "Error importing data"
            );
            return res.status(400).json(importResult);
        }

        await updateIntegrationSyncStatus(req.body, "SUCCESS", "Success");

        return res.status(200).json({
            code: "",
            error: false,
            message: "",
            success: true,
        });
    } catch (exception) {
        logger.child({ _requestid: req._requestid, ctx: req.body }).error(exception);
        return res.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
};

const getFileDataFromGoogle = async (params) => {
    try {
        const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENTID, GOOGLE_CLIENTSECRET, GOOGLE_REDIRECTURI);
        const credentials = params?.datasource_config?.credentials;
        const fileId = params?.datasource_config?.fileid;
        oauth2Client.setCredentials(credentials);
        const drive = google.drive({ version: "v3", auth: oauth2Client });

        const response = await drive.files.get({ fileId, alt: "media" }, { responseType: "stream" });
        const buffers = [];
        response.data.on("data", (chunk) => {
            buffers.push(chunk);
        });

        await new Promise((resolve, reject) => {
            response.data.on("end", () => {
                resolve();
            });
            response.data.on("error", (err) => {
                reject(err);
            });
        });

        const fileBuffer = Buffer.concat(buffers);
        const workbook = xlsx.read(fileBuffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet);

        return { success: true, data: jsonData };
    } catch (exception) {
        logger.child({ _requestid: params.requestid, ctx: params }).error(exception);
        return { success: false, msg: exception.message };
    }
};

const updateIntegrationSyncStatus = async ({ orgid, corpid, integrationmanagerid } = params, result, message) => {
    await executesimpletransaction("QUERY_INTEGRATIONMANAGER_SYNC_UPDATE", {
        corpid,
        orgid,
        id: integrationmanagerid,
        info: JSON.stringify({
            last_sync: new Date(),
            last_sync_result: result,
            last_sync_message: message,
        }),
    });
};
