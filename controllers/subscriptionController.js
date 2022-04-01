const axios = require("axios");
const bcryptjs = require("bcryptjs");
const triggerfunctions = require("../config/triggerfunctions");

const cryptojs = require("crypto-js");

const bridgeEndpoint = process.env.BRIDGE;
const brokerEndpoint = process.env.CHATBROKER;
const facebookEndpoint = process.env.FACEBOOKAPI;
const hookEndpoint = process.env.HOOK;
const laraigoEndpoint = process.env.LARAIGO;
const smoochEndpoint = process.env.SMOOCHAPI;
const smoochVersion = process.env.SMOOCHVERSION;
const telegramEndpoint = process.env.TELEGRAMAPI;
const userSecret = process.env.USERSECRET;
const webChatApplication = process.env.CHATAPPLICATION;
const webChatScriptEndpoint = process.env.WEBCHATSCRIPT;
const whitelist = process.env.WHITELIST;

exports.activateUser = async (request, result) => {
    try {
        var requestCode = "error_unexpected_error";
        var requestMessage = "error_unexpected_error";
        var requestStatus = 400;
        var requestSuccess = false;

        if (typeof whitelist !== "undefined" && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return result.status(requestStatus).json({
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
            };

            const queryActivateUser = await triggerfunctions.executesimpletransaction(userMethod, userParameters);

            if (queryActivateUser instanceof Array) {
                requestCode = "";
                requestMessage = "";
                requestStatus = 200;
                
                if (queryActivateUser.length > 0) {
                    requestSuccess = true;
                }
                else
                {
                    requestSuccess = false;
                }
            }
            else {
                requestCode = queryActivateUser.code;
            }
        }

        return result.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.changePassword = async (request, result) => {
    try {
        var requestCode = "error_unexpected_error";
        var requestMessage = "error_unexpected_error";
        var requestStatus = 400;
        var requestSuccess = false;

        if (typeof whitelist !== "undefined" && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return result.status(requestStatus).json({
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

        return result.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.countryList = async (request, result) => {
    try {
        var requestData = null;
        var requestCode = "error_unexpected_error";
        var requestMessage = "error_unexpected_error";
        var requestStatus = 400;
        var requestSuccess = false;

        if (typeof whitelist !== "undefined" && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return result.status(requestStatus).json({
                    code: "error_auth_error",
                    error: !requestSuccess,
                    message: "error_auth_error",
                    success: requestSuccess,
                });
            }
        }

        const queryCountryGet = await triggerfunctions.executesimpletransaction("UFN_COUNTRY_SEL", {});

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

        return result.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.createSubscription = async (request, result) => {
    try {
        var requestCode = "error_unexpected_error";
        var requestMessage = "error_unexpected_error";
        var requestStatus = 400;
        var requestSuccess = false;

        if (typeof whitelist !== "undefined" && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return result.status(requestStatus).json({
                    code: "error_auth_error",
                    error: !requestSuccess,
                    message: "error_auth_error",
                    success: requestSuccess,
                });
            }
        }

        if (request.body) {
            var { card = {}, channellist = [], method, parameters = {} } = request.body;
        
            var channelMethodArray = [];
            var channelParametersArray = [];
            var channelServiceArray = [];

            var channelData = "";
            var channelTotal = "";

            var cardData = null;
            var cardError = false;

            if (card) {
                const appsetting = await getAppSetting();

                if (appsetting) {
                    card.cardnumber = card.cardnumber.split(" ").join("");

                    const requestCulqiClient = await axios({
                        data: {
                            address: (parameters.fiscaladdress || '').substring(0, 100),
                            addressCity: (parameters.timezone || '').substring(0, 30),
                            bearer: appsetting.privatekey,
                            countryCode: parameters.country,
                            email: card.mail,
                            firstName: card.firstname,
                            lastName: card.lastname,
                            operation: "CREATE",
                            phoneNumber: parameters.phone.split("+").join("").split(" ").join("").split("(").join("").split(")").join(""),
                            url: appsetting.culqiurlclient,
                        },
                        method: "post",
                        url: `${bridgeEndpoint}processculqi/handleclient`,
                    });

                    if (requestCulqiClient.data.success) {
                        const requestCulqiCard = await axios({
                            data: {
                                bearer: appsetting.privatekey,
                                cardNumber: card.cardnumber,
                                customerId: requestCulqiClient.data.result.id,
                                cvv: card.securitycode,
                                email: card.mail,
                                expirationMonth: card.expirationmonth,
                                expirationYear: card.expirationyear,
                                operation: "CREATE",
                                url: appsetting.culqiurlcardcreate,
                                urlToken: appsetting.culqiurltoken,
                            },
                            method: "post",
                            url: `${bridgeEndpoint}processculqi/handlecard`,
                        });

                        if (requestCulqiCard.data.success) {
                            cardData = requestCulqiCard.data.result;
                        }
                        else {
                            cardError = true;
                            requestMessage = "error_card_card";
                        }
                    }
                    else {
                        cardError = true;
                        requestMessage = "error_card_client";
                    }
                }
                else {
                    cardError = true;
                    requestMessage = "error_card_configuration";
                }
            }
            else {
                cardError = true;
                requestMessage = "error_card_missing";
            }

            if (cardError) {
                return result.status(requestStatus).json({
                    code: requestCode,
                    error: !requestSuccess,
                    message: requestMessage,
                    success: requestSuccess,
                });
            }

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
    
                        requestCode = channel.type;

                        switch (channel.type) {
                            case "CHATWEB":
                                const webChatData = {
                                    applicationId: webChatApplication,
                                    metadata: {
                                        color: {
                                            chatBackgroundColor: channelService.color ? channelService.color.background : "",
                                            chatBorderColor: channelService.color ? channelService.color.border : "",
                                            chatHeaderColor: channelService.color ? channelService.color.header : "",
                                            messageBotColor: channelService.color ? channelService.color.bot : "",
                                            messageClientColor: channelService.color ? channelService.color.client : "",
                                        },
                                        extra: {
                                            abandonendpoint: `${webChatScriptEndpoint}smooch`,
                                            cssbody: "",
                                            enableabandon: channelService.extra ? channelService.extra.abandonevent : false,
                                            enableformhistory: channelService.extra ? channelService.extra.formhistory : false,
                                            enableidlemessage: channelService.bubble ? channelService.bubble.active : false,
                                            headermessage: channelService.extra ? channelService.extra.botnametext : "",
                                            inputalwaysactive: channelService.extra ? channelService.extra.persistentinput : false,
                                            jsscript: channelService.extra ? channelService.extra.customjs : "",
                                            playalertsound: channelService.extra ? channelService.extra.alertsound : false,
                                            sendmetadata: channelService.extra ? channelService.extra.enablemetadata : false,
                                            showchatrestart: channelService.extra ? channelService.extra.reloadchat : false,
                                            showlaraigologo: channelService.extra ? channelService.extra.poweredby : false,
                                            showmessageheader: channelService.extra ? channelService.extra.botnameenabled : false,
                                            showplatformlogo: false,
                                            uploadaudio: channelService.extra ? channelService.extra.uploadaudio : false,
                                            uploadfile: channelService.extra ? channelService.extra.uploadfile : false,
                                            uploadimage: channelService.extra ? channelService.extra.uploadimage : false,
                                            uploadlocation: channelService.extra ? channelService.extra.uploadlocation : false,
                                            uploadvideo: channelService.extra ? channelService.extra.uploadvideo : false,
                                        },
                                        form: channelService.form ? channelService.form : null,
                                        icons: {
                                            chatBotImage: channelService.interface ? channelService.interface.iconbot : "",
                                            chatHeaderImage: channelService.interface ? channelService.interface.iconheader : "",
                                            chatIdleImage: channelService.bubble ? channelService.bubble.iconbubble : "",
                                            chatOpenImage: channelService.interface ? channelService.interface.iconbutton : "",
                                        },
                                        personalization: {
                                            headerMessage: channelService.extra ? channelService.extra.botnametext : "",
                                            headerSubTitle: channelService.interface ? channelService.interface.chatsubtitle : "",
                                            headerTitle: channelService.interface ? channelService.interface.chattitle : "",
                                            idleMessage: channelService.bubble ? channelService.bubble.messagebubble : "",
                                        }
                                    },
                                    name: channelParameters.description,
                                    status: "ACTIVO",
                                    type: "CHAZ",
                                }

                                const requestChatwebIntegration = await axios({
                                    data: webChatData,
                                    method: "post",
                                    url: `${brokerEndpoint}integrations/save`,
                                });

                                if (requestChatwebIntegration.data) {
                                    if (typeof requestChatwebIntegration.data.id !== "undefined" && requestChatwebIntegration.data.id) {
                                        const requestChatwebWebhook = await axios({
                                            data: {
                                                description: channelParameters.description,
                                                integration: requestChatwebIntegration.data.id,
                                                name: channelParameters.description,
                                                status: "ACTIVO",
                                                webUrl: `${hookEndpoint}chatweb/webhookasync`,
                                            },
                                            method: "post",
                                            url: `${brokerEndpoint}webhooks/save`,
                                        });

                                        if (requestChatwebWebhook.data) {
                                            if (typeof requestChatwebWebhook.data.id !== "undefined" && requestChatwebWebhook.data.id) {
                                                const requestChatwebPlugin = await axios({
                                                    data: {
                                                        integration: requestChatwebIntegration.data.id,
                                                        name: channelParameters.description,
                                                        status: "ACTIVO",
                                                    },
                                                    method: "post",
                                                    url: `${brokerEndpoint}plugins/save`,
                                                });

                                                if (requestChatwebPlugin.data) {
                                                    if (typeof requestChatwebPlugin.data.id !== "undefined" && requestChatwebPlugin.data.id) {
                                                        channelParameters.apikey = requestChatwebPlugin.data.apiKey;
                                                        channelParameters.appintegrationid = webChatApplication;
                                                        channelParameters.channelparameters = JSON.stringify(webChatData);
                                                        channelParameters.communicationchannelcontact = requestChatwebPlugin.data.id;
                                                        channelParameters.communicationchannelowner = requestChatwebWebhook.data.id;
                                                        channelParameters.communicationchannelsite = requestChatwebIntegration.data.id;
                                                        channelParameters.integrationid = requestChatwebIntegration.data.id;
                                                        channelParameters.servicecredentials = JSON.stringify(channelService);
                                                        channelParameters.type = "CHAZ";
                
                                                        channelMethodArray.push(channelMethod);
                                                        channelParametersArray.push(channelParameters);
                                                        channelServiceArray.push(channelService);
                                                    }
                                                    else {
                                                        channelError = true;
                                                        requestMessage = "subscription_chatweb_plugin_error";
                                                        break;
                                                    }
                                                }
                                                else {
                                                    channelError = true;
                                                    requestMessage = "subscription_chatweb_plugin_error";
                                                    break;
                                                }
                                            }
                                            else {
                                                channelError = true;
                                                requestMessage = "subscription_chatweb_webhook_error";
                                                break;
                                            }
                                        }
                                        else {
                                            channelError = true;
                                            requestMessage = "subscription_chatweb_webhook_error";
                                            break;
                                        }
                                    }
                                    else {
                                        channelError = true;
                                        requestMessage = "subscription_chatweb_integration_error";
                                        break;
                                    }
                                }
                                else {
                                    channelError = true;
                                    requestMessage = "subscription_chatweb_integration_error";
                                    break;
                                }
                                break;

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
                                        const requestInstagramBusiness = await axios({
                                            data: {
                                                accessToken: channelService.accesstoken,
                                                linkType: "GETBUSINESS",
                                                siteId: channelService.siteid,
                                            },
                                            method: "post",
                                            url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`,
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
    
                                    const requestFacebookLink = await axios({
                                        data: {
                                            accessToken: channelService.accesstoken,
                                            linkType: channelLinkService,
                                            siteId: channelService.siteid,
                                        },
                                        method: "post",
                                        url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`,
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

                            case "SMOOCHANDROID":
                            case "SMOOCHIOS":
                                const requestSmoochLink = await axios({
                                    data: {
                                        linkType: channel.type === "SMOOCHANDROID" ? "ANDROIDADD" : "IOSADD",
                                        name: channelParameters.description,
                                    },
                                    method: "post",
                                    url: `${bridgeEndpoint}processlaraigo/smooch/managesmoochlink`,
                                });

                                if (requestSmoochLink.data.success) {
                                    var serviceCredentials = {
                                        appId: requestSmoochLink.data.applicationId,
                                        apiKeyId: requestSmoochLink.data.appApiKey,
                                        apiKeySecret: requestSmoochLink.data.appSecret,
                                        endpoint: smoochEndpoint,
                                        version: smoochVersion,
                                    };

                                    channelParameters.communicationchannelowner = requestSmoochLink.data.applicationId;
                                    channelParameters.communicationchannelsite = requestSmoochLink.data.applicationId;
                                    channelParameters.integrationid = requestSmoochLink.data.integrationId;
                                    channelParameters.servicecredentials = JSON.stringify(serviceCredentials);
                                    channelParameters.type = (request.body.type === "SMOOCHANDROID" ? "ANDR" : "APPL");
                
                                    channelMethodArray.push(channelMethod);
                                    channelParametersArray.push(channelParameters);
                                    channelServiceArray.push(channelService);
                                }
                                else {
                                    channelError = true;
                                    requestMessage = "subscription_smooch_link_error";
                                    break;
                                }
                                break;

                            case "TELEGRAM":
                                const requestTelegramLink = await axios({
                                    data: {
                                        accessToken: channelService.accesstoken,
                                        linkType: "TELEGRAMADD",
                                    },
                                    method: "post",
                                    url: `${bridgeEndpoint}processlaraigo/telegram/managetelegramlink`,
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
                                const requestTwitterBusiness = await axios({
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
                                        const requestTwitterLink = await axios({
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

                            case "WHATSAPPSMOOCH":
                                channelParameters.communicationchannelowner = "";
                                channelParameters.communicationchannelsite = "";
                                channelParameters.servicecredentials = JSON.stringify(channelService);
                                channelParameters.type = "WHAT";

                                channelMethodArray.push(channelMethod);
                                channelParametersArray.push(channelParameters);
                                channelServiceArray.push(channelService);
                                break;
                        }
                    }
                }

                if (channelError) {
                    return result.status(requestStatus).json({
                        code: requestCode,
                        error: !requestSuccess,
                        message: requestMessage,
                        success: requestSuccess,
                    });
                }
            }

            requestCode = "";

            if (typeof parameters.country === "undefined" || !parameters.country) {
                parameters.country = null;
            }
    
            if (typeof parameters.currency === "undefined" || !parameters.currency) {
                parameters.currency = null;
            }

            parameters.password = await bcryptjs.hash(parameters.password, await bcryptjs.genSalt(10));

            const queryCreateSubscription = await triggerfunctions.executesimpletransaction(method, parameters);

            if (queryCreateSubscription instanceof Array) {
                var corpId = queryCreateSubscription[0].corpid;
                var orgId = queryCreateSubscription[0].orgid;
                var userId = queryCreateSubscription[0].userid;

                if (cardData) {
                    var cardMethod = "UFN_PAYMENTCARD_INS";
                    var cardParameters = {
                        corpid: corpId,
                        orgid: orgId,
                        id: 0,
                        cardnumber: cardData.source.cardNumber,
                        cardcode: cardData.id,
                        firstname: card.firstname,
                        lastname: card.lastname,
                        mail: card.mail,
                        favorite: true,
                        clientcode: cardData.customerId,
                        status: "ACTIVO",
                        type: "",
                        username: parameters.username,
                        operation: "INSERT",
                    };

                    const queryCardCreate = await triggerfunctions.executesimpletransaction(cardMethod, cardParameters);

                    if (!queryCardCreate instanceof Array) {
                        requestMessage = "error_card_create";

                        return result.status(requestStatus).json({
                            code: requestCode,
                            error: !requestSuccess,
                            message: requestMessage,
                            success: requestSuccess,
                        });
                    }
                }

                if (typeof channelMethodArray !== "undefined" && channelMethodArray) {
                    var index = 0;

                    for (const channelMethod of channelMethodArray) {
                        channelParametersArray[index].corpid = corpId;
                        channelParametersArray[index].orgid = orgId;
                        channelParametersArray[index].username = parameters.username;

                        const queryChannelCreate = await triggerfunctions.executesimpletransaction(channelMethodArray[index], channelParametersArray[index]);

                        if (queryChannelCreate instanceof Array) {
                            channelData = `<b>${channelParametersArray[index].description}</b>;${channelData}`;
                            channelTotal = (channelTotal === "" ? `${queryChannelCreate[0].ufn_communicationchannel_ins}` : `${channelTotal},${queryChannelCreate[0].ufn_communicationchannel_ins}`);
                        }
                        else {
                            requestMessage = "error_subscription_channel_create";

                            return result.status(requestStatus).json({
                                code: requestCode,
                                error: !requestSuccess,
                                message: requestMessage,
                                success: requestSuccess,
                            });
                        }

                        if (channelParametersArray[index].type === "WHAT" || channelParametersArray[index].type === "WHAD") {
                            if (typeof channelServiceArray[index] !== "undefined" && channelServiceArray[index]) {
                                var domainMethod = "UFN_DOMAIN_VALUES_SEL";
                                var domainParameters = {
                                    all: false,
                                    corpid: 1,
                                    domainname: "WHATSAPPBODY",
                                    orgid: 0,
                                    username: parameters.username,
                                };

                                const queryDomainAlertBody = await triggerfunctions.executesimpletransaction(domainMethod, domainParameters);

                                domainParameters.domainname = "WHATSAPPRECIPIENT";

                                const queryDomainAlertRecipient = await triggerfunctions.executesimpletransaction(domainMethod, domainParameters);

                                domainParameters.domainname = "WHATSAPPSUBJECT";

                                const queryDomainAlertSubject = await triggerfunctions.executesimpletransaction(domainMethod, domainParameters);

                                if (queryDomainAlertBody instanceof Array && queryDomainAlertRecipient instanceof Array && queryDomainAlertSubject instanceof Array) {
                                    if (queryDomainAlertBody.length > 0 && queryDomainAlertRecipient.length > 0 && queryDomainAlertSubject.length > 0) {
                                        var alertBody = queryDomainAlertBody[0].domainvalue;
                                        var alertRecipient = queryDomainAlertRecipient[0].domainvalue;
                                        var alertSubject = queryDomainAlertSubject[0].domainvalue;

                                        alertBody = alertBody.split("{{brandaddress}}").join(parameters.fiscaladdress);
                                        alertBody = alertBody.split("{{brandname}}").join(parameters.companybusinessname);
                                        alertBody = alertBody.split("{{contact}}").join(parameters.contact);
                                        alertBody = alertBody.split("{{corpid}}").join(corpId);
                                        alertBody = alertBody.split("{{email}}").join(channelServiceArray[index].email);
                                        alertBody = alertBody.split("{{firstname}}").join(channelServiceArray[index].firstname);
                                        alertBody = alertBody.split("{{lastname}}").join(channelServiceArray[index].lastname);
                                        alertBody = alertBody.split("{{nameassociatednumber}}").join(channelServiceArray[index].nameassociatednumber);
                                        alertBody = alertBody.split("{{orgid}}").join(orgId);
                                        alertBody = alertBody.split("{{phone}}").join(channelServiceArray[index].phone);
                                        alertBody = alertBody.split("{{phonenumberwhatsappbusiness}}").join(channelServiceArray[index].phonenumberwhatsappbusiness);
                                        alertBody = alertBody.split("{{username}}").join(parameters.username);

                                        alertSubject = alertSubject.split("{{brandaddress}}").join(parameters.fiscaladdress);
                                        alertSubject = alertSubject.split("{{brandname}}").join(parameters.companybusinessname);
                                        alertSubject = alertSubject.split("{{contact}}").join(parameters.contact);
                                        alertSubject = alertSubject.split("{{corpid}}").join(corpId);
                                        alertSubject = alertSubject.split("{{email}}").join(channelServiceArray[index].email);
                                        alertSubject = alertSubject.split("{{firstname}}").join(channelServiceArray[index].firstname);
                                        alertSubject = alertSubject.split("{{lastname}}").join(channelServiceArray[index].lastname);
                                        alertSubject = alertSubject.split("{{nameassociatednumber}}").join(channelServiceArray[index].nameassociatednumber);
                                        alertSubject = alertSubject.split("{{orgid}}").join(orgId);
                                        alertSubject = alertSubject.split("{{phone}}").join(channelServiceArray[index].phone);
                                        alertSubject = alertSubject.split("{{phonenumberwhatsappbusiness}}").join(channelServiceArray[index].phonenumberwhatsappbusiness);
                                        alertSubject = alertSubject.split("{{username}}").join(parameters.username);

                                        const requestMailSend = await axios({
                                            data: {
                                                mailAddress: alertRecipient,
                                                mailBody: alertBody,
                                                mailTitle: alertSubject
                                            },
                                            method: "post",
                                            url: `${bridgeEndpoint}processscheduler/sendmail`,
                                        });
            
                                        if (!requestMailSend.data.success) {
                                            requestMessage = "error_subscription_alert_failure";

                                            return result.status(requestStatus).json({
                                                code: requestCode,
                                                error: !requestSuccess,
                                                message: requestMessage,
                                                success: requestSuccess,
                                            });
                                        }
                                    }
                                    else {
                                        requestMessage = "error_subscription_alert_error";

                                        return result.status(requestStatus).json({
                                            code: requestCode,
                                            error: !requestSuccess,
                                            message: requestMessage,
                                            success: requestSuccess,
                                        });
                                    }
                                }
                                else {
                                    requestMessage = "error_subscription_alert_error";

                                    return result.status(requestStatus).json({
                                        code: requestCode,
                                        error: !requestSuccess,
                                        message: requestMessage,
                                        success: requestSuccess,
                                    });
                                }
                            }
                        }

                        index++;
                    }
                }

                if (channelTotal !== "") {
                    var updateMethod = "UFN_ORGUSER_CHANNELS_UPDATE";
                    var updateParameters = {
                        channels: channelTotal,
                        corpid: corpId,
                        orgid: orgId,
                        userid: userId,
                    }

                    const queryOrgUserUpdate = await triggerfunctions.executesimpletransaction(updateMethod, updateParameters);

                    if (!queryOrgUserUpdate instanceof Array) {
                        requestMessage = "error_subscription_orguser_update";

                        return result.status(requestStatus).json({
                            code: requestCode,
                            error: !requestSuccess,
                            message: requestMessage,
                            success: requestSuccess,
                        });
                    }
                }

                if ((typeof parameters.facebookid !== "undefined" && parameters.facebookid) || (typeof parameters.googleid !== "undefined" && parameters.googleid)) {
                    var userMethod = "UFN_USER_ACTIVATE";
                    var userParameters = {
                        corpid: corpId,
                        userid: userId,
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
                    var domainMethod = "UFN_DOMAIN_VALUES_SEL";
                    var domainParameters = {
                        all: false,
                        corpid: 1,
                        domainname: "ACTIVATEBODY",
                        orgid: 0,
                        username: parameters.username,
                    };

                    const transactionGetBody = await triggerfunctions.executesimpletransaction(domainMethod, domainParameters);

                    domainParameters.domainname = "ACTIVATESUBJECT";

                    const transactionGetSubject = await triggerfunctions.executesimpletransaction(domainMethod, domainParameters);

                    if (transactionGetBody instanceof Array && transactionGetSubject instanceof Array) {
                        if (transactionGetBody.length > 0 && transactionGetSubject.length > 0) {
                            var userCode = cryptojs.AES.encrypt(JSON.stringify({
                                corpid: corpId,
                                userid: userId,
                            }), userSecret).toString();

                            userCode = userCode.split("=").join("_EQUAL_");
                            userCode = userCode.split("+").join("_PLUS_");
                            userCode = userCode.split("/").join("_SLASH_");

                            var alertBody = transactionGetBody[0].domainvalue;
                            var alertSubject = transactionGetSubject[0].domainvalue;

                            alertBody = alertBody.split("{{address}}").join(parameters.fiscaladdress);
                            alertBody = alertBody.split("{{channeldata}}").join(channelData);
                            alertBody = alertBody.split("{{country}}").join(parameters.country);
                            alertBody = alertBody.split("{{countryname}}").join(parameters.countryname);
                            alertBody = alertBody.split("{{firstname}}").join(parameters.firstname);
                            alertBody = alertBody.split("{{lastname}}").join(parameters.lastname);
                            alertBody = alertBody.split("{{link}}").join(`${laraigoEndpoint}activateuser/${encodeURIComponent(userCode)}`);
                            alertBody = alertBody.split("{{organizationname}}").join(parameters.organizationname);
                            alertBody = alertBody.split("{{paymentplan}}").join(parameters.paymentplan);
                            alertBody = alertBody.split("{{username}}").join(parameters.username);
                            
                            alertSubject = alertSubject.split("{{address}}").join(parameters.fiscaladdress);
                            alertSubject = alertSubject.split("{{channeldata}}").join(channelData);
                            alertSubject = alertSubject.split("{{country}}").join(parameters.country);
                            alertSubject = alertSubject.split("{{countryname}}").join(parameters.countryname);
                            alertSubject = alertSubject.split("{{firstname}}").join(parameters.firstname);
                            alertSubject = alertSubject.split("{{lastname}}").join(parameters.lastname);
                            alertSubject = alertSubject.split("{{link}}").join(`${laraigoEndpoint}activateuser/${encodeURIComponent(userCode)}`);
                            alertSubject = alertSubject.split("{{organizationname}}").join(parameters.organizationname);
                            alertSubject = alertSubject.split("{{paymentplan}}").join(parameters.paymentplan);
                            alertSubject = alertSubject.split("{{username}}").join(parameters.username);

                            const requestMailSend = await axios({
                                data: {
                                    mailAddress: parameters.username,
                                    mailBody: alertBody,
                                    mailTitle: alertSubject,
                                },
                                method: "post",
                                url: `${bridgeEndpoint}processscheduler/sendmail`,
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

        return result.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.currencyList = async (request, result) => {
    try {
        var requestCode = "error_unexpected_error";
        var requestData = null;
        var requestMessage = "error_unexpected_error";
        var requestStatus = 400;
        var requestSuccess = false;

        if (typeof whitelist !== "undefined" && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return result.status(requestStatus).json({
                    code: "error_auth_error",
                    data: requestData,
                    error: !requestSuccess,
                    message: "error_auth_error",
                    success: requestSuccess,
                });
            }
        }

        const queryCurrencySel = await triggerfunctions.executesimpletransaction("UFN_CURRENCY_SEL", {});

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

        return result.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.getContract = async (request, result) => {
    try {
        var requestCode = "error_unexpected_error";
        var requestData = null;
        var requestMessage = "error_unexpected_error";
        var requestStatus = 400;
        var requestSuccess = false;

        if (typeof whitelist !== "undefined" && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return result.status(requestStatus).json({
                    code: "error_auth_error",
                    data: requestData,
                    error: !requestSuccess,
                    message: "error_auth_error",
                    success: requestSuccess,
                });
            }
        }

        if (request.body) {
            const { parameters = {} } = request.body;

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

        return result.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.getPageList = async (request, result) => {
    try {
        var requestCode = "error_unexpected_error";
        var requestData = null;
        var requestMessage = "error_unexpected_error";
        var requestStatus = 400;
        var requestSuccess = false;

        if (typeof whitelist !== "undefined" && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return result.status(requestStatus).json({
                    code: "error_auth_error",
                    error: !requestSuccess,
                    message: "error_auth_error",
                    pageData: requestData,
                    success: requestSuccess,
                });
            }
        }

        if (request.body) {
            const requestFacebookPages = await axios({
                data: {
                    accessToken: request.body.accessToken,
                    appId: request.body.appId,
                    linkType: "GETPAGES",
                },
                method: "post",
                url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`,
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

        return result.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            message: requestMessage,
            pageData: requestData,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.recoverPassword = async (request, result) => {
    try {
        var requestCode = "error_unexpected_error";
        var requestMessage = "error_unexpected_error";
        var requestStatus = 400;
        var requestSuccess = false;

        if (typeof whitelist !== "undefined" && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return result.status(requestStatus).json({
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

                                const requestMailSend = await axios({
                                    data: {
                                        mailAddress: queryUserGet[0].email,
                                        mailBody: alertBody,
                                        mailTitle: alertSubject,
                                    },
                                    method: "post",
                                    url: `${bridgeEndpoint}processscheduler/sendmail`,
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

        return result.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.validateChannels = async (request, result) => {
    try {
        var requestCode = "error_unexpected_error";
        var requestMessage = "error_unexpected_error";
        var requestStatus = 400;
        var requestSuccess = false;

        if (typeof whitelist !== "undefined" && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return result.status(requestStatus).json({
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
                                        const requestInstagramBusiness = await axios({
                                            data: {
                                                accessToken: channelService.accesstoken,
                                                linkType: "GETBUSINESS",
                                                siteId: channelService.siteid,
                                            },
                                            method: "post",
                                            url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`,
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
    
                                    const requestFacebookLink = await axios({
                                        data: {
                                            accessToken: channelService.accesstoken,
                                            linkType: channelLinkService,
                                            siteId: channelService.siteid,
                                        },
                                        method: "post",
                                        url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`,
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
                                const requestTelegramLink = await axios({
                                    data: {
                                        accessToken: channelService.accesstoken,
                                        linkType: "TELEGRAMADD",
                                    },
                                    method: "post",
                                    url: `${bridgeEndpoint}processlaraigo/telegram/managetelegramlink`,
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
                                const requestTwitterBusiness = await axios({
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
                                        const requestTwitterLink = await axios({
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
                    return result.status(requestStatus).json({
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

        return result.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.validateUserId = async (request, result) => {
    try {
        var requestCode = "error_unexpected_error";
        var requestMessage = "error_unexpected_error";
        var requestStatus = 400;
        var requestSuccess = false;

        if (typeof whitelist !== "undefined" && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return result.status(requestStatus).json({
                    code: "error_auth_error",
                    error: !requestSuccess,
                    message: "error_auth_error",
                    success: requestSuccess,
                });
            }
        }

        if (request.body) {
            var { method, parameters = {} } = request.body;

            setSessionParameters(parameters, request.user);

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

        return result.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.validateUsername = async (request, result) => {
    try {
        var requestCode = "error_unexpected_error";
        var requestIsValid = false;
        var requestMessage = "error_unexpected_error";
        var requestStatus = 400;
        var requestSuccess = false;

        if (typeof whitelist !== "undefined" && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return result.status(requestStatus).json({
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
            }

            if (typeof parameters.googleid !== "undefined" && parameters.googleid) {
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
            }
            else {
                requestCode = queryUserSel.code;
            }
        }

        return result.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            isvalid: requestIsValid,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

const getAppSetting = async () => {
    const queryAppSettingGet = await triggerfunctions.executesimpletransaction("UFN_APPSETTING_INVOICE_SEL");

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