const triggerfunctions = require('../config/triggerfunctions');
const bcryptjs = require("bcryptjs");
const axios = require('axios');

const bridgeEndpoint = process.env.BRIDGE;
const brokerEndpoint = process.env.CHATBROKER;
const facebookEndpoint = process.env.FACEBOOKAPI;
const hookEndpoint = process.env.HOOK;
const smoochEndpoint = process.env.SMOOCHAPI;
const smoochVersion = process.env.SMOOCHVERSION;
const telegramEndpoint = process.env.TELEGRAMAPI;
const webChatApplication = process.env.CHATAPPLICATION;
const webChatPlatformEndpoint = process.env.WEBCHATPLATFORM;
const webChatScriptEndpoint = process.env.WEBCHATSCRIPT;
const whatsAppEndpoint = process.env.WHATSAPPAPI;
const whitelist = process.env.WHITELIST;

exports.createSubscription = async (request, result) => {
    try {
        if (typeof whitelist !== 'undefined' && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return result.status(400).json({
                    msg: 'Unauthorized',
                    success: false
                });
            }
        }

        var { channellist = [], method, parameters = {} } = request.body;
        
        var channelMethodArray = [];
        var channelParametersArray = [];
        var channelServiceArray = [];

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
                                        showplatformlogo: channelService.extra ? channelService.extra.poweredby : false,
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
                                            success: false
                                        });
                                    }
                                }
                                else {
                                    return result.status(400).json({
                                        msg: 'Could not create webhook',
                                        success: false
                                    });
                                }
                            }
                            else {
                                return result.status(400).json({
                                    msg: 'Could not create integration',
                                    success: false
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
                                            success: false
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
                                        success: false
                                    });
                                }
                            }
                            else {
                                return result.status(400).json({
                                    msg: requestGetLongToken.data.operationMessage,
                                    success: false
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
                                        success: false
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
                                    success: false
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
                                var serviceMethod = 'UFN_COMMUNICATIONCHANNELHOOK_INS';
                                var serviceParameters = {
                                    operation: 'INSERT',
                                    servicedata: JSON.stringify({
                                        accessSecret: channelService.accesssecret,
                                        accessToken: channelService.accesstoken,
                                        consumerKey: channelService.consumerkey,
                                        consumerSecret: channelService.consumersecret,
                                        devEnvironment: channelService.devenvironment,
                                        twitterPageId: requestPageTwitter.data.pageId
                                    }),
                                    site: requestPageTwitter.data.pageId,
                                    type: 'TWTR'
                                };

                                const transactionServiceTwitter = await triggerfunctions.executesimpletransaction(serviceMethod, serviceParameters);

                                if (transactionServiceTwitter instanceof Array) {
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
                                        if (channel.type === 'TWITTER') {
                                            channelParameters.type = 'TWIT';
                                        }
                                        else {
                                            channelParameters.type = 'TWMS';
                                        }
    
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
    
                                        channelMethodArray.push(channelMethod);
                                        channelParametersArray.push(channelParameters);
                                        channelServiceArray.push(channelService);
                                    }
                                    else {
                                        serviceParameters.operation = 'DELETE';
    
                                        const transactionServiceDeleteTwitter = await triggerfunctions.executesimpletransaction(serviceMethod, serviceParameters);
    
                                        if (transactionServiceDeleteTwitter instanceof Array) {
                                            return result.status(400).json({
                                                msg: requestCreateTwitter.data.operationMessage,
                                                success: false
                                            });
                                        }
                                        else {
                                            return result.status(400).json({
                                                msg: transactionServiceDeleteTwitter.code,
                                                success: false
                                            });
                                        }
                                    }
                                }
                                else {
                                    return result.status(400).json({
                                        msg: transactionServiceTwitter.code,
                                        success: false
                                    });
                                }
                            }
                            else {
                                return result.status(400).json({
                                    msg: requestPageTwitter.data.operationMessage,
                                    success: false
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
                                    success: false
                                });
                            }
                            break;
                    }
                }
            }
        }

        parameters.password = await bcryptjs.hash(parameters.password, await bcryptjs.genSalt(10));

        const transactionCreateSubscription = await triggerfunctions.executesimpletransaction(method, parameters);

        if (transactionCreateSubscription instanceof Array) {
            if (transactionCreateSubscription.length > 0) {
                var channelTotal = '';
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
                                success: false
                            });
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
                            success: false
                        });
                    }
                }
            }
            else {
                return result.status(400).json({
                    msg: 'Not found',
                    success: false
                });
            }
        }
        else {
            return result.status(400).json({
                msg: transactionCreateSubscription.code,
                success: false
            });
        }

        return result.json({
            success: true
        });
    }
    catch (exception) {
        return result.status(500).json({
            msg: exception.message,
            success: false
        });
    }
}

exports.getPageList = async (request, result) => {
    try {
        if (typeof whitelist !== 'undefined' && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return result.status(400).json({
                    msg: 'Unauthorized',
                    success: false
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
                success: false
            });
        }
    }
    catch (exception) {
        return result.status(500).json({
            msg: exception.message,
            success: false
        });
    }
}

exports.validateUserId = async (request, result) => {
    try {
        if (typeof whitelist !== 'undefined' && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return result.status(400).json({
                    msg: 'Unauthorized',
                    success: false
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
                        success: false
                    });
                }
            }
            else {
                return result.status(400).json({
                    msg: 'Password does not match',
                    success: false
                });
            }
        }
        else {
            return result.status(400).json({
                msg: transactionSelectUser.code,
                success: false
            });
        }
    }
    catch (exception) {
        return result.status(500).json({
            msg: exception.message,
            success: false
        });
    }
}

exports.validateUsername = async (request, result) => {
    try {
        if (typeof whitelist !== 'undefined' && whitelist) {
            if (!whitelist.includes(request.ip)) {
                return result.status(400).json({
                    msg: 'Unauthorized',
                    success: false
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
                success: false
            });
        }
    }
    catch (exception) {
        return result.status(500).json({
            msg: exception.message,
            success: false
        });
    }
}