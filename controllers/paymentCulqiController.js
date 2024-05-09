const Culqi = require('culqi-node');

const triggerfunctions = require('../config/triggerfunctions');
const genericfunctions = require('../config/genericfunctions');

const { getErrorCode, axiosObservable } = require('../config/helpers');

const servicesEndpoint = process.env.SERVICES;

exports.newPayment = async (request, response) => {
    let responsedata = genericfunctions.generateResponseData(request._requestid);

    try {
        const { corpid, orgid, paymentorderid, settings, token, metadata } = request.body;

        const queryResult = await triggerfunctions.executesimpletransaction("UFN_PAYMENTORDER_SEL", { corpid: corpid, orgid: orgid, conversationid: 0, personid: 0, paymentorderid: paymentorderid, ordercode: '' });

        const paymentorder = queryResult[0];

        if (paymentorder) {
            if (paymentorder.paymentstatus === 'PENDING' && paymentorder.totalamount === (settings.amount / 100)) {
                const authcredentials = JSON.parse(paymentorder.authcredentials || {});

                if (authcredentials) {
                    if (authcredentials.privateKey) {
                        const charge = await createCharge({ address: paymentorder.useraddress, address_city: paymentorder.usercity, firstname: paymentorder.userfirstname, lastname: paymentorder.userlastname, phone: paymentorder.userphone }, settings, token, metadata, authcredentials.privateKey);

                        if (charge.object === 'error') {
                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, { code: charge.code, id: charge.charge_id, message: charge.user_message, object: charge.object }, null, responsedata.status, responsedata.success);
                        }
                        else {
                            const chargedata = await insertCharge(corpid, orgid, paymentorderid, null, (settings.amount / 100), true, charge, charge.id, settings.currency, settings.description, token.email, 'INSERT', null, null, 'API', 'PAID', token.id, token, charge.object, responsedata.id);

                            const queryParameters = {
                                corpid: corpid,
                                orgid: orgid,
                                paymentorderid: paymentorderid,
                                paymentby: token?.email || paymentorder.personid,
                                culqiamount: (settings.amount / 100),
                                chargeid: chargedata?.chargeid || null,
                                chargetoken: charge?.id || null,
                                chargejson: charge || null,
                                tokenid: token?.id || null,
                                tokenjson: token || null,
                            };

                            const paymentResult = await triggerfunctions.executesimpletransaction("UFN_PAYMENTORDER_PAYMENT", queryParameters);

                            if (paymentResult instanceof Array) {
                                const requestContinueFlow = await axiosObservable({
                                    data: {
                                        conversationid: paymentorder.conversationid,
                                        corpid: paymentorder.corpid,
                                        orgid: paymentorder.orgid,
                                        personid: paymentorder.personid,
                                        variables: {
                                            card_mask: `${charge?.source?.card_number}`,
                                            id_payment: `${charge?.id}`,
                                            last4numbers: `${charge?.source?.card_number}`.slice(-4),
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
                    }
                    else {
                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Amount does not match', responsedata.status, responsedata.success);
                    }
                }
                else {
                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Culqi data not found', responsedata.status, responsedata.success);
                }
            }
            else {
                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Culqi data not found', responsedata.status, responsedata.success);
            }
        }
        else {
            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Payment order not found', responsedata.status, responsedata.success);
        }

        return response.status(responsedata.status).json(responsedata);
    }
    catch (exception) {
        if (exception.charge_id) {
            return response.status(500).json({
                ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
                message: exception.merchant_message,
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

const createCharge = async (userprofile, settings, token, metadata, privatekey) => {
    const culqiService = new Culqi({
        privateKey: privatekey
    });

    var culqiBody = {
        amount: `${settings.amount}`,
        antifraud_details: {
            address: userprofile.address ? (removeSpecialCharacter(userprofile.address)).slice(0, 100) : null,
            address_city: userprofile.address_city ? (removeSpecialCharacter(userprofile.address_city)).slice(0, 30) : null,
            country_code: token?.client?.ip_country_code ? token.client.ip_country_code : 'PE',
            first_name: userprofile.firstname ? (removeSpecialCharacter(userprofile.firstname.replace(/[0-9]/g, ''))).slice(0, 50) : null,
            last_name: userprofile.lastname ? (removeSpecialCharacter(userprofile.lastname.replace(/[0-9]/g, ''))).slice(0, 50) : null,
            phone_number: userprofile.phone ? (userprofile.phone.replace(/[^0-9]/g, '')).slice(0, 15) : null,
        },
        currency_code: `${settings.currency}`,
        description: `${(removeSpecialCharacter(settings.description || 'EMPTY').replace(/[^0-9A-Za-z ]/g, '')).slice(0, 80)}`,
        email: `${token.email.slice(0, 50)}`,
        metadata: metadata,
        source_id: `${token.id}`,
    }

    return await culqiService.charges.createCharge(culqiBody);
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

const removeSpecialCharacter = (text) => {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
}