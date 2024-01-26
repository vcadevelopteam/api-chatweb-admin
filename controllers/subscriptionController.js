const { axiosObservable, getErrorCode, setSessionParameters } = require("../config/helpers");

const bcryptjs = require("bcryptjs");
const triggerfunctions = require("../config/triggerfunctions");

const cryptojs = require("crypto-js");

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

const createLaraigoAccount = async (
    method,
    firstname,
    lastname,
    username,
    password,
    email,
    doctype,
    docnumber,
    phone,
    facebookid,
    googleid,
    join_reason,
    rolecompany,
    companysize,
    organizationname,
    paymentplanid,
    currency,
    country,
    businessname,
    fiscaladdress,
    sunatcountry,
    contactemail,
    contact,
    autosendinvoice,
    timezoneoffset,
    timezone,
    requestId
) => {
    const queryResult = await triggerfunctions.executesimpletransaction(method, {
        _requestid: requestId || null,
        autosendinvoice: autosendinvoice || null,
        businessname: businessname || null,
        companysize: companysize || null,
        contact: contact || null,
        contactemail: contactemail || null,
        country: country || null,
        currency: currency || null,
        docnumber: docnumber || null,
        doctype: doctype || null,
        email: email || null,
        facebookid: facebookid || null,
        firstname: firstname || null,
        fiscaladdress: fiscaladdress || null,
        googleid: googleid || null,
        join_reason: join_reason || null,
        lastname: lastname || null,
        organizationname: organizationname || null,
        password: password || null,
        paymentplanid: paymentplanid || null,
        phone: phone || null,
        rolecompany: rolecompany || null,
        sunatcountry: sunatcountry || null,
        timezone: timezone || null,
        timezoneoffset: timezoneoffset || null,
        username: username || null,
    });

    if (queryResult instanceof Array) {
        return queryResult[0];
    }

    return null;
};

const removeSpecialCharacter = (text) => {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

exports.createSubscription = async (request, response) => {
    try {
        let requestCode = "error_unexpected_error";
        let requestMessage = "error_unexpected_error";
        let requestStatus = 400;
        let requestSuccess = false;

        if (request.body) {
            let { method, card = {}, channel = {}, parameters = {} } = request.body;

            let paymentcarddata = null;
            let paymentcarderror = false;

            if (card) {
                const appsetting = await getAppSettingSingle(0, 0, request._requestid);

                if (appsetting) {
                    card.cardnumber = card.cardnumber.split(" ").join("");

                    const requestCulqiCreateClient = await axiosObservable({
                        _requestid: request._requestid,
                        method: "post",
                        url: `${bridgeEndpoint}processculqi/handleclient`,
                        data: {
                            address: `${removeSpecialCharacter(parameters.contactaddress || "EMPTY").slice(0, 100)}`,
                            addressCity: `${removeSpecialCharacter(parameters.timezone || "EMPTY").slice(0, 30)}`,
                            bearer: appsetting.privatekey,
                            countryCode: `${parameters.contactcountry || "PE"}`,
                            email: `${parameters.contactmail || "generic@mail.com"}`,
                            firstName: `${removeSpecialCharacter(
                                parameters?.contactnameorcompany.replace(/[0-9]/g, "") || "EMPTY"
                            ).slice(0, 50)}`,
                            lastName: `${removeSpecialCharacter(
                                parameters?.contactnameorcompany.replace(/[0-9]/g, "") || "EMPTY"
                            ).slice(0, 50)}`,
                            operation: "CREATE",
                            phoneNumber: `${(parameters.contactphone
                                ? parameters.contactphone.replace(/[^0-9]/g, "")
                                : "51999999999"
                            ).slice(0, 15)}`,
                            url: appsetting.culqiurlclient,
                        },
                    });

                    if (requestCulqiCreateClient.data.success) {
                        const requestCulqiCreateCard = await axiosObservable({
                            _requestid: request._requestid,
                            method: "post",
                            url: `${bridgeEndpoint}processculqi/handlecard`,
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
                        });

                        if (requestCulqiCreateCard.data.success) {
                            paymentcarddata = requestCulqiCreateCard.data.result;
                        } else {
                            paymentcarderror = true;
                            requestMessage = "error_card_card";

                            if (requestCulqiCreateCard.data.operationMessage) {
                                let errorData = JSON.parse(requestCulqiCreateCard.data.operationMessage);

                                if (errorData.user_message) {
                                    requestMessage = errorData.user_message;
                                }

                                if (errorData.merchant_message) {
                                    requestMessage = errorData.merchant_message.split("https://www.culqi.com/api")[0];
                                }
                            }
                        }
                    } else {
                        paymentcarderror = true;
                        requestMessage = "error_card_client";

                        if (requestCulqiCreateClient.data.operationMessage) {
                            let errorData = JSON.parse(requestCulqiCreateClient.data.operationMessage);

                            if (errorData.user_message) {
                                requestMessage = errorData.user_message;
                            }

                            if (errorData.merchant_message) {
                                requestMessage = errorData.merchant_message.split("https://www.culqi.com/api")[0];
                            }
                        }
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

            parameters.loginpassword = await bcryptjs.hash(parameters.loginpassword, await bcryptjs.genSalt(10));

            if (parameters.loginfacebookid) {
                parameters.loginusername = parameters.loginfacebookid;
            }

            if (parameters.logingoogleid) {
                parameters.loginusername = parameters.logingoogleid;
            }

            const subscriptionLaraigo = await createLaraigoAccount(
                method,
                parameters.contactnameorcompany,
                null,
                parameters.loginusername,
                parameters.loginpassword,
                parameters.contactmail,
                parameters.contactdocumenttype,
                parameters.contactdocumentnumber,
                parameters.contactphone,
                parameters.loginfacebookid,
                parameters.logingoogleid,
                null,
                null,
                null,
                parameters.contactnameorcompany,
                parameters.paymentplanid,
                parameters.contactcurrency,
                parameters.contactcountry,
                parameters.contactnameorcompany,
                parameters.contactaddress,
                parameters.contactcountry,
                parameters.contactmail,
                parameters.contactnameorcompany,
                true,
                parameters.timezoneoffset,
                parameters.timezone,
                request._requestid
            );

            if (subscriptionLaraigo) {
                let corpId = subscriptionLaraigo.corpid;
                let orgId = subscriptionLaraigo.orgid;
                let userId = subscriptionLaraigo.userid;

                if (paymentcarddata) {
                    let cardParameters = {
                        _requestid: request._requestid,
                        cardcode: paymentcarddata.id,
                        cardnumber: paymentcarddata.source.cardNumber,
                        clientcode: paymentcarddata.customerId,
                        corpid: corpId,
                        favorite: true,
                        firstname: (parameters.contactnameorcompany || "").substring(0, 50),
                        id: 0,
                        lastname: (parameters.contactnameorcompany || "").substring(0, 50),
                        mail: (parameters.contactmail || "").substring(0, 50),
                        operation: "INSERT",
                        orgid: orgId,
                        status: "ACTIVO",
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
                        type: "",
                    };

                    const queryCardCreate = await triggerfunctions.executesimpletransaction(
                        "UFN_PAYMENTCARD_INS",
                        cardParameters
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

                if (channel) {
                    channel.corpid = corpId;
                    channel.orgid = orgId;
                    channel.userid = userId;

                    await triggerfunctions.executesimpletransaction("UFN_SUBSCRIPTION_CREATECHANNELS", channel);
                }

                if (
                    (typeof parameters.loginfacebookid !== "undefined" && parameters.loginfacebookid) ||
                    (typeof parameters.logingoogleid !== "undefined" && parameters.logingoogleid)
                ) {
                    let userParameters = {
                        _requestid: request._requestid,
                        corpid: corpId,
                        userid: userId,
                    };

                    const queryActivateUser = await triggerfunctions.executesimpletransaction(
                        "UFN_USER_ACTIVATE",
                        userParameters
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
                        _requestid: request._requestid,
                        all: false,
                        corpid: 1,
                        domainname: "ACTIVATEBODY",
                        orgid: 0,
                        username: parameters.loginusername,
                    };

                    const transactionGetBody = await triggerfunctions.executesimpletransaction(
                        "UFN_DOMAIN_VALUES_SEL",
                        domainParameters
                    );

                    domainParameters.domainname = "ACTIVATESUBJECT";

                    const transactionGetSubject = await triggerfunctions.executesimpletransaction(
                        "UFN_DOMAIN_VALUES_SEL",
                        domainParameters
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
                            alertBody = alertBody.split("{{organizationname}}").join(parameters.contactcountryname);
                            alertBody = alertBody.split("{{paymentplan}}").join(parameters.paymentplan);
                            alertBody = alertBody.split("{{username}}").join(parameters.loginusername);

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

                            alertSubject = alertSubject
                                .split("{{link}}")
                                .join(`${laraigoEndpoint}activateuser/${encodeURIComponent(userCode)}`);

                            alertSubject = alertSubject
                                .split("{{organizationname}}")
                                .join(parameters.contactcountryname);

                            const requestMailSend = await axiosObservable({
                                _requestid: request._requestid,
                                method: "post",
                                url: `${bridgeEndpoint}processscheduler/sendmail`,
                                data: {
                                    mailAddress: parameters.loginusername,
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
                        if (validateEmail(queryUserGet[0].email) !== null) {
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

const getAppSettingSingle = async (corpid, orgid, requestId) => {
    const queryAppSettingGet = await triggerfunctions.executesimpletransaction("UFN_APPSETTING_INVOICE_SEL_SINGLE", {
        corpid: corpid,
        orgid: orgid,
        _requestid: requestId,
    });

    if (queryAppSettingGet instanceof Array) {
        if (queryAppSettingGet.length > 0) {
            return queryAppSettingGet[0];
        }
    }

    return null;
};

const validateEmail = (email) => {
    return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.exec(
        String(email).toLowerCase()
    );
};