const { getErrorCode } = require("../config/helpers");

const https = require("https");

exports.sendRequest = async (request, response) => {
    try {
        const { hostname, method, path, port, authorization, data } = request.body;

        const requestConfiguration = {
            hostname: hostname,
            method: method,
            path: path,
            port: port,
            rejectUnauthorized: false,
            secureProtocol: "TLSv1_method",
            headers: {
                Authorization: authorization || "",
                "Content-Length": JSON.stringify(data || {}).length,
                "Content-Type": "application/json",
                Cookie: "ROUTEID=.node3",
            },
        };

        const requestProcess = https.request(requestConfiguration, (responseData) => {
            let responseBody = "";

            responseData.on("data", (chunk) => {
                responseBody += chunk;
            });

            responseData.on("end", () => {
                return response.status(responseData.statusCode).json(JSON.parse(responseBody));
            });
        });

        requestProcess.on("error", (error) => {
            return response.status(500).json({ error });
        });

        requestProcess.write(JSON.stringify(data || {}));
        requestProcess.end();
    } catch (exception) {
        return response
            .status(500)
            .json(getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid));
    }
};