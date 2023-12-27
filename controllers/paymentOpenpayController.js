const triggerfunctions = require('../config/triggerfunctions');
const genericfunctions = require('../config/genericfunctions');

const { axiosObservable, getErrorCode } = require('../config/helpers');

const openpayColombiaEndpoint = process.env.OPENPAYCOLOMBIA_ENDPOINT;
const openpayColombiaSandboxEndpoint = process.env.OPENPAYCOLOMBIA_SANDBOX_ENDPOINT;
const openpayEndpoint = process.env.OPENPAY_ENDPOINT;
const openpaySandboxEndpoint = process.env.OPENPAY_SANDBOX_ENDPOINT;
const servicesEndpoint = process.env.SERVICES;

exports.getPaymentOrder = async (request, response) => {
    let responsedata = genericfunctions.generateResponseData(request._requestid);

    try {
        const { corpid, orgid, ordercode } = request.body;

        const paymentorder = await triggerfunctions.executesimpletransaction("UFN_PAYMENTORDER_SEL", { corpid: corpid, orgid: orgid, conversationid: 0, personid: 0, paymentorderid: 0, ordercode: ordercode });

        if (paymentorder) {
            if (paymentorder[0]) {
                if (paymentorder[0].authcredentials) {
                    let authCredentials = JSON.parse(paymentorder[0].authcredentials || {});
                    authCredentials.privateKey = '';
                    paymentorder[0].authcredentials = JSON.stringify(authCredentials);
                }

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
        const { corpid, orgid, paymentorderid, devicesessionid, transactionresponse, formdata, colombia } = request.body;

        if (devicesessionid || colombia) {
            if (transactionresponse) {
                const paymentorder = await triggerfunctions.executesimpletransaction("UFN_PAYMENTORDER_SEL", { corpid: corpid, orgid: orgid, conversationid: 0, personid: 0, paymentorderid: paymentorderid, ordercode: '' });

                if (paymentorder) {
                    if (paymentorder[0]) {
                        if (paymentorder[0].paymentstatus === 'PENDING') {
                            try {
                                const authCredentials = JSON.parse(paymentorder[0].authcredentials || {});

                                const buff = Buffer.from(`${authCredentials?.privateKey}:`, 'utf-8');

                                let openpayFinalEndpoint;

                                if (colombia) {
                                    if (authCredentials?.sandbox) {
                                        openpayFinalEndpoint = openpayColombiaSandboxEndpoint;
                                    }
                                    else {
                                        openpayFinalEndpoint = openpayColombiaEndpoint;
                                    }
                                }
                                else {
                                    if (authCredentials?.sandbox) {
                                        openpayFinalEndpoint = openpaySandboxEndpoint;
                                    }
                                    else {
                                        openpayFinalEndpoint = openpayEndpoint;
                                    }
                                }

                                const requestProcessTransaction = await axiosObservable({
                                    data: {
                                        source_id: transactionresponse.data.id,
                                        method: "card",
                                        amount: paymentorder[0].totalamount,
                                        currency: paymentorder[0].currency,
                                        description: 'OPENPAY CHARGE',
                                        order_id: paymentorder[0].paymentorderid,
                                        device_session_id: colombia ? undefined : devicesessionid,
                                        customer: {
                                            name: formdata.holder_name || '',
                                            lastname: `(${paymentorder[0].userfirstname} ${paymentorder[0].userlastname})`,
                                            phone_number: paymentorder[0].userphone || '51999999999',
                                            email: paymentorder[0].usermail || 'mail@mail.com',
                                        }
                                    },
                                    headers: { Authorization: `Basic ${buff.toString('base64')}` },
                                    method: 'post',
                                    url: `${openpayFinalEndpoint}v1/${authCredentials?.merchantId}/charges`,
                                    _requestid: request._requestid,
                                });

                                if (requestProcessTransaction.data) {
                                    const chargedata = await insertCharge(corpid, orgid, paymentorder[0].paymentorderid, null, paymentorder[0].totalamount, true, requestProcessTransaction.data, requestProcessTransaction.data.id, paymentorder[0].currency, paymentorder[0].description, paymentorder[0].usermail || '', 'INSERT', null, null, 'API', 'PAID', authCredentials?.privateKey, null, 'OPENPAY', responsedata.id);

                                    const queryParameters = {
                                        corpid: corpid,
                                        orgid: orgid,
                                        paymentorderid: paymentorder[0].paymentorderid,
                                        paymentby: paymentorder[0].personid,
                                        culqiamount: paymentorder[0].totalamount,
                                        chargeid: chargedata?.chargeid || null,
                                        chargetoken: requestProcessTransaction.data.id || null,
                                        chargejson: requestProcessTransaction.data || null,
                                        tokenid: authCredentials?.privateKey,
                                        tokenjson: null,
                                    };

                                    const paymentResult = await triggerfunctions.executesimpletransaction("UFN_PAYMENTORDER_PAYMENT", queryParameters);

                                    if (paymentResult instanceof Array) {
                                        const requestContinueFlow = await axiosObservable({
                                            data: {
                                                conversationid: paymentorder[0].conversationid,
                                                corpid: corpid,
                                                orgid: orgid,
                                                personid: paymentorder[0].personid,
                                            },
                                            method: 'post',
                                            url: `${servicesEndpoint}handler/continueflow`,
                                            _requestid: responsedata.id,
                                        });

                                        if (requestContinueFlow.data) {
                                            responsedata = genericfunctions.changeResponseData(responsedata, null, requestContinueFlow.data, 'success', 200, true);
                                        }
                                        else {
                                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Flow failure', responsedata.status, responsedata.success);
                                        }
                                    }
                                    else {
                                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Insert failure', responsedata.status, responsedata.success);
                                    }
                                }
                                else {
                                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, requestProcessTransaction.data, 'Error processing transaction', responsedata.status, responsedata.success);
                                }
                            }
                            catch (error) {
                                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, error?.response?.data?.description || error?.message, responsedata.status, responsedata.success);
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
                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Transaction response not found', responsedata.status, responsedata.success);
            }
        }
        else {
            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Device session not found', responsedata.status, responsedata.success);
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