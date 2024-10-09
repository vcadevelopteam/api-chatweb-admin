const triggerfunctions = require("../config/triggerfunctions");
const genericfunctions = require("../config/genericfunctions");

const { axiosObservable, getErrorCode, printException } = require("../config/helpers");

const Culqi = require("culqi-node");
const logger = require("../config/winston");

const bridgeEndpoint = process.env.BRIDGE;
const whitelist = process.env.WHITELIST;

const createCharge = async (userProfile, settings, token, metadata, privateKey) => {
    const culqiService = new Culqi({
        privateKey: privateKey
    });

    var culqiBody = {
        amount: `${settings.amount}`,
        antifraud_details: {
            address: `${(genericfunctions.removeSpecialCharacter(userProfile.address || "EMPTY")).slice(0, 100)}`,
            address_city: `${(genericfunctions.removeSpecialCharacter(userProfile.address_city || "EMPTY")).slice(0, 30)}`,
            country_code: `${((userProfile.country || token.client.ip_country_code) || "PE")}`,
            first_name: `${(genericfunctions.removeSpecialCharacter(userProfile.firstname || "EMPTY")).slice(0, 50)}`,
            last_name: `${(genericfunctions.removeSpecialCharacter(userProfile.lastname || "EMPTY")).slice(0, 50)}`,
            phone_number: `${(userProfile.phone ? userProfile.phone.replace(/[^0-9]/g, "") : "51999999999").slice(0, 15)}`,
        },
        currency_code: `${settings.currency}`,
        description: `${(genericfunctions.removeSpecialCharacter(settings.description || "").replace(/[^0-9A-Za-z ]/g, "")).slice(0, 80)}`,
        email: `${token.email.slice(0, 50)}`,
        metadata: metadata,
        source_id: `${token.id}`,
    }

    return await culqiService.charges.createCharge(culqiBody);
}

exports.automaticPayment = async (request, response) => {
    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var responsedata = genericfunctions.generateResponseData(request._requestid);

        if (typeof whitelist !== "undefined" && whitelist) {
            if (!whitelist.includes(request.ip)) {
                responsedata = genericfunctions.changeResponseData(responsedata, 401, null, "error_auth_error", 401, false);
                return response.status(responsedata.status).json(responsedata);
            }
        }

        if (request.body) {
            const { corpid, orgid, invoiceid } = request.body;

            const corp = await genericfunctions.getCorporation(corpid, responsedata.id);

            if (corp) {
                const org = (orgid === 0 ? null : await genericfunctions.getOrganization(corpid, orgid, responsedata.id));

                if (org || orgid === 0) {
                    var paymentdisabled = false;

                    if (org) {
                        if (!org.automaticpayment) {
                            paymentdisabled = true;
                        }
                    }
                    else {
                        if (!corp.automaticpayment) {
                            paymentdisabled = true;
                        }
                    }

                    if (paymentdisabled) {
                        responsedata = genericfunctions.changeResponseData(responsedata, null, null, "success_automaticpayment_paymentdisabled", 200, true);
                        return response.status(responsedata.status).json(responsedata);
                    }

                    const appsetting = await genericfunctions.getAppSettingSingle(corpid, orgid, responsedata.id);

                    if (appsetting) {
                        const invoice = await genericfunctions.getInvoice(corpid, orgid, 0, invoiceid, responsedata.id);

                        if (invoice) {
                            if (invoice.paymentstatus === "PENDING") {
                                var exchangeratedata = await genericfunctions.getExchangeRate(invoice.currency, responsedata.id);

                                var paymentsuccess = false;
                                var paymenttype = null;

                                const paymentcard = await genericfunctions.getPaymentCard(corpid, 0, responsedata.id);

                                if (paymentcard) {
                                    var favoritecard = paymentcard.find((card) => card.favorite === true);

                                    if (favoritecard) {
                                        var metadata = {};

                                        metadata.businessname = genericfunctions.removeSpecialCharacter((org ? org.businessname : corp.businessname) || "");
                                        metadata.corpid = (corpid || "");
                                        metadata.corporation = genericfunctions.removeSpecialCharacter(corp.description || "");
                                        metadata.document = ((org ? org.docnum : corp.docnum) || "");
                                        metadata.emissiondate = (new Date(new Date().setHours(new Date().getHours() - 5)).toISOString().split("T")[0] || "");
                                        metadata.invoiceid = (invoiceid || "");
                                        metadata.organization = genericfunctions.removeSpecialCharacter(invoice.orgdesc || "");
                                        metadata.orgid = (orgid || "");
                                        metadata.reference = genericfunctions.removeSpecialCharacter(invoice.description || "");
                                        metadata.seriecode = "";
                                        metadata.user = "SCHEDULER";

                                        var country = (org ? org.sunatcountry : corp.sunatcountry);
                                        var culqiamount = invoice.totalamount;
                                        var detractionamount = 0;
                                        var doctype = (org ? org.doctype : corp.doctype);

                                        if (exchangeratedata) {
                                            if (country && doctype) {
                                                if (country === "PE" && doctype === "6") {
                                                    var compareamount = (culqiamount || 0);

                                                    if (invoice.currency !== "PEN") {
                                                        compareamount = (compareamount / (exchangeratedata?.exchangerate || 0) * (exchangeratedata?.exchangeratesol || 0));
                                                    }

                                                    if (compareamount > appsetting.detractionminimum) {
                                                        culqiamount = (Math.round(((culqiamount || 0) - ((culqiamount || 0) * (appsetting.detraction || 0)) + Number.EPSILON) * 100) / 100);
                                                        detractionamount = (Math.round((((appsetting.detraction || 0) * 100) + Number.EPSILON) * 100) / 100);
                                                    }
                                                    else {
                                                        culqiamount = (Math.round(((culqiamount || 0) + Number.EPSILON) * 100) / 100);
                                                    }
                                                }
                                                else {
                                                    culqiamount = (Math.round(((culqiamount || 0) + Number.EPSILON) * 100) / 100);
                                                }

                                                var chargesuccess = false;

                                                if (appsetting?.paymentprovider === "CULQI") {
                                                    const requestCulqiCharge = await axiosObservable({
                                                        data: {
                                                            amount: (Math.round(((culqiamount * 100) + Number.EPSILON) * 100) / 100),
                                                            bearer: appsetting.privatekey,
                                                            currencyCode: invoice.currency,
                                                            description: (genericfunctions.removeSpecialCharacter("PAYMENT: " + (invoice.description || ""))).slice(0, 80),
                                                            email: favoritecard.mail,
                                                            metadata: metadata,
                                                            operation: "CREATE",
                                                            sourceId: favoritecard.cardcode,
                                                            url: appsetting.culqiurlcharge,
                                                        },
                                                        method: "post",
                                                        url: `${bridgeEndpoint}processculqi/handlecharge`,
                                                        _requestid: responsedata.id,
                                                    });

                                                    if (requestCulqiCharge.data.success) {
                                                        responsedata = genericfunctions.changeResponseData(responsedata, null, null, "success_automaticpayment_paymentsuccess", 200, true);

                                                        paymentsuccess = true;

                                                        const chargedata = await genericfunctions.insertCharge(corpid, orgid, invoiceid, null, culqiamount, true, requestCulqiCharge.data.result, requestCulqiCharge.data.result.id, invoice.currency, invoice.description, favoritecard.mail, "INSERT", null, null, "SCHEDULER", "PAID", favoritecard.paymentcardid, null, "REGISTEREDCARD", responsedata.id);

                                                        const invoicepayment = await genericfunctions.insertPayment(corpid, orgid, invoiceid, true, chargedata?.chargeid, requestCulqiCharge.data.result, requestCulqiCharge.data.result.id, culqiamount, favoritecard.mail, "SCHEDULER", favoritecard.paymentcardid, null, appsetting.location, appsetting.paymentprovider, responsedata.id);

                                                        if (invoicepayment) {
                                                            chargesuccess = true;

                                                            paymenttype = requestCulqiCharge?.data?.result?.source?.iin?.card_type;
                                                        }
                                                        else {
                                                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "alert_automaticpayment_invoiceupdate", responsedata.status, responsedata.success);
                                                        }
                                                    }
                                                }
                                                else if (appsetting?.paymentprovider === "OPENPAY COLOMBIA") {
                                                    const requestOpenpayCharge = await axiosObservable({
                                                        data: {
                                                            amount: (Math.round(((culqiamount) + Number.EPSILON) * 100) / 100),
                                                            currencyCode: invoice.currency,
                                                            customerId: favoritecard.clientcode,
                                                            description: (genericfunctions.removeSpecialCharacter("PAYMENT: " + (invoice.description || ""))).slice(0, 80),
                                                            igv: `${((appsetting.igv || 0) * 100)}`,
                                                            merchantId: appsetting.culqiurl,
                                                            operation: "CREATE",
                                                            orderId: `${corpid}-${orgid}-${invoice.invoiceid}-${Math.floor(Math.random() * 9999)}`,
                                                            secretKey: appsetting.privatekey,
                                                            sourceId: favoritecard.cardcode,
                                                            url: appsetting.culqiurlcharge,
                                                        },
                                                        method: "post",
                                                        url: `${bridgeEndpoint}processopenpay/handlecharge`,
                                                        _requestid: responsedata.id,
                                                    });

                                                    if (requestOpenpayCharge.data.success) {
                                                        responsedata = genericfunctions.changeResponseData(responsedata, null, null, "success_automaticpayment_paymentsuccess", 200, true);

                                                        paymentsuccess = true;

                                                        const chargedata = await genericfunctions.insertCharge(corpid, orgid, invoiceid, null, culqiamount, true, requestOpenpayCharge.data.result, requestOpenpayCharge.data.result.id, invoice.currency, invoice.description, favoritecard.mail, "INSERT", null, null, "SCHEDULER", "PAID", favoritecard.paymentcardid, null, "REGISTEREDCARD", responsedata.id);

                                                        const invoicepayment = await genericfunctions.insertPayment(corpid, orgid, invoiceid, true, chargedata?.chargeid, requestOpenpayCharge.data.result, requestOpenpayCharge.data.result.id, culqiamount, favoritecard.mail, "SCHEDULER", favoritecard.paymentcardid, null, appsetting.location, appsetting.paymentprovider, responsedata.id);

                                                        if (invoicepayment) {
                                                            chargesuccess = true;

                                                            paymenttype = requestOpenpayCharge?.data?.result?.card?.type;
                                                        }
                                                        else {
                                                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "alert_automaticpayment_invoiceupdate", responsedata.status, responsedata.success);
                                                        }
                                                    }
                                                }

                                                if (chargesuccess) {
                                                    const alertbody = await genericfunctions.searchDomain(1, 0, false, "PAYMENTALERTBODY", "SCHEDULER", responsedata.id);
                                                    const alertsubject = await genericfunctions.searchDomain(1, 0, false, "PAYMENTALERTSUBJECT", "SCHEDULER", responsedata.id);

                                                    if (alertbody && alertsubject) {
                                                        var mailbody = alertbody.domainvalue;
                                                        var mailsubject = alertsubject.domainvalue;

                                                        mailbody = mailbody.split("{{amountdetraction}}").join(detractionamount);
                                                        mailbody = mailbody.split("{{amountpaid}}").join(culqiamount);
                                                        mailbody = mailbody.split("{{amounttotal}}").join(invoice.totalamount);
                                                        mailbody = mailbody.split("{{businessname}}").join(org ? org.businessname : corp.businessname);
                                                        mailbody = mailbody.split("{{concept}}").join(invoice.description);
                                                        mailbody = mailbody.split("{{contact}}").join(org ? org.contact : corp.contact);
                                                        mailbody = mailbody.split("{{contactemail}}").join(org ? org.contactemail : corp.contactemail);
                                                        mailbody = mailbody.split("{{corporg}}").join(org ? org.description : corp.description);
                                                        mailbody = mailbody.split("{{currency}}").join(invoice.currency);
                                                        mailbody = mailbody.split("{{docnum}}").join(org ? org.docnum : corp.docnum);
                                                        mailbody = mailbody.split("{{fiscaladdress}}").join(org ? org.fiscaladdress : corp.fiscaladdress);
                                                        mailbody = mailbody.split("{{month}}").join(invoice.month);
                                                        mailbody = mailbody.split("{{sunatcountry}}").join(org ? org.sunatcountry : corp.sunatcountry);
                                                        mailbody = mailbody.split("{{year}}").join(invoice.year);

                                                        mailsubject = mailsubject.split("{{amountdetraction}}").join(detractionamount);
                                                        mailsubject = mailsubject.split("{{amountpaid}}").join(culqiamount);
                                                        mailsubject = mailsubject.split("{{amounttotal}}").join(invoice.totalamount);
                                                        mailsubject = mailsubject.split("{{businessname}}").join(org ? org.businessname : corp.businessname);
                                                        mailsubject = mailsubject.split("{{concept}}").join(invoice.description);
                                                        mailsubject = mailsubject.split("{{contact}}").join(org ? org.contact : corp.contact);
                                                        mailsubject = mailsubject.split("{{contactemail}}").join(org ? org.contactemail : corp.contactemail);
                                                        mailsubject = mailsubject.split("{{corporg}}").join(org ? org.description : corp.description);
                                                        mailsubject = mailsubject.split("{{currency}}").join(invoice.currency);
                                                        mailsubject = mailsubject.split("{{docnum}}").join(org ? org.docnum : corp.docnum);
                                                        mailsubject = mailsubject.split("{{fiscaladdress}}").join(org ? org.fiscaladdress : corp.fiscaladdress);
                                                        mailsubject = mailsubject.split("{{month}}").join(invoice.month);
                                                        mailsubject = mailsubject.split("{{sunatcountry}}").join(org ? org.sunatcountry : corp.sunatcountry);
                                                        mailsubject = mailsubject.split("{{year}}").join(invoice.year);

                                                        const requestMailSend = await axiosObservable({
                                                            data: {
                                                                mailAddress: (org ? org.contactemail : corp.contactemail),
                                                                mailBody: mailbody,
                                                                mailTitle: mailsubject,
                                                            },
                                                            method: "post",
                                                            url: `${bridgeEndpoint}processscheduler/sendmail`,
                                                            _requestid: responsedata.id,
                                                        });

                                                        if (!requestMailSend.data.success) {
                                                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, requestMailSend.data.operationMessage, responsedata.status, responsedata.success);
                                                        }
                                                    }
                                                    else {
                                                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "alert_automaticpayment_noalertdomain", responsedata.status, responsedata.success);
                                                    }
                                                }
                                                else {
                                                    const alertbody = await genericfunctions.searchDomain(1, 0, false, "PAYMENTALERTERRORBODY", "SCHEDULER", responsedata.id);
                                                    const alertsubject = await genericfunctions.searchDomain(1, 0, false, "PAYMENTALERTERRORSUBJECT", "SCHEDULER", responsedata.id);

                                                    if (alertbody && alertsubject) {
                                                        var mailbody = alertbody.domainvalue;
                                                        var mailsubject = alertsubject.domainvalue;

                                                        mailbody = mailbody.split("{{amountdetraction}}").join(detractionamount);
                                                        mailbody = mailbody.split("{{amountpaid}}").join(culqiamount);
                                                        mailbody = mailbody.split("{{amounttotal}}").join(invoice.totalamount);
                                                        mailbody = mailbody.split("{{businessname}}").join(org ? org.businessname : corp.businessname);
                                                        mailbody = mailbody.split("{{concept}}").join(invoice.description);
                                                        mailbody = mailbody.split("{{contact}}").join(org ? org.contact : corp.contact);
                                                        mailbody = mailbody.split("{{contactemail}}").join(org ? org.contactemail : corp.contactemail);
                                                        mailbody = mailbody.split("{{corporg}}").join(org ? org.description : corp.description);
                                                        mailbody = mailbody.split("{{currency}}").join(invoice.currency);
                                                        mailbody = mailbody.split("{{docnum}}").join(org ? org.docnum : corp.docnum);
                                                        mailbody = mailbody.split("{{fiscaladdress}}").join(org ? org.fiscaladdress : corp.fiscaladdress);
                                                        mailbody = mailbody.split("{{month}}").join(invoice.month);
                                                        mailbody = mailbody.split("{{sunatcountry}}").join(org ? org.sunatcountry : corp.sunatcountry);
                                                        mailbody = mailbody.split("{{year}}").join(invoice.year);

                                                        mailsubject = mailsubject.split("{{amountdetraction}}").join(detractionamount);
                                                        mailsubject = mailsubject.split("{{amountpaid}}").join(culqiamount);
                                                        mailsubject = mailsubject.split("{{amounttotal}}").join(invoice.totalamount);
                                                        mailsubject = mailsubject.split("{{businessname}}").join(org ? org.businessname : corp.businessname);
                                                        mailsubject = mailsubject.split("{{concept}}").join(invoice.description);
                                                        mailsubject = mailsubject.split("{{contact}}").join(org ? org.contact : corp.contact);
                                                        mailsubject = mailsubject.split("{{contactemail}}").join(org ? org.contactemail : corp.contactemail);
                                                        mailsubject = mailsubject.split("{{corporg}}").join(org ? org.description : corp.description);
                                                        mailsubject = mailsubject.split("{{currency}}").join(invoice.currency);
                                                        mailsubject = mailsubject.split("{{docnum}}").join(org ? org.docnum : corp.docnum);
                                                        mailsubject = mailsubject.split("{{fiscaladdress}}").join(org ? org.fiscaladdress : corp.fiscaladdress);
                                                        mailsubject = mailsubject.split("{{month}}").join(invoice.month);
                                                        mailsubject = mailsubject.split("{{sunatcountry}}").join(org ? org.sunatcountry : corp.sunatcountry);
                                                        mailsubject = mailsubject.split("{{year}}").join(invoice.year);

                                                        const requestMailSend = await axiosObservable({
                                                            data: {
                                                                mailAddress: (org ? org.contactemail : corp.contactemail),
                                                                mailBody: mailbody,
                                                                mailTitle: mailsubject,
                                                            },
                                                            method: "post",
                                                            url: `${bridgeEndpoint}processscheduler/sendmail`,
                                                            _requestid: responsedata.id,
                                                        });

                                                        if (!requestMailSend.data.success) {
                                                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, requestMailSend.data.operationMessage, responsedata.status, responsedata.success);
                                                        }
                                                    }

                                                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "error_automaticpayment_paymenterror", responsedata.status, responsedata.success);
                                                }
                                            }
                                            else {
                                                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "error_automaticpayment_nocountry_nodoctype", responsedata.status, responsedata.success);
                                            }
                                        }
                                        else {
                                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "error_automaticpayment_noexchangerate", responsedata.status, responsedata.success);
                                        }
                                    }
                                    else {
                                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "error_automaticpayment_nofavoritecard", responsedata.status, responsedata.success);
                                    }
                                }
                                else {
                                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "error_automaticpayment_nopaymentcard", responsedata.status, responsedata.success);
                                }

                                if (invoice.invoicestatus !== "INVOICED" && paymentsuccess) {
                                    const invoicedetail = await genericfunctions.getInvoiceDetail(corpid, orgid, 0, invoiceid, responsedata.id);
                                    var invoicesuccess = false;

                                    if (invoicedetail) {
                                        var documenttype = null;
                                        var invoicecorrelative = null;

                                        if (org) {
                                            if ((org.sunatcountry === "PE") && (org.doctype === "1" || org.doctype === "4" || org.doctype === "7")) {
                                                invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "TICKET", responsedata.id);
                                                documenttype = "03";
                                            }
                                            else {
                                                invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "INVOICE", responsedata.id);
                                                documenttype = "01";
                                            }
                                        }
                                        else {
                                            if ((corp.sunatcountry === "PE") && (corp.doctype === "1" || corp.doctype === "4" || corp.doctype === "7")) {
                                                invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "TICKET", responsedata.id);
                                                documenttype = "03";
                                            }
                                            else {
                                                invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "INVOICE", responsedata.id);
                                                documenttype = "01";
                                            }
                                        }

                                        if (invoicecorrelative) {
                                            try {
                                                var invoicedata = {
                                                    CodigoAnexoEmisor: appsetting.annexcode,
                                                    CodigoFormatoImpresion: appsetting.printingformat,
                                                    CodigoMoneda: invoice.currency,
                                                    CodigoRucReceptor: org ? org.doctype : corp.doctype,
                                                    CodigoUbigeoEmisor: appsetting.ubigeo,
                                                    CorrelativoDocumento: genericfunctions.padNumber(invoicecorrelative.p_correlative, 8),
                                                    DataList: [],
                                                    DireccionFiscalEmisor: appsetting.fiscaladdress,
                                                    DireccionFiscalReceptor: org ? org.fiscaladdress : corp.fiscaladdress,
                                                    Endpoint: appsetting.sunaturl,
                                                    EnviarSunat: org ? org.autosendinvoice : corp.autosendinvoice,
                                                    FechaEmision: new Date(new Date().setHours(new Date().getHours() - 5)).toISOString().split("T")[0],
                                                    FechaVencimiento: new Date(new Date().setHours(new Date().getHours() - 5)).toISOString().split("T")[0],
                                                    MailEnvio: org ? org.contactemail : corp.contactemail,
                                                    MontoTotal: Math.round((invoice.totalamount + Number.EPSILON) * 100) / 100,
                                                    NombreComercialEmisor: appsetting.tradename,
                                                    NumeroDocumentoReceptor: org ? org.docnum : corp.docnum,
                                                    NumeroSerieDocumento: documenttype === "01" ? appsetting.invoiceserie : appsetting.ticketserie,
                                                    PaisRecepcion: org ? org.sunatcountry : corp.sunatcountry,
                                                    ProductList: [],
                                                    RazonSocialEmisor: appsetting.businessname,
                                                    RazonSocialReceptor: org ? org.businessname : corp.businessname,
                                                    RetornaPdf: appsetting.returnpdf,
                                                    RetornaXml: appsetting.returnxml,
                                                    RetornaXmlSunat: appsetting.returnxmlsunat,
                                                    RucEmisor: appsetting.ruc,
                                                    TipoCambio: invoice.currency === "PEN" ? "1.000" : ((exchangeratedata?.exchangeratesol / exchangeratedata?.exchangerate) || invoice.exchangerate),
                                                    TipoDocumento: documenttype,
                                                    TipoRucEmisor: appsetting.emittertype,
                                                    Token: appsetting.token,
                                                    Username: appsetting.sunatusername,
                                                    VersionXml: appsetting.xmlversion,
                                                    VersionUbl: appsetting.ublversion,
                                                }

                                                if (org) {
                                                    invoicedata.CodigoOperacionSunat = org.sunatcountry === "PE" ? appsetting.operationcodeperu : appsetting.operationcodeother;
                                                    invoicedata.MontoTotalGravado = org.sunatcountry === "PE" ? Math.round((invoice.subtotal + Number.EPSILON) * 100) / 100 : null;
                                                    invoicedata.MontoTotalIgv = org.sunatcountry === "PE" ? Math.round((invoice.taxes + Number.EPSILON) * 100) / 100 : null;
                                                    invoicedata.MontoTotalInafecto = org.sunatcountry === "PE" ? "0" : Math.round((invoice.subtotal + Number.EPSILON) * 100) / 100;
                                                }
                                                else {
                                                    invoicedata.CodigoOperacionSunat = corp.sunatcountry === "PE" ? appsetting.operationcodeperu : appsetting.operationcodeother;
                                                    invoicedata.MontoTotalGravado = corp.sunatcountry === "PE" ? Math.round((invoice.subtotal + Number.EPSILON) * 100) / 100 : null;
                                                    invoicedata.MontoTotalIgv = corp.sunatcountry === "PE" ? Math.round((invoice.taxes + Number.EPSILON) * 100) / 100 : null;
                                                    invoicedata.MontoTotalInafecto = corp.sunatcountry === "PE" ? "0" : Math.round((invoice.subtotal + Number.EPSILON) * 100) / 100;
                                                }

                                                var calcdetraction = false;

                                                if (org) {
                                                    if (org.sunatcountry === "PE") {
                                                        calcdetraction = true;
                                                    }
                                                }
                                                else {
                                                    if (corp.sunatcountry === "PE") {
                                                        calcdetraction = true;
                                                    }
                                                }

                                                var adicional01 = {
                                                    CodigoDatoAdicional: "05",
                                                    DescripcionDatoAdicional: "FORMA DE PAGO: TRANSFERENCIA"
                                                }

                                                invoicedata.DataList.push(adicional01);

                                                if (calcdetraction) {
                                                    if (appsetting.detraction && appsetting.detractioncode && appsetting.detractionaccount && (appsetting.detractionminimum || appsetting.detractionminimum === 0)) {
                                                        var compareamount = 0;

                                                        if (appsetting.detractionminimum) {
                                                            if (invoice.currency !== "PEN") {
                                                                var exchangeratedata = await genericfunctions.getExchangeRate(invoice.currency, responsedata.id);

                                                                if (exchangeratedata) {
                                                                    compareamount = (invoice.totalamount / (exchangeratedata?.exchangerate || 0) * (exchangeratedata?.exchangeratesol || 0));
                                                                }
                                                            }
                                                            else {
                                                                compareamount = invoice.totalamount;
                                                            }
                                                        }

                                                        if (compareamount > appsetting.detractionminimum) {
                                                            invoicedata.CodigoDetraccion = appsetting.detractioncode;
                                                            invoicedata.CodigoOperacionSunat = "1001";
                                                            invoicedata.MontoTotalDetraccion = Math.round(Math.round(((invoice.totalamount * appsetting.detraction) + Number.EPSILON) * 100) / 100);
                                                            invoicedata.MontoPendienteDetraccion = Math.round(((invoicedata.MontoTotal - (invoicedata.MontoTotalDetraccion || 0)) + Number.EPSILON) * 100) / 100;
                                                            invoicedata.MontoTotalInafecto = null;
                                                            invoicedata.NumeroCuentaDetraccion = appsetting.detractionaccount;
                                                            invoicedata.PaisRecepcion = null;
                                                            invoicedata.PorcentajeTotalDetraccion = appsetting.detraction * 100;

                                                            var adicional02 = {
                                                                CodigoDatoAdicional: "06",
                                                                DescripcionDatoAdicional: "CUENTA DE DETRACCION: " + appsetting.detractionaccount,
                                                            }

                                                            invoicedata.DataList.push(adicional02);
                                                        }
                                                    }
                                                }

                                                invoicedetail.forEach(async data => {
                                                    var invoicedetaildata = {
                                                        CantidadProducto: data.quantity,
                                                        CodigoProducto: data.productcode,
                                                        DescripcionProducto: data.productdescription,
                                                        IgvTotal: Math.round((data.totaligv + Number.EPSILON) * 100) / 100,
                                                        MontoTotal: Math.round((data.totalamount + Number.EPSILON) * 100) / 100,
                                                        PrecioNetoProducto: Math.round((data.productnetprice + Number.EPSILON) * 100) / 100,
                                                        PrecioProducto: Math.round((data.productprice + Number.EPSILON) * 100) / 100,
                                                        TasaIgv: Math.round((data.igvrate * 100) || 0),
                                                        TipoVenta: data.saletype,
                                                        UnidadMedida: data.measureunit,
                                                        ValorNetoProducto: Math.round(((data.quantity * data.productnetprice) + Number.EPSILON) * 100) / 100,
                                                    };

                                                    if (org) {
                                                        invoicedetaildata.AfectadoIgv = org.sunatcountry === "PE" ? "10" : "40";
                                                        invoicedetaildata.TributoIgv = org.sunatcountry === "PE" ? "1000" : "9998";
                                                    }
                                                    else {
                                                        invoicedetaildata.AfectadoIgv = corp.sunatcountry === "PE" ? "10" : "40";
                                                        invoicedetaildata.TributoIgv = corp.sunatcountry === "PE" ? "1000" : "9998";
                                                    }

                                                    invoicedata.ProductList.push(invoicedetaildata);
                                                });

                                                var adicional05 = {
                                                    CodigoDatoAdicional: "01",
                                                    DescripcionDatoAdicional: "AL CONTADO",
                                                }

                                                invoicedata.DataList.push(adicional05);

                                                if (adicional05) {
                                                    invoicedata.FechaVencimiento = null;
                                                }

                                                if (appsetting?.invoiceprovider === "MIFACT") {
                                                    const requestSendToSunat = await axiosObservable({
                                                        data: invoicedata,
                                                        method: "post",
                                                        url: `${bridgeEndpoint}processmifact/sendinvoice`,
                                                        _requestid: responsedata.id,
                                                    });

                                                    if (requestSendToSunat.data.result) {
                                                        invoicesuccess = true;

                                                        await genericfunctions.invoiceSunat(corpid, orgid, invoiceid, "INVOICED", null, requestSendToSunat.data.result.cadenaCodigoQr, requestSendToSunat.data.result.codigoHash, requestSendToSunat.data.result.urlCdrSunat, requestSendToSunat.data.result.urlPdf, requestSendToSunat.data.result.urlXml, invoicedata.NumeroSerieDocumento, appsetting?.ruc || null, appsetting?.businessname || null, appsetting?.tradename || null, appsetting?.fiscaladdress || null, appsetting?.ubigeo || null, appsetting?.emittertype || null, appsetting?.annexcode || null, appsetting?.printingformat || null, invoicedata?.EnviarSunat || null, appsetting?.returnpdf || null, appsetting?.returnxmlsunat || null, appsetting?.returnxml || null, appsetting?.token || null, appsetting?.sunaturl || null, appsetting?.sunatusername || null, appsetting?.xmlversion || null, appsetting?.ublversion || null, invoicedata?.CodigoRucReceptor || null, invoicedata?.NumeroDocumentoReceptor || null, invoicedata?.RazonSocialReceptor || null, invoicedata?.DireccionFiscalReceptor || null, invoicedata?.PaisRecepcion || null, invoicedata?.MailEnvio || null, documenttype || null, invoicedata?.CodigoOperacionSunat || null, invoicedata?.FechaVencimiento || null, null, null, "typecredit_alcontado" || null, appsetting?.detractioncode || null, appsetting?.detraction || null, appsetting?.detractionaccount, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);

                                                        const requestSendMail = await axiosObservable({
                                                            data: invoicedata,
                                                            method: "post",
                                                            url: `${bridgeEndpoint}processmifact/sendmailinvoice`,
                                                            _requestid: responsedata.id,
                                                        });

                                                        if (!requestSendMail.data.result) {
                                                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "alert_automaticinvoice_mailalert", responsedata.status, responsedata.success);
                                                        }
                                                    }
                                                    else {
                                                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "error_automaticinvoice_invoiceerror", responsedata.status, responsedata.success);

                                                        await genericfunctions.invoiceSunat(corpid, orgid, invoiceid, "ERROR", requestSendToSunat.data.operationMessage, null, null, null, null, null, null, appsetting?.ruc || null, appsetting?.businessname || null, appsetting?.tradename || null, appsetting?.fiscaladdress || null, appsetting?.ubigeo || null, appsetting?.emittertype || null, appsetting?.annexcode || null, appsetting?.printingformat || null, invoicedata?.EnviarSunat || null, appsetting?.returnpdf || null, appsetting?.returnxmlsunat || null, appsetting?.returnxml || null, appsetting?.token || null, appsetting?.sunaturl || null, appsetting?.sunatusername || null, appsetting?.xmlversion || null, appsetting?.ublversion || null, invoicedata?.CodigoRucReceptor || null, invoicedata?.NumeroDocumentoReceptor || null, invoicedata?.RazonSocialReceptor || null, invoicedata?.DireccionFiscalReceptor || null, invoicedata?.PaisRecepcion || null, invoicedata?.MailEnvio || null, documenttype || null, invoicedata?.CodigoOperacionSunat || null, invoicedata?.FechaVencimiento || null, null, null, "typecredit_alcontado" || null, appsetting?.detractioncode || null, appsetting?.detraction || null, appsetting?.detractionaccount, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);

                                                        if (org) {
                                                            if ((org.sunatcountry === "PE") && (org.doctype === "1" || org.doctype === "4" || org.doctype === "7")) {
                                                                await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "TICKETERROR", responsedata.id);
                                                            }
                                                            else {
                                                                await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "INVOICEERROR", responsedata.id);
                                                            }
                                                        }
                                                        else {
                                                            if ((corp.sunatcountry === "PE") && (corp.doctype === "1" || corp.doctype === "4" || corp.doctype === "7")) {
                                                                await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "TICKETERROR", responsedata.id);
                                                            }
                                                            else {
                                                                await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "INVOICEERROR", responsedata.id);
                                                            }
                                                        }
                                                    }
                                                }
                                                else if (appsetting?.invoiceprovider === "SIIGO") {
                                                    invoicedata.TipoDocumentoSiigo = "FV";
                                                    invoicedata.TipoCambio = invoice.currency === "COP" ? "1.000" : ((exchangeratedata?.exchangeratecop / exchangeratedata?.exchangerate) || invoice.exchangerate);
                                                    invoicedata.TipoPago = (paymenttype == "Crédito" || paymenttype == "credit") ? "Tarjeta Crédito" : "Tarjeta Débito";
                                                    invoicedata.CityCountry = org ? org.countrycode : corp.countrycode;
                                                    invoicedata.CityState = org ? org.statecode : corp.statecode;
                                                    invoicedata.CityCode = org ? org.citycode : corp.citycode;

                                                    const requestSendToSiigo = await axiosObservable({
                                                        data: invoicedata,
                                                        method: "post",
                                                        url: `${bridgeEndpoint}processsiigo/sendinvoice`,
                                                        _requestid: responsedata.id,
                                                    });

                                                    if (requestSendToSiigo.data.result) {
                                                        invoicesuccess = true;

                                                        invoicedata.InvoiceId = requestSendToSiigo.data.result.codigoHash;

                                                        let correlativeOverride = null;

                                                        if (requestSendToSiigo.data.result.correlativoCpe) {
                                                            correlativeOverride = parseInt(`${requestSendToSiigo.data.result.correlativoCpe}`);
                                                        }

                                                        await genericfunctions.invoiceSunat(corpid, orgid, invoiceid, "INVOICED", null, requestSendToSiigo.data.result.cadenaCodigoQr, requestSendToSiigo.data.result.codigoHash, requestSendToSiigo.data.result.urlCdrSunat, requestSendToSiigo.data.result.urlPdf, requestSendToSiigo.data.result.urlXml, invoicedata.NumeroSerieDocumento, appsetting?.ruc || null, appsetting?.businessname || null, appsetting?.tradename || null, appsetting?.fiscaladdress || null, appsetting?.ubigeo || null, appsetting?.emittertype || null, appsetting?.annexcode || null, appsetting?.printingformat || null, invoicedata?.EnviarSunat || null, appsetting?.returnpdf || null, appsetting?.returnxmlsunat || null, appsetting?.returnxml || null, appsetting?.token || null, appsetting?.sunaturl || null, appsetting?.sunatusername || null, appsetting?.xmlversion || null, appsetting?.ublversion || null, invoicedata?.CodigoRucReceptor || null, invoicedata?.NumeroDocumentoReceptor || null, invoicedata?.RazonSocialReceptor || null, invoicedata?.DireccionFiscalReceptor || null, invoicedata?.PaisRecepcion || null, invoicedata?.MailEnvio || null, documenttype || null, invoicedata?.CodigoOperacionSunat || null, invoicedata?.FechaVencimiento || null, null, null, "typecredit_alcontado" || null, appsetting?.detractioncode || null, appsetting?.detraction || null, appsetting?.detractionaccount, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, correlativeOverride, responsedata.id);

                                                        const requestSendMail = await axiosObservable({
                                                            data: invoicedata,
                                                            method: "post",
                                                            url: `${bridgeEndpoint}processsiigo/sendmailinvoice`,
                                                            _requestid: responsedata.id,
                                                        });

                                                        if (!requestSendMail.data.success) {
                                                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "alert_automaticinvoice_mailalert", responsedata.status, responsedata.success);
                                                        }
                                                    }
                                                    else {
                                                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "error_automaticinvoice_invoiceerror", responsedata.status, responsedata.success);

                                                        await genericfunctions.invoiceSunat(corpid, orgid, invoiceid, "ERROR", requestSendToSiigo.data.operationMessage, null, null, null, null, null, null, appsetting?.ruc || null, appsetting?.businessname || null, appsetting?.tradename || null, appsetting?.fiscaladdress || null, appsetting?.ubigeo || null, appsetting?.emittertype || null, appsetting?.annexcode || null, appsetting?.printingformat || null, invoicedata?.EnviarSunat || null, appsetting?.returnpdf || null, appsetting?.returnxmlsunat || null, appsetting?.returnxml || null, appsetting?.token || null, appsetting?.sunaturl || null, appsetting?.sunatusername || null, appsetting?.xmlversion || null, appsetting?.ublversion || null, invoicedata?.CodigoRucReceptor || null, invoicedata?.NumeroDocumentoReceptor || null, invoicedata?.RazonSocialReceptor || null, invoicedata?.DireccionFiscalReceptor || null, invoicedata?.PaisRecepcion || null, invoicedata?.MailEnvio || null, documenttype || null, invoicedata?.CodigoOperacionSunat || null, invoicedata?.FechaVencimiento || null, null, null, "typecredit_alcontado" || null, appsetting?.detractioncode || null, appsetting?.detraction || null, appsetting?.detractionaccount, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);

                                                        if (org) {
                                                            if ((org.sunatcountry === "PE") && (org.doctype === "1" || org.doctype === "4" || org.doctype === "7")) {
                                                                await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "TICKETERROR", responsedata.id);
                                                            }
                                                            else {
                                                                await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "INVOICEERROR", responsedata.id);
                                                            }
                                                        }
                                                        else {
                                                            if ((corp.sunatcountry === "PE") && (corp.doctype === "1" || corp.doctype === "4" || corp.doctype === "7")) {
                                                                await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "TICKETERROR", responsedata.id);
                                                            }
                                                            else {
                                                                await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "INVOICEERROR", responsedata.id);
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                            catch (exception) {
                                                printException(exception, request.originalUrl, responsedata.id);

                                                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "error_automaticinvoice_exception", responsedata.status, responsedata.success);

                                                await genericfunctions.invoiceSunat(corpid, orgid, invoiceid, "ERROR", exception.message, null, null, null, null, null, null, appsetting.ruc, appsetting.businessname, appsetting.tradename, appsetting.fiscaladdress, appsetting.ubigeo, appsetting.emittertype, appsetting.annexcode, appsetting.printingformat, appsetting.sendtosunat, appsetting.returnpdf, appsetting.returnxmlsunat, appsetting.returnxml, appsetting.token, appsetting.sunaturl, appsetting.sunatusername, appsetting.xmlversion, appsetting.ublversion, (org ? org.doctype : corp.doctype) || null, (org ? org.docnum : corp.docnum) || null, (org ? org.businessname : corp.businessname) || null, (org ? org.fiscaladdress : corp.fiscaladdress) || null, (org ? org.sunatcountry : corp.sunatcountry) || null, (org ? org.contactemail : corp.contactemail) || null, null, null, null, null, null, null, null, null, null, null, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);

                                                if (org) {
                                                    if ((org.sunatcountry === "PE") && (org.doctype === "1" || org.doctype === "4" || org.doctype === "7")) {
                                                        await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "TICKETERROR", responsedata.id);
                                                    }
                                                    else {
                                                        await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "INVOICEERROR", responsedata.id);
                                                    }
                                                }
                                                else {
                                                    if ((corp.sunatcountry === "PE") && (corp.doctype === "1" || corp.doctype === "4" || corp.doctype === "7")) {
                                                        await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "TICKETERROR", responsedata.id);
                                                    }
                                                    else {
                                                        await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "INVOICEERROR", responsedata.id);
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "error_automaticinvoice_nocorrelative", responsedata.status, responsedata.success);

                                            await genericfunctions.invoiceSunat(corpid, orgid, invoiceid, "ERROR", "Correlative not found", null, null, null, null, null, null, appsetting.ruc, appsetting.businessname, appsetting.tradename, appsetting.fiscaladdress, appsetting.ubigeo, appsetting.emittertype, appsetting.annexcode, appsetting.printingformat, appsetting.sendtosunat, appsetting.returnpdf, appsetting.returnxmlsunat, appsetting.returnxml, appsetting.token, appsetting.sunaturl, appsetting.sunatusername, appsetting.xmlversion, appsetting.ublversion, (org ? org.doctype : corp.doctype) || null, (org ? org.docnum : corp.docnum) || null, (org ? org.businessname : corp.businessname) || null, (org ? org.fiscaladdress : corp.fiscaladdress) || null, (org ? org.sunatcountry : corp.sunatcountry) || null, (org ? org.contactemail : corp.contactemail) || null, null, null, null, null, null, null, null, null, null, null, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);
                                        }
                                    }
                                    else {
                                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "error_automaticinvoice_noinvoicedetail", responsedata.status, responsedata.success);
                                    }

                                    if (!invoicesuccess) {
                                        const alertbody = await genericfunctions.searchDomain(1, 0, false, "INVOICEALERTERRORBODY", "SCHEDULER", responsedata.id);
                                        const alertsubject = await genericfunctions.searchDomain(1, 0, false, "INVOICEALERTERRORSUBJECT", "SCHEDULER", responsedata.id);

                                        if (alertbody && alertsubject) {
                                            var mailbody = alertbody.domainvalue;
                                            var mailsubject = alertsubject.domainvalue;

                                            mailbody = mailbody.split("{{amountdetraction}}").join(detractionamount);
                                            mailbody = mailbody.split("{{amountpaid}}").join(culqiamount);
                                            mailbody = mailbody.split("{{amounttotal}}").join(invoice.totalamount);
                                            mailbody = mailbody.split("{{businessname}}").join(org ? org.businessname : corp.businessname);
                                            mailbody = mailbody.split("{{concept}}").join(invoice.description);
                                            mailbody = mailbody.split("{{contact}}").join(org ? org.contact : corp.contact);
                                            mailbody = mailbody.split("{{contactemail}}").join(org ? org.contactemail : corp.contactemail);
                                            mailbody = mailbody.split("{{corporg}}").join(org ? org.description : corp.description);
                                            mailbody = mailbody.split("{{currency}}").join(invoice.currency);
                                            mailbody = mailbody.split("{{docnum}}").join(org ? org.docnum : corp.docnum);
                                            mailbody = mailbody.split("{{fiscaladdress}}").join(org ? org.fiscaladdress : corp.fiscaladdress);
                                            mailbody = mailbody.split("{{month}}").join(invoice.month);
                                            mailbody = mailbody.split("{{sunatcountry}}").join(org ? org.sunatcountry : corp.sunatcountry);
                                            mailbody = mailbody.split("{{year}}").join(invoice.year);

                                            mailsubject = mailsubject.split("{{amountdetraction}}").join(detractionamount);
                                            mailsubject = mailsubject.split("{{amountpaid}}").join(culqiamount);
                                            mailsubject = mailsubject.split("{{amounttotal}}").join(invoice.totalamount);
                                            mailsubject = mailsubject.split("{{businessname}}").join(org ? org.businessname : corp.businessname);
                                            mailsubject = mailsubject.split("{{concept}}").join(invoice.description);
                                            mailsubject = mailsubject.split("{{contact}}").join(org ? org.contact : corp.contact);
                                            mailsubject = mailsubject.split("{{contactemail}}").join(org ? org.contactemail : corp.contactemail);
                                            mailsubject = mailsubject.split("{{corporg}}").join(org ? org.description : corp.description);
                                            mailsubject = mailsubject.split("{{currency}}").join(invoice.currency);
                                            mailsubject = mailsubject.split("{{docnum}}").join(org ? org.docnum : corp.docnum);
                                            mailsubject = mailsubject.split("{{fiscaladdress}}").join(org ? org.fiscaladdress : corp.fiscaladdress);
                                            mailsubject = mailsubject.split("{{month}}").join(invoice.month);
                                            mailsubject = mailsubject.split("{{sunatcountry}}").join(org ? org.sunatcountry : corp.sunatcountry);
                                            mailsubject = mailsubject.split("{{year}}").join(invoice.year);

                                            const requestMailSend = await axiosObservable({
                                                data: {
                                                    mailAddress: (org ? org.contactemail : corp.contactemail),
                                                    mailBody: mailbody,
                                                    mailTitle: mailsubject,
                                                },
                                                method: "post",
                                                url: `${bridgeEndpoint}processscheduler/sendmail`,
                                                _requestid: responsedata.id,
                                            });

                                            if (!requestMailSend.data.success) {
                                                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, requestMailSend.data.operationMessage, responsedata.status, responsedata.success);
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                responsedata = genericfunctions.changeResponseData(responsedata, null, null, "success_automaticpayment_alreadypaid", 200, true);
                            }
                        }
                        else {
                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "error_automaticpayment_noinvoice", responsedata.status, responsedata.success);
                        }
                    }
                    else {
                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "error_automaticpayment_noappsetting", responsedata.status, responsedata.success);
                    }
                }
                else {
                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "error_automaticpayment_noorg", responsedata.status, responsedata.success);
                }
            }
            else {
                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "error_automaticpayment_nocorp", responsedata.status, responsedata.success);
            }
        }

        return response.status(responsedata.status).json(responsedata);
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
};

exports.cardCreate = async (request, response) => {
    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var responsedata = genericfunctions.generateResponseData(request._requestid);

        if (typeof whitelist !== "undefined" && whitelist) {
            if (!whitelist.includes(request.ip)) {
                responsedata = genericfunctions.changeResponseData(responsedata, 401, null, "error_auth_error", 401, false);
                return response.status(responsedata.status).json(responsedata);
            }
        }

        if (request.body) {
            const { firstname, lastname, mail, cardnumber, securitycode, expirationmonth, expirationyear, favorite, phone } = request.body;
            const { corpid, orgid, userid, usr } = request.user;

            const appsetting = await genericfunctions.getAppSettingSingle(corpid, orgid, responsedata.id);

            if (appsetting) {
                const corp = await genericfunctions.getCorporation(corpid, responsedata.id);
                const org = await genericfunctions.getOrganization(corpid, orgid, responsedata.id);
                const user = await genericfunctions.getProfile(userid, responsedata.id);

                if (user && (corp || org)) {
                    var canRegister = true;

                    if (!favorite) {
                        canRegister = await genericfunctions.favoritePaymentCard(corpid, responsedata.id);
                    }

                    if (canRegister) {
                        var cleancardnumber = cardnumber.split(" ").join("");

                        if (appsetting?.paymentprovider === "CULQI") {
                            const requestCulqiClient = await axiosObservable({
                                data: {
                                    address: `${(genericfunctions.removeSpecialCharacter((org ? org.fiscaladdress : corp.fiscaladdress) || "EMPTY")).slice(0, 100)}`,
                                    addressCity: `${(genericfunctions.removeSpecialCharacter((org ? org.timezone : "EMPTY") || "EMPTY")).slice(0, 30)}`,
                                    bearer: appsetting.privatekey,
                                    countryCode: `${(user.country || "PE")}`,
                                    email: `${(mail || "generic@mail.com")}`,
                                    firstName: `${(genericfunctions.removeSpecialCharacter(firstname?.replace(/[0-9]/g, "") || "EMPTY")).slice(0, 50)}`,
                                    lastName: `${(genericfunctions.removeSpecialCharacter(lastname?.replace(/[0-9]/g, "") || "EMPTY")).slice(0, 50)}`,
                                    operation: "CREATE",
                                    phoneNumber: `${((phone || user.phone) ? (phone || user.phone).replace(/[^0-9]/g, "") : "51999999999").slice(0, 15)}`,
                                    url: appsetting.culqiurlclient,
                                },
                                method: "post",
                                url: `${bridgeEndpoint}processculqi/handleclient`,
                                _requestid: responsedata.id,
                            });

                            if (requestCulqiClient.data.success) {
                                const requestCulqiCard = await axiosObservable({
                                    data: {
                                        bearer: appsetting.privatekey,
                                        bearerToken: appsetting.publickey,
                                        cardNumber: cleancardnumber,
                                        customerId: requestCulqiClient.data.result.id,
                                        cvv: securitycode,
                                        email: mail,
                                        expirationMonth: expirationmonth,
                                        expirationYear: expirationyear,
                                        operation: "CREATE",
                                        url: appsetting.culqiurlcardcreate,
                                        urlToken: appsetting.culqiurltoken,
                                    },
                                    method: "post",
                                    url: `${bridgeEndpoint}processculqi/handlecard`,
                                    _requestid: responsedata.id,
                                });

                                if (requestCulqiCard.data.success) {
                                    cardData = requestCulqiCard.data.result;

                                    const queryPaymentCardInsert = await genericfunctions.createPaymentCard(corpid, orgid, 0, cardData.source.cardNumber, cardData.id, firstname, lastname, mail, favorite, cardData.customerId, "ACTIVO", phone, "", usr, responsedata.id);

                                    if (queryPaymentCardInsert instanceof Array) {
                                        responsedata = genericfunctions.changeResponseData(responsedata, null, null, null, 200, true);
                                    }
                                    else {
                                        responsedata = genericfunctions.changeResponseData(responsedata, queryPaymentCardInsert.code, responsedata.data, "error_card_insert", responsedata.status, responsedata.success);
                                    }
                                }
                                else {
                                    let errorCard = genericfunctions.getCulqiError(requestCulqiCard?.data?.operationMessage) || "error_card_card";

                                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, errorCard, responsedata.status, responsedata.success);
                                }
                            }
                            else {
                                let errorCard = genericfunctions.getCulqiError(requestCulqiClient?.data?.operationMessage) || "error_card_client";

                                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, errorCard, responsedata.status, responsedata.success);
                            }
                        }
                        else if (appsetting?.paymentprovider === "OPENPAY COLOMBIA") {
                            const requestOpenpayClient = await axiosObservable({
                                data: {
                                    address: `${(genericfunctions.removeSpecialCharacter((org ? org.fiscaladdress : corp.fiscaladdress) || "EMPTY")).slice(0, 100)}`,
                                    addressCity: `${(genericfunctions.removeSpecialCharacter((org ? org.timezone : "EMPTY") || "EMPTY")).slice(0, 30)}`,
                                    countryCode: `${(user.country || "PE")}`,
                                    email: `${(mail || "generic@mail.com")}`,
                                    firstName: `${(genericfunctions.removeSpecialCharacter(firstname?.replace(/[0-9]/g, "") || "EMPTY")).slice(0, 50)}`,
                                    lastName: `${(genericfunctions.removeSpecialCharacter(lastname?.replace(/[0-9]/g, "") || "EMPTY")).slice(0, 50)}`,
                                    merchantId: appsetting.culqiurl,
                                    operation: "CREATE",
                                    phoneNumber: `${((phone || user.phone) ? (phone || user.phone).replace(/[^0-9]/g, "") : "51999999999").slice(0, 15)}`,
                                    secretKey: appsetting.privatekey,
                                    url: appsetting.culqiurlclient,
                                },
                                method: "post",
                                url: `${bridgeEndpoint}processopenpay/handleclient`,
                                _requestid: responsedata.id,
                            });

                            if (requestOpenpayClient.data.success) {
                                const requestOpenpayCard = await axiosObservable({
                                    data: {
                                        cardNumber: cleancardnumber,
                                        customerId: requestOpenpayClient.data.result.id,
                                        cvv: securitycode,
                                        email: mail,
                                        expirationMonth: expirationmonth,
                                        expirationYear: `${expirationyear}`.slice(-2),
                                        merchantId: appsetting.culqiurl,
                                        operation: "CREATE",
                                        secretKey: appsetting.privatekey,
                                        url: appsetting.culqiurlcardcreate,
                                    },
                                    method: "post",
                                    url: `${bridgeEndpoint}processopenpay/handlecard`,
                                    _requestid: responsedata.id,
                                });

                                if (requestOpenpayCard.data.success) {
                                    cardData = requestOpenpayCard.data.result;

                                    const queryPaymentCardInsert = await genericfunctions.createPaymentCard(corpid, orgid, 0, cardData.cardNumber, cardData.id, firstname, lastname, mail, favorite, requestOpenpayClient.data.result.id, "ACTIVO", phone, "", usr, responsedata.id);

                                    if (queryPaymentCardInsert instanceof Array) {
                                        responsedata = genericfunctions.changeResponseData(responsedata, null, null, null, 200, true);
                                    }
                                    else {
                                        responsedata = genericfunctions.changeResponseData(responsedata, queryPaymentCardInsert.code, responsedata.data, "error_card_insert", responsedata.status, responsedata.success);
                                    }
                                }
                                else {
                                    let errorCard = requestOpenpayCard?.data?.operationMessage || "error_card_card";

                                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, errorCard, responsedata.status, responsedata.success);
                                }
                            }
                            else {
                                let errorCard = requestOpenpayClient?.data?.operationMessage || "error_card_client";

                                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, requestOpenpayClient?.data?.operationMessage || errorCard, responsedata.status, responsedata.success);
                            }
                        }
                    }
                    else {
                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "error_card_nofavorite", responsedata.status, responsedata.success);
                    }
                }
                else {
                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "error_card_usernotfound", responsedata.status, responsedata.success);
                }
            }
            else {
                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "error_card_configuration", responsedata.status, responsedata.success);
            }
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

exports.cardDelete = async (request, response) => {
    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var responsedata = genericfunctions.generateResponseData(request._requestid);

        if (typeof whitelist !== "undefined" && whitelist) {
            if (!whitelist.includes(request.ip)) {
                responsedata = genericfunctions.changeResponseData(responsedata, 401, null, "error_auth_error", 401, false);
                return response.status(responsedata.status).json(responsedata);
            }
        }

        if (request.body) {
            const { corpid, orgid, paymentcardid, cardnumber, cardcode, firstname, lastname, mail, favorite, clientcode, type, phone } = request.body;
            const { usr } = request.user;

            const appsetting = await genericfunctions.getAppSettingSingle(corpid, orgid, responsedata.id);

            if (appsetting) {
                if (appsetting?.paymentprovider === "CULQI") {
                    const requestCulqiCard = await axiosObservable({
                        data: {
                            bearer: appsetting.privatekey,
                            id: cardcode,
                            operation: "DELETE",
                            url: appsetting.culqiurlcarddelete,
                        },
                        method: "post",
                        url: `${bridgeEndpoint}processculqi/handlecard`,
                        _requestid: responsedata.id,
                    });

                    if (requestCulqiCard.data.success) {
                        const queryPaymentCardUpdate = await genericfunctions.createPaymentCard(corpid, orgid, paymentcardid, cardnumber, cardcode, firstname, lastname, mail, favorite, clientcode, "ELIMINADO", phone, type, usr, responsedata.id);

                        if (queryPaymentCardUpdate instanceof Array) {
                            responsedata = genericfunctions.changeResponseData(responsedata, null, null, null, 200, true);
                        }
                        else {
                            responsedata = genericfunctions.changeResponseData(responsedata, queryPaymentCardUpdate.code, responsedata.data, "error_card_update", responsedata.status, responsedata.success);
                        }
                    }
                    else {
                        let errorCard = genericfunctions.getCulqiError(requestCulqiCard?.data?.operationMessage) || "error_card_delete";

                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, errorCard, responsedata.status, responsedata.success);
                    }
                }
                else if (appsetting?.paymentprovider === "OPENPAY COLOMBIA") {
                    const requestOpenpayCard = await axiosObservable({
                        data: {
                            customerId: clientcode,
                            id: cardcode,
                            merchantId: appsetting.culqiurl,
                            operation: "DELETE",
                            secretKey: appsetting.privatekey,
                            url: appsetting.culqiurlcarddelete,
                        },
                        method: "post",
                        url: `${bridgeEndpoint}processopenpay/handlecard`,
                        _requestid: responsedata.id,
                    });

                    if (requestOpenpayCard.data.success) {
                        const queryPaymentCardUpdate = await genericfunctions.createPaymentCard(corpid, orgid, paymentcardid, cardnumber, cardcode, firstname, lastname, mail, favorite, clientcode, "ELIMINADO", phone, type, usr, responsedata.id);

                        if (queryPaymentCardUpdate instanceof Array) {
                            responsedata = genericfunctions.changeResponseData(responsedata, null, null, null, 200, true);
                        }
                        else {
                            responsedata = genericfunctions.changeResponseData(responsedata, queryPaymentCardUpdate.code, responsedata.data, "error_card_update", responsedata.status, responsedata.success);
                        }
                    }
                    else {
                        let errorCard = requestOpenpayCard?.data?.operationMessage || "error_card_delete";

                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, errorCard, responsedata.status, responsedata.success);
                    }
                }
            }
            else {
                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "error_card_configuration", responsedata.status, responsedata.success);
            }
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

exports.chargeInvoice = async (request, response) => {
    const { userid, usr } = request.user;
    const { invoiceid, settings, token, metadata = {}, purchaseorder, comments, corpid, orgid, override, paymentcardid, paymentcardcode, iscard, transaction } = request.body;

    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var responsedata = genericfunctions.generateResponseData(request._requestid);

        if (iscard) {
            if (!paymentcardid || !paymentcardcode) {
                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "incomplete payment card", responsedata.status, responsedata.success);
                return response.status(responsedata.status).json(responsedata);
            }
        }

        const invoice = await genericfunctions.getInvoice(corpid, orgid, userid, invoiceid, responsedata.id);

        if (invoice) {
            if (invoice.invoicestatus !== "INVOICED") {
                const corp = await genericfunctions.getCorporation(corpid, responsedata.id);
                const org = await genericfunctions.getOrganization(corpid, orgid, responsedata.id);

                const tipocredito = "0";

                var correctcorrelative = false;
                var proceedpayment = false;
                var paymenttype = null;

                if (corp) {
                    if (corp.billbyorg) {
                        if (org) {
                            if (org.docnum && org.doctype && org.businessname && org.fiscaladdress && org.sunatcountry) {
                                if ((org.sunatcountry === "PE") && (org.doctype === "1" || org.doctype === "4" || org.doctype === "7")) {
                                    correctcorrelative = true;
                                }
                                else {
                                    correctcorrelative = true;
                                }

                                if (correctcorrelative) {
                                    proceedpayment = true;
                                }
                                else {
                                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "correlative not found", responsedata.status, responsedata.success);
                                    return response.status(responsedata.status).json(responsedata);
                                }
                            }
                            else {
                                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "incomplete organization", responsedata.status, responsedata.success);
                                return response.status(responsedata.status).json(responsedata);
                            }
                        }
                        else {
                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "incomplete organization", responsedata.status, responsedata.success);
                            return response.status(responsedata.status).json(responsedata);
                        }
                    }
                    else {
                        if (corp.docnum && corp.doctype && corp.businessname && corp.fiscaladdress && corp.sunatcountry) {
                            if ((corp.sunatcountry === "PE") && (corp.doctype === "1" || corp.doctype === "4" || corp.doctype === "7")) {
                                correctcorrelative = true;
                            }
                            else {
                                correctcorrelative = true;
                            }

                            if (correctcorrelative) {
                                proceedpayment = true;
                            }
                            else {
                                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "correlative not found", responsedata.status, responsedata.success);
                                return response.status(responsedata.status).json(responsedata);
                            }
                        }
                        else {
                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "incomplete corporation", responsedata.status, responsedata.success);
                            return response.status(responsedata.status).json(responsedata);
                        }
                    }

                    if (proceedpayment) {
                        const invoicedetail = await genericfunctions.getInvoiceDetail(corpid, orgid, userid, invoiceid, responsedata.id);

                        if (invoicedetail) {
                            if (invoice.invoicestatus === "DRAFT" && invoice.paymentstatus === "PENDING" && invoice.currency === settings.currency && (((Math.round((invoice.totalamount * 100 + Number.EPSILON) * 100) / 100) === settings.amount) || override)) {
                                const appsetting = await genericfunctions.getAppSettingSingle(corpid, orgid, responsedata.id);

                                if (appsetting) {
                                    const userprofile = await genericfunctions.getProfile(userid, responsedata.id);

                                    if (userprofile) {
                                        metadata.corpid = (corpid || "");
                                        metadata.corporation = genericfunctions.removeSpecialCharacter(corp.description || "");
                                        metadata.orgid = (orgid || "");
                                        metadata.organization = genericfunctions.removeSpecialCharacter(invoice.orgdesc || "");
                                        metadata.document = ((org ? org.docnum : corp.docnum) || "");
                                        metadata.businessname = genericfunctions.removeSpecialCharacter((org ? org.businessname : corp.businessname) || "");
                                        metadata.invoiceid = (invoiceid || "");
                                        metadata.seriecode = "";
                                        metadata.emissiondate = (new Date(new Date().setHours(new Date().getHours() - 5)).toISOString().split("T")[0] || "");
                                        metadata.user = genericfunctions.removeSpecialCharacter(usr || "");
                                        metadata.reference = genericfunctions.removeSpecialCharacter(invoice.description || "");

                                        var successPay = false;

                                        if (iscard) {
                                            const paymentcard = await genericfunctions.getPaymentCard(corpid, paymentcardid, responsedata.id);

                                            if (appsetting?.paymentprovider === "CULQI") {
                                                const requestCulqiCharge = await axiosObservable({
                                                    data: {
                                                        amount: settings.amount,
                                                        bearer: appsetting.privatekey,
                                                        description: (genericfunctions.removeSpecialCharacter("PAYMENT: " + (settings.description || ""))).slice(0, 80),
                                                        currencyCode: settings.currency,
                                                        email: (paymentcard?.mail || userprofile.email),
                                                        sourceId: paymentcardcode,
                                                        operation: "CREATE",
                                                        url: appsetting.culqiurlcharge,
                                                        metadata: metadata,
                                                    },
                                                    method: "post",
                                                    url: `${bridgeEndpoint}processculqi/handlecharge`,
                                                    _requestid: request._requestid
                                                });

                                                if (requestCulqiCharge.data.success) {
                                                    const chargedata = await genericfunctions.insertCharge(corpid, orgid, invoiceid, null, (settings.amount / 100), true, requestCulqiCharge.data.result, requestCulqiCharge.data.result.id, settings.currency, settings.description, (paymentcard?.mail || userprofile.email), "INSERT", null, null, usr, "PAID", paymentcardid, null, "REGISTEREDCARD", responsedata.id);

                                                    await genericfunctions.insertPayment(corpid, orgid, invoiceid, true, chargedata?.chargeid, requestCulqiCharge.data.result, requestCulqiCharge.data.result.id, (settings.amount / 100), (paymentcard?.mail || userprofile.email), usr, paymentcardid, null, appsetting.location, appsetting.paymentprovider, responsedata.id);

                                                    successPay = true;

                                                    paymenttype = requestCulqiCharge?.data?.result?.source?.iin?.card_type;
                                                }
                                                else {
                                                    let errorCharge = genericfunctions.getCulqiError(requestCulqiCharge?.data?.operationMessage);

                                                    if (errorCharge) {
                                                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, errorCharge, responsedata.status, responsedata.success);
                                                        return response.status(responsedata.status).json(responsedata);
                                                    }
                                                }
                                            }
                                            else if (appsetting?.paymentprovider === "OPENPAY COLOMBIA") {
                                                const requestOpenpayCharge = await axiosObservable({
                                                    data: {
                                                        amount: settings.amount,
                                                        currencyCode: settings.currency,
                                                        customerId: paymentcard?.clientcode,
                                                        description: (genericfunctions.removeSpecialCharacter("PAYMENT: " + (settings.description || ""))).slice(0, 80),
                                                        igv: `${((appsetting.igv || 0) * 100)}`,
                                                        merchantId: appsetting.culqiurl,
                                                        operation: "CREATE",
                                                        orderId: `${corpid}-${orgid}-${invoiceid}-${Math.floor(Math.random() * 9999)}`,
                                                        secretKey: appsetting.privatekey,
                                                        sourceId: paymentcardcode,
                                                        url: appsetting.culqiurlcharge,
                                                    },
                                                    method: "post",
                                                    url: `${bridgeEndpoint}processopenpay/handlecharge`,
                                                    _requestid: request._requestid
                                                });

                                                if (requestOpenpayCharge.data.success) {
                                                    const chargedata = await genericfunctions.insertCharge(corpid, orgid, invoiceid, null, (settings.amount / 100), true, requestOpenpayCharge.data.result, requestOpenpayCharge.data.result.id, settings.currency, settings.description, (paymentcard?.mail || userprofile.email), "INSERT", null, null, usr, "PAID", paymentcardid, null, "REGISTEREDCARD", responsedata.id);

                                                    await genericfunctions.insertPayment(corpid, orgid, invoiceid, true, chargedata?.chargeid, requestOpenpayCharge.data.result, requestOpenpayCharge.data.result.id, (settings.amount / 100), (paymentcard?.mail || userprofile.email), usr, paymentcardid, null, appsetting.location, appsetting.paymentprovider, responsedata.id);

                                                    successPay = true;

                                                    paymenttype = requestOpenpayCharge?.data?.result?.card?.type;
                                                }
                                                else {
                                                    let errorCharge = requestOpenpayCharge?.data?.operationMessage || "unsuccessful payment";

                                                    if (errorCharge) {
                                                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, errorCharge || "generic_payment_error", responsedata.status, responsedata.success);
                                                        return response.status(responsedata.status).json(responsedata);
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (appsetting?.paymentprovider === "CULQI") {
                                                const charge = await createCharge(userprofile, settings, token, metadata, appsetting.privatekey);

                                                if (charge.object === "error") {
                                                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, { code: charge.code, id: charge.charge_id, message: charge.user_message, object: charge.object }, charge.merchant_message?.split("https://www.culqi.com/api")[0] || charge.user_message, responsedata.status, responsedata.success);
                                                    return response.status(responsedata.status).json(responsedata);
                                                }
                                                else {
                                                    const chargedata = await genericfunctions.insertCharge(corpid, orgid, invoiceid, null, (settings.amount / 100), true, charge, charge.id, settings.currency, settings.description, token.email, "INSERT", null, null, usr, "PAID", token.id, token, "CULQI", responsedata.id)

                                                    await genericfunctions.insertPayment(corpid, orgid, invoiceid, true, chargedata?.chargeid, charge, charge.id, (settings.amount / 100), token.email, usr, token.id, token, appsetting.location, appsetting.paymentprovider, responsedata.id);

                                                    successPay = true;

                                                    paymenttype = charge?.source?.iin?.card_type;
                                                }
                                            }
                                            else if (appsetting?.paymentprovider === "OPENPAY COLOMBIA") {
                                                const requestOpenpayCharge = await axiosObservable({
                                                    data: {
                                                        amount: settings.amount,
                                                        currencyCode: settings.currency,
                                                        description: `${(genericfunctions.removeSpecialCharacter(settings.description || "").replace(/[^0-9A-Za-z ]/g, "")).slice(0, 80)}`,
                                                        email: (userprofile.email || "generic@mail.com"),
                                                        firstName: `${(genericfunctions.removeSpecialCharacter((transaction?.formdata?.holder_name || userprofile.firstname) || "EMPTY")).slice(0, 50)}`,
                                                        igv: `${((appsetting.igv || 0) * 100)}`,
                                                        lastName: `${(genericfunctions.removeSpecialCharacter(userprofile.lastname || "EMPTY")).slice(0, 50)}`,
                                                        merchantId: appsetting.culqiurl,
                                                        operation: "CREATE",
                                                        orderId: `${corpid}-${orgid}-${invoiceid}-${Math.floor(Math.random() * 9999)}`,
                                                        phoneNumber: `${(userprofile.phone ? userprofile.phone.replace(/[^0-9]/g, "") : "51999999999").slice(0, 15)}`,
                                                        secretKey: appsetting.privatekey,
                                                        sourceId: transaction?.transactionresponse?.data.id,
                                                        url: appsetting.culqiurlcharge,
                                                    },
                                                    method: "post",
                                                    url: `${bridgeEndpoint}processopenpay/handlecharge`,
                                                    _requestid: responsedata.id,
                                                });

                                                if (requestOpenpayCharge.data.success) {
                                                    const chargedata = await genericfunctions.insertCharge(corpid, orgid, invoiceid, null, (settings.amount / 100), true, requestOpenpayCharge.data.result, requestOpenpayCharge.data.result.id, settings.currency, settings.description, userprofile.email || "generic@mail.com", "INSERT", null, null, usr, "PAID", null, null, "OPENPAY", responsedata.id)

                                                    await genericfunctions.insertPayment(corpid, orgid, invoiceid, true, chargedata?.chargeid, requestOpenpayCharge.data.result, requestOpenpayCharge.data.result.id, (settings.amount / 100), userprofile.email || "generic@mail.com", usr, null, null, appsetting.location, appsetting.paymentprovider, responsedata.id);

                                                    successPay = true;

                                                    paymenttype = requestOpenpayCharge?.data?.result?.card?.type;
                                                }
                                                else {
                                                    let errorCharge = requestOpenpayCharge?.data?.operationMessage || "unsuccessful payment";

                                                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, null, errorCharge || "generic_payment_error", responsedata.status, responsedata.success);
                                                    return response.status(responsedata.status).json(responsedata);
                                                }
                                            }
                                        }

                                        if (successPay) {
                                            var invoicecorrelative = null;
                                            var documenttype = null;

                                            if (corp.billbyorg) {
                                                if ((org.sunatcountry === "PE") && (org.doctype === "1" || org.doctype === "4" || org.doctype === "7")) {
                                                    invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "TICKET", responsedata.id);
                                                    documenttype = "03";
                                                }
                                                else {
                                                    invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "INVOICE", responsedata.id);
                                                    documenttype = "01";
                                                }
                                            }
                                            else {
                                                if ((corp.sunatcountry === "PE") && (corp.doctype === "1" || corp.doctype === "4" || corp.doctype === "7")) {
                                                    invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "TICKET", responsedata.id);
                                                    documenttype = "03";
                                                }
                                                else {
                                                    invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "INVOICE", responsedata.id);
                                                    documenttype = "01";
                                                }
                                            }

                                            if (invoicecorrelative) {
                                                try {
                                                    var exchangeratedata = await genericfunctions.getExchangeRate(invoice.currency, responsedata.id);

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
                                                        FechaEmision: new Date(new Date().setHours(new Date().getHours() - 5)).toISOString().split("T")[0],
                                                        MailEnvio: org ? org.contactemail : corp.contactemail,
                                                        MontoTotal: Math.round((invoice.totalamount + Number.EPSILON) * 100) / 100,
                                                        NombreComercialEmisor: appsetting.tradename,
                                                        RazonSocialEmisor: appsetting.businessname,
                                                        RazonSocialReceptor: org ? org.businessname : corp.businessname,
                                                        CorrelativoDocumento: genericfunctions.padNumber(invoicecorrelative.p_correlative, 8),
                                                        RucEmisor: appsetting.ruc,
                                                        NumeroDocumentoReceptor: org ? org.docnum : corp.docnum,
                                                        NumeroSerieDocumento: documenttype === "01" ? appsetting.invoiceserie : appsetting.ticketserie,
                                                        RetornaPdf: appsetting.returnpdf,
                                                        RetornaXmlSunat: appsetting.returnxmlsunat,
                                                        RetornaXml: appsetting.returnxml,
                                                        TipoCambio: invoice.currency === "PEN" ? "1.000" : ((exchangeratedata?.exchangeratesol / exchangeratedata?.exchangerate) || invoice.exchangerate),
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
                                                        invoicedata.CodigoOperacionSunat = org.sunatcountry === "PE" ? appsetting.operationcodeperu : appsetting.operationcodeother;
                                                        invoicedata.MontoTotalGravado = org.sunatcountry === "PE" ? Math.round((invoice.subtotal + Number.EPSILON) * 100) / 100 : null;
                                                        invoicedata.MontoTotalInafecto = org.sunatcountry === "PE" ? "0" : Math.round((invoice.subtotal + Number.EPSILON) * 100) / 100;
                                                        invoicedata.MontoTotalIgv = org.sunatcountry === "PE" ? Math.round((invoice.taxes + Number.EPSILON) * 100) / 100 : null;
                                                    }
                                                    else {
                                                        invoicedata.CodigoOperacionSunat = corp.sunatcountry === "PE" ? appsetting.operationcodeperu : appsetting.operationcodeother;
                                                        invoicedata.MontoTotalGravado = corp.sunatcountry === "PE" ? Math.round((invoice.subtotal + Number.EPSILON) * 100) / 100 : null;
                                                        invoicedata.MontoTotalInafecto = corp.sunatcountry === "PE" ? "0" : Math.round((invoice.subtotal + Number.EPSILON) * 100) / 100;
                                                        invoicedata.MontoTotalIgv = corp.sunatcountry === "PE" ? Math.round((invoice.taxes + Number.EPSILON) * 100) / 100 : null;
                                                    }

                                                    var calcdetraction = false;

                                                    if (corp.billbyorg) {
                                                        if (org.sunatcountry === "PE") {
                                                            calcdetraction = true;
                                                        }
                                                    }
                                                    else {
                                                        if (corp.sunatcountry === "PE") {
                                                            calcdetraction = true;
                                                        }
                                                    }

                                                    if (calcdetraction) {
                                                        if (appsetting.detraction && appsetting.detractioncode && appsetting.detractionaccount && (appsetting.detractionminimum || appsetting.detractionminimum === 0)) {
                                                            var compareamount = 0;

                                                            if (appsetting.detractionminimum) {
                                                                if (invoice.currency !== "PEN") {
                                                                    if (exchangeratedata) {
                                                                        compareamount = (invoice.totalamount / (exchangeratedata?.exchangerate || 0) * (exchangeratedata?.exchangeratesol || 0));
                                                                    }
                                                                }
                                                                else {
                                                                    compareamount = invoice.totalamount;
                                                                }
                                                            }

                                                            if (compareamount > appsetting.detractionminimum) {
                                                                invoicedata.CodigoDetraccion = appsetting.detractioncode;
                                                                invoicedata.CodigoOperacionSunat = "1001";
                                                                invoicedata.MontoTotalDetraccion = Math.round(Math.round(((invoice.totalamount * appsetting.detraction) + Number.EPSILON) * 100) / 100);
                                                                invoicedata.MontoPendienteDetraccion = Math.round(((invoicedata.MontoTotal - (invoicedata.MontoTotalDetraccion || 0)) + Number.EPSILON) * 100) / 100;
                                                                invoicedata.MontoTotalInafecto = null;
                                                                invoicedata.NumeroCuentaDetraccion = appsetting.detractionaccount;
                                                                invoicedata.PaisRecepcion = null;
                                                                invoicedata.PorcentajeTotalDetraccion = appsetting.detraction * 100;

                                                                var adicional02 = {
                                                                    CodigoDatoAdicional: "06",
                                                                    DescripcionDatoAdicional: "CUENTA DE DETRACCION: " + appsetting.detractionaccount
                                                                }

                                                                invoicedata.DataList.push(adicional02);
                                                            }
                                                        }
                                                    }

                                                    if (tipocredito) {
                                                        if (tipocredito === "0") {
                                                            invoicedata.FechaVencimiento = invoicedata.FechaEmision;
                                                        }
                                                        else {
                                                            invoicedata.FechaVencimiento = new Date(new Date().setDate(new Date(new Date(new Date().setHours(new Date().getHours() - 5)).toISOString().split("T")[0]).getDate() + (Number.parseFloat(tipocredito)))).toISOString().substring(0, 10);
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
                                                            TasaIgv: Math.round((data.igvrate * 100) || 0),
                                                            PrecioProducto: Math.round((data.productprice + Number.EPSILON) * 100) / 100,
                                                            DescripcionProducto: data.productdescription,
                                                            PrecioNetoProducto: Math.round((data.productnetprice + Number.EPSILON) * 100) / 100,
                                                            ValorNetoProducto: Math.round(((data.quantity * data.productnetprice) + Number.EPSILON) * 100) / 100,
                                                        };

                                                        if (corp.billbyorg) {
                                                            invoicedetaildata.AfectadoIgv = org.sunatcountry === "PE" ? "10" : "40";
                                                            invoicedetaildata.TributoIgv = org.sunatcountry === "PE" ? "1000" : "9998";
                                                        }
                                                        else {
                                                            invoicedetaildata.AfectadoIgv = corp.sunatcountry === "PE" ? "10" : "40";
                                                            invoicedetaildata.TributoIgv = corp.sunatcountry === "PE" ? "1000" : "9998";
                                                        }

                                                        invoicedata.ProductList.push(invoicedetaildata);
                                                    });

                                                    var adicional01 = {
                                                        CodigoDatoAdicional: "05",
                                                        DescripcionDatoAdicional: "FORMA DE PAGO: TRANSFERENCIA"
                                                    }

                                                    invoicedata.DataList.push(adicional01);

                                                    if (purchaseorder) {
                                                        var adicional03 = {
                                                            CodigoDatoAdicional: "15",
                                                            DescripcionDatoAdicional: purchaseorder
                                                        }

                                                        invoicedata.DataList.push(adicional03);
                                                    }

                                                    if (comments) {
                                                        var adicional04 = {
                                                            CodigoDatoAdicional: "07",
                                                            DescripcionDatoAdicional: comments
                                                        }

                                                        invoicedata.DataList.push(adicional04);
                                                    }

                                                    if (tipocredito) {
                                                        var adicional05 = {
                                                            CodigoDatoAdicional: "01",
                                                            DescripcionDatoAdicional: tipocredito === "0" ? "AL CONTADO" : `CREDITO A ${tipocredito} DIAS`
                                                        }

                                                        invoicedata.DataList.push(adicional05);

                                                        if (adicional05) {
                                                            if (adicional05.DescripcionDatoAdicional === "AL CONTADO") {
                                                                invoicedata.FechaVencimiento = null;
                                                            }
                                                        }
                                                    }

                                                    if (appsetting?.invoiceprovider === "MIFACT") {
                                                        const requestSendToSunat = await axiosObservable({
                                                            data: invoicedata,
                                                            method: "post",
                                                            url: `${bridgeEndpoint}processmifact/sendinvoice`,
                                                            _requestid: responsedata.id,
                                                        });

                                                        if (requestSendToSunat.data.result) {
                                                            await genericfunctions.invoiceSunat(corpid, orgid, invoiceid, "INVOICED", null, requestSendToSunat.data.result.cadenaCodigoQr, requestSendToSunat.data.result.codigoHash, requestSendToSunat.data.result.urlCdrSunat, requestSendToSunat.data.result.urlPdf, requestSendToSunat.data.result.urlXml, invoicedata.NumeroSerieDocumento, appsetting?.ruc || null, appsetting?.businessname || null, appsetting?.tradename || null, appsetting?.fiscaladdress || null, appsetting?.ubigeo || null, appsetting?.emittertype || null, appsetting?.annexcode || null, appsetting?.printingformat || null, invoicedata?.EnviarSunat || null, appsetting?.returnpdf || null, appsetting?.returnxmlsunat || null, appsetting?.returnxml || null, appsetting?.token || null, appsetting?.sunaturl || null, appsetting?.sunatusername || null, appsetting?.xmlversion || null, appsetting?.ublversion || null, invoicedata?.CodigoRucReceptor || null, invoicedata?.NumeroDocumentoReceptor || null, invoicedata?.RazonSocialReceptor || null, invoicedata?.DireccionFiscalReceptor || null, invoicedata?.PaisRecepcion || null, invoicedata?.MailEnvio || null, documenttype || null, invoicedata?.CodigoOperacionSunat || null, invoicedata?.FechaVencimiento || null, purchaseorder || null, comments || null, "typecredit_alcontado" || null, appsetting?.detractioncode || null, appsetting?.detraction || null, appsetting?.detractionaccount, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);
                                                        }
                                                        else {
                                                            await genericfunctions.invoiceSunat(corpid, orgid, invoiceid, "ERROR", requestSendToSunat.data.operationMessage, null, null, null, null, null, null, appsetting?.ruc || null, appsetting?.businessname || null, appsetting?.tradename || null, appsetting?.fiscaladdress || null, appsetting?.ubigeo || null, appsetting?.emittertype || null, appsetting?.annexcode || null, appsetting?.printingformat || null, invoicedata?.EnviarSunat || null, appsetting?.returnpdf || null, appsetting?.returnxmlsunat || null, appsetting?.returnxml || null, appsetting?.token || null, appsetting?.sunaturl || null, appsetting?.sunatusername || null, appsetting?.xmlversion || null, appsetting?.ublversion || null, invoicedata?.CodigoRucReceptor || null, invoicedata?.NumeroDocumentoReceptor || null, invoicedata?.RazonSocialReceptor || null, invoicedata?.DireccionFiscalReceptor || null, invoicedata?.PaisRecepcion || null, invoicedata?.MailEnvio || null, documenttype || null, invoicedata?.CodigoOperacionSunat || null, invoicedata?.FechaVencimiento || null, purchaseorder || null, comments || null, "typecredit_alcontado" || null, appsetting?.detractioncode || null, appsetting?.detraction || null, appsetting?.detractionaccount, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);

                                                            if (corp.billbyorg) {
                                                                if ((org.sunatcountry === "PE") && (org.doctype === "1" || org.doctype === "4" || org.doctype === "7")) {
                                                                    await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "TICKETERROR", responsedata.id);
                                                                }
                                                                else {
                                                                    await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "INVOICEERROR", responsedata.id);
                                                                }
                                                            }
                                                            else {
                                                                if ((corp.sunatcountry === "PE") && (corp.doctype === "1" || corp.doctype === "4" || corp.doctype === "7")) {
                                                                    await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "TICKETERROR", responsedata.id);
                                                                }
                                                                else {
                                                                    await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "INVOICEERROR", responsedata.id);
                                                                }
                                                            }
                                                        }
                                                    }
                                                    else if (appsetting?.invoiceprovider === "SIIGO") {
                                                        invoicedata.TipoDocumentoSiigo = "FV";
                                                        invoicedata.TipoCambio = invoice.currency === "COP" ? "1.000" : ((exchangeratedata?.exchangeratecop / exchangeratedata?.exchangerate) || invoice.exchangerate);
                                                        invoicedata.TipoPago = (paymenttype == "Crédito" || paymenttype == "credit") ? "Tarjeta Crédito" : "Tarjeta Débito";
                                                        invoicedata.CityCountry = corp.billbyorg ? org.countrycode : corp.countrycode;
                                                        invoicedata.CityState = corp.billbyorg ? org.statecode : corp.statecode;
                                                        invoicedata.CityCode = corp.billbyorg ? org.citycode : corp.citycode;

                                                        const requestSendToSiigo = await axiosObservable({
                                                            data: invoicedata,
                                                            method: "post",
                                                            url: `${bridgeEndpoint}processsiigo/sendinvoice`,
                                                            _requestid: responsedata.id,
                                                        });

                                                        if (requestSendToSiigo.data.result) {
                                                            let correlativeOverride = null;

                                                            if (requestSendToSiigo.data.result.correlativoCpe) {
                                                                correlativeOverride = parseInt(`${requestSendToSiigo.data.result.correlativoCpe}`);
                                                            }

                                                            await genericfunctions.invoiceSunat(corpid, orgid, invoiceid, "INVOICED", null, requestSendToSiigo.data.result.cadenaCodigoQr, requestSendToSiigo.data.result.codigoHash, requestSendToSiigo.data.result.urlCdrSunat, requestSendToSiigo.data.result.urlPdf, requestSendToSiigo.data.result.urlXml, invoicedata.NumeroSerieDocumento, appsetting?.ruc || null, appsetting?.businessname || null, appsetting?.tradename || null, appsetting?.fiscaladdress || null, appsetting?.ubigeo || null, appsetting?.emittertype || null, appsetting?.annexcode || null, appsetting?.printingformat || null, invoicedata?.EnviarSunat || null, appsetting?.returnpdf || null, appsetting?.returnxmlsunat || null, appsetting?.returnxml || null, appsetting?.token || null, appsetting?.sunaturl || null, appsetting?.sunatusername || null, appsetting?.xmlversion || null, appsetting?.ublversion || null, invoicedata?.CodigoRucReceptor || null, invoicedata?.NumeroDocumentoReceptor || null, invoicedata?.RazonSocialReceptor || null, invoicedata?.DireccionFiscalReceptor || null, invoicedata?.PaisRecepcion || null, invoicedata?.MailEnvio || null, documenttype || null, invoicedata?.CodigoOperacionSunat || null, invoicedata?.FechaVencimiento || null, purchaseorder || null, comments || null, "typecredit_alcontado" || null, appsetting?.detractioncode || null, appsetting?.detraction || null, appsetting?.detractionaccount, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, correlativeOverride, responsedata.id);
                                                        }
                                                        else {
                                                            await genericfunctions.invoiceSunat(corpid, orgid, invoiceid, "ERROR", requestSendToSiigo.data.operationMessage, null, null, null, null, null, null, appsetting?.ruc || null, appsetting?.businessname || null, appsetting?.tradename || null, appsetting?.fiscaladdress || null, appsetting?.ubigeo || null, appsetting?.emittertype || null, appsetting?.annexcode || null, appsetting?.printingformat || null, invoicedata?.EnviarSunat || null, appsetting?.returnpdf || null, appsetting?.returnxmlsunat || null, appsetting?.returnxml || null, appsetting?.token || null, appsetting?.sunaturl || null, appsetting?.sunatusername || null, appsetting?.xmlversion || null, appsetting?.ublversion || null, invoicedata?.CodigoRucReceptor || null, invoicedata?.NumeroDocumentoReceptor || null, invoicedata?.RazonSocialReceptor || null, invoicedata?.DireccionFiscalReceptor || null, invoicedata?.PaisRecepcion || null, invoicedata?.MailEnvio || null, documenttype || null, invoicedata?.CodigoOperacionSunat || null, invoicedata?.FechaVencimiento || null, purchaseorder || null, comments || null, "typecredit_alcontado" || null, appsetting?.detractioncode || null, appsetting?.detraction || null, appsetting?.detractionaccount, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);

                                                            if (corp.billbyorg) {
                                                                if ((org.sunatcountry === "PE") && (org.doctype === "1" || org.doctype === "4" || org.doctype === "7")) {
                                                                    await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "TICKETERROR", responsedata.id);
                                                                }
                                                                else {
                                                                    await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "INVOICEERROR", responsedata.id);
                                                                }
                                                            }
                                                            else {
                                                                if ((corp.sunatcountry === "PE") && (corp.doctype === "1" || corp.doctype === "4" || corp.doctype === "7")) {
                                                                    await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "TICKETERROR", responsedata.id);
                                                                }
                                                                else {
                                                                    await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "INVOICEERROR", responsedata.id);
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                                catch (exception) {
                                                    printException(exception, request.originalUrl, responsedata.id);

                                                    await genericfunctions.invoiceSunat(corpid, orgid, invoiceid, "ERROR", exception.message, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);

                                                    if (corp.billbyorg) {
                                                        if ((org.sunatcountry === "PE") && (org.doctype === "1" || org.doctype === "4" || org.doctype === "7")) {
                                                            await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "TICKETERROR", responsedata.id);
                                                        }
                                                        else {
                                                            await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "INVOICEERROR", responsedata.id);
                                                        }
                                                    }
                                                    else {
                                                        if ((corp.sunatcountry === "PE") && (corp.doctype === "1" || corp.doctype === "4" || corp.doctype === "7")) {
                                                            await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "TICKETERROR", responsedata.id);
                                                        }
                                                        else {
                                                            await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "INVOICEERROR", responsedata.id);
                                                        }
                                                    }
                                                }
                                            }
                                            else {
                                                await genericfunctions.invoiceSunat(corpid, orgid, invoiceid, "ERROR", "Correlative not found", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);
                                            }

                                            responsedata = genericfunctions.changeResponseData(responsedata, null, { message: "process finished" }, "culqipaysuccess", 200, true);
                                            return response.status(responsedata.status).json(responsedata);
                                        }
                                        else {
                                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "unsuccessful payment", responsedata.status, responsedata.success);
                                            return response.status(responsedata.status).json(responsedata);
                                        }
                                    }
                                    else {
                                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "invalid user", responsedata.status, responsedata.success);
                                        return response.status(responsedata.status).json(responsedata);
                                    }
                                }
                                else {
                                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "invalid appsetting", responsedata.status, responsedata.success);
                                    return response.status(responsedata.status).json(responsedata);
                                }
                            }
                            else {
                                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "invalid invoice data", responsedata.status, responsedata.success);
                                return response.status(responsedata.status).json(responsedata);
                            }
                        }
                        else {
                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "invoice detail not found", responsedata.status, responsedata.success);
                            return response.status(responsedata.status).json(responsedata);
                        }
                    }
                    else {
                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "incomplete payment information", responsedata.status, responsedata.success);
                        return response.status(responsedata.status).json(responsedata);
                    }
                }
                else {
                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "corporation not found", responsedata.status, responsedata.success);
                    return response.status(responsedata.status).json(responsedata);
                }
            }
            else {
                if (((Math.round((invoice.totalamount * 100 + Number.EPSILON) * 100) / 100) === settings.amount) || override) {
                    const appsetting = await genericfunctions.getAppSettingSingle(corpid, orgid, responsedata.id);

                    if (appsetting) {
                        const userprofile = await genericfunctions.getProfile(userid, responsedata.id);

                        if (userprofile) {
                            metadata.corpid = (corpid || "");
                            metadata.corporation = genericfunctions.removeSpecialCharacter(invoice.corpdesc || "");
                            metadata.orgid = (orgid || "");
                            metadata.organization = genericfunctions.removeSpecialCharacter(invoice.orgdesc || "");
                            metadata.document = (invoice.receiverdocnum || "");
                            metadata.businessname = genericfunctions.removeSpecialCharacter(invoice.receiverbusinessname || "");
                            metadata.invoiceid = (invoiceid || "");
                            metadata.seriecode = (invoice.serie ? invoice.serie : "X000") + "-" + (invoice.correlative ? invoice.correlative.toString().padStart(8, "0") : "00000000");
                            metadata.emissiondate = (invoice.invoicedate || "");
                            metadata.user = genericfunctions.removeSpecialCharacter(usr || "");
                            metadata.reference = genericfunctions.removeSpecialCharacter(invoice.description || "");

                            if (iscard) {
                                const paymentcard = await genericfunctions.getPaymentCard(corpid, paymentcardid, responsedata.id);

                                if (appsetting?.paymentprovider === "CULQI") {
                                    const requestCulqiCharge = await axiosObservable({
                                        data: {
                                            amount: settings.amount,
                                            bearer: appsetting.privatekey,
                                            description: (genericfunctions.removeSpecialCharacter("PAYMENT: " + (settings.description || ""))).slice(0, 80),
                                            currencyCode: settings.currency,
                                            email: (paymentcard?.mail || userprofile.email),
                                            sourceId: paymentcardcode,
                                            operation: "CREATE",
                                            url: appsetting.culqiurlcharge,
                                            metadata: metadata,
                                        },
                                        method: "post",
                                        url: `${bridgeEndpoint}processculqi/handlecharge`,
                                        _requestid: responsedata.id,
                                    });

                                    if (requestCulqiCharge.data.success) {
                                        const chargedata = await genericfunctions.insertCharge(corpid, orgid, invoiceid, null, (settings.amount / 100), true, requestCulqiCharge.data.result, requestCulqiCharge.data.result.id, settings.currency, settings.description, (paymentcard?.mail || userprofile.email), "INSERT", null, null, usr, "PAID", paymentcardid, null, "REGISTEREDCARD", responsedata.id);

                                        await genericfunctions.insertPayment(corpid, orgid, invoiceid, true, chargedata?.chargeid, requestCulqiCharge.data.result, requestCulqiCharge.data.result.id, (settings.amount / 100), (paymentcard?.mail || userprofile.email), usr, paymentcardid, null, appsetting.location, appsetting.paymentprovider, responsedata.id);

                                        responsedata = genericfunctions.changeResponseData(responsedata, null, requestCulqiCharge.data.result, "successful_transaction", 200, true);
                                        return response.status(responsedata.status).json(responsedata);
                                    }
                                    else {
                                        let errorCharge = genericfunctions.getCulqiError(requestCulqiCharge?.data?.operationMessage) || "unsuccessful payment";

                                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, errorCharge, responsedata.status, responsedata.success);
                                        return response.status(responsedata.status).json(responsedata);
                                    }
                                }
                                else if (appsetting?.paymentprovider === "OPENPAY COLOMBIA") {
                                    const requestOpenpayCharge = await axiosObservable({
                                        data: {
                                            amount: settings.amount,
                                            currencyCode: settings.currency,
                                            customerId: paymentcard?.clientcode,
                                            description: (genericfunctions.removeSpecialCharacter("PAYMENT: " + (settings.description || ""))).slice(0, 80),
                                            igv: `${((appsetting.igv || 0) * 100)}`,
                                            merchantId: appsetting.culqiurl,
                                            operation: "CREATE",
                                            orderId: `${corpid}-${orgid}-${invoiceid}-${Math.floor(Math.random() * 9999)}`,
                                            secretKey: appsetting.privatekey,
                                            sourceId: paymentcardcode,
                                            url: appsetting.culqiurlcharge,
                                        },
                                        method: "post",
                                        url: `${bridgeEndpoint}processopenpay/handlecharge`,
                                        _requestid: responsedata.id,
                                    });

                                    if (requestOpenpayCharge.data.success) {
                                        const chargedata = await genericfunctions.insertCharge(corpid, orgid, invoiceid, null, (settings.amount / 100), true, requestOpenpayCharge.data.result, requestOpenpayCharge.data.result.id, settings.currency, settings.description, (paymentcard?.mail || userprofile.email), "INSERT", null, null, usr, "PAID", paymentcardid, null, "REGISTEREDCARD", responsedata.id);

                                        await genericfunctions.insertPayment(corpid, orgid, invoiceid, true, chargedata?.chargeid, requestOpenpayCharge.data.result, requestOpenpayCharge.data.result.id, (settings.amount / 100), (paymentcard?.mail || userprofile.email), usr, paymentcardid, null, appsetting.location, appsetting.paymentprovider, responsedata.id);

                                        responsedata = genericfunctions.changeResponseData(responsedata, null, requestOpenpayCharge.data.result, "successful_transaction", 200, true);
                                        return response.status(responsedata.status).json(responsedata);
                                    }
                                    else {
                                        let errorCharge = requestOpenpayCharge?.data?.operationMessage || "unsuccessful payment";

                                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, errorCharge || "generic_payment_error", responsedata.status, responsedata.success);
                                        return response.status(responsedata.status).json(responsedata);
                                    }
                                }
                            }
                            else {
                                if (appsetting?.paymentprovider === "CULQI") {
                                    const charge = await createCharge(userprofile, settings, token, metadata, appsetting.privatekey);

                                    if (charge.object === "error") {
                                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, { code: charge.code, id: charge.charge_id, message: charge.user_message, object: charge.object }, charge.merchant_message?.split("https://www.culqi.com/api")[0] || charge.user_message, responsedata.status, responsedata.success);
                                        return response.status(responsedata.status).json(responsedata);
                                    }
                                    else {
                                        const chargedata = await genericfunctions.insertCharge(corpid, orgid, invoiceid, null, (settings.amount / 100), true, charge, charge.id, settings.currency, settings.description, token.email, "INSERT", null, null, usr, "PAID", token.id, token, "CULQI", responsedata.id);

                                        await genericfunctions.insertPayment(corpid, orgid, invoiceid, true, chargedata?.chargeid, charge, charge.id, (settings.amount / 100), token.email, usr, token.id, token, appsetting.location, appsetting.paymentprovider, responsedata.id);

                                        responsedata = genericfunctions.changeResponseData(responsedata, charge.outcome.code, { id: charge.id, object: charge.object }, charge.outcome.user_message, 200, true);
                                        return response.status(responsedata.status).json(responsedata);
                                    }
                                }
                                else if (appsetting?.paymentprovider === "OPENPAY COLOMBIA") {
                                    const requestOpenpayCharge = await axiosObservable({
                                        data: {
                                            amount: settings.amount,
                                            currencyCode: settings.currency,
                                            description: `${(genericfunctions.removeSpecialCharacter(settings.description || "").replace(/[^0-9A-Za-z ]/g, "")).slice(0, 80)}`,
                                            email: (userprofile.email || "generic@mail.com"),
                                            firstName: `${(genericfunctions.removeSpecialCharacter((transaction?.formdata?.holder_name || userprofile.firstname) || "EMPTY")).slice(0, 50)}`,
                                            igv: `${((appsetting.igv || 0) * 100)}`,
                                            lastName: `${(genericfunctions.removeSpecialCharacter(userprofile.lastname || "EMPTY")).slice(0, 50)}`,
                                            merchantId: appsetting.culqiurl,
                                            operation: "CREATE",
                                            orderId: `${corpid}-${orgid}-${invoiceid}-${Math.floor(Math.random() * 9999)}`,
                                            phoneNumber: `${(userprofile.phone ? userprofile.phone.replace(/[^0-9]/g, "") : "51999999999").slice(0, 15)}`,
                                            secretKey: appsetting.privatekey,
                                            sourceId: transaction?.transactionresponse?.data.id,
                                            url: appsetting.culqiurlcharge,
                                        },
                                        method: "post",
                                        url: `${bridgeEndpoint}processopenpay/handlecharge`,
                                        _requestid: responsedata.id,
                                    });

                                    if (requestOpenpayCharge.data.success) {
                                        const chargedata = await genericfunctions.insertCharge(corpid, orgid, invoiceid, null, (settings.amount / 100), true, requestOpenpayCharge.data.result, requestOpenpayCharge.data.result.id, settings.currency, settings.description, userprofile.email || "generic@mail.com", "INSERT", null, null, usr, "PAID", null, null, "OPENPAY", responsedata.id)

                                        await genericfunctions.insertPayment(corpid, orgid, invoiceid, true, chargedata?.chargeid, requestOpenpayCharge.data.result, requestOpenpayCharge.data.result.id, (settings.amount / 100), userprofile.email || "generic@mail.com", usr, null, null, appsetting.location, appsetting.paymentprovider, responsedata.id);

                                        responsedata = genericfunctions.changeResponseData(responsedata, requestOpenpayCharge.data.result.id, null, "successful_transaction", 200, true);
                                        return response.status(responsedata.status).json(responsedata);
                                    }
                                    else {
                                        let errorCharge = requestOpenpayCharge?.data?.operationMessage || "unsuccessful payment";

                                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, null, errorCharge || "generic_payment_error", responsedata.status, responsedata.success);
                                        return response.status(responsedata.status).json(responsedata);
                                    }
                                }
                            }
                        }
                        else {
                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "invalid user", responsedata.status, responsedata.success);
                            return response.status(responsedata.status).json(responsedata);
                        }
                    }
                    else {
                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "invalid appsetting", responsedata.status, responsedata.success);
                        return response.status(responsedata.status).json(responsedata);
                    }
                }
                else {
                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "amount does not match", responsedata.status, responsedata.success);
                    return response.status(responsedata.status).json(responsedata);
                }
            }
        }
        else {
            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "invoice not found", responsedata.status, responsedata.success);
            return response.status(responsedata.status).json(responsedata);
        }
    } catch (exception) {
        if (exception.user_message) {
            return response.status(500).json({
                ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
                message: exception.user_message,
            });
        }
        else if (exception.merchant_message) {
            return response.status(500).json({
                ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
                message: exception.merchant_message.split("https://www.culqi.com/api")[0],
            });
        }
        else {
            return response.status(500).json({
                ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
                message: exception.message,
            });
        }
    }
};

exports.createBalance = async (request, response) => {
    const { userid, usr } = request.user;
    const { settings, token, metadata = {}, corpid, orgid, reference, comments, purchaseorder, paymentcardid, paymentcardcode, iscard, transaction } = request.body;
    var { buyamount, totalamount, totalpay } = request.body;

    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var responsedata = genericfunctions.generateResponseData(request._requestid);

        if (iscard) {
            if (!paymentcardid || !paymentcardcode) {
                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "incomplete payment card", responsedata.status, responsedata.success);
                return response.status(responsedata.status).json(responsedata);
            }
        }

        buyamount = Math.round((parseFloat(buyamount) + Number.EPSILON) * 100) / 100;
        totalamount = Math.round((parseFloat(totalamount) + Number.EPSILON) * 100) / 100;
        totalpay = Math.round((parseFloat(totalpay) + Number.EPSILON) * 100) / 100;

        const corp = await genericfunctions.getCorporation(corpid, responsedata.id);
        const org = await genericfunctions.getOrganization(corpid, orgid, responsedata.id);

        var correctcorrelative = false;
        var proceedpayment = false;
        var billbyorg = false;
        var paymenttype = null;

        if (corp) {
            if (corp.billbyorg) {
                billbyorg = true;

                if (org) {
                    if (org.docnum && org.doctype && org.businessname && org.fiscaladdress && org.sunatcountry) {
                        if ((org.sunatcountry === "PE") && (org.doctype === "1" || org.doctype === "4" || org.doctype === "7")) {
                            correctcorrelative = true;
                        }
                        else {
                            correctcorrelative = true;
                        }

                        if (correctcorrelative) {
                            proceedpayment = true;
                        }
                        else {
                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "correlative not found", responsedata.status, responsedata.success);
                            return response.status(responsedata.status).json(responsedata);
                        }
                    }
                    else {
                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "incomplete organization", responsedata.status, responsedata.success);
                        return response.status(responsedata.status).json(responsedata);
                    }
                }
                else {
                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "incomplete organization", responsedata.status, responsedata.success);
                    return response.status(responsedata.status).json(responsedata);
                }
            }
            else {
                billbyorg = false;

                if (corp.docnum && corp.doctype && corp.businessname && corp.fiscaladdress && corp.sunatcountry) {
                    if ((corp.sunatcountry === "PE") && (corp.doctype === "1" || corp.doctype === "4" || corp.doctype === "7")) {
                        correctcorrelative = true;
                    }
                    else {
                        correctcorrelative = true;
                    }

                    if (correctcorrelative) {
                        proceedpayment = true;
                    }
                    else {
                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "correlative not found", responsedata.status, responsedata.success);
                        return response.status(responsedata.status).json(responsedata);
                    }
                }
                else {
                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "incomplete corporation", responsedata.status, responsedata.success);
                    return response.status(responsedata.status).json(responsedata);
                }
            }

            if (proceedpayment) {
                if ((Math.round((totalpay * 100 + Number.EPSILON) * 100) / 100) === settings.amount) {
                    const appsetting = await genericfunctions.getAppSettingSingle(corpid, orgid, responsedata.id);

                    if (appsetting) {
                        const userprofile = await genericfunctions.getProfile(userid, responsedata.id);

                        if (userprofile) {
                            metadata.corpid = (corpid || "");
                            metadata.corporation = genericfunctions.removeSpecialCharacter(corp.description || "");
                            metadata.orgid = (orgid || "");
                            metadata.organization = genericfunctions.removeSpecialCharacter(org?.orgdesc || "");
                            metadata.document = ((billbyorg ? org.docnum : corp.docnum) || "");
                            metadata.businessname = genericfunctions.removeSpecialCharacter((billbyorg ? org.businessname : corp.businessname) || "");
                            metadata.invoiceid = "";
                            metadata.seriecode = "";
                            metadata.emissiondate = new Date(new Date().setHours(new Date().getHours() - 5)).toISOString().split("T")[0];
                            metadata.user = genericfunctions.removeSpecialCharacter(usr || "");
                            metadata.reference = genericfunctions.removeSpecialCharacter(reference || "");

                            var successPay = false;
                            var charge = null;
                            var chargeBridge = null;
                            var paymentcard = null;

                            if (iscard) {
                                paymentcard = await genericfunctions.getPaymentCard(corpid, paymentcardid, responsedata.id);

                                if (appsetting?.paymentprovider === "CULQI") {
                                    const requestCulqiCharge = await axiosObservable({
                                        data: {
                                            amount: settings.amount,
                                            bearer: appsetting.privatekey,
                                            description: (genericfunctions.removeSpecialCharacter("PAYMENT: " + (settings.description || ""))).slice(0, 80),
                                            currencyCode: settings.currency,
                                            email: (paymentcard?.mail || userprofile.email),
                                            sourceId: paymentcardcode,
                                            operation: "CREATE",
                                            url: appsetting.culqiurlcharge,
                                            metadata: metadata,
                                        },
                                        method: "post",
                                        url: `${bridgeEndpoint}processculqi/handlecharge`,
                                        _requestid: responsedata.id,
                                    });

                                    if (requestCulqiCharge.data.success) {
                                        chargeBridge = requestCulqiCharge.data.result;

                                        successPay = true;

                                        paymenttype = requestCulqiCharge?.data?.result?.source?.iin?.card_type;
                                    }
                                    else {
                                        let errorCharge = genericfunctions.getCulqiError(requestCulqiCharge?.data?.operationMessage) || "unsuccessful payment";

                                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, errorCharge, responsedata.status, responsedata.success);
                                        return response.status(responsedata.status).json(responsedata);
                                    }
                                }
                                else if (appsetting?.paymentprovider === "OPENPAY COLOMBIA") {
                                    const requestOpenpayCharge = await axiosObservable({
                                        data: {
                                            amount: settings.amount,
                                            currencyCode: settings.currency,
                                            customerId: paymentcard?.clientcode,
                                            description: (genericfunctions.removeSpecialCharacter("PAYMENT: " + (settings.description || ""))).slice(0, 80),
                                            igv: `${((appsetting.igv || 0) * 100)}`,
                                            merchantId: appsetting.culqiurl,
                                            operation: "CREATE",
                                            orderId: `${corpid}-${orgid}-${Math.floor(Math.random() * 99999999)}`,
                                            secretKey: appsetting.privatekey,
                                            sourceId: paymentcardcode,
                                            url: appsetting.culqiurlcharge,
                                        },
                                        method: "post",
                                        url: `${bridgeEndpoint}processopenpay/handlecharge`,
                                        _requestid: responsedata.id,
                                    });

                                    if (requestOpenpayCharge.data.success) {
                                        chargeBridge = requestOpenpayCharge.data.result;

                                        successPay = true;

                                        paymenttype = requestOpenpayCharge?.data?.result?.card?.type;
                                    }
                                    else {
                                        let errorCharge = requestOpenpayCharge?.data?.operationMessage || "unsuccessful payment";

                                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, errorCharge || "generic_payment_error", responsedata.status, responsedata.success);
                                        return response.status(responsedata.status).json(responsedata);
                                    }
                                }
                            }
                            else {
                                if (appsetting?.paymentprovider === "CULQI") {
                                    charge = await createCharge(userprofile, settings, token, metadata, appsetting.privatekey);

                                    if (charge.object === "error") {
                                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, { code: charge.code, id: charge.charge_id, message: charge.user_message, object: charge.object }, charge.merchant_message?.split("https://www.culqi.com/api")[0] || charge.user_message, responsedata.status, responsedata.success);
                                        return response.status(responsedata.status).json(responsedata);
                                    }
                                    else {
                                        successPay = true;

                                        paymenttype = charge?.source?.iin?.card_type;
                                    }
                                }
                                else if (appsetting?.paymentprovider === "OPENPAY COLOMBIA") {
                                    const requestOpenpayCharge = await axiosObservable({
                                        data: {
                                            amount: settings.amount,
                                            currencyCode: settings.currency,
                                            description: `${(genericfunctions.removeSpecialCharacter(settings.description || "").replace(/[^0-9A-Za-z ]/g, "")).slice(0, 80)}`,
                                            email: (userprofile.email || "generic@mail.com"),
                                            firstName: `${(genericfunctions.removeSpecialCharacter((transaction?.formdata?.holder_name || userprofile.firstname) || "EMPTY")).slice(0, 50)}`,
                                            igv: `${((appsetting.igv || 0) * 100)}`,
                                            lastName: `${(genericfunctions.removeSpecialCharacter(userprofile.lastname || "EMPTY")).slice(0, 50)}`,
                                            merchantId: appsetting.culqiurl,
                                            operation: "CREATE",
                                            orderId: `${corpid}-${orgid}-${Math.floor(Math.random() * 99999999)}`,
                                            phoneNumber: `${(userprofile.phone ? userprofile.phone.replace(/[^0-9]/g, "") : "51999999999").slice(0, 15)}`,
                                            secretKey: appsetting.privatekey,
                                            sourceId: transaction?.transactionresponse?.data.id,
                                            url: appsetting.culqiurlcharge,
                                        },
                                        method: "post",
                                        url: `${bridgeEndpoint}processopenpay/handlecharge`,
                                        _requestid: responsedata.id,
                                    });

                                    if (requestOpenpayCharge.data.success) {
                                        successPay = true;

                                        charge = requestOpenpayCharge.data.result;

                                        paymenttype = requestOpenpayCharge?.data?.result?.card?.type;
                                    }
                                    else {
                                        let errorCharge = requestOpenpayCharge?.data?.operationMessage || "unsuccessful payment";

                                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, null, errorCharge || "generic_payment_error", responsedata.status, responsedata.success);
                                        return response.status(responsedata.status).json(responsedata);
                                    }
                                }
                            }

                            if (successPay) {
                                var balanceResponse = await genericfunctions.createBalance(corpid, orgid, 0, reference, "ACTIVO", "GENERAL", null, null, (totalamount || buyamount), ((org?.balance || 0) + (totalamount || buyamount)), billbyorg ? org.doctype : corp.doctype, billbyorg ? org.docnum : corp.docnum, "PAID", new Date().toISOString().split("T")[0], usr, usr, responsedata.id);

                                if (balanceResponse) {
                                    var lastExchangeData = await genericfunctions.getExchangeRate("USD", responsedata.id);

                                    var invoicesubtotal = 0;
                                    var invoicetaxes = 0;
                                    var invoicetotalcharge = 0;

                                    var producthasigv = "";
                                    var productigvtribute = "";
                                    var producttotaligv = 0;
                                    var producttotalamount = 0;
                                    var productigvrate = 0;
                                    var productprice = 0;
                                    var productnetprice = 0;
                                    var productnetworth = 0;

                                    if (billbyorg ? org.doctype !== "0" : org.doctype !== "0") {
                                        invoicesubtotal = buyamount;
                                        invoicetaxes = Math.round(((appsetting.igv * buyamount) + Number.EPSILON) * 100) / 100;
                                        invoicetotalcharge = Math.round((((appsetting.igv * buyamount) + buyamount) + Number.EPSILON) * 100) / 100;

                                        producthasigv = "10";
                                        productigvtribute = "1000";
                                        producttotaligv = Math.round(((appsetting.igv * buyamount) + Number.EPSILON) * 100) / 100;
                                        producttotalamount = Math.round((((appsetting.igv * buyamount) + buyamount) + Number.EPSILON) * 100) / 100;
                                        productigvrate = Math.round(((appsetting.igv) + Number.EPSILON) * 100) / 100;
                                        productprice = Math.round((((appsetting.igv * buyamount) + buyamount) + Number.EPSILON) * 100) / 100;
                                        productnetprice = buyamount;
                                        productnetworth = buyamount;
                                    }
                                    else {
                                        invoicesubtotal = buyamount;
                                        invoicetaxes = 0;
                                        invoicetotalcharge = buyamount;

                                        producthasigv = "40";
                                        productigvtribute = "9998";
                                        producttotaligv = 0;
                                        producttotalamount = buyamount;
                                        productigvrate = 0;
                                        productprice = buyamount;
                                        productnetprice = buyamount;
                                        productnetworth = buyamount;
                                    }

                                    const currentDate = new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60000);

                                    var invoiceResponse = await genericfunctions.createInvoice(corpid, orgid, 0, reference, "ACTIVO", "INVOICE", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, invoicesubtotal, invoicetaxes, invoicetotalcharge, "USD", lastExchangeData?.exchangerate || 1, "PENDING", null, purchaseorder, null, null, null, comments, "typecredit_alcontado", null, null, null, null, null, usr, null, buyamount, "PAID", false, currentDate.getFullYear(), (currentDate.getMonth() + 1), paymenttype || "", responsedata.id);

                                    if (invoiceResponse) {
                                        await genericfunctions.changeInvoiceBalance(corpid, orgid, balanceResponse.balanceid, invoiceResponse.invoiceid, usr, responsedata.id);

                                        await genericfunctions.createInvoiceDetail(corpid, orgid, invoiceResponse.invoiceid, `COMPRA DE SALDO - ${billbyorg ? org.businessname : corp.businessname}`, "ACTIVO", "NINGUNO", 1, "S001", producthasigv, "10", productigvtribute, "ZZ", producttotaligv, producttotalamount, productigvrate, productprice, `COMPRA DE SALDO - ${billbyorg ? org.businessname : corp.businessname}`, productnetprice, productnetworth, parseFloat(buyamount), usr, responsedata.id);

                                        const chargedata = await genericfunctions.insertCharge(corpid, orgid, invoiceResponse.invoiceid, null, (settings.amount / 100), true, (iscard ? chargeBridge : charge), (iscard ? chargeBridge.id : charge.id), settings.currency, settings.description, (iscard ? (paymentcard?.mail || userprofile.email) : (token ? token.email : (userprofile.email || "generic@mail.com"))), "INSERT", null, null, usr, "PAID", (iscard ? paymentcardid : (token ? token.id : null)), (iscard ? null : token || null), (iscard ? "REGISTEREDCARD" : (charge.object ? "CULQI" : "OPENPAY")), responsedata.id);

                                        await genericfunctions.insertPayment(corpid, orgid, invoiceResponse.invoiceid, true, chargedata?.chargeid, (iscard ? chargeBridge : charge), (iscard ? chargeBridge.id : charge.id), (settings.amount / 100), (iscard ? (paymentcard?.mail || userprofile.email) : (token ? token.email : (userprofile.email || "generic@mail.com"))), usr, (iscard ? paymentcardid : (token ? token.id : null)), (iscard ? null : token || null), appsetting.location, appsetting.paymentprovider, responsedata.id);

                                        var invoicecorrelative = null;
                                        var documenttype = null;

                                        if (corp.billbyorg) {
                                            if ((org.sunatcountry === "PE") && (org.doctype === "1" || org.doctype === "4" || org.doctype === "7")) {
                                                invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "TICKET", responsedata.id);
                                                documenttype = "03";
                                            }
                                            else {
                                                invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "INVOICE", responsedata.id);
                                                documenttype = "01";
                                            }
                                        }
                                        else {
                                            if ((corp.sunatcountry === "PE") && (corp.doctype === "1" || corp.doctype === "4" || corp.doctype === "7")) {
                                                invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "TICKET", responsedata.id);
                                                documenttype = "03";
                                            }
                                            else {
                                                invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "INVOICE", responsedata.id);
                                                documenttype = "01";
                                            }
                                        }

                                        if (invoicecorrelative) {
                                            try {
                                                var invoicedata = {
                                                    CodigoAnexoEmisor: appsetting.annexcode,
                                                    CodigoFormatoImpresion: appsetting.printingformat,
                                                    CodigoMoneda: "USD",
                                                    Username: appsetting.sunatusername,
                                                    TipoDocumento: documenttype,
                                                    TipoRucEmisor: appsetting.emittertype,
                                                    CodigoRucReceptor: billbyorg ? org.doctype : corp.doctype,
                                                    CodigoUbigeoEmisor: appsetting.ubigeo,
                                                    EnviarSunat: billbyorg ? org.autosendinvoice : corp.autosendinvoice,
                                                    FechaEmision: new Date(new Date().setHours(new Date().getHours() - 5)).toISOString().split("T")[0],
                                                    FechaVencimiento: new Date(new Date().setHours(new Date().getHours() - 5)).toISOString().split("T")[0],
                                                    MailEnvio: billbyorg ? org.contactemail : corp.contactemail,
                                                    MontoTotal: Math.round((invoicetotalcharge + Number.EPSILON) * 100) / 100,
                                                    NombreComercialEmisor: appsetting.tradename,
                                                    RazonSocialEmisor: appsetting.businessname,
                                                    RazonSocialReceptor: billbyorg ? org.businessname : corp.businessname,
                                                    CorrelativoDocumento: genericfunctions.padNumber(invoicecorrelative.p_correlative, 8),
                                                    RucEmisor: appsetting.ruc,
                                                    NumeroDocumentoReceptor: billbyorg ? org.docnum : corp.docnum,
                                                    NumeroSerieDocumento: documenttype === "01" ? appsetting.invoiceserie : appsetting.ticketserie,
                                                    RetornaPdf: appsetting.returnpdf,
                                                    RetornaXmlSunat: appsetting.returnxmlsunat,
                                                    RetornaXml: appsetting.returnxml,
                                                    TipoCambio: (lastExchangeData?.exchangeratesol / lastExchangeData?.exchangerate) || 1,
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
                                                    invoicedata.CodigoOperacionSunat = org.sunatcountry === "PE" ? appsetting.operationcodeperu : appsetting.operationcodeother;
                                                    invoicedata.MontoTotalGravado = org.sunatcountry === "PE" ? Math.round((invoicesubtotal + Number.EPSILON) * 100) / 100 : null;
                                                    invoicedata.MontoTotalInafecto = org.sunatcountry === "PE" ? "0" : Math.round((invoicesubtotal + Number.EPSILON) * 100) / 100;
                                                    invoicedata.MontoTotalIgv = org.sunatcountry === "PE" ? Math.round((invoicetaxes + Number.EPSILON) * 100) / 100 : null;
                                                }
                                                else {
                                                    invoicedata.CodigoOperacionSunat = corp.sunatcountry === "PE" ? appsetting.operationcodeperu : appsetting.operationcodeother;
                                                    invoicedata.MontoTotalGravado = corp.sunatcountry === "PE" ? Math.round((invoicesubtotal + Number.EPSILON) * 100) / 100 : null;
                                                    invoicedata.MontoTotalInafecto = corp.sunatcountry === "PE" ? "0" : Math.round((invoicesubtotal + Number.EPSILON) * 100) / 100;
                                                    invoicedata.MontoTotalIgv = corp.sunatcountry === "PE" ? Math.round((invoicetaxes + Number.EPSILON) * 100) / 100 : null;
                                                }

                                                var calcdetraction = false;

                                                if (corp.billbyorg) {
                                                    if (org.sunatcountry === "PE") {
                                                        calcdetraction = true;
                                                    }
                                                }
                                                else {
                                                    if (corp.sunatcountry === "PE") {
                                                        calcdetraction = true;
                                                    }
                                                }

                                                if (calcdetraction) {
                                                    if (appsetting.detraction && appsetting.detractioncode && appsetting.detractionaccount && (appsetting.detractionminimum || appsetting.detractionminimum === 0)) {
                                                        var compareamount = 0;

                                                        if (appsetting.detractionminimum) {
                                                            compareamount = (invoicetotalcharge / (lastExchangeData?.exchangerate || 0) * (lastExchangeData?.exchangeratesol || 0));
                                                        }

                                                        if (compareamount > appsetting.detractionminimum) {
                                                            invoicedata.CodigoDetraccion = appsetting.detractioncode;
                                                            invoicedata.CodigoOperacionSunat = "1001";
                                                            invoicedata.MontoTotalDetraccion = Math.round(Math.round(((invoicetotalcharge * appsetting.detraction) + Number.EPSILON) * 100) / 100);
                                                            invoicedata.MontoPendienteDetraccion = Math.round(((invoicedata.MontoTotal - (invoicedata.MontoTotalDetraccion || 0)) + Number.EPSILON) * 100) / 100;
                                                            invoicedata.MontoTotalInafecto = null;
                                                            invoicedata.NumeroCuentaDetraccion = appsetting.detractionaccount;
                                                            invoicedata.PaisRecepcion = null;
                                                            invoicedata.PorcentajeTotalDetraccion = appsetting.detraction * 100;

                                                            var adicional02 = {
                                                                CodigoDatoAdicional: "06",
                                                                DescripcionDatoAdicional: "CUENTA DE DETRACCION: " + appsetting.detractionaccount
                                                            }

                                                            invoicedata.DataList.push(adicional02);
                                                        }
                                                    }
                                                }

                                                var adicional01 = {
                                                    CodigoDatoAdicional: "05",
                                                    DescripcionDatoAdicional: "FORMA DE PAGO: TRANSFERENCIA"
                                                }

                                                invoicedata.DataList.push(adicional01);

                                                if (purchaseorder) {
                                                    var adicional03 = {
                                                        CodigoDatoAdicional: "15",
                                                        DescripcionDatoAdicional: purchaseorder
                                                    }

                                                    invoicedata.DataList.push(adicional03);
                                                }

                                                if (comments) {
                                                    var adicional04 = {
                                                        CodigoDatoAdicional: "07",
                                                        DescripcionDatoAdicional: comments
                                                    }

                                                    invoicedata.DataList.push(adicional04);
                                                }

                                                var adicional05 = {
                                                    CodigoDatoAdicional: "01",
                                                    DescripcionDatoAdicional: "AL CONTADO"
                                                }

                                                invoicedata.DataList.push(adicional05);

                                                if (adicional05) {
                                                    invoicedata.FechaVencimiento = null;
                                                }

                                                var invoicedetaildata = {
                                                    CantidadProducto: 1,
                                                    CodigoProducto: "S001",
                                                    TipoVenta: "10",
                                                    UnidadMedida: "ZZ",
                                                    IgvTotal: Math.round((producttotaligv + Number.EPSILON) * 100) / 100,
                                                    MontoTotal: Math.round((producttotalamount + Number.EPSILON) * 100) / 100,
                                                    TasaIgv: Math.round((productigvrate * 100) || 0),
                                                    PrecioProducto: Math.round((productprice + Number.EPSILON) * 100) / 100,
                                                    DescripcionProducto: `COMPRA DE SALDO - ${invoicedata.RazonSocialReceptor}`,
                                                    PrecioNetoProducto: Math.round((productnetprice + Number.EPSILON) * 100) / 100,
                                                    ValorNetoProducto: Math.round((productnetworth + Number.EPSILON) * 100) / 100,
                                                    AfectadoIgv: producthasigv,
                                                    TributoIgv: productigvtribute,
                                                };

                                                invoicedata.ProductList.push(invoicedetaildata);

                                                if (appsetting?.invoiceprovider === "MIFACT") {
                                                    const requestSendToSunat = await axiosObservable({
                                                        data: invoicedata,
                                                        method: "post",
                                                        url: `${bridgeEndpoint}processmifact/sendinvoice`,
                                                        _requestid: responsedata.id,
                                                    });

                                                    if (requestSendToSunat.data.result) {
                                                        await genericfunctions.invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, "INVOICED", null, requestSendToSunat.data.result.cadenaCodigoQr, requestSendToSunat.data.result.codigoHash, requestSendToSunat.data.result.urlCdrSunat, requestSendToSunat.data.result.urlPdf, requestSendToSunat.data.result.urlXml, invoicedata.NumeroSerieDocumento, appsetting?.ruc || null, appsetting?.businessname || null, appsetting?.tradename || null, appsetting?.fiscaladdress || null, appsetting?.ubigeo || null, appsetting?.emittertype || null, appsetting?.annexcode || null, appsetting?.printingformat || null, invoicedata?.EnviarSunat || null, appsetting?.returnpdf || null, appsetting?.returnxmlsunat || null, appsetting?.returnxml || null, appsetting?.token || null, appsetting?.sunaturl || null, appsetting?.sunatusername || null, appsetting?.xmlversion || null, appsetting?.ublversion || null, invoicedata?.CodigoRucReceptor || null, invoicedata?.NumeroDocumentoReceptor || null, invoicedata?.RazonSocialReceptor || null, invoicedata?.DireccionFiscalReceptor || null, invoicedata?.PaisRecepcion || null, invoicedata?.MailEnvio || null, documenttype || null, invoicedata?.CodigoOperacionSunat || null, invoicedata?.FechaVencimiento || null, purchaseorder || null, comments || null, "typecredit_alcontado" || null, appsetting?.detractioncode || null, appsetting?.detraction || null, appsetting?.detractionaccount, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);
                                                    }
                                                    else {
                                                        await genericfunctions.invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, "ERROR", requestSendToSunat.data.operationMessage, null, null, null, null, null, null, appsetting?.ruc || null, appsetting?.businessname || null, appsetting?.tradename || null, appsetting?.fiscaladdress || null, appsetting?.ubigeo || null, appsetting?.emittertype || null, appsetting?.annexcode || null, appsetting?.printingformat || null, invoicedata?.EnviarSunat || null, appsetting?.returnpdf || null, appsetting?.returnxmlsunat || null, appsetting?.returnxml || null, appsetting?.token || null, appsetting?.sunaturl || null, appsetting?.sunatusername || null, appsetting?.xmlversion || null, appsetting?.ublversion || null, invoicedata?.CodigoRucReceptor || null, invoicedata?.NumeroDocumentoReceptor || null, invoicedata?.RazonSocialReceptor || null, invoicedata?.DireccionFiscalReceptor || null, invoicedata?.PaisRecepcion || null, invoicedata?.MailEnvio || null, documenttype || null, invoicedata?.CodigoOperacionSunat || null, invoicedata?.FechaVencimiento || null, purchaseorder || null, comments || null, "typecredit_alcontado" || null, appsetting?.detractioncode || null, appsetting?.detraction || null, appsetting?.detractionaccount, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);

                                                        if (corp.billbyorg) {
                                                            if ((org.sunatcountry === "PE") && (org.doctype === "1" || org.doctype === "4" || org.doctype === "7")) {
                                                                await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "TICKETERROR", responsedata.id);
                                                            }
                                                            else {
                                                                await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "INVOICEERROR", responsedata.id);
                                                            }
                                                        }
                                                        else {
                                                            if ((corp.sunatcountry === "PE") && (corp.doctype === "1" || corp.doctype === "4" || corp.doctype === "7")) {
                                                                await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "TICKETERROR", responsedata.id);
                                                            }
                                                            else {
                                                                await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "INVOICEERROR", responsedata.id);
                                                            }
                                                        }
                                                    }
                                                }
                                                else if (appsetting?.invoiceprovider === "SIIGO") {
                                                    invoicedata.TipoDocumentoSiigo = "FV";
                                                    invoicedata.TipoCambio = (lastExchangeData?.exchangeratecop / lastExchangeData?.exchangerate) || 1;
                                                    invoicedata.TipoPago = (paymenttype == "Crédito" || paymenttype == "credit") ? "Tarjeta Crédito" : "Tarjeta Débito";
                                                    invoicedata.CityCountry = corp.billbyorg ? org.countrycode : corp.countrycode;
                                                    invoicedata.CityState = corp.billbyorg ? org.statecode : corp.statecode;
                                                    invoicedata.CityCode = corp.billbyorg ? org.citycode : corp.citycode;

                                                    const requestSendToSiigo = await axiosObservable({
                                                        data: invoicedata,
                                                        method: "post",
                                                        url: `${bridgeEndpoint}processsiigo/sendinvoice`,
                                                        _requestid: responsedata.id,
                                                    });

                                                    if (requestSendToSiigo.data.result) {
                                                        let correlativeOverride = null;

                                                        if (requestSendToSiigo.data.result.correlativoCpe) {
                                                            correlativeOverride = parseInt(`${requestSendToSiigo.data.result.correlativoCpe}`);
                                                        }

                                                        await genericfunctions.invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, "INVOICED", null, requestSendToSiigo.data.result.cadenaCodigoQr, requestSendToSiigo.data.result.codigoHash, requestSendToSiigo.data.result.urlCdrSunat, requestSendToSiigo.data.result.urlPdf, requestSendToSiigo.data.result.urlXml, invoicedata.NumeroSerieDocumento, appsetting?.ruc || null, appsetting?.businessname || null, appsetting?.tradename || null, appsetting?.fiscaladdress || null, appsetting?.ubigeo || null, appsetting?.emittertype || null, appsetting?.annexcode || null, appsetting?.printingformat || null, invoicedata?.EnviarSunat || null, appsetting?.returnpdf || null, appsetting?.returnxmlsunat || null, appsetting?.returnxml || null, appsetting?.token || null, appsetting?.sunaturl || null, appsetting?.sunatusername || null, appsetting?.xmlversion || null, appsetting?.ublversion || null, invoicedata?.CodigoRucReceptor || null, invoicedata?.NumeroDocumentoReceptor || null, invoicedata?.RazonSocialReceptor || null, invoicedata?.DireccionFiscalReceptor || null, invoicedata?.PaisRecepcion || null, invoicedata?.MailEnvio || null, documenttype || null, invoicedata?.CodigoOperacionSunat || null, invoicedata?.FechaVencimiento || null, purchaseorder || null, comments || null, "typecredit_alcontado" || null, appsetting?.detractioncode || null, appsetting?.detraction || null, appsetting?.detractionaccount, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, correlativeOverride, responsedata.id);
                                                    }
                                                    else {
                                                        await genericfunctions.invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, "ERROR", requestSendToSiigo.data.operationMessage, null, null, null, null, null, null, appsetting?.ruc || null, appsetting?.businessname || null, appsetting?.tradename || null, appsetting?.fiscaladdress || null, appsetting?.ubigeo || null, appsetting?.emittertype || null, appsetting?.annexcode || null, appsetting?.printingformat || null, invoicedata?.EnviarSunat || null, appsetting?.returnpdf || null, appsetting?.returnxmlsunat || null, appsetting?.returnxml || null, appsetting?.token || null, appsetting?.sunaturl || null, appsetting?.sunatusername || null, appsetting?.xmlversion || null, appsetting?.ublversion || null, invoicedata?.CodigoRucReceptor || null, invoicedata?.NumeroDocumentoReceptor || null, invoicedata?.RazonSocialReceptor || null, invoicedata?.DireccionFiscalReceptor || null, invoicedata?.PaisRecepcion || null, invoicedata?.MailEnvio || null, documenttype || null, invoicedata?.CodigoOperacionSunat || null, invoicedata?.FechaVencimiento || null, purchaseorder || null, comments || null, "typecredit_alcontado" || null, appsetting?.detractioncode || null, appsetting?.detraction || null, appsetting?.detractionaccount, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);

                                                        if (corp.billbyorg) {
                                                            if ((org.sunatcountry === "PE") && (org.doctype === "1" || org.doctype === "4" || org.doctype === "7")) {
                                                                await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "TICKETERROR", responsedata.id);
                                                            }
                                                            else {
                                                                await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "INVOICEERROR", responsedata.id);
                                                            }
                                                        }
                                                        else {
                                                            if ((corp.sunatcountry === "PE") && (corp.doctype === "1" || corp.doctype === "4" || corp.doctype === "7")) {
                                                                await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "TICKETERROR", responsedata.id);
                                                            }
                                                            else {
                                                                await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "INVOICEERROR", responsedata.id);
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                            catch (exception) {
                                                printException(exception, request.originalUrl, responsedata.id);

                                                await genericfunctions.invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, "ERROR", exception.message, null, null, null, null, null, null, appsetting.ruc, appsetting.businessname, appsetting.tradename, appsetting.fiscaladdress, appsetting.ubigeo, appsetting.emittertype, appsetting.annexcode, appsetting.printingformat, appsetting.sendtosunat, appsetting.returnpdf, appsetting.returnxmlsunat, appsetting.returnxml, appsetting.token, appsetting.sunaturl, appsetting.sunatusername, appsetting.xmlversion, appsetting.ublversion, billbyorg ? org.doctype : corp.doctype, billbyorg ? org.docnum : corp.docnum, billbyorg ? org.businessname : corp.businessname, billbyorg ? org.fiscaladdress : corp.fiscaladdress, billbyorg ? org.sunatcountry : corp.sunatcountry, billbyorg ? org.contactemail : corp.contactemail, documenttype, null, null, purchaseorder, comments, "typecredit_alcontado", null, null, null, null, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);

                                                if (corp.billbyorg) {
                                                    if ((org.sunatcountry === "PE") && (org.doctype === "1" || org.doctype === "4" || org.doctype === "7")) {
                                                        await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "TICKETERROR", responsedata.id);
                                                    }
                                                    else {
                                                        await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "INVOICEERROR", responsedata.id);
                                                    }
                                                }
                                                else {
                                                    if ((corp.sunatcountry === "PE") && (corp.doctype === "1" || corp.doctype === "4" || corp.doctype === "7")) {
                                                        await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "TICKETERROR", responsedata.id);
                                                    }
                                                    else {
                                                        await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "INVOICEERROR", responsedata.id);
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            await genericfunctions.invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, "ERROR", "Correlative not found", null, null, null, null, null, null, appsetting.ruc, appsetting.businessname, appsetting.tradename, appsetting.fiscaladdress, appsetting.ubigeo, appsetting.emittertype, appsetting.annexcode, appsetting.printingformat, appsetting.sendtosunat, appsetting.returnpdf, appsetting.returnxmlsunat, appsetting.returnxml, appsetting.token, appsetting.sunaturl, appsetting.sunatusername, appsetting.xmlversion, appsetting.ublversion, billbyorg ? org.doctype : corp.doctype, billbyorg ? org.docnum : corp.docnum, billbyorg ? org.businessname : corp.businessname, billbyorg ? org.fiscaladdress : corp.fiscaladdress, billbyorg ? org.sunatcountry : corp.sunatcountry, billbyorg ? org.contactemail : corp.contactemail, documenttype, null, null, purchaseorder, comments, "typecredit_alcontado", null, null, null, null, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);
                                        }

                                        if (iscard) {
                                            responsedata = genericfunctions.changeResponseData(responsedata, null, { message: "finished process" }, "culqipaysuccess", 200, true);
                                            return response.status(responsedata.status).json(responsedata);
                                        }
                                        else {
                                            responsedata = genericfunctions.changeResponseData(responsedata, charge?.outcome?.code || charge?.id, charge?.object ? { id: charge.id, object: charge.object } : null, charge?.outcome?.user_message || "successful_transaction", 200, true);
                                            return response.status(responsedata.status).json(responsedata);
                                        }
                                    }
                                    else {
                                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "error creating invoice", responsedata.status, responsedata.success);
                                        return response.status(responsedata.status).json(responsedata);
                                    }
                                }
                                else {
                                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "error creating balance", responsedata.status, responsedata.success);
                                    return response.status(responsedata.status).json(responsedata);
                                }
                            }
                            else {
                                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "unsuccessful payment", responsedata.status, responsedata.success);
                                return response.status(responsedata.status).json(responsedata);
                            }
                        }
                        else {
                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "invalid user", responsedata.status, responsedata.success);
                            return response.status(responsedata.status).json(responsedata);
                        }
                    }
                    else {
                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "invalid appsetting", responsedata.status, responsedata.success);
                        return response.status(responsedata.status).json(responsedata);
                    }
                }
                else {
                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "invalid invoice data", responsedata.status, responsedata.success);
                    return response.status(responsedata.status).json(responsedata);
                }
            }
            else {
                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "payment card missing information", responsedata.status, responsedata.success);
                return response.status(responsedata.status).json(responsedata);
            }
        }
        else {
            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "corporation not found", responsedata.status, responsedata.success);
            return response.status(responsedata.status).json(responsedata);
        }
    } catch (exception) {
        if (exception.user_message) {
            return response.status(500).json({
                ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
                message: exception.user_message,
            });
        }
        else if (exception.merchant_message) {
            return response.status(500).json({
                ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
                message: exception.merchant_message.split("https://www.culqi.com/api")[0],
            });
        }
        else {
            return response.status(500).json({
                ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
                message: exception.message,
            });
        }
    }
};

exports.createCreditNote = async (request, response) => {
    const { userid, usr } = request.user;
    const { corpid, orgid, invoiceid, creditnotetype, creditnotemotive, paymentmethod } = request.body;
    var { creditnotediscount } = request.body;

    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var responsedata = genericfunctions.generateResponseData(request._requestid);

        creditnotediscount = Math.round((parseFloat(creditnotediscount) + Number.EPSILON) * 100) / 100;

        const invoice = await genericfunctions.getInvoice(corpid, orgid, userid, invoiceid, responsedata.id);

        if (invoice) {
            if (invoice.type === "INVOICE" && invoice.invoicestatus === "INVOICED" && (invoice.invoicetype === "01" || invoice.invoicetype === "03")) {
                const appsetting = await genericfunctions.getAppSettingSingle(corpid, orgid, responsedata.id);

                if (appsetting) {
                    const invoiceDate = new Date(new Date().setHours(new Date().getHours() - 5)).toISOString().split("T")[0];
                    const currentDate = new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60000);

                    const invoiceResponse = await genericfunctions.createInvoice(invoice.corpid, invoice.orgid, 0, `NOTA DE CREDITO: ${invoice.description}`, invoice.status, "CREDITNOTE", appsetting.ruc, appsetting.businessname, appsetting.tradename, appsetting.fiscaladdress, appsetting.ubigeo, appsetting.emittertype, appsetting.annexcode, appsetting.printingformat, appsetting.xmlversion, appsetting.ublversion, invoice.receiverdoctype, invoice.receiverdocnum, invoice.receiverbusinessname, invoice.receiverfiscaladdress, invoice.receivercountry, invoice.receivermail, "07", invoice.sunatopecode === "1001" ? "0101" : invoice.sunatopecode, null, null, `NOTA DE CREDITO: ${invoice.concept}`, invoiceDate, invoiceDate, creditnotetype === "01" ? invoice.subtotal : parseFloat(creditnotediscount), invoice.taxes, creditnotetype === "01" ? invoice.totalamount : (parseFloat(creditnotediscount) * (appsetting.igv + 1)), invoice.currency, invoice.exchangerate, "PENDING", null, invoice.purchaseorder, null, null, null, invoice.comments, invoice.credittype, creditnotetype, creditnotemotive, parseFloat(creditnotediscount), null, null, usr, invoice.invoiceid, invoice.netamount, "NONE", false, currentDate.getFullYear(), (currentDate.getMonth() + 1), paymentmethod || "", responsedata.id);

                    if (invoiceResponse) {
                        var invoicecorrelative = null;

                        if (invoice.invoicetype == "01") {
                            invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "CREDITINVOICE", responsedata.id);
                        }
                        else {
                            invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "CREDITTICKET", responsedata.id);
                        }

                        if (invoicecorrelative) {
                            try {
                                var exchangeratedata = await genericfunctions.getExchangeRate(invoice.currency, responsedata.id);

                                var invoicedata = {
                                    CodigoAnexoEmisor: appsetting.annexcode,
                                    CodigoFormatoImpresion: appsetting.printingformat,
                                    CodigoMoneda: invoice.currency,
                                    Username: appsetting.sunatusername,
                                    TipoDocumento: "07",
                                    TipoRucEmisor: appsetting.emittertype,
                                    CodigoRucReceptor: invoice.receiverdoctype,
                                    CodigoUbigeoEmisor: appsetting.ubigeo,
                                    EnviarSunat: invoice.sendtosunat,
                                    FechaEmision: invoiceDate,
                                    FechaVencimiento: invoiceDate,
                                    MailEnvio: invoice.receivermail,
                                    MontoTotal: Math.round(((creditnotetype === "01" ? invoice.totalamount : parseFloat(creditnotediscount * (appsetting.igv + 1))) + Number.EPSILON) * 100) / 100,
                                    NombreComercialEmisor: appsetting.tradename,
                                    RazonSocialEmisor: appsetting.businessname,
                                    RazonSocialReceptor: invoice.receiverbusinessname,
                                    CorrelativoDocumento: genericfunctions.padNumber(invoicecorrelative.p_correlative, 8),
                                    RucEmisor: appsetting.ruc,
                                    NumeroDocumentoReceptor: invoice.receiverdocnum,
                                    NumeroSerieDocumento: invoice.invoicetype === "01" ? appsetting.invoicecreditserie : appsetting.ticketcreditserie,
                                    RetornaPdf: appsetting.returnpdf,
                                    RetornaXmlSunat: appsetting.returnxmlsunat,
                                    RetornaXml: appsetting.returnxml,
                                    TipoCambio: invoice.currency === "PEN" ? "1.000" : ((exchangeratedata?.exchangeratesol / exchangeratedata?.exchangerate) || invoice.exchangerate),
                                    Token: appsetting.token,
                                    DireccionFiscalEmisor: appsetting.fiscaladdress,
                                    DireccionFiscalReceptor: invoice.receiverfiscaladdress,
                                    VersionXml: appsetting.xmlversion,
                                    VersionUbl: appsetting.ublversion,
                                    Endpoint: appsetting.sunaturl,
                                    PaisRecepcion: invoice.receivercountry,
                                    CodigoOperacionSunat: invoice.sunatopecode === "1001" ? "0101" : invoice.sunatopecode,
                                    MontoTotalGravado: creditnotetype === "01" ? (invoice.receivercountry === "PE" ? Math.round((invoice.subtotal + Number.EPSILON) * 100) / 100 : null) : (invoice.receivercountry === "PE" ? Math.round((creditnotediscount + Number.EPSILON) * 100) / 100 : null),
                                    MontoTotalInafecto: creditnotetype === "01" ? (invoice.receivercountry === "PE" ? "0" : Math.round((invoice.subtotal + Number.EPSILON) * 100) / 100) : (invoice.receivercountry === "PE" ? "0" : Math.round((creditnotediscount * (appsetting.igv + 1) + Number.EPSILON) * 100) / 100),
                                    MontoTotalIgv: creditnotetype === "01" ? (invoice.receivercountry === "PE" ? Math.round((invoice.taxes + Number.EPSILON) * 100) / 100 : null) : (invoice.receivercountry === "PE" ? Math.round((creditnotediscount * appsetting.igv + Number.EPSILON) * 100) / 100 : null),
                                    TipoNotaCredito: creditnotetype,
                                    MotivoNotaCredito: creditnotemotive,
                                    CodigoDocumentoNotaCredito: invoice.invoicetype,
                                    NumeroSerieNotaCredito: invoice.serie,
                                    NumeroCorrelativoNotaCredito: genericfunctions.padNumber(invoice.correlative, 8),
                                    FechaEmisionNotaCredito: invoice.invoicedate,
                                    ProductList: []
                                }

                                const invoicedetail = await genericfunctions.getInvoiceDetail(corpid, orgid, userid, invoice.invoiceid, responsedata.id);

                                if (creditnotetype === "01") {
                                    invoicedetail.forEach(async data => {
                                        var invoicedetaildata = {
                                            CantidadProducto: data.quantity,
                                            CodigoProducto: data.productcode,
                                            TipoVenta: data.saletype,
                                            UnidadMedida: data.measureunit,
                                            IgvTotal: Math.round((data.totaligv + Number.EPSILON) * 100) / 100,
                                            MontoTotal: Math.round((data.totalamount + Number.EPSILON) * 100) / 100,
                                            TasaIgv: Math.round((data.igvrate * 100) || 0),
                                            PrecioProducto: Math.round((data.productprice + Number.EPSILON) * 100) / 100,
                                            DescripcionProducto: data.productdescription,
                                            PrecioNetoProducto: Math.round((data.productnetprice + Number.EPSILON) * 100) / 100,
                                            ValorNetoProducto: Math.round((data.productnetworth + Number.EPSILON) * 100) / 100,
                                            AfectadoIgv: invoice.receivercountry === "PE" ? "10" : "40",
                                            TributoIgv: invoice.receivercountry === "PE" ? "1000" : "9998",
                                        };

                                        invoicedata.ProductList.push(invoicedetaildata);
                                    });
                                }
                                else {
                                    var invoicedetaildata = {
                                        CantidadProducto: "1",
                                        CodigoProducto: invoicedetail[0].productcode,
                                        TipoVenta: invoicedetail[0].saletype,
                                        UnidadMedida: invoicedetail[0].measureunit,
                                        IgvTotal: invoice.receivercountry === "PE" ? Math.round((creditnotediscount * appsetting.igv + Number.EPSILON) * 100) / 100 : 0,
                                        MontoTotal: Math.round(((creditnotediscount * (appsetting.igv + 1)) + Number.EPSILON) * 100) / 100,
                                        TasaIgv: invoice.receivercountry === "PE" ? Math.round((appsetting.igv * 100) || 0) : 0,
                                        PrecioProducto: Math.round(((creditnotediscount * (appsetting.igv + 1)) + Number.EPSILON) * 100) / 100,
                                        DescripcionProducto: `DISCOUNT: ${creditnotemotive}`,
                                        PrecioNetoProducto: invoice.receivercountry === "PE" ? (Math.round((creditnotediscount + Number.EPSILON) * 100) / 100) : (Math.round(((creditnotediscount * (appsetting.igv + 1)) + Number.EPSILON) * 100) / 100),
                                        ValorNetoProducto: invoice.receivercountry === "PE" ? (Math.round((creditnotediscount + Number.EPSILON) * 100) / 100) : (Math.round(((creditnotediscount * (appsetting.igv + 1)) + Number.EPSILON) * 100) / 100),
                                        AfectadoIgv: invoice.receivercountry === "PE" ? "10" : "40",
                                        TributoIgv: invoice.receivercountry === "PE" ? "1000" : "9998",
                                    };

                                    invoicedata.ProductList.push(invoicedetaildata);
                                }

                                if (appsetting?.invoiceprovider === "MIFACT") {
                                    const requestSendToSunat = await axiosObservable({
                                        data: invoicedata,
                                        method: "post",
                                        url: `${bridgeEndpoint}processmifact/sendinvoice`,
                                        _requestid: responsedata.id,
                                    });

                                    if (requestSendToSunat.data.result) {
                                        await genericfunctions.invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, "INVOICED", null, requestSendToSunat.data.result.cadenaCodigoQr, requestSendToSunat.data.result.codigoHash, requestSendToSunat.data.result.urlCdrSunat, requestSendToSunat.data.result.urlPdf, requestSendToSunat.data.result.urlXml, invoicedata.NumeroSerieDocumento, appsetting.ruc, appsetting.businessname, appsetting.tradename, appsetting.fiscaladdress, appsetting.ubigeo, appsetting.emittertype, appsetting.annexcode, appsetting.printingformat, invoice.sendtosunat, invoice.returnpdf, invoice.returnxmlsunat, invoice.returnxml, appsetting.token, appsetting.sunaturl, appsetting.sunatusername, appsetting.xmlversion, appsetting.ublversion, invoice.receiverdoctype, invoice.receiverdocnum, invoice.receiverbusinessname, invoice.receiverfiscaladdress, invoice.receivercountry, invoice.receivermail, "07", invoice.sunatopecode, invoiceDate, invoice.purchaseorder, invoice.comments, invoice.credittype, null, null, null, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);

                                        if (creditnotetype === "01") {
                                            await genericfunctions.changeInvoiceStatus(corpid, orgid, invoiceid, "CANCELED", usr, responsedata.id)
                                        }

                                        responsedata = genericfunctions.changeResponseData(responsedata, null, requestSendToSunat.data.result, "successinvoiced", 200, true);
                                        return response.status(responsedata.status).json(responsedata);
                                    }
                                    else {
                                        await genericfunctions.invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, "ERROR", requestSendToSunat.data.operationMessage, null, null, null, null, null, null, appsetting.ruc, appsetting.businessname, appsetting.tradename, appsetting.fiscaladdress, appsetting.ubigeo, appsetting.emittertype, appsetting.annexcode, appsetting.printingformat, invoice.sendtosunat, invoice.returnpdf, invoice.returnxmlsunat, invoice.returnxml, appsetting.token, appsetting.sunaturl, appsetting.sunatusername, appsetting.xmlversion, appsetting.ublversion, invoice.receiverdoctype, invoice.receiverdocnum, invoice.receiverbusinessname, invoice.receiverfiscaladdress, invoice.receivercountry, invoice.receivermail, "07", invoice.sunatopecode, invoiceDate, invoice.purchaseorder, invoice.comments, invoice.credittype, null, null, null, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);

                                        if (invoice.invoicetype == "01") {
                                            invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "CREDITINVOICEERROR", responsedata.id);
                                        }
                                        else {
                                            invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "CREDITTICKETERROR", responsedata.id);
                                        }

                                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "createdbutnotinvoiced", responsedata.status, responsedata.success);
                                        return response.status(responsedata.status).json(responsedata);
                                    }
                                }
                                else if (appsetting?.invoiceprovider === "SIIGO") {
                                    invoicedata.TipoDocumentoSiigo = "NC";
                                    invoicedata.TipoCambio = invoice.currency === "COP" ? "1.000" : ((exchangeratedata?.exchangeratecop / exchangeratedata?.exchangerate) || invoice.exchangerate);
                                    invoicedata.TipoPago = paymentmethod || "Tarjeta Débito";
                                    invoicedata.InvoiceId = invoice.hashcode;

                                    const corp = await genericfunctions.getCorporation(corpid, responsedata.id);
                                    const org = await genericfunctions.getOrganization(corpid, orgid, responsedata.id);

                                    invoicedata.CityCountry = corp.billbyorg ? org.countrycode : corp.countrycode;
                                    invoicedata.CityState = corp.billbyorg ? org.statecode : corp.statecode;
                                    invoicedata.CityCode = corp.billbyorg ? org.citycode : corp.citycode;

                                    const requestSendToSiigo = await axiosObservable({
                                        data: invoicedata,
                                        method: "post",
                                        url: `${bridgeEndpoint}processsiigo/sendinvoice`,
                                        _requestid: responsedata.id,
                                    });

                                    if (requestSendToSiigo.data.result) {
                                        let correlativeOverride = null;

                                        if (requestSendToSiigo.data.result.correlativoCpe) {
                                            correlativeOverride = parseInt(`${requestSendToSiigo.data.result.correlativoCpe}`);
                                        }

                                        await genericfunctions.invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, "INVOICED", null, requestSendToSiigo.data.result.cadenaCodigoQr, requestSendToSiigo.data.result.codigoHash, requestSendToSiigo.data.result.urlCdrSunat, requestSendToSiigo.data.result.urlPdf, requestSendToSiigo.data.result.urlXml, invoicedata.NumeroSerieDocumento, appsetting.ruc, appsetting.businessname, appsetting.tradename, appsetting.fiscaladdress, appsetting.ubigeo, appsetting.emittertype, appsetting.annexcode, appsetting.printingformat, invoice.sendtosunat, invoice.returnpdf, invoice.returnxmlsunat, invoice.returnxml, appsetting.token, appsetting.sunaturl, appsetting.sunatusername, appsetting.xmlversion, appsetting.ublversion, invoice.receiverdoctype, invoice.receiverdocnum, invoice.receiverbusinessname, invoice.receiverfiscaladdress, invoice.receivercountry, invoice.receivermail, "07", invoice.sunatopecode, invoiceDate, invoice.purchaseorder, invoice.comments, invoice.credittype, null, null, null, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, correlativeOverride, responsedata.id);

                                        if (creditnotetype === "01") {
                                            await genericfunctions.changeInvoiceStatus(corpid, orgid, invoiceid, "CANCELED", usr, responsedata.id)
                                        }

                                        responsedata = genericfunctions.changeResponseData(responsedata, null, requestSendToSiigo.data.result, "successinvoiced", 200, true);
                                        return response.status(responsedata.status).json(responsedata);
                                    }
                                    else {
                                        await genericfunctions.invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, "ERROR", requestSendToSiigo.data.operationMessage, null, null, null, null, null, null, appsetting.ruc, appsetting.businessname, appsetting.tradename, appsetting.fiscaladdress, appsetting.ubigeo, appsetting.emittertype, appsetting.annexcode, appsetting.printingformat, invoice.sendtosunat, invoice.returnpdf, invoice.returnxmlsunat, invoice.returnxml, appsetting.token, appsetting.sunaturl, appsetting.sunatusername, appsetting.xmlversion, appsetting.ublversion, invoice.receiverdoctype, invoice.receiverdocnum, invoice.receiverbusinessname, invoice.receiverfiscaladdress, invoice.receivercountry, invoice.receivermail, "07", invoice.sunatopecode, invoiceDate, invoice.purchaseorder, invoice.comments, invoice.credittype, null, null, null, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);

                                        if (invoice.invoicetype == "01") {
                                            invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "CREDITINVOICEERROR", responsedata.id);
                                        }
                                        else {
                                            invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "CREDITTICKETERROR", responsedata.id);
                                        }

                                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "createdbutnotinvoiced", responsedata.status, responsedata.success);
                                        return response.status(responsedata.status).json(responsedata);
                                    }
                                }
                            }
                            catch (exception) {
                                printException(exception, request.originalUrl, responsedata.id);

                                await genericfunctions.invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, "ERROR", exception.message, null, null, null, null, null, null, appsetting.ruc, appsetting.businessname, appsetting.tradename, appsetting.fiscaladdress, appsetting.ubigeo, appsetting.emittertype, appsetting.annexcode, appsetting.printingformat, invoice.sendtosunat, invoice.returnpdf, invoice.returnxmlsunat, invoice.returnxml, appsetting.token, appsetting.sunaturl, appsetting.sunatusername, appsetting.xmlversion, appsetting.ublversion, invoice.receiverdoctype, invoice.receiverdocnum, invoice.receiverbusinessname, invoice.receiverfiscaladdress, invoice.receivercountry, invoice.receivermail, "07", invoice.sunatopecode, invoiceDate, invoice.purchaseorder, invoice.comments, invoice.credittype, null, null, null, null, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);

                                if (invoice.invoicetype == "01") {
                                    invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "CREDITINVOICEERROR", responsedata.id);
                                }
                                else {
                                    invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "CREDITTICKETERROR", responsedata.id);
                                }

                                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "createdbutnotinvoiced", responsedata.status, responsedata.success);
                                return response.status(responsedata.status).json(responsedata);
                            }
                        }
                        else {
                            await genericfunctions.invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, "ERROR", "Correlative not found", null, null, null, null, null, null, appsetting.ruc, appsetting.businessname, appsetting.tradename, appsetting.fiscaladdress, appsetting.ubigeo, appsetting.emittertype, appsetting.annexcode, appsetting.printingformat, invoice.sendtosunat || null, invoice.returnpdf || null, invoice.returnxmlsunat || null, invoice.returnxml || null, appsetting.token, appsetting.sunaturl, appsetting.sunatusername, appsetting.xmlversion, appsetting.ublversion, invoice.receiverdoctype || null, invoice.receiverdocnum || null, invoice.receiverbusinessname || null, invoice.receiverfiscaladdress || null, invoice.receivercountry || null, invoice.receivermail || null, "07", invoice.sunatopecode || null, invoiceDate, invoice.purchaseorder || null, invoice.comments || null, invoice.credittype || null, null, null, null, null, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);

                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "correlativenotfound", responsedata.status, responsedata.success);
                            return response.status(responsedata.status).json(responsedata);
                        }
                    }
                    else {
                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "errorcreatinginvoice", responsedata.status, responsedata.success);
                        return response.status(responsedata.status).json(responsedata);
                    }
                }
                else {
                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "appsettingnotfound", responsedata.status, responsedata.success);
                    return response.status(responsedata.status).json(responsedata);
                }
            }
            else {
                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "invoicenotmatch", responsedata.status, responsedata.success);
                return response.status(responsedata.status).json(responsedata);
            }
        }
        else {
            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "invoicenotfound", responsedata.status, responsedata.success);
            return response.status(responsedata.status).json(responsedata);
        }
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
};

exports.createInvoice = async (request, response) => {
    const { usr } = request.user;
    const { corpid, orgid, clientdoctype, clientdocnumber, clientbusinessname, clientfiscaladdress, clientcountry, clientmail, clientcredittype, invoicecreatedate, invoiceduedate, invoicecurrency, invoicepurchaseorder, invoicecomments, autosendinvoice, productdetail, onlyinsert, invoiceid, year, month, paymentmethod } = request.body;
    var { invoicetotalamount } = request.body;

    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var responsedata = genericfunctions.generateResponseData(request._requestid);

        invoicetotalamount = Math.round((parseFloat(invoicetotalamount) + Number.EPSILON) * 100) / 100;

        if ((corpid || orgid) && clientcountry) {
            if (productdetail) {
                const appsetting = await genericfunctions.getAppSettingSingle(corpid, orgid, responsedata.id);

                if (appsetting) {
                    if (appsetting?.paymentprovider === "OPENPAY COLOMBIA") {
                        if (invoicecurrency === "COP") {
                            invoicetotalamount = Math.round((parseFloat(invoicetotalamount) + Number.EPSILON));
                        }
                    }

                    var productinfo = [];

                    var invoicesubtotal = 0;
                    var invoicetaxes = 0;
                    var invoicetotalcharge = 0;

                    var lastExchangeData = await genericfunctions.getExchangeRate(invoicecurrency, responsedata.id);

                    if (clientdoctype !== "0") {
                        invoicesubtotal = invoicetotalamount;
                        invoicetaxes = Math.round(((appsetting.igv * invoicetotalamount) + Number.EPSILON) * 100) / 100;
                        invoicetotalcharge = Math.round((((appsetting.igv * invoicetotalamount) + invoicetotalamount) + Number.EPSILON) * 100) / 100;
                    }
                    else {
                        invoicesubtotal = invoicetotalamount;
                        invoicetaxes = 0;
                        invoicetotalcharge = invoicetotalamount;
                    }

                    var invoiceResponse = await genericfunctions.createInvoice(corpid, orgid, (invoiceid || 0), `GENERATED FOR ${clientdocnumber}`, "ACTIVO", "INVOICE", null, null, null, null, null, null, null, null, null, null, clientdoctype, clientdocnumber, clientbusinessname, clientfiscaladdress, clientcountry, clientmail, null, null, null, null, `GENERATED FOR ${clientdocnumber}`, invoicecreatedate, invoiceduedate, invoicesubtotal, invoicetaxes, invoicetotalcharge, invoicecurrency, lastExchangeData?.exchangerate || 1, (onlyinsert ? "PENDING" : "DRAFT"), null, invoicepurchaseorder, null, null, null, invoicecomments, clientcredittype, null, null, null, null, null, usr, null, invoicetotalamount, "PENDING", false, year, month, paymentmethod, responsedata.id);

                    if (invoiceResponse) {
                        if (invoiceid) {
                            await genericfunctions.deleteInvoiceDetail(corpid, orgid, invoiceid, responsedata.id);
                        }

                        await Promise.all(productdetail.map(async (element) => {
                            var elementproductsubtotal = Math.round((parseFloat(element.productsubtotal) + Number.EPSILON) * 100) / 100;
                            var elementproductquantity = Math.round((parseFloat(element.productquantity) + Number.EPSILON) * 100) / 100;

                            if (appsetting?.paymentprovider === "OPENPAY COLOMBIA") {
                                if (invoicecurrency === "COP") {
                                    elementproductsubtotal = Math.round((parseFloat(element.productsubtotal) + Number.EPSILON));
                                    elementproductquantity = Math.round((parseFloat(element.productquantity) + Number.EPSILON));
                                }
                            }

                            var producthasigv = "";
                            var productigvtribute = "";
                            var producttotaligv = 0;
                            var producttotalamount = 0;
                            var productigvrate = 0;
                            var productprice = 0;
                            var productnetprice = 0;
                            var productnetworth = 0;

                            if (clientdoctype !== "0") {
                                producthasigv = "10";
                                productigvtribute = "1000";
                                producttotaligv = Math.round((((elementproductquantity * elementproductsubtotal) * appsetting.igv) + Number.EPSILON) * 100) / 100;
                                producttotalamount = Math.round((((elementproductquantity * elementproductsubtotal) * (1 + appsetting.igv)) + Number.EPSILON) * 100) / 100;
                                productigvrate = Math.round(((appsetting.igv) + Number.EPSILON) * 100) / 100;
                                productprice = Math.round(((elementproductsubtotal * (1 + appsetting.igv)) + Number.EPSILON) * 100) / 100;
                                productnetprice = elementproductsubtotal;
                                productnetworth = Math.round(((elementproductquantity * elementproductsubtotal) + Number.EPSILON) * 100) / 100;
                            }
                            else {
                                producthasigv = "40";
                                productigvtribute = "9998";
                                producttotaligv = 0;
                                producttotalamount = Math.round(((elementproductquantity * elementproductsubtotal) + Number.EPSILON) * 100) / 100;
                                productigvrate = 0;
                                productprice = elementproductsubtotal;
                                productnetprice = elementproductsubtotal;
                                productnetworth = Math.round(((elementproductquantity * elementproductsubtotal) + Number.EPSILON) * 100) / 100;
                            }

                            await genericfunctions.createInvoiceDetail(corpid, orgid, invoiceResponse.invoiceid, element.productdescription, "ACTIVO", "NINGUNO", elementproductquantity, element.productcode, producthasigv, "10", productigvtribute, element.productmeasure, producttotaligv, producttotalamount, productigvrate, productprice, element.productdescription, productnetprice, productnetworth, elementproductsubtotal, usr, responsedata.id);

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
                                productquantity: elementproductquantity,
                                productsubtotal: elementproductsubtotal,
                            });
                        }));

                        if (onlyinsert) {
                            responsedata = genericfunctions.changeResponseData(responsedata, null, null, "successful_register", 200, true);
                            return response.status(responsedata.status).json(responsedata);
                        }

                        var invoicecorrelative = null;
                        var documenttype = null;

                        if ((clientcountry === "PE") && (clientdoctype === "1" || clientdoctype === "4" || clientdoctype === "7")) {
                            invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "TICKET", responsedata.id);
                            documenttype = "03";
                        }
                        else {
                            invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "INVOICE", responsedata.id);
                            documenttype = "01";
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
                                    EnviarSunat: autosendinvoice ? true : false,
                                    FechaEmision: invoicecreatedate,
                                    MailEnvio: clientmail,
                                    MontoTotal: Math.round((invoicetotalcharge + Number.EPSILON) * 100) / 100,
                                    NombreComercialEmisor: appsetting.tradename,
                                    RazonSocialEmisor: appsetting.businessname,
                                    RazonSocialReceptor: clientbusinessname,
                                    CorrelativoDocumento: genericfunctions.padNumber(invoicecorrelative.p_correlative, 8),
                                    RucEmisor: appsetting.ruc,
                                    NumeroDocumentoReceptor: clientdocnumber,
                                    NumeroSerieDocumento: documenttype === "01" ? appsetting.invoiceserie : appsetting.ticketserie,
                                    RetornaPdf: appsetting.returnpdf,
                                    RetornaXmlSunat: appsetting.returnxmlsunat,
                                    RetornaXml: appsetting.returnxml,
                                    TipoCambio: invoicecurrency === "PEN" ? "1.000" : ((lastExchangeData?.exchangeratesol / lastExchangeData?.exchangerate) || 1),
                                    Token: appsetting.token,
                                    DireccionFiscalEmisor: appsetting.fiscaladdress,
                                    DireccionFiscalReceptor: clientfiscaladdress,
                                    VersionXml: appsetting.xmlversion,
                                    VersionUbl: appsetting.ublversion,
                                    Endpoint: appsetting.sunaturl,
                                    PaisRecepcion: clientcountry,
                                    CodigoOperacionSunat: clientcountry === "PE" ? appsetting.operationcodeperu : appsetting.operationcodeother,
                                    MontoTotalGravado: clientcountry === "PE" ? Math.round((invoicesubtotal + Number.EPSILON) * 100) / 100 : null,
                                    MontoTotalInafecto: clientcountry === "PE" ? "0" : Math.round((invoicesubtotal + Number.EPSILON) * 100) / 100,
                                    MontoTotalIgv: clientcountry === "PE" ? Math.round((invoicetaxes + Number.EPSILON) * 100) / 100 : null,
                                    ProductList: [],
                                    DataList: []
                                }

                                if (invoiceduedate) {
                                    invoicedata.FechaVencimiento = invoiceduedate;
                                }

                                if (clientcountry === "PE") {
                                    if (appsetting.detraction && appsetting.detractioncode && appsetting.detractionaccount && (appsetting.detractionminimum || appsetting.detractionminimum === 0)) {
                                        var compareamount = 0;

                                        if (appsetting.detractionminimum) {
                                            if (invoicecurrency !== "PEN") {
                                                compareamount = (invoicetotalcharge / (lastExchangeData?.exchangerate || 0) * (lastExchangeData?.exchangeratesol || 0));
                                            }
                                            else {
                                                compareamount = invoicetotalcharge;
                                            }
                                        }

                                        if (compareamount > appsetting.detractionminimum) {
                                            invoicedata.CodigoDetraccion = appsetting.detractioncode;
                                            invoicedata.CodigoOperacionSunat = "1001";
                                            invoicedata.MontoTotalDetraccion = Math.round(Math.round(((invoicetotalcharge * appsetting.detraction) + Number.EPSILON) * 100) / 100);
                                            invoicedata.MontoPendienteDetraccion = Math.round(((invoicedata.MontoTotal - (invoicedata.MontoTotalDetraccion || 0)) + Number.EPSILON) * 100) / 100;
                                            invoicedata.MontoTotalInafecto = null;
                                            invoicedata.NumeroCuentaDetraccion = appsetting.detractionaccount;
                                            invoicedata.PaisRecepcion = null;
                                            invoicedata.PorcentajeTotalDetraccion = appsetting.detraction * 100;

                                            var adicional02 = {
                                                CodigoDatoAdicional: "06",
                                                DescripcionDatoAdicional: "CUENTA DE DETRACCION: " + appsetting.detractionaccount
                                            }

                                            invoicedata.DataList.push(adicional02);
                                        }
                                    }
                                }

                                productinfo.forEach(async element => {
                                    var invoicedetaildata = {
                                        CantidadProducto: element.productquantity,
                                        CodigoProducto: element.productcode,
                                        TipoVenta: "10",
                                        UnidadMedida: element.productmeasure,
                                        IgvTotal: Math.round((element.producttotaligv + Number.EPSILON) * 100) / 100,
                                        MontoTotal: Math.round((element.producttotalamount + Number.EPSILON) * 100) / 100,
                                        TasaIgv: Math.round((element.productigvrate * 100) || 0),
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
                                    CodigoDatoAdicional: "05",
                                    DescripcionDatoAdicional: "FORMA DE PAGO: TRANSFERENCIA"
                                }

                                invoicedata.DataList.push(adicional01);

                                if (invoicepurchaseorder) {
                                    var adicional03 = {
                                        CodigoDatoAdicional: "15",
                                        DescripcionDatoAdicional: invoicepurchaseorder
                                    }

                                    invoicedata.DataList.push(adicional03);
                                }

                                if (invoicecomments) {
                                    var adicional04 = {
                                        CodigoDatoAdicional: "07",
                                        DescripcionDatoAdicional: invoicecomments
                                    }

                                    invoicedata.DataList.push(adicional04);
                                }

                                if (clientcredittype) {
                                    var adicional05 = {
                                        CodigoDatoAdicional: "01",
                                        DescripcionDatoAdicional: "AL CONTADO"
                                    }

                                    switch (clientcredittype) {
                                        case "typecredit_15":
                                            adicional05.DescripcionDatoAdicional = "CREDITO A 15 DIAS";
                                            break;
                                        case "typecredit_30":
                                            adicional05.DescripcionDatoAdicional = "CREDITO A 30 DIAS";
                                            break;
                                        case "typecredit_45":
                                            adicional05.DescripcionDatoAdicional = "CREDITO A 45 DIAS";
                                            break;
                                        case "typecredit_60":
                                            adicional05.DescripcionDatoAdicional = "CREDITO A 60 DIAS";
                                            break;
                                        case "typecredit_90":
                                            adicional05.DescripcionDatoAdicional = "CREDITO A 90 DIAS";
                                            break;
                                        case "typecredit_7":
                                            adicional05.DescripcionDatoAdicional = "CREDITO A 7 DIAS";
                                            break;
                                        case "typecredit_180":
                                            adicional05.DescripcionDatoAdicional = "CREDITO A 180 DIAS";
                                            break;
                                    }

                                    invoicedata.DataList.push(adicional05);

                                    if (adicional05) {
                                        if (adicional05.DescripcionDatoAdicional === "AL CONTADO") {
                                            invoicedata.FechaVencimiento = null;
                                        }
                                    }
                                }

                                if (appsetting?.invoiceprovider === "MIFACT") {
                                    const requestSendToSunat = await axiosObservable({
                                        data: invoicedata,
                                        method: "post",
                                        url: `${bridgeEndpoint}processmifact/sendinvoice`,
                                        _requestid: responsedata.id,
                                    });

                                    if (requestSendToSunat.data.result) {
                                        await genericfunctions.invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, "INVOICED", null, requestSendToSunat.data.result.cadenaCodigoQr, requestSendToSunat.data.result.codigoHash, requestSendToSunat.data.result.urlCdrSunat, requestSendToSunat.data.result.urlPdf, requestSendToSunat.data.result.urlXml, invoicedata.NumeroSerieDocumento, appsetting?.ruc || null, appsetting?.businessname || null, appsetting?.tradename || null, appsetting?.fiscaladdress || null, appsetting?.ubigeo || null, appsetting?.emittertype || null, appsetting?.annexcode || null, appsetting?.printingformat || null, autosendinvoice, appsetting?.returnpdf || null, appsetting?.returnxmlsunat || null, appsetting?.returnxml || null, appsetting?.token || null, appsetting?.sunaturl || null, appsetting?.sunatusername || null, appsetting?.xmlversion || null, appsetting?.ublversion || null, clientdoctype, clientdocnumber, clientbusinessname, clientfiscaladdress, clientcountry, clientmail, documenttype, invoicedata?.CodigoOperacionSunat || null, invoiceduedate, invoicepurchaseorder, invoicecomments, clientcredittype, appsetting?.detractioncode || null, appsetting?.detraction || null, appsetting?.detractionaccount, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);

                                        responsedata = genericfunctions.changeResponseData(responsedata, null, null, "successinvoiced", 200, true);
                                        return response.status(responsedata.status).json(responsedata);
                                    }
                                    else {
                                        await genericfunctions.invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, "ERROR", requestSendToSunat.data.operationMessage, null, null, null, null, null, null, appsetting?.ruc || null, appsetting?.businessname || null, appsetting?.tradename || null, appsetting?.fiscaladdress || null, appsetting?.ubigeo || null, appsetting?.emittertype || null, appsetting?.annexcode || null, appsetting?.printingformat || null, autosendinvoice, appsetting?.returnpdf || null, appsetting?.returnxmlsunat || null, appsetting?.returnxml || null, appsetting?.token || null, appsetting?.sunaturl || null, appsetting?.sunatusername || null, appsetting?.xmlversion || null, appsetting?.ublversion || null, clientdoctype, clientdocnumber, clientbusinessname, clientfiscaladdress, clientcountry, clientmail, documenttype, invoicedata?.CodigoOperacionSunat || null, invoiceduedate, invoicepurchaseorder, invoicecomments, clientcredittype, appsetting?.detractioncode || null, appsetting?.detraction || null, appsetting?.detractionaccount, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);

                                        if ((clientcountry === "PE") && (clientdoctype === "1" || clientdoctype === "4" || clientdoctype === "7")) {
                                            await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "TICKETERROR", responsedata.id);
                                        }
                                        else {
                                            await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "INVOICEERROR", responsedata.id);
                                        }

                                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "createdbutnotinvoiced", responsedata.status, responsedata.success);
                                        return response.status(responsedata.status).json(responsedata);
                                    }
                                }
                                else if (appsetting?.invoiceprovider === "SIIGO") {
                                    invoicedata.TipoDocumentoSiigo = "FV";
                                    invoicedata.TipoCambio = invoicecurrency === "COP" ? "1.000" : ((lastExchangeData?.exchangeratecop / lastExchangeData?.exchangerate) || 1);
                                    invoicedata.TipoPago = paymentmethod || "Tarjeta Débito";

                                    const corp = await genericfunctions.getCorporation(corpid, responsedata.id);
                                    const org = await genericfunctions.getOrganization(corpid, orgid, responsedata.id);

                                    invoicedata.CityCountry = corp.billbyorg ? org.countrycode : corp.countrycode;
                                    invoicedata.CityState = corp.billbyorg ? org.statecode : corp.statecode;
                                    invoicedata.CityCode = corp.billbyorg ? org.citycode : corp.citycode;

                                    const requestSendToSiigo = await axiosObservable({
                                        data: invoicedata,
                                        method: "post",
                                        url: `${bridgeEndpoint}processsiigo/sendinvoice`,
                                        _requestid: responsedata.id,
                                    });

                                    if (requestSendToSiigo.data.result) {
                                        let correlativeOverride = null;

                                        if (requestSendToSiigo.data.result.correlativoCpe) {
                                            correlativeOverride = parseInt(`${requestSendToSiigo.data.result.correlativoCpe}`);
                                        }

                                        await genericfunctions.invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, "INVOICED", null, requestSendToSiigo.data.result.cadenaCodigoQr, requestSendToSiigo.data.result.codigoHash, requestSendToSiigo.data.result.urlCdrSunat, requestSendToSiigo.data.result.urlPdf, requestSendToSiigo.data.result.urlXml, invoicedata.NumeroSerieDocumento, appsetting?.ruc || null, appsetting?.businessname || null, appsetting?.tradename || null, appsetting?.fiscaladdress || null, appsetting?.ubigeo || null, appsetting?.emittertype || null, appsetting?.annexcode || null, appsetting?.printingformat || null, autosendinvoice, appsetting?.returnpdf || null, appsetting?.returnxmlsunat || null, appsetting?.returnxml || null, appsetting?.token || null, appsetting?.sunaturl || null, appsetting?.sunatusername || null, appsetting?.xmlversion || null, appsetting?.ublversion || null, clientdoctype, clientdocnumber, clientbusinessname, clientfiscaladdress, clientcountry, clientmail, documenttype, invoicedata?.CodigoOperacionSunat || null, invoiceduedate, invoicepurchaseorder, invoicecomments, clientcredittype, appsetting?.detractioncode || null, appsetting?.detraction || null, appsetting?.detractionaccount, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, correlativeOverride, responsedata.id);

                                        responsedata = genericfunctions.changeResponseData(responsedata, null, null, "successinvoiced", 200, true);
                                        return response.status(responsedata.status).json(responsedata);
                                    }
                                    else {
                                        await genericfunctions.invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, "ERROR", requestSendToSiigo.data.operationMessage, null, null, null, null, null, null, appsetting?.ruc || null, appsetting?.businessname || null, appsetting?.tradename || null, appsetting?.fiscaladdress || null, appsetting?.ubigeo || null, appsetting?.emittertype || null, appsetting?.annexcode || null, appsetting?.printingformat || null, autosendinvoice, appsetting?.returnpdf || null, appsetting?.returnxmlsunat || null, appsetting?.returnxml || null, appsetting?.token || null, appsetting?.sunaturl || null, appsetting?.sunatusername || null, appsetting?.xmlversion || null, appsetting?.ublversion || null, clientdoctype, clientdocnumber, clientbusinessname, clientfiscaladdress, clientcountry, clientmail, documenttype, invoicedata?.CodigoOperacionSunat || null, invoiceduedate, invoicepurchaseorder, invoicecomments, clientcredittype, appsetting?.detractioncode || null, appsetting?.detraction || null, appsetting?.detractionaccount, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);

                                        if ((clientcountry === "PE") && (clientdoctype === "1" || clientdoctype === "4" || clientdoctype === "7")) {
                                            await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "TICKETERROR", responsedata.id);
                                        }
                                        else {
                                            await genericfunctions.getCorrelative(corpid, orgid, invoiceResponse.invoiceid, "INVOICEERROR", responsedata.id);
                                        }

                                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "createdbutnotinvoiced", responsedata.status, responsedata.success);
                                        return response.status(responsedata.status).json(responsedata);
                                    }
                                }
                            }
                            catch (exception) {
                                printException(exception, request.originalUrl, responsedata.id);

                                await genericfunctions.invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, "ERROR", exception.message, null, null, null, null, null, null, appsetting?.ruc || null, appsetting?.businessname || null, appsetting?.tradename || null, appsetting?.fiscaladdress || null, appsetting?.ubigeo || null, appsetting?.emittertype || null, appsetting?.annexcode || null, appsetting?.printingformat || null, autosendinvoice, appsetting?.returnpdf || null, appsetting?.returnxmlsunat || null, appsetting?.returnxml || null, appsetting?.token || null, appsetting?.sunaturl || null, appsetting?.sunatusername || null, appsetting?.xmlversion || null, appsetting?.ublversion || null, clientdoctype, clientdocnumber, clientbusinessname, clientfiscaladdress, clientcountry, clientmail, documenttype, null, invoiceduedate, invoicepurchaseorder, invoicecomments, clientcredittype, null, null, null, null, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);

                                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "createdbutnotinvoiced", responsedata.status, responsedata.success);
                                return response.status(responsedata.status).json(responsedata);
                            }
                        }
                        else {
                            await genericfunctions.invoiceSunat(corpid, orgid, invoiceResponse.invoiceid, "ERROR", "Correlative not found", null, null, null, null, null, null, appsetting?.ruc || null, appsetting?.businessname || null, appsetting?.tradename || null, appsetting?.fiscaladdress || null, appsetting?.ubigeo || null, appsetting?.emittertype || null, appsetting?.annexcode || null, appsetting?.printingformat || null, autosendinvoice, appsetting?.returnpdf || null, appsetting?.returnxmlsunat || null, appsetting?.returnxml || null, appsetting?.token || null, appsetting?.sunaturl || null, appsetting?.sunatusername || null, appsetting?.xmlversion || null, appsetting?.ublversion || null, clientdoctype, clientdocnumber, clientbusinessname, clientfiscaladdress, clientcountry, clientmail, documenttype, null, invoiceduedate, invoicepurchaseorder, invoicecomments, clientcredittype, null, null, null, null, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);

                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "correlativenotfound", responsedata.status, responsedata.success);
                            return response.status(responsedata.status).json(responsedata);
                        }
                    }
                    else {
                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "errorcreatinginvoice", responsedata.status, responsedata.success);
                        return response.status(responsedata.status).json(responsedata);
                    }
                }
                else {
                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "appsettingnotfound", responsedata.status, responsedata.success);
                    return response.status(responsedata.status).json(responsedata);
                }
            }
            else {
                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "productdetailnotfound", responsedata.status, responsedata.success);
                return response.status(responsedata.status).json(responsedata);
            }
        }
        else {
            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "corporationnotfound", responsedata.status, responsedata.success);
            return response.status(responsedata.status).json(responsedata);
        }
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
};

exports.emitInvoice = async (request, response) => {
    const { userid } = request.user;
    const { corpid, orgid, invoiceid, paymentmethod } = request.body;

    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var responsedata = genericfunctions.generateResponseData(request._requestid);

        const invoice = await genericfunctions.getInvoice(corpid, orgid, userid, invoiceid, responsedata.id);

        if (invoice) {
            if (invoice.invoicestatus !== "INVOICED") {
                const corp = await genericfunctions.getCorporation(corpid, responsedata.id);
                const org = await genericfunctions.getOrganization(corpid, orgid, responsedata.id);

                var correctcorrelative = false;
                var proceedpayment = false;
                var billbyorg = false;

                if (corp) {
                    if (corp.billbyorg) {
                        billbyorg = corp.billbyorg;

                        if (org) {
                            if (org.docnum && org.doctype && org.businessname && org.fiscaladdress && org.sunatcountry) {
                                if ((org.sunatcountry === "PE") && (org.doctype === "1" || org.doctype === "4" || org.doctype === "7")) {
                                    correctcorrelative = true;
                                }
                                else {
                                    correctcorrelative = true;
                                }

                                if (correctcorrelative) {
                                    proceedpayment = true;
                                }
                                else {
                                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "correlative not found", responsedata.status, responsedata.success);
                                    return response.status(responsedata.status).json(responsedata);
                                }
                            }
                            else {
                                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "incomplete organization", responsedata.status, responsedata.success);
                                return response.status(responsedata.status).json(responsedata);
                            }
                        }
                        else {
                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "incomplete organization", responsedata.status, responsedata.success);
                            return response.status(responsedata.status).json(responsedata);
                        }
                    }
                    else {
                        if (corp.docnum && corp.doctype && corp.businessname && corp.fiscaladdress && corp.sunatcountry) {
                            if ((corp.sunatcountry === "PE") && (corp.doctype === "1" || corp.doctype === "4" || corp.doctype === "7")) {
                                correctcorrelative = true;
                            }
                            else {
                                correctcorrelative = true;
                            }

                            if (correctcorrelative) {
                                proceedpayment = true;
                            }
                            else {
                                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "correlative not found", responsedata.status, responsedata.success);
                                return response.status(responsedata.status).json(responsedata);
                            }
                        }
                        else {
                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "incomplete corporation", responsedata.status, responsedata.success);
                            return response.status(responsedata.status).json(responsedata);
                        }
                    }

                    if (proceedpayment) {
                        const invoicedetail = await genericfunctions.getInvoiceDetail(corpid, orgid, userid, invoiceid, responsedata.id);
                        const appsetting = await genericfunctions.getAppSettingSingle(corpid, orgid, responsedata.id);

                        if (invoicedetail && appsetting) {
                            var invoicecorrelative = null;
                            var documenttype = null;

                            if (corp.billbyorg) {
                                if ((org.sunatcountry === "PE") && (org.doctype === "1" || org.doctype === "4" || org.doctype === "7")) {
                                    invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "TICKET", responsedata.id);
                                    documenttype = "03";
                                }
                                else {
                                    invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "INVOICE", responsedata.id);
                                    documenttype = "01";
                                }
                            }
                            else {
                                if ((corp.sunatcountry === "PE") && (corp.doctype === "1" || corp.doctype === "4" || corp.doctype === "7")) {
                                    invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "TICKET", responsedata.id);
                                    documenttype = "03";
                                }
                                else {
                                    invoicecorrelative = await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "INVOICE", responsedata.id);
                                    documenttype = "01";
                                }
                            }

                            if (invoicecorrelative) {
                                try {
                                    var exchangeratedata = await genericfunctions.getExchangeRate(invoice.currency, responsedata.id);

                                    var expirationDate;

                                    if (invoice.credittype) {
                                        var days = invoice.credittype.split("_")[1];
                                        if (days === "alcontado") {
                                            days = "0";
                                        }

                                        expirationDate = new Date(new Date().setDate(new Date(new Date(new Date().setHours(new Date().getHours() - 5)).toISOString().split("T")[0]).getDate() + (Number.parseFloat(days)))).toISOString().substring(0, 10);
                                    }

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
                                        FechaEmision: new Date(new Date().setHours(new Date().getHours() - 5)).toISOString().split("T")[0],
                                        FechaVencimiento: expirationDate,
                                        MailEnvio: billbyorg ? org.contactemail : corp.contactemail,
                                        MontoTotal: Math.round((invoice.totalamount + Number.EPSILON) * 100) / 100,
                                        NombreComercialEmisor: appsetting.tradename,
                                        RazonSocialEmisor: appsetting.businessname,
                                        RazonSocialReceptor: billbyorg ? org.businessname : corp.businessname,
                                        CorrelativoDocumento: genericfunctions.padNumber(invoicecorrelative.p_correlative, 8),
                                        RucEmisor: appsetting.ruc,
                                        NumeroDocumentoReceptor: billbyorg ? org.docnum : corp.docnum,
                                        NumeroSerieDocumento: documenttype === "01" ? appsetting.invoiceserie : appsetting.ticketserie,
                                        RetornaPdf: appsetting.returnpdf,
                                        RetornaXmlSunat: appsetting.returnxmlsunat,
                                        RetornaXml: appsetting.returnxml,
                                        TipoCambio: invoice.currency === "PEN" ? "1.000" : ((exchangeratedata?.exchangeratesol / exchangeratedata?.exchangerate) || invoice.exchangerate),
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
                                        invoicedata.CodigoOperacionSunat = org.sunatcountry === "PE" ? appsetting.operationcodeperu : appsetting.operationcodeother;
                                        invoicedata.MontoTotalGravado = org.sunatcountry === "PE" ? Math.round((invoice.subtotal + Number.EPSILON) * 100) / 100 : null;
                                        invoicedata.MontoTotalInafecto = org.sunatcountry === "PE" ? "0" : Math.round((invoice.subtotal + Number.EPSILON) * 100) / 100;
                                        invoicedata.MontoTotalIgv = org.sunatcountry === "PE" ? Math.round((invoice.taxes + Number.EPSILON) * 100) / 100 : null;
                                    }
                                    else {
                                        invoicedata.CodigoOperacionSunat = corp.sunatcountry === "PE" ? appsetting.operationcodeperu : appsetting.operationcodeother;
                                        invoicedata.MontoTotalGravado = corp.sunatcountry === "PE" ? Math.round((invoice.subtotal + Number.EPSILON) * 100) / 100 : null;
                                        invoicedata.MontoTotalInafecto = corp.sunatcountry === "PE" ? "0" : Math.round((invoice.subtotal + Number.EPSILON) * 100) / 100;
                                        invoicedata.MontoTotalIgv = corp.sunatcountry === "PE" ? Math.round((invoice.taxes + Number.EPSILON) * 100) / 100 : null;
                                    }

                                    var calcdetraction = false;

                                    if (corp.billbyorg) {
                                        if (org.sunatcountry === "PE") {
                                            calcdetraction = true;
                                        }
                                    }
                                    else {
                                        if (corp.sunatcountry === "PE") {
                                            calcdetraction = true;
                                        }
                                    }

                                    if (calcdetraction) {
                                        if (appsetting.detraction && appsetting.detractioncode && appsetting.detractionaccount && (appsetting.detractionminimum || appsetting.detractionminimum === 0)) {
                                            var compareamount = 0;

                                            if (appsetting.detractionminimum) {
                                                if (invoice.currency !== "PEN") {
                                                    if (exchangeratedata) {
                                                        compareamount = (invoice.totalamount / (exchangeratedata?.exchangerate || 0) * (exchangeratedata?.exchangeratesol || 0));
                                                    }
                                                }
                                                else {
                                                    compareamount = invoice.totalamount;
                                                }
                                            }

                                            if (compareamount > appsetting.detractionminimum) {
                                                invoicedata.CodigoDetraccion = appsetting.detractioncode;
                                                invoicedata.CodigoOperacionSunat = "1001";
                                                invoicedata.MontoTotalDetraccion = Math.round(Math.round(((invoice.totalamount * appsetting.detraction) + Number.EPSILON) * 100) / 100);
                                                invoicedata.MontoPendienteDetraccion = Math.round(((invoicedata.MontoTotal - (invoicedata.MontoTotalDetraccion || 0)) + Number.EPSILON) * 100) / 100;
                                                invoicedata.MontoTotalInafecto = null;
                                                invoicedata.NumeroCuentaDetraccion = appsetting.detractionaccount;
                                                invoicedata.PaisRecepcion = null;
                                                invoicedata.PorcentajeTotalDetraccion = appsetting.detraction * 100;

                                                var adicional02 = {
                                                    CodigoDatoAdicional: "06",
                                                    DescripcionDatoAdicional: "CUENTA DE DETRACCION: " + appsetting.detractionaccount
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
                                            TasaIgv: Math.round((data.igvrate * 100) || 0),
                                            PrecioProducto: Math.round((data.productprice + Number.EPSILON) * 100) / 100,
                                            DescripcionProducto: data.productdescription,
                                            PrecioNetoProducto: Math.round((data.productnetprice + Number.EPSILON) * 100) / 100,
                                            ValorNetoProducto: Math.round(((data.quantity * data.productnetprice) + Number.EPSILON) * 100) / 100,
                                        };

                                        if (corp.billbyorg) {
                                            invoicedetaildata.AfectadoIgv = org.sunatcountry === "PE" ? "10" : "40";
                                            invoicedetaildata.TributoIgv = org.sunatcountry === "PE" ? "1000" : "9998";
                                        }
                                        else {
                                            invoicedetaildata.AfectadoIgv = corp.sunatcountry === "PE" ? "10" : "40";
                                            invoicedetaildata.TributoIgv = corp.sunatcountry === "PE" ? "1000" : "9998";
                                        }

                                        invoicedata.ProductList.push(invoicedetaildata);
                                    });

                                    if (invoice.purchaseorder) {
                                        var adicional03 = {
                                            CodigoDatoAdicional: "15",
                                            DescripcionDatoAdicional: invoice.purchaseorder
                                        }

                                        invoicedata.DataList.push(adicional03);
                                    }

                                    if (invoice.comments) {
                                        var adicional04 = {
                                            CodigoDatoAdicional: "07",
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
                                            CodigoDatoAdicional: "01",
                                            DescripcionDatoAdicional: days === "0" ? "AL CONTADO" : `CREDITO A ${days} DIAS`
                                        }

                                        invoicedata.DataList.push(adicional05);

                                        if (adicional05) {
                                            if (adicional05.DescripcionDatoAdicional === "AL CONTADO") {
                                                invoicedata.FechaVencimiento = null;
                                            }
                                        }
                                    }

                                    if (appsetting?.invoiceprovider === "MIFACT") {
                                        const requestSendToSunat = await axiosObservable({
                                            data: invoicedata,
                                            method: "post",
                                            url: `${bridgeEndpoint}processmifact/sendinvoice`,
                                            _requestid: responsedata.id,
                                        });

                                        if (requestSendToSunat.data.result) {
                                            await genericfunctions.invoiceSunat(corpid, orgid, invoiceid, "INVOICED", null, requestSendToSunat.data.result.cadenaCodigoQr, requestSendToSunat.data.result.codigoHash, requestSendToSunat.data.result.urlCdrSunat, requestSendToSunat.data.result.urlPdf, requestSendToSunat.data.result.urlXml, invoicedata.NumeroSerieDocumento, appsetting?.ruc || null, appsetting?.businessname || null, appsetting?.tradename || null, appsetting?.fiscaladdress || null, appsetting?.ubigeo || null, appsetting?.emittertype || null, appsetting?.annexcode || null, appsetting?.printingformat || null, invoicedata?.EnviarSunat || null, appsetting?.returnpdf || null, appsetting?.returnxmlsunat || null, appsetting?.returnxml || null, appsetting?.token || null, appsetting?.sunaturl || null, appsetting?.sunatusername || null, appsetting?.xmlversion || null, appsetting?.ublversion || null, invoicedata?.CodigoRucReceptor || null, invoicedata?.NumeroDocumentoReceptor || null, invoicedata?.RazonSocialReceptor || null, invoicedata?.DireccionFiscalReceptor || null, invoicedata?.PaisRecepcion || null, invoicedata?.MailEnvio || null, documenttype || null, invoicedata?.CodigoOperacionSunat || null, invoicedata?.FechaVencimiento || null, invoice.purchaseorder || null, invoice.comments || null, invoice.credittype || null, appsetting?.detractioncode || null, appsetting?.detraction || null, appsetting?.detractionaccount, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);

                                            responsedata = genericfunctions.changeResponseData(responsedata, null, requestSendToSunat.data.result, "successinvoiced", 200, true);
                                            return response.status(responsedata.status).json(responsedata);
                                        }
                                        else {
                                            await genericfunctions.invoiceSunat(corpid, orgid, invoiceid, "ERROR", requestSendToSunat.data.operationMessage, null, null, null, null, null, null, appsetting?.ruc || null, appsetting?.businessname || null, appsetting?.tradename || null, appsetting?.fiscaladdress || null, appsetting?.ubigeo || null, appsetting?.emittertype || null, appsetting?.annexcode || null, appsetting?.printingformat || null, invoicedata?.EnviarSunat || null, appsetting?.returnpdf || null, appsetting?.returnxmlsunat || null, appsetting?.returnxml || null, appsetting?.token || null, appsetting?.sunaturl || null, appsetting?.sunatusername || null, appsetting?.xmlversion || null, appsetting?.ublversion || null, invoicedata?.CodigoRucReceptor || null, invoicedata?.NumeroDocumentoReceptor || null, invoicedata?.RazonSocialReceptor || null, invoicedata?.DireccionFiscalReceptor || null, invoicedata?.PaisRecepcion || null, invoicedata?.MailEnvio || null, documenttype || null, invoicedata?.CodigoOperacionSunat || null, invoicedata?.FechaVencimiento || null, invoice.purchaseorder || null, invoice.comments || null, invoice.credittype || null, appsetting?.detractioncode || null, appsetting?.detraction || null, appsetting?.detractionaccount, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);

                                            if (corp.billbyorg) {
                                                if ((org.sunatcountry === "PE") && (org.doctype === "1" || org.doctype === "4" || org.doctype === "7")) {
                                                    await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "TICKETERROR", responsedata.id);
                                                }
                                                else {
                                                    await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "INVOICEERROR", responsedata.id);
                                                }
                                            }
                                            else {
                                                if ((corp.sunatcountry === "PE") && (corp.doctype === "1" || corp.doctype === "4" || corp.doctype === "7")) {
                                                    await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "TICKETERROR", responsedata.id);
                                                }
                                                else {
                                                    await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "INVOICEERROR", responsedata.id);
                                                }
                                            }

                                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, requestSendToSunat.data.operationMessage || "invoicing error", responsedata.status, responsedata.success);
                                            return response.status(responsedata.status).json(responsedata);
                                        }
                                    }
                                    else if (appsetting?.invoiceprovider === "SIIGO") {
                                        invoicedata.TipoDocumentoSiigo = "FV";
                                        invoicedata.TipoCambio = invoice.currency === "COP" ? "1.000" : ((exchangeratedata?.exchangeratecop / exchangeratedata?.exchangerate) || invoice.exchangerate);
                                        invoicedata.TipoPago = paymentmethod || "Tarjeta Débito";
                                        invoicedata.CityCountry = corp.billbyorg ? org.countrycode : corp.countrycode;
                                        invoicedata.CityState = corp.billbyorg ? org.statecode : corp.statecode;
                                        invoicedata.CityCode = corp.billbyorg ? org.citycode : corp.citycode;

                                        const requestSendToSiigo = await axiosObservable({
                                            data: invoicedata,
                                            method: "post",
                                            url: `${bridgeEndpoint}processsiigo/sendinvoice`,
                                            _requestid: responsedata.id,
                                        });

                                        if (requestSendToSiigo.data.result) {
                                            let correlativeOverride = null;

                                            if (requestSendToSiigo.data.result.correlativoCpe) {
                                                correlativeOverride = parseInt(`${requestSendToSiigo.data.result.correlativoCpe}`);
                                            }

                                            await genericfunctions.invoiceSunat(corpid, orgid, invoiceid, "INVOICED", null, requestSendToSiigo.data.result.cadenaCodigoQr, requestSendToSiigo.data.result.codigoHash, requestSendToSiigo.data.result.urlCdrSunat, requestSendToSiigo.data.result.urlPdf, requestSendToSiigo.data.result.urlXml, invoicedata.NumeroSerieDocumento, appsetting?.ruc || null, appsetting?.businessname || null, appsetting?.tradename || null, appsetting?.fiscaladdress || null, appsetting?.ubigeo || null, appsetting?.emittertype || null, appsetting?.annexcode || null, appsetting?.printingformat || null, invoicedata?.EnviarSunat || null, appsetting?.returnpdf || null, appsetting?.returnxmlsunat || null, appsetting?.returnxml || null, appsetting?.token || null, appsetting?.sunaturl || null, appsetting?.sunatusername || null, appsetting?.xmlversion || null, appsetting?.ublversion || null, invoicedata?.CodigoRucReceptor || null, invoicedata?.NumeroDocumentoReceptor || null, invoicedata?.RazonSocialReceptor || null, invoicedata?.DireccionFiscalReceptor || null, invoicedata?.PaisRecepcion || null, invoicedata?.MailEnvio || null, documenttype || null, invoicedata?.CodigoOperacionSunat || null, invoicedata?.FechaVencimiento || null, invoice.purchaseorder || null, invoice.comments || null, invoice.credittype || null, appsetting?.detractioncode || null, appsetting?.detraction || null, appsetting?.detractionaccount, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, correlativeOverride, responsedata.id);

                                            responsedata = genericfunctions.changeResponseData(responsedata, null, requestSendToSiigo.data.result, "successinvoiced", 200, true);
                                            return response.status(responsedata.status).json(responsedata);
                                        }
                                        else {
                                            await genericfunctions.invoiceSunat(corpid, orgid, invoiceid, "ERROR", requestSendToSiigo.data.operationMessage, null, null, null, null, null, null, appsetting?.ruc || null, appsetting?.businessname || null, appsetting?.tradename || null, appsetting?.fiscaladdress || null, appsetting?.ubigeo || null, appsetting?.emittertype || null, appsetting?.annexcode || null, appsetting?.printingformat || null, invoicedata?.EnviarSunat || null, appsetting?.returnpdf || null, appsetting?.returnxmlsunat || null, appsetting?.returnxml || null, appsetting?.token || null, appsetting?.sunaturl || null, appsetting?.sunatusername || null, appsetting?.xmlversion || null, appsetting?.ublversion || null, invoicedata?.CodigoRucReceptor || null, invoicedata?.NumeroDocumentoReceptor || null, invoicedata?.RazonSocialReceptor || null, invoicedata?.DireccionFiscalReceptor || null, invoicedata?.PaisRecepcion || null, invoicedata?.MailEnvio || null, documenttype || null, invoicedata?.CodigoOperacionSunat || null, invoicedata?.FechaVencimiento || null, invoice.purchaseorder || null, invoice.comments || null, invoice.credittype || null, appsetting?.detractioncode || null, appsetting?.detraction || null, appsetting?.detractionaccount, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);

                                            if (corp.billbyorg) {
                                                if ((org.sunatcountry === "PE") && (org.doctype === "1" || org.doctype === "4" || org.doctype === "7")) {
                                                    await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "TICKETERROR", responsedata.id);
                                                }
                                                else {
                                                    await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "INVOICEERROR", responsedata.id);
                                                }
                                            }
                                            else {
                                                if ((corp.sunatcountry === "PE") && (corp.doctype === "1" || corp.doctype === "4" || corp.doctype === "7")) {
                                                    await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "TICKETERROR", responsedata.id);
                                                }
                                                else {
                                                    await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "INVOICEERROR", responsedata.id);
                                                }
                                            }

                                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, requestSendToSiigo.data.operationMessage || "invoicing error", responsedata.status, responsedata.success);
                                            return response.status(responsedata.status).json(responsedata);
                                        }
                                    }
                                }
                                catch (exception) {
                                    printException(exception, request.originalUrl, responsedata.id);

                                    await genericfunctions.invoiceSunat(corpid, orgid, invoiceid, "ERROR", exception.message, null, null, null, null, null, null, appsetting.ruc, appsetting.businessname, appsetting.tradename, appsetting.fiscaladdress, appsetting.ubigeo, appsetting.emittertype, appsetting.annexcode, appsetting.printingformat, appsetting.sendtosunat, appsetting.returnpdf, appsetting.returnxmlsunat, appsetting.returnxml, appsetting.token, appsetting.sunaturl, appsetting.sunatusername, appsetting.xmlversion, appsetting.ublversion, billbyorg ? org.doctype : corp.doctype, billbyorg ? org.docnum : corp.docnum, billbyorg ? org.businessname : corp.businessname, billbyorg ? org.fiscaladdress : corp.fiscaladdress, billbyorg ? org.sunatcountry : corp.sunatcountry, billbyorg ? org.contactemail : corp.contactemail, documenttype, null, null, invoice.purchaseorder, invoice.comments, invoice.credittype, null, null, null, null, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);

                                    if (corp.billbyorg) {
                                        if ((org.sunatcountry === "PE") && (org.doctype === "1" || org.doctype === "4" || org.doctype === "7")) {
                                            await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "TICKETERROR", responsedata.id);
                                        }
                                        else {
                                            await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "INVOICEERROR", responsedata.id);
                                        }
                                    }
                                    else {
                                        if ((corp.sunatcountry === "PE") && (corp.doctype === "1" || corp.doctype === "4" || corp.doctype === "7")) {
                                            await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "TICKETERROR", responsedata.id);
                                        }
                                        else {
                                            await genericfunctions.getCorrelative(corpid, orgid, invoiceid, "INVOICEERROR", responsedata.id);
                                        }
                                    }

                                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "general exception", responsedata.status, responsedata.success);
                                    return response.status(responsedata.status).json(responsedata);
                                }
                            }
                            else {
                                await genericfunctions.invoiceSunat(corpid, orgid, invoiceid, "ERROR", "Correlative not found", null, null, null, null, null, null, appsetting.ruc, appsetting.businessname, appsetting.tradename, appsetting.fiscaladdress, appsetting.ubigeo, appsetting.emittertype, appsetting.annexcode, appsetting.printingformat, appsetting.sendtosunat, appsetting.returnpdf, appsetting.returnxmlsunat, appsetting.returnxml, appsetting.token, appsetting.sunaturl, appsetting.sunatusername, appsetting.xmlversion, appsetting.ublversion, billbyorg ? org.doctype : corp.doctype, billbyorg ? org.docnum : corp.docnum, billbyorg ? org.businessname : corp.businessname, billbyorg ? org.fiscaladdress : corp.fiscaladdress, billbyorg ? org.sunatcountry : corp.sunatcountry, billbyorg ? org.contactemail : corp.contactemail, documenttype, null, null, invoice.purchaseorder, invoice.comments, invoice.credittype, null, null, null, null, appsetting.location, appsetting.invoiceprovider, null, responsedata.id);

                                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "correlative not found", responsedata.status, responsedata.success);
                                return response.status(responsedata.status).json(responsedata);
                            }
                        }
                        else {
                            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "no product details", responsedata.status, responsedata.success);
                            return response.status(responsedata.status).json(responsedata);
                        }
                    }
                    else {
                        responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "incomplete payment card information", responsedata.status, responsedata.success);
                        return response.status(responsedata.status).json(responsedata);
                    }
                }
                else {
                    responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "corporation not found", responsedata.status, responsedata.success);
                    return response.status(responsedata.status).json(responsedata);
                }
            }
            else {
                responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "invoice already sent", responsedata.status, responsedata.success);
                return response.status(responsedata.status).json(responsedata);
            }
        }
        else {
            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, "invoice not found", responsedata.status, responsedata.success);
            return response.status(responsedata.status).json(responsedata);
        }
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
}

exports.getExchangeRate = async (request, response) => {
    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var responsedata = genericfunctions.generateResponseData(request._requestid);

        var lastExchangeData = await genericfunctions.getExchangeRate(request?.body?.code || "USD", responsedata.id);
        var lastExchange = lastExchangeData?.exchangerate || 0;
        var lastExchangeSol = lastExchangeData?.exchangeratesol || 0;
        var lastExchangeCop = lastExchangeData?.exchangeratecop || 0;

        if (lastExchange) {
            responsedata = genericfunctions.changeResponseData(responsedata, null, {}, "success", 200, true);
            responsedata.exchangerate = lastExchange;
            responsedata.exchangeratesol = lastExchangeSol;
            responsedata.exchangeratecop = lastExchangeCop;
        }
        else {
            responsedata = genericfunctions.changeResponseData(responsedata, null, {}, "error", 400, false);
            responsedata.exchangerate = lastExchange;
            responsedata.exchangeratesol = lastExchangeSol;
            responsedata.exchangeratecop = lastExchangeCop;
        }

        return response.status(responsedata.status).json(responsedata);
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
};

exports.regularizeInvoice = async (request, response) => {
    const { userid, usr } = request.user;
    const { corpid, orgid, invoiceid, invoicereferencefile, invoicepaymentnote, invoicepaymentcommentary } = request.body;

    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var responsedata = genericfunctions.generateResponseData(request._requestid);

        await genericfunctions.changeInvoicePayment(corpid, orgid, invoiceid, "PAID", invoicepaymentnote, invoicereferencefile, invoicepaymentcommentary, usr, responsedata.id);

        responsedata = genericfunctions.changeResponseData(responsedata, null, { message: "finished process" }, "success", 200, true);
        return response.status(responsedata.status).json(responsedata);
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
};