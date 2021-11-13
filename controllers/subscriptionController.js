const triggerfunctions = require('../config/triggerfunctions');
const bcryptjs = require("bcryptjs");
const axios = require('axios');
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
const webChatPlatformEndpoint = process.env.WEBCHATPLATFORM;
const webChatScriptEndpoint = process.env.WEBCHATSCRIPT;
const whatsAppEndpoint = process.env.WHATSAPPAPI;
const whitelist = process.env.WHITELIST;

exports.activateUser = async (request, result) => {
    try {
        if (typeof whitelist !== 'undefined' && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return result.status(400).json({
                    msg: 'Unauthorized',
                    success: false,
                    error: true
                });
            }
        }

        var { userCode } = request.body;

        var processedUserCode = userCode;

        processedUserCode = processedUserCode.split("_EQUAL_").join("=");
        processedUserCode = processedUserCode.split("_SLASH_").join("/");
        processedUserCode = processedUserCode.split("_PLUS_").join("+");
        
        var userByte  = cryptojs.AES.decrypt(processedUserCode, userSecret);

        var userData = JSON.parse(userByte.toString(cryptojs.enc.Utf8));

        var userMethod = 'UFN_UPDATE_ACTIVE_USER_SEL';
        var userParameters = {
            usr: userData.username,
            firstname: userData.firstname
        };
        
        const transactionActivateUser = await triggerfunctions.executesimpletransaction(userMethod, userParameters);

        if (transactionActivateUser instanceof Array) {
            if (transactionActivateUser.length > 0) {
                return result.json({
                    success: true
                });
            }
            else
            {
                return result.json({
                    success: false
                });
            }
        }
        else {
            return result.status(400).json({
                msg: transactionActivateUser.code,
                success: false,
                error: true
            });
        }
    }
    catch (exception) {
        return result.status(500).json({
            msg: exception.message,
            success: false,
            error: true
        });
    }
}

exports.getContract = async (req, res) => {
    const { parameters = {} } = req.body;
    const result = await triggerfunctions.executesimpletransaction("GET_CONTRACT", parameters);
    
    if (result instanceof Array) {
        if (result.length > 0) {
            return res.json({ error: false, success: true, data: result });
        }
        return res.status(500).json({ error: true, success: false,
        error: true });
    }
    else
        return res.status(result.rescode).json(result);
}

exports.createSubscription = async (request, result) => {
    try {
        if (typeof whitelist !== 'undefined' && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return result.status(400).json({
                    msg: 'Unauthorized',
                    success: false,
                    error: true
                });
            }
        }

        var { channellist = [], method, parameters = {} } = request.body;
        
        var channelMethodArray = [];
        var channelParametersArray = [];
        var channelServiceArray = [];

        var channelData = '';
        var channelTotal = '';

        if (channellist instanceof Array) {
            for (const channel of channellist) {
                if (typeof channel !== 'undefined' && channel) {
                    var channelMethod = channel.method ? channel.method : 'UFN_COMMUNICATIONCHANNEL_INS';
                    var channelParameters = channel.parameters;
                    var channelService = channel.service;

                    channelParameters.appintegrationid = null;
                    channelParameters.botconfigurationid = null;
                    channelParameters.botenabled = null;
                    channelParameters.channelparameters = null;
                    channelParameters.chatflowenabled = true;
                    channelParameters.coloricon = channelParameters.coloricon || null;
                    channelParameters.communicationchannelcontact = '';
                    channelParameters.communicationchanneltoken = null;
                    channelParameters.country = null;
                    channelParameters.customicon = null;
                    channelParameters.motive = 'Insert from API';
                    channelParameters.operation = 'INSERT';
                    channelParameters.resolvelithium = null;
                    channelParameters.schedule = null;
                    channelParameters.status = 'ACTIVO';
                    channelParameters.updintegration = null;

                    switch (channel.type) {
                        case 'CHATWEB':
                            const webChatData = {
                                applicationId: webChatApplication,
                                name: channelParameters.description,
                                status: 'ACTIVO',
                                type: 'CHAZ',
                                metadata: {
                                    color: {
                                        chatBackgroundColor: channelService.color ? channelService.color.background : '',
                                        chatBorderColor: channelService.color ? channelService.color.border : '',
                                        chatHeaderColor: channelService.color ? channelService.color.header : '',
                                        messageBotColor: channelService.color ? channelService.color.bot : '',
                                        messageClientColor: channelService.color ? channelService.color.client : ''
                                    },
                                    extra: {
                                        abandonendpoint: `${webChatScriptEndpoint}smooch`,
                                        cssbody: '',
                                        enableabandon: channelService.extra ? channelService.extra.abandonevent : false,
                                        enableformhistory: channelService.extra ? channelService.extra.formhistory : false,
                                        enableidlemessage: channelService.bubble ? channelService.bubble.active : false,
                                        headermessage: channelService.extra ? channelService.extra.botnametext : '',
                                        inputalwaysactive: channelService.extra ? channelService.extra.persistentinput : false,
                                        jsscript: channelService.extra ? channelService.extra.customjs : '',
                                        playalertsound: channelService.extra ? channelService.extra.alertsound : false,
                                        sendmetadata: channelService.extra ? channelService.extra.enablemetadata : false,
                                        showchatrestart: channelService.extra ? channelService.extra.reloadchat : false,
                                        showmessageheader: channelService.extra ? channelService.extra.botnameenabled : false,
                                        showlaraigologo: channelService.extra ? channelService.extra.poweredby : false,
                                        showplatformlogo: false,
                                        uploadaudio: channelService.extra ? channelService.extra.uploadaudio : false,
                                        uploadfile: channelService.extra ? channelService.extra.uploadfile : false,
                                        uploadimage: channelService.extra ? channelService.extra.uploadimage : false,
                                        uploadlocation: channelService.extra ? channelService.extra.uploadlocation : false,
                                        uploadvideo: channelService.extra ? channelService.extra.uploadvideo : false
                                    },
                                    form: channelService.form ? channelService.form : null,
                                    icons: {
                                        chatBotImage: channelService.interface ? channelService.interface.iconbot : '',
                                        chatHeaderImage: channelService.interface ? channelService.interface.iconheader : '',
                                        chatIdleImage: channelService.bubble ? channelService.bubble.iconbubble : '',
                                        chatOpenImage: channelService.interface ? channelService.interface.iconbutton : ''
                                    },
                                    personalization: {
                                        headerMessage: channelService.extra ? channelService.extra.botnametext : '',
                                        headerSubTitle: channelService.interface ? channelService.interface.chatsubtitle : '',
                                        headerTitle: channelService.interface ? channelService.interface.chattitle : '',
                                        idleMessage: channelService.bubble ? channelService.bubble.messagebubble : ''
                                    }
                                }
                            }

                            const requestWebChatCreate = await axios({
                                data: webChatData,
                                method: 'post',
                                url: `${brokerEndpoint}integrations/save`
                            });
            
                            if (typeof requestWebChatCreate.data.id !== 'undefined' && requestWebChatCreate.data.id) {
                                const requestWebChatWebhook = await axios({
                                    data: {
                                        description: channelParameters.description,
                                        integration: requestWebChatCreate.data.id,
                                        name: channelParameters.description,
                                        status: 'ACTIVO',
                                        webUrl: `${hookEndpoint}chatweb/webhookasync`
                                    },
                                    method: 'post',
                                    url: `${brokerEndpoint}webhooks/save`
                                });
            
                                if (typeof requestWebChatWebhook.data.id !== 'undefined' && requestWebChatWebhook.data.id) {
                                    const requestWebChatPlugin = await axios({
                                        data: {
                                            integration: requestWebChatCreate.data.id,
                                            name: channelParameters.description,
                                            status: 'ACTIVO'
                                        },
                                        method: 'post',
                                        url: `${brokerEndpoint}plugins/save`
                                    });
            
                                    if (typeof requestWebChatPlugin.data.id !== 'undefined' && requestWebChatPlugin.data.id) {
                                        channelParameters.apikey = requestWebChatPlugin.data.apiKey;
                                        channelParameters.appintegrationid = webChatApplication;
                                        channelParameters.channelparameters = JSON.stringify(webChatData);
                                        channelParameters.communicationchannelcontact = requestWebChatPlugin.data.id;
                                        channelParameters.communicationchannelowner = requestWebChatWebhook.data.id;
                                        channelParameters.communicationchannelsite = requestWebChatCreate.data.id;
                                        channelParameters.integrationid = requestWebChatCreate.data.id;
                                        channelParameters.servicecredentials = JSON.stringify(channelService);
                                        channelParameters.type = 'CHAZ';

                                        channelMethodArray.push(channelMethod);
                                        channelParametersArray.push(channelParameters);
                                        channelServiceArray.push(channelService);
                                    }
                                    else {
                                        return result.status(400).json({
                                            msg: 'Could not create plugin',
                                            success: false,
                                            error: true
                                        });
                                    }
                                }
                                else {
                                    return result.status(400).json({
                                        msg: 'Could not create webhook',
                                        success: false,
                                        error: true
                                    });
                                }
                            }
                            else {
                                return result.status(400).json({
                                    msg: 'Could not create integration',
                                    success: false,
                                    error: true
                                });
                            }
                            break;

                        case 'FACEBOOK':
                        case 'INSTAGRAM':
                        case 'INSTAMESSENGER':
                        case 'MESSENGER':
                            const requestGetLongToken = await axios({
                                data: {
                                    accessToken: channelService.accesstoken,
                                    appId: channelService.appid,
                                    linkType: 'GENERATELONGTOKEN'
                                },
                                method: 'post',
                                url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`
                            });

                            if (requestGetLongToken.data.success) {
                                var businessId = null;
                                var channelLinkService = null;
                                var channelType = null;
                                var serviceType = null;

                                switch (channel.type) {
                                    case 'FACEBOOK':
                                        channelLinkService = 'WALLADD';
                                        channelType = 'FBWA';
                                        serviceType = 'WALL';
                                        break;

                                    case 'INSTAGRAM':
                                        channelLinkService = 'INSTAGRAMADD';
                                        channelType = 'INST';
                                        serviceType = 'INSTAGRAM';
                                        break;

                                    case 'INSTAMESSENGER':
                                        channelLinkService = 'INSTAGRAMADD';
                                        channelType = 'INDM';
                                        serviceType = 'INSTAGRAM';
                                        break;

                                    case 'MESSENGER':
                                        channelLinkService = 'MESSENGERADD';
                                        channelType = 'FBDM';
                                        serviceType = 'MESSENGER';
                                        break;
                                }

                                if (channel.type === 'INSTAGRAM' || channel.type === 'INSTAMESSENGER') {
                                    const requestGetBusiness = await axios({
                                        data: {
                                            accessToken: channelService.accesstoken,
                                            linkType: 'GETBUSINESS',
                                            siteId: channelService.siteid
                                        },
                                        method: 'post',
                                        url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`
                                    });
                                    
                                    if (requestGetBusiness.data.success) {
                                        businessId = requestGetBusiness.data.businessId;
                                    }
                                    else {
                                        return result.status(400).json({
                                            msg: 'No Instagram account',
                                            success: false,
                                            error: true
                                        });
                                    }
                                }

                                const requestCreateFacebook = await axios({
                                    url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`,
                                    method: 'post',
                                    data: {
                                        linkType: channelLinkService,
                                        accessToken: requestGetLongToken.data.longToken,
                                        siteId: channelService.siteid
                                    }
                                });

                                if (requestCreateFacebook.data.success) {
                                    var serviceCredentials = {
                                        accessToken: requestGetLongToken.data.longToken,
                                        endpoint: facebookEndpoint,
                                        serviceType: serviceType,
                                        siteId: channelService.siteid
                                    };

                                    if (typeof businessId !== 'undefined' && businessId) {
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
                                    return result.status(400).json({
                                        msg: requestCreateFacebook.data.operationMessage,
                                        success: false,
                                        error: true
                                    });
                                }
                            }
                            else {
                                return result.status(400).json({
                                    msg: requestGetLongToken.data.operationMessage,
                                    success: false,
                                    error: true
                                });
                            }
                            break;

                            case 'SMOOCHANDROID':
                            case 'SMOOCHIOS':
                                const requestCreateSmooch = await axios({
                                    data: {
                                        linkType: channel.type === 'SMOOCHANDROID' ? 'ANDROIDADD' : 'IOSADD',
                                        name: channelParameters.description
                                    },
                                    method: 'post',
                                    url: `${bridgeEndpoint}processlaraigo/smooch/managesmoochlink`
                                });
        
                                if (requestCreateSmooch.data.success) {
                                    var serviceCredentials = {
                                        apiKeyId: requestCreateSmooch.data.appApiKey,
                                        apiKeySecret: requestCreateSmooch.data.appSecret,
                                        appId: requestCreateSmooch.data.applicationId,
                                        endpoint: smoochEndpoint,
                                        version: smoochVersion
                                    };
        
                                    channelParameters.communicationchannelowner = requestCreateSmooch.data.applicationId;
                                    channelParameters.communicationchannelsite = requestCreateSmooch.data.applicationId;
                                    channelParameters.integrationid = requestCreateSmooch.data.integrationId;
                                    channelParameters.servicecredentials = JSON.stringify(serviceCredentials);
                                    channelParameters.type = (request.body.type === 'SMOOCHANDROID' ? 'ANDR' : 'APPL');
        
                                    channelMethodArray.push(channelMethod);
                                    channelParametersArray.push(channelParameters);
                                    channelServiceArray.push(channelService);
                                }
                                else {
                                    return result.status(400).json({
                                        msg: requestCreateSmooch.data.operationMessage,
                                        success: false,
                                        error: true
                                    });
                                }
                                break;

                        case 'TELEGRAM':
                            const requestCreateTelegram = await axios({
                                data: {
                                    accessToken: channelService.accesstoken,
                                    linkType: 'TELEGRAMADD'
                                },
                                method: 'post',
                                url: `${bridgeEndpoint}processlaraigo/telegram/managetelegramlink`
                            });
                        
                            if (requestCreateTelegram.data.success) {
                                var serviceCredentials = {
                                    bot: requestCreateTelegram.data.botName,
                                    endpoint: telegramEndpoint,
                                    token: channelService.accesstoken
                                };
                            
                                channelParameters.communicationchannelsite = requestCreateTelegram.data.botName;
                                channelParameters.servicecredentials = JSON.stringify(serviceCredentials);
                                channelParameters.type = 'TELE';

                                channelMethodArray.push(channelMethod);
                                channelParametersArray.push(channelParameters);
                                channelServiceArray.push(channelService);
                            }
                            else {
                                return result.status(400).json({
                                    msg: requestCreateTelegram.data.operationMessage,
                                    success: false,
                                    error: true
                                });
                            }
                            break;

                        case 'TWITTER':
                        case 'TWITTERDM':
                            const requestPageTwitter = await axios({
                                data: {
                                    accessSecret: channelService.accesssecret,
                                    accessToken: channelService.accesstoken,
                                    consumerKey: channelService.consumerkey,
                                    consumerSecret: channelService.consumersecret,
                                    developmentEnvironment: channelService.devenvironment,
                                    linkType: 'GETPAGEID'
                                },
                                method: 'post',
                                url: `${bridgeEndpoint}processlaraigo/twitter/managetwitterlink`
                            });

                            if (requestPageTwitter.data.success) {
                                var serviceCredentials = {
                                    accessSecret: channelService.accesssecret,
                                    accessToken: channelService.accesstoken,
                                    consumerKey: channelService.consumerkey,
                                    consumerSecret: channelService.consumersecret,
                                    devEnvironment: channelService.devenvironment,
                                    twitterPageId: requestPageTwitter.data.pageId
                                };

                                channelParameters.communicationchannelsite = requestPageTwitter.data.pageId;
                                channelParameters.servicecredentials = JSON.stringify(serviceCredentials);

                                if (channel.type === 'TWITTER') {
                                    channelParameters.type = 'TWIT';
                                }
                                else {
                                    channelParameters.type = 'TWMS';
                                }

                                const transactionCreateTwitter = await triggerfunctions.executesimpletransaction(channelMethod, channelParameters);

                                if (transactionCreateTwitter instanceof Array) {
                                    const requestCreateTwitter = await axios({
                                        data: {
                                            accessSecret: channelService.accesssecret,
                                            accessToken: channelService.accesstoken,
                                            consumerKey: channelService.consumerkey,
                                            consumerSecret: channelService.consumersecret,
                                            developmentEnvironment: channelService.devenvironment,
                                            linkType: 'TWITTERADD',
                                            pageId: requestPageTwitter.data.pageId
                                        },
                                        method: 'post',
                                        url: `${bridgeEndpoint}processlaraigo/twitter/managetwitterlink`
                                    });

                                    if (requestCreateTwitter.data.success) {
                                        if (channelTotal === '') {
                                            channelTotal = `${transactionCreateTwitter[0].ufn_communicationchannel_ins2}`;
                                        }
                                        else {
                                            channelTotal = `${channelTotal},${transactionCreateTwitter[0].ufn_communicationchannel_ins2}`;
                                        }

                                        channelData = `<b>${channelParameters.description}</b>;${channelData}`;
                                    }
                                    else {
                                        channelParameters.id = transactionCreateTwitter[0].ufn_communicationchannel_ins2;
                                        channelParameters.motive = 'Delete from API';
                                        channelParameters.operation = 'DELETE';

                                        const transactionDeleteTwitter = await triggerfunctions.executesimpletransaction(method, parameters);

                                        if (transactionDeleteTwitter instanceof Array) {
                                            return result.status(400).json({
                                                msg: requestCreateTwitter.data.operationMessage,
                                                success: false,
                                                error: true
                                            });
                                        }
                                        else {
                                            return result.status(400).json({
                                                msg: transactionDeleteTwitter.code,
                                                success: false,
                                                error: true
                                            });
                                        }
                                    }
                                }
                                else {
                                    return result.status(400).json({
                                        msg: transactionCreateTwitter.code,
                                        success: false,
                                        error: true
                                    });
                                }
                            }
                            else {
                                return result.status(400).json({
                                    msg: requestPageTwitter.data.operationMessage,
                                    success: false,
                                    error: true
                                });
                            }
                            break;

                        case 'WHATSAPP':
                            const requestCreateWhatsApp = await axios({
                                data: {
                                    accessToken: channelService.accesstoken,
                                    linkType: 'WHATSAPPADD'
                                },
                                method: 'post',
                                url: `${bridgeEndpoint}processlaraigo/whatsapp/managewhatsapplink`
                            });
                        
                            if (requestCreateWhatsApp.data.success) {
                                var serviceCredentials = {
                                    apiKey: channelService.accesstoken,
                                    endpoint: whatsAppEndpoint,
                                    number: requestCreateWhatsApp.data.phoneNumber
                                };
                            
                                channelParameters.communicationchannelsite = requestCreateWhatsApp.data.phoneNumber;
                                channelParameters.servicecredentials = JSON.stringify(serviceCredentials);
                                channelParameters.type = 'WHAD';

                                channelMethodArray.push(channelMethod);
                                channelParametersArray.push(channelParameters);
                                channelServiceArray.push(channelService);
                            }
                            else {
                                return result.status(400).json({
                                    msg: requestCreateWhatsApp.data.operationMessage,
                                    success: false,
                                    error: true
                                });
                            }
                            break;

                        case 'WHATSAPPSMOOCH':
                            channelParameters.communicationchannelowner = '';
                            channelParameters.communicationchannelsite = '';
                            channelParameters.servicecredentials = JSON.stringify(channelService);
                            channelParameters.status = 'PENDIENTE';
                            channelParameters.type = 'WHAT';

                            channelMethodArray.push(channelMethod);
                            channelParametersArray.push(channelParameters);
                            channelServiceArray.push(channelService);
                            break;
                    }
                }
            }
        }

        parameters.password = await bcryptjs.hash(parameters.password, await bcryptjs.genSalt(10));
        
        if (typeof parameters.country === 'undefined' || !parameters.country) {
            parameters.country = null;
        }

        if (typeof parameters.currency === 'undefined' || !parameters.currency) {
            parameters.currency = null;
        }

        const transactionCreateSubscription = await triggerfunctions.executesimpletransaction(method, parameters);

        if (transactionCreateSubscription instanceof Array) {
            if (transactionCreateSubscription.length > 0) {
                var corpId = transactionCreateSubscription[0].corpid;
                var index = 0;
                var orgId = transactionCreateSubscription[0].orgid;
                var userId = transactionCreateSubscription[0].userid;

                if (typeof channelMethodArray !== 'undefined' && channelMethodArray) {
                    for (const channel of channelMethodArray) {
                        channelParametersArray[index].corpid = corpId;
                        channelParametersArray[index].orgid = orgId;
                        channelParametersArray[index].username = parameters.username;

                        const transactionCreateGeneric = await triggerfunctions.executesimpletransaction(channelMethodArray[index], channelParametersArray[index]);

                        if (transactionCreateGeneric instanceof Array) {
                            if (channelTotal === '') {
                                channelTotal = `${transactionCreateGeneric[0].ufn_communicationchannel_ins2}`;
                            }
                            else {
                                channelTotal = `${channelTotal},${transactionCreateGeneric[0].ufn_communicationchannel_ins2}`;
                            }

                            channelData = `<b>${channelParametersArray[index].description}</b>;${channelData}`;

                            try {
                                if (channelParametersArray[index].type === 'CHAZ') {
                                    if (typeof webChatPlatformEndpoint !== 'undefined' && webChatPlatformEndpoint) {
                                        await axios({
                                            data: channelParametersArray[index],
                                            method: 'post',
                                            url: `${webChatPlatformEndpoint}integration/addtodatabase`
                                        });
                                    }
                                }
                            }
                            catch (exception) {
                                console.log(JSON.stringify(exception));
                            }
                        }
                        else {
                            return result.status(400).json({
                                msg: transactionCreateGeneric.code,
                                success: false,
                                error: true
                            });
                        }

                        if (channelParametersArray[index].type === 'WHAT') {
                            if ((typeof channelServiceArray[index] !== 'undefined' && channelServiceArray[index])) {
                                var domainMethod = 'UFN_DOMAIN_VALUES_SEL';
                                var domainParameters = {
                                    all: false,
                                    corpid: 1,
                                    domainname: 'WHATSAPPRECIPIENT',
                                    orgid: 0,
                                    username: parameters.username
                                };

                                const transactionGetRecipient = await triggerfunctions.executesimpletransaction(domainMethod, domainParameters);

                                if (transactionGetRecipient instanceof Array) {
                                    if (transactionGetRecipient.length > 0) {
                                        domainParameters = {
                                            all: false,
                                            corpid: 1,
                                            domainname: 'WHATSAPPSUBJECT',
                                            orgid: 0,
                                            username: parameters.username
                                        };

                                        const transactionGetSubject = await triggerfunctions.executesimpletransaction(domainMethod, domainParameters);

                                        if (transactionGetSubject instanceof Array) {
                                            if (transactionGetSubject.length > 0) {
                                                domainParameters = {
                                                    all: false,
                                                    corpid: 1,
                                                    domainname: 'WHATSAPPBODY',
                                                    orgid: 0,
                                                    username: parameters.username
                                                };

                                                const transactionGetBody = await triggerfunctions.executesimpletransaction(domainMethod, domainParameters);

                                                if (transactionGetBody instanceof Array) {
                                                    if (transactionGetBody.length > 0) {
                                                        var mailBody = transactionGetBody[0].domainvalue;
                                                        var mailRecipient = transactionGetRecipient[0].domainvalue;
                                                        var mailSubject = transactionGetSubject[0].domainvalue;

                                                        mailBody = mailBody.split("{{brandname}}").join(channelServiceArray[index].brandname);
                                                        mailBody = mailBody.split("{{brandaddress}}").join(channelServiceArray[index].brandaddress);
                                                        mailBody = mailBody.split("{{firstname}}").join(channelServiceArray[index].firstname);
                                                        mailBody = mailBody.split("{{lastname}}").join(channelServiceArray[index].lastname);
                                                        mailBody = mailBody.split("{{email}}").join(channelServiceArray[index].email);
                                                        mailBody = mailBody.split("{{phone}}").join(channelServiceArray[index].phone);
                                                        mailBody = mailBody.split("{{customerfacebookid}}").join(channelServiceArray[index].customerfacebookid);
                                                        mailBody = mailBody.split("{{phonenumberwhatsappbusiness}}").join(channelServiceArray[index].phonenumberwhatsappbusiness);
                                                        mailBody = mailBody.split("{{nameassociatednumber}}").join(channelServiceArray[index].nameassociatednumber);
                                                        mailBody = mailBody.split("{{corpid}}").join(corpId);
                                                        mailBody = mailBody.split("{{orgid}}").join(orgId);
                                                        mailBody = mailBody.split("{{username}}").join(parameters.username);

                                                        mailSubject = mailSubject.split("{{brandname}}").join(channelServiceArray[index].brandname);
                                                        mailSubject = mailSubject.split("{{brandaddress}}").join(channelServiceArray[index].brandaddress);
                                                        mailSubject = mailSubject.split("{{firstname}}").join(channelServiceArray[index].firstname);
                                                        mailSubject = mailSubject.split("{{lastname}}").join(channelServiceArray[index].lastname);
                                                        mailSubject = mailSubject.split("{{email}}").join(channelServiceArray[index].email);
                                                        mailSubject = mailSubject.split("{{phone}}").join(channelServiceArray[index].phone);
                                                        mailSubject = mailSubject.split("{{customerfacebookid}}").join(channelServiceArray[index].customerfacebookid);
                                                        mailSubject = mailSubject.split("{{phonenumberwhatsappbusiness}}").join(channelServiceArray[index].phonenumberwhatsappbusiness);
                                                        mailSubject = mailSubject.split("{{nameassociatednumber}}").join(channelServiceArray[index].nameassociatednumber);
                                                        mailSubject = mailSubject.split("{{corpid}}").join(corpId);
                                                        mailSubject = mailSubject.split("{{orgid}}").join(orgId);
                                                        mailSubject = mailSubject.split("{{username}}").join(parameters.username);

                                                        const requestSendMail = await axios({
                                                            data: {
                                                                mailAddress: mailRecipient,
                                                                mailBody: mailBody,
                                                                mailTitle: mailSubject
                                                            },
                                                            method: 'post',
                                                            url: `${bridgeEndpoint}processscheduler/sendmail`
                                                        });
                            
                                                        if (!requestSendMail.data.success) {
                                                            return result.status(400).json({
                                                                msg: requestSendMail.data.operationMessage,
                                                                success: false,
                                                                error: true
                                                            });
                                                        }
                                                    }
                                                }
                                                else {
                                                    return result.status(400).json({
                                                        msg: transactionGetBody.code,
                                                        success: false,
                                                        error: true
                                                    });
                                                }
                                            }
                                        }
                                        else {
                                            return result.status(400).json({
                                                msg: transactionGetSubject.code,
                                                success: false,
                                                error: true
                                            });
                                        }
                                    }
                                }
                                else {
                                    return result.status(400).json({
                                        msg: transactionGetRecipient.code,
                                        success: false,
                                        error: true
                                    });
                                }
                            }
                        }

                        index++;
                    }
                }

                if (channelTotal !== '') {
                    var updateMethod = 'UFN_ORGUSER_CHANNELS_UPDATE';
                    var updateParameters = {
                        channels: channelTotal,
                        corpid: corpId,
                        orgid: orgId,
                        userid: userId
                    }

                    const transactionUpdateUser = await triggerfunctions.executesimpletransaction(updateMethod, updateParameters);

                    if (!transactionUpdateUser instanceof Array) {
                        return result.status(400).json({
                            msg: transactionUpdateUser.code,
                            success: false,
                            error: true
                        });
                    }
                }
            }
            else {
                return result.status(400).json({
                    msg: 'Not found',
                    success: false,
                    error: true
                });
            }
        }
        else {
            return result.status(400).json({
                msg: transactionCreateSubscription.code,
                success: false,
                error: true
            });
        }

        if ((typeof parameters.facebookid !== 'undefined' && parameters.facebookid) || (typeof parameters.googleid !== 'undefined' && parameters.googleid)) {
            return result.json({
                success: true
            });
        }
        else {
            var domainMethod = 'UFN_DOMAIN_VALUES_SEL';
            var domainParameters = {
                all: false,
                corpid: 1,
                domainname: 'ACTIVATESUBJECT',
                orgid: 0,
                username: parameters.username
            };

            const transactionGetSubject = await triggerfunctions.executesimpletransaction(domainMethod, domainParameters);

            if (transactionGetSubject instanceof Array) {
                if (transactionGetSubject.length > 0) {
                    domainParameters = {
                        all: false,
                        corpid: 1,
                        domainname: 'ACTIVATEBODY',
                        orgid: 0,
                        username: parameters.username
                    };

                    const transactionGetBody = await triggerfunctions.executesimpletransaction(domainMethod, domainParameters);

                    if (transactionGetBody instanceof Array) {
                        if (transactionGetBody.length > 0) {
                            var userCode = cryptojs.AES.encrypt(JSON.stringify({ username: parameters.username, firstname: parameters.firstname }), userSecret).toString();

                            var processedUserCode = userCode;

                            processedUserCode = processedUserCode.split("=").join("_EQUAL_");
                            processedUserCode = processedUserCode.split("/").join("_SLASH_");
                            processedUserCode = processedUserCode.split("+").join("_PLUS_");

                            var mailBody = transactionGetBody[0].domainvalue;

                            mailBody = mailBody.split("{{link}}").join(`${laraigoEndpoint}activateuser/${encodeURIComponent(processedUserCode)}`);
                            mailBody = mailBody.split("{{organizationname}}").join(parameters.organizationname);
                            mailBody = mailBody.split("{{countryname}}").join(parameters.countryname);
                            mailBody = mailBody.split("{{paymentplan}}").join(parameters.paymentplan);
                            mailBody = mailBody.split("{{firstname}}").join(parameters.firstname);
                            mailBody = mailBody.split("{{lastname}}").join(parameters.lastname);
                            mailBody = mailBody.split("{{username}}").join(parameters.username);
                            mailBody = mailBody.split("{{country}}").join(parameters.country);
                            mailBody = mailBody.split("{{channeldata}}").join(channelData);

                            var mailSubject = transactionGetSubject[0].domainvalue;

                            mailSubject = mailSubject.split("{{organizationname}}").join(parameters.organizationname);
                            mailSubject = mailSubject.split("{{countryname}}").join(parameters.countryname);
                            mailSubject = mailSubject.split("{{paymentplan}}").join(parameters.paymentplan);
                            mailSubject = mailSubject.split("{{firstname}}").join(parameters.firstname);
                            mailSubject = mailSubject.split("{{lastname}}").join(parameters.lastname);
                            mailSubject = mailSubject.split("{{username}}").join(parameters.username);
                            mailSubject = mailSubject.split("{{country}}").join(parameters.country);
                            mailSubject = mailSubject.split("{{channeldata}}").join(channelData);

                            const requestSendMail = await axios({
                                data: {
                                    mailAddress: parameters.username,
                                    mailBody: mailBody,
                                    mailTitle: mailSubject
                                },
                                method: 'post',
                                url: `${bridgeEndpoint}processscheduler/sendmail`
                            });

                            if (requestSendMail.data.success) {
                                return result.json({
                                    success: true
                                });
                            }
                            else {
                                return result.status(400).json({
                                    msg: requestSendMail.data.operationMessage,
                                    success: false,
                                    error: true
                                });
                            }
                        }
                    }
                    else {
                        return result.status(400).json({
                            msg: transactionGetBody.code,
                            success: false,
                            error: true
                        });
                    }
                }
            }
            else {
                return result.status(400).json({
                    msg: transactionGetSubject.code,
                    success: false,
                    error: true
                });
            }
        }

        return result.json({
            success: false,
            error: true
        });
    }
    catch (exception) {
        return result.status(500).json({
            msg: exception.message,
            success: false,
            error: true
        });
    }
}

exports.getPageList = async (request, result) => {
    try {
        if (typeof whitelist !== 'undefined' && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return result.status(400).json({
                    msg: 'Unauthorized',
                    success: false,
                    error: true
                });
            }
        }

        const requestGetFacebook = await axios({
            data: {
                accessToken: request.body.accessToken,
                linkType: 'GETPAGES'
            },
            method: 'post',
            url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`
        });

        if (requestGetFacebook.data.success) {
            return result.json({
                pageData: requestGetFacebook.data.pageData,
                success: true
            });
        }
        else {
            return result.status(400).json({
                msg: requestGetFacebook.data.operationMessage,
                success: false,
                error: true
            });
        }
    }
    catch (exception) {
        return result.status(500).json({
            msg: exception.message,
            success: false,
            error: true
        });
    }
}

exports.validateUserId = async (request, result) => {
    try {
        if (typeof whitelist !== 'undefined' && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return result.status(400).json({
                    msg: 'Unauthorized',
                    success: false,
                    error: true
                });
            }
        }

        var { method, parameters = {} } = request.body;

        setSessionParameters(parameters, request.user);

        parameters.password = await bcryptjs.hash(parameters.password, await bcryptjs.genSalt(10));
        parameters.userid = request.user.userid;

        const transactionSelectUser = await triggerfunctions.executesimpletransaction(method, parameters);

        if (transactionSelectUser instanceof Array) {
            if (transactionSelectUser.length > 0) {
                parameters.password = await bcryptjs.hash(parameters.newpassword, await bcryptjs.genSalt(10));

                const transactionUpdateUser = await triggerfunctions.executesimpletransaction('UFN_USER_UPDATE', parameters);

                if (transactionSelectUser instanceof Array) {
                    return result.json({
                        success: true
                    });
                }
                else {
                    return result.status(400).json({
                        msg: transactionUpdateUser.code,
                        success: false,
                        error: true
                    });
                }
            }
            else {
                return result.status(400).json({
                    msg: 'Password does not match',
                    success: false,
                    error: true
                });
            }
        }
        else {
            return result.status(400).json({
                msg: transactionSelectUser.code,
                success: false,
                error: true
            });
        }
    }
    catch (exception) {
        return result.status(500).json({
            msg: exception.message,
            success: false,
            error: true
        });
    }
}

exports.validateUsername = async (request, result) => {
    try {
        if (typeof whitelist !== 'undefined' && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return result.status(400).json({
                    msg: 'Unauthorized',
                    success: false,
                    error: true
                });
            }
        }

        var { method, parameters = {} } = request.body;

        if (typeof parameters.facebookid !== 'undefined' && parameters.facebookid) {
            parameters.googleid = null;
            parameters.usr = null;
        }

        if (typeof parameters.googleid !== 'undefined' && parameters.googleid) {
            parameters.facebookid = null;
            parameters.usr = null;
        }

        const transactionSelectUser = await triggerfunctions.executesimpletransaction(method, parameters);

        if (transactionSelectUser instanceof Array) {
            if (transactionSelectUser.length > 0) {
                return result.json({
                    isvalid: false,
                    success: true
                });
            }
            else {
                return result.json({
                    isvalid: true,
                    success: true
                });
            }
        }
        else {
            return result.status(400).json({
                msg: transactionSelectUser.code,
                success: false,
                error: true
            });
        }
    }
    catch (exception) {
        return result.status(500).json({
            msg: exception.message,
            success: false,
            error: true
        });
    }
}

exports.currencyList = async (request, result) => {
    try {
        if (typeof whitelist !== 'undefined' && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return result.status(400).json({
                    msg: 'Unauthorized',
                    success: false,
                    error: true
                });
            }
        }

        const queryResult = await triggerfunctions.executesimpletransaction('UFN_CURRENCY_SEL', {});

        if (queryResult instanceof Array) {
            return result.json({ error: false, success: true, data: queryResult });
        }
        else
            return result.status(400).json({ error: true, success: false, data: queryResult });
    }
    catch (exception) {
        return result.status(500).json({
            msg: exception.message,
            success: false,
            error: true
        });
    }
}

exports.countryList = async (request, result) => {
    try {
        if (typeof whitelist !== 'undefined' && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return result.status(400).json({
                    msg: 'Unauthorized',
                    success: false,
                    error: true
                });
            }
        }

        const queryResult = await triggerfunctions.executesimpletransaction('UFN_COUNTRY_SEL', {});

        if (queryResult instanceof Array) {
            return result.json({ error: false, success: true, data: queryResult });
        }
        else
            return result.status(400).json({ error: true, success: false, data: queryResult });
    }
    catch (exception) {
        return result.status(500).json({
            msg: exception.message,
            success: false,
            error: true
        });
    }
}