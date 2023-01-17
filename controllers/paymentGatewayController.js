const Culqi = require('culqi-node');

const triggerfunctions = require('../config/triggerfunctions');
const genericfunctions = require('../config/genericfunctions');

const { getErrorCode } = require('../config/helpers');

const createCharge = async (user,amount, tokenculqi, email) => {
    try {

        const culqi = new Culqi({
            privateKey: 'sk_test_d901e8f07d45a485'
        });

        const culqiBody = {
            amount: amount,
            currency_code: 'PEN',
            email: email,
            source_id: tokenculqi,
            capture: true,
        };

        console.log(culqiBody);
        return await culqi.charges.createCharge(culqiBody);

    } catch (error) {
        console.log(error)
    }

}

exports.chargeCulqui = async (request, response) => {
    var responsedata = genericfunctions.generateResponseData(request._requestid);

    try {
        const { corpid, orgid, conversationid, paymentid, tokenculqi,amount, email } = request.body;

        const queryResult = await triggerfunctions.executesimpletransaction("UFN_PAYMENT_SEL", { corpid: corpid, orgid: orgid, conversationid: conversationid, paymentid: paymentid });
        const paymentorder = queryResult[0];

        if (paymentorder) {
            if (paymentorder.status === 'PENDIENTE' && paymentorder.amount === (amount / 100)) {
                const charge = await createCharge({ address: paymentorder.address, address_city: paymentorder.city, firstname: paymentorder.firstname, lastname: paymentorder.lastname, phone: paymentorder.phone }, amount , tokenculqi, email);

                if (charge.object === 'error') {
                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, { code: charge.code, id: charge.charge_id, message: charge.user_message, object: charge.object }, null, responsedata.status, responsedata.success);
                }
                else {
                  
                    const ResultUpdateCharge = await updateCharge(corpid, orgid, paymentid, tokenculqi, paymentorder, charge, 'admin');
                    console.log(ResultUpdateCharge)
                    if (ResultUpdateCharge) {
                        responsedata = genericfunctions.changeResponseData(responsedata, null, { message: 'success' }, 'success', 200, true);
                    }
                    else {
                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Charge failure', responsedata.status, responsedata.success);
                    }

                }
            }
            else {
                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Amount does not match or status does not pending', responsedata.status, responsedata.success);
            }
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

exports.getPaymentOrder = async (request, response) => {
    try {
        var responsedata = genericfunctions.generateResponseData(request._requestid);

        const { corpid, orgid, conversationid, paymentid } = request.params;

        const queryResult = await triggerfunctions.executesimpletransaction("UFN_PAYMENT_SEL", { corpid: corpid, orgid: orgid, conversationid: conversationid, paymentid: paymentid });
        const paymentorder = queryResult[0];

        if (paymentorder) {
            responsedata = genericfunctions.changeResponseData(responsedata, null, paymentorder, 'success', 200, true);
        }
        else {
            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Payment order not found', responsedata.status, responsedata.success);
        }
        return response.status(responsedata.status).json(responsedata);

    } catch (exception) {
        return response.status(500).json(getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid));
    }
}


const updateCharge = async (corpid, orgid, paymentid, tokenid, tokenjson, chargejson, username) => {
    const queryParameters = {
        corpid: corpid,
        orgid: orgid,
        paymentid: paymentid,
        tokenid: tokenid,
        tokenjson: tokenjson,
        chargejson: chargejson,
        username: username
    }

    const queryResult = await triggerfunctions.executesimpletransaction("UFN_PAYMENT_CHARGE", queryParameters);

    if (queryResult instanceof Array) {
        if (queryResult.length > 0) {
            return queryResult[0];
        }
    }

    return null;
}