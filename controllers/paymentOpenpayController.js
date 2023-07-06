const triggerfunctions = require('../config/triggerfunctions');
const genericfunctions = require('../config/genericfunctions');

const { axiosObservable, getErrorCode } = require('../config/helpers');

const laraigoEndpoint = process.env.LARAIGO;
const servicesEndpoint = process.env.SERVICES;
const niubizEndpoint = process.env.NIUBIZ_ENDPOINT;
const niubizMerchantId = process.env.NIUBIZ_MERCHANTID;
const niubizPassword = process.env.NIUBIZ_PASSWORD;
const niubizUsername = process.env.NIUBIZ_USERNAME;

exports.getPaymentOrder = async (request, response) => {
    let responsedata = genericfunctions.generateResponseData(request._requestid);

    try {
        const { corpid, orgid, ordercode } = request.body;

        const paymentorder = await triggerfunctions.executesimpletransaction("UFN_PAYMENTORDER_SEL", { corpid: corpid, orgid: orgid, conversationid: 0, personid: 0, paymentorderid: 0, ordercode: ordercode });

        if (paymentorder) {
            if (paymentorder[0]) {
                responsedata = genericfunctions.changeResponseData(responsedata, null, paymentorder[0], 'success', 200, true);
            }
            else {
                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Payment order not found', responsedata.status, responsedata.success);
            }
        }
        else {
            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Payment order not found', responsedata.status, responsedata.success);
        }

        return response.status(responsedata.status).json(responsedata);
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
}

exports.processTransaction = async (request, response) => {
    let responsedata = genericfunctions.generateResponseData(request._requestid);

    try {
        return response.status(responsedata.status).json(responsedata);
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
}

const insertCharge = async (corpId, orgId, paymentorderid, id, amount, capture, chargeJson, chargeToken, currency, description, email, operation, orderId, orderJson, paidBy, status, tokenId, tokenJson, type, requestId) => {
    const queryParameters = {
        amount: amount,
        capture: capture,
        chargejson: chargeJson,
        chargetoken: chargeToken,
        corpid: corpId,
        currency: currency,
        description: description,
        email: email,
        id: id,
        paymentorderid: paymentorderid,
        operation: operation,
        orderid: orderId,
        orderjson: orderJson,
        orgid: orgId,
        paidby: paidBy,
        status: status,
        tokenid: tokenId,
        tokenjson: tokenJson,
        type: type,
        _requestid: requestId,
    }

    const queryResult = await triggerfunctions.executesimpletransaction("UFN_CHARGE_PAYMENTORDER_INS", queryParameters);

    if (queryResult instanceof Array) {
        if (queryResult.length > 0) {
            return queryResult[0];
        }
    }

    return null;
}

const paymentOrderError = async (corpId, orgId, paymentorderid, paymentby, lastprovider, laststatus, lastdata, requestId) => {
    const queryParameters = {
        corpid: corpId,
        orgid: orgId,
        paymentorderid: paymentorderid,
        paymentby: paymentby,
        lastprovider: lastprovider,
        laststatus: laststatus,
        lastdata: lastdata,
        _requestid: requestId,
    };

    const queryResult = await triggerfunctions.executesimpletransaction("UFN_PAYMENTORDER_ERROR", queryParameters);

    if (queryResult instanceof Array) {
        if (queryResult.length > 0) {
            return queryResult[0];
        }
    }

    return null;
}