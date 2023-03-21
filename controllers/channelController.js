const channelfunctions = require("../config/channelfunctions");
const triggerfunctions = require('../config/triggerfunctions');
const jwt = require("jsonwebtoken");

const { setSessionParameters, axiosObservable, getErrorCode } = require('../config/helpers');

const logger = require('../config/winston');

const bridgeEndpoint = process.env.BRIDGE;
const brokerEndpoint = process.env.CHATBROKER;
const facebookEndpoint = process.env.FACEBOOKAPI;
const hookEndpoint = process.env.HOOK;
const smoochEndpoint = process.env.SMOOCHAPI;
const smoochVersion = process.env.SMOOCHVERSION;
const telegramEndpoint = process.env.TELEGRAMAPI;
const webChatApplication = process.env.CHATAPPLICATION;
const webChatScriptEndpoint = process.env.WEBCHATSCRIPT;
const whatsAppEndpoint = process.env.WHATSAPPAPI;
const googleClientId = process.env.GOOGLE_CLIENTID;
const googleClientSecret = process.env.GOOGLE_CLIENTSECRET;
const googleTopicName = process.env.GOOGLE_TOPICNAME;

exports.checkPaymentPlan = async (request, response) => {
    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var { method, parameters } = request.body;

        setSessionParameters(parameters, request.user, request._requestid);

        const transactionCheckPaymentPlan = await triggerfunctions.executesimpletransaction(method, parameters);

        if (transactionCheckPaymentPlan instanceof Array) {
            if (transactionCheckPaymentPlan.length > 0) {
                var createChannel = transactionCheckPaymentPlan[0].channelnumber < transactionCheckPaymentPlan[0].channelscontracted ? true : false;

                return response.json({
                    createChannel: createChannel,
                    providerWhatsApp: transactionCheckPaymentPlan[0].providerwhatsapp,
                    success: true
                });
            }
            else {
                return response.json({
                    createChannel: true,
                    providerWhatsApp: 'DIALOG',
                    success: true
                });
            }
        }
        else {
            return response.status(400).json({
                msg: transactionCheckPaymentPlan.code,
                success: false
            });
        }
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            msg: exception.message,
        });
    }
}

exports.deleteChannel = async (request, response) => {
    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var { method, parameters = {} } = request.body;

        setSessionParameters(parameters, request.user, request._requestid);

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
                    const requestDeleteSmooch = await axiosObservable({
                        data: {
                            linkType: parameters.type === 'ANDR' ? 'ANDROIDREMOVE' : 'IOSREMOVE',
                            applicationId: parameters.communicationchannelsite,
                            integrationId: parameters.integrationid
                        },
                        method: 'post',
                        url: `${bridgeEndpoint}processlaraigo/smooch/managesmoochlink`,
                        _requestid: request._requestid,
                    });

                    if (requestDeleteSmooch.data.success) {
                        const transactionDeleteSmooch = await triggerfunctions.executesimpletransaction(method, parameters);

                        if (transactionDeleteSmooch instanceof Array) {
                            await channelfunctions.clearHookCache('SmoochService', request._requestid);

                            return response.json({
                                success: true
                            });
                        }
                        else {
                            return response.status(400).json({
                                msg: transactionDeleteSmooch.code,
                                success: false
                            });
                        }
                    }
                    else {
                        return response.status(400).json({
                            msg: requestDeleteSmooch.data.operationMessage,
                            success: false
                        });
                    }
                }
                else {
                    const transactionDeleteSmooch = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionDeleteSmooch instanceof Array) {
                        await channelfunctions.clearHookCache('SmoochService', request._requestid);

                        return response.json({
                            success: true
                        });
                    }
                    else {
                        return response.status(400).json({
                            msg: transactionDeleteSmooch.code,
                            success: false
                        });
                    }
                }

            case 'CHAZ':
                if (typeof parameters.communicationchannelcontact !== 'undefined' && parameters.communicationchannelcontact) {
                    await axiosObservable({
                        data: {
                            status: 'ELIMINADO',
                        },
                        method: 'put',
                        url: `${brokerEndpoint}plugins/update/${parameters.communicationchannelcontact}`,
                        _requestid: request._requestid,
                    });
                }

                if (typeof parameters.communicationchannelowner !== 'undefined' && parameters.communicationchannelowner) {
                    await axiosObservable({
                        data: {
                            status: 'ELIMINADO'
                        },
                        method: 'put',
                        url: `${brokerEndpoint}webhooks/update/${parameters.communicationchannelowner}`,
                        _requestid: request._requestid,
                    });
                }

                if (typeof parameters.integrationid !== 'undefined' && parameters.integrationid) {
                    await axiosObservable({
                        data: {
                            status: 'ELIMINADO'
                        },
                        method: 'put',
                        url: `${brokerEndpoint}integrations/update/${parameters.integrationid}`,
                        _requestid: request._requestid,
                    });
                }

                const transactionDeleteChatWeb = await triggerfunctions.executesimpletransaction(method, parameters);

                if (transactionDeleteChatWeb instanceof Array) {
                    await channelfunctions.clearHookCache('ChatWebService', request._requestid);

                    return response.json({
                        success: true
                    });
                }
                else {
                    return response.status(400).json({
                        msg: transactionDeleteChatWeb.code,
                        success: false
                    });
                }
            case 'FORM':
                if (typeof parameters.integrationid !== 'undefined' && parameters.integrationid) {
                    await axiosObservable({
                        data: {
                            status: 'ELIMINADO'
                        },
                        method: 'put',
                        url: `${brokerEndpoint}integrations/update/${parameters.integrationid}`,
                        _requestid: request._requestid,
                    });
                }

                const transactionDeleteChatWeb1 = await triggerfunctions.executesimpletransaction(method, parameters);

                if (transactionDeleteChatWeb1 instanceof Array) {
                    await channelfunctions.clearHookCache('ChatWebService', request._requestid);

                    return response.json({
                        success: true
                    });
                }
                else {
                    return response.status(400).json({
                        msg: transactionDeleteChatWeb1.code,
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
                            type: (parameters.type === 'INST' ? 'INDM' : 'INST'),
                            _requestid: request._requestid,
                        };

                        const transactionValidateInstagram = await triggerfunctions.executesimpletransaction(validateMethod, validateParameters);

                        if (transactionValidateInstagram instanceof Array) {
                            if (transactionValidateInstagram.length > 0) {
                                DeleteIntegration = false;
                            }
                        }
                        else {
                            return response.status(400).json({
                                msg: transactionValidateInstagram.code,
                                success: false
                            });
                        }
                    }

                    if (DeleteIntegration) {
                        const requestDeleteFacebook = await axiosObservable({
                            data: {
                                accessToken: serviceCredentials.accessToken,
                                linkType: linkType,
                                siteId: ((parameters.type === 'INST' || parameters.type === 'INDM') ? parameters.communicationchannelowner : serviceCredentials.siteId)
                            },
                            method: 'post',
                            url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`,
                            _requestid: request._requestid,
                        });

                        if (!requestDeleteFacebook.data.success) {
                            return response.status(400).json({
                                msg: requestDeleteFacebook.data.operationMessage,
                                success: false
                            });
                        }
                    }

                    const transactionDeleteFacebook = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionDeleteFacebook instanceof Array) {
                        await channelfunctions.clearHookCache('FacebookService', request._requestid);

                        return response.json({
                            success: true
                        });
                    }
                    else {
                        return response.status(400).json({
                            msg: transactionDeleteFacebook.code,
                            success: false
                        });
                    }
                }
                else {
                    const transactionDeleteFacebook = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionDeleteFacebook instanceof Array) {
                        await channelfunctions.clearHookCache('FacebookService', request._requestid);

                        return response.json({
                            success: true
                        });
                    }
                    else {
                        return response.status(400).json({
                            msg: transactionDeleteFacebook.code,
                            success: false
                        });
                    }
                }

            case 'INMS':
                if (typeof parameters.servicecredentials !== 'undefined' && parameters.servicecredentials) {
                    var serviceCredentials = JSON.parse(parameters.servicecredentials);

                    const requestDeleteInstagramSmooch = await axiosObservable({
                        data: {
                            linkType: 'WEBHOOKREMOVE',
                            apiKeyId: serviceCredentials.apiKeyId,
                            apiKeySecret: serviceCredentials.apiKeySecret,
                            applicationId: parameters.communicationchannelsite,
                            integrationId: parameters.integrationid
                        },
                        method: 'post',
                        url: `${bridgeEndpoint}processlaraigo/smooch/managesmoochlink`,
                        _requestid: request._requestid,
                    });

                    if (requestDeleteInstagramSmooch.data.success) {
                        const transactionDeleteInstagramSmooch = await triggerfunctions.executesimpletransaction(method, parameters);

                        if (transactionDeleteInstagramSmooch instanceof Array) {
                            await channelfunctions.clearHookCache('SmoochService', request._requestid);

                            return response.json({
                                success: true
                            });
                        }
                        else {
                            return response.status(400).json({
                                msg: transactionDeleteInstagramSmooch.code,
                                success: false
                            });
                        }
                    }
                    else {
                        return response.status(400).json({
                            msg: requestDeleteInstagramSmooch.data.operationMessage,
                            success: false
                        });
                    }
                }
                else {
                    const transactionDeleteInstagramSmooch = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionDeleteInstagramSmooch instanceof Array) {
                        await channelfunctions.clearHookCache('SmoochService', request._requestid);

                        return response.json({
                            success: true
                        });
                    }
                    else {
                        return response.status(400).json({
                            msg: transactionDeleteInstagramSmooch.code,
                            success: false
                        });
                    }
                }

            case 'TELE':
                if (typeof parameters.servicecredentials !== 'undefined' && parameters.servicecredentials) {
                    var serviceCredentials = JSON.parse(parameters.servicecredentials);

                    const requestDeleteTelegram = await axiosObservable({
                        data: {
                            accessToken: serviceCredentials.token,
                            linkType: 'TELEGRAMREMOVE',
                            siteId: serviceCredentials.bot
                        },
                        method: 'post',
                        url: `${bridgeEndpoint}processlaraigo/telegram/managetelegramlink`,
                        _requestid: request._requestid,
                    });

                    if (requestDeleteTelegram.data.success) {
                        const transactionDeleteTelegram = await triggerfunctions.executesimpletransaction(method, parameters);

                        if (transactionDeleteTelegram instanceof Array) {
                            await channelfunctions.clearHookCache('TelegramService', request._requestid);

                            return response.json({
                                success: true
                            });
                        }
                        else {
                            return response.status(400).json({
                                msg: transactionDeleteTelegram.code,
                                success: false
                            });
                        }
                    }
                    else {
                        return response.status(400).json({
                            msg: requestDeleteTelegram.data.operationMessage,
                            success: false
                        });
                    }
                }
                else {
                    const transactionDeleteTelegram = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionDeleteTelegram instanceof Array) {
                        await channelfunctions.clearHookCache('TelegramService', request._requestid);

                        return response.json({
                            success: true
                        });
                    }
                    else {
                        return response.status(400).json({
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
                        type: (parameters.type === 'TWIT' ? 'TWMS' : 'TWIT'),
                        _requestid: request._requestid,
                    };

                    const transactionValidateTwitter = await triggerfunctions.executesimpletransaction(validateMethod, validateParameters);

                    if (transactionValidateTwitter instanceof Array) {
                        if (transactionValidateTwitter.length > 0) {
                            const transactionDeleteTwitter = await triggerfunctions.executesimpletransaction(method, parameters);

                            if (transactionDeleteTwitter instanceof Array) {
                                await channelfunctions.clearHookCache('TwitterService', request._requestid);

                                return response.json({
                                    success: true
                                });
                            }
                            else {
                                return response.status(400).json({
                                    msg: transactionDeleteTwitter.code,
                                    success: false
                                });
                            }
                        }
                        else {
                            const requestDeleteTwitter = await axiosObservable({
                                data: {
                                    accessSecret: serviceCredentials.accessSecret,
                                    accessToken: serviceCredentials.accessToken,
                                    consumerKey: serviceCredentials.consumerKey,
                                    consumerSecret: serviceCredentials.consumerSecret,
                                    developmentEnvironment: serviceCredentials.devEnvironment,
                                    linkType: 'TWITTERREMOVE',
                                },
                                method: 'post',
                                url: `${bridgeEndpoint}processlaraigo/twitter/managetwitterlink`,
                                _requestid: request._requestid,
                            });

                            if (requestDeleteTwitter.data.success) {
                                const transactionDeleteTwitter = await triggerfunctions.executesimpletransaction(method, parameters);

                                if (transactionDeleteTwitter instanceof Array) {
                                    await channelfunctions.clearHookCache('TwitterService', request._requestid);

                                    return response.json({
                                        success: true
                                    });
                                }
                                else {
                                    return response.status(400).json({
                                        msg: transactionDeleteTwitter.code,
                                        success: false
                                    });
                                }
                            }
                            else {
                                return response.status(400).json({
                                    msg: requestDeleteTwitter.data.operationMessage,
                                    success: false
                                });
                            }
                        }
                    }
                    else {
                        return response.status(400).json({
                            msg: transactionValidateTwitter.code,
                            success: false
                        });
                    }
                }
                else {
                    const transactionDeleteTwitter = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionDeleteTwitter instanceof Array) {
                        await channelfunctions.clearHookCache('TwitterService', request._requestid);

                        return response.json({
                            success: true
                        });
                    }
                    else {
                        return response.status(400).json({
                            msg: transactionDeleteTwitter.code,
                            success: false
                        });
                    }
                }

            case 'WHAD':
                if (typeof parameters.servicecredentials !== 'undefined' && parameters.servicecredentials) {
                    var serviceCredentials = JSON.parse(parameters.servicecredentials);

                    const requestDeleteWhatsApp = await axiosObservable({
                        data: {
                            accessToken: serviceCredentials.apiKey,
                            linkType: 'WHATSAPPREMOVE',
                            siteId: serviceCredentials.number
                        },
                        method: 'post',
                        url: `${bridgeEndpoint}processlaraigo/whatsapp/managewhatsapplink`,
                        _requestid: request._requestid,
                    });

                    if (requestDeleteWhatsApp.data.success) {
                        const transactionDeleteWhatsApp = await triggerfunctions.executesimpletransaction(method, parameters);

                        if (transactionDeleteWhatsApp instanceof Array) {
                            await channelfunctions.clearHookCache('Dialog360Service', request._requestid);

                            return response.json({
                                success: true
                            });
                        }
                        else {
                            return response.status(400).json({
                                msg: transactionDeleteWhatsApp.code,
                                success: false
                            });
                        }
                    }
                    else {
                        return response.status(400).json({
                            msg: requestDeleteWhatsApp.data.operationMessage,
                            success: false
                        });
                    }
                }
                else {
                    const transactionDeleteWhatsApp = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionDeleteWhatsApp instanceof Array) {
                        await channelfunctions.clearHookCache('Dialog360Service', request._requestid);

                        return response.json({
                            success: true
                        });
                    }
                    else {
                        return response.status(400).json({
                            msg: transactionDeleteWhatsApp.code,
                            success: false
                        });
                    }
                }

            case 'WHAT':
                if (typeof parameters.servicecredentials !== 'undefined' && parameters.servicecredentials) {
                    var serviceCredentials = JSON.parse(parameters.servicecredentials);

                    if (typeof serviceCredentials.apiKeyId !== 'undefined' && serviceCredentials.apiKeyId) {
                        const requestDeleteWhatsAppSmooch = await axiosObservable({
                            data: {
                                linkType: 'WEBHOOKCLEAR',
                                apiKeyId: serviceCredentials.apiKeyId,
                                apiKeySecret: serviceCredentials.apiKeySecret,
                                applicationId: parameters.communicationchannelsite,
                                integrationId: parameters.integrationid
                            },
                            method: 'post',
                            url: `${bridgeEndpoint}processlaraigo/smooch/managesmoochlink`,
                            _requestid: request._requestid,
                        });

                        if (requestDeleteWhatsAppSmooch.data.success) {
                            const transactionDeleteWhatsAppSmooch = await triggerfunctions.executesimpletransaction(method, parameters);

                            if (transactionDeleteWhatsAppSmooch instanceof Array) {
                                await channelfunctions.clearHookCache('SmoochService', request._requestid);

                                return response.json({
                                    success: true
                                });
                            }
                            else {
                                return response.status(400).json({
                                    msg: transactionDeleteWhatsAppSmooch.code,
                                    success: false
                                });
                            }
                        }
                        else {
                            return response.status(400).json({
                                msg: requestDeleteWhatsAppSmooch.data.operationMessage,
                                success: false
                            });
                        }
                    }
                    else {
                        const transactionDeleteWhatsAppSmooch = await triggerfunctions.executesimpletransaction(method, parameters);

                        if (transactionDeleteWhatsAppSmooch instanceof Array) {
                            await channelfunctions.clearHookCache('SmoochService', request._requestid);

                            return response.json({
                                success: true
                            });
                        }
                        else {
                            return response.status(400).json({
                                msg: transactionDeleteWhatsAppSmooch.code,
                                success: false
                            });
                        }
                    }
                }
                else {
                    const transactionDeleteWhatsAppSmooch = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionDeleteWhatsAppSmooch instanceof Array) {
                        await channelfunctions.clearHookCache('SmoochService', request._requestid);

                        return response.json({
                            success: true
                        });
                    }
                    else {
                        return response.status(400).json({
                            msg: transactionDeleteWhatsAppSmooch.code,
                            success: false
                        });
                    }
                }

            case 'VOXI':
                if (typeof parameters.servicecredentials !== 'undefined' && parameters.servicecredentials) {
                    var serviceCredentials = JSON.parse(parameters.servicecredentials);

                    var voximplantPhoneNumber = await channelfunctions.voximplantDeletePhoneNumber(request.user.corpid, request.user.orgid, serviceCredentials.phoneid, serviceCredentials.queueid, request.originalUrl, request._requestid);

                    if (voximplantPhoneNumber.phoneid && voximplantPhoneNumber.queueid) {
                        const transactionDeleteVoximplant = await triggerfunctions.executesimpletransaction(method, parameters);

                        if (transactionDeleteVoximplant instanceof Array) {
                            return response.json({
                                success: true
                            });
                        }
                        else {
                            return response.status(400).json({
                                msg: transactionDeleteVoximplant.code,
                                success: false
                            });
                        }
                    }

                    return response.status(400).json({
                        msg: 'voximplant_phonenumberdelete_error',
                        success: false
                    });
                }
                else {
                    const transactionDeleteVoximplant = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionDeleteVoximplant instanceof Array) {
                        return response.json({
                            success: true
                        });
                    }
                    else {
                        return response.status(400).json({
                            msg: transactionDeleteVoximplant.code,
                            success: false
                        });
                    }
                }

            case 'WHAG':
                if (typeof parameters.servicecredentials !== 'undefined' && parameters.servicecredentials) {
                    var serviceCredentials = JSON.parse(parameters.servicecredentials);

                    const requestDeleteWhatsAppGupshup = await axiosObservable({
                        data: {
                            apiKey: serviceCredentials.apiKey,
                            appId: parameters.communicationchannelowner,
                            linkType: 'GUPSHUPREMOVE',
                        },
                        method: 'post',
                        url: `${bridgeEndpoint}processlaraigo/gupshup/managegupshuplink`,
                        _requestid: request._requestid,
                    });

                    if (requestDeleteWhatsAppGupshup.data.success) {
                        const transactionDeleteWhatsAppGupshup = await triggerfunctions.executesimpletransaction(method, parameters);

                        if (transactionDeleteWhatsAppGupshup instanceof Array) {
                            await channelfunctions.clearHookCache('GupshupService', request._requestid);

                            return response.json({
                                success: true
                            });
                        }
                        else {
                            return response.status(400).json({
                                msg: transactionDeleteWhatsAppGupshup.code,
                                success: false
                            });
                        }
                    }
                    else {
                        return response.status(400).json({
                            msg: requestDeleteWhatsAppGupshup.data.operationMessage,
                            success: false
                        });
                    }
                }
                else {
                    const transactionDeleteWhatsAppGupshup = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionDeleteWhatsAppGupshup instanceof Array) {
                        await channelfunctions.clearHookCache('GupshupService', request._requestid);

                        return response.json({
                            success: true
                        });
                    }
                    else {
                        return response.status(400).json({
                            msg: transactionDeleteWhatsAppGupshup.code,
                            success: false
                        });
                    }
                }

            default:
                const transactionDeleteGeneric = await triggerfunctions.executesimpletransaction(method, parameters);

                if (transactionDeleteGeneric instanceof Array) {
                    await channelfunctions.clearHookCache('EveryService', request._requestid);

                    return response.json({
                        success: true
                    });
                }
                else {
                    return response.status(400).json({
                        msg: transactionDeleteGeneric.code,
                        success: false
                    });
                }
        }
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            msg: exception.message,
        });
    }
}

exports.getChannelService = async (request, response) => {
    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var method = null;
        var parameters = null;

        if (request.body.siteType === 'SMCH') {
            method = 'UFN_COMMUNICATIONCHANNELSITE_SMOOCH_SEL';
            parameters = {
                communicationchannelsite: request.body.siteId,
                _requestid: request._requestid,
            };
        }
        else {
            method = 'UFN_COMMUNICATIONCHANNELSITE_SEL';
            parameters = {
                communicationchannelsite: request.body.siteId,
                type: request.body.siteType,
                _requestid: request._requestid,
            };
        }

        const transactionSelectCredentials = await triggerfunctions.executesimpletransaction(method, parameters);

        if (transactionSelectCredentials instanceof Array) {
            if (transactionSelectCredentials.length > 0) {
                if (request.body.siteType !== 'TWTR') {
                    return response.json({
                        serviceData: transactionSelectCredentials[0].servicecredentials,
                        success: true
                    });
                }
                else {
                    return response.json({
                        serviceData: transactionSelectCredentials[0].servicedata,
                        success: true
                    });
                }
            }
            else {
                return response.json({
                    msg: 'Not found',
                    success: false
                });
            }
        }
        else {
            return response.status(400).json({
                msg: transactionSelectCredentials.code,
                success: false
            });
        }
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            msg: exception.message,
        });
    }
}

exports.getLongToken = async (request, response) => {
    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        const requestGetLongToken = await axiosObservable({
            data: {
                accessToken: request.body.accessToken,
                appId: request.body.appId,
                linkType: 'GENERATELONGTOKEN'
            },
            method: 'post',
            url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`,
            _requestid: request._requestid,
        });

        if (requestGetLongToken.data.success) {
            return response.json({
                longToken: requestGetLongToken.data.longToken,
                success: true
            });
        }
        else {
            return response.status(400).json({
                msg: requestGetLongToken.data.operationMessage,
                success: false
            });
        }
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            msg: exception.message,
        });
    }
}

exports.getPageList = async (request, response) => {
    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        const requestGetPageList = await axiosObservable({
            data: {
                accessToken: request.body.accessToken,
                appId: request.body.appId,
                linkType: 'GETPAGES'
            },
            method: 'post',
            url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`,
            _requestid: request._requestid,
        });

        if (requestGetPageList.data.success) {
            return response.json({
                pageData: requestGetPageList.data.pageData,
                success: true
            });
        }
        else {
            return response.status(400).json({
                msg: requestGetPageList.data.operationMessage,
                success: false
            });
        }
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            msg: exception.message,
        });
    }
}

exports.getPhoneList = async (request, response) => {
    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        const requestGetPhoneList = await axiosObservable({
            data: {
                partnerId: request.body.partnerId,
                channelList: request.body.channelList,
            },
            method: 'post',
            url: `${bridgeEndpoint}processpartner/getnumberlist`,
            _requestid: request._requestid,
        });

        if (requestGetPhoneList.data.success) {
            return response.json({
                data: requestGetPhoneList.data.phoneList,
                success: true
            });
        }
        else {
            return response.status(400).json({
                msg: requestGetPhoneList.data.operationMessage,
                success: false
            });
        }
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            msg: exception.message,
        });
    }
}

exports.insertChannel = async (request, response) => {
    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var { method, parameters = {}, service = {} } = request.body;

        setSessionParameters(parameters, request.user, request._requestid);

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
        parameters.phone = null;
        parameters.apikey = null;
        parameters.voximplantrecording = null;
        parameters.voximplantwelcometone = null;
        parameters.voximplantholdtone = null;

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
                            messageClientColor: service.color ? service.color.client : '',
                            iconscolor: service.color ? service.color.iconscolor : ''
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
                            uploadvideo: service.extra ? service.extra.uploadvideo : false,
                            withBorder: service.extra?.withBorder || false,
                            withHour: service.extra?.withHour || false,
                            iconColorActive: service.extra?.iconColorActive || "",
                            iconColorDisabled: service.extra?.iconColorDisabled || "",
                            inputTextSize: service.extra?.inputTextSize || 0,
                            inputTextWeight: service.extra?.inputTextWeight || 0,
                            chatTextSize: service.extra?.chatTextSize || 0,
                            chatTextWeight: service.extra?.chatTextWeight || 0,
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

                const requestWebChatCreate = await axiosObservable({
                    data: webChatData,
                    method: 'post',
                    url: `${brokerEndpoint}integrations/save`,
                    _requestid: request._requestid,
                });

                if (typeof requestWebChatCreate.data.id !== 'undefined' && requestWebChatCreate.data.id) {
                    const requestWebChatWebhook = await axiosObservable({
                        data: {
                            description: parameters.description,
                            integration: requestWebChatCreate.data.id,
                            name: parameters.description,
                            status: 'ACTIVO',
                            webUrl: `${hookEndpoint}chatweb/webhookasync`
                        },
                        method: 'post',
                        url: `${brokerEndpoint}webhooks/save`,
                        _requestid: request._requestid,
                    });

                    if (typeof requestWebChatWebhook.data.id !== 'undefined' && requestWebChatWebhook.data.id) {
                        const requestWebChatPlugin = await axiosObservable({
                            data: {
                                integration: requestWebChatCreate.data.id,
                                name: parameters.description,
                                status: 'ACTIVO'
                            },
                            method: 'post',
                            url: `${brokerEndpoint}plugins/save`,
                            _requestid: request._requestid,
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
                                await channelfunctions.clearHookCache('ChatWebService', request._requestid);

                                return response.json({
                                    integrationid: requestWebChatCreate.data.id,
                                    success: true
                                });
                            }
                            else {
                                return response.status(400).json({
                                    msg: transactionCreateWebChat.code,
                                    success: false
                                });
                            }
                        }
                        else {
                            return response.status(400).json({
                                msg: 'Could not create plugin',
                                success: false
                            });
                        }
                    }
                    else {
                        return response.status(400).json({
                            msg: 'Could not create webhook',
                            success: false
                        });
                    }
                }
                else {
                    return response.status(400).json({
                        msg: 'Could not create integration',
                        success: false
                    });
                }
            case 'FORM':
                const webChatData1 = {
                    applicationId: webChatApplication,
                    name: parameters.description,
                    status: 'ACTIVO',
                    type: 'FORM',
                    metadata: {
                        extra: {
                            ...(service.extra || {}),
                            corpid: request.user.corpid,
                            orgid: request.user.orgid,
                        },
                        form: service.form ? service.form : null,
                    }
                }

                const requestWebChatCreate1 = await axiosObservable({
                    data: webChatData1,
                    method: 'post',
                    url: `${brokerEndpoint}integrations/save`,
                    _requestid: request._requestid,
                });

                if (typeof requestWebChatCreate1.data.id !== 'undefined' && requestWebChatCreate1.data.id) {
                    parameters.apikey = "";
                    parameters.appintegrationid = webChatApplication;
                    parameters.channelparameters = JSON.stringify(webChatData1);
                    parameters.communicationchannelcontact = "";
                    parameters.communicationchannelowner = "";
                    parameters.communicationchannelsite = requestWebChatCreate1.data.id;
                    parameters.integrationid = requestWebChatCreate1.data.id;
                    parameters.servicecredentials = JSON.stringify(service);
                    parameters.type = 'FORM';

                    const transactionCreateWebChat = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionCreateWebChat instanceof Array) {
                        await channelfunctions.clearHookCache('ChatWebService', request._requestid);

                        return response.json({
                            integrationid: requestWebChatCreate1.data.id,
                            success: true
                        });
                    } else {
                        return response.status(400).json({
                            msg: 'Could not create integration',
                            success: false
                        });
                    }
                }
                else {
                    return response.status(400).json({
                        msg: 'Could not create integration',
                        success: false
                    });
                }
            case 'FACEBOOK':
            case 'INSTAGRAM':
            case 'INSTAMESSENGER':
            case 'MESSENGER':
                const requestGetLongToken = await axiosObservable({
                    data: {
                        accessToken: service.accesstoken,
                        appId: service.appid,
                        linkType: 'GENERATELONGTOKEN'
                    },
                    method: 'post',
                    url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`,
                    _requestid: request._requestid,
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
                        const requestGetBusiness = await axiosObservable({
                            data: {
                                accessToken: service.accesstoken,
                                linkType: 'GETBUSINESS',
                                siteId: service.siteid
                            },
                            method: 'post',
                            url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`,
                            _requestid: request._requestid,
                        });

                        if (requestGetBusiness.data.success) {
                            businessId = requestGetBusiness.data.businessId;
                        }
                        else {
                            return response.status(400).json({
                                msg: 'No Instagram account',
                                success: false
                            });
                        }
                    }

                    const requestCreateFacebook = await axiosObservable({
                        data: {
                            linkType: channelLinkService,
                            accessToken: requestGetLongToken.data.longToken,
                            siteId: service.siteid
                        },
                        method: 'post',
                        url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`,
                        _requestid: request._requestid,
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
                            await channelfunctions.clearHookCache('FacebookService', request._requestid);

                            return response.json({
                                success: true
                            });
                        }
                        else {
                            return response.status(400).json({
                                msg: transactionCreateFacebook.code,
                                success: false
                            });
                        }
                    }
                    else {
                        return response.status(400).json({
                            msg: requestCreateFacebook.data.operationMessage,
                            success: false
                        });
                    }
                }
                else {
                    return response.status(400).json({
                        msg: requestGetLongToken.data.operationMessage,
                        success: false
                    });
                }

            case 'SMOOCHANDROID':
            case 'SMOOCHIOS':
                const requestCreateSmooch = await axiosObservable({
                    data: {
                        linkType: request.body.type === 'SMOOCHANDROID' ? 'ANDROIDADD' : 'IOSADD',
                        name: parameters.description,
                    },
                    method: 'post',
                    url: `${bridgeEndpoint}processlaraigo/smooch/managesmoochlink`,
                    _requestid: request._requestid,
                });

                if (requestCreateSmooch.data.success) {
                    var serviceCredentials = {
                        apiKeyId: requestCreateSmooch.data.appApiKey,
                        apiKeySecret: requestCreateSmooch.data.appSecret,
                        appId: requestCreateSmooch.data.applicationId,
                        endpoint: smoochEndpoint,
                        integrationId: requestCreateSmooch.data.integrationId,
                        version: smoochVersion
                    };

                    parameters.communicationchannelowner = requestCreateSmooch.data.applicationId;
                    parameters.communicationchannelsite = requestCreateSmooch.data.applicationId;
                    parameters.integrationid = requestCreateSmooch.data.integrationId;
                    parameters.servicecredentials = JSON.stringify(serviceCredentials);
                    parameters.type = (request.body.type === 'SMOOCHANDROID' ? 'ANDR' : 'APPL');

                    const transactionCreateSmooch = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionCreateSmooch instanceof Array) {
                        await channelfunctions.clearHookCache('SmoochService', request._requestid);

                        return response.json({
                            applicationId: requestCreateSmooch.data.applicationId,
                            integrationId: requestCreateSmooch.data.integrationId,
                            success: true
                        });
                    }
                    else {
                        return response.status(400).json({
                            msg: transactionCreateSmooch.code,
                            success: false
                        });
                    }
                }
                else {
                    return response.status(400).json({
                        msg: requestCreateSmooch.data.operationMessage,
                        success: false
                    });
                }

            case 'INFOBIPEMAIL':
            case 'INFOBIPSMS':
                if (service) {
                    var serviceCredentials = {
                        apiKey: service.apikey,
                        callbackEndpoint: `${hookEndpoint}infobip/${request.body.type === "INFOBIPEMAIL" ? "mail" : ""}webhookasync`,
                        callbackType: "application/json",
                        endpoint: service.url,
                        number: service.emittername,
                    };

                    if (request.body.type === "INFOBIPEMAIL") {
                        serviceCredentials.validateMail = false;
                    }

                    parameters.communicationchannelowner = service.emittername;
                    parameters.communicationchannelsite = service.emittername;
                    parameters.integrationid = service.emittername;
                    parameters.servicecredentials = JSON.stringify(serviceCredentials);
                    parameters.type = (request.body.type === 'INFOBIPEMAIL' ? 'MAII' : 'SMSI');

                    const transactionCreateInfobip = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionCreateInfobip instanceof Array) {
                        if (request.body.type === "INFOBIPEMAIL") {
                            await channelfunctions.clearHookCache('InfobipMailService', request._requestid);
                        }
                        else {
                            await channelfunctions.clearHookCache('InfobipService', request._requestid);
                        }

                        return response.json({
                            success: true
                        });
                    }
                    else {
                        return response.status(400).json({
                            msg: transactionCreateInfobip.code,
                            success: false
                        });
                    }
                }
                break;

            case 'GMAIL':
                if (service) {
                    var informationtoken = jwt.decode(service.idtoken);

                    parameters.communicationchannelowner = informationtoken.name;
                    parameters.integrationid = informationtoken.email;
                    parameters.servicecredentials = JSON.stringify(service);
                    parameters.status = 'ACTIVO';
                    parameters.communicationchannelsite = informationtoken.email;
                    parameters.type = 'MAIL';

                    await channelfunctions.serviceTokenUpdate(informationtoken.email, service.accesstoken, service.refreshtoken, JSON.stringify({ clientId: googleClientId, clientSecret: googleClientSecret, topicName: googleTopicName }), 'GOOGLE', 'ACTIVO', request?.user?.usr, 50);

                    await channelfunctions.serviceSubscriptionUpdate(informationtoken.email, informationtoken.email, JSON.stringify({ clientId: googleClientId, clientSecret: googleClientSecret, topicName: googleTopicName }), 'GOOGLE-GMAIL', 'ACTIVO', request?.user?.usr, `${hookEndpoint}mail/gmailwebhookasync`, 2880);

                    const transactionCreateGeneric = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionCreateGeneric instanceof Array) {
                        return response.json({
                            success: true
                        });
                    }
                    else {
                        return response.status(400).json({
                            msg: transactionCreateGeneric.code,
                            success: false
                        });
                    }
                }
                break;

            case 'BLOGGER':
            case 'YOUTUBE':
                if (service) {
                    var informationtoken = jwt.decode(service.idtoken);

                    parameters.communicationchannelowner = informationtoken.name;
                    parameters.integrationid = service.channel;
                    parameters.servicecredentials = JSON.stringify(service);
                    parameters.status = 'ACTIVO';

                    await channelfunctions.serviceTokenUpdate(informationtoken.email, service.accesstoken, service.refreshtoken, JSON.stringify({ clientId: googleClientId, clientSecret: googleClientSecret, topicName: googleTopicName }), 'GOOGLE', 'ACTIVO', request?.user?.usr, 50);

                    switch (request.body.type) {
                        case 'BLOGGER':
                            parameters.communicationchannelsite = `${informationtoken.email}&%BLOG%&${service.channel}`;
                            parameters.type = 'BLOG';

                            await channelfunctions.serviceSubscriptionUpdate(informationtoken.email, service.channel, JSON.stringify({ clientId: googleClientId, clientSecret: googleClientSecret, topicName: googleTopicName }), 'GOOGLE-BLOGGER', 'ACTIVO', request?.user?.usr, `${hookEndpoint}blogger/webhookasync`, 2);
                            break;

                        case 'YOUTUBE':
                            parameters.communicationchannelsite = `${informationtoken.email}&%YOUT%&${service.channel}`;
                            parameters.type = 'YOUT';

                            await channelfunctions.serviceSubscriptionUpdate(informationtoken.email, service.channel, JSON.stringify({ clientId: googleClientId, clientSecret: googleClientSecret, topicName: googleTopicName }), 'GOOGLE-YOUTUBE', 'ACTIVO', request?.user?.usr, `${hookEndpoint}youtube/webhookasync`, 2);
                            break;
                    }

                    const transactionCreateGeneric = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionCreateGeneric instanceof Array) {
                        return response.json({
                            success: true
                        });
                    }
                    else {
                        return response.status(400).json({
                            msg: transactionCreateGeneric.code,
                            success: false
                        });
                    }
                }
                break;

            case 'LINKEDIN':
            case 'MICROSOFTTEAMS':
            case 'TIKTOK':
                if (service) {
                    parameters.communicationchannelowner = service.account;
                    parameters.communicationchannelsite = service.account;
                    parameters.integrationid = service.account;
                    parameters.servicecredentials = JSON.stringify(service);
                    parameters.status = 'PENDIENTE';

                    switch (request.body.type) {
                        case 'LINKEDIN':
                            parameters.type = 'LNKD';
                            break;

                        case 'MICROSOFTTEAMS':
                            parameters.type = 'TEAM';
                            break;

                        case 'TIKTOK':
                            parameters.type = 'TITO';
                            break;
                    }

                    const transactionCreateGeneric = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionCreateGeneric instanceof Array) {
                        return response.json({
                            success: true
                        });
                    }
                    else {
                        return response.status(400).json({
                            msg: transactionCreateGeneric.code,
                            success: false
                        });
                    }
                }
                break;

            case 'TELEGRAM':
                const requestCreateTelegram = await axiosObservable({
                    data: {
                        accessToken: service.accesstoken,
                        linkType: 'TELEGRAMADD'
                    },
                    method: 'post',
                    url: `${bridgeEndpoint}processlaraigo/telegram/managetelegramlink`,
                    _requestid: request._requestid,
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
                        await channelfunctions.clearHookCache('TelegramService', request._requestid);

                        return response.json({
                            success: true
                        });
                    }
                    else {
                        return response.status(400).json({
                            msg: transactionCreateTelegram.code,
                            success: false
                        });
                    }
                }
                else {
                    return response.status(400).json({
                        msg: requestCreateTelegram.data.operationMessage,
                        success: false
                    });
                }

            case 'TWITTER':
            case 'TWITTERDM':
                const requestPageTwitter = await axiosObservable({
                    data: {
                        accessSecret: service.accesssecret,
                        accessToken: service.accesstoken,
                        consumerKey: service.consumerkey,
                        consumerSecret: service.consumersecret,
                        developmentEnvironment: service.devenvironment,
                        linkType: 'GETPAGEID'
                    },
                    method: 'post',
                    url: `${bridgeEndpoint}processlaraigo/twitter/managetwitterlink`,
                    _requestid: request._requestid,
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
                        const requestCreateTwitter = await axiosObservable({
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
                            url: `${bridgeEndpoint}processlaraigo/twitter/managetwitterlink`,
                            _requestid: request._requestid,
                        });

                        if (requestCreateTwitter.data.success) {
                            await channelfunctions.clearHookCache('TwitterService', request._requestid);

                            return response.json({
                                success: true
                            });
                        }
                        else {
                            parameters.id = transactionCreateTwitter[0].ufn_communicationchannel_ins;
                            parameters.motive = 'Delete from API';
                            parameters.operation = 'DELETE';

                            const transactionDeleteTwitter = await triggerfunctions.executesimpletransaction(method, parameters);

                            if (transactionDeleteTwitter instanceof Array) {
                                return response.status(400).json({
                                    msg: requestCreateTwitter.data.operationMessage,
                                    success: false
                                });
                            }
                            else {
                                return response.status(400).json({
                                    msg: transactionDeleteTwitter.code,
                                    success: false
                                });
                            }
                        }
                    }
                    else {
                        return response.status(400).json({
                            msg: transactionCreateTwitter.code,
                            success: false
                        });
                    }
                }
                else {
                    return response.status(400).json({
                        msg: requestPageTwitter.data.operationMessage,
                        success: false
                    });
                }

            case 'WHATSAPP':
                if (!service.accesstoken && service.channelid) {
                    const requestGetApiKey = await axiosObservable({
                        data: {
                            partnerId: service.partnerid,
                            channelId: service.channelid,
                        },
                        method: 'post',
                        url: `${bridgeEndpoint}processpartner/getapikey`,
                        _requestid: request._requestid,
                    });

                    if (requestGetApiKey.data.success) {
                        service.accesstoken = requestGetApiKey.data.apiKey;
                    }
                }

                const requestCreateWhatsApp = await axiosObservable({
                    data: {
                        accessToken: service.accesstoken,
                        linkType: 'WHATSAPPADD'
                    },
                    method: 'post',
                    url: `${bridgeEndpoint}processlaraigo/whatsapp/managewhatsapplink`,
                    _requestid: request._requestid,
                });

                if (requestCreateWhatsApp.data.success) {
                    var serviceCredentials = {
                        apiKey: service.accesstoken,
                        endpoint: whatsAppEndpoint,
                        number: requestCreateWhatsApp.data.phoneNumber
                    };

                    parameters.communicationchannelsite = requestCreateWhatsApp.data.phoneNumber;
                    parameters.servicecredentials = JSON.stringify(serviceCredentials);
                    parameters.phone = requestCreateWhatsApp.data.phoneNumber;
                    parameters.type = 'WHAD';

                    const transactionCreateWhatsApp = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionCreateWhatsApp instanceof Array) {
                        await channelfunctions.clearHookCache('Dialog360Service', request._requestid);

                        return response.json({
                            success: true
                        });
                    }
                    else {
                        return response.status(400).json({
                            msg: transactionCreateWhatsApp.code,
                            success: false
                        });
                    }
                }
                else {
                    return response.status(400).json({
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
                            username: request.user.usr,
                            _requestid: request._requestid,
                        };

                        const transactionGetRecipient = await triggerfunctions.executesimpletransaction(domainMethod, domainParameters);

                        if (transactionGetRecipient instanceof Array) {
                            if (transactionGetRecipient.length > 0) {
                                domainParameters = {
                                    all: false,
                                    corpid: 1,
                                    domainname: 'WHATSAPPSUBJECT',
                                    orgid: 0,
                                    username: request.user.usr,
                                    _requestid: request._requestid,
                                };

                                const transactionGetSubject = await triggerfunctions.executesimpletransaction(domainMethod, domainParameters);

                                if (transactionGetSubject instanceof Array) {
                                    if (transactionGetSubject.length > 0) {
                                        domainParameters = {
                                            all: false,
                                            corpid: 1,
                                            domainname: 'WHATSAPPBODY',
                                            orgid: 0,
                                            username: request.user.usr,
                                            _requestid: request._requestid,
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

                                                const requestSendMail = await axiosObservable({
                                                    data: {
                                                        mailAddress: mailRecipient,
                                                        mailBody: mailBody,
                                                        mailTitle: mailSubject
                                                    },
                                                    method: 'post',
                                                    url: `${bridgeEndpoint}processscheduler/sendmail`,
                                                    _requestid: request._requestid,
                                                });

                                                if (!requestSendMail.data.success) {
                                                    return response.status(400).json({
                                                        msg: requestSendMail.data.operationMessage,
                                                        success: false,
                                                        error: true
                                                    });
                                                }
                                            }
                                        }
                                        else {
                                            return response.status(400).json({
                                                msg: transactionGetBody.code,
                                                success: false,
                                                error: true
                                            });
                                        }
                                    }
                                }
                                else {
                                    return response.status(400).json({
                                        msg: transactionGetSubject.code,
                                        success: false,
                                        error: true
                                    });
                                }
                            }
                        }
                        else {
                            return response.status(400).json({
                                msg: transactionGetRecipient.code,
                                success: false,
                                error: true
                            });
                        }
                    }

                    return response.json({
                        success: true
                    });
                }
                else {
                    return response.status(400).json({
                        msg: transactionCreateWhatsAppSmooch.code,
                        success: false
                    });
                }

            case 'WHATSAPPSMOOCHINSERT':
                const requestInsertWhatsAppSmooch = await axiosObservable({
                    data: {
                        apiKeyId: service.apikeyid,
                        apiKeySecret: service.apikeysecret,
                        applicationId: service.appid,
                        linkType: 'WEBHOOKMIGRATE'
                    },
                    method: 'post',
                    url: `${bridgeEndpoint}processlaraigo/smooch/managesmoochlink`,
                    _requestid: request._requestid,
                });

                if (requestInsertWhatsAppSmooch.data.success) {
                    var serviceCredentials = {
                        apiKeyId: service.apikeyid,
                        apiKeySecret: service.apikeysecret,
                        appId: service.appid,
                        endpoint: 'https://api.smooch.io/',
                        integrationId: requestInsertWhatsAppSmooch.data.integrationId,
                        version: 'v1.1'
                    };

                    parameters.communicationchannelowner = service.appid;
                    parameters.communicationchannelsite = service.appid;
                    parameters.integrationid = requestInsertWhatsAppSmooch.data.integrationId;
                    parameters.phone = requestInsertWhatsAppSmooch.data.phoneNumber;
                    parameters.servicecredentials = JSON.stringify(serviceCredentials);
                    parameters.type = 'WHAT';

                    const transactionInsertWhatsApp = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionInsertWhatsApp instanceof Array) {
                        await channelfunctions.clearHookCache('SmoochService', request._requestid);

                        return response.json({
                            success: true
                        });
                    }
                    else {
                        return response.status(400).json({
                            msg: transactionInsertWhatsApp.code,
                            success: false
                        });
                    }
                }
                else {
                    return response.status(400).json({
                        msg: requestInsertWhatsAppSmooch.data.operationMessage,
                        success: false
                    });
                }

            case 'WHATSAPPGUPSHUP':
                const requestInsertWhatsAppGupshup = await axiosObservable({
                    data: {
                        apiKey: service.apikey,
                        appId: service.appid,
                        linkType: 'GUPSHUPADD',
                    },
                    method: 'post',
                    url: `${bridgeEndpoint}processlaraigo/gupshup/managegupshuplink`,
                    _requestid: request._requestid,
                });

                if (requestInsertWhatsAppGupshup.data.success) {
                    var serviceCredentials = {
                        apiKey: service.apikey,
                        app: service.appname,
                        endpoint: `${requestInsertWhatsAppGupshup.data.endpoint}sm/api/v1/`,
                        number: service.appnumber,
                    };

                    parameters.communicationchannelsite = service.appname;
                    parameters.communicationchannelowner = service.appid;
                    parameters.phone = service.appnumber;
                    parameters.servicecredentials = JSON.stringify(serviceCredentials);
                    parameters.type = 'WHAG';

                    const transactionInsertWhatsAppGupshup = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionInsertWhatsAppGupshup instanceof Array) {
                        await channelfunctions.clearHookCache('GupshupService', request._requestid);

                        return response.json({
                            success: true
                        });
                    }
                    else {
                        return response.status(400).json({
                            msg: transactionInsertWhatsAppGupshup.code,
                            success: false
                        });
                    }
                }
                else {
                    return response.status(400).json({
                        msg: requestInsertWhatsAppGupshup.data.operationMessage,
                        success: false
                    });
                }

            case 'VOXIMPLANTPHONE':
                var voximplantEnvironment = await channelfunctions.voximplantHandleEnvironment(request.user.corpid, request.user.orgid, request.originalUrl, request._requestid);

                if (voximplantEnvironment) {
                    if (voximplantEnvironment.accountid && voximplantEnvironment.apikey && voximplantEnvironment.applicationid && voximplantEnvironment.userid) {
                        var voximplantScenario = await channelfunctions.voximplantHandleScenario(request.user.corpid, request.user.orgid, voximplantEnvironment.accountid, voximplantEnvironment.apikey, voximplantEnvironment.applicationid, request.originalUrl, request._requestid);

                        if (voximplantScenario) {
                            if (voximplantScenario.ruleid && voximplantScenario.scenarioid) {
                                var voximplantPhoneNumber = await channelfunctions.voximplantHandlePhoneNumber(request.user.corpid, request.user.orgid, request.user.usr, voximplantEnvironment.accountid, voximplantEnvironment.apikey, voximplantEnvironment.applicationid, voximplantScenario.ruleid, service.country, service.category, service.state, (service.region || 0).toString(), service.cost, service.costinstallation, voximplantEnvironment.additionalperchannel, request.originalUrl, request._requestid);

                                if (voximplantPhoneNumber) {
                                    if (voximplantPhoneNumber.phoneid && voximplantPhoneNumber.phonenumber && voximplantPhoneNumber.queueid) {
                                        var serviceCredentials = {
                                            phoneid: voximplantPhoneNumber.phoneid,
                                            phonenumber: voximplantPhoneNumber.phonenumber,
                                            queueid: voximplantPhoneNumber.queueid,
                                            ruleid: voximplantScenario.ruleid,
                                            scenarioid: voximplantScenario.scenarioid,
                                            ruleoutid: voximplantScenario.ruleoutid,
                                            scenariooutid: voximplantScenario.scenariooutid,
                                            accountid: voximplantEnvironment.accountid,
                                            apikey: voximplantEnvironment.apikey,
                                            applicationid: voximplantEnvironment.applicationid,
                                            applicationname: voximplantEnvironment.applicationname,
                                            country: service.country,
                                            countryname: service.countryname,
                                            category: service.category,
                                            categoryname: service.categoryname,
                                            state: service.state,
                                            statename: service.statename,
                                            region: service.region,
                                            regionname: service.regionname,
                                            cost: service.cost,
                                            costvca: service.costvca,
                                            costinstallation: service.costinstallation,
                                            recording: service.recording,
                                            sms: service.sms,
                                            outbound: service.outbound,
                                            callsupervision: service.callsupervision,
                                            recordingstorage: service.recordingstorage?.value,
                                            recordingquality: service.recordingquality?.value,
                                            additionalperchannel: voximplantEnvironment.additionalperchannel,
                                        };

                                        var voximplantRecording = {
                                            recording: service.recording,
                                            recordingstorage: service.recordingstorage?.value,
                                            recordingquality: service.recordingquality?.value,
                                        };

                                        parameters.communicationchannelsite = voximplantPhoneNumber.phonenumber;
                                        parameters.communicationchannelowner = voximplantEnvironment.applicationname;
                                        parameters.servicecredentials = JSON.stringify(serviceCredentials);
                                        parameters.voximplantrecording = JSON.stringify(voximplantRecording);
                                        parameters.voximplantwelcometone = "https://staticfileszyxme.s3.us-east.cloud-object-storage.appdomain.cloud/VCA%20PERU/994eacd0-4520-4aec-8f4e-fe7dcab5f5ed/intel.mp3";
                                        parameters.voximplantholdtone = "https://staticfileszyxme.s3.us-east.cloud-object-storage.appdomain.cloud/VCA%20PERU/932a8ad1-0a67-467f-aef5-e56c52e05c3f/halos-of-eternity.mp3";
                                        parameters.phone = voximplantPhoneNumber.phonenumber;
                                        parameters.type = 'VOXI';

                                        const transactionCreateVoximplant = await triggerfunctions.executesimpletransaction(method, parameters);

                                        if (transactionCreateVoximplant instanceof Array) {
                                            return response.json({
                                                integrationId: voximplantPhoneNumber.phonenumber,
                                                success: true
                                            });
                                        }
                                        else {
                                            return response.status(400).json({
                                                msg: transactionCreateVoximplant.code,
                                                success: false
                                            });
                                        }
                                    }
                                    else {
                                        return response.status(400).json({
                                            msg: 'voximplant_phonenumberqueue_error',
                                            success: false
                                        });
                                    }
                                }
                                else {
                                    return response.status(400).json({
                                        msg: 'voximplant_phonenumberqueue_error',
                                        success: false
                                    });
                                }
                            }
                            else {
                                return response.status(400).json({
                                    msg: 'voximplant_scenariorule_error',
                                    success: false
                                });
                            }
                        }
                        else {
                            return response.status(400).json({
                                msg: 'voximplant_scenariorule_error',
                                success: false
                            });
                        }
                    }
                    else {
                        return response.status(400).json({
                            msg: 'voximplant_accountapplication_error',
                            success: false
                        });
                    }
                }
                else {
                    return response.status(400).json({
                        msg: 'voximplant_accountapplication_error',
                        success: false
                    });
                }

            default:
                return response.status(400).json({
                    msg: 'Channel not supported',
                    success: false
                });
        }
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            msg: exception.message,
        });
    }
}

exports.updateChannel = async (request, response) => {
    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var { method, parameters = {}, service = {}, type } = request.body;

        setSessionParameters(parameters, request.user, request._requestid);

        parameters.corpid = request.user.corpid;
        parameters.orgid = request.user.orgid;
        parameters.username = request.user.usr;
        parameters.phone = null;

        if (type === "CHATWEB") {
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
                        messageClientColor: service.color ? service.color.client : '',
                        iconscolor: service.color ? service.color.iconscolor : ''
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
                        uploadvideo: service.extra ? service.extra.uploadvideo : false,
                        withBorder: service.extra?.withBorder || false,
                        withHour: service.extra?.withHour || false,
                        iconColorActive: service.extra?.iconColorActive || "",
                        iconColorDisabled: service.extra?.iconColorDisabled || "",
                        inputTextSize: service.extra?.inputTextSize || 0,
                        inputTextWeight: service.extra?.inputTextWeight || 0,
                        chatTextSize: service.extra?.chatTextSize || 0,
                        chatTextWeight: service.extra?.chatTextWeight || 0,
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

            const requestWebChatCreate = await axiosObservable({
                data: webChatData,
                method: 'put',
                url: `${brokerEndpoint}integrations/update/${parameters.communicationchannelsite}`,
                _requestid: request._requestid,
            });

            if (typeof requestWebChatCreate.data.id !== 'undefined' && requestWebChatCreate.data.id) {
                parameters.channelparameters = JSON.stringify(webChatData);
                parameters.servicecredentials = JSON.stringify(service);

                const transactionCreateWebChat = await triggerfunctions.executesimpletransaction(method, parameters);

                if (transactionCreateWebChat instanceof Array) {
                    return response.json({
                        integrationid: requestWebChatCreate.data.id,
                        success: true
                    });
                }
                else {
                    return response.status(400).json({
                        msg: transactionCreateWebChat.code,
                        success: false
                    });
                }
            }
            else {
                return response.status(400).json({
                    msg: 'Could not update integration',
                    success: false
                });
            }
        } else {
            const webChatData = {
                applicationId: webChatApplication,
                name: parameters.description,
                status: 'ACTIVO',
                type: 'FORM',
                metadata: {
                    extra: {
                        ...(service.extra || {}),
                        corpid: request.user.corpid,
                        orgid: request.user.orgid,
                    },
                    form: service.form || null,
                }
            }

            const requestWebChatCreate = await axiosObservable({
                data: webChatData,
                method: 'put',
                url: `${brokerEndpoint}integrations/update/${parameters.communicationchannelsite}`,
                _requestid: request._requestid,
            });

            if (typeof requestWebChatCreate.data.id !== 'undefined' && requestWebChatCreate.data.id) {
                parameters.channelparameters = JSON.stringify(webChatData);
                parameters.servicecredentials = JSON.stringify(service);

                const transactionCreateWebChat = await triggerfunctions.executesimpletransaction(method, parameters);

                if (transactionCreateWebChat instanceof Array) {
                    return response.json({
                        integrationid: requestWebChatCreate.data.id,
                        success: true
                    });
                }
                else {
                    return response.status(400).json({
                        msg: transactionCreateWebChat.code,
                        success: false
                    });
                }
            }
            else {
                return response.status(400).json({
                    msg: 'Could not update integration',
                    success: false
                });
            }
        }
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            msg: exception.message,
        });
    }
}

exports.activateChannel = async (request, response) => {
    try {
        logger.child({ _requestid: request._requestid, ctx: request.body }).debug(`Request to ${request.originalUrl}`);

        var { method, parameters = {}, service = {} } = request.body;

        setSessionParameters(parameters, request.user, request._requestid);

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
        parameters.phone = null;
        parameters.apikey = null;
        parameters.voximplantrecording = null;
        parameters.voximplantwelcometone = null;
        parameters.voximplantholdtone = null;

        if (request.body.type === 'WHATSAPP') {
            const requestCreateWhatsApp = await axiosObservable({
                data: {
                    accessToken: service.accesstoken,
                    linkType: 'WHATSAPPADD'
                },
                method: 'post',
                url: `${bridgeEndpoint}processlaraigo/whatsapp/managewhatsapplink`,
                _requestid: request._requestid,
            });

            if (requestCreateWhatsApp.data.success) {
                var serviceCredentials = {
                    apiKey: service.accesstoken,
                    endpoint: whatsAppEndpoint,
                    number: requestCreateWhatsApp.data.phoneNumber
                };

                parameters.communicationchannelsite = requestCreateWhatsApp.data.phoneNumber;
                parameters.servicecredentials = JSON.stringify(serviceCredentials);
                parameters.phone = requestCreateWhatsApp.data.phoneNumber;
                parameters.type = 'WHAD';

                const transactionActivateWhatsApp = await triggerfunctions.executesimpletransaction(method, parameters);

                if (transactionActivateWhatsApp instanceof Array) {
                    return response.json({
                        success: true
                    });
                }
                else {
                    return response.status(400).json({
                        msg: transactionActivateWhatsApp.code,
                        success: false
                    });
                }
            }
            else {
                return response.status(400).json({
                    msg: requestCreateWhatsApp.data.operationMessage,
                    success: false
                });
            }
        }
        else {
            const requestMigrateWhatsApp = await axiosObservable({
                data: {
                    linkType: 'WEBHOOKMIGRATE',
                    apiKeyId: service.apikeyid,
                    apiKeySecret: service.apikeysecret,
                    applicationId: service.appid
                },
                method: 'post',
                url: `${bridgeEndpoint}processlaraigo/smooch/managesmoochlink`,
                _requestid: request._requestid,
            });

            if (requestMigrateWhatsApp.data.success) {
                parameters.servicecredentials = JSON.stringify({
                    apiKeyId: service.apikeyid,
                    apiKeySecret: service.apikeysecret,
                    appId: service.appid,
                    endpoint: 'https://api.smooch.io/',
                    integrationId: requestMigrateWhatsApp.data.integrationId,
                    version: 'v1.1'
                });

                parameters.communicationchannelowner = service.appid;
                parameters.communicationchannelsite = service.appid;
                parameters.integrationid = requestMigrateWhatsApp.data.integrationId;
                parameters.phone = requestMigrateWhatsApp.data.phoneNumber;
                parameters.type = 'WHAT';

                const transactionActivateWhatsApp = await triggerfunctions.executesimpletransaction(method, parameters);

                if (transactionActivateWhatsApp instanceof Array) {
                    return response.json({
                        success: true
                    });
                }
                else {
                    return response.status(400).json({
                        msg: transactionActivateWhatsApp.code,
                        success: false
                    });
                }
            }
            else {
                return response.status(400).json({
                    msg: requestMigrateWhatsApp.data.operationMessage,
                    success: false
                });
            }
        }
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            msg: exception.message,
        });
    }
}

exports.synchronizeTemplate = async (request, response) => {
    try {
        let requestCode = "error_unexpected_error";
        let requestMessage = "error_unexpected_error";
        let requestStatus = 400;
        let requestSuccess = false;

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
            let { messagetemplatelist, communicationchannel } = request.body;

            if (communicationchannel) {
                if (communicationchannel.type) {
                    let templateList = null;
    
                    switch (communicationchannel.type) {
                        case "WHAD":
                            if (communicationchannel.servicecredentials) {
                                let serviceData = JSON.parse(communicationchannel.servicecredentials);
    
                                const requestListDialog = await axiosObservable({
                                    data: {
                                        ApiKey: serviceData.apiKey,
                                        Type: "LIST",
                                    },
                                    method: 'post',
                                    url: `${bridgeEndpoint}processlaraigo/dialog360/dialog360messagetemplate`,
                                    _requestid: request._requestid,
                                });
    
                                if (requestListDialog.data.success) {
                                    templateList = requestListDialog.data.result;
                                }
                                else {
                                    requestCode = requestListDialog.data.operationMessage
                                    requestMessage = requestListDialog.data.operationMessage;
                                }
                            }
                            break;
    
                        case "WHAG":
                            if (communicationchannel.servicecredentials) {
                                let serviceData = JSON.parse(communicationchannel.servicecredentials);
    
                                const requestListGupshup = await axiosObservable({
                                    data: {
                                        AppName: serviceData.app,
                                        ApiKey: serviceData.apiKey,
                                        Type: "LIST",
                                    },
                                    method: 'post',
                                    url: `${bridgeEndpoint}processlaraigo/gupshup/gupshupmessagetemplate`,
                                    _requestid: request._requestid,
                                });
    
                                if (requestListGupshup.data.success) {
                                    templateList = requestListGupshup.data.result;
                                }
                                else {
                                    requestCode = requestListGupshup.data.operationMessage
                                    requestMessage = requestListGupshup.data.operationMessage;
                                }
                            }
                            break;
    
                        case "WHAT":
                            if (communicationchannel.servicecredentials) {
                                let serviceData = JSON.parse(communicationchannel.servicecredentials);
    
                                const requestListSmooch = await axiosObservable({
                                    data: {
                                        AppId: serviceData.appId,
                                        IntegrationId: communicationchannel.integrationid,
                                        Type: "LIST",
                                        KeyId: serviceData.apiKeyId,
                                        KeySecret: serviceData.apiKeySecret,
                                    },
                                    method: 'post',
                                    url: `${bridgeEndpoint}processlaraigo/smooch/smoochmessagetemplate`,
                                    _requestid: request._requestid,
                                });
    
                                if (requestListSmooch.data.success) {
                                    templateList = requestListSmooch.data.result;
                                }
                                else {
                                    requestCode = requestListSmooch.data.operationMessage
                                    requestMessage = requestListSmooch.data.operationMessage;
                                }
                            }
                            break;
                    }
    
                    if (templateList) {
                        await channelfunctions.messageTemplateReset(communicationchannel.corpid, communicationchannel.orgid, communicationchannel.communicationchannelid, (communicationchannel.type === "WHAD" || communicationchannel.type === "WHAG") ? templateList[0]?.id || null : null, request.user.usr, request._requestid);
    
                        for (const templateData of templateList) {
                            let buttonObject = [];
    
                            if (templateData.buttons) {
                                for (const buttonData of templateData.buttons) {
                                    let buttonInformation = {
                                        type: (buttonData.type || '').toLowerCase(),
                                        title: buttonData.text || '',
                                        payload: (buttonData.data || buttonData.text) || '',
                                    };
    
                                    buttonObject.push(buttonInformation);
                                }
                            }
    
                            await channelfunctions.messageTemplateUpd(
                                communicationchannel.corpid,
                                communicationchannel.orgid,
                                communicationchannel.communicationchanneldesc,
                                'HSM',
                                'ACTIVO',
                                templateData.name,
                                (communicationchannel.type === "WHAD" || communicationchannel.type === "WHAG") ? templateData.id : null,
                                templateData.category,
                                templateData.language,
                                (templateData.header || templateData.footer || templateData.buttons) ? "MULTIMEDIA" : "STANDARD",
                                (templateData.header) ? true : false,
                                templateData.header?.type ? templateData.header?.type.toLowerCase() : null,
                                templateData.header?.text || null,
                                templateData.body?.text || null,
                                null,
                                (templateData.footer) ? true : false,
                                templateData.footer?.text || null,
                                (templateData.buttons) ? true : false,
                                (templateData.buttons) ? JSON.stringify(buttonObject) : null,
                                true,
                                templateData.id,
                                templateData.status,
                                communicationchannel.communicationchannelid,
                                communicationchannel.type,
                                null,
                                request.user.usr,
                                request._requestid,
                            );
                        }
    
                        requestCode = "";
                        requestMessage = "";
                        requestStatus = 200;
                        requestSuccess = true;
                    }
                }
            }
            else {
                if (messagetemplatelist) {
                    messagetemplatelist = messagetemplatelist.sort((a, b) => a.communicationchannelservicecredentials > b.communicationchannelservicecredentials ? 1 : -1);

                    let servicecredentials = null;
                    let templatelist = null;

                    for (const messagetemplate of messagetemplatelist) {
                        if (messagetemplate.communicationchannelservicecredentials && messagetemplate.fromprovider) {
                            if (messagetemplate.communicationchannelservicecredentials != servicecredentials) {
                                servicecredentials = messagetemplate.communicationchannelservicecredentials;

                                switch (messagetemplate.communicationchanneltype) {
                                    case "WHAD":
                                        if (servicecredentials) {
                                            let serviceData = JSON.parse(servicecredentials);
                
                                            const requestListDialog = await axiosObservable({
                                                data: {
                                                    ApiKey: serviceData.apiKey,
                                                    Type: "LIST",
                                                },
                                                method: 'post',
                                                url: `${bridgeEndpoint}processlaraigo/dialog360/dialog360messagetemplate`,
                                                _requestid: request._requestid,
                                            });
                
                                            if (requestListDialog.data.success) {
                                                templatelist = requestListDialog.data.result;
                                            }
                                            else {
                                                requestCode = requestListDialog.data.operationMessage
                                                requestMessage = requestListDialog.data.operationMessage;
                                            }
                                        }
                                        break;
                
                                    case "WHAG":
                                        if (servicecredentials) {
                                            let serviceData = JSON.parse(servicecredentials);
                
                                            const requestListGupshup = await axiosObservable({
                                                data: {
                                                    AppName: serviceData.app,
                                                    ApiKey: serviceData.apiKey,
                                                    Type: "LIST",
                                                },
                                                method: 'post',
                                                url: `${bridgeEndpoint}processlaraigo/gupshup/gupshupmessagetemplate`,
                                                _requestid: request._requestid,
                                            });
                
                                            if (requestListGupshup.data.success) {
                                                templatelist = requestListGupshup.data.result;
                                            }
                                            else {
                                                requestCode = requestListGupshup.data.operationMessage
                                                requestMessage = requestListGupshup.data.operationMessage;
                                            }
                                        }
                                        break;
                
                                    case "WHAT":
                                        if (servicecredentials) {
                                            let serviceData = JSON.parse(servicecredentials);
                
                                            const requestListSmooch = await axiosObservable({
                                                data: {
                                                    AppId: serviceData.appId,
                                                    IntegrationId: messagetemplate.communicationchannelintegrationid,
                                                    Type: "LIST",
                                                    KeyId: serviceData.apiKeyId,
                                                    KeySecret: serviceData.apiKeySecret,
                                                },
                                                method: 'post',
                                                url: `${bridgeEndpoint}processlaraigo/smooch/smoochmessagetemplate`,
                                                _requestid: request._requestid,
                                            });
                
                                            if (requestListSmooch.data.success) {
                                                templatelist = requestListSmooch.data.result;
                                            }
                                            else {
                                                requestCode = requestListSmooch.data.operationMessage
                                                requestMessage = requestListSmooch.data.operationMessage;
                                            }
                                        }
                                        break;
                                }
                            }

                            if (templatelist) {
                                const templatefound = templatelist.find(x => x.name === messagetemplate.name);

                                if (templatefound) {
                                    let buttonObject = [];

                                    if (templatefound.buttons) {
                                        for (const buttonData of templatefound.buttons) {
                                            let buttonInformation = {
                                                type: (buttonData.type || '').toLowerCase(),
                                                title: buttonData.text || '',
                                                payload: (buttonData.data || buttonData.text) || '',
                                            };

                                            buttonObject.push(buttonInformation);
                                        }
                                    }

                                    await channelfunctions.messageTemplateUpd(
                                        messagetemplate.corpid,
                                        messagetemplate.orgid,
                                        messagetemplate.description,
                                        'HSM',
                                        'ACTIVO',
                                        templatefound.name,
                                        (messagetemplate.communicationchanneltype === "WHAD" || messagetemplate.communicationchanneltype === "WHAG") ? templatefound.id : messagetemplate.namespace,
                                        templatefound.category,
                                        templatefound.language,
                                        (templatefound.header || templatefound.footer || templatefound.buttons) ? "MULTIMEDIA" : "STANDARD",
                                        (templatefound.header) ? true : false,
                                        templatefound.header?.type ? templatefound.header?.type.toLowerCase() : null,
                                        templatefound.header?.text || null,
                                        templatefound.body?.text || null,
                                        null,
                                        (templatefound.footer) ? true : false,
                                        templatefound.footer?.text || null,
                                        (templatefound.buttons) ? true : false,
                                        (templatefound.buttons) ? JSON.stringify(buttonObject) : null,
                                        true,
                                        templatefound.id,
                                        templatefound.status,
                                        messagetemplate.communicationchannelid,
                                        messagetemplate.communicationchanneltype,
                                        null,
                                        request.user.usr,
                                        request._requestid,
                                    );

                                    requestCode = "";
                                    requestMessage = "";
                                    requestStatus = 200;
                                    requestSuccess = true;
                                }
                                else {
                                    await channelfunctions.messageTemplateUpd(
                                        messagetemplate.corpid,
                                        messagetemplate.orgid,
                                        messagetemplate.description,
                                        messagetemplate.type,
                                        messagetemplate.status,
                                        messagetemplate.name,
                                        messagetemplate.namespace,
                                        messagetemplate.category,
                                        messagetemplate.language,
                                        messagetemplate.templatetype,
                                        messagetemplate.headerenabled,
                                        messagetemplate.headertype,
                                        messagetemplate.header,
                                        messagetemplate.body,
                                        messagetemplate.bodyobject,
                                        messagetemplate.footerenabled,
                                        messagetemplate.footer,
                                        messagetemplate.buttonsenabled,
                                        messagetemplate.buttons,
                                        messagetemplate.fromprovider,
                                        messagetemplate.externalid,
                                        'DELETED',
                                        messagetemplate.communicationchannelid,
                                        messagetemplate.communicationchanneltype,
                                        messagetemplate.exampleparameters,
                                        request.user.usr,
                                        request._requestid,
                                    );

                                    requestCode = "";
                                    requestMessage = "";
                                    requestStatus = 200;
                                    requestSuccess = true;
                                }
                            }
                        }
                    }
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

exports.addTemplate = async (request, response) => {
    try {
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
            if (request.body.communicationchanneltype) {
                var addSuccess = false;

                switch (request.body.communicationchanneltype) {
                    case "WHAD":
                        if (request.body.servicecredentials) {
                            var serviceData = JSON.parse(request.body.servicecredentials);

                            var createBody = {
                                ApiKey: serviceData.apiKey,
                                Type: "CREATE",
                                Category: request.body.category,
                                Name: request.body.name,
                                Language: ((request.body.language || '').split('_')).length > 1 ? `${(request.body.language || '').split('_')[0].toLowerCase()}_${(request.body.language || '').split('_')[1]}` : ((request.body.language || '').split('_')[0].toLowerCase()),
                                Header: request.body.headerenabled ? { Type: request.body.headertype, Text: request.body.headertype === "text" ? request.body.header : null } : null,
                                Footer: request.body.footerenabled ? { Text: request.body.footer } : null,
                                Body: { Text: request.body.body },
                            }

                            if (request.body.buttons && request.body.buttons.length > 0) {
                                createBody.Buttons = [];

                                request.body.buttons.forEach(element => {
                                    createBody.Buttons.push({ Text: element.title, Type: element.type, Data: (element.type === "phone_number" ? `phoneNumber: ${element.payload}` : (element.type === "url" ? `url: ${element.payload}` : null)) });
                                });
                            }

                            const requestCreateDialog = await axiosObservable({
                                data: createBody,
                                method: 'post',
                                url: `${bridgeEndpoint}processlaraigo/dialog360/dialog360messagetemplate`,
                                _requestid: request._requestid,
                            });

                            if (requestCreateDialog.data.success) {
                                var parameters = request.body;

                                parameters.corpid = request.user.corpid;
                                parameters.orgid = request.user.orgid;
                                parameters.username = request.user.usr;
                                parameters.bodyobject = JSON.stringify(request.body.bodyobject);
                                parameters.buttons = JSON.stringify(request.body.buttons);
                                parameters.externalid = requestCreateDialog.data.result[0].id || '';
                                parameters.namespace = requestCreateDialog.data.result[0].id || '';

                                const queryTemplateAdd = await triggerfunctions.executesimpletransaction('UFN_MESSAGETEMPLATE_INS', parameters);

                                if (queryTemplateAdd instanceof Array) {
                                    addSuccess = true;
                                }
                                else {
                                    requestCode = queryTemplateAdd.code;
                                    requestMessage = queryTemplateAdd.code;
                                }
                            }
                            else {
                                requestCode = requestCreateDialog.data.operationMessage
                                requestMessage = requestCreateDialog.data.operationMessage;
                            }
                        }
                        break;

                    case "WHAT":
                        if (request.body.servicecredentials) {
                            var serviceData = JSON.parse(request.body.servicecredentials);

                            var createBody = {
                                AppId: serviceData.appId,
                                IntegrationId: request.body.integrationid,
                                Type: "CREATE",
                                KeyId: serviceData.apiKeyId,
                                KeySecret: serviceData.apiKeySecret,
                                Category: request.body.category,
                                Name: request.body.name,
                                Language: ((request.body.language || '').split('_')).length > 1 ? `${(request.body.language || '').split('_')[0].toLowerCase()}_${(request.body.language || '').split('_')[1]}` : ((request.body.language || '').split('_')[0].toLowerCase()),
                                Header: request.body.headerenabled ? { Type: request.body.headertype, Text: request.body.headertype === "text" ? request.body.header : null } : null,
                                Footer: request.body.footerenabled ? { Text: request.body.footer } : null,
                                Body: { Text: request.body.body },
                            }

                            if (request.body.buttons && request.body.buttons.length > 0) {
                                createBody.Buttons = [];

                                request.body.buttons.forEach(element => {
                                    createBody.Buttons.push({ Text: element.title, Type: element.type, Data: (element.type === "phone_number" ? `phoneNumber: ${element.payload}` : (element.type === "url" ? `url: ${element.payload}` : null)) });
                                });
                            }

                            const requestCreateSmooch = await axiosObservable({
                                data: createBody,
                                method: 'post',
                                url: `${bridgeEndpoint}processlaraigo/smooch/smoochmessagetemplate`,
                                _requestid: request._requestid,
                            });

                            if (requestCreateSmooch.data.success) {
                                var parameters = request.body;

                                parameters.corpid = request.user.corpid;
                                parameters.orgid = request.user.orgid;
                                parameters.username = request.user.usr;
                                parameters.bodyobject = JSON.stringify(request.body.bodyobject);
                                parameters.buttons = JSON.stringify(request.body.buttons);
                                parameters.externalid = requestCreateSmooch.data.result[0].id || '';

                                const queryTemplateAdd = await triggerfunctions.executesimpletransaction('UFN_MESSAGETEMPLATE_INS', parameters);

                                if (queryTemplateAdd instanceof Array) {
                                    addSuccess = true;
                                }
                                else {
                                    requestCode = queryTemplateAdd.code;
                                    requestMessage = queryTemplateAdd.code;
                                }
                            }
                            else {
                                requestCode = requestCreateSmooch.data.operationMessage
                                requestMessage = requestCreateSmooch.data.operationMessage;
                            }
                        }
                        break;
                }

                if (addSuccess) {
                    requestCode = "";
                    requestMessage = "";
                    requestStatus = 200;
                    requestSuccess = true;
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

exports.deleteTemplate = async (request, response) => {
    try {
        let requestCode = "error_unexpected_error";
        let requestMessage = "error_unexpected_error";
        let requestStatus = 400;
        let requestSuccess = false;

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
            let { messagetemplatelist } = request.body;

            if (messagetemplatelist) {
                for (const messagetemplate of messagetemplatelist) {
                    let deleteSuccess = false;

                    if (messagetemplate.deleteprovider) {
                        switch (messagetemplate.communicationchanneltype) {
                            case "WHAD":
                                if (messagetemplate.communicationchannelservicecredentials) {
                                    let serviceData = JSON.parse(messagetemplate.communicationchannelservicecredentials);
        
                                    const requestDeleteDialog = await axiosObservable({
                                        data: {
                                            ApiKey: serviceData.apiKey,
                                            DeleteName: messagetemplate.name,
                                            Type: "DELETE",
                                        },
                                        method: 'post',
                                        url: `${bridgeEndpoint}processlaraigo/dialog360/dialog360messagetemplate`,
                                        _requestid: request._requestid,
                                    });
    
                                    if (requestDeleteDialog.data.success) {
                                        deleteSuccess = true;
                                    }
                                    else {
                                        requestCode = requestDeleteDialog.data.operationMessage
                                        requestMessage = requestDeleteDialog.data.operationMessage;
                                    }
                                }
                                break;
        
                            case "WHAT":
                                if (messagetemplate.communicationchannelservicecredentials) {
                                    let serviceData = JSON.parse(messagetemplate.communicationchannelservicecredentials);

                                    const requestDeleteSmooch = await axiosObservable({
                                        data: {
                                            AppId: serviceData.appId,
                                            IntegrationId: messagetemplate.communicationchannelintegrationid,
                                            DeleteName: messagetemplate.name,
                                            Type: "DELETE",
                                            KeyId: serviceData.apiKeyId,
                                            KeySecret: serviceData.apiKeySecret,
                                        },
                                        method: 'post',
                                        url: `${bridgeEndpoint}processlaraigo/smooch/smoochmessagetemplate`,
                                        _requestid: request._requestid,
                                    });
        
                                    if (requestDeleteSmooch.data.success) {
                                        deleteSuccess = true;
                                    }
                                    else {
                                        requestCode = requestDeleteSmooch.data.operationMessage
                                        requestMessage = requestDeleteSmooch.data.operationMessage;
                                    }
                                }
                                break;
        
                            case "WHAG":
                                if (messagetemplate.communicationchannelservicecredentials) {
                                    deleteSuccess = true;
                                }
                                break;
                        }
                    }
                    else {
                        deleteSuccess = true;
                    }

                    if (deleteSuccess) {
                        let parameters = messagetemplate;

                        parameters.bodyobject = JSON.stringify(messagetemplate.bodyobject);
                        parameters.buttons = JSON.stringify(messagetemplate.buttons);
                        parameters.corpid = request.user.corpid;
                        parameters.orgid = request.user.orgid;
                        parameters.username = request.user.usr;
        
                        const queryTemplateDelete = await triggerfunctions.executesimpletransaction('UFN_MESSAGETEMPLATE_INS', parameters);
        
                        if (queryTemplateDelete instanceof Array) {
                            requestCode = "";
                            requestMessage = "";
                            requestStatus = 200;
                            requestSuccess = true;
                        }
                        else {
                            requestCode = queryTemplateDelete.code;
                            requestMessage = queryTemplateDelete.code;
                        }
                    }
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