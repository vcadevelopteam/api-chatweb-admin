const { axiosObservable, getErrorCode, setSessionParameters } = require("../config/helpers");

const cryptojs = require("crypto-js");
const bcryptjs = require("bcryptjs");

const triggerfunctions = require("../config/triggerfunctions");
const genericfunctions = require("../config/genericfunctions");

const bridgeEndpoint = process.env.BRIDGE;
const laraigoEndpoint = process.env.LARAIGO;
const userSecret = process.env.USERSECRET;

exports.activateUser = async (request, response) => {
    try {
        let requestCode = "error_unexpected_error";
        let requestMessage = "error_unexpected_error";
        let requestStatus = 400;
        let requestSuccess = false;

        if (request.body) {
            let userCode = request.body.userCode;

            userCode = userCode.split("_EQUAL_").join("=");
            userCode = userCode.split("_PLUS_").join("+");
            userCode = userCode.split("_SLASH_").join("/");

            let userData = JSON.parse(cryptojs.AES.decrypt(userCode, userSecret).toString(cryptojs.enc.Utf8));

            let userParameters = {
                _requestid: request._requestid,
                corpid: userData.corpid,
                userid: userData.userid,
            };

            const queryActivateUser = await triggerfunctions.executesimpletransaction(
                "UFN_USER_ACTIVATE",
                userParameters
            );

            if (queryActivateUser instanceof Array) {
                requestCode = "";
                requestMessage = "";
                requestStatus = 200;

                if (queryActivateUser.length > 0) {
                    requestSuccess = true;
                }
            } else {
                requestCode = queryActivateUser.code;
            }
        }

        return response.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
};

exports.changePassword = async (request, response) => {
    try {
        let requestCode = "error_unexpected_error";
        let requestMessage = "error_unexpected_error";
        let requestStatus = 400;
        let requestSuccess = false;

        if (request.body) {
            let userToken = request.body.token;

            userToken = userToken.split("_EQUAL_").join("=");
            userToken = userToken.split("_PLUS_").join("+");
            userToken = userToken.split("_SLASH_").join("/");

            let userData = JSON.parse(cryptojs.AES.decrypt(userToken, userSecret).toString(cryptojs.enc.Utf8));

            if (userData.userid) {
                let dateDifference = Math.abs(new Date().getTime() - new Date(userData.date).getTime()) / 3600000;

                if (dateDifference <= 24) {
                    let passwordParameters = {
                        _requestid: request._requestid,
                        password: await bcryptjs.hash(request.body.password, await bcryptjs.genSalt(10)),
                        userid: userData.userid,
                    };

                    const queryUpdatePassword = await triggerfunctions.executesimpletransaction(
                        "UFN_USERPASSWORD_UPDATE",
                        passwordParameters
                    );

                    if (queryUpdatePassword instanceof Array) {
                        requestCode = "";
                        requestMessage = "";
                        requestStatus = 200;
                        requestSuccess = true;
                    } else {
                        requestCode = queryUpdatePassword.code;
                    }
                } else {
                    requestMessage = "recoverpassword_expired";
                }
            }
        }

        return response.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
};

exports.countryList = async (request, response) => {
    try {
        let requestCode = "error_unexpected_error";
        let requestData = null;
        let requestMessage = "error_unexpected_error";
        let requestStatus = 400;
        let requestSuccess = false;

        const queryCountryGet = await triggerfunctions.executesimpletransaction("UFN_COUNTRY_SEL", {
            _requestid: request._requestid,
        });

        if (queryCountryGet instanceof Array) {
            requestCode = "";
            requestData = queryCountryGet;
            requestMessage = "";
            requestStatus = 200;
            requestSuccess = true;
        } else {
            requestCode = queryCountryGet.code;
        }

        return response.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
};

exports.createSubscription = async (request, response) => {
    try {
        let requestCode = "error_unexpected_error";
        let requestMessage = "error_unexpected_error";
        let requestStatus = 400;
        let requestSuccess = false;

        if (request.body) {
            let { card = {}, parameters = {} } = request.body;

            let paymentcarddata = null;
            let paymentcarderror = false;

            let cardfirstname = null;
            let cardlastname = null;

            let appsetting = null;

            let isCulqi = false;

            let billinglocation = null;
            let billingtax = null;

            if (card) {
                if (parameters.contactcountry === "CO") {
                    appsetting = await genericfunctions.getAppSettingLocation("LARAIGO COLOMBIA", request._requestid);

                    billinglocation = "LARAIGO COLOMBIA";
                    billingtax = 0.19;
                }
                else {
                    appsetting = await genericfunctions.getAppSettingLocation("VCA", request._requestid);

                    billinglocation = "VCA";

                    if (parameters.contactcountry === "PE") {
                        billingtax = 0.18;
                    }
                    else {
                        billingtax = 0;
                    }
                }

                if (appsetting) {
                    cardfirstname = `${card.cardname}`.split(/\s(.+)/)[0];
                    cardlastname = `${card.cardname}`.split(/\s(.+)/)[1];

                    card.cardnumber = card.cardnumber.split(" ").join("");

                    if (appsetting.paymentprovider === "CULQI") {
                        isCulqi = true;

                        const requestCulqiCreateClient = await axiosObservable({
                            data: {
                                address: `${genericfunctions.removeSpecialCharacter(parameters.contactaddress || "EMPTY").slice(0, 100)}`,
                                addressCity: `${genericfunctions.removeSpecialCharacter(parameters.timezone || "EMPTY").slice(0, 30)}`,
                                bearer: appsetting.privatekey,
                                countryCode: `${parameters.contactcountry || "PE"}`,
                                email: `${parameters.contactmail || "generic@mail.com"}`,
                                firstName: `${genericfunctions.removeSpecialCharacter(
                                    (cardfirstname || "").replace(/[0-9]/g, "") || "EMPTY"
                                ).slice(0, 50)}`,
                                lastName: `${genericfunctions.removeSpecialCharacter(
                                    (cardlastname || "").replace(/[0-9]/g, "") || "EMPTY"
                                ).slice(0, 50)}`,
                                operation: "CREATE",
                                phoneNumber: `${(parameters.contactphone
                                    ? parameters.contactphone.replace(/[^0-9]/g, "")
                                    : "51999999999"
                                ).slice(0, 15)}`,
                                url: appsetting.culqiurlclient,
                            },
                            method: "post",
                            url: `${bridgeEndpoint}processculqi/handleclient`,
                            _requestid: request._requestid,
                        });

                        if (requestCulqiCreateClient.data.success) {
                            const requestCulqiCreateCard = await axiosObservable({
                                data: {
                                    bearer: appsetting.privatekey,
                                    bearerToken: appsetting.publickey,
                                    cardNumber: card.cardnumber,
                                    customerId: requestCulqiCreateClient.data.result.id,
                                    cvv: card.cardsecuritycode,
                                    email: `${parameters.contactmail || "generic@mail.com"}`,
                                    expirationMonth: card.cardmonth,
                                    expirationYear: card.cardyear,
                                    operation: "CREATE",
                                    url: appsetting.culqiurlcardcreate,
                                    urlToken: appsetting.culqiurltoken,
                                },
                                method: "post",
                                url: `${bridgeEndpoint}processculqi/handlecard`,
                                _requestid: request._requestid,
                            });

                            if (requestCulqiCreateCard.data.success) {
                                paymentcarddata = requestCulqiCreateCard.data.result;
                            } else {
                                paymentcarderror = true;
                                requestMessage = genericfunctions.getCulqiError(requestCulqiCreateCard?.data?.operationMessage) || "error_card_client";
                            }
                        } else {
                            paymentcarderror = true;
                            requestMessage = genericfunctions.getCulqiError(requestCulqiCreateClient?.data?.operationMessage) || "error_card_client";
                        }
                    }
                    else if (appsetting.paymentprovider === "OPENPAY COLOMBIA") {
                        const requestOpenpayCreateClient = await axiosObservable({
                            data: {
                                address: `${(genericfunctions.removeSpecialCharacter(parameters.contactaddress || "EMPTY")).slice(0, 100)}`,
                                addressCity: `${(genericfunctions.removeSpecialCharacter(parameters.timezone || "EMPTY")).slice(0, 30)}`,
                                countryCode: `${(parameters.contactcountry || "PE")}`,
                                email: `${(parameters.contactmail || "generic@mail.com")}`,
                                firstName: `${(genericfunctions.removeSpecialCharacter((cardfirstname || "").replace(/[0-9]/g, "") || "EMPTY")).slice(0, 50)}`,
                                lastName: `${(genericfunctions.removeSpecialCharacter((cardlastname || "").replace(/[0-9]/g, "") || "EMPTY")).slice(0, 50)}`,
                                merchantId: appsetting.culqiurl,
                                operation: "CREATE",
                                phoneNumber: `${(parameters.contactphone ? parameters.contactphone.replace(/[^0-9]/g, "") : "51999999999").slice(0, 15)}`,
                                secretKey: appsetting.privatekey,
                                url: appsetting.culqiurlclient,
                            },
                            method: "post",
                            url: `${bridgeEndpoint}processopenpay/handleclient`,
                            _requestid: request._requestid,
                        });

                        if (requestOpenpayCreateClient.data.success) {
                            const requestOpenpayCreateCard = await axiosObservable({
                                data: {
                                    cardNumber: card.cardnumber,
                                    customerId: requestOpenpayCreateClient.data.result.id,
                                    cvv: card.cardsecuritycode,
                                    email: `${(parameters.contactmail || "generic@mail.com")}`,
                                    expirationMonth: card.cardmonth,
                                    expirationYear: `${card.cardyear}`.slice(-2),
                                    merchantId: appsetting.culqiurl,
                                    operation: "CREATE",
                                    secretKey: appsetting.privatekey,
                                    url: appsetting.culqiurlcardcreate,
                                },
                                method: "post",
                                url: `${bridgeEndpoint}processopenpay/handlecard`,
                                _requestid: request._requestid,
                            });

                            if (requestOpenpayCreateCard.data.success) {
                                paymentcarddata = requestOpenpayCreateCard.data.result;
                                paymentcarddata.customerId = requestOpenpayCreateClient.data.result.id;
                            } else {
                                paymentcarderror = true;
                                requestMessage = "error_card_card";

                                if (requestOpenpayCreateCard.data.operationMessage) {
                                    requestMessage = requestOpenpayCreateCard.data.operationMessage;
                                }
                            }
                        }
                        else {
                            paymentcarderror = true;
                            requestMessage = "error_card_client";

                            if (requestOpenpayCreateClient.data.operationMessage) {
                                requestMessage = requestOpenpayCreateClient.data.operationMessage;
                            }
                        }
                    }
                    else {
                        paymentcarderror = true;
                        requestMessage = "error_card_configuration";
                    }
                } else {
                    paymentcarderror = true;
                    requestMessage = "error_card_configuration";
                }
            } else {
                paymentcarderror = true;
                requestMessage = "error_card_missing";
            }

            if (paymentcarderror) {
                return response.status(requestStatus).json({
                    code: requestCode,
                    error: !requestSuccess,
                    message: requestMessage,
                    success: requestSuccess,
                });
            }

            let currentdate = genericfunctions.convertToUtc(new Date());

            let paymentperioddata = null;
            let paymentperiodtype = null;
            let paymentperioderror = false;

            let daycurrent = currentdate.getDate();

            let paymentsubtotal = 0;
            let paymenttaxes = 0;
            let paymenttotal = 0;

            if (card && paymentcarddata && parameters.paymentplan) {
                let currentPlanCost = null;

                const queryPlanGet = await triggerfunctions.executesimpletransaction("GET_CONTRACT", {
                    code: parameters.paymentplan,
                });

                if (queryPlanGet instanceof Array) {
                    if (queryPlanGet[0]) {
                        if (queryPlanGet[0].plancost) {
                            currentPlanCost = parseFloat(`${queryPlanGet[0].plancost}`);
                        }
                    }
                }

                if (currentPlanCost) {
                    if (parameters.timezoneoffset > 0 || parameters.timezoneoffset < 0) {
                        currentdate.setHours(currentdate.getHours() + parameters.timezoneoffset);
                    }

                    let daylast = new Date(currentdate.getFullYear(), currentdate.getMonth() + 1, 0).getDate();
                    let daydifference = daylast - daycurrent + 1;

                    paymentsubtotal = Math.round((((currentPlanCost * daydifference) / daylast) + Number.EPSILON) * 100) / 100;
                    paymenttaxes = Math.round(((paymentsubtotal * billingtax) + Number.EPSILON) * 100) / 100;
                    paymenttotal = Math.round(((paymentsubtotal + paymenttaxes) + Number.EPSILON) * 100) / 100;

                    if (appsetting.paymentprovider === "CULQI") {
                        const requestCulqiCharge = await axiosObservable({
                            data: {
                                amount: Math.round((paymenttotal * 100 + Number.EPSILON) * 100) / 100,
                                bearer: appsetting.privatekey,
                                description: (genericfunctions.removeSpecialCharacter(`Laraigo Subscription for ${parameters.contactdocumentnumber}`)).slice(0, 80),
                                currencyCode: "USD",
                                email: `${(parameters.contactmail || "generic@mail.com")}`,
                                sourceId: paymentcarddata.id,
                                operation: "CREATE",
                                url: appsetting.culqiurlcharge,
                                metadata: {
                                    companydocument: genericfunctions.removeSpecialCharacter(parameters.companydocument || ""),
                                    companyname: genericfunctions.removeSpecialCharacter(parameters.companyname || ""),
                                    paymentplan: genericfunctions.removeSpecialCharacter(parameters.paymentplan || ""),
                                    paymenttype: "SUBSCRIPTION",
                                    personcountry: genericfunctions.removeSpecialCharacter(parameters.contactcountryname || ""),
                                    personmail: genericfunctions.removeSpecialCharacter(parameters.contactmail || ""),
                                    personname: genericfunctions.removeSpecialCharacter(parameters.contactnameorcompany || ""),
                                    personphone: genericfunctions.removeSpecialCharacter(parameters.contactphone || ""),
                                },
                            },
                            method: "post",
                            url: `${bridgeEndpoint}processculqi/handlecharge`,
                            _requestid: request._requestid,
                        });

                        if (requestCulqiCharge.data.success) {
                            paymentperioddata = requestCulqiCharge.data.result;
                            paymentperiodtype = requestCulqiCharge?.data?.result?.source?.iin?.card_type;
                        }
                        else {
                            paymentperioderror = true;
                            requestMessage = genericfunctions.getCulqiError(requestCulqiCharge?.data?.operationMessage) || "error_card_payment";
                        }
                    }
                    else if (appsetting.paymentprovider === "OPENPAY COLOMBIA") {
                        const requestOpenpayCharge = await axiosObservable({
                            data: {
                                amount: Math.round((paymenttotal * 100 + Number.EPSILON) * 100) / 100,
                                currencyCode: "USD",
                                customerId: paymentcarddata.customerId,
                                description: (genericfunctions.removeSpecialCharacter(`Laraigo Subscription for ${parameters.contactdocumentnumber}`)).slice(0, 80),
                                igv: `${((billingtax || 0) + 1)}`,
                                merchantId: appsetting.culqiurl,
                                operation: "CREATE",
                                orderId: `${parameters.contactdocumentnumber}-${Math.floor(Math.random() * 99999999)}`,
                                secretKey: appsetting.privatekey,
                                sourceId: paymentcarddata.id,
                                url: appsetting.culqiurlcharge,
                            },
                            method: "post",
                            url: `${bridgeEndpoint}processopenpay/handlecharge`,
                            _requestid: request._requestid,
                        });

                        if (requestOpenpayCharge.data.success) {
                            paymentperioddata = requestOpenpayCharge.data.result;
                            paymentperiodtype = requestOpenpayCharge?.data?.result?.card?.type;
                        }
                        else {
                            paymentperioderror = true;
                            requestMessage = requestOpenpayCharge?.data?.operationMessage || "error_card_payment";
                        }
                    }
                    else {
                        paymentperioderror = true;
                        requestMessage = "error_payment_configuration";
                    }
                }
            }

            if (paymentperioderror) {
                return response.status(requestStatus).json({
                    code: requestCode,
                    error: !requestSuccess,
                    message: requestMessage,
                    success: requestSuccess,
                });
            }

            parameters.loginpassword = await bcryptjs.hash(parameters.loginpassword, await bcryptjs.genSalt(10));

            if (parameters.loginfacebookid) {
                parameters.loginusername = parameters.loginfacebookid;
            }

            if (parameters.logingoogleid) {
                parameters.loginusername = parameters.logingoogleid;
            }

            let contactfirstname = null;
            let contactlastname = null;

            contactfirstname = `${parameters.contactnameorcompany}`.split(/\s(.+)/)[0];
            contactlastname = `${parameters.contactnameorcompany}`.split(/\s(.+)/)[1];

            const subscriptionLaraigo = await genericfunctions.createLaraigoAccount(
                parameters.loginusername,
                parameters.loginfacebookid,
                parameters.logingoogleid,
                parameters.loginpassword,
                `${parameters.contactdocumenttype}`,
                parameters.contactdocumentnumber,
                contactfirstname || "",
                contactlastname || "",
                parameters.contactmail,
                parameters.contactphone,
                parameters.contactcountry,
                parameters.contactcurrency,
                parameters.iscompany ? "JURIDICA" : "NATURAL",
                parameters.companyname || parameters.contactnameorcompany,
                parameters.contactnameorcompany,
                parameters.contactaddress,
                parameters.companydocument,
                parameters.paymentplanid,
                true,
                "PREPAGO",
                false,
                true,
                true,
                appsetting.appsettingid,
                parameters.citybillingid || null,
                parameters.timezone,
                parameters.timezoneoffset,
                request._requestid,
            );

            if (subscriptionLaraigo) {
                let corpId = subscriptionLaraigo.corpid;
                let orgId = subscriptionLaraigo.orgid;
                let userId = subscriptionLaraigo.userid;

                if (paymentcarddata) {
                    let cardParameters = {
                        cardcode: paymentcarddata.id,
                        cardnumber: isCulqi ? paymentcarddata.source.cardNumber : paymentcarddata.cardNumber,
                        clientcode: paymentcarddata.customerId,
                        corpid: corpId,
                        favorite: true,
                        firstname: (cardfirstname || "").substring(0, 50),
                        id: 0,
                        lastname: (cardlastname || "").substring(0, 50),
                        mail: (parameters.contactmail || "").substring(0, 50),
                        operation: "INSERT",
                        orgid: orgId,
                        status: "ACTIVO",
                        type: "",
                        username: parameters.loginusername,
                        phone: (parameters.contactphone || "")
                            .split("+")
                            .join("")
                            .split(" ")
                            .join("")
                            .split("(")
                            .join("")
                            .split(")")
                            .join(""),
                        _requestid: request._requestid,
                    };

                    const queryCardCreate = await triggerfunctions.executesimpletransaction(
                        "UFN_PAYMENTCARD_INS",
                        cardParameters,
                    );

                    if (!(queryCardCreate instanceof Array)) {
                        requestMessage = "error_card_create";

                        return response.status(requestStatus).json({
                            code: requestCode,
                            error: !requestSuccess,
                            message: requestMessage,
                            success: requestSuccess,
                        });
                    }
                }

                if (paymentperioddata) {
                    let lastExchangeData = await genericfunctions.getExchangeRate("USD", request._requestid);

                    const datestring = currentdate.toISOString().split("T")[0];

                    const billingyear = currentdate.getFullYear();
                    const billingmonth = currentdate.getMonth() + 1;

                    let invoiceresponse = await genericfunctions.createInvoice(corpId, orgId, 0, `Plataforma Cognitiva Laraigo - ${genericfunctions.getMonth(billingmonth)} ${billingyear}`, "ACTIVO", "INVOICE", null, null, null, null, null, null, null, null, null, null, `${parameters.contactdocumenttype}`, parameters.contactdocumentnumber, parameters.companyname || parameters.contactnameorcompany, parameters.contactaddress, parameters.contactcountry, parameters.contactmail, null, null, null, null, `Plataforma Cognitiva Laraigo - ${genericfunctions.getMonth(billingmonth)} ${billingyear}`, datestring, null, paymentsubtotal, paymenttaxes, paymenttotal, "USD", lastExchangeData?.exchangerate || 1, "PENDING", null, null, null, null, null, null, "typecredit_alcontado", null, null, null, null, null, parameters.loginusername, null, paymentsubtotal, "PAID", false, billingyear, billingmonth, paymentperiodtype || "", request._requestid);

                    if (invoiceresponse) {
                        let producthasigv = "";
                        let productigvtribute = "";
                        let producttotaligv = 0;
                        let producttotalamount = 0;
                        let productigvrate = 0;
                        let productprice = 0;
                        let productnetprice = 0;
                        let productnetworth = 0;

                        if (`${parameters.contactdocumenttype}` !== "0") {
                            producthasigv = "10";
                            productigvtribute = "1000";
                            producttotaligv = paymenttaxes;
                            producttotalamount = paymenttotal;
                            productigvrate = billingtax;
                            productprice = paymenttotal;
                            productnetprice = paymentsubtotal;
                            productnetworth = paymentsubtotal;
                        }
                        else {
                            producthasigv = "40";
                            productigvtribute = "9998";
                            producttotaligv = 0;
                            producttotalamount = paymenttotal;
                            productigvrate = 0;
                            productprice = paymenttotal;
                            productnetprice = paymenttotal;
                            productnetworth = paymenttotal;
                        }

                        await genericfunctions.createInvoiceDetail(corpId, orgId, invoiceresponse.invoiceid, `Plataforma Cognitiva Laraigo - ${genericfunctions.getMonth(billingmonth)} ${billingyear}`, "ACTIVO", "NINGUNO", 1, "S001", producthasigv, "10", productigvtribute, "ZZ", producttotaligv, producttotalamount, productigvrate, productprice, `Plataforma Cognitiva Laraigo - ${genericfunctions.getMonth(billingmonth)} ${billingyear}`, productnetprice, productnetworth, paymentsubtotal, parameters.loginusername, request._requestid);

                        const chargedata = await genericfunctions.insertCharge(corpId, orgId, invoiceresponse.invoiceid, null, paymenttotal, true, paymentperioddata, paymentperioddata.id, "USD", "Laraigo Subscription", parameters.contactmail || "generic@mail.com", "INSERT", null, null, parameters.loginusername, "PAID", null, null, "REGISTEREDCARD", request._requestid);

                        await genericfunctions.insertPayment(corpId, orgId, invoiceresponse.invoiceid, true, chargedata?.chargeid, paymentperioddata, paymentperioddata.id, paymenttotal, parameters.contactmail || "generic@mail.com", parameters.loginusername, null, null, appsetting.location, appsetting.paymentprovider, request._requestid);

                        let invoicecorrelative = null;
                        let documenttype = null;

                        if ((parameters.contactcountry === "PE") && (`${parameters.contactdocumenttype}` === "1" || `${parameters.contactdocumenttype}` === "4" || `${parameters.contactdocumenttype}` === "7")) {
                            invoicecorrelative = await genericfunctions.getCorrelative(corpId, orgId, invoiceresponse.invoiceid, "TICKET", request._requestid);
                            documenttype = "03";
                        }
                        else {
                            invoicecorrelative = await genericfunctions.getCorrelative(corpId, orgId, invoiceresponse.invoiceid, "INVOICE", request._requestid);
                            documenttype = "01";
                        }

                        if (invoicecorrelative) {
                            await invoiceSubscription(corpId, orgId, appsetting, parameters, invoiceresponse, invoicecorrelative, lastExchangeData, documenttype, datestring, billingyear, billingmonth, paymentperiodtype, paymentsubtotal, paymenttaxes, paymenttotal, producttotaligv, producttotalamount, productigvrate, productprice, productnetprice, productnetworth, producthasigv, productigvtribute, true, request._requestid)
                        }
                        else {
                            requestMessage = "subscription_invoice_correlative_error";
                        }
                    }
                    else {
                        requestMessage = "subscription_invoice_create_error";
                    }
                }

                if (parameters.recharge) {
                    if (parameters.recharge.rechargeamount) {
                        let currentdate = genericfunctions.convertToUtc(new Date());

                        if (parameters.timezoneoffset > 0 || parameters.timezoneoffset < 0) {
                            currentdate.setHours(currentdate.getHours() + parameters.timezoneoffset);
                        }

                        paymentsubtotal = Math.round((parseFloat(parameters.recharge.rechargeamount) + Number.EPSILON) * 100) / 100;
                        paymenttaxes = Math.round(((paymentsubtotal * billingtax) + Number.EPSILON) * 100) / 100;
                        paymenttotal = Math.round(((paymentsubtotal + paymenttaxes) + Number.EPSILON) * 100) / 100;

                        let paymentchargedata = null;
                        let paymentchargetype = null;
                        let paymentchargeerror = false;

                        if (appsetting.paymentprovider === "CULQI") {
                            const requestCulqiCharge = await axiosObservable({
                                data: {
                                    amount: Math.round((paymenttotal * 100 + Number.EPSILON) * 100) / 100,
                                    bearer: appsetting.privatekey,
                                    description: (genericfunctions.removeSpecialCharacter(`Onboarding for ${parameters.contactdocumentnumber}`)).slice(0, 80),
                                    currencyCode: "USD",
                                    email: `${(parameters.contactmail || "generic@mail.com")}`,
                                    sourceId: paymentcarddata.id,
                                    operation: "CREATE",
                                    url: appsetting.culqiurlcharge,
                                    metadata: {
                                        companydocument: genericfunctions.removeSpecialCharacter(parameters.companydocument || ""),
                                        companyname: genericfunctions.removeSpecialCharacter(parameters.companyname || ""),
                                        paymentplan: genericfunctions.removeSpecialCharacter(parameters.paymentplan || ""),
                                        paymenttype: "ONBOARDING",
                                        personcountry: genericfunctions.removeSpecialCharacter(parameters.contactcountryname || ""),
                                        personmail: genericfunctions.removeSpecialCharacter(parameters.contactmail || ""),
                                        personname: genericfunctions.removeSpecialCharacter(parameters.contactnameorcompany || ""),
                                        personphone: genericfunctions.removeSpecialCharacter(parameters.contactphone || ""),
                                    },
                                },
                                method: "post",
                                url: `${bridgeEndpoint}processculqi/handlecharge`,
                                _requestid: request._requestid,
                            });

                            if (requestCulqiCharge.data.success) {
                                paymentchargedata = requestCulqiCharge.data.result;
                                paymentchargetype = requestCulqiCharge?.data?.result?.source?.iin?.card_type;
                            }
                            else {
                                paymentchargeerror = true;
                            }
                        }
                        else if (appsetting.paymentprovider === "OPENPAY COLOMBIA") {
                            const requestOpenpayCharge = await axiosObservable({
                                data: {
                                    amount: Math.round((paymenttotal * 100 + Number.EPSILON) * 100) / 100,
                                    currencyCode: "USD",
                                    customerId: paymentcarddata.customerId,
                                    description: (genericfunctions.removeSpecialCharacter(`Onboarding for ${parameters.contactdocumentnumber}`)).slice(0, 80),
                                    igv: `${((billingtax || 0) + 1)}`,
                                    merchantId: appsetting.culqiurl,
                                    operation: "CREATE",
                                    orderId: `${parameters.contactdocumentnumber}-${Math.floor(Math.random() * 99999999)}`,
                                    secretKey: appsetting.privatekey,
                                    sourceId: paymentcarddata.id,
                                    url: appsetting.culqiurlcharge,
                                },
                                method: "post",
                                url: `${bridgeEndpoint}processopenpay/handlecharge`,
                                _requestid: request._requestid,
                            });

                            if (requestOpenpayCharge.data.success) {
                                paymentchargedata = requestOpenpayCharge.data.result;
                                paymentchargetype = requestOpenpayCharge?.data?.result?.card?.type;
                            }
                            else {
                                paymentchargeerror = true;
                            }
                        }

                        if (!paymentchargeerror && paymentchargedata) {
                            const org = await genericfunctions.getOrganization(corpId, orgId, request._requestid);

                            let lastExchangeData = await genericfunctions.getExchangeRate("USD", request._requestid);

                            const datestring = currentdate.toISOString().split("T")[0];

                            const billingyear = currentdate.getFullYear();
                            const billingmonth = currentdate.getMonth() + 1;

                            var balanceresponse = await genericfunctions.createBalance(corpId, orgId, 0, `Onboarding (${billingyear}/${billingmonth})`, "ACTIVO", "GENERAL", null, null, paymentsubtotal, ((org?.balance || 0) + paymentsubtotal), `${parameters.contactdocumenttype}`, parameters.contactdocumentnumber, "PAID", new Date().toISOString().split("T")[0], parameters.loginusername, parameters.loginusername, request._requestid);

                            let invoiceresponse = await genericfunctions.createInvoice(corpId, orgId, 0, `Onboarding (${billingyear}/${billingmonth})`, "ACTIVO", "INVOICE", null, null, null, null, null, null, null, null, null, null, `${parameters.contactdocumenttype}`, parameters.contactdocumentnumber, parameters.companyname || parameters.contactnameorcompany, parameters.contactaddress, parameters.contactcountry, parameters.contactmail, null, null, null, null, `Plataforma Cognitiva Laraigo - ${genericfunctions.getMonth(billingmonth)} ${billingyear}`, datestring, null, paymentsubtotal, paymenttaxes, paymenttotal, "USD", lastExchangeData?.exchangerate || 1, "PENDING", null, null, null, null, null, null, "typecredit_alcontado", null, null, null, null, null, parameters.loginusername, null, paymentsubtotal, "PAID", false, billingyear, billingmonth, paymentchargetype || "", request._requestid);

                            if (invoiceresponse) {
                                await genericfunctions.changeInvoiceBalance(corpId, orgId, balanceresponse.balanceid, invoiceresponse.invoiceid, parameters.loginusername, request._requestid);

                                let producthasigv = "";
                                let productigvtribute = "";
                                let producttotaligv = 0;
                                let producttotalamount = 0;
                                let productigvrate = 0;
                                let productprice = 0;
                                let productnetprice = 0;
                                let productnetworth = 0;

                                if (`${parameters.contactdocumenttype}` !== "0") {
                                    producthasigv = "10";
                                    productigvtribute = "1000";
                                    producttotaligv = paymenttaxes;
                                    producttotalamount = paymenttotal;
                                    productigvrate = billingtax;
                                    productprice = paymenttotal;
                                    productnetprice = paymentsubtotal;
                                    productnetworth = paymentsubtotal;
                                }
                                else {
                                    producthasigv = "40";
                                    productigvtribute = "9998";
                                    producttotaligv = 0;
                                    producttotalamount = paymenttotal;
                                    productigvrate = 0;
                                    productprice = paymenttotal;
                                    productnetprice = paymenttotal;
                                    productnetworth = paymenttotal;
                                }

                                await genericfunctions.createInvoiceDetail(corpId, orgId, invoiceresponse.invoiceid, `Onboarding (${parameters.contactdocumentnumber})`, "ACTIVO", "NINGUNO", 1, "S001", producthasigv, "10", productigvtribute, "ZZ", producttotaligv, producttotalamount, productigvrate, productprice, `Onboarding (${parameters.contactdocumentnumber})`, productnetprice, productnetworth, paymentsubtotal, parameters.loginusername, request._requestid);

                                const chargedata = await genericfunctions.insertCharge(corpId, orgId, invoiceresponse.invoiceid, null, paymenttotal, true, paymentchargedata, paymentchargedata.id, "USD", "Laraigo Onboarding", parameters.contactmail || "generic@mail.com", "INSERT", null, null, parameters.loginusername, "PAID", null, null, "REGISTEREDCARD", request._requestid);

                                await genericfunctions.insertPayment(corpId, orgId, invoiceresponse.invoiceid, true, chargedata?.chargeid, paymentchargedata, paymentchargedata.id, paymenttotal, parameters.contactmail || "generic@mail.com", parameters.loginusername, null, null, appsetting.location, appsetting.paymentprovider, request._requestid);

                                let invoicecorrelative = null;
                                let documenttype = null;

                                if ((parameters.contactcountry === "PE") && (`${parameters.contactdocumenttype}` === "1" || `${parameters.contactdocumenttype}` === "4" || `${parameters.contactdocumenttype}` === "7")) {
                                    invoicecorrelative = await genericfunctions.getCorrelative(corpId, orgId, invoiceresponse.invoiceid, "TICKET", request._requestid);
                                    documenttype = "03";
                                }
                                else {
                                    invoicecorrelative = await genericfunctions.getCorrelative(corpId, orgId, invoiceresponse.invoiceid, "INVOICE", request._requestid);
                                    documenttype = "01";
                                }

                                if (invoicecorrelative) {
                                    await invoiceSubscription(corpId, orgId, appsetting, parameters, invoiceresponse, invoicecorrelative, lastExchangeData, documenttype, datestring, billingyear, billingmonth, paymentchargetype, paymentsubtotal, paymenttaxes, paymenttotal, producttotaligv, producttotalamount, productigvrate, productprice, productnetprice, productnetworth, producthasigv, productigvtribute, false, request._requestid)
                                }
                            }
                        }
                    }
                }

                if (
                    (typeof parameters.loginfacebookid !== "undefined" && parameters.loginfacebookid) ||
                    (typeof parameters.logingoogleid !== "undefined" && parameters.logingoogleid)
                ) {
                    let userParameters = {
                        corpid: corpId,
                        userid: userId,
                        _requestid: request._requestid,
                    };

                    const queryActivateUser = await triggerfunctions.executesimpletransaction(
                        "UFN_USER_ACTIVATE",
                        userParameters,
                    );

                    if (queryActivateUser instanceof Array) {
                        requestCode = "";
                        requestMessage = "";
                        requestStatus = 200;
                        requestSuccess = true;
                    } else {
                        requestMessage = "subscription_user_activate_error";
                    }
                } else {
                    let domainParameters = {
                        all: false,
                        corpid: 1,
                        domainname: "ACTIVATEBODY",
                        orgid: 0,
                        username: parameters.loginusername,
                        _requestid: request._requestid,
                    };

                    const transactionGetBody = await triggerfunctions.executesimpletransaction(
                        "UFN_DOMAIN_VALUES_SEL",
                        domainParameters,
                    );

                    domainParameters.domainname = "ACTIVATESUBJECT";

                    const transactionGetSubject = await triggerfunctions.executesimpletransaction(
                        "UFN_DOMAIN_VALUES_SEL",
                        domainParameters,
                    );

                    if (transactionGetBody instanceof Array && transactionGetSubject instanceof Array) {
                        if (transactionGetBody.length > 0 && transactionGetSubject.length > 0) {
                            let userCode = cryptojs.AES.encrypt(
                                JSON.stringify({
                                    corpid: corpId,
                                    userid: userId,
                                }),
                                userSecret
                            ).toString();

                            userCode = userCode.split("/").join("_SLASH_");
                            userCode = userCode.split("+").join("_PLUS_");
                            userCode = userCode.split("=").join("_EQUAL_");

                            let alertBody = transactionGetBody[0].domainvalue;
                            let alertSubject = transactionGetSubject[0].domainvalue;

                            alertBody = alertBody.split("{{address}}").join(parameters.contactaddress);
                            alertBody = alertBody.split("{{channeldata}}").join("");
                            alertBody = alertBody.split("{{country}}").join(parameters.contactcountry);
                            alertBody = alertBody.split("{{countryname}}").join(parameters.contactcountryname);
                            alertBody = alertBody.split("{{firstname}}").join(parameters.contactnameorcompany);
                            alertBody = alertBody.split("{{lastname}}").join("");
                            alertBody = alertBody.split("{{paymentplan}}").join(parameters.paymentplan);
                            alertBody = alertBody.split("{{username}}").join(parameters.loginusername);
                            alertBody = alertBody.split("{{organizationname}}").join(parameters.companyname);

                            alertBody = alertBody
                                .split("{{link}}")
                                .join(`${laraigoEndpoint}activateuser/${encodeURIComponent(userCode)}`);

                            alertSubject = alertSubject.split("{{address}}").join(parameters.contactaddress);
                            alertSubject = alertSubject.split("{{channeldata}}").join("");
                            alertSubject = alertSubject.split("{{country}}").join(parameters.contactcountry);
                            alertSubject = alertSubject.split("{{countryname}}").join(parameters.contactcountryname);
                            alertSubject = alertSubject.split("{{firstname}}").join(parameters.contactnameorcompany);
                            alertSubject = alertSubject.split("{{lastname}}").join("");
                            alertSubject = alertSubject.split("{{paymentplan}}").join(parameters.paymentplan);
                            alertSubject = alertSubject.split("{{username}}").join(parameters.loginusername);
                            alertSubject = alertSubject.split("{{organizationname}}").join(parameters.companyname);

                            alertSubject = alertSubject
                                .split("{{link}}")
                                .join(`${laraigoEndpoint}activateuser/${encodeURIComponent(userCode)}`);

                            const requestMailSend = await axiosObservable({
                                method: "post",
                                url: `${bridgeEndpoint}processscheduler/sendmail`,
                                data: {
                                    mailAddress: parameters.loginusername,
                                    mailBody: alertBody,
                                    mailTitle: alertSubject,
                                },
                                _requestid: request._requestid,
                            });

                            if (requestMailSend.data.success) {
                                requestCode = "";
                                requestMessage = "";
                                requestStatus = 200;
                                requestSuccess = true;
                            } else {
                                requestMessage = "error_subscription_activation_failure";
                            }
                        } else {
                            requestMessage = "error_subscription_activation_error";
                        }
                    } else {
                        requestMessage = "error_subscription_activation_error";
                    }
                }
            } else {
                requestMessage = "subscription_user_create_error";
            }
        }

        return response.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
};

exports.currencyList = async (request, response) => {
    try {
        let requestCode = "error_unexpected_error";
        let requestData = null;
        let requestMessage = "error_unexpected_error";
        let requestStatus = 400;
        let requestSuccess = false;

        const queryCurrencySel = await triggerfunctions.executesimpletransaction("UFN_CURRENCY_SEL", {
            _requestid: request._requestid,
        });

        if (queryCurrencySel instanceof Array) {
            requestCode = "";
            requestData = queryCurrencySel;
            requestMessage = "";
            requestStatus = 200;
            requestSuccess = true;
        } else {
            requestCode = queryCurrencySel.code;
        }

        return response.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
};

exports.getContract = async (request, response) => {
    try {
        let requestCode = "error_unexpected_error";
        let requestData = null;
        let requestMessage = "error_unexpected_error";
        let requestStatus = 400;
        let requestSuccess = false;

        if (request.body) {
            let { parameters = {} } = request.body;

            parameters._requestid = request._requestid;

            const queryContractGet = await triggerfunctions.executesimpletransaction("GET_CONTRACT", parameters);

            if (queryContractGet instanceof Array) {
                if (queryContractGet.length > 0) {
                    const queryCityBillingGet = await triggerfunctions.executesimpletransaction("UFN_CITYBILLING_SEL", {});

                    if (queryCityBillingGet instanceof Array) {
                        if (queryCityBillingGet.length > 0) {
                            queryContractGet[0].cityList = queryCityBillingGet;
                        }
                    }

                    requestCode = "";
                    requestData = queryContractGet;
                    requestMessage = "";
                    requestStatus = 200;
                    requestSuccess = true;
                }
            } else {
                requestCode = queryContractGet.code;
            }
        }

        return response.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
};

exports.getPageList = async (request, response) => {
    try {
        let requestCode = "error_unexpected_error";
        let requestData = null;
        let requestMessage = "error_unexpected_error";
        let requestStatus = 400;
        let requestSuccess = false;

        if (request.body) {
            const requestFacebookPages = await axiosObservable({
                _requestid: request._requestid,
                method: "post",
                url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`,
                data: {
                    accessToken: request.body.accessToken,
                    appId: request.body.appId,
                    linkType: "GETPAGES",
                },
            });

            if (requestFacebookPages.data.success) {
                requestCode = "";
                requestData = requestFacebookPages.data.pageData;
                requestMessage = "";
                requestStatus = 200;
                requestSuccess = true;
            } else {
                requestMessage = "error_facebook_pages";
            }
        }

        return response.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            message: requestMessage,
            pageData: requestData,
            success: requestSuccess,
        });
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
};

exports.recoverPassword = async (request, response) => {
    try {
        let requestCode = "error_unexpected_error";
        let requestMessage = "error_unexpected_error";
        let requestStatus = 400;
        let requestSuccess = false;

        if (request.body) {
            let userParameters = {
                _requestid: request._requestid,
                username: request.body.username,
            };

            const queryUserGet = await triggerfunctions.executesimpletransaction("UFN_USERBYUSER", userParameters);

            if (queryUserGet instanceof Array) {
                if (queryUserGet.length > 0) {
                    let validMail = false;

                    if (typeof queryUserGet[0].email !== "undefined" && queryUserGet[0].email) {
                        if (genericfunctions.validateEmail(queryUserGet[0].email) !== null) {
                            validMail = true;
                        }
                    }

                    if (validMail) {
                        let domainParameters = {
                            _requestid: request._requestid,
                            all: false,
                            corpid: 1,
                            domainname: "RECOVERPASSBODY",
                            orgid: 0,
                            username: request.body.username,
                        };

                        const queryDomainBodySel = await triggerfunctions.executesimpletransaction(
                            "UFN_DOMAIN_VALUES_SEL",
                            domainParameters
                        );

                        domainParameters.domainname = "RECOVERPASSSUBJECT";

                        const queryDomainSubjectSel = await triggerfunctions.executesimpletransaction(
                            "UFN_DOMAIN_VALUES_SEL",
                            domainParameters
                        );

                        if (queryDomainBodySel instanceof Array && queryDomainSubjectSel instanceof Array) {
                            if (queryDomainBodySel.length > 0 && queryDomainSubjectSel.length > 0) {
                                let alertBody = queryDomainBodySel[0].domainvalue;
                                let alertSubject = queryDomainSubjectSel[0].domainvalue;

                                let linkCode = cryptojs.AES.encrypt(
                                    JSON.stringify({
                                        date: new Date().getTime(),
                                        userid: queryUserGet[0].userid,
                                    }),
                                    userSecret
                                ).toString();

                                linkCode = linkCode.split("/").join("_SLASH_");
                                linkCode = linkCode.split("+").join("_PLUS_");
                                linkCode = linkCode.split("=").join("_EQUAL_");

                                alertBody = alertBody.split("{{docnum}}").join(queryUserGet[0].docnum);
                                alertBody = alertBody.split("{{doctype}}").join(queryUserGet[0].doctype);
                                alertBody = alertBody.split("{{email}}").join(queryUserGet[0].email);
                                alertBody = alertBody.split("{{firstname}}").join(queryUserGet[0].firstname);
                                alertBody = alertBody.split("{{lastname}}").join(queryUserGet[0].lastname);
                                alertBody = alertBody.split("{{userid}}").join(queryUserGet[0].userid);
                                alertBody = alertBody.split("{{usr}}").join(queryUserGet[0].usr);

                                alertBody = alertBody
                                    .split("{{link}}")
                                    .join(`${laraigoEndpoint}recoverpassword/${encodeURIComponent(linkCode)}`);

                                alertSubject = alertSubject.split("{{docnum}}").join(queryUserGet[0].docnum);
                                alertSubject = alertSubject.split("{{doctype}}").join(queryUserGet[0].doctype);
                                alertSubject = alertSubject.split("{{email}}").join(queryUserGet[0].email);
                                alertSubject = alertSubject.split("{{firstname}}").join(queryUserGet[0].firstname);
                                alertSubject = alertSubject.split("{{lastname}}").join(queryUserGet[0].lastname);
                                alertSubject = alertSubject.split("{{userid}}").join(queryUserGet[0].userid);
                                alertSubject = alertSubject.split("{{usr}}").join(queryUserGet[0].usr);

                                alertSubject = alertSubject
                                    .split("{{link}}")
                                    .join(`${laraigoEndpoint}recoverpassword/${encodeURIComponent(linkCode)}`);

                                const requestMailSend = await axiosObservable({
                                    _requestid: request._requestid,
                                    method: "post",
                                    url: `${bridgeEndpoint}processscheduler/sendmail`,
                                    data: {
                                        mailAddress: queryUserGet[0].email,
                                        mailBody: alertBody,
                                        mailTitle: alertSubject,
                                    },
                                });

                                if (requestMailSend.data.success) {
                                    requestCode = "";
                                    requestMessage = "";
                                    requestStatus = 200;
                                    requestSuccess = true;
                                } else {
                                    requestMessage = "recoverpassword_sendfailure";
                                }
                            } else {
                                requestMessage = "recoverpassword_missingconfiguration";
                            }
                        } else {
                            requestMessage = "recoverpassword_missingconfiguration";
                        }
                    } else {
                        requestMessage = "recoverpassword_usernotmail";
                    }
                } else {
                    requestMessage = "recoverpassword_usernotfound";
                }
            } else {
                requestCode = queryUserGet.code;
            }
        }

        return response.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
};

exports.validateChannels = async (request, response) => {
    try {
        let requestCode = "error_unexpected_error";
        let requestMessage = "error_unexpected_error";
        let requestStatus = 400;
        let requestSuccess = false;

        if (request.body) {
            requestCode = "";
            requestMessage = "";
            requestStatus = 200;
            requestSuccess = true;
        }

        return response.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
};

exports.validateUserId = async (request, response) => {
    try {
        let requestCode = "error_unexpected_error";
        let requestMessage = "error_unexpected_error";
        let requestStatus = 400;
        let requestSuccess = false;

        if (request.body) {
            let { method, parameters = {} } = request.body;

            setSessionParameters(parameters, request.user, request._requestid);

            parameters.password = await bcryptjs.hash(parameters.password, await bcryptjs.genSalt(10));
            parameters.userid = request.user.userid;

            const queryUserSel = await triggerfunctions.executesimpletransaction(method, parameters);

            if (queryUserSel instanceof Array) {
                if (queryUserSel.length > 0) {
                    parameters.password = await bcryptjs.hash(parameters.newpassword, await bcryptjs.genSalt(10));

                    const queryUserUpdate = await triggerfunctions.executesimpletransaction(
                        "UFN_USER_UPDATE",
                        parameters
                    );

                    if (queryUserUpdate instanceof Array) {
                        requestCode = "";
                        requestMessage = "";
                        requestStatus = 200;
                        requestSuccess = true;
                    } else {
                        requestCode = queryUserUpdate.code;
                    }
                } else {
                    requestMessage = "validateuser_mismatch";
                }
            } else {
                requestCode = queryUserSel.code;
            }
        }

        return response.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
};

exports.validateUsername = async (request, response) => {
    try {
        let requestCode = "error_unexpected_error";
        let requestIsValid = false;
        let requestMessage = "error_unexpected_error";
        let requestStatus = 400;
        let requestSuccess = false;

        if (request.body) {
            let { method, parameters = {} } = request.body;

            if (typeof parameters.facebookid !== "undefined" && parameters.facebookid) {
                parameters._requestid = request._requestid;
                parameters.googleid = null;
                parameters.usr = null;
            }

            if (typeof parameters.googleid !== "undefined" && parameters.googleid) {
                parameters._requestid = request._requestid;
                parameters.facebookid = null;
                parameters.usr = null;
            }

            const queryUserSel = await triggerfunctions.executesimpletransaction(method, parameters);

            if (queryUserSel instanceof Array) {
                requestCode = "";
                requestMessage = "";
                requestStatus = 200;
                requestSuccess = true;

                if (queryUserSel.length <= 0) {
                    requestIsValid = true;
                }
            } else {
                requestCode = queryUserSel.code;
            }
        }

        return response.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            isvalid: requestIsValid,
            message: requestMessage,
            success: requestSuccess,
        });
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
};

const invoiceSubscription = async (corpid, orgid, appsetting, parameters, invoiceresponse, invoicecorrelative, exchangedata, documenttype, datestring, billingyear, billingmonth, paymenttype, paymentsubtotal, paymenttaxes, paymenttotal, producttotaligv, producttotalamount, productigvrate, productprice, productnetprice, productnetworth, producthasigv, productigvtribute, sendmail, requestId) => {
    let invoiceSuccess = false;
    let invoiceCorrelative = null;
    let invoiceLink = null;

    try {
        let invoicedata = {
            CodigoAnexoEmisor: appsetting.annexcode,
            CodigoFormatoImpresion: appsetting.printingformat,
            CodigoMoneda: "USD",
            Username: appsetting.sunatusername,
            TipoDocumento: documenttype,
            TipoRucEmisor: appsetting.emittertype,
            CodigoRucReceptor: `${parameters.contactdocumenttype}`,
            CodigoUbigeoEmisor: appsetting.ubigeo,
            EnviarSunat: true,
            FechaEmision: datestring,
            FechaVencimiento: datestring,
            MailEnvio: parameters.contactmail,
            MontoTotal: paymenttotal,
            NombreComercialEmisor: appsetting.tradename,
            RazonSocialEmisor: appsetting.businessname,
            RazonSocialReceptor: parameters.companyname || parameters.contactnameorcompany,
            CorrelativoDocumento: genericfunctions.padNumber(invoicecorrelative.p_correlative, 8),
            RucEmisor: appsetting.ruc,
            NumeroDocumentoReceptor: parameters.contactdocumentnumber,
            NumeroSerieDocumento: documenttype === "01" ? appsetting.invoiceserie : appsetting.ticketserie,
            RetornaPdf: appsetting.returnpdf,
            RetornaXmlSunat: appsetting.returnxmlsunat,
            RetornaXml: appsetting.returnxml,
            TipoCambio: (exchangedata?.exchangeratesol / exchangedata?.exchangerate) || 1,
            Token: appsetting.token,
            DireccionFiscalEmisor: appsetting.fiscaladdress,
            DireccionFiscalReceptor: parameters.contactaddress,
            VersionXml: appsetting.xmlversion,
            VersionUbl: appsetting.ublversion,
            Endpoint: appsetting.sunaturl,
            PaisRecepcion: parameters.contactcountry,
            ProductList: [],
            DataList: []
        }

        invoicedata.CodigoOperacionSunat = parameters.contactcountry === "PE" ? appsetting.operationcodeperu : appsetting.operationcodeother;
        invoicedata.MontoTotalGravado = parameters.contactcountry === "PE" ? paymentsubtotal : null;
        invoicedata.MontoTotalInafecto = parameters.contactcountry === "PE" ? "0" : paymentsubtotal;
        invoicedata.MontoTotalIgv = parameters.contactcountry === "PE" ? paymenttaxes : null;

        let calcdetraction = false;

        if (parameters.contactcountry === "PE") {
            calcdetraction = true;
        }

        if (calcdetraction) {
            if (appsetting.detraction && appsetting.detractioncode && appsetting.detractionaccount && (appsetting.detractionminimum || appsetting.detractionminimum === 0)) {
                let compareamount = 0;

                if (appsetting.detractionminimum) {
                    compareamount = (paymenttotal / (exchangedata?.exchangerate || 0) * (exchangedata?.exchangeratesol || 0));
                }

                if (compareamount > appsetting.detractionminimum) {
                    invoicedata.CodigoDetraccion = appsetting.detractioncode;
                    invoicedata.CodigoOperacionSunat = "1001";
                    invoicedata.MontoTotalDetraccion = Math.round(Math.round(((paymenttotal * appsetting.detraction) + Number.EPSILON) * 100) / 100);
                    invoicedata.MontoPendienteDetraccion = Math.round(((invoicedata.MontoTotal - (invoicedata.MontoTotalDetraccion || 0)) + Number.EPSILON) * 100) / 100;
                    invoicedata.MontoTotalInafecto = null;
                    invoicedata.NumeroCuentaDetraccion = appsetting.detractionaccount;
                    invoicedata.PaisRecepcion = null;
                    invoicedata.PorcentajeTotalDetraccion = appsetting.detraction * 100;

                    let adicional02 = {
                        CodigoDatoAdicional: "06",
                        DescripcionDatoAdicional: "CUENTA DE DETRACCION: " + appsetting.detractionaccount
                    }

                    invoicedata.DataList.push(adicional02);
                }
            }
        }

        let adicional01 = {
            CodigoDatoAdicional: "05",
            DescripcionDatoAdicional: "FORMA DE PAGO: TRANSFERENCIA"
        }

        invoicedata.DataList.push(adicional01);

        let adicional05 = {
            CodigoDatoAdicional: "01",
            DescripcionDatoAdicional: "AL CONTADO"
        }

        invoicedata.DataList.push(adicional05);

        if (adicional05) {
            invoicedata.FechaVencimiento = null;
        }

        let invoicedetaildata = {
            CantidadProducto: 1,
            CodigoProducto: "S001",
            TipoVenta: "10",
            UnidadMedida: "ZZ",
            IgvTotal: Math.round((producttotaligv + Number.EPSILON) * 100) / 100,
            MontoTotal: Math.round((producttotalamount + Number.EPSILON) * 100) / 100,
            TasaIgv: Math.round((productigvrate * 100) || 0),
            PrecioProducto: Math.round((productprice + Number.EPSILON) * 100) / 100,
            DescripcionProducto: `Plataforma Cognitiva Laraigo - ${genericfunctions.getMonth(billingmonth)} ${billingyear}`,
            PrecioNetoProducto: Math.round((productnetprice + Number.EPSILON) * 100) / 100,
            ValorNetoProducto: Math.round((productnetworth + Number.EPSILON) * 100) / 100,
            AfectadoIgv: producthasigv,
            TributoIgv: productigvtribute,
        };

        invoicedata.ProductList.push(invoicedetaildata);

        if (appsetting.invoiceprovider === "MIFACT") {
            invoicedata.FilenameOverride = `${documenttype === "03" ? "BV" : "FV"} - PLATAFORMA LARAIGO ${genericfunctions.getMonth(billingmonth)} ${billingyear}`;

            const requestSendToSunat = await axiosObservable({
                data: invoicedata,
                method: "post",
                url: `${bridgeEndpoint}processmifact/sendinvoice`,
                _requestid: requestId,
            });

            if (requestSendToSunat.data.result) {
                await genericfunctions.invoiceSunat(corpid, orgid, invoiceresponse.invoiceid, "INVOICED", null, requestSendToSunat.data.result.cadenaCodigoQr, requestSendToSunat.data.result.codigoHash, requestSendToSunat.data.result.urlCdrSunat, requestSendToSunat.data.result.urlPdf, requestSendToSunat.data.result.urlXml, invoicedata.NumeroSerieDocumento, appsetting.ruc || null, appsetting.businessname || null, appsetting.tradename || null, appsetting.fiscaladdress || null, appsetting.ubigeo || null, appsetting.emittertype || null, appsetting.annexcode || null, appsetting.printingformat || null, invoicedata?.EnviarSunat || null, appsetting.returnpdf || null, appsetting.returnxmlsunat || null, appsetting.returnxml || null, appsetting.token || null, appsetting.sunaturl || null, appsetting.sunatusername || null, appsetting.xmlversion || null, appsetting.ublversion || null, invoicedata?.CodigoRucReceptor || null, invoicedata?.NumeroDocumentoReceptor || null, invoicedata?.RazonSocialReceptor || null, invoicedata?.DireccionFiscalReceptor || null, invoicedata?.PaisRecepcion || null, invoicedata?.MailEnvio || null, documenttype || null, invoicedata?.CodigoOperacionSunat || null, invoicedata?.FechaVencimiento || null, null, null, "typecredit_alcontado" || null, appsetting.detractioncode || null, appsetting.detraction || null, appsetting.detractionaccount, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, null, requestId);

                invoiceSuccess = true;
                invoiceLink = requestSendToSunat.data.result.urlPdf;
            }
            else {
                await genericfunctions.invoiceSunat(corpid, orgid, invoiceresponse.invoiceid, "ERROR", requestSendToSunat.data.operationMessage, null, null, null, null, null, null, appsetting.ruc || null, appsetting.businessname || null, appsetting.tradename || null, appsetting.fiscaladdress || null, appsetting.ubigeo || null, appsetting.emittertype || null, appsetting.annexcode || null, appsetting.printingformat || null, invoicedata?.EnviarSunat || null, appsetting.returnpdf || null, appsetting.returnxmlsunat || null, appsetting.returnxml || null, appsetting.token || null, appsetting.sunaturl || null, appsetting.sunatusername || null, appsetting.xmlversion || null, appsetting.ublversion || null, invoicedata?.CodigoRucReceptor || null, invoicedata?.NumeroDocumentoReceptor || null, invoicedata?.RazonSocialReceptor || null, invoicedata?.DireccionFiscalReceptor || null, invoicedata?.PaisRecepcion || null, invoicedata?.MailEnvio || null, documenttype || null, invoicedata?.CodigoOperacionSunat || null, invoicedata?.FechaVencimiento || null, null, null, "typecredit_alcontado" || null, appsetting.detractioncode || null, appsetting.detraction || null, appsetting.detractionaccount, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, null, requestId);

                if ((parameters.contactcountry === "PE") && (`${parameters.contactdocumentnumber}` === "1" || `${parameters.contactdocumentnumber}` === "4" || `${parameters.contactdocumentnumber}` === "7")) {
                    await genericfunctions.getCorrelative(corpid, orgid, invoiceresponse.invoiceid, "TICKETERROR", requestId);
                }
                else {
                    await genericfunctions.getCorrelative(corpid, orgid, invoiceresponse.invoiceid, "INVOICEERROR", requestId);
                }
            }
        }
        else if (appsetting.invoiceprovider === "SIIGO") {
            invoicedata.FilenameOverride = `FV - PLATAFORMA LARAIGO ${genericfunctions.getMonth(billingmonth)} ${billingyear}`;

            const corp = await genericfunctions.getCorporation(corpid, requestId);

            invoicedata.TipoDocumentoSiigo = "FV";
            invoicedata.TipoCambio = (exchangedata?.exchangeratecop / exchangedata?.exchangerate) || 1;
            invoicedata.TipoPago = (paymenttype == "Crédito" || paymenttype == "credit") ? "Tarjeta Crédito" : "Tarjeta Débito";
            invoicedata.CityCountry = corp.countrycode;
            invoicedata.CityState = corp.statecode;
            invoicedata.CityCode = corp.citycode;

            const requestSendToSiigo = await axiosObservable({
                data: invoicedata,
                method: "post",
                url: `${bridgeEndpoint}processsiigo/sendinvoice`,
                _requestid: requestId,
            });

            if (requestSendToSiigo.data.result) {
                let correlativeOverride = null;

                if (requestSendToSiigo.data.result.correlativoCpe) {
                    correlativeOverride = parseInt(`${requestSendToSiigo.data.result.correlativoCpe}`);
                }

                await genericfunctions.invoiceSunat(corpid, orgid, invoiceresponse.invoiceid, "INVOICED", null, requestSendToSiigo.data.result.cadenaCodigoQr, requestSendToSiigo.data.result.codigoHash, requestSendToSiigo.data.result.urlCdrSunat, requestSendToSiigo.data.result.urlPdf, requestSendToSiigo.data.result.urlXml, invoicedata.NumeroSerieDocumento, appsetting.ruc || null, appsetting.businessname || null, appsetting.tradename || null, appsetting.fiscaladdress || null, appsetting.ubigeo || null, appsetting.emittertype || null, appsetting.annexcode || null, appsetting.printingformat || null, invoicedata?.EnviarSunat || null, appsetting.returnpdf || null, appsetting.returnxmlsunat || null, appsetting.returnxml || null, appsetting.token || null, appsetting.sunaturl || null, appsetting.sunatusername || null, appsetting.xmlversion || null, appsetting.ublversion || null, invoicedata?.CodigoRucReceptor || null, invoicedata?.NumeroDocumentoReceptor || null, invoicedata?.RazonSocialReceptor || null, invoicedata?.DireccionFiscalReceptor || null, invoicedata?.PaisRecepcion || null, invoicedata?.MailEnvio || null, documenttype || null, invoicedata?.CodigoOperacionSunat || null, invoicedata?.FechaVencimiento || null, null, null, "typecredit_alcontado" || null, appsetting.detractioncode || null, appsetting.detraction || null, appsetting.detractionaccount, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, correlativeOverride, requestId);

                invoiceSuccess = true;
                invoiceCorrelative = correlativeOverride;
                invoiceLink = requestSendToSunat.data.result.urlPdf;
            }
            else {
                await genericfunctions.invoiceSunat(corpid, orgid, invoiceresponse.invoiceid, "ERROR", requestSendToSiigo.data.operationMessage, null, null, null, null, null, null, appsetting.ruc || null, appsetting.businessname || null, appsetting.tradename || null, appsetting.fiscaladdress || null, appsetting.ubigeo || null, appsetting.emittertype || null, appsetting.annexcode || null, appsetting.printingformat || null, invoicedata?.EnviarSunat || null, appsetting.returnpdf || null, appsetting.returnxmlsunat || null, appsetting.returnxml || null, appsetting.token || null, appsetting.sunaturl || null, appsetting.sunatusername || null, appsetting.xmlversion || null, appsetting.ublversion || null, invoicedata?.CodigoRucReceptor || null, invoicedata?.NumeroDocumentoReceptor || null, invoicedata?.RazonSocialReceptor || null, invoicedata?.DireccionFiscalReceptor || null, invoicedata?.PaisRecepcion || null, invoicedata?.MailEnvio || null, documenttype || null, invoicedata?.CodigoOperacionSunat || null, invoicedata?.FechaVencimiento || null, null, null, "typecredit_alcontado" || null, appsetting.detractioncode || null, appsetting.detraction || null, appsetting.detractionaccount, invoicedata?.FechaEmision, appsetting.location, appsetting.invoiceprovider, null, requestId);

                if ((parameters.contactcountry === "PE") && (`${parameters.contactdocumentnumber}` === "1" || `${parameters.contactdocumentnumber}` === "4" || `${parameters.contactdocumentnumber}` === "7")) {
                    await genericfunctions.getCorrelative(corpid, orgid, invoiceresponse.invoiceid, "TICKETERROR", requestId);
                }
                else {
                    await genericfunctions.getCorrelative(corpid, orgid, invoiceresponse.invoiceid, "INVOICEERROR", requestId);
                }
            }
        }
    }
    catch (exception) {
        await genericfunctions.invoiceSunat(corpid, orgid, invoiceresponse.invoiceid, "ERROR", exception.message, null, null, null, null, null, null, appsetting.ruc, appsetting.businessname, appsetting.tradename, appsetting.fiscaladdress, appsetting.ubigeo, appsetting.emittertype, appsetting.annexcode, appsetting.printingformat, appsetting.sendtosunat, appsetting.returnpdf, appsetting.returnxmlsunat, appsetting.returnxml, appsetting.token, appsetting.sunaturl, appsetting.sunatusername, appsetting.xmlversion, appsetting.ublversion, `${parameters.contactdocumentnumber}`, parameters.contactdocumentnumber, parameters.companyname || parameters.contactnameorcompany, parameters.contactaddress, parameters.contactcountry, parameters.contactmail, documenttype, null, null, null, null, "typecredit_alcontado", null, null, null, null, appsetting.location, appsetting.invoiceprovider, null, requestId);

        if ((parameters.contactcountry === "PE") && (`${parameters.contactdocumentnumber}` === "1" || `${parameters.contactdocumentnumber}` === "4" || `${parameters.contactdocumentnumber}` === "7")) {
            await genericfunctions.getCorrelative(corpid, orgid, invoiceresponse.invoiceid, "TICKETERROR", requestId);
        }
        else {
            await genericfunctions.getCorrelative(corpid, orgid, invoiceresponse.invoiceid, "INVOICEERROR", requestId);
        }
    }

    if (sendmail) {
        const alertBodySuccess = await genericfunctions.searchDomain(1, 0, false, "PAYMENTSUBSCRIPTIONBODYSUCCESS", "SCHEDULER", requestId);
        const alertBodyError = await genericfunctions.searchDomain(1, 0, false, "PAYMENTSUBSCRIPTIONBODYERROR", "SCHEDULER", requestId);
        const alertSubject = await genericfunctions.searchDomain(1, 0, false, "PAYMENTSUBSCRIPTIONSUBJECT", "SCHEDULER", requestId);

        if (alertBodySuccess && alertBodyError && alertSubject) {
            let mailBodySuccess = alertBodySuccess.domainvalue;
            let mailBodyError = alertBodyError.domainvalue;
            let mailSubject = alertSubject.domainvalue;

            mailBodySuccess = mailBodySuccess.split("{{clientaddress}}").join(parameters.contactaddress);
            mailBodySuccess = mailBodySuccess.split("{{clientcountry}}").join(parameters.contactcountry);
            mailBodySuccess = mailBodySuccess.split("{{clientdocument}}").join(parameters.contactdocumentnumber);
            mailBodySuccess = mailBodySuccess.split("{{clientmail}}").join(parameters.contactmail);
            mailBodySuccess = mailBodySuccess.split("{{clientname}}").join(parameters.contactnameorcompany);
            mailBodySuccess = mailBodySuccess.split("{{clientphone}}").join(parameters.contactphone);
            mailBodySuccess = mailBodySuccess.split("{{companyname}}").join(parameters.companyname);
            mailBodySuccess = mailBodySuccess.split("{{laraigoplan}}").join(parameters.paymentplan);
            mailBodySuccess = mailBodySuccess.split("{{month}}").join(billingmonth);
            mailBodySuccess = mailBodySuccess.split("{{year}}").join(billingyear);

            mailBodyError = mailBodyError.split("{{clientaddress}}").join(parameters.contactaddress);
            mailBodyError = mailBodyError.split("{{clientcountry}}").join(parameters.contactcountry);
            mailBodyError = mailBodyError.split("{{clientdocument}}").join(parameters.contactdocumentnumber);
            mailBodyError = mailBodyError.split("{{clientmail}}").join(parameters.contactmail);
            mailBodyError = mailBodyError.split("{{clientname}}").join(parameters.contactnameorcompany);
            mailBodyError = mailBodyError.split("{{clientphone}}").join(parameters.contactphone);
            mailBodyError = mailBodyError.split("{{companyname}}").join(parameters.companyname);
            mailBodyError = mailBodyError.split("{{laraigoplan}}").join(parameters.paymentplan);
            mailBodyError = mailBodyError.split("{{month}}").join(genericfunctions.getMonth(billingmonth));
            mailBodyError = mailBodyError.split("{{year}}").join(billingyear);

            mailSubject = mailSubject.split("{{clientaddress}}").join(parameters.contactaddress);
            mailSubject = mailSubject.split("{{clientcountry}}").join(parameters.contactcountry);
            mailSubject = mailSubject.split("{{clientdocument}}").join(parameters.contactdocumentnumber);
            mailSubject = mailSubject.split("{{clientmail}}").join(parameters.contactmail);
            mailSubject = mailSubject.split("{{clientname}}").join(parameters.contactnameorcompany);
            mailSubject = mailSubject.split("{{clientphone}}").join(parameters.contactphone);
            mailSubject = mailSubject.split("{{companyname}}").join(parameters.companyname);
            mailSubject = mailSubject.split("{{laraigoplan}}").join(parameters.paymentplan);
            mailSubject = mailSubject.split("{{month}}").join(genericfunctions.getMonth(billingmonth));
            mailSubject = mailSubject.split("{{year}}").join(billingyear);

            await axiosObservable({
                data: {
                    mailAddress: parameters.contactmail,
                    mailBody: invoiceSuccess ? mailBodySuccess : mailBodyError,
                    mailTitle: mailSubject,
                    attachments: [
                        {
                            type: "URL",
                            value: invoiceLink ? invoiceLink : null,
                        }
                    ]
                },
                method: "post",
                url: `${bridgeEndpoint}processscheduler/sendmail`,
                _requestid: requestId,
            });
        }
    }
}