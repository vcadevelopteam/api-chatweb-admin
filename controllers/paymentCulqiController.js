const Culqi = require('culqi-node');
const triggerfunctions = require('../config/triggerfunctions');

exports.chargeCulqui = async (request, response) => {
    console.log("here: new method")
    const {corpid, orgid, conversationid, personid,  paymentorderid, userprofile, settings, token, metadata} = request.body;

    const queryString = "UFN_PAYMENTORDER_SEL";
    const queryParameters = {   
        p_corpid: 1,
        p_orgid: 1,
        p_conversationid: 1,
        p_personid: 1,
        p_paymentorderid: 2,
        p_ordercode: ""
    }

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);

    const totalAmount = queryResult[0].totalamount;
    const paymentStatus = queryResult[0].paymentstatus;

    if (paymentStatus === 'PENDING' && ((totalAmount === settings.amount))) {
       console.log("charger_culqui")

       charge = await createCharge(userprofile, settings, token, metadata, appsetting.privatekey);

       if (charge.object === 'error') {
           responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, { code: charge.code, id: charge.charge_id, message: charge.user_message, object: charge.object }, null, responsedata.status, responsedata.success);
           return response.status(responsedata.status).json(responsedata);
       }
       else {
           try {
            const chargedata = await insertCharge(corpid, orgid, invoiceid, null, culqiamount, true, requestCulqiCharge.data.result, requestCulqiCharge.data.result.id, invoice.currency, invoice.description, favoritecard.mail, 'INSERT', null, null, 'SCHEDULER', 'PAID', favoritecard.paymentcardid, null, 'REGISTEREDCARD', responsedata.id);

           } catch (error) {
            
           }
       }
    }
    else{
        console.log("error")
    }


}

const createCharge = async (userProfile, settings, token, metadata, privateKey) => {
    
    const culqiService = new Culqi({
        privateKey: privateKey
    });

    var culqiBody = {
        amount: `${settings.amount}`,
        antifraud_details: {
            address: `${(removeSpecialCharacter(userProfile.address || 'EMPTY')).slice(0, 100)}`,
            address_city: `${(removeSpecialCharacter(userProfile.address_city || 'EMPTY')).slice(0, 30)}`,
            country_code: `${((userProfile.country || token.client.ip_country_code) || 'PE')}`,
            first_name: `${(removeSpecialCharacter(userProfile.firstname || 'EMPTY')).slice(0, 50)}`,
            last_name: `${(removeSpecialCharacter(userProfile.lastname || 'EMPTY')).slice(0, 50)}`,
            phone_number: `${(userProfile.phone ? userProfile.phone.replace(/[^0-9]/g, '') : '51999999999').slice(0, 15)}`,
        },
        currency_code: `${settings.currency}`,
        description: `${(removeSpecialCharacter(settings.description || '').replace(/[^0-9A-Za-z ]/g, '')).slice(0, 80)}`,
        email: `${token.email.slice(0, 50)}`,
        metadata: metadata,
        source_id: `${token.id}`,
    }

    return await culqiService.charges.createCharge(culqiBody);
}

const insertCharge = async (corpId, orgId, invoiceId, id, amount, capture, chargeJson, chargeToken, currency, description, email, operation, orderId, orderJson, paidBy, status, tokenId, tokenJson, type, requestId) => {
    const queryString = "UFN_CHARGE_INS";
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
        invoiceid: invoiceId,
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

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);
    if (queryResult instanceof Array) {
        if (queryResult.length > 0) {
            return queryResult[0];
        }
    }

    return null;
}