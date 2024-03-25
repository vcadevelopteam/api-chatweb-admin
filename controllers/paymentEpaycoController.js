const triggerfunctions = require('../config/triggerfunctions');
const genericfunctions = require('../config/genericfunctions');

const { axiosObservable, getErrorCode } = require('../config/helpers');
const { createHash } = require('crypto');

const epaycoScript = process.env.EPAYCO_SCRIPT;
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

                    if (authCredentials.publicKey) {
                        paymentorder[0].script = epaycoScript;

                        responsedata = genericfunctions.changeResponseData(responsedata, null, paymentorder[0], 'success', 200, true);
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
        const { x_ref_payco, x_transaction_id, x_amount, x_currency_code, x_signature, x_extra1, x_extra2, x_extra3, x_cod_response } = request.query;

        if (x_extra1 && x_extra2 && x_extra3) {
            const corpid = parseInt(`${x_extra1}`);
            const orgid = parseInt(`${x_extra2}`);
            const paymentorderid = parseInt(`${x_extra3}`);

            const paymentorder = await triggerfunctions.executesimpletransaction("UFN_PAYMENTORDER_SEL", { corpid: corpid, orgid: orgid, conversationid: 0, personid: 0, paymentorderid: paymentorderid, ordercode: '' });

            if (paymentorder) {
                if (paymentorder[0]) {
                    if (paymentorder[0].paymentstatus === 'PENDING' && Number(x_amount) === paymentorder[0].totalamount && x_currency_code === paymentorder[0].currency) {
                        const authCredentials = JSON.parse(paymentorder[0].authcredentials || {});

                        let localhash = createHash('sha256').update(authCredentials.merchantId + '^' + authCredentials.merchantKey + '^' + x_ref_payco + '^' + x_transaction_id + '^' + x_amount + '^' + x_currency_code).digest('hex');

                        if (x_signature === localhash) {
                            switch (x_cod_response) {
                                case '1':
                                    const paymentdetails = {
                                        originalUrl: request.url,
                                    };

                                    const chargedata = await insertCharge(corpid, orgid, paymentorder[0].paymentorderid, null, paymentorder[0].totalamount, true, paymentdetails, x_transaction_id, paymentorder[0].currency, paymentorder[0].description, paymentorder[0].usermail || '', 'INSERT', null, null, 'API', 'PAID', x_signature, null, 'EPAYCO', responsedata.id);

                                    const queryParameters = {
                                        corpid: corpid,
                                        orgid: orgid,
                                        paymentorderid: paymentorder[0].paymentorderid,
                                        paymentby: paymentorder[0].personid,
                                        culqiamount: paymentorder[0].totalamount,
                                        chargeid: chargedata?.chargeid || null,
                                        chargetoken: x_transaction_id || null,
                                        chargejson: paymentdetails || null,
                                        tokenid: x_signature || null,
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
                                                    card_mask: `${paymentdetails?.originalUrl}`,
                                                    id_payment: `${x_transaction_id}`,
                                                    last4numbers: `${paymentdetails?.originalUrl}`.split('&x_quotas=')[0]?.slice(-4),
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
                                    break;

                                case '2':
                                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Refused transaction', responsedata.status, responsedata.success);
                                    break;

                                case '3':
                                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Pending transaction', responsedata.status, responsedata.success);
                                    break;

                                case '4':
                                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Failed transaction', responsedata.status, responsedata.success);
                                    break;

                                default:
                                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, `Generic transaction error (${x_cod_response})`, responsedata.status, responsedata.success);
                                    break;
                            }
                        } else {
                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Incorrect hash', responsedata.status, responsedata.success);
                        }
                    }
                    else {
                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Payment order invalid', responsedata.status, responsedata.success);
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