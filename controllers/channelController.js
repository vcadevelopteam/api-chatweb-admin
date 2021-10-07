const axios = require('axios');
const triggerfunctions = require('../config/triggerfunctions');

const { setSessionParameters } = require('../config/helpers');

const bridgeEndpoint = process.env.BRIDGE;
const brokerEndpoint = process.env.CHATBROKER;
const facebookEndpoint = process.env.FACEBOOKAPI;
const hookEndpoint = process.env.HOOK;
const telegramEndpoint = process.env.TELEGRAMAPI;
const webChatApplication = process.env.CHATAPPLICATION;
const webChatPlatformEndpoint = process.env.WEBCHATPLATFORM;
const webChatScriptEndpoint = process.env.WEBCHATSCRIPT;
const whatsAppEndpoint = process.env.WHATSAPPAPI;

exports.deleteChannel = async (request, result) => {
    try {
        var { method, parameters = {} } = request.body;

        setSessionParameters(parameters, request.user);

        parameters.corpid = request.user.corpid;
        parameters.motive = 'Delete from API';
        parameters.operation = 'DELETE';
        parameters.orgid = request.user.orgid;
        parameters.status = 'ELIMINADO';
        parameters.updintegration = null;
        parameters.username = request.user.usr;

        switch (parameters.type) {
            case 'CHAZ':
                if (typeof parameters.communicationchannelcontact !== 'undefined' && parameters.communicationchannelcontact) {
                    await axios({
                        data: {
                            status: 'ELIMINADO'
                        },
                        method: 'put',
                        url: `${brokerEndpoint}plugins/update/${parameters.communicationchannelcontact}`
                    });
                }

                if (typeof parameters.communicationchannelowner !== 'undefined' && parameters.communicationchannelowner) {
                    await axios({
                        data: {
                            status: 'ELIMINADO'
                        },
                        method: 'put',
                        url: `${brokerEndpoint}webhooks/update/${parameters.communicationchannelowner}`
                    });
                }

                if (typeof parameters.integrationid !== 'undefined' && parameters.integrationid) {
                    await axios({
                        data: {
                            status: 'ELIMINADO'
                        },
                        method: 'put',
                        url: `${brokerEndpoint}integrations/update/${parameters.integrationid}`
                    });
                }

                const transactionDeleteChatWeb = await triggerfunctions.executesimpletransaction(method, parameters);

                if (transactionDeleteChatWeb instanceof Array) {
                    return result.json({
                        success: true
                    });
                }
                else {
                    return result.status(400).json({
                        msg: transactionDeleteChatWeb.code,
                        success: false
                    });
                }

            case 'FBDM':
            case 'FBWA':
            case 'INST':
                if (typeof parameters.servicecredentials !== 'undefined' && parameters.servicecredentials) {
                    var serviceCredentials = JSON.parse(parameters.serviceCredentials);
                    var linkType = '';

                    if (parameters.type === 'FBDM') {
                        linkType = 'MESSENGERREMOVE';
                    }

                    if (parameters.type === 'FBWA') {
                        linkType = 'WALLREMOVE';
                    }

                    if (parameters.type === 'INST') {
                        linkType = 'INSTAGRAMREMOVE';
                    }

                    const requestDeleteFacebook = await axios({
                        data: {
                            accessToken: serviceCredentials.accessToken,
                            linkType: linkType,
                            siteId: (parameters.type !== 'INST' ? serviceCredentials.siteId : parameters.communicationchannelowner)
                        },
                        method: 'post',
                        url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`
                    });

                    if (requestDeleteFacebook.data.success) {
                        const transactionDeleteFacebook = await triggerfunctions.executesimpletransaction(method, parameters);

                        if (transactionDeleteFacebook instanceof Array) {
                            return result.json({
                                success: true
                            });
                        }
                        else {
                            return result.status(400).json({
                                msg: transactionDeleteFacebook.code,
                                success: false
                            });
                        }
                    }
                    else {
                        return result.status(400).json({
                            msg: requestDeleteFacebook.data.operationMessage,
                            success: false
                        });
                    }
                }
                else {
                    const transactionDeleteFacebook = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionDeleteFacebook instanceof Array) {
                        return result.json({
                            success: true
                        });
                    }
                    else {
                        return result.status(400).json({
                            msg: transactionDeleteFacebook.code,
                            success: false
                        });
                    }
                }

            case 'TELE':
                if (typeof parameters.servicecredentials !== 'undefined' && parameters.servicecredentials) {
                    var serviceCredentials = JSON.parse(parameters.servicecredentials);

                    const requestDeleteTelegram = await axios({
                        data: {
                            accessToken: serviceCredentials.token,
                            linkType: 'TELEGRAMREMOVE',
                            siteId: serviceCredentials.bot
                        },
                        method: 'post',
                        url: `${bridgeEndpoint}processlaraigo/telegram/managetelegramlink`
                    });

                    if (requestDeleteTelegram.data.success) {
                        const transactionDeleteTelegram = await triggerfunctions.executesimpletransaction(method, parameters);

                        if (transactionDeleteTelegram instanceof Array) {
                            return result.json({
                                success: true
                            });
                        }
                        else {
                            return result.status(400).json({
                                msg: transactionDeleteTelegram.code,
                                success: false
                            });
                        }
                    }
                    else {
                        return result.status(400).json({
                            msg: requestDeleteTelegram.data.operationMessage,
                            success: false
                        });
                    }
                }
                else {
                    const transactionDeleteTelegram = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionDeleteTelegram instanceof Array) {
                        return result.json({
                            success: true
                        });
                    }
                    else {
                        return result.status(400).json({
                            msg: transactionDeleteTelegram.code,
                            success: false
                        });
                    }
                }

            case 'TWIT':
            case 'TWMS':
                if (typeof parameters.servicecredentials !== 'undefined' && parameters.servicecredentials) {
                    var serviceCredentials = JSON.parse(parameters.servicecredentials);

                    var validateMethod = 'UFN_COMMUNICATIONCHANNELSITE_SEL';
                    var validateParameters = {
                        communicationchannelsite: serviceCredentials.twitterPageId,
                        type: (parameters.type === 'TWIT' ? 'TWMS' : 'TWIT')
                    };

                    const transactionValidateTwitter = await triggerfunctions.executesimpletransaction(validateMethod, validateParameters);

                    if (transactionValidateTwitter instanceof Array) {
                        if (transactionValidateTwitter.length > 0) {
                            const transactionDeleteTwitter = await triggerfunctions.executesimpletransaction(method, parameters);

                            if (transactionDeleteTwitter instanceof Array) {
                                return result.json({
                                    success: true
                                });
                            }
                            else {
                                return result.status(400).json({
                                    msg: transactionDeleteTwitter.code,
                                    success: false
                                });
                            }
                        }
                        else {
                            const requestDeleteTwitter = await axios({
                                data: {
                                    accessSecret: serviceCredentials.accessSecret,
                                    accessToken: serviceCredentials.accessToken,
                                    consumerKey: serviceCredentials.consumerKey,
                                    consumerSecret: serviceCredentials.consumerSecret,
                                    developmentEnvironment: serviceCredentials.devEnvironment,
                                    linkType: 'TWITTERREMOVE',
                                    siteId: serviceCredentials.twitterPageId
                                },
                                method: 'post',
                                url: `${bridgeEndpoint}processlaraigo/twitter/managetwitterlink`
                            });

                            if (requestDeleteTwitter.data.success) {
                                const transactionDeleteTwitter = await triggerfunctions.executesimpletransaction(method, parameters);

                                if (transactionDeleteTwitter instanceof Array) {
                                    var serviceMethod = 'UFN_COMMUNICATIONCHANNELHOOK_INS';
                                    var serviceParameters = {
                                        operation: 'DELETE',
                                        site: serviceCredentials.twitterPageId,
                                        type: 'TWTR'
                                    };

                                    const transactionServiceTwitter = await triggerfunctions.executesimpletransaction(serviceMethod, serviceParameters);

                                    if (transactionServiceTwitter instanceof Array) {
                                        return result.json({
                                            success: true
                                        });
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
                                        msg: transactionDeleteTwitter.code,
                                        success: false
                                    });
                                }
                            }
                            else {
                                return result.status(400).json({
                                    msg: requestDeleteTwitter.data.operationMessage,
                                    success: false
                                });
                            }
                        }
                    }
                    else {
                        return result.status(400).json({
                            msg: transactionValidateTwitter.code,
                            success: false
                        });
                    }
                }
                else {
                    const transactionDeleteTwitter = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionDeleteTwitter instanceof Array) {
                        return result.json({
                            success: true
                        });
                    }
                    else {
                        return result.status(400).json({
                            msg: transactionDeleteTwitter.code,
                            success: false
                        });
                    }
                }

            case 'WHAD':
                if (typeof parameters.servicecredentials !== 'undefined' && parameters.servicecredentials) {
                    var serviceCredentials = JSON.parse(parameters.servicecredentials);

                    const requestDeleteWhatsApp = await axios({
                        data: {
                            accessToken: serviceCredentials.apiKey,
                            linkType: 'WHATSAPPREMOVE',
                            siteId: serviceCredentials.number
                        },
                        method: 'post',
                        url: `${bridgeEndpoint}processlaraigo/whatsapp/managewhatsapplink`
                    });

                    if (requestDeleteWhatsApp.data.success) {
                        const transactionDeleteWhatsApp = await triggerfunctions.executesimpletransaction(method, parameters);

                        if (transactionDeleteWhatsApp instanceof Array) {
                            return result.json({
                                success: true
                            });
                        }
                        else {
                            return result.status(400).json({
                                msg: transactionDeleteWhatsApp.code,
                                success: false
                            });
                        }
                    }
                    else {
                        return result.status(400).json({
                            msg: requestDeleteWhatsApp.data.operationMessage,
                            success: false
                        });
                    }
                }
                else {
                    const transactionDeleteWhatsApp = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionDeleteWhatsApp instanceof Array) {
                        return result.json({
                            success: true
                        });
                    }
                    else {
                        return result.status(400).json({
                            msg: transactionDeleteWhatsApp.code,
                            success: false
                        });
                    }
                }

            default:
                const transactionDeleteGeneric = await triggerfunctions.executesimpletransaction(method, parameters);

                if (transactionDeleteGeneric instanceof Array) {
                    return result.json({
                        success: true
                    });
                }
                else {
                    return result.status(400).json({
                        msg: transactionDeleteGeneric.code,
                        success: false
                    });
                }
        }
    }
    catch (exception) {
        return result.status(500).json({
            msg: exception.message,
            success: false
        });
    }
}

exports.getChannelService = async (request, result) => {
    try {
        var method = null;
        var parameters = null;

        if (request.body.siteType === 'SMCH') {
            method = 'UFN_COMMUNICATIONCHANNELSITE_SMOOCH_SEL';
            parameters = {
                communicationchannelsite: request.body.siteId
            };
        }
        else {
            if (request.body.siteType === 'TWTR') {
                method = 'UFN_COMMUNICATIONCHANNELHOOK_SEL';
                parameters = {
                    site: request.body.siteId,
                    type: request.body.siteType
                };
            }
            else {
                method = 'UFN_COMMUNICATIONCHANNELSITE_SEL';
                parameters = {
                    communicationchannelsite: request.body.siteId,
                    type: request.body.siteType,
                };
            }
        }

        const transactionSelectCredentials = await triggerfunctions.executesimpletransaction(method, parameters);

        if (transactionSelectCredentials instanceof Array) {
            if (transactionSelectCredentials.length > 0) {
                if (request.body.siteType !== 'TWTR') {
                    return result.json({
                        serviceData: transactionSelectCredentials[0].servicecredentials,
                        success: true
                    });
                }
                else {
                    return result.json({
                        serviceData: transactionSelectCredentials[0].servicedata,
                        success: true
                    });
                }
            }
            else {
                return result.json({
                    msg: 'Not found',
                    success: false
                });
            }
        }
        else {
            return result.status(400).json({
                msg: transactionSelectCredentials.code,
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

exports.getLongToken = async (request, result) => {
    try {
        setSessionParameters(parameters, request.user);

        const requestGetLongToken = await axios({
            data: {
                accessToken: request.body.accessToken,
                appId: request.body.appId,
                linkType: 'GENERATELONGTOKEN'
            },
            method: 'post',
            url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`
        });

        if (requestGetLongToken.data.success) {
            return result.json({
                longToken: requestGetLongToken.data.longToken,
                success: true
            });
        }
        else {
            return result.status(400).json({
                msg: requestGetLongToken.data.operationMessage,
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

exports.getPageList = async (request, result) => {
    try {
        setSessionParameters(parameters, request.user);

        const requestGetPageList = await axios({
            data: {
                accessToken: request.body.accessToken,
                linkType: 'GETPAGES'
            },
            method: 'post',
            url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`
        });

        if (requestGetPageList.data.success) {
            return result.json({
                pageData: requestGetPageList.data.pageData,
                success: true
            });
        }
        else {
            return result.status(400).json({
                msg: requestGetPageList.data.operationMessage,
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

exports.insertChannel = async (request, result) => {
    try {
        var { method, parameters = {}, service = {} } = request.body;

        setSessionParameters(parameters, request.user);        

        parameters.appintegrationid = null;
        parameters.botconfigurationid = null;
        parameters.botenabled = null;
        parameters.channelparameters = null;
        parameters.coloricon = null;
        parameters.communicationchannelcontact = '';
        parameters.communicationchanneltoken = null;
        parameters.corpid = request.user.corpid;
        parameters.country = null;
        parameters.customicon = null;
        parameters.motive = 'Insert from API';
        parameters.operation = 'INSERT';
        parameters.orgid = request.user.orgid;
        parameters.resolvelithium = null;
        parameters.schedule = null;
        parameters.status = 'ACTIVO';
        parameters.updintegration = null;
        parameters.username = request.user.usr;
       
        switch (request.body.type) {
            case 'CHATWEB':
                const webChatData = {
                    applicationId: webChatApplication,
                    name: parameters.description,
                    status: 'ACTIVO',
                    type: 'CHAZ',
                    metadata: {
                        color: {
                            chatBackgroundColor: service.color ? service.color.background : '',
                            chatBorderColor: service.color ? service.color.border : '',
                            chatHeaderColor: service.color ? service.color.header : '',
                            messageBotColor: service.color ? service.color.bot : '',
                            messageClientColor: service.color ? service.color.client : ''
                        },
                        extra: {
                            abandonendpoint: `${webChatScriptEndpoint}smooch`,
                            cssbody: '',
                            enableabandon: service.extra ? service.extra.abandonevent : false,
                            enableformhistory: service.extra ? service.extra.formhistory : false,
                            enableidlemessage: service.bubble ? service.bubble.active : false,
                            headermessage: service.extra ? service.extra.botnametext : '',
                            inputalwaysactive: service.extra ? service.extra.persistentinput : false,
                            jsscript: service.extra ? service.extra.customjs : '',
                            playalertsound: service.extra ? service.extra.alertsound : false,
                            sendmetadata: service.extra ? service.extra.enablemetadata : false,
                            showchatrestart: service.extra ? service.extra.reloadchat : false,
                            showmessageheader: service.extra ? service.extra.botnameenabled : false,
                            showplatformlogo: service.extra ? service.extra.poweredby : false,
                            uploadaudio: service.extra ? service.extra.uploadaudio : false,
                            uploadfile: service.extra ? service.extra.uploadfile : false,
                            uploadimage: service.extra ? service.extra.uploadimage : false,
                            uploadlocation: service.extra ? service.extra.uploadlocation : false,
                            uploadvideo: service.extra ? service.extra.uploadvideo : false
                        },
                        form: service.form ? service.form : null,
                        icons: {
                            chatBotImage: service.interface ? service.interface.iconbot : '',
                            chatHeaderImage: service.interface ? service.interface.iconheader : '',
                            chatIdleImage: service.bubble ? service.bubble.iconbubble : '',
                            chatOpenImage: service.interface ? service.interface.iconbutton : ''
                        },
                        personalization: {
                            headerMessage: service.extra ? service.extra.botnametext : '',
                            headerSubTitle: service.interface ? service.interface.chatsubtitle : '',
                            headerTitle: service.interface ? service.interface.chattitle : '',
                            idleMessage: service.bubble ? service.bubble.messagebubble : ''
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
                            description: parameters.description,
                            integration: requestWebChatCreate.data.id,
                            name: parameters.description,
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
                                name: parameters.description,
                                status: 'ACTIVO'
                            },
                            method: 'post',
                            url: `${brokerEndpoint}plugins/save`
                        });

                        if (typeof requestWebChatPlugin.data.id !== 'undefined' && requestWebChatPlugin.data.id) {
                            parameters.apikey = requestWebChatPlugin.data.apiKey;
                            parameters.appintegrationid = webChatApplication;
                            parameters.channelparameters = JSON.stringify(webChatData);
                            parameters.communicationchannelcontact = requestWebChatPlugin.data.id;
                            parameters.communicationchannelowner = requestWebChatWebhook.data.id;
                            parameters.communicationchannelsite = requestWebChatCreate.data.id;
                            parameters.integrationid = requestWebChatCreate.data.id;
                            parameters.servicecredentials = '';
                            parameters.type = 'CHAZ';

                            const transactionCreateWebChat = await triggerfunctions.executesimpletransaction(method, parameters);

                            if (transactionCreateWebChat instanceof Array) {
                                try {
                                    if (typeof webChatPlatformEndpoint !== 'undefined' && webChatPlatformEndpoint) {
                                        await axios({
                                            data: parameters,
                                            method: 'post',
                                            url: `${webChatPlatformEndpoint}integration/addtodatabase`
                                        });
                                    }
                                }
                                catch (exception) {
                                    console.log(JSON.stringify(exception));
                                }

                                return result.json({
                                    integrationid: requestWebChatCreate.data.id,
                                    success: true
                                });
                            }
                            else {
                                return result.status(400).json({
                                    msg: transactionCreateWebChat.code,
                                    success: false
                                });
                            }
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

            case 'FACEBOOK':
            case 'INSTAGRAM':
            case 'MESSENGER':
                const requestGetLongToken = await axios({
                    data: {
                        accessToken: service.accesstoken,
                        appId: service.appid,
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

                    switch (request.body.type) {
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

                        case 'MESSENGER':
                            channelLinkService = 'MESSENGERADD';
                            channelType = 'FBDM';
                            serviceType = 'MESSENGER';
                            break;
                    }

                    if (request.body.type === 'INSTAGRAM') {
                        const requestGetBusiness = await axios({
                            data: {
                                accessToken: service.accesstoken,
                                linkType: 'GETBUSINESS',
                                siteId: service.siteid
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
                            siteId: service.siteid
                        }
                    });

                    if (requestCreateFacebook.data.success) {
                        var serviceCredentials = {
                            accessToken: requestGetLongToken.data.longToken,
                            endpoint: facebookEndpoint,
                            serviceType: serviceType,
                            siteId: service.siteid
                        };

                        if (typeof businessId !== 'undefined' && businessId) {
                            parameters.communicationchannelowner = service.siteid;
                            parameters.communicationchannelsite = businessId;

                            serviceCredentials.siteId = businessId;
                        }

                        parameters.servicecredentials = JSON.stringify(serviceCredentials);
                        parameters.type = channelType;

                        const transactionCreateFacebook = await triggerfunctions.executesimpletransaction(method, parameters);

                        if (transactionCreateFacebook instanceof Array) {
                            return result.json({
                                success: true
                            });
                        }
                        else {
                            return result.status(400).json({
                                msg: transactionCreateFacebook.code,
                                success: false
                            });
                        }
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

            case 'TELEGRAM':
                const requestCreateTelegram = await axios({
                    data: {
                        accessToken: service.accesstoken,
                        linkType: 'TELEGRAMADD',
                        siteId: service.siteid
                    },
                    method: 'post',
                    url: `${bridgeEndpoint}processlaraigo/telegram/managetelegramlink`
                });

                if (requestCreateTelegram.data.success) {
                    var serviceCredentials = {
                        bot: service.siteid,
                        endpoint: telegramEndpoint,
                        token: service.accesstoken
                    };

                    parameters.servicecredentials = JSON.stringify(serviceCredentials);
                    parameters.type = 'TELE';

                    const transactionCreateTelegram = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionCreateTelegram instanceof Array) {
                        return result.json({
                            success: true
                        });
                    }
                    else {
                        return result.status(400).json({
                            msg: transactionCreateTelegram.code,
                            success: false
                        });
                    }
                }
                else {
                    return result.status(400).json({
                        msg: requestCreateTelegram.data.operationMessage,
                        success: false
                    });
                }

            case 'TWITTER':
            case 'TWITTERDM':
                var serviceMethod = 'UFN_COMMUNICATIONCHANNELHOOK_INS';
                var serviceParameters = {
                    operation: 'INSERT',
                    servicedata: JSON.stringify({
                        accessSecret: service.accesssecret,
                        accessToken: service.accesstoken,
                        consumerKey: service.consumerkey,
                        consumerSecret: service.consumersecret,
                        devEnvironment: service.devenvironment,
                        twitterPageId: service.siteid
                    }),
                    site: service.siteid,
                    type: 'TWTR'
                };

                const transactionServiceTwitter = await triggerfunctions.executesimpletransaction(serviceMethod, serviceParameters);

                if (transactionServiceTwitter instanceof Array) {
                    const requestCreateTwitter = await axios({
                        data: {
                            
                            accessSecret: service.accesssecret,
                            accessToken: service.accesstoken,
                            consumerKey: service.consumerkey,
                            consumerSecret: service.consumersecret,
                            developmentEnvironment: service.devenvironment,
                            linkType: 'TWITTERADD',
                            siteId: service.siteid
                        },
                        method: 'post',
                        url: `${bridgeEndpoint}processlaraigo/twitter/managetwitterlink`
                    });

                    if (requestCreateTwitter.data.success) {
                        if (request.body.type === 'TWITTER') {
                            parameters.type = 'TWIT';
                        }
                        else {
                            parameters.type = 'TWMS';
                        }

                        var serviceCredentials = {
                            accessSecret: service.accesssecret,
                            accessToken: service.accesstoken,
                            consumerKey: service.consumerkey,
                            consumerSecret: service.consumersecret,
                            devEnvironment: service.devenvironment,
                            twitterPageId: service.siteid
                        };

                        parameters.servicecredentials = JSON.stringify(serviceCredentials);

                        const transactionCreateTwitter = await triggerfunctions.executesimpletransaction(method, parameters);

                        if (transactionCreateTwitter instanceof Array) {
                            return result.json({
                                success: true
                            });
                        }
                        else {
                            serviceParameters.operation = 'DELETE';

                            const transactionServiceDeleteTwitter = await triggerfunctions.executesimpletransaction(serviceMethod, serviceParameters);
    
                            if (transactionServiceDeleteTwitter instanceof Array) {
                                return result.status(400).json({
                                    msg: transactionCreateTwitter.code,
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

            case 'WHATSAPP':
                const requestCreateWhatsApp = await axios({
                    data: {
                        accessToken: service.accesstoken,
                        linkType: 'WHATSAPPADD',
                        siteId: service.siteid
                    },
                    method: 'post',
                    url: `${bridgeEndpoint}processlaraigo/whatsapp/managewhatsapplink`
                });

                if (requestCreateWhatsApp.data.success) {
                    var serviceCredentials = {
                        apiKey: service.accesstoken,
                        endpoint: whatsAppEndpoint,
                        number: service.siteid
                    };

                    parameters.servicecredentials = JSON.stringify(serviceCredentials);
                    parameters.type = 'WHAD';

                    const transactionCreateWhatsApp = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionCreateWhatsApp instanceof Array) {
                        return result.json({
                            success: true
                        });
                    }
                    else {
                        return result.status(400).json({
                            msg: transactionCreateWhatsApp.code,
                            success: false
                        });
                    }
                }
                else {
                    return result.status(400).json({
                        msg: requestCreateWhatsApp.data.operationMessage,
                        success: false
                    });
                }

            default:
                return result.status(400).json({
                    msg: 'Channel not supported',
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