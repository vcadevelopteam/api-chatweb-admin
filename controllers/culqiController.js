const triggerfunctions = require('../config/triggerfunctions');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const { getErrorSeq } = require('../config/helpers');
const Culqi = require('culqi-node');
const culqi = new Culqi({
    privateKey: 'sk_test_d901e8f07d45a485',
    // publicKey: 'pk_test_041501e753dcb2f9'
});

exports.getToken = async (req, res) => {
    const { token } = req.body;
    try {
        const tk = await culqi.tokens.getToken({
            id: token.id, 
        });
        console.log(tk);
        return res.json({ error: false, success: true, data: tk });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "There was a problem, please try again later" });
    }
}

const getUserProfile = async (userid) => {
    const query = "SELECT firstname, lastname, email, phone, country FROM usr WHERE userid = $userid"
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

exports.createOrder = async (req, res) => {
    const { corpid, orgid, userid } = req.user;
    const { invoiceid } = req.body;
    try {
        const userprofile = await getUserProfile(userid);
        const invoice = await getInvoice(corpid, orgid, userid, invoiceid);
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
        console.log(error);
        return res.status(500).json({ message: "There was a problem, please try again later" });
    }
}

exports.deleteOrder = async (req, res) => {
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
        console.log(error);
        return res.status(500).json({ message: "There was a problem, please try again later" });
    }
}

const createCharge = async (userprofile, settings, token, metadata) => {
    return await culqi.charges.createCharge({
        amount: settings.amount,
        currency_code: settings.currency,
        email: token.email,
        source_id: token.id,
        capture: true,
        description: `Laraigo ${settings.description}`.slice(0,80),
        metadata: metadata,
        antifraud_details: {
            first_name: userprofile.firstname,
            last_name: userprofile.lastname,
            address: userprofile.address || 'EMPTY',
            address_city: userprofile.address_city || 'N/A',
            country_code: userprofile.country || token.client.ip_country_code,
            phone: userprofile.phone,
        }
    });
}

exports.chargeInvoice = async (req, res) => {
    const { corpid, orgid, userid, usr } = req.user;
    const { invoiceid, settings, token, metadata = {} } = req.body;
    try {
        const invoice = await getInvoice(corpid, orgid, userid, invoiceid);
        if (invoice) {
            if (invoice.invoicestatus === 'INVOICED' && invoice.paymentstatus === 'PENDING') {
                if (invoice.currency === settings.currency && invoice.totalamount * 100 === settings.amount) {
                    const userprofile = await getUserProfile(userid);
                    if (userprofile) {
                        metadata.corpid = corpid;
                        metadata.corporation = invoice.corpdesc;
                        metadata.orgid = orgid;
                        metadata.organization = invoice.orgdesc || '';
                        metadata.documentnumber = invoice.receiverdocnum;
                        metadata.businessname = invoice.receiverbusinessname;
                        metadata.invoiceid = invoiceid;
                        metadata.invoicecode = `${invoice.serie}-${invoice.correlative}`;
                        metadata.userid = userid;
                        metadata.usr = usr;
                        const charge = await createCharge(userprofile, settings, token, metadata);
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
                                invoiceid: invoiceid,
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
                            
                            const invoicequery = "UFN_INVOICE_PAYMENT";
                            const invoicebind = {
                                corpid: corpid,
                                orgid: orgid,
                                invoiceid: invoiceid,
                                chargeid: chargeresult[0].chargeid,
                                paidby: usr,
                                email: token.email,
                                tokenid: token.id,
                                capture: true,
                                tokenjson: token,
                                chargetoken: charge.id,
                                chargejson: charge
                            }
                            const invoiceresult = await triggerfunctions.executesimpletransaction(invoicequery, invoicebind);
                            
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
                }
                else {
                    return res.status(403).json({ error: true, success: false, code: '', message: 'invalid invoice data' });
                }
            }
            else {
                return res.json({ error: false, success: true, code: '', message: 'Invoice already paid' });
            }
        }
        else {
            return res.status(404).json({ error: true, success: false, code: '', message: 'Invoice not found' });
        }
    } catch (error) {
        console.log(error);
        if (error.charge_id) {
            return res.status(500).json({ message: error.merchant_message });
        }
        else {
            return res.status(500).json({ message: "There was a problem, please try again later" });
        }
    }
};

exports.charge = async (req, res) => {
    const { corpid, orgid, userid, usr } = req.user;
    const { settings, token, metadata = {} } = req.body;
    try {
        const userprofile = await getUserProfile(userid);
        if (userprofile) {
            metadata.corpid = corpid;
            metadata.orgid = orgid;
            metadata.userid = userid;
            const charge = await createCharge(userprofile, settings, token, metadata);
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
        console.log(error);
        if (error.charge_id) {
            return res.status(500).json({ message: error.merchant_message });
        }
        else {
            return res.status(500).json({ message: "There was a problem, please try again later" });
        }
    }
};

exports.refundInvoice = async (req, res) => {
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
        console.log(error);
        return res.status(500).json({ message: "There was a problem, please try again later" });
    }
};

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

exports.refund = async (req, res) => {
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
        console.log(error);
        return res.status(500).json({ message: "There was a problem, please try again later" });
    }
};

const createCustomer = async (token, metadata, userprofile) => {
    return await culqi.customers.createCustomer({
        first_name: userprofile.firstname,
        last_name: userprofile.lastname,
        email: token.email,
        address: userprofile.address || 'EMPTY',
        address_city: userprofile.address_city || 'N/A',
        country_code: userprofile.country || token.client.ip_country_code,
        phone: userprofile.phone,
        metadata: metadata,
    });
}

const saveCustomer = async (corpid, orgid, customer) => {
    const query = "UPDATE org SET customerjson = $customerjson WHERE corpid = $corpid AND orgid = $orgid"
    await sequelize.query(query, { type: QueryTypes.SELECT, bind: { corpid: corpid, orgid: orgid, customerjson: customer }}).catch(err => getErrorSeq(err));
}

const saveCard = async (corpid, orgid, card) => {
    const query = "UPDATE org SET cardjson = $cardjson WHERE corpid = $corpid AND orgid = $orgid"
    await sequelize.query(query, { type: QueryTypes.SELECT, bind: { corpid: corpid, orgid: orgid, cardjson: card }}).catch(err => getErrorSeq(err));
}