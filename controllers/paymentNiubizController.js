const triggerfunctions = require('../config/triggerfunctions');
const genericfunctions = require('../config/genericfunctions');

const { getErrorCode } = require('../config/helpers');

const niubizEndpoint = process.env.NIUBIZ_ENDPOINT;
const niubizMerchantId = process.env.NIUBIZ_MERCHANTID;
const niubizPassword = process.env.NIUBIZ_PASSWORD;
const niubizUsername = process.env.NIUBIZ_USERNAME;

exports.createSessionToken = async (request, response) => {
    try {
        var responsedata = genericfunctions.generateResponseData(request._requestid);

        return response.status(responsedata.status).json(responsedata);
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
}

exports.authorizeTransaction = async (request, response) => {
    try {
        var responsedata = genericfunctions.generateResponseData(request._requestid);

        return response.status(responsedata.status).json(responsedata);
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
}