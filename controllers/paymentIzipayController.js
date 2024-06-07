const triggerfunctions = require('../config/triggerfunctions');
const genericfunctions = require('../config/genericfunctions');

const { axiosObservable, getErrorCode } = require('../config/helpers');

const izipayEndpoint = process.env.IZIPAY_ENDPOINT;
const izipaySandboxEndpoint = process.env.IZIPAY_SANDBOX_ENDPOINT;
const izipaySandboxScript = process.env.IZIPAY_SANDBOX_SCRIPT;
const izipayScript = process.env.IZIPAY_SCRIPT;
const servicesEndpoint = process.env.SERVICES;

exports.getPaymentOrder = async (request, response) => {
    let responsedata = genericfunctions.generateResponseData(request._requestid);

    try {
        const { corpid, orgid, ordercode } = request.body;

        let paymentorder = await triggerfunctions.executesimpletransaction("UFN_PAYMENTORDER_SEL", { corpid: corpid, orgid: orgid, conversationid: 0, personid: 0, paymentorderid: 0, ordercode: ordercode });

        if (paymentorder) {
            if (paymentorder[0]) {
                if (paymentorder[0].authcredentials) {
                    const authCredentials = JSON.parse(paymentorder[0].authcredentials || {});
                    if (authCredentials.merchantId && authCredentials.publicKey) {
                        const currentTimeUnix = Math.floor(Date.now()) * 1000;
                        const transactionId = currentTimeUnix.toString().slice(0, 14);

                        const requestGetToken = await axiosObservable({
                            data: {
                                amount: `${(Math.round((paymentorder[0].totalamount || 0) * 100) / 100).toFixed(2)}`,
                                merchantCode: authCredentials.merchantId,
                                orderNumber: `${paymentorder[0].paymentorderid}`.padStart(5, '0'),
                                publicKey: authCredentials.publicKey,
                                requestSource: 'ECOMMERCE',
                            },
                            headers: {
                                "transactionId": `${transactionId}`
                            },
                            method: 'post',
                            url: `${authCredentials?.sandbox ? izipaySandboxEndpoint : izipayEndpoint}security/v1/token/generate`,
                            _requestid: responsedata.id,
                        });

                        if (requestGetToken.data) {
                            if (requestGetToken.data?.response?.token) {
                                paymentorder[0].sessionscript = authCredentials?.sandbox ? izipaySandboxScript : izipayScript;
                                paymentorder[0].token = requestGetToken.data?.response?.token;
                                paymentorder[0].transactionid = transactionId;

                                responsedata = genericfunctions.changeResponseData(responsedata, null, paymentorder[0], 'success', 200, true);
                            }
                            else {
                                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Token not found', responsedata.status, responsedata.success);
                            }
                        }
                        else {
                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Token not found', responsedata.status, responsedata.success);
                        }
                    }
                    else {
                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Credentials not found', responsedata.status, responsedata.success);
                    }
                }
                else {
                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Credentials not found', responsedata.status, responsedata.success);
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
        if (exception?.response?.data?.message) {
            return response.status(500).json({
                ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
                message: exception?.response?.data?.message,
            });
        }
        else {
            return response.status(500).json({
                ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
                message: exception.message,
            });
        }
    }
}

exports.processTransaction = async (request, response) => {
    let responsedata = genericfunctions.generateResponseData(request._requestid);

    try {
        const { paymentorderdata, paymentdata } = request.body;

        if (paymentorderdata && paymentdata) {
            const corpid = paymentorderdata.corpid;
            const orgid = paymentorderdata.orgid;
            const paymentorderid = paymentorderdata.paymentorderid;

            const paymentorder = await triggerfunctions.executesimpletransaction("UFN_PAYMENTORDER_SEL", { corpid: corpid, orgid: orgid, conversationid: 0, personid: 0, paymentorderid: paymentorderid, ordercode: '' });

            if (paymentorder) {
                if (paymentorder[0]) {
                    if (paymentorder[0].paymentstatus === 'PENDING') {
                        const paymentdetails = JSON.parse(paymentdata);

                        const chargedata = await insertCharge(corpid, orgid, paymentorder[0].paymentorderid, null, paymentorder[0].totalamount, true, paymentdetails, ((paymentdetails.response.uniqueId || paymentdetails.response.order[0]?.uniqueId) || null), paymentorder[0].currency, paymentorder[0].description, paymentorder[0].usermail || '', 'INSERT', null, null, 'API', 'PAID', ((paymentdetails.response.signature || paymentdetails.signature) || null), null, 'IZIPAY', responsedata.id);

                        const queryParameters = {
                            corpid: corpid,
                            orgid: orgid,
                            paymentorderid: paymentorder[0].paymentorderid,
                            paymentby: paymentorder[0].personid,
                            culqiamount: paymentorder[0].totalamount,
                            chargeid: chargedata?.chargeid || null,
                            chargetoken: ((paymentdetails.response.uniqueId || paymentdetails.response.order[0]?.uniqueId) || null),
                            chargejson: paymentdetails || null,
                            tokenid: ((paymentdetails.response.signature || paymentdetails.signature) || null),
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
                                    variables: {
                                        card_mask: `${paymentdetails?.response?.card?.pan}`,
                                        id_payment: `${paymentdetails.response.uniqueId || paymentdetails.response.order[0]?.uniqueId}`,
                                        last4numbers: `${paymentdetails?.response?.card?.pan}`.split('&x_quotas=')[0]?.slice(-4),
                                        syspaymentnotification: "1",
                                    }
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
            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Payment not found', responsedata.status, responsedata.success);
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