const axios = require('axios');
const triggerfunctions = require('../config/triggerfunctions');

const { setSessionParameters } = require('../config/helpers');

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

exports.checkPaymentPlan = async (request, result) => {
    try {
        var method = 'UFN_PAYMENTPLAN_CHECK';
        var parameters = {};

        setSessionParameters(parameters, request.user);

        parameters.corpid = request.user.corpid;

        const transactionCheckPaymentPlan = await triggerfunctions.executesimpletransaction(method, parameters);

        if (transactionCheckPaymentPlan instanceof Array) {
            if (transactionCheckPaymentPlan.length > 0) {
                var createChannel = transactionCheckPaymentPlan[0].channelnumber < transactionCheckPaymentPlan[0].channelscontracted ? true : false;

                return result.json({
                    createChannel: createChannel,
                    providerWhatsApp: transactionCheckPaymentPlan[0].providerwhatsapp,
                    success: true
                });
            }
            else {
                return result.json({
                    createChannel: true,
                    providerWhatsApp: 'DIALOG',
                    success: true
                });
            }
        }
        else {
            return result.status(400).json({
                msg: transactionCheckPaymentPlan.code,
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
            case 'ANDR':
            case 'APPL':
                if (typeof parameters.servicecredentials !== 'undefined' && parameters.servicecredentials) {
                    const requestDeleteSmooch = await axios({
                        data: {
                            linkType: parameters.type === 'ANDR' ? 'ANDROIDREMOVE' : 'IOSREMOVE',
                            applicationId: parameters.communicationchannelsite,
                            integrationId: parameters.integrationid
                        },
                        method: 'post',
                        url: `${bridgeEndpoint}processlaraigo/smooch/managesmoochlink`
                    });

                    if (requestDeleteSmooch.data.success) {
                        const transactionDeleteSmooch = await triggerfunctions.executesimpletransaction(method, parameters);

                        if (transactionDeleteSmooch instanceof Array) {
                            return result.json({
                                success: true
                            });
                        }
                        else {
                            return result.status(400).json({
                                msg: transactionDeleteSmooch.code,
                                success: false
                            });
                        }
                    }
                    else {
                        return result.status(400).json({
                            msg: requestDeleteSmooch.data.operationMessage,
                            success: false
                        });
                    }
                }
                else {
                    const transactionDeleteSmooch = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionDeleteSmooch instanceof Array) {
                        return result.json({
                            success: true
                        });
                    }
                    else {
                        return result.status(400).json({
                            msg: transactionDeleteSmooch.code,
                            success: false
                        });
                    }
                }

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
            case 'INDM':
            case 'INST':
                if (typeof parameters.servicecredentials !== 'undefined' && parameters.servicecredentials) {
                    var serviceCredentials = JSON.parse(parameters.servicecredentials);
                    var linkType = '';

                    var DeleteIntegration = true;

                    if (parameters.type === 'FBDM') {
                        linkType = 'MESSENGERREMOVE';
                    }

                    if (parameters.type === 'FBWA') {
                        linkType = 'WALLREMOVE';
                    }

                    if (parameters.type === 'INST' || parameters.type === 'INDM') {
                        linkType = 'INSTAGRAMREMOVE';
                    }

                    if (linkType === 'INSTAGRAMREMOVE') {
                        var validateMethod = 'UFN_COMMUNICATIONCHANNELSITE_SEL';
                        var validateParameters = {
                            communicationchannelsite: serviceCredentials.siteId,
                            type: (parameters.type === 'INST' ? 'INDM' : 'INST')
                        };
    
                        const transactionValidateInstagram = await triggerfunctions.executesimpletransaction(validateMethod, validateParameters);
    
                        if (transactionValidateInstagram instanceof Array) {
                            if (transactionValidateInstagram.length > 0) {
                                DeleteIntegration = false;
                            }
                        }
                        else {
                            return result.status(400).json({
                                msg: transactionValidateInstagram.code,
                                success: false
                            });
                        }
                    }

                    if (DeleteIntegration) {
                        const requestDeleteFacebook = await axios({
                            data: {
                                accessToken: serviceCredentials.accessToken,
                                linkType: linkType,
                                siteId: ((parameters.type === 'INST' || parameters.type === 'INDM') ? parameters.communicationchannelowner : serviceCredentials.siteId)
                            },
                            method: 'post',
                            url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`
                        });

                        if (!requestDeleteFacebook.data.success) {
                            return result.status(400).json({
                                msg: requestDeleteFacebook.data.operationMessage,
                                success: false
                            });
                        }
                    }

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

            case 'INMS':
                if (typeof parameters.servicecredentials !== 'undefined' && parameters.servicecredentials) {
                    var serviceCredentials = JSON.parse(parameters.servicecredentials);
    
                    const requestDeleteInstagramSmooch = await axios({
                        data: {
                            linkType: 'WEBHOOKREMOVE',
                            apiKeyId: serviceCredentials.apiKeyId,
                            apiKeySecret: serviceCredentials.apiKeySecret,
                            applicationId: parameters.communicationchannelsite,
                            integrationId: parameters.integrationid
                        },
                        method: 'post',
                        url: `${bridgeEndpoint}processlaraigo/smooch/managesmoochlink`
                    });
    
                    if (requestDeleteInstagramSmooch.data.success) {
                        const transactionDeleteInstagramSmooch = await triggerfunctions.executesimpletransaction(method, parameters);
    
                        if (transactionDeleteInstagramSmooch instanceof Array) {
                            return result.json({
                                success: true
                            });
                        }
                        else {
                            return result.status(400).json({
                                msg: transactionDeleteInstagramSmooch.code,
                                success: false
                            });
                        }
                    }
                    else {
                        return result.status(400).json({
                            msg: requestDeleteInstagramSmooch.data.operationMessage,
                            success: false
                        });
                    }
                }
                else {
                    const transactionDeleteInstagramSmooch = await triggerfunctions.executesimpletransaction(method, parameters);
    
                    if (transactionDeleteInstagramSmooch instanceof Array) {
                        return result.json({
                            success: true
                        });
                    }
                    else {
                        return result.status(400).json({
                            msg: transactionDeleteInstagramSmooch.code,
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
                                    linkType: 'TWITTERREMOVE'
                                },
                                method: 'post',
                                url: `${bridgeEndpoint}processlaraigo/twitter/managetwitterlink`
                            });

                            if (requestDeleteTwitter.data.success) {
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

            case 'WHAT':
                if (typeof parameters.servicecredentials !== 'undefined' && parameters.servicecredentials) {
                    var serviceCredentials = JSON.parse(parameters.servicecredentials);
        
                    const requestDeleteWhatsAppSmooch = await axios({
                        data: {
                            linkType: 'WEBHOOKCLEAR',
                            apiKeyId: serviceCredentials.apiKeyId,
                            apiKeySecret: serviceCredentials.apiKeySecret,
                            applicationId: parameters.communicationchannelsite,
                            integrationId: parameters.integrationid
                        },
                        method: 'post',
                        url: `${bridgeEndpoint}processlaraigo/smooch/managesmoochlink`
                    });
        
                    if (requestDeleteWhatsAppSmooch.data.success) {
                        const transactionDeleteWhatsAppSmooch = await triggerfunctions.executesimpletransaction(method, parameters);
        
                        if (transactionDeleteWhatsAppSmooch instanceof Array) {
                            return result.json({
                                success: true
                            });
                        }
                        else {
                            return result.status(400).json({
                                msg: transactionDeleteWhatsAppSmooch.code,
                                success: false
                            });
                        }
                    }
                    else {
                        return result.status(400).json({
                            msg: requestDeleteWhatsAppSmooch.data.operationMessage,
                            success: false
                        });
                    }
                }
                else {
                    const transactionDeleteWhatsAppSmooch = await triggerfunctions.executesimpletransaction(method, parameters);
        
                    if (transactionDeleteWhatsAppSmooch instanceof Array) {
                        return result.json({
                            success: true
                        });
                    }
                    else {
                        return result.status(400).json({
                            msg: transactionDeleteWhatsAppSmooch.code,
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
        parameters.chatflowenabled = true;
        parameters.coloricon = parameters.coloricon || null;
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
                            showlaraigologo: service.extra ? service.extra.poweredby : false,
                            showplatformlogo: false,
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
                            parameters.servicecredentials = JSON.stringify(service);
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
            case 'INSTAMESSENGER':
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

                    if (request.body.type === 'INSTAGRAM' || request.body.type === 'INSTAMESSENGER') {
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

            case 'SMOOCHANDROID':
            case 'SMOOCHIOS':
                const requestCreateSmooch = await axios({
                    data: {
                        linkType: request.body.type === 'SMOOCHANDROID' ? 'ANDROIDADD' : 'IOSADD',
                        name: parameters.description
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

                    parameters.communicationchannelowner = requestCreateSmooch.data.applicationId;
                    parameters.communicationchannelsite = requestCreateSmooch.data.applicationId;
                    parameters.integrationid = requestCreateSmooch.data.integrationId;
                    parameters.servicecredentials = JSON.stringify(serviceCredentials);
                    parameters.type = (request.body.type === 'SMOOCHANDROID' ? 'ANDR' : 'APPL');

                    const transactionCreateSmooch = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionCreateSmooch instanceof Array) {
                        return result.json({
                            applicationId: requestCreateSmooch.data.applicationId,
                            integrationId: requestCreateSmooch.data.integrationId,
                            success: true
                        });
                    }
                    else {
                        return result.status(400).json({
                            msg: transactionCreateSmooch.code,
                            success: false
                        });
                    }
                }
                else {
                    return result.status(400).json({
                        msg: requestCreateSmooch.data.operationMessage,
                        success: false
                    });
                }

            case 'TELEGRAM':
                const requestCreateTelegram = await axios({
                    data: {
                        accessToken: service.accesstoken,
                        linkType: 'TELEGRAMADD'
                    },
                    method: 'post',
                    url: `${bridgeEndpoint}processlaraigo/telegram/managetelegramlink`
                });

                if (requestCreateTelegram.data.success) {
                    var serviceCredentials = {
                        bot: requestCreateTelegram.data.botName,
                        endpoint: telegramEndpoint,
                        token: service.accesstoken
                    };

                    parameters.communicationchannelsite = requestCreateTelegram.data.botName;
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
                const requestPageTwitter = await axios({
                    data: {
                        accessSecret: service.accesssecret,
                        accessToken: service.accesstoken,
                        consumerKey: service.consumerkey,
                        consumerSecret: service.consumersecret,
                        developmentEnvironment: service.devenvironment,
                        linkType: 'GETPAGEID'
                    },
                    method: 'post',
                    url: `${bridgeEndpoint}processlaraigo/twitter/managetwitterlink`
                });

                if (requestPageTwitter.data.success) {
                    var serviceCredentials = {
                        accessSecret: service.accesssecret,
                        accessToken: service.accesstoken,
                        consumerKey: service.consumerkey,
                        consumerSecret: service.consumersecret,
                        devEnvironment: service.devenvironment,
                        twitterPageId: requestPageTwitter.data.pageId
                    };
                
                    parameters.communicationchannelsite = requestPageTwitter.data.pageId;
                    parameters.servicecredentials = JSON.stringify(serviceCredentials);

                    if (request.body.type === 'TWITTER') {
                        parameters.type = 'TWIT';
                    }
                    else {
                        parameters.type = 'TWMS';
                    }

                    const transactionCreateTwitter = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionCreateTwitter instanceof Array) {
                        const requestCreateTwitter = await axios({
                            data: {
                                accessSecret: service.accesssecret,
                                accessToken: service.accesstoken,
                                consumerKey: service.consumerkey,
                                consumerSecret: service.consumersecret,
                                developmentEnvironment: service.devenvironment,
                                linkType: 'TWITTERADD',
                                pageId: requestPageTwitter.data.pageId
                            },
                            method: 'post',
                            url: `${bridgeEndpoint}processlaraigo/twitter/managetwitterlink`
                        });

                        if (requestCreateTwitter.data.success) {
                            return result.json({
                                success: true
                            });
                        }
                        else
                        {
                            parameters.id = transactionCreateTwitter[0].ufn_communicationchannel_ins2;
                            parameters.motive = 'Delete from API';
                            parameters.operation = 'DELETE';

                            const transactionDeleteTwitter = await triggerfunctions.executesimpletransaction(method, parameters);

                            if (transactionDeleteTwitter instanceof Array) {
                                return result.status(400).json({
                                    msg: requestCreateTwitter.data.operationMessage,
                                    success: false
                                });
                            }
                            else {
                                return result.status(400).json({
                                    msg: transactionDeleteTwitter.code,
                                    success: false
                                });
                            }
                        }
                    }
                    else {
                        return result.status(400).json({
                            msg: transactionCreateTwitter.code,
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

            case 'WHATSAPP':
                const requestCreateWhatsApp = await axios({
                    data: {
                        accessToken: service.accesstoken,
                        linkType: 'WHATSAPPADD'
                    },
                    method: 'post',
                    url: `${bridgeEndpoint}processlaraigo/whatsapp/managewhatsapplink`
                });

                if (requestCreateWhatsApp.data.success) {
                    var serviceCredentials = {
                        apiKey: service.accesstoken,
                        endpoint: whatsAppEndpoint,
                        number: requestCreateWhatsApp.data.phoneNumber
                    };

                    parameters.communicationchannelsite = requestCreateWhatsApp.data.phoneNumber;
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

            case 'WHATSAPPSMOOCH':
                parameters.communicationchannelowner = '';
                parameters.communicationchannelsite = '';
                parameters.servicecredentials = JSON.stringify(service);
                parameters.status = 'PENDIENTE';
                parameters.type = 'WHAT';

                const transactionCreateWhatsAppSmooch = await triggerfunctions.executesimpletransaction(method, parameters);

                if (transactionCreateWhatsAppSmooch instanceof Array) {
                    if (parameters.type === 'WHAT') {
                        var domainMethod = 'UFN_DOMAIN_VALUES_SEL';
                        var domainParameters = {
                            all: false,
                            corpid: 1,
                            domainname: 'WHATSAPPRECIPIENT',
                            orgid: 0,
                            username: request.user.usr
                        };
                            
                        const transactionGetRecipient = await triggerfunctions.executesimpletransaction(domainMethod, domainParameters);

                        if (transactionGetRecipient instanceof Array) {
                            if (transactionGetRecipient.length > 0) {
                                domainParameters = {
                                    all: false,
                                    corpid: 1,
                                    domainname: 'WHATSAPPSUBJECT',
                                    orgid: 0,
                                    username: request.user.usr
                                };

                                const transactionGetSubject = await triggerfunctions.executesimpletransaction(domainMethod, domainParameters);

                                if (transactionGetSubject instanceof Array) {
                                    if (transactionGetSubject.length > 0) {
                                        domainParameters = {
                                            all: false,
                                            corpid: 1,
                                            domainname: 'WHATSAPPBODY',
                                            orgid: 0,
                                            username: request.user.usr
                                        };

                                        const transactionGetBody = await triggerfunctions.executesimpletransaction(domainMethod, domainParameters);

                                        if (transactionGetBody instanceof Array) {
                                            if (transactionGetBody.length > 0) {
                                                var mailBody = transactionGetBody[0].domainvalue;
                                                var mailRecipient = transactionGetRecipient[0].domainvalue;
                                                var mailSubject = transactionGetSubject[0].domainvalue;

                                                mailBody = mailBody.split("{{brandname}}").join(service.brandname);
                                                mailBody = mailBody.split("{{brandaddress}}").join(service.brandaddress);
                                                mailBody = mailBody.split("{{firstname}}").join(service.firstname);
                                                mailBody = mailBody.split("{{lastname}}").join(service.lastname);
                                                mailBody = mailBody.split("{{email}}").join(service.email);
                                                mailBody = mailBody.split("{{phone}}").join(service.phone);
                                                mailBody = mailBody.split("{{customerfacebookid}}").join(service.customerfacebookid);
                                                mailBody = mailBody.split("{{phonenumberwhatsappbusiness}}").join(service.phonenumberwhatsappbusiness);
                                                mailBody = mailBody.split("{{nameassociatednumber}}").join(service.nameassociatednumber);
                                                mailBody = mailBody.split("{{corpid}}").join(request.user.corpid);
                                                mailBody = mailBody.split("{{orgid}}").join(request.user.orgid);
                                                mailBody = mailBody.split("{{username}}").join(request.user.usr);

                                                mailSubject = mailSubject.split("{{brandname}}").join(service.brandname);
                                                mailSubject = mailSubject.split("{{brandaddress}}").join(service.brandaddress);
                                                mailSubject = mailSubject.split("{{firstname}}").join(service.firstname);
                                                mailSubject = mailSubject.split("{{lastname}}").join(service.lastname);
                                                mailSubject = mailSubject.split("{{email}}").join(service.email);
                                                mailSubject = mailSubject.split("{{phone}}").join(service.phone);
                                                mailSubject = mailSubject.split("{{customerfacebookid}}").join(service.customerfacebookid);
                                                mailSubject = mailSubject.split("{{phonenumberwhatsappbusiness}}").join(service.phonenumberwhatsappbusiness);
                                                mailSubject = mailSubject.split("{{nameassociatednumber}}").join(service.nameassociatednumber);
                                                mailSubject = mailSubject.split("{{corpid}}").join(request.user.corpid);
                                                mailSubject = mailSubject.split("{{orgid}}").join(request.user.orgid);
                                                mailSubject = mailSubject.split("{{username}}").join(request.user.usr);

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

                    return result.json({
                        success: true
                    });
                }
                else {
                    return result.status(400).json({
                        msg: transactionCreateWhatsAppSmooch.code,
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

exports.updateChannel = async (request, result) => {
    try {
        var { method, parameters = {}, service = {} } = request.body;

        setSessionParameters(parameters, request.user);

        parameters.corpid = request.user.corpid;
        parameters.orgid = request.user.orgid;
        parameters.username = request.user.usr;

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
                    showlaraigologo: service.extra ? service.extra.poweredby : false,
                    showplatformlogo: false,
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
            method: 'put',
            url: `${brokerEndpoint}integrations/update/${parameters.communicationchannelsite}`
        });

        if (typeof requestWebChatCreate.data.id !== 'undefined' && requestWebChatCreate.data.id) {
            parameters.channelparameters = JSON.stringify(webChatData);
            parameters.servicecredentials = JSON.stringify(service);

            const transactionCreateWebChat = await triggerfunctions.executesimpletransaction(method, parameters);
            
            if (transactionCreateWebChat instanceof Array) {
                try {
                    if (typeof webChatPlatformEndpoint !== 'undefined' && webChatPlatformEndpoint) {
                        await axios({
                            data: parameters,
                            method: 'post',
                            url: `${webChatPlatformEndpoint}integration/updatetodatabase`
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
                msg: 'Could not update integration',
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

exports.activateChannel = async (request, result) => {
    try {
        var { method, parameters = {}, service = {} } = request.body;

        setSessionParameters(parameters, request.user);

        parameters.corpid = request.user.corpid;
        parameters.motive = 'Activate from API';
        parameters.operation = 'UPDATE';
        parameters.orgid = request.user.orgid;
        parameters.status = 'ACTIVO';
        parameters.username = request.user.usr;

        parameters.communicationchannelcontact = '';
        parameters.communicationchanneltoken = '';
        parameters.customicon = null;
        parameters.botenabled = true;
        parameters.botconfigurationid = null;
        parameters.schedule = null;
        parameters.appintegrationid = null;
        parameters.country = null;
        parameters.channelparameters = null;
        parameters.updintegration = null;
        parameters.resolvelithium = null;

        if (request.body.type === 'WHATSAPP') {
            const requestCreateWhatsApp = await axios({
                data: {
                    accessToken: service.accesstoken,
                    linkType: 'WHATSAPPADD'
                },
                method: 'post',
                url: `${bridgeEndpoint}processlaraigo/whatsapp/managewhatsapplink`
            });

            if (requestCreateWhatsApp.data.success) {
                var serviceCredentials = {
                    apiKey: service.accesstoken,
                    endpoint: whatsAppEndpoint,
                    number: requestCreateWhatsApp.data.phoneNumber
                };

                parameters.communicationchannelsite = requestCreateWhatsApp.data.phoneNumber;
                parameters.servicecredentials = JSON.stringify(serviceCredentials);
                parameters.type = 'WHAD';

                const transactionActivateWhatsApp = await triggerfunctions.executesimpletransaction(method, parameters);

                if (transactionActivateWhatsApp instanceof Array) {
                    return result.json({
                        success: true
                    });
                }
                else {
                    return result.status(400).json({
                        msg: transactionActivateWhatsApp.code,
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
        }
        else {
            const requestMigrateWhatsApp = await axios({
                data: {
                    linkType: 'WEBHOOKMIGRATE',
                    apiKeyId: service.apiKeyId,
                    apiKeySecret: service.apiKeySecret,
                    applicationId: service.appid
                },
                method: 'post',
                url: `${bridgeEndpoint}processlaraigo/smooch/managesmoochlink`
            });

            if (requestMigrateWhatsApp.data.success) {
                parameters.communicationchannelsite = service.appid;
                parameters.servicecredentials = JSON.stringify({
                    apiKeyId: service.apikeyid,
                    apiKeySecret: service.apikeysecret,
                    appId: service.appid,
                    endpoint: 'https://api.smooch.io/',
                    version: 'v1.1'
                });
                parameters.type = 'WHAT';
    
                const transactionActivateWhatsApp = await triggerfunctions.executesimpletransaction(method, parameters);
                
                if (transactionActivateWhatsApp instanceof Array) {
                    return result.json({
                        success: true
                    });
                }
                else {
                    return result.status(400).json({
                        msg: transactionActivateWhatsApp.code,
                        success: false
                    });
                }
            }
            else {
                return result.status(400).json({
                    msg: requestMigrateWhatsApp.data.operationMessage,
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