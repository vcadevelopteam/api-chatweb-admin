const Culqi = require('culqi-node');
const triggerfunctions = require('../config/triggerfunctions');
const genericfunctions = require('../config/genericfunctions');

exports.chargeCulqui = async (request, response) => {
    var responsedata = genericfunctions.generateResponseData(request._requestid);

    try {
        const { corpid, orgid, paymentorderid, settings, token, metadata } = request.body;

        var responsedata = genericfunctions.generateResponseData(request._requestid);

        const queryParameters = {
            corpid: corpid,
            orgid: orgid,
            conversationid: 0,
            personid: 0,
            paymentorderid: paymentorderid,
            ordercode: ''
        }

        const queryResult = await triggerfunctions.executesimpletransaction("UFN_PAYMENTORDER_SEL", queryParameters);
        const paymentStatus = queryResult[0].paymentstatus;
        const totalAmount = queryResult[0].totalamount;

        if (paymentStatus === 'PENDING' && totalAmount === settings.amount / 100) {
            const appsetting = await getAppSetting(request._requestid);
            const charge = await createCharge(settings, token, metadata, appsetting.privatekey);
            if (charge.object === 'error') {
                responsedata = genericfunctions.changeResponseData(responsedata, null, { object: charge.object, id: charge.charge_id, code: charge.code, message: charge.user_message }, charge.user_message, 400, false);
                return response.status(responsedata.status).json(responsedata);
            }
            else {
                try {
                    const chargedata = await insertCharge(corpid, orgid, paymentorderid, null, (settings.amount / 100), true, charge, charge.id, settings.currency, settings.description, token.email, 'INSERT', null, null, null, 'PAID', token.id, token, charge.object, responsedata.id);

                    return response.status(200).json('200');
                } catch (error) {
                    return response.status(400).json('400');
                }

            }

        }
        else {
        }
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
}

const createCharge = async (settings, token, metadata, privatekey) => {
    const culqiService = new Culqi({
        privateKey: privatekey
    });

    var culqiBody = {
        amount: `${settings.amount}`,
        currency_code: `${settings.currency}`,
        description: `${(removeSpecialCharacter(settings.description || '').replace(/[^0-9A-Za-z ]/g, '')).slice(0, 80)}`,
        email: `${token.email.slice(0, 50)}`,
        metadata: metadata,
        source_id: `${token.id}`,
    }

    const result = await culqiService.charges.createCharge(culqiBody);

    return result;
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
        invoiceid: paymentorderid,
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

    const queryResult = await triggerfunctions.executesimpletransaction("UFN_CHARGE_INS", queryParameters);

    if (queryResult instanceof Array) {
        if (queryResult.length > 0) {
            return queryResult[0];
        }
    }

    return null;
}

const getAppSetting = async (requestId) => {
    const queryResult = await triggerfunctions.executesimpletransaction("UFN_APPSETTING_INVOICE_SEL", { _requestid: requestId });

    if (queryResult instanceof Array) {
        if (queryResult.length > 0) {
            return queryResult[0];
        }
    }

    return null;
}
const removeSpecialCharacter = (text) => {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}