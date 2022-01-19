const axios = require('axios');
const triggerfunctions = require('../config/triggerfunctions');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const { getErrorSeq } = require('../config/helpers');
const Culqi = require('culqi-node');
const { stringify } = require('uuid');

const exchangeEndpoint = process.env.EXCHANGE;

const culqi = new Culqi({
    privateKey: 'sk_test_d901e8f07d45a485',
    // publicKey: 'pk_test_041501e753dcb2f9'
});

const bridgeEndpoint = process.env.BRIDGE;

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

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

const zeroPad = (num, places) => String(num).padStart(places, '0')

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

const getInvoiceCorrelative = async (corpid, orgid, id) => {
    const query = "UFN_INVOICE_CORRELATIVE";
    const bind = {
        corpid: corpid,
        orgid: orgid,
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

const getInvoiceTicketCorrelative = async (corpid, orgid, id) => {
    const query = "UFN_INVOICE_TICKETCORRELATIVE";
    const bind = {
        corpid: corpid,
        orgid: orgid,
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

const getInvoiceCorrelativeError = async (corpid, orgid, id) => {
    const query = "UFN_INVOICE_CORRELATIVEERROR";
    const bind = {
        corpid: corpid,
        orgid: orgid,
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

const getInvoiceTicketCorrelativeError = async (corpid, orgid, id) => {
    const query = "UFN_INVOICE_TICKETCORRELATIVEERROR";
    const bind = {
        corpid: corpid,
        orgid: orgid,
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
    var exchangeRate = 0;
    var maximumretry = 0;

    var currenDate = new Date();

    while (exchangeRate === 0 && maximumretry <= 10) {
        const requestExchange = await axios({
            method: 'get',
            url: `${exchangeEndpoint}${currenDate.toISOString().split('T')[0]}`
        });

        if (requestExchange.data.venta) {
            exchangeRate = requestExchange.data.venta;
        }
        else {
            currenDate.addDays(-1);
        }

        maximumretry++;
    }

    return exchangeRate;
}

const invoiceSunat = async (corpid, orgid, invoiceid, status, error, qrcode, hashcode, urlcdr, urlpdf, urlxml, serie) => {
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
        serie: serie
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
    const { corpid, userid, usr } = req.user;
    const { invoiceid, settings, token, metadata = {}, purchaseorder, comments, orgid } = req.body;

    try {
        const corp = await getCorporation(corpid);
        const org = await getOrganization(corpid, orgid);
        const tipocredito = '0';

        var proceedpayment = false;

        if (corp) {
            if (corp.billbyorg) {
                if (org) {
                    if (org.docnum && org.doctype && org.businessname && org.fiscaladdress && org.sunatcountry) {
                        proceedpayment = true;
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
                    proceedpayment = true;
                }
                else {
                    return res.status(403).json({ error: true, success: false, code: '', message: 'Corporation missing parameters' });
                }
            }

            if (proceedpayment) {
                const invoice = await getInvoice(corpid, orgid, userid, invoiceid);
                const invoicedetail = await getInvoiceDetail(corpid, orgid, userid, invoiceid);

                if (invoice && invoicedetail) {
                    if (invoice.invoicestatus === 'DRAFT' && invoice.paymentstatus === 'PENDING' && invoice.currency === settings.currency && invoice.totalamount * 100 === settings.amount) {
                        const appsetting = await getAppSetting();
                        const userprofile = await getUserProfile(userid);
                        
                        if (userprofile && appsetting) {
                            metadata.corpid = corpid;
                            metadata.corporation = corp.description;
                            metadata.orgid = orgid;
                            metadata.organization = invoice.orgdesc || '';
                            metadata.document = org ? org.docnum : corp.docnum;
                            metadata.businessname = org ? org.businessname : corp.businessname;
                            metadata.invoiceid = invoiceid;
                            metadata.seriecode = '';
                            metadata.emissiondate = invoice.invoicedate;
                            metadata.user = usr;
                            metadata.reference = invoice.description;

                            const charge = await createCharge(userprofile, settings, token, metadata);

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
                                    tokenjson: token
                                }
    
                                const invoiceresult = await triggerfunctions.executesimpletransaction(invoicequery, invoicebind);

                                var invoicecorrelative = null;
                                var documenttype = null;

                                if (corp.billbyorg) {
                                    if ((org.sunatcountry === 'PE' && org.doctype === '6') || (org.sunatcountry !== 'PE' && org.doctype === '0')) {
                                        invoicecorrelative = await getInvoiceCorrelative(corpid, orgid, invoiceid);
                                        documenttype = '01';
                                    }
            
                                    if ((org.sunatcountry === 'PE') && (org.doctype === '1' || org.doctype === '4' || org.doctype === '7')) {
                                        invoicecorrelative = await getInvoiceTicketCorrelative(corpid, orgid, invoiceid);
                                        documenttype = '03'
                                    }
                                }
                                else {
                                    if ((corp.sunatcountry === 'PE' && corp.doctype === '6') || (corp.sunatcountry !== 'PE' && corp.doctype === '0')) {
                                        invoicecorrelative = await getInvoiceCorrelative(corpid, orgid, invoiceid);
                                        documenttype = '01';
                                    }
            
                                    if ((corp.sunatcountry === 'PE') && (corp.doctype === '1' || corp.doctype === '4' || corp.doctype === '7')) {
                                        invoicecorrelative = await getInvoiceTicketCorrelative(corpid, orgid, invoiceid);
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
                                            MontoTotal: invoice.totalamount,
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
                                            TipoCambio: invoice.exchangerate,
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
                                            invoicedata.MontoTotalGravado = org.sunatcountry === 'PE' ? invoice.subtotal : null;
                                            invoicedata.MontoTotalInafecto = org.sunatcountry === 'PE' ? '0' : invoice.subtotal;
                                            invoicedata.MontoTotalIgv = org.sunatcountry === 'PE' ? invoice.taxes : null;
                                        }
                                        else {
                                            invoicedata.CodigoOperacionSunat = corp.sunatcountry === 'PE' ? appsetting.operationcodeperu : appsetting.operationcodeother;
                                            invoicedata.MontoTotalGravado = corp.sunatcountry === 'PE' ? invoice.subtotal : null;
                                            invoicedata.MontoTotalInafecto = corp.sunatcountry === 'PE' ? '0' : invoice.subtotal;
                                            invoicedata.MontoTotalIgv = corp.sunatcountry === 'PE' ? invoice.taxes : null;
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
                                                    invoicedata.MontoTotalDetraccion = invoice.totalamount * appsetting.detraction;
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
                                                IgvTotal: data.totaligv,
                                                MontoTotal: data.totalamount,
                                                TasaIgv: data.igvrate * 100,
                                                PrecioProducto: data.productprice,
                                                DescripcionProducto: data.productdescription,
                                                PrecioNetoProducto: data.productnetprice,
                                                ValorNetoProducto: data.productnetworth,
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
                                            await invoiceSunat(corpid, orgid, invoiceid, 'INVOICED', '', requestSendToSunat.data.result.cadenaCodigoQr, requestSendToSunat.data.result.codigoHash, requestSendToSunat.data.result.urlCdrSunat, requestSendToSunat.data.result.urlPdf, requestSendToSunat.data.result.urlXml, invoicedata.NumeroSerieDocumento);
                                        }
                                        else {
                                            await invoiceSunat(corpid, orgid, invoiceid, 'ERROR', requestSendToSunat.data.operationMessage, '', '', '', '', '', null);
    
                                            if (corp.billbyorg) {
                                                if ((org.sunatcountry === 'PE' && org.doctype === '6') || (org.sunatcountry !== 'PE' && org.doctype === '0')) {
                                                    await getInvoiceCorrelativeError(corpid, orgid, invoiceid);
                                                }
                        
                                                if ((org.sunatcountry === 'PE') && (org.doctype === '1' || org.doctype === '4' || org.doctype === '7')) {
                                                    await getInvoiceTicketCorrelativeError(corpid, orgid, invoiceid);
                                                }
                                            }
                                            else {
                                                if ((corp.sunatcountry === 'PE' && corp.doctype === '6') || (corp.sunatcountry !== 'PE' && corp.doctype === '0')) {
                                                    await getInvoiceCorrelativeError(corpid, orgid, invoiceid);
                                                }
                        
                                                if ((corp.sunatcountry === 'PE') && (corp.doctype === '1' || corp.doctype === '4' || corp.doctype === '7')) {
                                                    await getInvoiceTicketCorrelativeError(corpid, orgid, invoiceid);
                                                }
                                            }
                                        }
                                    }
                                    catch (error) {
                                        await invoiceSunat(corpid, orgid, invoiceid, 'ERROR', error.message, '', '', '', '', '', null);
    
                                        if (corp.billbyorg) {
                                            if ((org.sunatcountry === 'PE' && org.doctype === '6') || (org.sunatcountry !== 'PE' && org.doctype === '0')) {
                                                await getInvoiceCorrelativeError(corpid, orgid, invoiceid);
                                            }
                    
                                            if ((org.sunatcountry === 'PE') && (org.doctype === '1' || org.doctype === '4' || org.doctype === '7')) {
                                                await getInvoiceTicketCorrelativeError(corpid, orgid, invoiceid);
                                            }
                                        }
                                        else {
                                            if ((corp.sunatcountry === 'PE' && corp.doctype === '6') || (corp.sunatcountry !== 'PE' && corp.doctype === '0')) {
                                                await getInvoiceCorrelativeError(corpid, orgid, invoiceid);
                                            }
                    
                                            if ((corp.sunatcountry === 'PE') && (corp.doctype === '1' || corp.doctype === '4' || corp.doctype === '7')) {
                                                await getInvoiceTicketCorrelativeError(corpid, orgid, invoiceid);
                                            }
                                        }
                                    }
                                }
                                else {
                                    await invoiceSunat(corpid, orgid, invoiceid, 'ERROR', 'Correlative not found', '', '', '', '', '', null);
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