const triggerfunctions = require('../config/triggerfunctions');
const axios = require('axios');
const { setSessionParameters } = require('../config/helpers');

const URLABANDON = process.env.WEBCHATSCRIPT;
const URLBROKER = process.env.CHATBROKER;
const URLBRIDGE = process.env.BRIDGE;
const URLHOOK = process.env.HOOK;
const FACEBOOKAPI = process.env.FACEBOOKAPI;
const WHATSAPPAPI = process.env.WHATSAPPAPI;
const TELEGRAMAPI = process.env.TELEGRAMAPI;

const chatwebApplicationId = process.env.CHATAPPLICATION;

exports.GetChannelService = async (req, res) => {
    try {
        var method = null;
        var data = null;

        if (req.body.siteType !== 'TWTR') {
            if (req.body.siteType === 'SMCH') {
                method = 'UFN_COMMUNICATIONCHANNELSITE_SMOOCH_SEL';
                data = {
                    communicationchannelsite: req.body.siteId
                };
            }
            else {
                method = 'UFN_COMMUNICATIONCHANNELSITE_SEL';
                data = {
                    communicationchannelsite: req.body.siteId,
                    type: req.body.siteType,
                };
            }

            const resx = await triggerfunctions.executesimpletransaction(method, data);

            if (resx instanceof Array) {
                if (resx.length > 0) {
                    return res.json({
                        success: true,
                        serviceData: resx[0].servicecredentials
                    });
                }
                else {
                    return res.json({
                        success: false,
                        msg: 'Not found'
                    });
                }
            }
            else {
                return res.status(500).json({
                    success: false,
                    msg: resx.msg
                });
            }
        }
        else {
            method = 'UFN_COMMUNICATIONCHANNELHOOK_SEL';
            data = {
                site: req.body.siteId,
                type: req.body.siteType,
            };

            const resx = await triggerfunctions.executesimpletransaction(method, data);

            if (resx instanceof Array) {
                if (resx.length > 0) {
                    return res.json({
                        success: true,
                        serviceData: resx[0].servicedata
                    });
                }
                else {
                    return res.json({
                        success: false,
                        msg: 'Not found'
                    });
                }
            }
            else {
                return res.status(500).json({
                    success: false,
                    msg: resx.msg
                });
            }
        }
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            msg: error
        });
    }
}

exports.GetPageList = async (req, res) => {
    try {
        const responseGetPageList = await axios({
            url: `${URLBRIDGE}processlaraigo/facebook/managefacebooklink`,
            method: 'post',
            data: {
                linkType: 'GETPAGES',
                accessToken: req.body.accessToken
            }
        });

        if (responseGetPageList.data.success) {
            return res.json({
                success: true,
                pageData: responseGetPageList.data.pageData
            });
        }
        else {
            return res.status(500).json({
                success: false,
                msg: responseGetPageList.data.operationMessage
            });
        }
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            msg: error
        });
    }
}

exports.GetLongToken = async (req, res) => {
    try {
        const responseGetLongToken = await axios({
            url: `${URLBRIDGE}processlaraigo/facebook/managefacebooklink`,
            method: 'post',
            data: {
                linkType: 'GENERATELONGTOKEN',
                accessToken: req.body.accessToken,
                appId: req.body.appId
            }
        });

        if (responseGetLongToken.data.success) {
            return res.json({
                success: true,
                longToken: responseGetLongToken.data.longToken
            });
        }
        else {
            return res.status(500).json({
                success: false,
                msg: responseGetLongToken.data.operationMessage
            });
        }
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            msg: error
        });
    }
}

exports.InsertChannel = async (req, res) => {
    try {
        var { parameters = {}, method } = req.body;
        var businessId = '';

        setSessionParameters(parameters, req.user);

        parameters.corpid = req.user.corpid;
        parameters.orgid = req.user.orgid;
        parameters.username = req.user.usr;

        parameters.motive = 'Insert channel';
        parameters.operation = 'INSERT';
        parameters.status = 'ACTIVO';

        parameters.communicationchannelcontact = '';

        parameters.communicationchanneltoken = null;
        parameters.botconfigurationid = null;
        parameters.channelparameters = null;
        parameters.appintegrationid = null;
        parameters.resolvelithium = null;
        parameters.updintegration = null;
        parameters.botenabled = null;
        parameters.customicon = null;
        parameters.coloricon = null;
        parameters.schedule = null;
        parameters.country = null;

        if (req.body.type === 'INSTAGRAM') {
            const responseGetBusiness = await axios({
                url: `${URLBRIDGE}processlaraigo/facebook/managefacebooklink`,
                method: 'post',
                data: {
                    linkType: 'GETBUSINESS',
                    accessToken: req.body.service.accesstoken,
                    siteId: req.body.service.siteid
                }
            });

            if (responseGetBusiness.data.success) {
                businessId = responseGetBusiness.data.businessId;
            }
            else {
                return res.status(500).json({
                    success: false,
                    msg: 'No Instagram business found'
                });
            }
        }

        switch (req.body.type) {
            case 'FACEBOOK':
            case 'INSTAGRAM':
            case 'MESSENGER':
                const responseGetLongToken = await axios({
                    url: `${URLBRIDGE}processlaraigo/facebook/managefacebooklink`,
                    method: 'post',
                    data: {
                        linkType: 'GENERATELONGTOKEN',
                        accessToken: req.body.service.accesstoken,
                        appId: req.body.service.appid
                    }
                });

                if (responseGetLongToken.data.success) {
                    var longToken = responseGetLongToken.data.longToken;
                    var channelService = null;
                    var channelType = null;
                    var serviceType = null;

                    switch (req.body.type) {
                        case 'FACEBOOK':
                            channelService = 'WALLADD';
                            channelType = 'FBWA';
                            serviceType = 'WALL';
                            break;

                        case 'INSTAGRAM':
                            channelService = 'INSTAGRAMADD';
                            channelType = 'INST';
                            serviceType = 'INSTAGRAM';
                            break;

                        case 'MESSENGER':
                            channelService = 'MESSENGERADD';
                            channelType = 'FBDM';
                            serviceType = 'MESSENGER';
                            break;
                    }

                    const responseChannelAdd = await axios({
                        url: `${URLBRIDGE}processlaraigo/facebook/managefacebooklink`,
                        method: 'post',
                        data: {
                            linkType: channelService,
                            accessToken: longToken,
                            siteId: req.body.service.siteid
                        }
                    });

                    if (responseChannelAdd.data.success) {
                        var servicecredentials = {
                            accessToken: longToken,
                            endpoint: FACEBOOKAPI,
                            serviceType: serviceType,
                            siteId: req.body.service.siteid
                        };

                        if (businessId !== '') {
                            parameters.communicationchannelsite = businessId;
                            parameters.communicationchannelowner = req.body.service.siteid;

                            servicecredentials.siteId = businessId;
                        }

                        parameters.servicecredentials = JSON.stringify(servicecredentials);
                        parameters.type = channelType;

                        const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                        if (resx instanceof Array) {
                            return res.json({
                                success: true
                            });
                        }
                        else {
                            return res.status(500).json({
                                success: false,
                                msg: resx.msg
                            });
                        }
                    }
                    else {
                        return res.status(500).json({
                            success: false,
                            msg: responseChannelAdd.data.operationMessage
                        });
                    }
                }
                else {
                    return res.status(500).json({
                        success: false,
                        msg: responseGetLongToken.data.operationMessage
                    });
                }
                break;

            case 'WHATSAPP':
                const responseWhatsAppAdd = await axios({
                    url: `${URLBRIDGE}processlaraigo/whatsapp/managewhatsapplink`,
                    method: 'post',
                    data: {
                        linkType: 'WHATSAPPADD',
                        accessToken: req.body.service.accesstoken,
                        siteId: req.body.service.siteid
                    }
                });

                if (responseWhatsAppAdd.data.success) {
                    const servicecredentials = {
                        apiKey: req.body.service.accesstoken,
                        endpoint: WHATSAPPAPI,
                        number: req.body.service.siteid
                    };

                    parameters.servicecredentials = JSON.stringify(servicecredentials);
                    parameters.type = 'WHAD';

                    const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (resx instanceof Array) {
                        return res.json({
                            success: true
                        });
                    }
                    else {
                        return res.status(500).json({
                            success: false,
                            msg: resx.msg
                        });
                    }
                }
                else {
                    return res.status(500).json({
                        success: false,
                        msg: responseWhatsAppAdd.data.operationMessage
                    });
                }
                break;

            case 'TELEGRAM':
                const responseTelegramAdd = await axios({
                    url: `${URLBRIDGE}processlaraigo/telegram/managetelegramlink`,
                    method: 'post',
                    data: {
                        linkType: 'TELEGRAMADD',
                        accessToken: req.body.service.accesstoken,
                        siteId: req.body.service.siteid
                    }
                });

                if (responseTelegramAdd.data.success) {
                    const servicecredentials = {
                        bot: req.body.service.siteid,
                        endpoint: TELEGRAMAPI,
                        token: req.body.service.accesstoken
                    };

                    parameters.servicecredentials = JSON.stringify(servicecredentials);
                    parameters.type = 'TELE';

                    const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (resx instanceof Array) {
                        return res.json({
                            success: true
                        });
                    }
                    else {
                        return res.status(500).json({
                            success: false,
                            msg: resx.msg
                        });
                    }
                }
                else {
                    return res.status(500).json({
                        success: false,
                        msg: responseTelegramAdd.data.operationMessage
                    });
                }
                break;

            case 'TWITTER':
            case 'TWITTERDM':
                const servicecredentialstwitter = {
                    accessSecret: req.body.service.accesssecret,
                    accessToken: req.body.service.accesstoken,
                    consumerKey: req.body.service.consumerkey,
                    consumerSecret: req.body.service.consumersecret,
                    twitterPageId: req.body.service.siteid,
                    devEnvironment: req.body.service.devenvironment
                };

                var twitterMethod = 'UFN_COMMUNICATIONCHANNELHOOK_INS';
                var twitterData = {
                    type: 'TWTR',
                    servicedata: JSON.stringify(servicecredentialstwitter),
                    site: req.body.service.siteid,
                    operation: 'INSERT'
                };

                const resx = await triggerfunctions.executesimpletransaction(twitterMethod, twitterData);

                if (resx instanceof Array) {
                    const responseTwitterAdd = await axios({
                        url: `${URLBRIDGE}processlaraigo/twitter/managetwitterlink`,
                        method: 'post',
                        data: {
                            linkType: 'TWITTERADD',
                            siteId: req.body.service.siteid,
                            developmentEnvironment: servicecredentialstwitter.devEnvironment,
                            consumerSecret: servicecredentialstwitter.consumerSecret,
                            consumerKey: servicecredentialstwitter.consumerKey,
                            accessToken: servicecredentialstwitter.accessToken,
                            accessSecret: servicecredentialstwitter.accessSecret
                        }
                    });

                    if (responseTwitterAdd.data.success) {
                        if (req.body.type === 'TWITTER') {
                            parameters.type = 'TWIT';
                        }
                        else {
                            parameters.type = 'TWMS';
                        }

                        parameters.servicecredentials = JSON.stringify(servicecredentialstwitter);

                        const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                        if (resx instanceof Array) {
                            return res.json({
                                success: true
                            });
                        }
                        else {
                            twitterData.operation = 'DELETE';

                            await triggerfunctions.executesimpletransaction(twitterMethod, twitterData);

                            return res.status(500).json({
                                success: false,
                                msg: resx.msg
                            });
                        }
                    }
                    else {
                        twitterData.operation = 'DELETE';

                        await triggerfunctions.executesimpletransaction(twitterMethod, twitterData);

                        return res.status(500).json({
                            success: false,
                            msg: responseTwitterAdd.data.operationMessage
                        });
                    }
                }
                else {
                    return res.status(500).json({
                        success: false,
                        msg: resx.msg
                    });
                }
                break;

            case 'CHATWEB':
                const datatmp = {
                    webhook: `${URLHOOK}chatweb/webhookasync`,
                    applicationname: 'LARAIGO',
                    integrationkey: '',
                    name: req.body.parameters.description,
                    status: 'ACTIVO',
                    form: '',
                    color: JSON.stringify({
                        chatHeaderColor: req.body.service.color ? req.body.service.color.header : "",
                        chatBackgroundColor: req.body.service.color ? req.body.service.color.background : "",
                        chatBorderColor: req.body.service.color ? req.body.service.color.border : "",
                        messageClientColor: req.body.service.color ? req.body.service.color.client : "",
                        messageBotColor: req.body.service.color ? req.body.service.color.bot : "",
                    }),
                    icons: JSON.stringify({
                        chatOpenImage: req.body.service.interface.iconbutton,
                        chatHeaderImage: req.body.service.interface.iconheader,
                        chatBotImage: req.body.service.interface.iconbot,
                        chatIdleImage: req.body.service.bubble.iconbubble
                    }),
                    other: JSON.stringify({
                        abandonendpoint: `${URLABANDON}smooch`,
                        jsscript: req.body.service.extra ? req.body.service.extra.customjs : "",
                        headermessage: req.body.service.extra ? req.body.service.extra.botnametext : "",
                        cssbody: req.body.service.extra ? req.body.service.extra.customcss : "",
                        enableidlemessage: req.body.service.bubble ? req.body.service.bubble.active : false,
                        uploadfile: req.body.service.extra ? req.body.service.extra.uploadfile : false,
                        uploadvideo: req.body.service.extra ? req.body.service.extra.uploadvideo : false,
                        uploadlocation: req.body.service.extra ? req.body.service.extra.uploadlocation : false,
                        uploadimage: req.body.service.extra ? req.body.service.extra.uploadimage : false,
                        uploadaudio: req.body.service.extra ? req.body.service.extra.uploadaudio : false,
                        showchatrestart: req.body.service.extra ? req.body.service.extra.reloadchat : false,
                        showplatformlogo: req.body.service.extra ? req.body.service.extra.poweredby : false,
                        inputalwaysactive: req.body.service.extra ? req.body.service.extra.persistentinput : false,
                        enableabandon: req.body.service.extra ? req.body.service.extra.abandonevent : false,
                        playalertsound: req.body.service.extra ? req.body.service.extra.alertsound : false,
                        enableformhistory: req.body.service.extra ? req.body.service.extra.formhistory : false,
                        sendmetadata: req.body.service.extra ? req.body.service.extra.enablemetadata : false,
                        showmessageheader: req.body.service.extra ? req.body.service.extra.botnameenabled : false,
                    }),
                    personalization: JSON.stringify({
                        headerTitle: req.body.service.interface ? req.body.service.interface.chattitle : "",
                        headerSubTitle: req.body.service.interface ? req.body.service.interface.chatsubtitle : "",
                        idleMessage: req.body.service.bubble ? req.body.service.bubble.messagebubble : "",
                    })
                }

                const responseChatWebSave = await axios({
                    url: `http://52.116.128.51:5065/api/integration/integrationzyxme`,
                    method: 'post',
                    data: datatmp
                });

                if (!responseChatWebSave.data || !responseChatWebSave.data instanceof Object)
                    return res.status(500).json({ msg: "Hubo un problema, vuelva a intentarlo" });
                
                const integrationId = responseChatWebSave.data.integrationkey;
                    
                const integrationApiKey = responseChatWebSave.data.pluginapikey;
                const integrationKeyId = responseChatWebSave.data.pluginid; //check

                const webhookId = responseChatWebSave.data.webhookid;


                parameters.communicationchannelcontact = integrationKeyId;
                parameters.communicationchannelsite = integrationId;
                parameters.communicationchannelowner = webhookId;

                parameters.appintegrationid = chatwebApplicationId || 53;
                parameters.integrationid = integrationId;

                parameters.apikey = integrationApiKey;

                parameters.servicecredentials = '';
                parameters.type = 'CHAZ';
                
                parameters.channelparameters = JSON.stringify(datatmp);
                const xxaa = await triggerfunctions.executesimpletransaction(method, parameters);
                if (xxaa instanceof Array) {
                    return res.json({
                        integrationid: integrationId,
                        success: true
                    });
                }
                else {
                    return res.status(500).json({
                        success: false,
                        msg: resx.msg
                    });
                }
                break;

            default:
                return res.status(500).json({
                    success: false,
                    msg: 'Undefined'
                });
                break;
        }
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            msg: error
        });
    }
}

exports.DeleteChannel = async (req, res) => {
    try {
        var { parameters = {}, method } = req.body;

        setSessionParameters(parameters, req.user);

        parameters.corpid = req.user.corpid;
        parameters.orgid = req.user.orgid;
        parameters.username = req.user.usr;

        parameters.motive = 'Delete channel';
        parameters.operation = 'DELETE';
        parameters.status = 'ELIMINADO';

        parameters.updintegration = null;

        switch (req.body.parameters.type) {
            case 'FBDM':
                if (typeof req.body.parameters.servicecredentials !== 'undefined' && req.body.parameters.servicecredentials) {
                    var serviceData = JSON.parse(req.body.parameters.servicecredentials);

                    const responseChannelRemoveFBDM = await axios({
                        url: `${URLBRIDGE}processlaraigo/facebook/managefacebooklink`,
                        method: 'post',
                        data: {
                            linkType: 'MESSENGERREMOVE',
                            accessToken: serviceData.accessToken,
                            siteId: serviceData.siteId
                        }
                    });

                    if (responseChannelRemoveFBDM.data.success) {
                        const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                        if (resx instanceof Array) {
                            return res.json({
                                success: true
                            });
                        }
                        else {
                            return res.status(500).json({
                                success: false,
                                msg: resx.msg
                            });
                        }
                    }
                    else {
                        return res.status(500).json({
                            success: false,
                            msg: responseChannelRemoveFBDM.data.operationMessage
                        });
                    }
                }
                else {
                    const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (resx instanceof Array) {
                        return res.json({
                            success: true
                        });
                    }
                    else {
                        return res.status(500).json({
                            success: false,
                            msg: resx.msg
                        });
                    }
                }
                break;

            case 'FBWA':
                if (typeof req.body.parameters.servicecredentials !== 'undefined' && req.body.parameters.servicecredentials) {
                    var serviceData = JSON.parse(req.body.parameters.servicecredentials);

                    const responseChannelRemoveFBWA = await axios({
                        url: `${URLBRIDGE}processlaraigo/facebook/managefacebooklink`,
                        method: 'post',
                        data: {
                            linkType: 'WALLREMOVE',
                            accessToken: serviceData.accessToken,
                            siteId: serviceData.siteId
                        }
                    });

                    if (responseChannelRemoveFBWA.data.success) {
                        const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                        if (resx instanceof Array) {
                            return res.json({
                                success: true
                            });
                        }
                        else {
                            return res.status(500).json({
                                success: false,
                                msg: resx.msg
                            });
                        }
                    }
                    else {
                        return res.status(500).json({
                            success: false,
                            msg: responseChannelRemoveFBWA.data.operationMessage
                        });
                    }
                }
                else {
                    const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (resx instanceof Array) {
                        return res.json({
                            success: true
                        });
                    }
                    else {
                        return res.status(500).json({
                            success: false,
                            msg: resx.msg
                        });
                    }
                }
                break;

            case 'INST':
                if (typeof req.body.parameters.servicecredentials !== 'undefined' && req.body.parameters.servicecredentials) {
                    var serviceData = JSON.parse(req.body.parameters.servicecredentials);

                    const responseChannelRemoveINST = await axios({
                        url: `${URLBRIDGE}processlaraigo/facebook/managefacebooklink`,
                        method: 'post',
                        data: {
                            linkType: 'INSTAGRAMREMOVE',
                            accessToken: serviceData.accessToken,
                            siteId: parameters.communicationchannelowner
                        }
                    });

                    if (responseChannelRemoveINST.data.success) {
                        const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                        if (resx instanceof Array) {
                            return res.json({
                                success: true
                            });
                        }
                        else {
                            return res.status(500).json({
                                success: false,
                                msg: resx.msg
                            });
                        }
                    }
                    else {
                        return res.status(500).json({
                            success: false,
                            msg: responseChannelRemoveINST.data.operationMessage
                        });
                    }
                }
                else {
                    const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (resx instanceof Array) {
                        return res.json({
                            success: true
                        });
                    }
                    else {
                        return res.status(500).json({
                            success: false,
                            msg: resx.msg
                        });
                    }
                }
                break;

            case 'WHAD':
                if (typeof req.body.parameters.servicecredentials !== 'undefined' && req.body.parameters.servicecredentials) {
                    var serviceData = JSON.parse(req.body.parameters.servicecredentials);

                    const responseChannelRemoveWHAD = await axios({
                        url: `${URLBRIDGE}processlaraigo/whatsapp/managewhatsapplink`,
                        method: 'post',
                        data: {
                            linkType: 'WHATSAPPREMOVE',
                            accessToken: serviceData.apiKey,
                            siteId: serviceData.number
                        }
                    });

                    if (responseChannelRemoveWHAD.data.success) {
                        const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                        if (resx instanceof Array) {
                            return res.json({
                                success: true
                            });
                        }
                        else {
                            return res.status(500).json({
                                success: false,
                                msg: resx.msg
                            });
                        }
                    }
                    else {
                        return res.status(500).json({
                            success: false,
                            msg: responseChannelRemoveWHAD.data.operationMessage
                        });
                    }
                }
                else {
                    const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (resx instanceof Array) {
                        return res.json({
                            success: true
                        });
                    }
                    else {
                        return res.status(500).json({
                            success: false,
                            msg: resx.msg
                        });
                    }
                }
                break;

            case 'TELE':
                if (typeof req.body.parameters.servicecredentials !== 'undefined' && req.body.parameters.servicecredentials) {
                    var serviceData = JSON.parse(req.body.parameters.servicecredentials);

                    const responseChannelRemoveTELE = await axios({
                        url: `${URLBRIDGE}processlaraigo/telegram/managetelegramlink`,
                        method: 'post',
                        data: {
                            linkType: 'TELEGRAMREMOVE',
                            accessToken: serviceData.token,
                            siteId: serviceData.bot
                        }
                    });

                    if (responseChannelRemoveTELE.data.success) {
                        const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                        if (resx instanceof Array) {
                            return res.json({
                                success: true
                            });
                        }
                        else {
                            return res.status(500).json({
                                success: false,
                                msg: resx.msg
                            });
                        }
                    }
                    else {
                        return res.status(500).json({
                            success: false,
                            msg: responseChannelRemoveTELE.data.operationMessage
                        });
                    }
                }
                else {
                    const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (resx instanceof Array) {
                        return res.json({
                            success: true
                        });
                    }
                    else {
                        return res.status(500).json({
                            success: false,
                            msg: resx.msg
                        });
                    }
                }
                break;

            case 'TWIT':
            case 'TWMS':
                if (typeof req.body.parameters.servicecredentials !== 'undefined' && req.body.parameters.servicecredentials) {
                    var serviceData = JSON.parse(req.body.parameters.servicecredentials);

                    var methodremove = 'UFN_COMMUNICATIONCHANNELSITE_SEL';
                    var dataremove = {
                        communicationchannelsite: serviceData.twitterPageId,
                        type: ''
                    };

                    if (req.body.parameters.type === 'TWIT') {
                        dataremove.type = 'TWMS';
                    }
                    else {
                        dataremove.type = 'TWIT';
                    }

                    const rest = await triggerfunctions.executesimpletransaction(methodremove, dataremove);

                    if (rest instanceof Array) {
                        if (rest.length > 0) {
                            const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                            if (resx instanceof Array) {
                                return res.json({
                                    success: true
                                });
                            }
                            else {
                                return res.status(500).json({
                                    success: false,
                                    msg: resx.msg
                                });
                            }
                        }
                        else {
                            const responseChannelRemoveTWMS = await axios({
                                url: `${URLBRIDGE}processlaraigo/twitter/managetwitterlink`,
                                method: 'post',
                                data: {
                                    linkType: 'TWITTERREMOVE',
                                    siteId: serviceData.twitterPageId,
                                    developmentEnvironment: serviceData.devEnvironment,
                                    consumerSecret: serviceData.consumerSecret,
                                    consumerKey: serviceData.consumerKey,
                                    accessToken: serviceData.accessToken,
                                    accessSecret: serviceData.accessSecret
                                }
                            });

                            if (responseChannelRemoveTWMS.data.success) {
                                const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                                if (resx instanceof Array) {
                                    var twitterMethod = 'UFN_COMMUNICATIONCHANNELHOOK_INS';
                                    var twitterData = {
                                        type: 'TWTR',
                                        site: serviceData.twitterPageId,
                                        operation: 'DELETE'
                                    };

                                    await triggerfunctions.executesimpletransaction(twitterMethod, twitterData);

                                    return res.json({
                                        success: true
                                    });
                                }
                                else {
                                    return res.status(500).json({
                                        success: false,
                                        msg: resx.msg
                                    });
                                }
                            }
                            else {
                                return res.status(500).json({
                                    success: false,
                                    msg: responseChannelRemoveTWMS.data.operationMessage
                                });
                            }
                        }
                    }
                    else {
                        return res.status(500).json({
                            success: false,
                            msg: rest.msg
                        });
                    }
                }
                else {
                    const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (resx instanceof Array) {
                        return res.json({
                            success: true
                        });
                    }
                    else {
                        return res.status(500).json({
                            success: false,
                            msg: resx.msg
                        });
                    }
                }
                break;

            case 'CHAZ':
                if (typeof req.body.parameters.communicationchannelcontact !== 'undefined' && req.body.parameters.communicationchannelcontact) {
                    await axios({
                        url: `${URLBROKER}plugins/update/${req.body.parameters.communicationchannelcontact}`,
                        method: 'put',
                        data: {
                            status: 'ELIMINADO'
                        }
                    });
                }

                if (typeof req.body.parameters.communicationchannelowner !== 'undefined' && req.body.parameters.communicationchannelowner) {
                    await axios({
                        url: `${URLBROKER}webhooks/update/${req.body.parameters.communicationchannelowner}`,
                        method: 'put',
                        data: {
                            status: 'ELIMINADO'
                        }
                    });
                }

                if (typeof req.body.parameters.integrationid !== 'undefined' && req.body.parameters.integrationid) {
                    await axios({
                        url: `${URLBROKER}integrations/update/${req.body.parameters.integrationid}`,
                        method: 'put',
                        data: {
                            status: 'ELIMINADO'
                        }
                    });
                }

                const responseChatweb = await triggerfunctions.executesimpletransaction(method, parameters);

                if (responseChatweb instanceof Array) {
                    return res.json({
                        success: true
                    });
                }
                else {
                    return res.status(500).json({
                        success: false,
                        msg: responseChatweb.msg
                    });
                }

            default:
                const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                if (resx instanceof Array) {
                    return res.json({
                        success: true
                    });
                }
                else {
                    return res.status(500).json({
                        success: false,
                        msg: resx.msg
                    });
                }
        }
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            msg: error
        });
    }
}