const axios = require('axios');
const triggerfunctions = require('../config/triggerfunctions');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const { getErrorSeq } = require('../config/helpers');
const Culqi = require('culqi-node');

const exchangeEndpoint = process.env.EXCHANGE;

const bridgeEndpoint = process.env.BRIDGE;

const zeroPad = (num, places) => String(num).padStart(places, '0')

const removeAccent = (text) => {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const getUserProfile = async (userid) => {
    const query = "SELECT firstname, lastname, email, phone, country FROM usr WHERE userid = $userid";

    const result = await sequelize.query(query, { type: QueryTypes.SELECT, bind: { userid }}).catch(err => getErrorSeq(err));

    if (result instanceof Array) {
        if (result.length > 0) {
            return result[0]
        }
    }

    return null
}

const getInvoice = async (corpid, orgid, userid, id) => {
    const query = "UFN_INVOICE_SELBYID";
    const bind = {
        corpid: corpid,
        orgid: orgid,
        userid: userid,
        invoiceid: id
    }

    const result = await triggerfunctions.executesimpletransaction(query, bind);

    if (result instanceof Array) {
        if (result.length > 0) {
            return result[0]
        }
    }

    return null
}

const getInvoiceDetail = async (corpid, orgid, userid, id) => {
    const query = "UFN_INVOICEDETAIL_SELBYINVOICEID";
    const bind = {
        corpid: corpid,
        orgid: orgid,
        userid: userid,
        invoiceid: id
    }

    const result = await triggerfunctions.executesimpletransaction(query, bind);

    if (result instanceof Array) {
        if (result.length > 0) {
            return result
        }
    }

    return null
}

const getCorrelativeNumber = async (corpid, orgid, id, correlativetype) => {
    var query = null;
    const bind = {
        corpid: corpid,
        orgid: orgid,
        invoiceid: id
    }

    switch (correlativetype) {
        case 'INVOICE':
            query = 'UFN_INVOICE_CORRELATIVE';
            break;
        case 'INVOICEERROR':
            query = 'UFN_INVOICE_CORRELATIVEERROR';
            break;
        case 'TICKET':
            query = 'UFN_INVOICE_TICKETCORRELATIVE';
            break;
        case 'TICKETERROR':
            query = 'UFN_INVOICE_TICKETCORRELATIVEERROR';
            break;
        case 'CREDITINVOICE':
            query = 'UFN_INVOICECREDIT_CORRELATIVE';
            break;
        case 'CREDITINVOICEERROR':
            query = 'UFN_INVOICECREDIT_CORRELATIVEERROR';
            break;
        case 'CREDITTICKET':
            query = 'UFN_INVOICECREDIT_TICKETCREDITCORRELATIVE';
            break;
        case 'CREDITTICKETERROR':
            query = 'UFN_INVOICECREDIT_TICKETCREDITCORRELATIVEERROR';
            break;
    }

    const result = await triggerfunctions.executesimpletransaction(query, bind);

    if (result instanceof Array) {
        if (result.length > 0) {
            return result[0]
        }
    }

    return null
}

const getCorporation = async (corpid) => {
    const query = "UFN_CORP_SEL";
    const bind = {
        corpid: corpid,
        orgid: 0,
        id: corpid,
        username: 'admin',
        all: false
    }

    const result = await triggerfunctions.executesimpletransaction(query, bind);

    if (result instanceof Array) {
        if (result.length > 0) {
            return result[0]
        }
    }

    return null
}

const getOrganization = async (corpid, orgid) => {
    if (orgid) {
        const query = "UFN_ORG_SEL";
        const bind = {
            corpid: corpid,
            orgid: orgid,
            id: orgid,
            username: 'admin',
            all: false
        }

        const result = await triggerfunctions.executesimpletransaction(query, bind);

        if (result instanceof Array) {
            if (result.length > 0) {
                return result[0]
            }
        }
    }

    return null
}

const getAppSetting = async () => {
    const query = "UFN_APPSETTING_INVOICE_SEL";

    const result = await triggerfunctions.executesimpletransaction(query);

    if (result instanceof Array) {
        if (result.length > 0) {
            return result[0]
        }
    }

    return null
}

const getLastExchange = async () => {
    var currentDate = new Date();

    var exchangeRate = 0;
    var maximumretry = 0;

    while (exchangeRate === 0 && maximumretry <= 10) {
        try {
            const requestExchange = await axios({
                method: 'get',
                url: `${exchangeEndpoint}${currentDate.toISOString().split('T')[0]}`
            });
    
            if (requestExchange.data.venta) {
                exchangeRate = requestExchange.data.venta;
            }
            else {
                currentDate = new Date(currentDate.setDate(currentDate.getDate()-1));
            }
        }
        catch {
            currentDate = new Date(currentDate.setDate(currentDate.getDate()-1));
        }
        
        maximumretry++;
    }

    return exchangeRate;
}

const invoiceSunat = async (corpid, orgid, invoiceid, status, error, qrcode, hashcode, urlcdr, urlpdf, urlxml, serie, issuerruc, issuerbusinessname, issuertradename, issuerfiscaladdress, issuerubigeo, emittertype, annexcode, printingformat, sendtosunat, returnpdf, returnxmlsunat, returnxml, token, sunaturl, sunatusername, xmlversion, ublversion, receiverdoctype, receiverdocnum, receiverbusinessname, receiverfiscaladdress, receivercountry, receivermail, invoicetype, sunatopecode, expirationdate, purchaseorder, comments, credittype, detractioncode, detraction, detractionaccount) => {
    const query = "UFN_INVOICE_SUNAT";
    const bind = {
        corpid: corpid,
        orgid: orgid,
        invoiceid: invoiceid,
        status: status,
        error: error,
        qrcode: qrcode,
        hashcode: hashcode,
        urlcdr: urlcdr,
        urlpdf: urlpdf,
        urlxml: urlxml,
        serie: serie,
        issuerruc: issuerruc,
        issuerbusinessname: issuerbusinessname,
        issuertradename: issuertradename,
        issuerfiscaladdress: issuerfiscaladdress,
        issuerubigeo: issuerubigeo,
        emittertype: emittertype,
        annexcode: annexcode,
        printingformat: printingformat,
        sendtosunat: sendtosunat,
        returnpdf: returnpdf,
        returnxmlsunat: returnxmlsunat,
        returnxml: returnxml,
        token: token,
        sunaturl: sunaturl,
        sunatusername: sunatusername,
        xmlversion: xmlversion,
        ublversion: ublversion,
        receiverdoctype: receiverdoctype,
        receiverdocnum: receiverdocnum,
        receiverbusinessname: receiverbusinessname,
        receiverfiscaladdress: receiverfiscaladdress,
        receivercountry: receivercountry,
        receivermail: receivermail,
        invoicetype: invoicetype,
        sunatopecode: sunatopecode,
        expirationdate: expirationdate,
        purchaseorder: purchaseorder,
        comments: comments,
        credittype: credittype,
        detractioncode: detractioncode,
        detraction: detraction,
        detractionaccount: detractionaccount
    }
    
    const result = await triggerfunctions.executesimpletransaction(query, bind);

    if (result instanceof Array) {
        if (result.length > 0) {
            return result[0]
        }
    }

    return null
}

const createCharge = async (userprofile, settings, token, metadata, privatekey) => {
    const culqi = new Culqi({
        privateKey: privatekey
    });

    var culqiBody = {
        amount: settings.amount,
        currency_code: settings.currency,
        email: token.email.slice(0, 50),
        source_id: token.id,
        description: (removeAccent('PAYMENT: ' + (settings.description || ''))).slice(0, 80),
        metadata: metadata,
        antifraud_details: {
            address: (removeAccent(userprofile.address || 'EMPTY')).slice(0, 100),
            address_city: (removeAccent(userprofile.address_city || 'EMPTY')).slice(0, 30),
            country_code: ((userprofile.country || token.client.ip_country_code) || 'PE'),
            first_name: (removeAccent(userprofile.firstname || 'EMPTY')).slice(0, 50),
            last_name: (removeAccent(userprofile.lastname || 'EMPTY')).slice(0, 50),
            phone_number: (userprofile.phone ? userprofile.phone.replace(/[^0-9]/g, '') : '51999999999').slice(0, 15),
        },
    }
    
    return await culqi.charges.createCharge(culqiBody);
}

const getCharge = async (corpid, orgid, userid, id) => {
    const query = "UFN_CHARGE_SEL";
    const bind = {
        corpid: corpid,
        orgid: orgid,
        userid: userid,
        invoiceid: id
    }

    const result = await triggerfunctions.executesimpletransaction(query, bind);

    if (result instanceof Array) {
        if (result.length > 0) {
            return result[0]
        }
    }

    return null
}

const createInvoice = async (corpid, orgid, invoiceid, description, status, type, issuerruc, issuerbusinessname, issuertradename, issuerfiscaladdress, issuerubigeo, emittertype, annexcode, printingformat, xmlversion, ublversion, receiverdoctype, receiverdocnum, receiverbusinessname, receiverfiscaladdress, receivercountry, receivermail, invoicetype, sunatopecode, serie, correlative, concept, invoicedate, expirationdate, subtotal, taxes, totalamount, currency, exchangerate, invoicestatus, filenumber, purchaseorder, executingunitcode, selectionprocessnumber, contractnumber, comments, credittype, creditnotetype, creditnotemotive, creditnotediscount, invoicereferencefile, invoicepaymentnote, username, referenceinvoiceid, netamount, paymentstatus, hasreport) => {
    const query = "UFN_INVOICE_INS";
    const bind = {
        corpid: corpid,
        orgid: orgid,
        invoiceid: invoiceid,
        description: description,
        status: status,
        type: type,
        issuerruc: issuerruc,
        issuerbusinessname: issuerbusinessname,
        issuertradename: issuertradename,
        issuerfiscaladdress: issuerfiscaladdress,
        issuerubigeo: issuerubigeo,
        emittertype: emittertype,
        annexcode: annexcode,
        printingformat: printingformat,
        xmlversion: xmlversion,
        ublversion: ublversion,
        receiverdoctype: receiverdoctype,
        receiverdocnum: receiverdocnum,
        receiverbusinessname: receiverbusinessname,
        receiverfiscaladdress: receiverfiscaladdress,
        receivercountry: receivercountry,
        receivermail: receivermail,
        invoicetype: invoicetype,
        sunatopecode: sunatopecode,
        serie: serie,
        correlative: correlative,
        concept: concept,
        invoicedate: invoicedate,
        expirationdate: expirationdate,
        subtotal: subtotal,
        taxes: taxes,
        totalamount: totalamount,
        currency: currency,
        exchangerate: exchangerate,
        invoicestatus: invoicestatus,
        filenumber: filenumber,
        purchaseorder: purchaseorder,
        executingunitcode: executingunitcode,
        selectionprocessnumber: selectionprocessnumber,
        contractnumber: contractnumber,
        comments: comments,
        credittype: credittype,
        creditnotetype: creditnotetype,
        creditnotemotive: creditnotemotive,
        creditnotediscount: creditnotediscount,
        invoicereferencefile: invoicereferencefile,
        invoicepaymentnote: invoicepaymentnote,
        username: username,
        referenceinvoiceid: referenceinvoiceid,
        netamount: netamount,
        paymentstatus: paymentstatus,
        hasreport, hasreport
    }

    const result = await triggerfunctions.executesimpletransaction(query, bind);

    if (result instanceof Array) {
        if (result.length > 0) {
            return result[0]
        }
    }

    return null
}

const createInvoiceDetail = async (corpid, orgid, invoiceid, description, status, type, quantity, productcode, hasigv, saletype, igvtribute, measureunit, totaligv, totalamount, igvrate, productprice, productdescription, productnetprice, productnetworth, netamount, username) => {
    const query = "UFN_INVOICEDETAIL_INS";
    const bind = {
        corpid: corpid,
        orgid: orgid,
        invoiceid: invoiceid,
        description: description,
        status: status,
        type: type,
        quantity: quantity,
        productcode: productcode,
        hasigv: hasigv,
        saletype: saletype,
        igvtribute: igvtribute,
        measureunit: measureunit,
        totaligv: totaligv,
        totalamount: totalamount,
        igvrate: igvrate,
        productprice: productprice,
        productdescription: productdescription,
        productnetprice: productnetprice,
        productnetworth: productnetworth,
        netamount: netamount,
        username: username
    }
    
    const result = await triggerfunctions.executesimpletransaction(query, bind);

    if (result instanceof Array) {
        return result;
    }

    return null
}

const createBalanceData = async (corpid, orgid, communicationchannelid, description, status, type, module, receiver, amount, balance, documenttype, documentnumber, paymentstatus, transactiondate, transactionuser, username) => {
    const query = "UFN_BALANCE_INS_PAYMENT";
    const bind = {
        corpid: corpid,
        orgid: orgid,
        communicationchannelid: communicationchannelid,
        description: description,
        status: status,
        type: type,
        module: module,
        receiver: receiver,
        amount: amount,
        balance: balance,
        documenttype: documenttype,
        documentnumber: documentnumber,
        paymentstatus: paymentstatus,
        transactiondate: transactiondate,
        transactionuser: transactionuser,
        username: username,
    }
    
    const result = await triggerfunctions.executesimpletransaction(query, bind);

    if (result instanceof Array) {
        if (result.length > 0) {
            return result[0]
        }
    }

    return null
}

const deleteInvoiceDetail = async (corpid, orgid, invoiceid) => {
    const query = "UFN_INVOICEDETAIL_DELETE";
    const bind = {
        corpid: corpid,
        orgid: orgid,
        invoiceid: invoiceid
    }
    
    const result = await triggerfunctions.executesimpletransaction(query, bind);

    if (result instanceof Array) {
        return result;
    }

    return null
}

const changePaymentInvoice = async (corpid, orgid, invoiceid, status, paymentnote, paymentfile, paymentcommentary, username) => {
    const query = "UFN_INVOICE_CHANGEPAYMENTSTATUS";
    const bind = {
        corpid: corpid,
        orgid: orgid,
        invoiceid: invoiceid,
        status: status,
        paymentnote: paymentnote,
        paymentfile: paymentfile,
        paymentcommentary: paymentcommentary,
        username, username,
    }
    
    const result = await triggerfunctions.executesimpletransaction(query, bind);

    if (result instanceof Array) {
        return result;
    }

    return null
}

const changeInvoiceStatus = async (corpid, orgid, invoiceid, status, username) => {
    const query = "UFN_INVOICE_CHANGEINVOICESTATUS";
    const bind = {
        corpid: corpid,
        orgid: orgid,
        invoiceid: invoiceid,
        status: status,
        username, username,
    }
    
    const result = await triggerfunctions.executesimpletransaction(query, bind);

    if (result instanceof Array) {
        return result;
    }

    return null
}

const changeBalanceInvoice = async (corpid, orgid, balanceid, invoiceid, username) => {
    const query = "UFN_BALANCE_CHANGEINVOICE";
    const bind = {
        corpid: corpid,
        orgid: orgid,
        balanceid: balanceid,
        invoiceid: invoiceid,
        username, username,
    }
    
    const result = await triggerfunctions.executesimpletransaction(query, bind);

    if (result instanceof Array) {
        return result;
    }

    return null
}

exports.getToken = async (req, res) => {
    const { token } = req.body;

    try {
        const culqi = new Culqi({
            privateKey: 'sk_test_d901e8f07d45a485'
        });

        const tk = await culqi.tokens.getToken({
            id: token.id, 
        });

        return res.json({ error: false, success: true, data: tk });
    } catch (error) {
        return res.status(500).json({ msg: "There was a problem, please try again later" });
    }
}

exports.createOrder = async (req, res) => {
    const culqi = new Culqi({
        privateKey: 'sk_test_d901e8f07d45a485'
    });

    const { corpid, orgid, userid } = req.user;
    const { invoiceid } = req.body;

    try {
        const invoice = await getInvoice(corpid, orgid, userid, invoiceid);

        const userprofile = await getUserProfile(userid);

        if (invoice) {
            const order = await culqi.orders.createOrder({
                amount: invoice.totalamount * 100,
                currency_code: invoice.currency,
                description: invoice.description,
                order_number: `${invoice.serie}-${invoice.correlative}`,
                client_details: {
                    first_name: userprofile.firstname,
                    last_name: userprofile.lastname,
                    email: userprofile.email,
                    phone_number: userprofile.phone,
                },
                expiration_date: Math.trunc(new Date().setMonth(new Date().getMonth()+2)/1000)
            });

            const query = "UFN_INVOICE_ORDER";
            const bind = {
                corpid: corpid,
                orgid: orgid,
                invoiceid: invoiceid,
                orderid: order.id,
                orderjson: order
            }

            const result = await triggerfunctions.executesimpletransaction(query, bind);

            if (result instanceof Array) {
                if (result.length > 0) {
                    return result.json({
                        success: true,
                        data: {
                            id: order.id,
                            state: order.state
                        }
                    });
                }
                else
                {
                    return result.json({
                        success: false,
                    });
                }
            }
        }
        else {
            return res.status(404).json({ error: true, success: false, code: '', message: 'Invoice not found' });
        }
    } catch (error) {
        return res.status(500).json({ message: "There was a problem, please try again later" });
    }
}

exports.deleteOrder = async (req, res) => {
    const culqi = new Culqi({
        privateKey: 'sk_test_d901e8f07d45a485'
    });

    const { corpid, orgid, userid } = req.user;
    const { invoiceid } = req.body;

    try {
        const invoice = await getInvoice(corpid, orgid, userid, invoiceid);

        if (invoice) {
            const order = await culqi.orders.deleteOrder({
                id: invoice.orderid
            });

            const query = "UFN_INVOICE_ORDER";
            const bind = {
                corpid: corpid,
                orgid: orgid,
                invoiceid: invoiceid,
                orderid: null,
                orderjson: null
            }

            const result = await triggerfunctions.executesimpletransaction(query, bind);

            if (result instanceof Array) {
                if (result.length > 0) {
                    return result.json({
                        success: true,
                        data: {
                            id: order.id,
                            state: order.state
                        }
                    });
                }
                else
                {
                    return result.json({
                        success: false,
                    });
                }
            }
        }
        else {
            return res.status(404).json({ error: true, success: false, code: '', message: 'Invoice not found' });
        }
    } catch (error) {
        return res.status(500).json({ message: "There was a problem, please try again later" });
    }
}

exports.charge = async (req, res) => {
    const { corpid, orgid, userid, usr } = req.user;
    const { settings, token, metadata = {} } = req.body;

    try {
        const userprofile = await getUserProfile(userid);

        if (userprofile) {
            metadata.corpid = corpid;
            metadata.orgid = orgid;
            metadata.userid = userid;

            const charge = await createCharge(userprofile, settings, token, metadata, 'sk_test_d901e8f07d45a485');

            if (charge.object === 'error') {
                return res.status(400).json({
                    error: true,
                    success: false,
                    data: {
                        object: charge.object,
                        id: charge.charge_id,
                        code: charge.code,
                        message: charge.user_message
                    }
                });
            }
            else {
                const chargequery = "UFN_CHARGE_INS";
                const chargebind = {
                    corpid: corpid,
                    orgid: orgid,
                    id: null,
                    invoiceid: null,
                    description: settings.description,
                    type: charge.object,
                    status: 'PAID',
                    amount: settings.amount / 100,
                    currency: settings.currency,
                    paidby: usr,
                    orderid: null,
                    orderjson: null,
                    email: token.email,
                    tokenid: token.id,
                    capture: true,
                    tokenjson: token,
                    chargetoken: charge.id,
                    chargejson: charge,
                    operation: 'INSERT'
                }

                const chargeresult = await triggerfunctions.executesimpletransaction(chargequery, chargebind);

                return res.json({
                    error: false,
                    success: true,
                    code: charge.outcome.code,
                    message: charge.outcome.user_message ,
                    data: {
                        object: charge.object,
                        id: charge.id,
                    }
                });
            }
        }
        else {
            return res.status(403).json({ error: true, success: false, code: '', message: 'invalid user' });
        }
    } catch (error) {
        if (error.charge_id) {
            return res.status(500).json({ message: error.merchant_message });
        }
        else {
            return res.status(500).json({ message: "There was a problem, please try again later" });
        }
    }
};

exports.refundInvoice = async (req, res) => {
    const culqi = new Culqi({
        privateKey: 'sk_test_d901e8f07d45a485'
    });

    const { corpid, orgid, userid, usr } = req.user;
    const { invoiceid, metadata = {} } = req.body;

    try {
        const invoice = await getInvoice(corpid, orgid, userid, invoiceid);

        if (invoice) {
            if (invoice.paymentstatus === 'PAID') {
                metadata.corpid = corpid;
                metadata.corporation = invoice.corpdesc;
                metadata.orgid = orgid;
                metadata.organization = invoice.orgdesc;
                metadata.documentnumber = invoice.receiverdocnum;
                metadata.businessname = invoice.receiverbusinessname;
                metadata.invoiceid = invoiceid;
                metadata.invoicecode = `${invoice.serie}-${invoice.correlative}`;
                metadata.userid = userid;
                metadata.usr = usr;

                const refund = await culqi.refunds.createRefund({
                    amount: invoice.totalamount * 100,
                    charge_id: invoice.chargetoken,
                    reason: "solicitud_comprador",
                    
                });

                if (refund.object === 'error') {
                    return res.status(400).json({
                        error: true,
                        success: false,
                        data: {
                            object: refund.object,
                            code: refund.code,
                            message: refund.user_message
                        }
                    });
                }
                else {
                    const query = "UFN_INVOICE_REFUND";
                    const bind = {
                        corpid: corpid,
                        orgid: orgid,
                        invoiceid: invoiceid,
                        refundtoken: refund.id,
                        refundjson: refund,
                        username: usr
                    }

                    const result = await triggerfunctions.executesimpletransaction(query, bind);

                    return res.json({
                        error: false,
                        success: true,
                        message: "refunded",
                        data: {
                            object: refund.object,
                            id: refund.id,
                        }
                    });
                }
            }
            else {
                return res.json({ error: false, success: true, code: '', message: 'Invoice already refunded' });
            }
        }
        else {
            return res.status(404).json({ error: true, success: false, code: '', message: 'Invoice not found' });
        }
    } catch (error) {
        return res.status(500).json({ message: "There was a problem, please try again later" });
    }
};

exports.refund = async (req, res) => {
    const culqi = new Culqi({
        privateKey: 'sk_test_d901e8f07d45a485'
    });

    const { corpid, orgid, userid, usr } = req.user;
    const { chargeid, metadata = {} } = req.body;

    try {
        const charge = await getCharge(corpid, orgid, userid, chargeid);

        if (charge) {
            if (charge.status === 'PAID') {
                metadata.corpid = corpid;
                metadata.orgid = orgid;
                metadata.userid = userid;

                const refund = await culqi.refunds.createRefund({
                    amount: charge.amount * 100,
                    charge_id: charge.chargetoken,
                    reason: "solicitud_comprador"
                });
                
                if (refund.object === 'error') {
                    return res.status(400).json({
                        error: true,
                        success: false,
                        data: {
                            object: refund.object,
                            code: refund.code,
                            message: refund.user_message
                        }
                    });
                }
                else {
                    const query = "UFN_CHARGE_REFUND";
                    const bind = {
                        corpid: corpid,
                        orgid: orgid,
                        chargeid: chargeid,
                        refundtoken: refund.id,
                        refundjson: refund,
                        username: usr
                    }

                    const result = await triggerfunctions.executesimpletransaction(query, bind);

                    return res.json({
                        error: false,
                        success: true,
                        message: "refunded",
                        data: {
                            object: refund.object,
                            id: refund.id,
                        }
                    });
                }
            }
            else {
                return res.json({ error: false, success: true, code: '', message: 'Invoice already refunded' });
            }
        }
        else {
            return res.status(404).json({ error: true, success: false, code: '', message: 'Invoice not found' });
        }
    } catch (error) {
        return res.status(500).json({ message: "There was a problem, please try again later" });
    }
};

exports.chargeInvoice = async (req, res) => {
    const { userid, usr } = req.user;
    const { invoiceid, settings, token, metadata = {}, purchaseorder, comments, corpid, orgid, override } = req.body;

    try {
        const invoice = await getInvoice(corpid, orgid, userid, invoiceid);

        if (invoice) {
            if (invoice.invoicestatus !== "INVOICED") {
                const corp = await getCorporation(corpid);
                const org = await getOrganization(corpid, orgid);

                const tipocredito = '0';

                var correctcorrelative = false;
                var proceedpayment = false;

                if (corp) {
                    if (corp.billbyorg) {
                        if (org) {
                            if (org.docnum && org.doctype && org.businessname && org.fiscaladdress && org.sunatcountry) {
                                if ((org.sunatcountry === 'PE' && org.doctype === '6') || (org.sunatcountry !== 'PE' && org.doctype === '0')) {
                                    correctcorrelative = true;
                                }
        
                                if ((org.sunatcountry === 'PE') && (org.doctype === '1' || org.doctype === '4' || org.doctype === '7')) {
                                    correctcorrelative = true;
                                }
        
                                if (correctcorrelative) {
                                    proceedpayment = true;
                                }
                                else {
                                    return res.status(403).json({ error: true, success: false, code: '', message: 'Could not match correlative. Check organization configuration' });
                                }
                            }
                            else {
                                return res.status(403).json({ error: true, success: false, code: '', message: 'Organization missing parameters' });
                            }
                        }
                        else {
                            return res.status(403).json({ error: true, success: false, code: '', message: 'Organization not found' });
                        }
                    }
                    else {
                        if (corp.docnum && corp.doctype && corp.businessname && corp.fiscaladdress && corp.sunatcountry) {
                            if ((corp.sunatcountry === 'PE' && corp.doctype === '6') || (corp.sunatcountry !== 'PE' && corp.doctype === '0')) {
                                correctcorrelative = true;
                            }
                        
                            if ((corp.sunatcountry === 'PE') && (corp.doctype === '1' || corp.doctype === '4' || corp.doctype === '7')) {
                                correctcorrelative = true;
                            }
        
                            if (correctcorrelative) {
                                proceedpayment = true;
                            }
                            else {
                                return res.status(403).json({ error: true, success: false, code: '', message: 'Could not match correlative. Check corporation configuration' });
                            }
                        }
                        else {
                            return res.status(403).json({ error: true, success: false, code: '', message: 'Corporation missing parameters' });
                        }
                    }
        
                    if (proceedpayment) {
                        const invoicedetail = await getInvoiceDetail(corpid, orgid, userid, invoiceid);
        
                        if (invoicedetail) {
                            if (invoice.invoicestatus === 'DRAFT' && invoice.paymentstatus === 'PENDING' && invoice.currency === settings.currency && (((Math.round((invoice.totalamount + Number.EPSILON) * 100) / 100) * 100 === settings.amount) || override)) {
                                const appsetting = await getAppSetting();
                                const userprofile = await getUserProfile(userid);
                                
                                if (userprofile && appsetting) {
                                    metadata.corpid = (corpid || '');
                                    metadata.corporation = removeAccent(corp.description || '');
                                    metadata.orgid = (orgid || '');
                                    metadata.organization = removeAccent(invoice.orgdesc || '');
                                    metadata.document = ((org ? org.docnum : corp.docnum) || '');
                                    metadata.businessname = removeAccent((org ? org.businessname : corp.businessname) || '');
                                    metadata.invoiceid = (invoiceid || '');
                                    metadata.seriecode = '';
                                    metadata.emissiondate = (invoice.invoicedate || '');
                                    metadata.user = removeAccent(usr || '');
                                    metadata.reference = removeAccent(invoice.description || '');
        
                                    const charge = await createCharge(userprofile, settings, token, metadata, appsetting.privatekey);
        
                                    if (charge.object === 'error') {
                                        return res.status(400).json({
                                            data: {
                                                code: charge.code,
                                                id: charge.charge_id,
                                                message: charge.user_message,
                                                object: charge.object
                                            },
                                            error: true,
                                            success: false
                                        });
                                    }
                                    else {
                                        const chargequery = "UFN_CHARGE_INS";
                                        const chargebind = {
                                            amount: settings.amount / 100,
                                            capture: true,
                                            chargejson: charge,
                                            chargetoken: charge.id,
                                            corpid: corpid,
                                            currency: settings.currency,
                                            description: settings.description,
                                            email: token.email,
                                            id: null,
                                            invoiceid: invoiceid,
                                            orderid: null,
                                            orderjson: null,
                                            orgid: orgid,
                                            operation: 'INSERT',
                                            paidby: usr,
                                            status: 'PAID',
                                            tokenid: token.id,
                                            tokenjson: token,
                                            type: charge.object
                                        }
        
                                        const chargeresult = await triggerfunctions.executesimpletransaction(chargequery, chargebind);
        
                                        const invoicequery = "UFN_INVOICE_PAYMENT";
                                        const invoicebind = {
                                            capture: true,
                                            chargeid: chargeresult[0].chargeid,
                                            chargejson: charge,
                                            chargetoken: charge.id,
                                            corpid: corpid,
                                            email: token.email,
                                            invoiceid: invoiceid,
                                            orgid: orgid,
                                            paidby: usr,
                                            tokenid: token.id,
                                            tokenjson: token,
                                            culqiamount: (settings.amount / 100)
                                        }
            
                                        const invoiceresult = await triggerfunctions.executesimpletransaction(invoicequery, invoicebind);
        
                                        var invoicecorrelative = null;
                                        var documenttype = null;
        
                                        if (corp.billbyorg) {
                                            if ((org.sunatcountry === 'PE' && org.doctype === '6') || (org.sunatcountry !== 'PE' && org.doctype === '0')) {
                                                invoicecorrelative = await getCorrelativeNumber(corpid, orgid, invoiceid, 'INVOICE');
                                                documenttype = '01';
                                            }
                    
                                            if ((org.sunatcountry === 'PE') && (org.doctype === '1' || org.doctype === '4' || org.doctype === '7')) {
                                                invoicecorrelative = await getCorrelativeNumber(corpid, orgid, invoiceid, 'TICKET');
                                                documenttype = '03'
                                            }
                                        }
                                        else {
                                            if ((corp.sunatcountry === 'PE' && corp.doctype === '6') || (corp.sunatcountry !== 'PE' && corp.doctype === '0')) {
                                                invoicecorrelative = await getCorrelativeNumber(corpid, orgid, invoiceid, 'INVOICE');
                                                documenttype = '01';
                                            }
                    
                                            if ((corp.sunatcountry === 'PE') && (corp.doctype === '1' || corp.doctype === '4' || corp.doctype === '7')) {
                                                invoicecorrelative = await getCorrelativeNumber(corpid, orgid, invoiceid, 'TICKET');
                                                documenttype = '03'
                                            }
                                        }
        
                                        if (invoicecorrelative) {
                                            try {
                                                var invoicedata = {
                                                    CodigoAnexoEmisor: appsetting.annexcode,
                                                    CodigoFormatoImpresion: appsetting.printingformat,
                                                    CodigoMoneda: invoice.currency,
                                                    Username: appsetting.sunatusername,
                                                    TipoDocumento: documenttype,
                                                    TipoRucEmisor: appsetting.emittertype,
                                                    CodigoRucReceptor: org ? org.doctype : corp.doctype,
                                                    CodigoUbigeoEmisor: appsetting.ubigeo,
                                                    EnviarSunat: org ? org.autosendinvoice : corp.autosendinvoice,
                                                    FechaEmision: invoice.invoicedate,
                                                    MailEnvio: org ? org.contactemail : corp.contactemail,
                                                    MontoTotal: Math.round((invoice.totalamount + Number.EPSILON) * 100) / 100,
                                                    NombreComercialEmisor: appsetting.tradename,
                                                    RazonSocialEmisor: appsetting.businessname,
                                                    RazonSocialReceptor: org ? org.businessname : corp.businessname,
                                                    CorrelativoDocumento: zeroPad(invoicecorrelative.p_correlative, 8),
                                                    RucEmisor: appsetting.ruc,
                                                    NumeroDocumentoReceptor: org ? org.docnum : corp.docnum,
                                                    NumeroSerieDocumento: documenttype === '01' ? appsetting.invoiceserie : appsetting.ticketserie,
                                                    RetornaPdf: appsetting.returnpdf,
                                                    RetornaXmlSunat: appsetting.returnxmlsunat,
                                                    RetornaXml: appsetting.returnxml,
                                                    TipoCambio: invoice.currency === 'USD' ? invoice.exchangerate : '1.000',
                                                    Token: appsetting.token,
                                                    DireccionFiscalEmisor: appsetting.fiscaladdress,
                                                    DireccionFiscalReceptor: org ? org.fiscaladdress : corp.fiscaladdress,
                                                    VersionXml: appsetting.xmlversion,
                                                    VersionUbl: appsetting.ublversion,
                                                    Endpoint: appsetting.sunaturl,
                                                    PaisRecepcion: org ? org.sunatcountry : corp.sunatcountry,
                                                    ProductList: [],
                                                    DataList: []
                                                }
        
                                                if (corp.billbyorg) {
                                                    invoicedata.CodigoOperacionSunat = org.sunatcountry === 'PE' ? appsetting.operationcodeperu : appsetting.operationcodeother;
                                                    invoicedata.MontoTotalGravado = org.sunatcountry === 'PE' ? Math.round((invoice.subtotal + Number.EPSILON) * 100) / 100 : null;
                                                    invoicedata.MontoTotalInafecto = org.sunatcountry === 'PE' ? '0' : Math.round((invoice.subtotal + Number.EPSILON) * 100) / 100;
                                                    invoicedata.MontoTotalIgv = org.sunatcountry === 'PE' ? Math.round((invoice.taxes + Number.EPSILON) * 100) / 100 : null;
                                                }
                                                else {
                                                    invoicedata.CodigoOperacionSunat = corp.sunatcountry === 'PE' ? appsetting.operationcodeperu : appsetting.operationcodeother;
                                                    invoicedata.MontoTotalGravado = corp.sunatcountry === 'PE' ? Math.round((invoice.subtotal + Number.EPSILON) * 100) / 100 : null;
                                                    invoicedata.MontoTotalInafecto = corp.sunatcountry === 'PE' ? '0' : Math.round((invoice.subtotal + Number.EPSILON) * 100) / 100;
                                                    invoicedata.MontoTotalIgv = corp.sunatcountry === 'PE' ? Math.round((invoice.taxes + Number.EPSILON) * 100) / 100 : null;
                                                }
            
                                                var calcdetraction = false;
        
                                                if (corp.billbyorg) {
                                                    if (org.sunatcountry === 'PE') {
                                                        calcdetraction = true;
                                                    }
                                                }
                                                else {
                                                    if (corp.sunatcountry === 'PE') {
                                                        calcdetraction = true;
                                                    }
                                                }
        
                                                if (calcdetraction) {
                                                    if (appsetting.detraction && appsetting.detractioncode && appsetting.detractionaccount && (appsetting.detractionminimum || appsetting.detractionminimum === 0)) {
                                                        var compareamount = 0;
            
                                                        if (appsetting.detractionminimum) {
                                                            if (invoice.currency === 'USD') {
                                                                var exchangerate = await getLastExchange();
            
                                                                compareamount = invoice.totalamount * exchangerate;
                                                            }
                                                            else {
                                                                compareamount = invoice.totalamount;
                                                            }
                                                        }
                                                        
                                                        if (compareamount > appsetting.detractionminimum) {
                                                            invoicedata.MontoTotalDetraccion = Math.round(((invoice.totalamount * appsetting.detraction) + Number.EPSILON) * 100) / 100;
                                                            invoicedata.PorcentajeTotalDetraccion = appsetting.detraction * 100;
                                                            invoicedata.NumeroCuentaDetraccion = appsetting.detractionaccount;
                                                            invoicedata.CodigoDetraccion = appsetting.detractioncode;
            
                                                            var adicional02 = {
                                                                CodigoDatoAdicional: '06',
                                                                DescripcionDatoAdicional: 'CUENTA DE DETRACCION: ' + appsetting.detractionaccount
                                                            }
                    
                                                            invoicedata.DataList.push(adicional02);
                                                        }
                                                    }
                                                }
                                                
                                                if (tipocredito) {
                                                    if (tipocredito === '0') {
                                                        invoicedata.FechaVencimiento = invoicedata.FechaEmision;
                                                    }
                                                    else {
                                                        invoicedata.FechaVencimiento = new Date(new Date().setDate(new Date(invoice.invoicedate).getDate()+(Number.parseFloat(tipocredito)))).toISOString().substring(0, 10);
                                                    }
                                                }
            
                                                invoicedetail.forEach(async data => {
                                                    var invoicedetaildata = {
                                                        CantidadProducto: data.quantity,
                                                        CodigoProducto: data.productcode,
                                                        TipoVenta: data.saletype,
                                                        UnidadMedida: data.measureunit,
                                                        IgvTotal: Math.round((data.totaligv + Number.EPSILON) * 100) / 100,
                                                        MontoTotal: Math.round((data.totalamount + Number.EPSILON) * 100) / 100,
                                                        TasaIgv: data.igvrate * 100,
                                                        PrecioProducto: Math.round((data.productprice + Number.EPSILON) * 100) / 100,
                                                        DescripcionProducto: data.productdescription,
                                                        PrecioNetoProducto: data.productnetprice,
                                                        ValorNetoProducto: Math.round(((data.quantity * data.productnetprice) + Number.EPSILON) * 100) / 100,
                                                    };
        
                                                    if (corp.billbyorg) {
                                                        invoicedetaildata.AfectadoIgv = org.sunatcountry === 'PE' ? '10' : '40';
                                                        invoicedetaildata.TributoIgv = org.sunatcountry === 'PE' ? '1000' : '9998';
                                                    }
                                                    else {
                                                        invoicedetaildata.AfectadoIgv = corp.sunatcountry === 'PE' ? '10' : '40';
                                                        invoicedetaildata.TributoIgv = corp.sunatcountry === 'PE' ? '1000' : '9998';
                                                    }
                
                                                    invoicedata.ProductList.push(invoicedetaildata);
                                                });
            
                                                var adicional01 = {
                                                    CodigoDatoAdicional: '05',
                                                    DescripcionDatoAdicional: 'FORMA DE PAGO: TRANSFERENCIA'
                                                }
            
                                                invoicedata.DataList.push(adicional01);
                                                
                                                if (purchaseorder) {
                                                    var adicional03 = {
                                                        CodigoDatoAdicional: '15',
                                                        DescripcionDatoAdicional: purchaseorder
                                                    }
            
                                                    invoicedata.DataList.push(adicional03);
                                                }
            
                                                if (comments) {
                                                    var adicional04 = {
                                                        CodigoDatoAdicional: '07',
                                                        DescripcionDatoAdicional: comments
                                                    }
            
                                                    invoicedata.DataList.push(adicional04);
                                                }
            
                                                if (tipocredito) {
                                                    var adicional05 = {
                                                        CodigoDatoAdicional: '01',
                                                        DescripcionDatoAdicional: tipocredito === '0' ? 'AL CONTADO' : `CREDITO A ${tipocredito} DIAS`
                                                    }
            
                                                    invoicedata.DataList.push(adicional05);
                                                }
        
                                                const requestSendToSunat = await axios({
                                                    data: invoicedata,
                                                    method: 'post',
                                                    url: `${bridgeEndpoint}processmifact/sendinvoice`
                                                });
        
                                                if (requestSendToSunat.data.result) {
                                                    await invoiceSunat(corpid, orgid, invoiceid, 'INVOICED', null, requestSendToSunat.data.result.cadenaCodigoQr, requestSendToSunat.data.result.codigoHash, requestSendToSunat.data.result.urlCdrSunat, requestSendToSunat.data.result.urlPdf, requestSendToSunat.data.result.urlXml, invoicedata.NumeroSerieDocumento, appsetting?.ruc|| null, appsetting?.businessname|| null, appsetting?.tradename|| null, appsetting?.fiscaladdress|| null, appsetting?.ubigeo|| null, appsetting?.emittertype|| null, appsetting?.annexcode|| null, appsetting?.printingformat|| null, invoicedata?.EnviarSunat|| null, appsetting?.returnpdf|| null, appsetting?.returnxmlsunat|| null, appsetting?.returnxml|| null, appsetting?.token|| null, appsetting?.sunaturl|| null, appsetting?.sunatusername|| null, appsetting?.xmlversion|| null, appsetting?.ublversion|| null, invoicedata?.CodigoRucReceptor|| null, invoicedata?.NumeroDocumentoReceptor|| null, invoicedata?.RazonSocialReceptor|| null, invoicedata?.DireccionFiscalReceptor|| null, invoicedata?.PaisRecepcion|| null, invoicedata?.MailEnvio|| null, documenttype|| null, invoicedata?.CodigoOperacionSunat|| null, invoicedata?.FechaVencimiento|| null, purchaseorder || null, comments || null, 'typecredit_alcontado'|| null, appsetting?.detractioncode|| null, appsetting?.detraction|| null, appsetting?.detractionaccount);
                                                }
                                                else {
                                                    await invoiceSunat(corpid, orgid, invoiceid, 'ERROR', requestSendToSunat.data.operationMessage, null, null, null, null, null, null, appsetting?.ruc|| null, appsetting?.businessname|| null, appsetting?.tradename|| null, appsetting?.fiscaladdress|| null, appsetting?.ubigeo|| null, appsetting?.emittertype|| null, appsetting?.annexcode|| null, appsetting?.printingformat|| null, invoicedata?.EnviarSunat|| null, appsetting?.returnpdf|| null, appsetting?.returnxmlsunat|| null, appsetting?.returnxml|| null, appsetting?.token|| null, appsetting?.sunaturl|| null, appsetting?.sunatusername|| null, appsetting?.xmlversion|| null, appsetting?.ublversion|| null, invoicedata?.CodigoRucReceptor|| null, invoicedata?.NumeroDocumentoReceptor|| null, invoicedata?.RazonSocialReceptor|| null, invoicedata?.DireccionFiscalReceptor|| null, invoicedata?.PaisRecepcion|| null, invoicedata?.MailEnvio|| null, documenttype|| null, invoicedata?.CodigoOperacionSunat|| null, invoicedata?.FechaVencimiento|| null, purchaseorder || null, comments || null, 'typecredit_alcontado'|| null, appsetting?.detractioncode|| null, appsetting?.detraction|| null, appsetting?.detractionaccount);
            
                                                    if (corp.billbyorg) {
                                                        if ((org.sunatcountry === 'PE' && org.doctype === '6') || (org.sunatcountry !== 'PE' && org.doctype === '0')) {
                                                            await getCorrelativeNumber(corpid, orgid, invoiceid, 'INVOICEERROR');
                                                        }
                                
                                                        if ((org.sunatcountry === 'PE') && (org.doctype === '1' || org.doctype === '4' || org.doctype === '7')) {
                                                            await getCorrelativeNumber(corpid, orgid, invoiceid, 'TICKETERROR');
                                                        }
                                                    }
                                                    else {
                                                        if ((corp.sunatcountry === 'PE' && corp.doctype === '6') || (corp.sunatcountry !== 'PE' && corp.doctype === '0')) {
                                                            await getCorrelativeNumber(corpid, orgid, invoiceid, 'INVOICEERROR');
                                                        }
                                
                                                        if ((corp.sunatcountry === 'PE') && (corp.doctype === '1' || corp.doctype === '4' || corp.doctype === '7')) {
                                                            await getCorrelativeNumber(corpid, orgid, invoiceid, 'TICKETERROR');
                                                        }
                                                    }
                                                }
                                            }
                                            catch (error) {
                                                await invoiceSunat(corpid, orgid, invoiceid, 'ERROR', error.message, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
            
                                                if (corp.billbyorg) {
                                                    if ((org.sunatcountry === 'PE' && org.doctype === '6') || (org.sunatcountry !== 'PE' && org.doctype === '0')) {
                                                        await getCorrelativeNumber(corpid, orgid, invoiceid, 'INVOICEERROR');
                                                    }
                            
                                                    if ((org.sunatcountry === 'PE') && (org.doctype === '1' || org.doctype === '4' || org.doctype === '7')) {
                                                        await getCorrelativeNumber(corpid, orgid, invoiceid, 'TICKETERROR');
                                                    }
                                                }
                                                else {
                                                    if ((corp.sunatcountry === 'PE' && corp.doctype === '6') || (corp.sunatcountry !== 'PE' && corp.doctype === '0')) {
                                                        await getCorrelativeNumber(corpid, orgid, invoiceid, 'INVOICEERROR');
                                                    }
                            
                                                    if ((corp.sunatcountry === 'PE') && (corp.doctype === '1' || corp.doctype === '4' || corp.doctype === '7')) {
                                                        await getCorrelativeNumber(corpid, orgid, invoiceid, 'TICKETERROR');
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            await invoiceSunat(corpid, orgid, invoiceid, 'ERROR', 'Correlative not found', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
                                        }
        
                                        return res.json({
                                            code: charge.outcome.code,
                                            data: {
                                                id: charge.id,
                                                object: charge.object
                                            },
                                            error: false,
                                            message: charge.outcome.user_message,
                                            success: true
                                        });
                                    }
                                }
                                else {
                                    return res.status(403).json({ error: true, success: false, code: '', message: 'Invalid user' });
                                }
                            }
                            else {
                                return res.status(403).json({ error: true, success: false, code: '', message: 'Invalid invoice data' });
                            }
                        }
                        else {
                            return res.status(403).json({ error: true, success: false, code: '', message: 'Invoice detail not found' });
                        }
                    }
                    else {
                        return res.status(403).json({ error: true, success: false, code: '', message: 'There are missing parameters' });
                    }
                }
                else {
                    return res.status(403).json({ error: true, success: false, code: '', message: 'Corporation not found' });
                }
            }
            else {
                if (((Math.round((invoice.totalamount + Number.EPSILON) * 100) / 100) * 100 === settings.amount) || override) {
                    const appsetting = await getAppSetting();
                    const userprofile = await getUserProfile(userid);

                    if (userprofile && appsetting) {
                        metadata.corpid = (corpid || '');
                        metadata.corporation = removeAccent(invoice.corpdesc || '');
                        metadata.orgid = (orgid || '');
                        metadata.organization = removeAccent(invoice.orgdesc || '');
                        metadata.document = (invoice.receiverdocnum || '');
                        metadata.businessname = removeAccent(invoice.receiverbusinessname || '');
                        metadata.invoiceid = (invoiceid || '');
                        metadata.seriecode = (invoice.serie ? invoice.serie : 'X000') + '-' + (invoice.correlative ? invoice.correlative.toString().padStart(8, '0') : '00000000');
                        metadata.emissiondate = (invoice.invoicedate || '');
                        metadata.user = removeAccent(usr || '');
                        metadata.reference = removeAccent(invoice.description || '');
    
                        const charge = await createCharge(userprofile, settings, token, metadata, appsetting.privatekey);
    
                        if (charge.object === 'error') {
                            return res.status(400).json({
                                data: {
                                    code: charge.code,
                                    id: charge.charge_id,
                                    message: charge.user_message,
                                    object: charge.object
                                },
                                error: true,
                                success: false
                            });
                        }
                        else {
                            const chargequery = "UFN_CHARGE_INS";
                            const chargebind = {
                                amount: settings.amount / 100,
                                capture: true,
                                chargejson: charge,
                                chargetoken: charge.id,
                                corpid: corpid,
                                currency: settings.currency,
                                description: settings.description,
                                email: token.email,
                                id: null,
                                invoiceid: invoiceid,
                                orderid: null,
                                orderjson: null,
                                orgid: orgid,
                                operation: 'INSERT',
                                paidby: usr,
                                status: 'PAID',
                                tokenid: token.id,
                                tokenjson: token,
                                type: charge.object
                            }
    
                            const chargeresult = await triggerfunctions.executesimpletransaction(chargequery, chargebind);
    
                            const invoicequery = "UFN_INVOICE_PAYMENT";
                            const invoicebind = {
                                capture: true,
                                chargeid: chargeresult[0].chargeid,
                                chargejson: charge,
                                chargetoken: charge.id,
                                corpid: corpid,
                                email: token.email,
                                invoiceid: invoiceid,
                                orgid: orgid,
                                paidby: usr,
                                tokenid: token.id,
                                tokenjson: token,
                                culqiamount: (settings.amount / 100)
                            }
                            
                            const invoiceresult = await triggerfunctions.executesimpletransaction(invoicequery, invoicebind);
    
                            return res.json({
                                code: charge.outcome.code,
                                data: {
                                    id: charge.id,
                                    object: charge.object
                                },
                                error: false,
                                message: charge.outcome.user_message,
                                success: true
                            });
                        }
                    }
                    else {
                        return res.status(403).json({ error: true, success: false, code: '', message: 'Invalid user' });
                    }
                }
                else {
                    return res.status(403).json({ error: true, success: false, code: '', message: 'Total amount does not match' });
                }
            }
        }
        else {
            return res.status(403).json({ error: true, success: false, code: '', message: 'Invoice not found' });
        }
    } catch (error) {
        if (error.charge_id) {
            return res.status(500).json({ message: error.merchant_message });
        }
        else {
            return res.status(500).json({ message: "There was a problem, please try again later" });
        }
    }
};

exports.createInvoice = async (request, response) => {
    const { userid, usr } = request.user;
    const { corpid, orgid, clientdoctype, clientdocnumber, clientbusinessname, clientfiscaladdress, clientcountry, clientmail, clientcredittype, invoicecreatedate, invoiceduedate, invoicecurrency, invoicetotalamount, invoicepurchaseorder, invoicecomments, autosendinvoice, productdetail, onlyinsert, invoiceid } = request.body;

    try {
        if ((corpid || orgid) && clientcountry) {
            if (productdetail) {
                const appsetting = await getAppSetting();

                if (appsetting) {
                    var productinfo = [];

                    var invoicesubtotal = 0;
                    var invoicetaxes = 0;
                    var invoicetotalcharge = 0;

                    var lastExchange = await getLastExchange();

                    if (clientdoctype !== '0') {
                        invoicesubtotal = invoicetotalamount;
                        invoicetaxes = appsetting.igv * invoicetotalamount;
                        invoicetotalcharge = (appsetting.igv * invoicetotalamount) + invoicetotalamount;
                    }
                    else {
                        invoicesubtotal = invoicetotalamount;
                        invoicetaxes = 0;
                        invoicetotalcharge = invoicetotalamount;
                    }

                    var invoiceResponse = await createInvoice(corpid, orgid, (invoiceid || 0), `GENERATED FOR ${clientdocnumber}`, 'ACTIVO', 'INVOICE', null, null, null, null, null, null, null, null, null, null, clientdoctype, clientdocnumber, clientbusinessname, clientfiscaladdress, clientcountry, clientmail, null, null, null, null, `GENERATED FOR ${clientdocnumber}`, invoicecreatedate, invoiceduedate, invoicesubtotal, invoicetaxes, invoicetotalcharge, invoicecurrency, lastExchange, (onlyinsert ? 'PENDING' : 'DRAFT'), null, invoicepurchaseorder, null, null, null, invoicecomments, clientcredittype, null, null, null, null, null, usr, null, invoicetotalamount, 'PENDING', false);

                    if (invoiceResponse) {
                        if (invoiceid) {
                            await deleteInvoiceDetail(corpid, orgid, invoiceid);
                        }
                        
                        await Promise.all(productdetail.map(async (element) => {
                            var producthasigv = '';
                            var productigvtribute = '';
                            var producttotaligv = 0;
                            var producttotalamount = 0;
                            var productigvrate = 0;
                            var productprice = 0;
                            var productnetprice = 0;
                            var productnetworth = 0;

                            if (clientdoctype !== '0') {
                                producthasigv = '10';
                                productigvtribute = '1000';
                                producttotaligv = (element.productquantity * parseFloat(element.productsubtotal)) * appsetting.igv;
                                producttotalamount = (element.productquantity * parseFloat(element.productsubtotal)) * (1 + appsetting.igv);
                                productigvrate = appsetting.igv;
                                productprice = parseFloat(element.productsubtotal) * (1 + appsetting.igv);
                                productnetprice = parseFloat(element.productsubtotal);
                                productnetworth = element.productquantity * parseFloat(element.productsubtotal);
                            }
                            else {
                                producthasigv = '40';
                                productigvtribute = '9998';
                                producttotaligv = 0;
                                producttotalamount = element.productquantity * parseFloat(element.productsubtotal);
                                productigvrate = 0;
                                productprice = parseFloat(element.productsubtotal);
                                productnetprice = parseFloat(element.productsubtotal);
                                productnetworth = element.productquantity * parseFloat(element.productsubtotal);
                            }

                            await createInvoiceDetail(corpid, orgid, invoiceResponse.invoiceid, element.productdescription, 'ACTIVO', 'NINGUNO', element.productquantity, element.productcode, producthasigv, '10', productigvtribute, element.productmeasure, producttotaligv, producttotalamount, productigvrate, productprice, element.productdescription, productnetprice, productnetworth, parseFloat(element.productsubtotal), usr);

                            productinfo.push({
                                producthasigv: producthasigv,
                                productigvtribute: productigvtribute,
                                producttotaligv: producttotaligv,
                                producttotalamount: producttotalamount,
                                productigvrate: productigvrate,
                                productprice: productprice,
                                productnetprice: productnetprice,
                                productnetworth: productnetworth,
                                productdescription: element.productdescription,
                                productcode: element.productcode,
                                productmeasure: element.productmeasure,
                                productquantity: element.productquantity,
                                productsubtotal: parseFloat(element.productsubtotal),
                            });
                        }));

                        if (onlyinsert) {
                            return response.json({
                                code: '',
                                data: null,
                                error: false,
                                message: 'successful_register',
                                success: true
                            });
                        }

                        var invoicecorrelative = null;
                        var documenttype = null;

                        if ((clientcountry === 'PE' && clientdoctype === '6') || (clientcountry !== 'PE' && clientdoctype === '0')) {
                            invoicecorrelative = await getCorrelativeNumber(corpid, orgid, invoiceResponse.invoiceid, 'INVOICE');
                            documenttype = '01';
                        }

                        if ((clientcountry === 'PE') && (clientdoctype === '1' || clientdoctype === '4' || clientdoctype === '7')) {
                            invoicecorrelative = await getCorrelativeNumber(corpid, orgid, invoiceResponse.invoiceid, 'TICKET');
                            documenttype = '03'
                        }

                        if (invoicecorrelative) {
                            try {
                                var invoicedata = {
                                    CodigoAnexoEmisor: appsetting.annexcode,
                                    CodigoFormatoImpresion: appsetting.printingformat,
                                    CodigoMoneda: invoicecurrency,
                                    Username: appsetting.sunatusername,
                                    TipoDocumento: documenttype,
                                    TipoRucEmisor: appsetting.emittertype,
                                    CodigoRucReceptor: clientdoctype,
                                    CodigoUbigeoEmisor: appsetting.ubigeo,
                                    EnviarSunat: autosendinvoice || true,
                                    FechaEmision: invoicecreatedate,
                                    MailEnvio: clientmail,
                                    MontoTotal: Math.round((invoicetotalcharge + Number.EPSILON) * 100) / 100,
                                    NombreComercialEmisor: appsetting.tradename,
                                    RazonSocialEmisor: appsetting.businessname,
                                    RazonSocialReceptor: clientbusinessname,
                                    CorrelativoDocumento: zeroPad(invoicecorrelative.p_correlative, 8),
                                    RucEmisor: appsetting.ruc,
                                    NumeroDocumentoReceptor: clientdocnumber,
                                    NumeroSerieDocumento: documenttype === '01' ? appsetting.invoiceserie : appsetting.ticketserie,
                                    RetornaPdf: appsetting.returnpdf,
                                    RetornaXmlSunat: appsetting.returnxmlsunat,
                                    RetornaXml: appsetting.returnxml,
                                    TipoCambio: invoicecurrency === 'USD' ? lastExchange : '1.000',
                                    Token: appsetting.token,
                                    DireccionFiscalEmisor: appsetting.fiscaladdress,
                                    DireccionFiscalReceptor: clientfiscaladdress,
                                    VersionXml: appsetting.xmlversion,
                                    VersionUbl: appsetting.ublversion,
                                    Endpoint: appsetting.sunaturl,
                                    PaisRecepcion: clientcountry,
                                    CodigoOperacionSunat: clientcountry === 'PE' ? appsetting.operationcodeperu : appsetting.operationcodeother,
                                    MontoTotalGravado: clientcountry === 'PE' ? Math.round((invoicesubtotal + Number.EPSILON) * 100) / 100 : null,
                                    MontoTotalInafecto: clientcountry === 'PE' ? '0' : Math.round((invoicesubtotal + Number.EPSILON) * 100) / 100,
                                    MontoTotalIgv: clientcountry === 'PE' ? Math.round((invoicetaxes + Number.EPSILON) * 100) / 100 : null,
                                    ProductList: [],
                                    DataList: []
                                }

                                if (invoiceduedate) {
                                    invoicedata.FechaVencimiento = invoiceduedate;
                                }

                                if (clientcountry === 'PE') {
                                    if (appsetting.detraction && appsetting.detractioncode && appsetting.detractionaccount && (appsetting.detractionminimum || appsetting.detractionminimum === 0)) {
                                        var compareamount = 0;

                                        if (appsetting.detractionminimum) {
                                            if (invoicecurrency === 'USD') {
                                                compareamount = invoicetotalcharge * lastExchange;
                                            }
                                            else {
                                                compareamount = invoicetotalcharge;
                                            }
                                        }
                                        
                                        if (compareamount > appsetting.detractionminimum) {
                                            invoicedata.MontoTotalDetraccion = Math.round(((invoicetotalcharge * appsetting.detraction) + Number.EPSILON) * 100) / 100;
                                            invoicedata.PorcentajeTotalDetraccion = appsetting.detraction * 100;
                                            invoicedata.NumeroCuentaDetraccion = appsetting.detractionaccount;
                                            invoicedata.CodigoDetraccion = appsetting.detractioncode;

                                            var adicional02 = {
                                                CodigoDatoAdicional: '06',
                                                DescripcionDatoAdicional: 'CUENTA DE DETRACCION: ' + appsetting.detractionaccount
                                            }
    
                                            invoicedata.DataList.push(adicional02);
                                        }
                                    }
                                }

                                productinfo.forEach(async element => {
                                    var invoicedetaildata = {
                                        CantidadProducto: element.productquantity,
                                        CodigoProducto: element.productcode,
                                        TipoVenta: '10',
                                        UnidadMedida: element.productmeasure,
                                        IgvTotal: Math.round((element.producttotaligv + Number.EPSILON) * 100) / 100,
                                        MontoTotal: Math.round((element.producttotalamount + Number.EPSILON) * 100) / 100,
                                        TasaIgv: element.productigvrate * 100,
                                        PrecioProducto: Math.round((element.productprice + Number.EPSILON) * 100) / 100,
                                        DescripcionProducto: element.productdescription,
                                        PrecioNetoProducto: Math.round((element.productnetprice + Number.EPSILON) * 100) / 100,
                                        ValorNetoProducto: Math.round((element.productnetworth + Number.EPSILON) * 100) / 100,
                                        AfectadoIgv: element.producthasigv,
                                        TributoIgv: element.productigvtribute,
                                    };

                                    invoicedata.ProductList.push(invoicedetaildata);
                                });

                                var adicional01 = {
                                    CodigoDatoAdicional: '05',
                                    DescripcionDatoAdicional: 'FORMA DE PAGO: TRANSFERENCIA'
                                }

                                invoicedata.DataList.push(adicional01);

                                if (invoicepurchaseorder) {
                                    var adicional03 = {
                                        CodigoDatoAdicional: '15',
                                        DescripcionDatoAdicional: invoicepurchaseorder
                                    }

                                    invoicedata.DataList.push(adicional03);
                                }

                                if (invoicecomments) {
                                    var adicional04 = {
                                        CodigoDatoAdicional: '07',
                                        DescripcionDatoAdicional: invoicecomments
                                    }

                                    invoicedata.DataList.push(adicional04);
                                }

                                if (clientcredittype) {
                                    var adicional05 = {
                                        CodigoDatoAdicional: '01',
                                        DescripcionDatoAdicional: 'AL CONTADO'
                                    }

                                    switch (clientcredittype) {
                                        case 'typecredit_15':
                                            adicional05.DescripcionDatoAdicional = 'CREDITO A 15 DIAS';
                                            break;
                                        case 'typecredit_30':
                                            adicional05.DescripcionDatoAdicional = 'CREDITO A 30 DIAS';
                                            break;
                                        case 'typecredit_45':
                                            adicional05.DescripcionDatoAdicional = 'CREDITO A 45 DIAS';
                                            break;
                                        case 'typecredit_60':
                                            adicional05.DescripcionDatoAdicional = 'CREDITO A 60 DIAS';
                                            break;
                                        case 'typecredit_90':
                                            adicional05.DescripcionDatoAdicional = 'CREDITO A 90 DIAS';
                                            break;
                                    }

                                    invoicedata.DataList.push(adicional05);
                                }

                                const requestSendToSunat = await axios({
                                    data: invoicedata,
                                    method: 'post',
                                    url: `${bridgeEndpoint}processmifact/sendinvoice`
                                });

                                if (requestSendToSunat.data.result) {
                                    await invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, 'INVOICED', null, requestSendToSunat.data.result.cadenaCodigoQr, requestSendToSunat.data.result.codigoHash, requestSendToSunat.data.result.urlCdrSunat, requestSendToSunat.data.result.urlPdf, requestSendToSunat.data.result.urlXml, invoicedata.NumeroSerieDocumento, appsetting?.ruc|| null, appsetting?.businessname|| null, appsetting?.tradename|| null, appsetting?.fiscaladdress|| null, appsetting?.ubigeo|| null, appsetting?.emittertype|| null, appsetting?.annexcode|| null, appsetting?.printingformat|| null, autosendinvoice, appsetting?.returnpdf|| null, appsetting?.returnxmlsunat|| null, appsetting?.returnxml|| null, appsetting?.token|| null, appsetting?.sunaturl|| null, appsetting?.sunatusername|| null, appsetting?.xmlversion|| null, appsetting?.ublversion|| null, clientdoctype, clientdocnumber, clientbusinessname, clientfiscaladdress, clientcountry, clientmail, documenttype, invoicedata?.CodigoOperacionSunat|| null, invoiceduedate, invoicepurchaseorder, invoicecomments, clientcredittype, appsetting?.detractioncode|| null, appsetting?.detraction|| null, appsetting?.detractionaccount);

                                    return response.json({
                                        code: '',
                                        data: null,
                                        error: false,
                                        message: 'successinvoiced',
                                        success: true
                                    });
                                }
                                else {
                                    await invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, 'ERROR', requestSendToSunat.data.operationMessage, null, null, null, null, null, null, appsetting?.ruc|| null, appsetting?.businessname|| null, appsetting?.tradename|| null, appsetting?.fiscaladdress|| null, appsetting?.ubigeo|| null, appsetting?.emittertype|| null, appsetting?.annexcode|| null, appsetting?.printingformat|| null, autosendinvoice, appsetting?.returnpdf|| null, appsetting?.returnxmlsunat|| null, appsetting?.returnxml|| null, appsetting?.token|| null, appsetting?.sunaturl|| null, appsetting?.sunatusername|| null, appsetting?.xmlversion|| null, appsetting?.ublversion|| null, clientdoctype, clientdocnumber, clientbusinessname, clientfiscaladdress, clientcountry, clientmail, documenttype, invoicedata?.CodigoOperacionSunat|| null, invoiceduedate, invoicepurchaseorder, invoicecomments, clientcredittype, appsetting?.detractioncode|| null, appsetting?.detraction|| null, appsetting?.detractionaccount);

                                    if ((clientcountry === 'PE' && clientdoctype === '6') || (clientcountry !== 'PE' && clientdoctype === '0')) {
                                        await getCorrelativeNumber(corpid, orgid, invoiceResponse.invoiceid, 'INVOICEERROR');
                                    }
            
                                    if ((clientcountry === 'PE') && (clientdoctype === '1' || clientdoctype === '4' || clientdoctype === '7')) {
                                        await getCorrelativeNumber(corpid, orgid, invoiceResponse.invoiceid, 'TICKETERROR');
                                    }

                                    return response.status(403).json({ error: true, success: false, code: '', message: 'createdbutnotinvoiced' });
                                }
                            }
                            catch (error) {
                                await invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, 'ERROR', error.message, null, null, null, null, null, null, appsetting?.ruc|| null, appsetting?.businessname|| null, appsetting?.tradename|| null, appsetting?.fiscaladdress|| null, appsetting?.ubigeo|| null, appsetting?.emittertype|| null, appsetting?.annexcode|| null, appsetting?.printingformat|| null, autosendinvoice, appsetting?.returnpdf|| null, appsetting?.returnxmlsunat|| null, appsetting?.returnxml|| null, appsetting?.token|| null, appsetting?.sunaturl|| null, appsetting?.sunatusername|| null, appsetting?.xmlversion|| null, appsetting?.ublversion|| null, clientdoctype, clientdocnumber, clientbusinessname, clientfiscaladdress, clientcountry, clientmail, documenttype, null, invoiceduedate, invoicepurchaseorder, invoicecomments, clientcredittype, null, null, null);

                                return response.status(403).json({ error: true, success: false, code: '', message: 'createdbutnotinvoiced' });
                            }
                        }
                        else {
                            await invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, 'ERROR', 'Correlative not found', null, null, null, null, null, null, appsetting?.ruc|| null, appsetting?.businessname|| null, appsetting?.tradename|| null, appsetting?.fiscaladdress|| null, appsetting?.ubigeo|| null, appsetting?.emittertype|| null, appsetting?.annexcode|| null, appsetting?.printingformat|| null, autosendinvoice, appsetting?.returnpdf|| null, appsetting?.returnxmlsunat|| null, appsetting?.returnxml|| null, appsetting?.token|| null, appsetting?.sunaturl|| null, appsetting?.sunatusername|| null, appsetting?.xmlversion|| null, appsetting?.ublversion|| null, clientdoctype, clientdocnumber, clientbusinessname, clientfiscaladdress, clientcountry, clientmail, documenttype, null, invoiceduedate, invoicepurchaseorder, invoicecomments, clientcredittype, null, null, null);

                            return response.status(403).json({ error: true, success: false, code: '', message: 'correlativenotfound' });
                        }
                    }
                    else {
                        return response.status(403).json({ error: true, success: false, code: '', message: 'errorcreatinginvoice' });
                    }
                }
                else {
                    return response.status(403).json({ error: true, success: false, code: '', message: 'appsettingnotfound' });
                }
            }
            else {
                return response.status(403).json({ error: true, success: false, code: '', message: 'productdetailnotfound' });
            }
        }
        else {
            return response.status(403).json({ error: true, success: false, code: '', message: 'corporationnotfound' });
        }
    } catch (error) {
        return response.status(500).json({ error: true, success: false, code: '', message: "generalproblem" });
    }
};

exports.createCreditNote = async (request, response) => {
    const { userid, usr } = request.user;
    const { corpid, orgid, invoiceid, creditnotetype, creditnotemotive, creditnotediscount } = request.body;

    try {
        const invoice = await getInvoice(corpid, orgid, userid, invoiceid);

        if (invoice) {
            if (invoice.type === 'INVOICE' && invoice.invoicestatus === 'INVOICED' && (invoice.invoicetype === '01' || invoice.invoicetype === '03')) {
                const appsetting = await getAppSetting();

                if (appsetting) {
                    const invoiceDate = new Date().toISOString().split('T')[0];

                    const invoiceResponse = await createInvoice(invoice.corpid, invoice.orgid, 0, `NOTA DE CREDITO: ${invoice.description}`, invoice.status, 'CREDITNOTE', appsetting.ruc, appsetting.businessname, appsetting.tradename, appsetting.fiscaladdress, appsetting.ubigeo, appsetting.emittertype, appsetting.annexcode, appsetting.printingformat, appsetting.xmlversion, appsetting.ublversion, invoice.receiverdoctype, invoice.receiverdocnum, invoice.receiverbusinessname, invoice.receiverfiscaladdress, invoice.receivercountry, invoice.receivermail, '07', invoice.sunatopecode, null, null, `NOTA DE CREDITO: ${invoice.concept}`, invoiceDate, invoiceDate, creditnotetype === '01' ? invoice.subtotal : parseFloat(creditnotediscount), invoice.taxes, creditnotetype === '01' ? invoice.totalamount : (parseFloat(creditnotediscount) * (appsetting.igv + 1)), invoice.currency, invoice.exchangerate, 'PENDING', null, invoice.purchaseorder, null, null, null, invoice.comments, invoice.credittype, creditnotetype, creditnotemotive, parseFloat(creditnotediscount), null, null, usr, invoice.invoiceid, invoice.netamount, 'NONE', false);

                    if (invoiceResponse) {
                        var invoicecorrelative = null;

                        if (invoice.invoicetype == '01') {
                            invoicecorrelative = await getCorrelativeNumber(corpid, orgid, invoiceResponse.invoiceid, 'CREDITINVOICE');
                        }
                        else {
                            invoicecorrelative = await getCorrelativeNumber(corpid, orgid, invoiceResponse.invoiceid, 'CREDITTICKET');
                        }

                        if (invoicecorrelative) {
                            try {
                                var invoicedata = {
                                    CodigoAnexoEmisor: appsetting.annexcode,
                                    CodigoFormatoImpresion: appsetting.printingformat,
                                    CodigoMoneda: invoice.currency,
                                    Username: appsetting.sunatusername,
                                    TipoDocumento: '07',
                                    TipoRucEmisor: appsetting.emittertype,
                                    CodigoRucReceptor: invoice.receiverdoctype,
                                    CodigoUbigeoEmisor: appsetting.ubigeo,
                                    EnviarSunat: invoice.sendtosunat,
                                    FechaEmision: invoiceDate,
                                    MailEnvio: invoice.receivermail,
                                    MontoTotal: Math.round(((creditnotetype === '01' ? invoice.totalamount : parseFloat(parseFloat(creditnotediscount) * (appsetting.igv + 1))) + Number.EPSILON) * 100) / 100,
                                    NombreComercialEmisor: appsetting.tradename,
                                    RazonSocialEmisor: appsetting.businessname,
                                    RazonSocialReceptor: invoice.receiverbusinessname,
                                    CorrelativoDocumento: zeroPad(invoicecorrelative.p_correlative, 8),
                                    RucEmisor: appsetting.ruc,
                                    NumeroDocumentoReceptor: invoice.receiverdocnum,
                                    NumeroSerieDocumento: invoice.invoicetype === '01' ? appsetting.invoicecreditserie : appsetting.ticketcreditserie,
                                    RetornaPdf: appsetting.returnpdf,
                                    RetornaXmlSunat: appsetting.returnxmlsunat,
                                    RetornaXml: appsetting.returnxml,
                                    TipoCambio: invoice.currency === 'USD' ? invoice.exchangerate : '1.000',
                                    Token: appsetting.token,
                                    DireccionFiscalEmisor: appsetting.fiscaladdress,
                                    DireccionFiscalReceptor: invoice.receiverfiscaladdress,
                                    VersionXml: appsetting.xmlversion,
                                    VersionUbl: appsetting.ublversion,
                                    Endpoint: appsetting.sunaturl,
                                    PaisRecepcion: invoice.receivercountry,
                                    CodigoOperacionSunat: invoice.sunatopecode,
                                    MontoTotalGravado: creditnotetype === '01' ? (invoice.receivercountry === 'PE' ? Math.round((invoice.subtotal + Number.EPSILON) * 100) / 100 : null) : (invoice.receivercountry === 'PE' ? Math.round((parseFloat(creditnotediscount) + Number.EPSILON) * 100) / 100 : null),
                                    MontoTotalInafecto: creditnotetype === '01' ? (invoice.receivercountry === 'PE' ? '0' : Math.round((invoice.subtotal + Number.EPSILON) * 100) / 100) : (invoice.receivercountry === 'PE' ? '0' : Math.round((parseFloat(creditnotediscount) * (appsetting.igv + 1) + Number.EPSILON) * 100) / 100),
                                    MontoTotalIgv: creditnotetype === '01' ? (invoice.receivercountry === 'PE' ? Math.round((invoice.taxes + Number.EPSILON) * 100) / 100 : null) : (invoice.receivercountry === 'PE' ? Math.round((parseFloat(creditnotediscount) * appsetting.igv + Number.EPSILON) * 100) / 100 : null),
                                    TipoNotaCredito: creditnotetype,
                                    MotivoNotaCredito: creditnotemotive,
                                    CodigoDocumentoNotaCredito: invoice.invoicetype,
                                    NumeroSerieNotaCredito: invoice.serie,
                                    NumeroCorrelativoNotaCredito: zeroPad(invoice.correlative, 8),
                                    FechaEmisionNotaCredito: invoice.invoicedate,
                                    ProductList: []
                                }

                                const invoicedetail = await getInvoiceDetail(corpid, orgid, userid, invoice.invoiceid);

                                if (creditnotetype === '01') {
                                    invoicedetail.forEach(async data => {
                                        var invoicedetaildata = {
                                            CantidadProducto: data.quantity,
                                            CodigoProducto: data.productcode,
                                            TipoVenta: data.saletype,
                                            UnidadMedida: data.measureunit,
                                            IgvTotal: Math.round((data.totaligv + Number.EPSILON) * 100) / 100,
                                            MontoTotal: Math.round((data.totalamount + Number.EPSILON) * 100) / 100,
                                            TasaIgv: data.igvrate * 100,
                                            PrecioProducto: Math.round((data.productprice + Number.EPSILON) * 100) / 100,
                                            DescripcionProducto: data.productdescription,
                                            PrecioNetoProducto: data.productnetprice,
                                            ValorNetoProducto: Math.round((data.productnetworth + Number.EPSILON) * 100) / 100,
                                            AfectadoIgv: invoice.receivercountry === 'PE' ? '10' : '40',
                                            TributoIgv: invoice.receivercountry === 'PE' ? '1000' : '9998',
                                        };
    
                                        invoicedata.ProductList.push(invoicedetaildata);
                                    });
                                }
                                else {
                                    var invoicedetaildata = {
                                        CantidadProducto: '1',
                                        CodigoProducto: invoicedetail[0].productcode,
                                        TipoVenta: invoicedetail[0].saletype,
                                        UnidadMedida: invoicedetail[0].measureunit,
                                        IgvTotal: invoice.receivercountry === 'PE' ? Math.round((parseFloat(creditnotediscount) * appsetting.igv + Number.EPSILON) * 100) / 100 : 0,
                                        MontoTotal: Math.round(((parseFloat(creditnotediscount) * (appsetting.igv + 1)) + Number.EPSILON) * 100) / 100,
                                        TasaIgv: invoice.receivercountry === 'PE' ? appsetting.igv * 100 : 0,
                                        PrecioProducto: Math.round(((parseFloat(creditnotediscount) * (appsetting.igv + 1)) + Number.EPSILON) * 100) / 100,
                                        DescripcionProducto: `DISCOUNT: ${creditnotemotive}`,
                                        PrecioNetoProducto: invoice.receivercountry === 'PE' ? (Math.round((parseFloat(creditnotediscount) + Number.EPSILON) * 100) / 100) : (Math.round(((parseFloat(creditnotediscount) * (appsetting.igv + 1)) + Number.EPSILON) * 100) / 100),
                                        ValorNetoProducto: invoice.receivercountry === 'PE' ? (Math.round((parseFloat(creditnotediscount) + Number.EPSILON) * 100) / 100) : (Math.round(((parseFloat(creditnotediscount) * (appsetting.igv + 1)) + Number.EPSILON) * 100) / 100),
                                        AfectadoIgv: invoice.receivercountry === 'PE' ? '10' : '40',
                                        TributoIgv: invoice.receivercountry === 'PE' ? '1000' : '9998',
                                    };

                                    invoicedata.ProductList.push(invoicedetaildata);
                                }

                                const requestSendToSunat = await axios({
                                    data: invoicedata,
                                    method: 'post',
                                    url: `${bridgeEndpoint}processmifact/sendinvoice`
                                });

                                if (requestSendToSunat.data.result) {
                                    await invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, 'INVOICED', null, requestSendToSunat.data.result.cadenaCodigoQr, requestSendToSunat.data.result.codigoHash, requestSendToSunat.data.result.urlCdrSunat, requestSendToSunat.data.result.urlPdf, requestSendToSunat.data.result.urlXml, invoicedata.NumeroSerieDocumento, appsetting.ruc, appsetting.businessname, appsetting.tradename, appsetting.fiscaladdress, appsetting.ubigeo, appsetting.emittertype, appsetting.annexcode, appsetting.printingformat, invoice.sendtosunat, invoice.returnpdf, invoice.returnxmlsunat, invoice.returnxml, appsetting.token, appsetting.sunaturl, appsetting.sunatusername, appsetting.xmlversion, appsetting.ublversion, invoice.receiverdoctype, invoice.receiverdocnum, invoice.receiverbusinessname, invoice.receiverfiscaladdress, invoice.receivercountry, invoice.receivermail, '07', invoice.sunatopecode, invoiceDate, invoice.purchaseorder, invoice.comments, invoice.credittype, null, null, null);

                                    if (creditnotetype === '01') {
                                        await changeInvoiceStatus(corpid, orgid, invoiceid, 'CANCELED', usr)
                                    }

                                    return response.json({
                                        code: '',
                                        data: null,
                                        error: false,
                                        message: 'successinvoiced',
                                        success: true
                                    });
                                }
                                else {
                                    await invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, 'ERROR', requestSendToSunat.data.operationMessage, null, null, null, null, null, null, appsetting.ruc, appsetting.businessname, appsetting.tradename, appsetting.fiscaladdress, appsetting.ubigeo, appsetting.emittertype, appsetting.annexcode, appsetting.printingformat, invoice.sendtosunat, invoice.returnpdf, invoice.returnxmlsunat, invoice.returnxml, appsetting.token, appsetting.sunaturl, appsetting.sunatusername, appsetting.xmlversion, appsetting.ublversion, invoice.receiverdoctype, invoice.receiverdocnum, invoice.receiverbusinessname, invoice.receiverfiscaladdress, invoice.receivercountry, invoice.receivermail, '07', invoice.sunatopecode, invoiceDate, invoice.purchaseorder, invoice.comments, invoice.credittype, null, null, null);

                                    if (invoice.invoicetype == '01') {
                                        invoicecorrelative = await getCorrelativeNumber(corpid, orgid, invoiceResponse.invoiceid, 'CREDITINVOICEERROR');
                                    }
                                    else {
                                        invoicecorrelative = await getCorrelativeNumber(corpid, orgid, invoiceResponse.invoiceid, 'CREDITTICKETERROR');
                                    }

                                    return response.status(403).json({ error: true, success: false, code: '', message: 'createdbutnotinvoiced' });
                                }
                            }
                            catch (error) {
                                await invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, 'ERROR', error.message, null, null, null, null, null, null, appsetting.ruc, appsetting.businessname, appsetting.tradename, appsetting.fiscaladdress, appsetting.ubigeo, appsetting.emittertype, appsetting.annexcode, appsetting.printingformat, invoice.sendtosunat, invoice.returnpdf, invoice.returnxmlsunat, invoice.returnxml, appsetting.token, appsetting.sunaturl, appsetting.sunatusername, appsetting.xmlversion, appsetting.ublversion, invoice.receiverdoctype, invoice.receiverdocnum, invoice.receiverbusinessname, invoice.receiverfiscaladdress, invoice.receivercountry, invoice.receivermail, '07', invoice.sunatopecode, invoiceDate, invoice.purchaseorder, invoice.comments, invoice.credittype, null, null, null);

                                if (invoice.invoicetype == '01') {
                                    invoicecorrelative = await getCorrelativeNumber(corpid, orgid, invoiceResponse.invoiceid, 'CREDITINVOICEERROR');
                                }
                                else {
                                    invoicecorrelative = await getCorrelativeNumber(corpid, orgid, invoiceResponse.invoiceid, 'CREDITTICKETERROR');
                                }

                                return response.status(403).json({ error: true, success: false, code: '', message: 'createdbutnotinvoiced' });
                            }
                        }
                        else {
                            await invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, 'ERROR', 'Correlative not found', null, null, null, null, null, null, appsetting.ruc, appsetting.businessname, appsetting.tradename, appsetting.fiscaladdress, appsetting.ubigeo, appsetting.emittertype, appsetting.annexcode, appsetting.printingformat, invoice.sendtosunat, invoice.returnpdf, invoice.returnxmlsunat, invoice.returnxml, appsetting.token, appsetting.sunaturl, appsetting.sunatusername, appsetting.xmlversion, appsetting.ublversion, invoice.receiverdoctype, invoice.receiverdocnum, invoice.receiverbusinessname, invoice.receiverfiscaladdress, invoice.receivercountry, invoice.receivermail, '07', invoice.sunatopecode, invoiceDate, invoice.purchaseorder, invoice.comments, invoice.credittype, null, null, null);

                            return response.status(403).json({ error: true, success: false, code: '', message: 'correlativenotfound' });
                        }
                    }
                    else {
                        return response.status(403).json({ error: true, success: false, code: '', message: 'errorcreatinginvoice' });
                    }
                }
                else {
                    return response.status(403).json({ error: true, success: false, code: '', message: 'appsettingnotfound' });
                }
            }
            else {
                return response.status(403).json({ error: true, success: false, code: '', message: 'invoicenotmatch' });
            }
        }
        else {
            return response.status(403).json({ error: true, success: false, code: '', message: 'invoicenotfound' });
        }
    } catch (error) {
        return response.status(500).json({ error: true, success: false, code: '', message: "generalproblem" });
    }
};

exports.regularizeInvoice = async (request, response) => {
    const { userid, usr } = request.user;
    const { corpid, orgid, invoiceid, invoicereferencefile, invoicepaymentnote, invoicepaymentcommentary } = request.body;

    try {
        await changePaymentInvoice(corpid, orgid, invoiceid, 'PAID', invoicepaymentnote, invoicereferencefile, invoicepaymentcommentary, usr);

        return response.json({
            code: '',
            data: null,
            error: false,
            message: 'success',
            success: true
        });
    } catch (error) {
        return response.status(500).json({ error: true, success: false, code: '', message: "generalproblem" });
    }
};

exports.getExchangeRate = async (request, response) => {
    const { userid, usr } = request.user;

    try {
        var lastExchange = await getLastExchange();

        return response.json({
            code: '',
            exchangerate: lastExchange,
            error: false,
            message: 'success',
            success: true
        });
    } catch (error) {
        return response.status(500).json({ error: true, success: false, code: '', message: "generalproblem" });
    }
};

exports.createBalance = async (req, res) => {
    const { userid, usr } = req.user;
    const { invoiceid, settings, token, metadata = {}, corpid, orgid, reference, buyamount, totalamount, comments, purchaseorder, totalpay } = req.body;

    try {
        const corp = await getCorporation(corpid);
        const org = await getOrganization(corpid, orgid);

        var correctcorrelative = false;
        var proceedpayment = false;
        var billbyorg = false;

        if (corp) {
            if (corp.billbyorg) {
                billbyorg = true;

                if (org) {
                    if (org.docnum && org.doctype && org.businessname && org.fiscaladdress && org.sunatcountry) {
                        if ((org.sunatcountry === 'PE' && org.doctype === '6') || (org.sunatcountry !== 'PE' && org.doctype === '0')) {
                            correctcorrelative = true;
                        }

                        if ((org.sunatcountry === 'PE') && (org.doctype === '1' || org.doctype === '4' || org.doctype === '7')) {
                            correctcorrelative = true;
                        }

                        if (correctcorrelative) {
                            proceedpayment = true;
                        }
                        else {
                            return res.status(403).json({ error: true, success: false, code: '', message: 'Could not match correlative. Check organization configuration' });
                        }
                    }
                    else {
                        return res.status(403).json({ error: true, success: false, code: '', message: 'Organization missing parameters' });
                    }
                }
                else {
                    return res.status(403).json({ error: true, success: false, code: '', message: 'Organization not found' });
                }
            }
            else {
                billbyorg = false;

                if (corp.docnum && corp.doctype && corp.businessname && corp.fiscaladdress && corp.sunatcountry) {
                    if ((corp.sunatcountry === 'PE' && corp.doctype === '6') || (corp.sunatcountry !== 'PE' && corp.doctype === '0')) {
                        correctcorrelative = true;
                    }
                
                    if ((corp.sunatcountry === 'PE') && (corp.doctype === '1' || corp.doctype === '4' || corp.doctype === '7')) {
                        correctcorrelative = true;
                    }

                    if (correctcorrelative) {
                        proceedpayment = true;
                    }
                    else {
                        return res.status(403).json({ error: true, success: false, code: '', message: 'Could not match correlative. Check corporation configuration' });
                    }
                }
                else {
                    return res.status(403).json({ error: true, success: false, code: '', message: 'Corporation missing parameters' });
                }
            }

            if (proceedpayment) {
                if ((Math.round((totalpay * 100 + Number.EPSILON) * 100) / 100) === settings.amount) {
                    const appsetting = await getAppSetting();
                    const userprofile = await getUserProfile(userid);

                    if (userprofile && appsetting) {
                        metadata.corpid = (corpid || '');
                        metadata.corporation = removeAccent(corp.description || '');
                        metadata.orgid = (orgid || '');
                        metadata.organization = removeAccent(org?.orgdesc || '');
                        metadata.document = ((billbyorg ? org.docnum : corp.docnum) || '');
                        metadata.businessname = removeAccent((billbyorg ? org.businessname : corp.businessname) || '');
                        metadata.invoiceid = '';
                        metadata.seriecode = '';
                        metadata.emissiondate = new Date().toISOString().split('T')[0];
                        metadata.user = removeAccent(usr || '');
                        metadata.reference = removeAccent(reference || '');
    
                        const charge = await createCharge(userprofile, settings, token, metadata, appsetting.privatekey);

                        if (charge.object === 'error') {
                            return res.status(400).json({
                                data: {
                                    code: charge.code,
                                    id: charge.charge_id,
                                    message: charge.user_message,
                                    object: charge.object
                                },
                                error: true,
                                success: false
                            });
                        }
                        else {
                            var balanceResponse = await createBalanceData(corpid, orgid, 0, reference, 'ACTIVO', 'GENERAL', null, null, (totalamount || buyamount), ((org?.balance || 0) + (totalamount || buyamount)), billbyorg ? org.doctype : corp.doctype, billbyorg ? org.docnum : corp.docnum, 'PAID', new Date().toISOString().split('T')[0], usr, usr);

                            if (balanceResponse) {
                                var lastExchange = await getLastExchange();

                                var invoicesubtotal = 0;
                                var invoicetaxes = 0;
                                var invoicetotalcharge = 0;

                                var producthasigv = '';
                                var productigvtribute = '';
                                var producttotaligv = 0;
                                var producttotalamount = 0;
                                var productigvrate = 0;
                                var productprice = 0;
                                var productnetprice = 0;
                                var productnetworth = 0;

                                if (billbyorg ? org.doctype !== '0' : org.doctype !== '0') {
                                    invoicesubtotal = buyamount;
                                    invoicetaxes = appsetting.igv * buyamount;
                                    invoicetotalcharge = (appsetting.igv * buyamount) + buyamount;

                                    producthasigv = '10';
                                    productigvtribute = '1000';
                                    producttotaligv = appsetting.igv * buyamount;
                                    producttotalamount = (appsetting.igv * buyamount) + buyamount;
                                    productigvrate = appsetting.igv;
                                    productprice = (appsetting.igv * buyamount) + buyamount;
                                    productnetprice = buyamount;
                                    productnetworth = buyamount;
                                }
                                else {
                                    invoicesubtotal = buyamount;
                                    invoicetaxes = 0;
                                    invoicetotalcharge = buyamount;

                                    producthasigv = '40';
                                    productigvtribute = '9998';
                                    producttotaligv = 0;
                                    producttotalamount = buyamount;
                                    productigvrate = 0;
                                    productprice = buyamount;
                                    productnetprice = buyamount;
                                    productnetworth = buyamount;
                                }

                                var invoiceResponse = await createInvoice(corpid, orgid, 0, reference, 'ACTIVO', 'INVOICE', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, new Date().toISOString().split('T')[0], null, invoicesubtotal, invoicetaxes, invoicetotalcharge, 'USD', lastExchange, 'PENDING', null, purchaseorder, null, null, null, comments, 'typecredit_alcontado', null, null, null, null, null, usr, null, buyamount, 'PAID', false);

                                if (invoiceResponse) {
                                    await changeBalanceInvoice(corpid, orgid, balanceResponse.balanceid, invoiceResponse.invoiceid, usr);

                                    await createInvoiceDetail(corpid, orgid, invoiceResponse.invoiceid, `Carga de Salgo ${new Date().toISOString().split('T')[0]}`, 'ACTIVO', 'NINGUNO', 1, 'S001', producthasigv, '10', productigvtribute, 'ZZ', producttotaligv, producttotalamount, productigvrate, productprice, `Carga de Salgo ${new Date().toISOString().split('T')[0]}`, productnetprice, productnetworth, parseFloat(buyamount), usr);

                                    const chargequery = "UFN_CHARGE_INS";
                                    const chargebind = {
                                        amount: settings.amount / 100,
                                        capture: true,
                                        chargejson: charge,
                                        chargetoken: charge.id,
                                        corpid: corpid,
                                        currency: settings.currency,
                                        description: settings.description,
                                        email: token.email,
                                        id: null,
                                        invoiceid: invoiceResponse.invoiceid,
                                        orderid: null,
                                        orderjson: null,
                                        orgid: orgid,
                                        operation: 'INSERT',
                                        paidby: usr,
                                        status: 'PAID',
                                        tokenid: token.id,
                                        tokenjson: token,
                                        type: charge.object
                                    }

                                    const chargeresult = await triggerfunctions.executesimpletransaction(chargequery, chargebind);

                                    const invoicequery = "UFN_INVOICE_PAYMENT";
                                    const invoicebind = {
                                        capture: true,
                                        chargeid: chargeresult[0].chargeid,
                                        chargejson: charge,
                                        chargetoken: charge.id,
                                        corpid: corpid,
                                        email: token.email,
                                        invoiceid: invoiceResponse.invoiceid,
                                        orgid: orgid,
                                        paidby: usr,
                                        tokenid: token.id,
                                        tokenjson: token,
                                        culqiamount: (settings.amount / 100)
                                    }
                                
                                    const invoiceresult = await triggerfunctions.executesimpletransaction(invoicequery, invoicebind);

                                    var invoicecorrelative = null;
                                    var documenttype = null;

                                    if (corp.billbyorg) {
                                        if ((org.sunatcountry === 'PE' && org.doctype === '6') || (org.sunatcountry !== 'PE' && org.doctype === '0')) {
                                            invoicecorrelative = await getCorrelativeNumber(corpid, orgid, invoiceResponse.invoiceid, 'INVOICE');
                                            documenttype = '01';
                                        }
                                    
                                        if ((org.sunatcountry === 'PE') && (org.doctype === '1' || org.doctype === '4' || org.doctype === '7')) {
                                            invoicecorrelative = await getCorrelativeNumber(corpid, orgid, invoiceResponse.invoiceid, 'TICKET');
                                            documenttype = '03'
                                        }
                                    }
                                    else {
                                        if ((corp.sunatcountry === 'PE' && corp.doctype === '6') || (corp.sunatcountry !== 'PE' && corp.doctype === '0')) {
                                            invoicecorrelative = await getCorrelativeNumber(corpid, orgid, invoiceResponse.invoiceid, 'INVOICE');
                                            documenttype = '01';
                                        }
                                    
                                        if ((corp.sunatcountry === 'PE') && (corp.doctype === '1' || corp.doctype === '4' || corp.doctype === '7')) {
                                            invoicecorrelative = await getCorrelativeNumber(corpid, orgid, invoiceResponse.invoiceid, 'TICKET');
                                            documenttype = '03'
                                        }
                                    }

                                    if (invoicecorrelative) {
                                        try {
                                            var invoicedata = {
                                                CodigoAnexoEmisor: appsetting.annexcode,
                                                CodigoFormatoImpresion: appsetting.printingformat,
                                                CodigoMoneda: 'USD',
                                                Username: appsetting.sunatusername,
                                                TipoDocumento: documenttype,
                                                TipoRucEmisor: appsetting.emittertype,
                                                CodigoRucReceptor: billbyorg ? org.doctype : corp.doctype,
                                                CodigoUbigeoEmisor: appsetting.ubigeo,
                                                EnviarSunat: billbyorg ? org.autosendinvoice : corp.autosendinvoice,
                                                FechaEmision: new Date().toISOString().split('T')[0],
                                                FechaVencimiento: new Date().toISOString().split('T')[0],
                                                MailEnvio: billbyorg ? org.contactemail : corp.contactemail,
                                                MontoTotal: Math.round((invoicetotalcharge + Number.EPSILON) * 100) / 100,
                                                NombreComercialEmisor: appsetting.tradename,
                                                RazonSocialEmisor: appsetting.businessname,
                                                RazonSocialReceptor: billbyorg ? org.businessname : corp.businessname,
                                                CorrelativoDocumento: zeroPad(invoicecorrelative.p_correlative, 8),
                                                RucEmisor: appsetting.ruc,
                                                NumeroDocumentoReceptor: billbyorg ? org.docnum : corp.docnum,
                                                NumeroSerieDocumento: documenttype === '01' ? appsetting.invoiceserie : appsetting.ticketserie,
                                                RetornaPdf: appsetting.returnpdf,
                                                RetornaXmlSunat: appsetting.returnxmlsunat,
                                                RetornaXml: appsetting.returnxml,
                                                TipoCambio: lastExchange,
                                                Token: appsetting.token,
                                                DireccionFiscalEmisor: appsetting.fiscaladdress,
                                                DireccionFiscalReceptor: billbyorg ? org.fiscaladdress : corp.fiscaladdress,
                                                VersionXml: appsetting.xmlversion,
                                                VersionUbl: appsetting.ublversion,
                                                Endpoint: appsetting.sunaturl,
                                                PaisRecepcion: billbyorg ? org.sunatcountry : corp.sunatcountry,
                                                ProductList: [],
                                                DataList: []
                                            }

                                            if (billbyorg) {
                                                invoicedata.CodigoOperacionSunat = org.sunatcountry === 'PE' ? appsetting.operationcodeperu : appsetting.operationcodeother;
                                                invoicedata.MontoTotalGravado = org.sunatcountry === 'PE' ? Math.round((invoicesubtotal + Number.EPSILON) * 100) / 100 : null;
                                                invoicedata.MontoTotalInafecto = org.sunatcountry === 'PE' ? '0' : Math.round((invoicesubtotal + Number.EPSILON) * 100) / 100;
                                                invoicedata.MontoTotalIgv = org.sunatcountry === 'PE' ? Math.round((invoicetaxes + Number.EPSILON) * 100) / 100 : null;
                                            }
                                            else {
                                                invoicedata.CodigoOperacionSunat = corp.sunatcountry === 'PE' ? appsetting.operationcodeperu : appsetting.operationcodeother;
                                                invoicedata.MontoTotalGravado = corp.sunatcountry === 'PE' ? Math.round((invoicesubtotal + Number.EPSILON) * 100) / 100 : null;
                                                invoicedata.MontoTotalInafecto = corp.sunatcountry === 'PE' ? '0' : Math.round((invoicesubtotal + Number.EPSILON) * 100) / 100;
                                                invoicedata.MontoTotalIgv = corp.sunatcountry === 'PE' ? Math.round((invoicetaxes + Number.EPSILON) * 100) / 100 : null;
                                            }

                                            var calcdetraction = false;

                                            if (corp.billbyorg) {
                                                if (org.sunatcountry === 'PE') {
                                                    calcdetraction = true;
                                                }
                                            }
                                            else {
                                                if (corp.sunatcountry === 'PE') {
                                                    calcdetraction = true;
                                                }
                                            }

                                            if (calcdetraction) {
                                                if (appsetting.detraction && appsetting.detractioncode && appsetting.detractionaccount && (appsetting.detractionminimum || appsetting.detractionminimum === 0)) {
                                                    var compareamount = 0;
                                                
                                                    if (appsetting.detractionminimum) {
                                                        compareamount = invoicetotalcharge * lastExchange;
                                                    }

                                                    if (compareamount > appsetting.detractionminimum) {
                                                        invoicedata.MontoTotalDetraccion = Math.round(((invoicetotalcharge * appsetting.detraction) + Number.EPSILON) * 100) / 100;
                                                        invoicedata.PorcentajeTotalDetraccion = appsetting.detraction * 100;
                                                        invoicedata.NumeroCuentaDetraccion = appsetting.detractionaccount;
                                                        invoicedata.CodigoDetraccion = appsetting.detractioncode;
                                                    
                                                        var adicional02 = {
                                                            CodigoDatoAdicional: '06',
                                                            DescripcionDatoAdicional: 'CUENTA DE DETRACCION: ' + appsetting.detractionaccount
                                                        }
                                                    
                                                        invoicedata.DataList.push(adicional02);
                                                    }
                                                }
                                            }

                                            var adicional01 = {
                                                CodigoDatoAdicional: '05',
                                                DescripcionDatoAdicional: 'FORMA DE PAGO: TRANSFERENCIA'
                                            }
                                        
                                            invoicedata.DataList.push(adicional01);

                                            if (purchaseorder) {
                                                var adicional03 = {
                                                    CodigoDatoAdicional: '15',
                                                    DescripcionDatoAdicional: purchaseorder
                                                }
                                            
                                                invoicedata.DataList.push(adicional03);
                                            }
                                        
                                            if (comments) {
                                                var adicional04 = {
                                                    CodigoDatoAdicional: '07',
                                                    DescripcionDatoAdicional: comments
                                                }
                                            
                                                invoicedata.DataList.push(adicional04);
                                            }

                                            var adicional05 = {
                                                CodigoDatoAdicional: '01',
                                                DescripcionDatoAdicional: 'AL CONTADO'
                                            }

                                            invoicedata.DataList.push(adicional05);

                                            var invoicedetaildata = {
                                                CantidadProducto: 1,
                                                CodigoProducto: 'S001',
                                                TipoVenta: '10',
                                                UnidadMedida: 'ZZ',
                                                IgvTotal: Math.round((producttotaligv + Number.EPSILON) * 100) / 100,
                                                MontoTotal: Math.round((producttotalamount + Number.EPSILON) * 100) / 100,
                                                TasaIgv: productigvrate * 100,
                                                PrecioProducto: Math.round((productprice + Number.EPSILON) * 100) / 100,
                                                DescripcionProducto: `Carga de Salgo ${new Date().toISOString().split('T')[0]}`,
                                                PrecioNetoProducto: Math.round((productnetprice + Number.EPSILON) * 100) / 100,
                                                ValorNetoProducto: Math.round((productnetworth + Number.EPSILON) * 100) / 100,
                                                AfectadoIgv: producthasigv,
                                                TributoIgv: productigvtribute,
                                            };
                                        
                                            invoicedata.ProductList.push(invoicedetaildata);

                                            const requestSendToSunat = await axios({
                                                data: invoicedata,
                                                method: 'post',
                                                url: `${bridgeEndpoint}processmifact/sendinvoice`
                                            });

                                            if (requestSendToSunat.data.result) {
                                                await invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, 'INVOICED', null, requestSendToSunat.data.result.cadenaCodigoQr, requestSendToSunat.data.result.codigoHash, requestSendToSunat.data.result.urlCdrSunat, requestSendToSunat.data.result.urlPdf, requestSendToSunat.data.result.urlXml, invoicedata.NumeroSerieDocumento, appsetting?.ruc|| null, appsetting?.businessname|| null, appsetting?.tradename|| null, appsetting?.fiscaladdress|| null, appsetting?.ubigeo|| null, appsetting?.emittertype|| null, appsetting?.annexcode|| null, appsetting?.printingformat|| null, invoicedata?.EnviarSunat|| null, appsetting?.returnpdf|| null, appsetting?.returnxmlsunat|| null, appsetting?.returnxml|| null, appsetting?.token|| null, appsetting?.sunaturl|| null, appsetting?.sunatusername|| null, appsetting?.xmlversion|| null, appsetting?.ublversion|| null, invoicedata?.CodigoRucReceptor|| null, invoicedata?.NumeroDocumentoReceptor|| null, invoicedata?.RazonSocialReceptor|| null, invoicedata?.DireccionFiscalReceptor|| null, invoicedata?.PaisRecepcion|| null, invoicedata?.MailEnvio|| null, documenttype || null, invoicedata?.CodigoOperacionSunat || null, invoicedata?.FechaVencimiento || null, purchaseorder || null, comments || null, 'typecredit_alcontado'|| null, appsetting?.detractioncode|| null, appsetting?.detraction|| null, appsetting?.detractionaccount);
                                            }
                                            else {
                                                await invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, 'ERROR', requestSendToSunat.data.operationMessage, null, null, null, null, null, null, appsetting?.ruc|| null, appsetting?.businessname|| null, appsetting?.tradename|| null, appsetting?.fiscaladdress|| null, appsetting?.ubigeo|| null, appsetting?.emittertype|| null, appsetting?.annexcode|| null, appsetting?.printingformat|| null, invoicedata?.EnviarSunat|| null, appsetting?.returnpdf|| null, appsetting?.returnxmlsunat|| null, appsetting?.returnxml|| null, appsetting?.token|| null, appsetting?.sunaturl|| null, appsetting?.sunatusername|| null, appsetting?.xmlversion|| null, appsetting?.ublversion|| null, invoicedata?.CodigoRucReceptor|| null, invoicedata?.NumeroDocumentoReceptor|| null, invoicedata?.RazonSocialReceptor|| null, invoicedata?.DireccionFiscalReceptor|| null, invoicedata?.PaisRecepcion|| null, invoicedata?.MailEnvio|| null, documenttype || null, invoicedata?.CodigoOperacionSunat || null, invoicedata?.FechaVencimiento || null, purchaseorder || null, comments || null, 'typecredit_alcontado'|| null, appsetting?.detractioncode|| null, appsetting?.detraction|| null, appsetting?.detractionaccount);
                                            
                                                if (corp.billbyorg) {
                                                    if ((org.sunatcountry === 'PE' && org.doctype === '6') || (org.sunatcountry !== 'PE' && org.doctype === '0')) {
                                                        await getCorrelativeNumber(corpid, orgid, invoiceResponse.invoiceid, 'INVOICEERROR');
                                                    }
                                                
                                                    if ((org.sunatcountry === 'PE') && (org.doctype === '1' || org.doctype === '4' || org.doctype === '7')) {
                                                        await getCorrelativeNumber(corpid, orgid, invoiceResponse.invoiceid, 'TICKETERROR');
                                                    }
                                                }
                                                else {
                                                    if ((corp.sunatcountry === 'PE' && corp.doctype === '6') || (corp.sunatcountry !== 'PE' && corp.doctype === '0')) {
                                                        await getCorrelativeNumber(corpid, orgid, invoiceResponse.invoiceid, 'INVOICEERROR');
                                                    }
                                                
                                                    if ((corp.sunatcountry === 'PE') && (corp.doctype === '1' || corp.doctype === '4' || corp.doctype === '7')) {
                                                        await getCorrelativeNumber(corpid, orgid, invoiceResponse.invoiceid, 'TICKETERROR');
                                                    }
                                                }
                                            }
                                        }
                                        catch (error) {
                                            await invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, 'ERROR', error.message, null, null, null, null, null, null, appsetting.ruc, appsetting.businessname, appsetting.tradename, appsetting.fiscaladdress, appsetting.ubigeo, appsetting.emittertype, appsetting.annexcode, appsetting.printingformat, appsetting.sendtosunat, appsetting.returnpdf, appsetting.returnxmlsunat, appsetting.returnxml, appsetting.token, appsetting.sunaturl, appsetting.sunatusername, appsetting.xmlversion, appsetting.ublversion, billbyorg ? org.doctype : corp.doctype, billbyorg ? org.docnum : corp.docnum, billbyorg ? org.businessname : corp.businessname, billbyorg ? org.fiscaladdress : corp.fiscaladdress, billbyorg ? org.sunatcountry : corp.sunatcountry, billbyorg ? org.contactemail : corp.contactemail, documenttype, null, new Date().toISOString().split('T')[0], purchaseorder, comments, 'typecredit_alcontado', null, null, null);
                                        
                                            if (corp.billbyorg) {
                                                if ((org.sunatcountry === 'PE' && org.doctype === '6') || (org.sunatcountry !== 'PE' && org.doctype === '0')) {
                                                    await getCorrelativeNumber(corpid, orgid, invoiceResponse.invoiceid, 'INVOICEERROR');
                                                }
                                            
                                                if ((org.sunatcountry === 'PE') && (org.doctype === '1' || org.doctype === '4' || org.doctype === '7')) {
                                                    await getCorrelativeNumber(corpid, orgid, invoiceResponse.invoiceid, 'TICKETERROR');
                                                }
                                            }
                                            else {
                                                if ((corp.sunatcountry === 'PE' && corp.doctype === '6') || (corp.sunatcountry !== 'PE' && corp.doctype === '0')) {
                                                    await getCorrelativeNumber(corpid, orgid, invoiceResponse.invoiceid, 'INVOICEERROR');
                                                }
                                            
                                                if ((corp.sunatcountry === 'PE') && (corp.doctype === '1' || corp.doctype === '4' || corp.doctype === '7')) {
                                                    await getCorrelativeNumber(corpid, orgid, invoiceResponse.invoiceid, 'TICKETERROR');
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        await invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, 'ERROR', 'Correlative not found', null, null, null, null, null, null, appsetting.ruc, appsetting.businessname, appsetting.tradename, appsetting.fiscaladdress, appsetting.ubigeo, appsetting.emittertype, appsetting.annexcode, appsetting.printingformat, appsetting.sendtosunat, appsetting.returnpdf, appsetting.returnxmlsunat, appsetting.returnxml, appsetting.token, appsetting.sunaturl, appsetting.sunatusername, appsetting.xmlversion, appsetting.ublversion, billbyorg ? org.doctype : corp.doctype, billbyorg ? org.docnum : corp.docnum, billbyorg ? org.businessname : corp.businessname, billbyorg ? org.fiscaladdress : corp.fiscaladdress, billbyorg ? org.sunatcountry : corp.sunatcountry, billbyorg ? org.contactemail : corp.contactemail, documenttype, null, new Date().toISOString().split('T')[0], purchaseorder, comments, 'typecredit_alcontado', null, null, null);
                                    }

                                    return res.json({
                                        code: charge.outcome.code,
                                        data: {
                                            id: charge.id,
                                            object: charge.object
                                        },
                                        error: false,
                                        message: charge.outcome.user_message,
                                        success: true
                                    });
                                }
                                else {
                                    return res.status(403).json({ error: true, success: false, code: '', message: 'errorcreatinginvoice' });
                                }
                            }
                            else {
                                return res.status(403).json({ error: true, success: false, code: '', message: 'Error creating balance' });
                            }
                        }
                    }
                    else {
                        return res.status(403).json({ error: true, success: false, code: '', message: 'Invalid user' });
                    }
                }
                else {
                    return res.status(403).json({ error: true, success: false, code: '', message: 'Invalid invoice data' });
                }
            }
            else {
                return res.status(403).json({ error: true, success: false, code: '', message: 'There are missing parameters' });
            }
        }
        else {
            return res.status(403).json({ error: true, success: false, code: '', message: 'Corporation not found' });
        }
    } catch (error) {
        if (error.charge_id) {
            return res.status(500).json({ message: error.merchant_message });
        }
        else {
            return res.status(500).json({ message: "There was a problem, please try again later" });
        }
    }
};

exports.emitInvoice = async (req, res) => {
    const { userid, usr } = req.user;
    const { corpid, orgid, invoiceid } = req.body;

    try {
        const invoice = await getInvoice(corpid, orgid, userid, invoiceid);

        if (invoice) {
            if (invoice.invoicestatus !== "INVOICED") {
                const corp = await getCorporation(corpid);
                const org = await getOrganization(corpid, orgid);

                var correctcorrelative = false;
                var proceedpayment = false;
                var billbyorg = false;

                if (corp) {
                    if (corp.billbyorg) {
                        billbyorg = corp.billbyorg;

                        if (org) {
                            if (org.docnum && org.doctype && org.businessname && org.fiscaladdress && org.sunatcountry) {
                                if ((org.sunatcountry === 'PE' && org.doctype === '6') || (org.sunatcountry !== 'PE' && org.doctype === '0')) {
                                    correctcorrelative = true;
                                }
        
                                if ((org.sunatcountry === 'PE') && (org.doctype === '1' || org.doctype === '4' || org.doctype === '7')) {
                                    correctcorrelative = true;
                                }
        
                                if (correctcorrelative) {
                                    proceedpayment = true;
                                }
                                else {
                                    return res.status(403).json({ error: true, success: false, code: '', message: 'Could not match correlative. Check organization configuration' });
                                }
                            }
                            else {
                                return res.status(403).json({ error: true, success: false, code: '', message: 'Organization missing parameters' });
                            }
                        }
                        else {
                            return res.status(403).json({ error: true, success: false, code: '', message: 'Organization not found' });
                        }
                    }
                    else {
                        if (corp.docnum && corp.doctype && corp.businessname && corp.fiscaladdress && corp.sunatcountry) {
                            if ((corp.sunatcountry === 'PE' && corp.doctype === '6') || (corp.sunatcountry !== 'PE' && corp.doctype === '0')) {
                                correctcorrelative = true;
                            }
                        
                            if ((corp.sunatcountry === 'PE') && (corp.doctype === '1' || corp.doctype === '4' || corp.doctype === '7')) {
                                correctcorrelative = true;
                            }
        
                            if (correctcorrelative) {
                                proceedpayment = true;
                            }
                            else {
                                return res.status(403).json({ error: true, success: false, code: '', message: 'Could not match correlative. Check corporation configuration' });
                            }
                        }
                        else {
                            return res.status(403).json({ error: true, success: false, code: '', message: 'Corporation missing parameters' });
                        }
                    }

                    if (proceedpayment) {
                        const invoicedetail = await getInvoiceDetail(corpid, orgid, userid, invoiceid);
                        const appsetting = await getAppSetting();

                        if (invoicedetail && appsetting) {
                            var invoicecorrelative = null;
                            var documenttype = null;

                            if (corp.billbyorg) {
                                if ((org.sunatcountry === 'PE' && org.doctype === '6') || (org.sunatcountry !== 'PE' && org.doctype === '0')) {
                                    invoicecorrelative = await getCorrelativeNumber(corpid, orgid, invoiceid, 'INVOICE');
                                    documenttype = '01';
                                }

                                if ((org.sunatcountry === 'PE') && (org.doctype === '1' || org.doctype === '4' || org.doctype === '7')) {
                                    invoicecorrelative = await getCorrelativeNumber(corpid, orgid, invoiceid, 'TICKET');
                                    documenttype = '03'
                                }
                            }
                            else {
                                if ((corp.sunatcountry === 'PE' && corp.doctype === '6') || (corp.sunatcountry !== 'PE' && corp.doctype === '0')) {
                                    invoicecorrelative = await getCorrelativeNumber(corpid, orgid, invoiceid, 'INVOICE');
                                    documenttype = '01';
                                }

                                if ((corp.sunatcountry === 'PE') && (corp.doctype === '1' || corp.doctype === '4' || corp.doctype === '7')) {
                                    invoicecorrelative = await getCorrelativeNumber(corpid, orgid, invoiceid, 'TICKET');
                                    documenttype = '03'
                                }
                            }

                            if (invoicecorrelative) {
                                try {
                                    var invoicedata = {
                                        CodigoAnexoEmisor: appsetting.annexcode,
                                        CodigoFormatoImpresion: appsetting.printingformat,
                                        CodigoMoneda: invoice.currency,
                                        Username: appsetting.sunatusername,
                                        TipoDocumento: documenttype,
                                        TipoRucEmisor: appsetting.emittertype,
                                        CodigoRucReceptor: billbyorg ? org.doctype : corp.doctype,
                                        CodigoUbigeoEmisor: appsetting.ubigeo,
                                        EnviarSunat: billbyorg ? org.autosendinvoice : corp.autosendinvoice,
                                        FechaEmision: invoice.invoicedate,
                                        FechaVencimiento: invoice.expirationdate,
                                        MailEnvio: billbyorg ? org.contactemail : corp.contactemail,
                                        MontoTotal: Math.round((invoice.totalamount + Number.EPSILON) * 100) / 100,
                                        NombreComercialEmisor: appsetting.tradename,
                                        RazonSocialEmisor: appsetting.businessname,
                                        RazonSocialReceptor: billbyorg ? org.businessname : corp.businessname,
                                        CorrelativoDocumento: zeroPad(invoicecorrelative.p_correlative, 8),
                                        RucEmisor: appsetting.ruc,
                                        NumeroDocumentoReceptor: billbyorg ? org.docnum : corp.docnum,
                                        NumeroSerieDocumento: documenttype === '01' ? appsetting.invoiceserie : appsetting.ticketserie,
                                        RetornaPdf: appsetting.returnpdf,
                                        RetornaXmlSunat: appsetting.returnxmlsunat,
                                        RetornaXml: appsetting.returnxml,
                                        TipoCambio: invoice.currency === 'USD' ? invoice.exchangerate : '1.000',
                                        Token: appsetting.token,
                                        DireccionFiscalEmisor: appsetting.fiscaladdress,
                                        DireccionFiscalReceptor: billbyorg ? org.fiscaladdress : corp.fiscaladdress,
                                        VersionXml: appsetting.xmlversion,
                                        VersionUbl: appsetting.ublversion,
                                        Endpoint: appsetting.sunaturl,
                                        PaisRecepcion: billbyorg ? org.sunatcountry : corp.sunatcountry,
                                        ProductList: [],
                                        DataList: []
                                    }

                                    if (corp.billbyorg) {
                                        invoicedata.CodigoOperacionSunat = org.sunatcountry === 'PE' ? appsetting.operationcodeperu : appsetting.operationcodeother;
                                        invoicedata.MontoTotalGravado = org.sunatcountry === 'PE' ? Math.round((invoice.subtotal + Number.EPSILON) * 100) / 100 : null;
                                        invoicedata.MontoTotalInafecto = org.sunatcountry === 'PE' ? '0' : Math.round((invoice.subtotal + Number.EPSILON) * 100) / 100;
                                        invoicedata.MontoTotalIgv = org.sunatcountry === 'PE' ? Math.round((invoice.taxes + Number.EPSILON) * 100) / 100 : null;
                                    }
                                    else {
                                        invoicedata.CodigoOperacionSunat = corp.sunatcountry === 'PE' ? appsetting.operationcodeperu : appsetting.operationcodeother;
                                        invoicedata.MontoTotalGravado = corp.sunatcountry === 'PE' ? Math.round((invoice.subtotal + Number.EPSILON) * 100) / 100 : null;
                                        invoicedata.MontoTotalInafecto = corp.sunatcountry === 'PE' ? '0' : Math.round((invoice.subtotal + Number.EPSILON) * 100) / 100;
                                        invoicedata.MontoTotalIgv = corp.sunatcountry === 'PE' ? Math.round((invoice.taxes + Number.EPSILON) * 100) / 100 : null;
                                    }

                                    if (corp.billbyorg) {
                                        if (org.sunatcountry === 'PE') {
                                            calcdetraction = true;
                                        }
                                    }
                                    else {
                                        if (corp.sunatcountry === 'PE') {
                                            calcdetraction = true;
                                        }
                                    }

                                    if (calcdetraction) {
                                        if (appsetting.detraction && appsetting.detractioncode && appsetting.detractionaccount && (appsetting.detractionminimum || appsetting.detractionminimum === 0)) {
                                            var compareamount = 0;

                                            if (appsetting.detractionminimum) {
                                                if (invoice.currency === 'USD') {
                                                    var exchangerate = await getLastExchange();

                                                    compareamount = invoice.totalamount * exchangerate;
                                                }
                                                else {
                                                    compareamount = invoice.totalamount;
                                                }
                                            }
                                            
                                            if (compareamount > appsetting.detractionminimum) {
                                                invoicedata.MontoTotalDetraccion = Math.round(((invoice.totalamount * appsetting.detraction) + Number.EPSILON) * 100) / 100;
                                                invoicedata.PorcentajeTotalDetraccion = appsetting.detraction * 100;
                                                invoicedata.NumeroCuentaDetraccion = appsetting.detractionaccount;
                                                invoicedata.CodigoDetraccion = appsetting.detractioncode;

                                                var adicional02 = {
                                                    CodigoDatoAdicional: '06',
                                                    DescripcionDatoAdicional: 'CUENTA DE DETRACCION: ' + appsetting.detractionaccount
                                                }
        
                                                invoicedata.DataList.push(adicional02);
                                            }
                                        }
                                    }

                                    invoicedetail.forEach(async data => {
                                        var invoicedetaildata = {
                                            CantidadProducto: data.quantity,
                                            CodigoProducto: data.productcode,
                                            TipoVenta: data.saletype,
                                            UnidadMedida: data.measureunit,
                                            IgvTotal: Math.round((data.totaligv + Number.EPSILON) * 100) / 100,
                                            MontoTotal: Math.round((data.totalamount + Number.EPSILON) * 100) / 100,
                                            TasaIgv: data.igvrate * 100,
                                            PrecioProducto: Math.round((data.productprice + Number.EPSILON) * 100) / 100,
                                            DescripcionProducto: data.productdescription,
                                            PrecioNetoProducto: data.productnetprice,
                                            ValorNetoProducto: Math.round(((data.quantity * data.productnetprice) + Number.EPSILON) * 100) / 100,
                                        };

                                        if (corp.billbyorg) {
                                            invoicedetaildata.AfectadoIgv = org.sunatcountry === 'PE' ? '10' : '40';
                                            invoicedetaildata.TributoIgv = org.sunatcountry === 'PE' ? '1000' : '9998';
                                        }
                                        else {
                                            invoicedetaildata.AfectadoIgv = corp.sunatcountry === 'PE' ? '10' : '40';
                                            invoicedetaildata.TributoIgv = corp.sunatcountry === 'PE' ? '1000' : '9998';
                                        }
    
                                        invoicedata.ProductList.push(invoicedetaildata);
                                    });

                                    if (invoice.purchaseorder) {
                                        var adicional03 = {
                                            CodigoDatoAdicional: '15',
                                            DescripcionDatoAdicional: invoice.purchaseorder
                                        }

                                        invoicedata.DataList.push(adicional03);
                                    }

                                    if (invoice.comments) {
                                        var adicional04 = {
                                            CodigoDatoAdicional: '07',
                                            DescripcionDatoAdicional: invoice.comments
                                        }

                                        invoicedata.DataList.push(adicional04);
                                    }

                                    if (invoice.credittype) {
                                        var days = invoice.credittype.split("_")[1];
                                        if (days === "alcontado") {
                                            days = "0";
                                        }
                                        
                                        var adicional05 = {
                                            CodigoDatoAdicional: '01',
                                            DescripcionDatoAdicional: days === '0' ? 'AL CONTADO' : `CREDITO A ${days} DIAS`
                                        }

                                        invoicedata.DataList.push(adicional05);
                                    }

                                    const requestSendToSunat = await axios({
                                        data: invoicedata,
                                        method: 'post',
                                        url: `${bridgeEndpoint}processmifact/sendinvoice`
                                    });

                                    if (requestSendToSunat.data.result) {
                                        await invoiceSunat(corpid, orgid, invoiceid, 'INVOICED', null, requestSendToSunat.data.result.cadenaCodigoQr, requestSendToSunat.data.result.codigoHash, requestSendToSunat.data.result.urlCdrSunat, requestSendToSunat.data.result.urlPdf, requestSendToSunat.data.result.urlXml, invoicedata.NumeroSerieDocumento, appsetting?.ruc|| null, appsetting?.businessname|| null, appsetting?.tradename|| null, appsetting?.fiscaladdress|| null, appsetting?.ubigeo|| null, appsetting?.emittertype|| null, appsetting?.annexcode|| null, appsetting?.printingformat|| null, invoicedata?.EnviarSunat|| null, appsetting?.returnpdf|| null, appsetting?.returnxmlsunat|| null, appsetting?.returnxml|| null, appsetting?.token|| null, appsetting?.sunaturl|| null, appsetting?.sunatusername|| null, appsetting?.xmlversion|| null, appsetting?.ublversion|| null, invoicedata?.CodigoRucReceptor|| null, invoicedata?.NumeroDocumentoReceptor|| null, invoicedata?.RazonSocialReceptor|| null, invoicedata?.DireccionFiscalReceptor|| null, invoicedata?.PaisRecepcion|| null, invoicedata?.MailEnvio|| null, documenttype|| null, invoicedata?.CodigoOperacionSunat|| null, invoicedata?.FechaVencimiento|| null, invoice.purchaseorder || null, invoice.comments || null, invoice.credittype || null, appsetting?.detractioncode|| null, appsetting?.detraction|| null, appsetting?.detractionaccount);

                                        return res.json({
                                            code: '',
                                            data: null,
                                            error: false,
                                            message: 'successinvoiced',
                                            success: true
                                        });
                                    }
                                    else {
                                        await invoiceSunat(corpid, orgid, invoiceid, 'ERROR', requestSendToSunat.data.operationMessage, null, null, null, null, null, null, appsetting?.ruc|| null, appsetting?.businessname|| null, appsetting?.tradename|| null, appsetting?.fiscaladdress|| null, appsetting?.ubigeo|| null, appsetting?.emittertype|| null, appsetting?.annexcode|| null, appsetting?.printingformat|| null, invoicedata?.EnviarSunat|| null, appsetting?.returnpdf|| null, appsetting?.returnxmlsunat|| null, appsetting?.returnxml|| null, appsetting?.token|| null, appsetting?.sunaturl|| null, appsetting?.sunatusername|| null, appsetting?.xmlversion|| null, appsetting?.ublversion|| null, invoicedata?.CodigoRucReceptor|| null, invoicedata?.NumeroDocumentoReceptor|| null, invoicedata?.RazonSocialReceptor|| null, invoicedata?.DireccionFiscalReceptor|| null, invoicedata?.PaisRecepcion|| null, invoicedata?.MailEnvio|| null, documenttype|| null, invoicedata?.CodigoOperacionSunat|| null, invoicedata?.FechaVencimiento|| null, invoice.purchaseorder || null, invoice.comments || null, invoice.credittype || null, appsetting?.detractioncode|| null, appsetting?.detraction|| null, appsetting?.detractionaccount);

                                        if (corp.billbyorg) {
                                            if ((org.sunatcountry === 'PE' && org.doctype === '6') || (org.sunatcountry !== 'PE' && org.doctype === '0')) {
                                                await getCorrelativeNumber(corpid, orgid, invoiceid, 'INVOICEERROR');
                                            }
                    
                                            if ((org.sunatcountry === 'PE') && (org.doctype === '1' || org.doctype === '4' || org.doctype === '7')) {
                                                await getCorrelativeNumber(corpid, orgid, invoiceid, 'TICKETERROR');
                                            }
                                        }
                                        else {
                                            if ((corp.sunatcountry === 'PE' && corp.doctype === '6') || (corp.sunatcountry !== 'PE' && corp.doctype === '0')) {
                                                await getCorrelativeNumber(corpid, orgid, invoiceid, 'INVOICEERROR');
                                            }
                    
                                            if ((corp.sunatcountry === 'PE') && (corp.doctype === '1' || corp.doctype === '4' || corp.doctype === '7')) {
                                                await getCorrelativeNumber(corpid, orgid, invoiceid, 'TICKETERROR');
                                            }
                                        }

                                        return res.status(403).json({ error: true, success: false, code: '', message: 'Error while invoicing' });
                                    }
                                }
                                catch (error) {
                                    await invoiceSunat(corpid, orgid, invoiceid, 'ERROR', error.message, null, null, null, null, null, null, appsetting.ruc, appsetting.businessname, appsetting.tradename, appsetting.fiscaladdress, appsetting.ubigeo, appsetting.emittertype, appsetting.annexcode, appsetting.printingformat, appsetting.sendtosunat, appsetting.returnpdf, appsetting.returnxmlsunat, appsetting.returnxml, appsetting.token, appsetting.sunaturl, appsetting.sunatusername, appsetting.xmlversion, appsetting.ublversion, billbyorg ? org.doctype : corp.doctype, billbyorg ? org.docnum : corp.docnum, billbyorg ? org.businessname : corp.businessname, billbyorg ? org.fiscaladdress : corp.fiscaladdress, billbyorg ? org.sunatcountry : corp.sunatcountry, billbyorg ? org.contactemail : corp.contactemail, documenttype, null, invoice.expirationdate, invoice.purchaseorder, invoice.comments, invoice.credittype, null, null, null);

                                    if (corp.billbyorg) {
                                        if ((org.sunatcountry === 'PE' && org.doctype === '6') || (org.sunatcountry !== 'PE' && org.doctype === '0')) {
                                            await getCorrelativeNumber(corpid, orgid, invoiceid, 'INVOICEERROR');
                                        }
                
                                        if ((org.sunatcountry === 'PE') && (org.doctype === '1' || org.doctype === '4' || org.doctype === '7')) {
                                            await getCorrelativeNumber(corpid, orgid, invoiceid, 'TICKETERROR');
                                        }
                                    }
                                    else {
                                        if ((corp.sunatcountry === 'PE' && corp.doctype === '6') || (corp.sunatcountry !== 'PE' && corp.doctype === '0')) {
                                            await getCorrelativeNumber(corpid, orgid, invoiceid, 'INVOICEERROR');
                                        }
                
                                        if ((corp.sunatcountry === 'PE') && (corp.doctype === '1' || corp.doctype === '4' || corp.doctype === '7')) {
                                            await getCorrelativeNumber(corpid, orgid, invoiceid, 'TICKETERROR');
                                        }
                                    }

                                    return res.status(403).json({ error: true, success: false, code: '', message: 'General error' });
                                }
                            }
                            else {
                                await invoiceSunat(corpid, orgid, invoiceid, 'ERROR', 'Correlative not found', null, null, null, null, null, null, appsetting.ruc, appsetting.businessname, appsetting.tradename, appsetting.fiscaladdress, appsetting.ubigeo, appsetting.emittertype, appsetting.annexcode, appsetting.printingformat, appsetting.sendtosunat, appsetting.returnpdf, appsetting.returnxmlsunat, appsetting.returnxml, appsetting.token, appsetting.sunaturl, appsetting.sunatusername, appsetting.xmlversion, appsetting.ublversion, billbyorg ? org.doctype : corp.doctype, billbyorg ? org.docnum : corp.docnum, billbyorg ? org.businessname : corp.businessname, billbyorg ? org.fiscaladdress : corp.fiscaladdress, billbyorg ? org.sunatcountry : corp.sunatcountry, billbyorg ? org.contactemail : corp.contactemail, documenttype, null, invoice.expirationdate, invoice.purchaseorder, invoice.comments, invoice.credittype, null, null, null);

                                return res.status(403).json({ error: true, success: false, code: '', message: 'Correlative not found' });
                            }
                        }
                        else {
                            return res.status(403).json({ error: true, success: false, code: '', message: 'No product details' });
                        }
                    }
                    else {
                        return res.status(403).json({ error: true, success: false, code: '', message: 'There are missing parameters' });
                    }
                }
                else {
                    return res.status(403).json({ error: true, success: false, code: '', message: 'Corporation not found' });
                }
            }
            else {
                return res.status(403).json({ error: true, success: false, code: '', message: 'Invoice already sent' });
            }
        }
        else {
            return res.status(403).json({ error: true, success: false, code: '', message: 'Invoice not found' });
        }
    } catch (error) {
        return res.status(500).json({ message: "There was a problem, please try again later" });
    }
}