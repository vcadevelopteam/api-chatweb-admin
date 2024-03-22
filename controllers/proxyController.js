const { getErrorCode } = require("../config/helpers");

const https = require("https");

exports.sendRequest = async (request, response) => {
    try {
        const { hostname, method, path, port, authorization, data } = request.body;

        const requestConfiguration = {
            hostname: hostname,
            method: method,
            path: encodeURI(path),
            port: port,
            rejectUnauthorized: false,
            secureProtocol: "TLSv1_method",
            headers: {
                Authorization: authorization || "",
                "Content-Type": "application/json",
                Cookie: authorization ? `B1SESSION=${authorization}` : "ROUTEID=.node3",
            },
        };

        const requestProcess = https.request(requestConfiguration, (responseData) => {
            let responseBody = "";

            responseData.on("data", (chunk) => {
                responseBody += chunk;
            });

            responseData.on("end", () => {
                if (checkJson(responseBody)) {
                    return response.status(responseData.statusCode).json(JSON.parse(responseBody));
                } else {
                    return response.status(responseData.statusCode).json({ responseBody });
                }
            });
        });

        requestProcess.on("error", (error) => {
            return response.status(500).json({ error });
        });

        if (data) {
            requestProcess.write(JSON.stringify(data || {}));
        }

        requestProcess.end();
    } catch (exception) {
        return response
            .status(500)
            .json(getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid));
    }
};

function checkJson(stringData) {
    try {
        JSON.parse(stringData);
    } catch (exception) {
        return false;
    }

    return true;
}