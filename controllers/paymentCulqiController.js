const Culqi = require('culqi-node');
const triggerfunctions = require('../config/triggerfunctions');
const genericfunctions = require('../config/genericfunctions');

exports.chargeCulqui = async (request, response) => {
    console.log("here: new method",request._requestid)
    console.log(request.body)

    const {corpid, orgid, conversationid, personid,  paymentorderid, settings, token, metadata} = request.body;

    var responsedata = genericfunctions.generateResponseData(request._requestid);

    const queryString = "UFN_PAYMENTORDER_SEL";
    console.log(corpid, orgid, paymentorderid)
    const queryParameters = {   
        corpid: corpid,
        orgid: orgid,
        conversationid: 0,
        personid: 0,
        paymentorderid: paymentorderid,
        ordercode: ''
    }

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);
    const paymentStatus = queryResult[0].paymentstatus;
    const totalAmount = queryResult[0].totalamount;
    console.log("aqui", paymentStatus)
    console.log("query: ",queryResult);
    /*
    conversationid = queryResult[0].conversationid;
    personid = queryResult[0].personid;



*/
    if (paymentStatus === 'PENDING' && totalAmount === settings.amount/100) {
       console.log("charger_culqui")

       const appsetting = await getAppSetting(request._requestid);
        console.log("appsetting",appsetting.privatekey)
        const charge = await createCharge(settings, token, metadata, appsetting.privatekey);

       //console.log(charge.object)

       if (charge.object === 'error') {
        console.log("error culqui")
           //responsedata = genericfunctions.changeResponseData(responsedata, null, { object: charge.object, id: charge.charge_id, code: charge.code, message: charge.user_message }, charge.user_message, 400, false);
           //return response.status(responsedata.status).json(responsedata);
       }
       else {
            console.log("culqui ok")
            try {
                const chargedata = await insertCharge(corpid, orgid, paymentorderid, null,(settings.amount / 100), true, charge, charge.id, settings.currency, settings.description, token.email, 'INSERT', null, null, 'SCHEDULER', 'PAID', token.id, token, charge.object, responsedata.id);
                console.log("insert ok",chargedata)
                //return response.status(200).json('200');
            } catch (error) {
                
                console.log("error insertcharge")
                //return response.status(400).json('400');
            }

       }

    }
    else{
        console.log("error")
    }


}

const createCharge = async (settings, token, metadata, privatekey) => {
    console.log("createCharge")
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
    console.log(culqiBody)
    const result = await culqiService.charges.createCharge(culqiBody);
    console.log("result", result)
    return result
}

const insertCharge = async (corpId, orgId, paymentorderid, id, amount, capture, chargeJson, chargeToken, currency, description, email, operation, orderId, orderJson, paidBy, status, tokenId, tokenJson, type, requestId) => {
    console.log("insertCharge")
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

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);
 
    if (queryResult instanceof Array) {
        if (queryResult.length > 0) {
            return queryResult[0];
        }
    }

    return null;
}

const getAppSetting = async (requestId) => {
    const queryString = "UFN_APPSETTING_INVOICE_SEL";
    const queryParameters = {
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
const removeSpecialCharacter = (text) => {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}