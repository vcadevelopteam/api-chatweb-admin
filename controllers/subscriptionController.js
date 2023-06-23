const logger = require('../config/winston');
const bcryptjs = require("bcryptjs");
const channelfunctions = require("../config/channelfunctions");
const triggerfunctions = require("../config/triggerfunctions");
const jwt = require("jsonwebtoken");

const { getErrorCode, setSessionParameters, axiosObservable } = require('../config/helpers');

const cryptojs = require("crypto-js");

const ayrshareEndpoint = process.env.AYRSHARE;
const bridgeEndpoint = process.env.BRIDGE;
const brokerEndpoint = process.env.CHATBROKER;
const facebookEndpoint = process.env.FACEBOOKAPI;
const googleClientId = process.env.GOOGLE_CLIENTID;
const googleClientSecret = process.env.GOOGLE_CLIENTSECRET;
const googleTopicName = process.env.GOOGLE_TOPICNAME;
const hookEndpoint = process.env.HOOK;
const laraigoEndpoint = process.env.LARAIGO;
const linkedinEndpoint = process.env.LINKEDIN;
const linkedinTokenEndpoint = process.env.LINKEDINTOKEN;
const smoochEndpoint = process.env.SMOOCHAPI;
const smoochVersion = process.env.SMOOCHVERSION;
const telegramEndpoint = process.env.TELEGRAMAPI;
const userSecret = process.env.USERSECRET;
const webChatApplication = process.env.CHATAPPLICATION;
const webChatScriptEndpoint = process.env.WEBCHATSCRIPT;
const whitelist = process.env.WHITELIST;

exports.activateUser = async (request, response) => {
    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var requestCode = "error_unexpected_error";
        var requestMessage = "error_unexpected_error";
        var requestStatus = 400;
        var requestSuccess = false;

        if (typeof whitelist !== "undefined" && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return response.status(requestStatus).json({
                    code: "error_auth_error",
                    error: !requestSuccess,
                    message: "error_auth_error",
                    success: requestSuccess,
                });
            }
        }

        if (request.body) {
            var userCode = request.body.userCode;

            userCode = userCode.split("_EQUAL_").join("=");
            userCode = userCode.split("_PLUS_").join("+");
            userCode = userCode.split("_SLASH_").join("/");

            var userData = JSON.parse(cryptojs.AES.decrypt(userCode, userSecret).toString(cryptojs.enc.Utf8));

            var userMethod = "UFN_USER_ACTIVATE";
            var userParameters = {
                corpid: userData.corpid,
                userid: userData.userid,
                _requestid: request._requestid,
            };

            const queryActivateUser = await triggerfunctions.executesimpletransaction(userMethod, userParameters);

            if (queryActivateUser instanceof Array) {
                requestCode = "";
                requestMessage = "";
                requestStatus = 200;

                if (queryActivateUser.length > 0) {
                    requestSuccess = true;
                }
                else {
                    requestSuccess = false;
                }
            }
            else {
                requestCode = queryActivateUser.code;
            }
        }

        return response.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.changePassword = async (request, response) => {
    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var requestCode = "error_unexpected_error";
        var requestMessage = "error_unexpected_error";
        var requestStatus = 400;
        var requestSuccess = false;

        if (typeof whitelist !== "undefined" && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return response.status(requestStatus).json({
                    code: "error_auth_error",
                    error: !requestSuccess,
                    message: "error_auth_error",
                    success: requestSuccess,
                });
            }
        }

        if (request.body) {
            var userToken = request.body.token;

            userToken = userToken.split("_EQUAL_").join("=");
            userToken = userToken.split("_PLUS_").join("+");
            userToken = userToken.split("_SLASH_").join("/");

            var userData = JSON.parse(cryptojs.AES.decrypt(userToken, userSecret).toString(cryptojs.enc.Utf8));

            if (userData.userid) {
                var dateDifference = Math.abs(new Date().getTime() - new Date(userData.date).getTime()) / 3600000;

                if (dateDifference <= 24) {
                    var passwordMethod = "UFN_USERPASSWORD_UPDATE";
                    var passwordParameters = {
                        password: await bcryptjs.hash(request.body.password, await bcryptjs.genSalt(10)),
                        userid: userData.userid,
                        _requestid: request._requestid,
                    };

                    const queryUpdatePassword = await triggerfunctions.executesimpletransaction(passwordMethod, passwordParameters);

                    if (queryUpdatePassword instanceof Array) {
                        requestCode = "";
                        requestMessage = "";
                        requestStatus = 200;
                        requestSuccess = true;
                    }
                    else {
                        requestCode = queryUpdatePassword.code;
                    }
                }
                else {
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
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.countryList = async (request, response) => {
    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var requestData = null;
        var requestCode = "error_unexpected_error";
        var requestMessage = "error_unexpected_error";
        var requestStatus = 400;
        var requestSuccess = false;

        if (typeof whitelist !== "undefined" && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return response.status(requestStatus).json({
                    code: "error_auth_error",
                    error: !requestSuccess,
                    message: "error_auth_error",
                    success: requestSuccess,
                });
            }
        }

        const queryCountryGet = await triggerfunctions.executesimpletransaction("UFN_COUNTRY_SEL", { _requestid: request._requestid });

        if (queryCountryGet instanceof Array) {
            requestData = queryCountryGet;
            requestCode = "";
            requestMessage = "";
            requestStatus = 200;
            requestSuccess = true;
        }
        else {
            requestCode = queryCountryGet.code;
        }

        return response.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

const createLaraigoAccount = async (method, firstname, lastname, username, password, email, doctype, docnumber, phone, facebookid, googleid, join_reason, rolecompany, companysize, organizationname, paymentplanid, currency, country, businessname, fiscaladdress, sunatcountry, contactemail, contact, autosendinvoice, timezoneoffset, timezone, requestId) => {
    const queryString = method;
    const queryParameters = {
        firstname: firstname || null,
        lastname: lastname || null,
        username: username || null,
        password: password || null,
        email: email || null,
        doctype: doctype || null,
        docnumber: docnumber || null,
        phone: phone || null,
        facebookid: facebookid || null,
        googleid: googleid || null,
        join_reason: join_reason || null,
        rolecompany: rolecompany || null,
        companysize: companysize || null,
        organizationname: organizationname || null,
        paymentplanid: paymentplanid || null,
        currency: currency || null,
        country: country || null,
        businessname: businessname || null,
        fiscaladdress: fiscaladdress || null,
        sunatcountry: sunatcountry || null,
        contactemail: contactemail || null,
        contact: contact || null,
        autosendinvoice: autosendinvoice || null,
        timezoneoffset: timezoneoffset || null,
        timezone: timezone || null,
        _requestid: requestId || null,
    }

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);

    if (queryResult instanceof Array) {
        return queryResult[0];
    }

    return null;
}

exports.createSubscription = async (request, response) => {
    try {
        let requestCode = "error_unexpected_error";
        let requestMessage = "error_unexpected_error";
        let requestStatus = 400;
        let requestSuccess = false;

        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        if (typeof whitelist !== "undefined" && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return response.status(requestStatus).json({
                    code: "error_auth_error",
                    error: !requestSuccess,
                    message: "error_auth_error",
                    success: requestSuccess,
                });
            }
        }

        if (request.body) {
            const { method, card = {}, parameters = {} } = request.body;

            let paymentcarddata = null;
            let paymentcarderror = false;

            if (card) {
                const appsetting = await getAppSetting(request._requestid);

                if (appsetting) {
                    card.cardnumber = card.cardnumber.split(" ").join("");

                    const requestCulqiCreateClient = await axiosObservable({
                        data: {
                            address: (parameters.contactaddress || '').substring(0, 100),
                            addressCity: (parameters.timezone || '').substring(0, 30),
                            bearer: appsetting.privatekey,
                            countryCode: parameters.contactcountry,
                            email: (parameters.contactmail || '').substring(0, 50),
                            firstName: (parameters.contactnameorcompany || '').substring(0, 50),
                            lastName: (parameters.contactnameorcompany || '').substring(0, 50),
                            operation: "CREATE",
                            phoneNumber: (parameters.contactphone || "").split("+").join("").split(" ").join("").split("(").join("").split(")").join(""),
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
                                email: parameters.contactmail,
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
                        }
                        else {
                            paymentcarderror = true;
                            requestMessage = "error_card_card";

                            if (requestCulqiCreateCard.data.operationMessage) {
                                let errorData = JSON.parse(requestCulqiCreateCard.data.operationMessage);

                                if (errorData.user_message) {
                                    requestMessage = errorData.user_message;
                                }

                                if (errorData.merchant_message) {
                                    requestMessage = errorData.merchant_message;
                                }
                            }
                        }
                    }
                    else {
                        paymentcarderror = true;
                        requestMessage = "error_card_client";

                        if (requestCulqiCreateClient.data.operationMessage) {
                            let errorData = JSON.parse(requestCulqiCreateClient.data.operationMessage);

                            if (errorData.user_message) {
                                requestMessage = errorData.user_message;
                            }

                            if (errorData.merchant_message) {
                                requestMessage = errorData.merchant_message;
                            }
                        }
                    }
                }
                else {
                    paymentcarderror = true;
                    requestMessage = "error_card_configuration";
                }
            }
            else {
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

            parameters.loginpassword = await bcryptjs.hash(parameters.loginpassword, await bcryptjs.genSalt(10));

            if (parameters.loginfacebookid) {
                parameters.loginusername = parameters.loginfacebookid;
            }

            if (parameters.logingoogleid) {
                parameters.loginusername = parameters.logingoogleid;
            }

            const subscriptionLaraigo = await createLaraigoAccount(method, parameters.contactnameorcompany, null, parameters.loginusername, parameters.loginpassword, parameters.contactmail, parameters.contactdocumenttype, parameters.contactdocumentnumber, parameters.contactphone, parameters.loginfacebookid, parameters.logingoogleid, null, null, null, parameters.contactnameorcompany, parameters.paymentplanid, parameters.contactcurrency, parameters.contactcountry, parameters.contactnameorcompany, parameters.contactaddress, parameters.contactcountry, parameters.contactmail, parameters.contactnameorcompany, true, parameters.timezoneoffset, parameters.timezone, request._requestid);

            if (subscriptionLaraigo) {
                let corpId = subscriptionLaraigo.corpid;
                let orgId = subscriptionLaraigo.orgid;
                let userId = subscriptionLaraigo.userid;

                if (paymentcarddata) {
                    let cardMethod = "UFN_PAYMENTCARD_INS";
                    let cardParameters = {
                        corpid: corpId,
                        orgid: orgId,
                        id: 0,
                        cardnumber: paymentcarddata.source.cardNumber,
                        cardcode: paymentcarddata.id,
                        firstname: (parameters.contactnameorcompany || '').substring(0, 50),
                        lastname: (parameters.contactnameorcompany || '').substring(0, 50),
                        mail: (parameters.contactmail || '').substring(0, 50),
                        favorite: true,
                        clientcode: paymentcarddata.customerId,
                        status: "ACTIVO",
                        phone: (parameters.contactphone || "").split("+").join("").split(" ").join("").split("(").join("").split(")").join(""),
                        type: "",
                        username: parameters.loginusername,
                        operation: "INSERT",
                        _requestid: request._requestid,
                    };

                    const queryCardCreate = await triggerfunctions.executesimpletransaction(cardMethod, cardParameters);

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

                if ((typeof parameters.loginfacebookid !== "undefined" && parameters.loginfacebookid) || (typeof parameters.logingoogleid !== "undefined" && parameters.logingoogleid)) {
                    let userMethod = "UFN_USER_ACTIVATE";
                    let userParameters = {
                        corpid: corpId,
                        userid: userId,
                        _requestid: request._requestid,
                    };

                    const queryActivateUser = await triggerfunctions.executesimpletransaction(userMethod, userParameters);

                    if (queryActivateUser instanceof Array) {
                        requestCode = "";
                        requestMessage = "";
                        requestStatus = 200;
                        requestSuccess = true;
                    }
                    else {
                        requestMessage = "subscription_user_activate_error";
                    }
                }
                else {
                    let domainMethod = "UFN_DOMAIN_VALUES_SEL";
                    let domainParameters = {
                        all: false,
                        corpid: 1,
                        domainname: "ACTIVATEBODY",
                        orgid: 0,
                        username: parameters.loginusername,
                        _requestid: request._requestid,
                    };

                    const transactionGetBody = await triggerfunctions.executesimpletransaction(domainMethod, domainParameters);

                    domainParameters.domainname = "ACTIVATESUBJECT";

                    const transactionGetSubject = await triggerfunctions.executesimpletransaction(domainMethod, domainParameters);

                    if (transactionGetBody instanceof Array && transactionGetSubject instanceof Array) {
                        if (transactionGetBody.length > 0 && transactionGetSubject.length > 0) {
                            let userCode = cryptojs.AES.encrypt(JSON.stringify({
                                corpid: corpId,
                                userid: userId,
                            }), userSecret).toString();

                            userCode = userCode.split("=").join("_EQUAL_");
                            userCode = userCode.split("+").join("_PLUS_");
                            userCode = userCode.split("/").join("_SLASH_");

                            let alertBody = transactionGetBody[0].domainvalue;
                            let alertSubject = transactionGetSubject[0].domainvalue;

                            alertBody = alertBody.split("{{address}}").join(parameters.contactaddress);
                            alertBody = alertBody.split("{{channeldata}}").join('');
                            alertBody = alertBody.split("{{country}}").join(parameters.contactcountry);
                            alertBody = alertBody.split("{{countryname}}").join(parameters.contactcountryname);
                            alertBody = alertBody.split("{{firstname}}").join(parameters.contactnameorcompany);
                            alertBody = alertBody.split("{{lastname}}").join('');
                            alertBody = alertBody.split("{{link}}").join(`${laraigoEndpoint}activateuser/${encodeURIComponent(userCode)}`);
                            alertBody = alertBody.split("{{organizationname}}").join(parameters.contactcountryname);
                            alertBody = alertBody.split("{{paymentplan}}").join(parameters.paymentplan);
                            alertBody = alertBody.split("{{username}}").join(parameters.loginusername);

                            alertSubject = alertSubject.split("{{address}}").join(parameters.contactaddress);
                            alertSubject = alertSubject.split("{{channeldata}}").join('');
                            alertSubject = alertSubject.split("{{country}}").join(parameters.contactcountry);
                            alertSubject = alertSubject.split("{{countryname}}").join(parameters.contactcountryname);
                            alertSubject = alertSubject.split("{{firstname}}").join(parameters.contactnameorcompany);
                            alertSubject = alertSubject.split("{{lastname}}").join('');
                            alertSubject = alertSubject.split("{{link}}").join(`${laraigoEndpoint}activateuser/${encodeURIComponent(userCode)}`);
                            alertSubject = alertSubject.split("{{organizationname}}").join(parameters.contactcountryname);
                            alertSubject = alertSubject.split("{{paymentplan}}").join(parameters.paymentplan);
                            alertSubject = alertSubject.split("{{username}}").join(parameters.loginusername);

                            const requestMailSend = await axiosObservable({
                                data: {
                                    mailAddress: parameters.loginusername,
                                    mailBody: alertBody,
                                    mailTitle: alertSubject,
                                },
                                method: "post",
                                url: `${bridgeEndpoint}processscheduler/sendmail`,
                                _requestid: request._requestid,
                            });

                            if (requestMailSend.data.success) {
                                requestCode = "";
                                requestMessage = "";
                                requestStatus = 200;
                                requestSuccess = true;
                            }
                            else {
                                requestMessage = "error_subscription_activation_failure";
                            }
                        }
                        else {
                            requestMessage = "error_subscription_activation_error";
                        }
                    }
                    else {
                        requestMessage = "error_subscription_activation_error";
                    }
                }
            }
            else {
                requestMessage = "subscription_user_create_error";
            }
        }

        return response.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
}

exports.currencyList = async (request, response) => {
    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var requestCode = "error_unexpected_error";
        var requestData = null;
        var requestMessage = "error_unexpected_error";
        var requestStatus = 400;
        var requestSuccess = false;

        if (typeof whitelist !== "undefined" && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return response.status(requestStatus).json({
                    code: "error_auth_error",
                    data: requestData,
                    error: !requestSuccess,
                    message: "error_auth_error",
                    success: requestSuccess,
                });
            }
        }

        const queryCurrencySel = await triggerfunctions.executesimpletransaction("UFN_CURRENCY_SEL", { _requestid: request._requestid });

        if (queryCurrencySel instanceof Array) {
            requestCode = "";
            requestData = queryCurrencySel;
            requestMessage = "";
            requestStatus = 200;
            requestSuccess = true;
        }
        else {
            requestCode = queryCurrencySel.code;
        }

        return response.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.getContract = async (request, response) => {
    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var requestCode = "error_unexpected_error";
        var requestData = null;
        var requestMessage = "error_unexpected_error";
        var requestStatus = 400;
        var requestSuccess = false;

        if (typeof whitelist !== "undefined" && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return response.status(requestStatus).json({
                    code: "error_auth_error",
                    data: requestData,
                    error: !requestSuccess,
                    message: "error_auth_error",
                    success: requestSuccess,
                });
            }
        }

        if (request.body) {
            var { parameters = {} } = request.body;

            parameters._requestid = request._requestid;

            const queryContractGet = await triggerfunctions.executesimpletransaction("GET_CONTRACT", parameters);

            if (queryContractGet instanceof Array) {
                if (queryContractGet.length > 0) {
                    requestCode = "";
                    requestData = queryContractGet;
                    requestMessage = "";
                    requestStatus = 200;
                    requestSuccess = true;
                }
            }
            else {
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
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.getPageList = async (request, response) => {
    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var requestCode = "error_unexpected_error";
        var requestData = null;
        var requestMessage = "error_unexpected_error";
        var requestStatus = 400;
        var requestSuccess = false;

        if (typeof whitelist !== "undefined" && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return response.status(requestStatus).json({
                    code: "error_auth_error",
                    error: !requestSuccess,
                    message: "error_auth_error",
                    pageData: requestData,
                    success: requestSuccess,
                });
            }
        }

        if (request.body) {
            const requestFacebookPages = await axiosObservable({
                data: {
                    accessToken: request.body.accessToken,
                    appId: request.body.appId,
                    linkType: "GETPAGES",
                },
                method: "post",
                url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`,
                _requestid: request._requestid,
            });

            if (requestFacebookPages.data.success) {
                requestCode = "";
                requestData = requestFacebookPages.data.pageData;
                requestMessage = "";
                requestStatus = 200;
                requestSuccess = true;
            }
            else {
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
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.recoverPassword = async (request, response) => {
    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var requestCode = "error_unexpected_error";
        var requestMessage = "error_unexpected_error";
        var requestStatus = 400;
        var requestSuccess = false;

        if (typeof whitelist !== "undefined" && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return response.status(requestStatus).json({
                    code: "error_auth_error",
                    error: !requestSuccess,
                    message: "error_auth_error",
                    success: requestSuccess,
                });
            }
        }

        if (request.body) {
            var userMethod = "UFN_USERBYUSER";
            var userParameters = {
                username: request.body.username,
                _requestid: request._requestid,
            };

            const queryUserGet = await triggerfunctions.executesimpletransaction(userMethod, userParameters);

            if (queryUserGet instanceof Array) {
                if (queryUserGet.length > 0) {
                    var validMail = false;

                    if (typeof queryUserGet[0].email !== "undefined" && queryUserGet[0].email) {
                        if (validateEmail(queryUserGet[0].email) !== null) {
                            validMail = true;
                        }
                    }

                    if (validMail) {
                        var domainMethod = "UFN_DOMAIN_VALUES_SEL";
                        var domainParameters = {
                            all: false,
                            corpid: 1,
                            domainname: "RECOVERPASSBODY",
                            orgid: 0,
                            username: request.body.username,
                            _requestid: request._requestid,
                        };

                        const queryDomainBodySel = await triggerfunctions.executesimpletransaction(domainMethod, domainParameters);

                        domainParameters.domainname = "RECOVERPASSSUBJECT";

                        const queryDomainSubjectSel = await triggerfunctions.executesimpletransaction(domainMethod, domainParameters);

                        if (queryDomainBodySel instanceof Array && queryDomainSubjectSel instanceof Array) {
                            if (queryDomainBodySel.length > 0 && queryDomainSubjectSel.length > 0) {
                                var alertBody = queryDomainBodySel[0].domainvalue;
                                var alertSubject = queryDomainSubjectSel[0].domainvalue;

                                var linkCode = cryptojs.AES.encrypt(JSON.stringify({
                                    userid: queryUserGet[0].userid,
                                    date: new Date().getTime(),
                                }), userSecret).toString();

                                linkCode = linkCode.split("=").join("_EQUAL_");
                                linkCode = linkCode.split("+").join("_PLUS_");
                                linkCode = linkCode.split("/").join("_SLASH_");

                                alertBody = alertBody.split("{{docnum}}").join(queryUserGet[0].docnum);
                                alertBody = alertBody.split("{{doctype}}").join(queryUserGet[0].doctype);
                                alertBody = alertBody.split("{{email}}").join(queryUserGet[0].email);
                                alertBody = alertBody.split("{{firstname}}").join(queryUserGet[0].firstname);
                                alertBody = alertBody.split("{{lastname}}").join(queryUserGet[0].lastname);
                                alertBody = alertBody.split("{{link}}").join(`${laraigoEndpoint}recoverpassword/${encodeURIComponent(linkCode)}`);
                                alertBody = alertBody.split("{{userid}}").join(queryUserGet[0].userid);
                                alertBody = alertBody.split("{{usr}}").join(queryUserGet[0].usr);

                                alertSubject = alertSubject.split("{{docnum}}").join(queryUserGet[0].docnum);
                                alertSubject = alertSubject.split("{{doctype}}").join(queryUserGet[0].doctype);
                                alertSubject = alertSubject.split("{{email}}").join(queryUserGet[0].email);
                                alertSubject = alertSubject.split("{{firstname}}").join(queryUserGet[0].firstname);
                                alertSubject = alertSubject.split("{{lastname}}").join(queryUserGet[0].lastname);
                                alertSubject = alertSubject.split("{{link}}").join(`${laraigoEndpoint}recoverpassword/${encodeURIComponent(linkCode)}`);
                                alertSubject = alertSubject.split("{{userid}}").join(queryUserGet[0].userid);
                                alertSubject = alertSubject.split("{{usr}}").join(queryUserGet[0].usr);

                                const requestMailSend = await axiosObservable({
                                    data: {
                                        mailAddress: queryUserGet[0].email,
                                        mailBody: alertBody,
                                        mailTitle: alertSubject,
                                    },
                                    method: "post",
                                    url: `${bridgeEndpoint}processscheduler/sendmail`,
                                    _requestid: request._requestid,
                                });

                                if (requestMailSend.data.success) {
                                    requestCode = "";
                                    requestMessage = "";
                                    requestStatus = 200;
                                    requestSuccess = true;
                                }
                                else {
                                    requestMessage = "recoverpassword_sendfailure";
                                }
                            }
                            else {
                                requestMessage = "recoverpassword_missingconfiguration";
                            }
                        }
                        else {
                            requestMessage = "recoverpassword_missingconfiguration";
                        }
                    }
                    else {
                        requestMessage = "recoverpassword_usernotmail";
                    }
                }
                else {
                    requestMessage = "recoverpassword_usernotfound";
                }
            }
            else {
                requestCode = queryUserGet.code;
            }
        }

        return response.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.validateChannels = async (request, response) => {
    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var requestCode = "error_unexpected_error";
        var requestMessage = "error_unexpected_error";
        var requestStatus = 400;
        var requestSuccess = false;

        if (typeof whitelist !== "undefined" && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return response.status(requestStatus).json({
                    code: "error_auth_error",
                    error: !requestSuccess,
                    message: "error_auth_error",
                    success: requestSuccess,
                });
            }
        }

        if (request.body) {
            var { channellist = [] } = request.body;

            var channelMethodArray = [];
            var channelParametersArray = [];
            var channelServiceArray = [];

            if (channellist instanceof Array) {
                var channelError = false;

                for (const channel of channellist) {
                    if (channel && !channelError) {
                        var channelMethod = channel.method ? channel.method : "UFN_COMMUNICATIONCHANNEL_INS";
                        var channelParameters = channel.parameters;
                        var channelService = channel.service;

                        channelParameters.appintegrationid = null;
                        channelParameters.botconfigurationid = null;
                        channelParameters.botenabled = null;
                        channelParameters.channelparameters = null;
                        channelParameters.chatflowenabled = true;
                        channelParameters.coloricon = channelParameters.coloricon || null;
                        channelParameters.communicationchannelcontact = "";
                        channelParameters.communicationchanneltoken = null;
                        channelParameters.country = null;
                        channelParameters.customicon = null;
                        channelParameters.motive = "SUBSCRIPTION";
                        channelParameters.operation = "INSERT";
                        channelParameters.phone = null;
                        channelParameters.resolvelithium = null;
                        channelParameters.schedule = null;
                        channelParameters.status = "PENDIENTE";
                        channelParameters.updintegration = null;
                        channelParameters.apikey = null;
                        channelParameters.voximplantrecording = null;
                        channelParameters.voximplantwelcometone = null;
                        channelParameters.voximplantholdtone = null;
                        channelParameters.voximplantcallsupervision = null;
                        channelParameters._requestid = request._requestid;

                        requestCode = channel.type;

                        switch (channel.type) {
                            case "FACEBOOK":
                            case "INSTAGRAM":
                            case "INSTAMESSENGER":
                            case "MESSENGER":
                                if (channelService.accesstoken) {
                                    var businessId = null;
                                    var channelLinkService = null;
                                    var channelType = null;
                                    var serviceType = null;

                                    switch (channel.type) {
                                        case "FACEBOOK":
                                            channelLinkService = "WALLADD";
                                            channelType = "FBWA";
                                            serviceType = "WALL";
                                            break;

                                        case "INSTAGRAM":
                                            channelLinkService = "INSTAGRAMADD";
                                            channelType = "INST";
                                            serviceType = "INSTAGRAM";
                                            break;

                                        case "INSTAMESSENGER":
                                            channelLinkService = "INSTAGRAMADD";
                                            channelType = "INDM";
                                            serviceType = "INSTAGRAM";
                                            break;

                                        case "MESSENGER":
                                            channelLinkService = "MESSENGERADD";
                                            channelType = "FBDM";
                                            serviceType = "MESSENGER";
                                            break;
                                    }

                                    if (channel.type === "INSTAGRAM" || channel.type === "INSTAMESSENGER") {
                                        const requestInstagramBusiness = await axiosObservable({
                                            data: {
                                                accessToken: channelService.accesstoken,
                                                linkType: "GETBUSINESS",
                                                siteId: channelService.siteid,
                                            },
                                            method: "post",
                                            url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`,
                                            _requestid: request._requestid,
                                        });

                                        if (requestInstagramBusiness.data.success) {
                                            businessId = requestInstagramBusiness.data.businessId;
                                        }
                                        else {
                                            channelError = true;
                                            requestMessage = "subscription_facebook_business_error";
                                            break;
                                        }
                                    }

                                    const requestFacebookLink = await axiosObservable({
                                        data: {
                                            accessToken: channelService.accesstoken,
                                            linkType: channelLinkService,
                                            siteId: channelService.siteid,
                                        },
                                        method: "post",
                                        url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`,
                                        _requestid: request._requestid,
                                    });

                                    if (requestFacebookLink.data.success) {
                                        var serviceCredentials = {
                                            accessToken: channelService.accesstoken,
                                            endpoint: facebookEndpoint,
                                            serviceType: serviceType,
                                            siteId: channelService.siteid,
                                        };

                                        if (typeof businessId !== "undefined" && businessId) {
                                            channelParameters.communicationchannelowner = channelService.siteid;
                                            channelParameters.communicationchannelsite = businessId;

                                            serviceCredentials.siteId = businessId;
                                        }

                                        channelParameters.servicecredentials = JSON.stringify(serviceCredentials);
                                        channelParameters.type = channelType;

                                        channelMethodArray.push(channelMethod);
                                        channelParametersArray.push(channelParameters);
                                        channelServiceArray.push(channelService);
                                    }
                                    else {
                                        channelError = true;
                                        requestMessage = "subscription_facebook_link_error";
                                        break;
                                    }
                                }
                                else {
                                    channelError = true;
                                    requestMessage = "subscription_facebook_token_error";
                                    break;
                                }
                                break;

                            case "TELEGRAM":
                                const requestTelegramLink = await axiosObservable({
                                    data: {
                                        accessToken: channelService.accesstoken,
                                        linkType: "TELEGRAMADD",
                                    },
                                    method: "post",
                                    url: `${bridgeEndpoint}processlaraigo/telegram/managetelegramlink`,
                                    _requestid: request._requestid,
                                });

                                if (requestTelegramLink.data.success) {
                                    var serviceCredentials = {
                                        bot: requestTelegramLink.data.botName,
                                        endpoint: telegramEndpoint,
                                        token: channelService.accesstoken,
                                    };

                                    channelParameters.communicationchannelsite = requestTelegramLink.data.botName;
                                    channelParameters.servicecredentials = JSON.stringify(serviceCredentials);
                                    channelParameters.type = "TELE";

                                    channelMethodArray.push(channelMethod);
                                    channelParametersArray.push(channelParameters);
                                    channelServiceArray.push(channelService);
                                }
                                else {
                                    channelError = true;
                                    requestMessage = "subscription_telegram_link_error";
                                    break;
                                }
                                break;

                            case "TWITTER":
                            case "TWITTERDM":
                                const requestTwitterBusiness = await axiosObservable({
                                    data: {
                                        accessSecret: channelService.accesssecret,
                                        accessToken: channelService.accesstoken,
                                        consumerKey: channelService.consumerkey,
                                        consumerSecret: channelService.consumersecret,
                                        developmentEnvironment: channelService.devenvironment,
                                        linkType: "GETPAGEID",
                                    },
                                    method: "post",
                                    url: `${bridgeEndpoint}processlaraigo/twitter/managetwitterlink`,
                                    _requestid: request._requestid,
                                });

                                if (requestTwitterBusiness.data.success) {
                                    var serviceCredentials = {
                                        accessSecret: channelService.accesssecret,
                                        accessToken: channelService.accesstoken,
                                        consumerKey: channelService.consumerkey,
                                        consumerSecret: channelService.consumersecret,
                                        devEnvironment: channelService.devenvironment,
                                        twitterPageId: requestTwitterBusiness.data.pageId
                                    };

                                    channelParameters.communicationchannelsite = requestTwitterBusiness.data.pageId;
                                    channelParameters.servicecredentials = JSON.stringify(serviceCredentials);

                                    if (channel.type === "TWITTER") {
                                        channelParameters.type = "TWIT";
                                    }
                                    else {
                                        channelParameters.type = "TWMS";
                                    }

                                    var channelParametersDummy = channelParameters;

                                    channelParametersDummy.corpid = 1;
                                    channelParametersDummy.orgid = 1;
                                    channelParametersDummy.status = "ACTIVO";
                                    channelParametersDummy.username = "API";

                                    const queryTwitterInsert = await triggerfunctions.executesimpletransaction(channelMethod, channelParametersDummy);

                                    if (queryTwitterInsert instanceof Array) {
                                        const requestTwitterLink = await axiosObservable({
                                            data: {
                                                accessSecret: channelService.accesssecret,
                                                accessToken: channelService.accesstoken,
                                                consumerKey: channelService.consumerkey,
                                                consumerSecret: channelService.consumersecret,
                                                developmentEnvironment: channelService.devenvironment,
                                                linkType: "TWITTERADD",
                                                pageId: requestTwitterBusiness.data.pageId,
                                            },
                                            method: "post",
                                            url: `${bridgeEndpoint}processlaraigo/twitter/managetwitterlink`,
                                            _requestid: request._requestid,
                                        });

                                        if (!requestTwitterLink.data.success) {
                                            channelError = true;
                                            requestMessage = "subscription_twitter_link_error";
                                            break;
                                        }

                                        channelParametersDummy.id = queryTwitterInsert[0].ufn_communicationchannel_ins;
                                        channelParametersDummy.operation = "UPDATE";
                                        channelParametersDummy.status = "ELIMINADO";

                                        const queryTwitterDelete = await triggerfunctions.executesimpletransaction(channelMethod, channelParametersDummy);

                                        if (queryTwitterDelete instanceof Array) {
                                            channelParameters.corpid = null;
                                            channelParameters.id = null;
                                            channelParameters.operation = "INSERT";
                                            channelParameters.orgid = null;
                                            channelParameters.status = "PENDIENTE";
                                            channelParameters.username = null;

                                            channelMethodArray.push(channelMethod);
                                            channelParametersArray.push(channelParameters);
                                            channelServiceArray.push(channelService);
                                        }
                                        else {
                                            channelError = true;
                                            requestMessage = "subscription_twitter_dummy_error";
                                            break;
                                        }
                                    }
                                    else {
                                        channelError = true;
                                        requestMessage = "subscription_twitter_dummy_error";
                                        break;
                                    }
                                }
                                else {
                                    channelError = true;
                                    requestMessage = "subscription_twitter_business_error";
                                    break;
                                }
                                break;
                        }
                    }
                }

                if (channelError) {
                    return response.status(requestStatus).json({
                        code: requestCode,
                        error: !requestSuccess,
                        message: requestMessage,
                        success: requestSuccess,
                    });
                }
            }

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
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.validateUserId = async (request, response) => {
    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var requestCode = "error_unexpected_error";
        var requestMessage = "error_unexpected_error";
        var requestStatus = 400;
        var requestSuccess = false;

        if (typeof whitelist !== "undefined" && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return response.status(requestStatus).json({
                    code: "error_auth_error",
                    error: !requestSuccess,
                    message: "error_auth_error",
                    success: requestSuccess,
                });
            }
        }

        if (request.body) {
            var { method, parameters = {} } = request.body;

            setSessionParameters(parameters, request.user, request._requestid);

            parameters.password = await bcryptjs.hash(parameters.password, await bcryptjs.genSalt(10));
            parameters.userid = request.user.userid;

            const queryUserSel = await triggerfunctions.executesimpletransaction(method, parameters);

            if (queryUserSel instanceof Array) {
                if (queryUserSel.length > 0) {
                    parameters.password = await bcryptjs.hash(parameters.newpassword, await bcryptjs.genSalt(10));

                    const queryUserUpdate = await triggerfunctions.executesimpletransaction("UFN_USER_UPDATE", parameters);

                    if (queryUserUpdate instanceof Array) {
                        requestCode = "";
                        requestMessage = "";
                        requestStatus = 200;
                        requestSuccess = true;
                    }
                    else {
                        requestCode = queryUserUpdate.code;
                    }
                }
                else {
                    requestMessage = "validateuser_mismatch";
                }
            }
            else {
                requestCode = queryUserSel.code;
            }
        }

        return response.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.validateUsername = async (request, response) => {
    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var requestCode = "error_unexpected_error";
        var requestIsValid = false;
        var requestMessage = "error_unexpected_error";
        var requestStatus = 400;
        var requestSuccess = false;

        if (typeof whitelist !== "undefined" && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return response.status(requestStatus).json({
                    code: "error_auth_error",
                    error: !requestSuccess,
                    isvalid: requestIsValid,
                    message: "error_auth_error",
                    success: requestSuccess,
                });
            }
        }

        if (request.body) {
            var { method, parameters = {} } = request.body;

            if (typeof parameters.facebookid !== "undefined" && parameters.facebookid) {
                parameters.googleid = null;
                parameters.usr = null;
                parameters._requestid = request._requestid;
            }

            if (typeof parameters.googleid !== "undefined" && parameters.googleid) {
                parameters.facebookid = null;
                parameters.usr = null;
                parameters._requestid = request._requestid;
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
            }
            else {
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
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

const getAppSetting = async (requestId) => {
    const queryAppSettingGet = await triggerfunctions.executesimpletransaction("UFN_APPSETTING_INVOICE_SEL", { _requestid: requestId });

    if (queryAppSettingGet instanceof Array) {
        if (queryAppSettingGet.length > 0) {
            return queryAppSettingGet[0];
        }
    }

    return null;
}

const validateEmail = (email) => {
    return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
};