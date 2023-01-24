const triggerfunctions = require('../config/triggerfunctions');
const genericfunctions = require('../config/genericfunctions');

const { axiosObservable, getErrorCode } = require('../config/helpers');

const niubizEndpoint = process.env.NIUBIZ_ENDPOINT;
const niubizMerchantId = process.env.NIUBIZ_MERCHANTID;
const niubizPassword = process.env.NIUBIZ_PASSWORD;
const niubizUsername = process.env.NIUBIZ_USERNAME;

exports.createSessionToken = async (request, response) => {
    var responsedata = genericfunctions.generateResponseData(request._requestid);

    try {
        const { corpid, orgid, ordercode } = request.body;

        const paymentorder = await triggerfunctions.executesimpletransaction("UFN_PAYMENTORDER_SEL", { corpid: corpid, orgid: orgid, conversationid: 0, personid: 0, paymentorderid: 0, ordercode: ordercode });

        if (paymentorder) {
            if (paymentorder[0]) {
                if (paymentorder[0].paymentstatus === 'PENDING' && paymentorder[0].expired === false) {
                    const buff = Buffer.from(`${niubizUsername}:${niubizPassword}`, 'utf-8');

                    const requestAccessToken = await axiosObservable({
                        headers: { Authorization: `Basic ${buff.toString('base64')}` },
                        method: 'get',
                        url: `${niubizEndpoint}security/v1/security`,
                        _requestid: request._requestid,
                    });

                    if (requestAccessToken.data) {
                        var accessToken = requestAccessToken.data;

                        const requestSessionToken = await axiosObservable({
                            data: {
                                channel: "web",
                                amount: paymentorder[0].totalamount,
                                antifraud: {
                                    merchantDefineData: {
                                        MDD4: paymentorder[0].usermail,
                                        MDD21: 0,
                                        MDD32: paymentorder[0].ordercode,
                                        MDD75: "Invitado",
                                        MDD77: 1,
                                    }
                                }
                            },
                            headers: { Authorization: accessToken },
                            method: 'post',
                            url: `${niubizEndpoint}ecommerce/v2/ecommerce/token/session/${niubizMerchantId}`,
                            _requestid: request._requestid,
                        });

                        if (requestSessionToken.data) {
                            responsedata = genericfunctions.changeResponseData(responsedata, null, { ...paymentorder[0], ...{ sessiontoken: requestSessionToken.data.sessionKey, merchantid: niubizMerchantId } }, 'success', 200, true);
                        }
                        else {
                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, requestSessionToken.data, 'Error creating session token', responsedata.status, responsedata.success);
                        }
                    }
                    else {
                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, requestAccessToken.data, 'Error creating access token', responsedata.status, responsedata.success);
                    }
                }
                else {
                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Payment order expired', responsedata.status, responsedata.success);
                }
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

exports.authorizeTransaction = async (request, response) => {
    var responsedata = genericfunctions.generateResponseData(request._requestid);

    try {
        const { transactionToken, customerEmail } = request.body;
        const { corpid, orgid, ordercode, totalamount } = request.query;

        if (transactionToken) {
            const paymentorder = await triggerfunctions.executesimpletransaction("UFN_PAYMENTORDER_SEL", { corpid: corpid, orgid: orgid, conversationid: 0, personid: 0, paymentorderid: 0, ordercode: ordercode });

            if (paymentorder) {
                if (paymentorder[0]) {
                    if (paymentorder[0].paymentstatus === 'PENDING' && paymentorder[0].expired === false && paymentorder[0].totalamount === parseFloat(totalamount || 0)) {
                        const buff = Buffer.from(`${niubizUsername}:${niubizPassword}`, 'utf-8');

                        const requestAccessToken = await axiosObservable({
                            headers: { Authorization: `Basic ${buff.toString('base64')}` },
                            method: 'get',
                            url: `${niubizEndpoint}security/v1/security`,
                            _requestid: request._requestid,
                        });

                        if (requestAccessToken.data) {
                            var accessToken = requestAccessToken.data;

                            const requestAuthorizeTransaction = await axiosObservable({
                                data: {
                                    channel: "web",
                                    captureType: "manual",
                                    order: {
                                        tokenId: transactionToken,
                                        purchaseNumber: paymentorder[0].paymentorderid,
                                        amount: paymentorder[0].totalamount,
                                        currency: 'PEN',
                                    }
                                },
                                headers: { Authorization: accessToken },
                                method: 'post',
                                url: `${niubizEndpoint}authorization/v3/authorization/ecommerce/${niubizMerchantId}`,
                                _requestid: request._requestid,
                            });

                            if (requestAuthorizeTransaction.data) {
                                const chargedata = await insertCharge(corpid, orgid, paymentorder[0].paymentorderid, null, totalamount, true, requestAuthorizeTransaction.data, requestAuthorizeTransaction.data.header?.ecoreTransactionUUID, paymentorder[0].currency, paymentorder[0].description, customerEmail, 'INSERT', null, null, 'API', 'PAID', accessToken, null, 'NIUBIZ', responsedata.id);

                                const queryParameters = {
                                    corpid: corpid,
                                    orgid: orgid,
                                    paymentorderid: paymentorder[0].paymentorderid,
                                    paymentby: customerEmail || paymentorder[0].personid,
                                    culqiamount: totalamount,
                                    chargeid: chargedata?.chargeid || null,
                                    chargetoken: requestAuthorizeTransaction.data.header?.ecoreTransactionUUID || null,
                                    chargejson: requestAuthorizeTransaction.data || null,
                                    tokenid: accessToken,
                                    tokenjson: null,
                                };

                                const paymentResult = await triggerfunctions.executesimpletransaction("UFN_PAYMENTORDER_PAYMENT", queryParameters);

                                if (paymentResult instanceof Array) {
                                    responsedata = genericfunctions.changeResponseData(responsedata, null, { message: 'success' }, 'success', 200, true);
                                }
                                else {
                                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Insert failure', responsedata.status, responsedata.success);
                                }
                            }
                            else {
                                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, requestAuthorizeTransaction.data, 'Error authorizing transaction', responsedata.status, responsedata.success);
                            }
                        }
                        else {
                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, requestAccessToken.data, 'Error creating access token', responsedata.status, responsedata.success);
                        }
                    }
                    else {
                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Payment order expired', responsedata.status, responsedata.success);
                    }
                }
                else {
                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Payment order not found', responsedata.status, responsedata.success);
                }
            }
            else {
                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Payment order not found', responsedata.status, responsedata.success);
            }
        }
        else {
            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Transaction token not found', responsedata.status, responsedata.success);
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