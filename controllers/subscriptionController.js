const triggerfunctions = require('../config/triggerfunctions');
const bcryptjs = require("bcryptjs");
const axios = require('axios');

const URLABANDON = 'https://zyxmelinux.zyxmeapp.com/zyxme/webchatscript/api/smooch';
const URLBRIDGE = 'https://zyxmelinux.zyxmeapp.com/zyxme/bridge/';
const URLHOOK = 'https://zyxmelinux.zyxmeapp.com/zyxme/hook/';
const URLBROKER = 'https://goo.zyxmeapp.com/';

const chatwebApplicationId = '53';

let integrationApiKey = '';
let integrationKeyId = '';
let integrationId = '';
var businessId = '';
let webhookId = '';

let chatwebBody = {};

var corpId = 0;
var orgId = 0;

exports.CreateSubscription = async (req, res) => {
    try {
        var { method, parameters = {}, channellist = [] } = req.body;

        if (channellist instanceof Array) {
            channellist.forEach(async (element) => {
                if (element) {
                    switch (element.type) {
                        case 'FACEBOOK':
                        case 'INSTAGRAM':
                        case 'MESSENGER':
                            if (element.type === 'INSTAGRAM') {
                                const responseGetBusiness = await axios({
                                    url: `${URLBRIDGE}api/processlaraigo/facebook/managefacebooklink`,
                                    method: 'post',
                                    data: {
                                        linkType: 'GETBUSINESS',
                                        accessToken: element.service.accesstoken,
                                        siteId: element.service.siteid
                                    }
                                });
                    
                                if (responseGetBusiness.data.success) {
                                    businessId = responseGetBusiness.data.businessId;
                                }
                                else {
                                    return res.status(500).json({
                                        msg: 'No Instagram business found',
                                        success: false
                                    });
                                }
                            }

                            const responseGetLongToken = await axios({
                                url: `${URLBRIDGE}api/processlaraigo/facebook/managefacebooklink`,
                                method: 'post',
                                data: {
                                    linkType: 'GENERATELONGTOKEN',
                                    accessToken: element.service.accesstoken,
                                    appId: element.service.appid
                                }
                            });

                            if (responseGetLongToken.data.success) {
                                element.service.accesstoken = responseGetLongToken.data.longToken;

                                var channelService = null;

                                switch (element.type) {
                                    case 'FACEBOOK':
                                        channelService = 'WALLADD';
                                        break;
            
                                    case 'INSTAGRAM':
                                        channelService = 'INSTAGRAMADD';
                                        break;
            
                                    case 'MESSENGER':
                                        channelService = 'MESSENGERADD';
                                        break;
                                }

                                const responseChannelAdd = await axios({
                                    url: `${URLBRIDGE}api/processlaraigo/facebook/managefacebooklink`,
                                    method: 'post',
                                    data: {
                                        accessToken: element.service.accesstoken,
                                        siteId: element.service.siteid,
                                        linkType: channelService
                                    }
                                });

                                if (!responseChannelAdd.data.success) {
                                    return res.status(500).json({
                                        msg: responseChannelAdd.data.operationMessage,
                                        success: false
                                    });
                                }
                            }
                            else {
                                return res.status(500).json({
                                    msg: responseGetLongToken.data.operationMessage,
                                    success: false
                                });
                            }
                            break;

                        case 'WHATSAPP':
                            const responseWhatsAppAdd = await axios({
                                url: `${URLBRIDGE}api/processlaraigo/whatsapp/managewhatsapplink`,
                                method: 'post',
                                data: {
                                    accessToken: element.service.accesstoken,
                                    siteId: element.service.siteid,
                                    linkType: 'WHATSAPPADD'
                                }
                            });

                            if (!responseWhatsAppAdd.data.success) {
                                return res.status(500).json({
                                    msg: responseWhatsAppAdd.data.operationMessage,
                                    success: false
                                });
                            }
                            break;

                        case 'TELEGRAM':
                            const responseTelegramAdd = await axios({
                                url: `${URLBRIDGE}api/processlaraigo/telegram/managetelegramlink`,
                                method: 'post',
                                data: {
                                    accessToken: element.service.accesstoken,
                                    siteId: element.service.siteid,
                                    linkType: 'TELEGRAMADD'
                                }
                            });

                            if (responseTelegramAdd.data.success) {
                                return res.status(500).json({
                                    msg: responseTelegramAdd.data.operationMessage,
                                    success: false
                                });
                            }
                            break;

                        case 'TWITTER':
                        case 'TWITTERDM':
                            var servicecredentialstwitter = {
                                accessSecret: element.service.accesssecret,
                                accessToken: element.service.accesstoken,
                                consumerKey: element.service.consumerkey,
                                consumerSecret: element.service.consumersecret,
                                twitterPageId: element.service.siteid,
                                devEnvironment: element.service.devenvironment
                            };

                            var twitterMethod = 'UFN_COMMUNICATIONCHANNELHOOK_INS';
                            var twitterData = {
                                servicedata: JSON.stringify(servicecredentialstwitter),
                                site: element.service.siteid,
                                operation: 'INSERT',
                                type: 'TWTR'
                            };

                            const responseTwitterService = await triggerfunctions.executesimpletransaction(twitterMethod, twitterData);

                            if (responseTwitterService instanceof Array) {
                                const responseTwitterAdd = await axios({
                                    url: `${URLBRIDGE}api/processlaraigo/twitter/managetwitterlink`,
                                    method: 'post',
                                    data: {
                                        developmentEnvironment: servicecredentialstwitter.devEnvironment,
                                        consumerSecret: servicecredentialstwitter.consumerSecret,
                                        accessSecret: servicecredentialstwitter.accessSecret,
                                        accessToken: servicecredentialstwitter.accessToken,
                                        consumerKey: servicecredentialstwitter.consumerKey,
                                        siteId: element.service.siteid,
                                        linkType: 'TWITTERADD'
                                    }
                                });

                                if (!responseTwitterAdd.data.success) {
                                    twitterData.operation = 'DELETE';

                                    await triggerfunctions.executesimpletransaction(twitterMethod, twitterData);

                                    return res.status(500).json({
                                        msg: responseTwitterAdd.data.operationMessage,
                                        success: false
                                    });
                                }
                            }
                            else {
                                return res.status(500).json({
                                    success: false,
                                    msg: responseTwitterService.msg
                                });
                            }
                            break;

                        case 'CHATWEB':
                            chatwebBody = {
                                applicationId: chatwebApplicationId,
                                name: element.parameters.description,
                                status: 'ACTIVO',
                                type: 'WEBM',
                                metadata: {
                                    color: {
                                        chatBackgroundColor: '',
                                        chatBorderColor: '',
                                        chatHeaderColor: '',
                                        messageBotColor: '',
                                        messageClientColor: ''
                                    },
                                    extra: {
                                        abandonendpoint: URLABANDON,
                                        cssbody: '',
                                        enableabandon: false,
                                        enableformhistory: false,
                                        enableidlemessage: false,
                                        headermessage: '',
                                        inputalwaysactive: false,
                                        jsscript: '',
                                        playalertsound: false,
                                        sendmetadata: false,
                                        showchatrestart: false,
                                        showmessageheader: false,
                                        showplatformlogo: false,
                                        uploadaudio: false,
                                        uploadfile: false,
                                        uploadimage: false,
                                        uploadlocation: false,
                                        uploadvideo: false
                                    },
                                    form: null,
                                    icons: {
                                        chatBotImage: '',
                                        chatHeaderImage: '',
                                        chatIdleImage: '',
                                        chatOpenImage: ''
                                    },
                                    personalization: {
                                        headerMessage: '',
                                        headerSubTitle: '',
                                        headerTitle: '',
                                        idleMessage: ''
                                    }
                                }
                            };

                            if (typeof element.service !== 'undefined' && element.service) {
                                if (typeof element.service.interface !== 'undefined' && element.service.interface) {
                                    if (typeof element.service.interface.chattitle !== 'undefined' && element.service.interface.chattitle) {
                                        chatwebBody.metadata.personalization.headerTitle = element.service.interface.chattitle;
                                    }
                                    if (typeof element.service.interface.chatsubtitle !== 'undefined' && element.service.interface.chatsubtitle) {
                                        chatwebBody.metadata.personalization.headerSubTitle = element.service.interface.chatsubtitle;
                                    }
                                    if (typeof element.service.interface.iconbutton !== 'undefined' && element.service.interface.iconbutton) {
                                        chatwebBody.metadata.icons.chatOpenImage = element.service.interface.iconbutton;
                                    }
                                    if (typeof element.service.interface.iconheader !== 'undefined' && element.service.interface.iconheader) {
                                        chatwebBody.metadata.icons.chatHeaderImage = element.service.interface.iconheader;
                                    }
                                    if (typeof element.service.interface.iconbot !== 'undefined' && element.service.interface.iconbot) {
                                        chatwebBody.metadata.icons.chatBotImage = element.service.interface.iconbot;
                                    }
                                }
                                if (typeof element.service.color !== 'undefined' && element.service.color) {
                                    if (typeof element.service.color.header !== 'undefined' && element.service.color.header) {
                                        chatwebBody.metadata.color.chatHeaderColor = element.service.color.header;
                                    }
                                    if (typeof element.service.color.background !== 'undefined' && element.service.color.background) {
                                        chatwebBody.metadata.color.chatBackgroundColor = element.service.color.background;
                                    }
                                    if (typeof element.service.color.border !== 'undefined' && element.service.color.border) {
                                        chatwebBody.metadata.color.chatBorderColor = element.service.color.border;
                                    }
                                    if (typeof element.service.color.client !== 'undefined' && element.service.color.client) {
                                        chatwebBody.metadata.color.messageClientColor = element.service.color.client;
                                    }
                                    if (typeof element.service.color.bot !== 'undefined' && element.service.color.bot) {
                                        chatwebBody.metadata.color.messageBotColor = element.service.color.bot;
                                    }
                                }
                                if (typeof element.service.form !== 'undefined' && element.service.form) {
                                    chatwebBody.metadata.form = element.service.form;
                                }
                                if (typeof element.service.bubble !== 'undefined' && element.service.bubble) {
                                    if (typeof element.service.bubble.active !== 'undefined') {
                                        chatwebBody.metadata.extra.enableidlemessage = element.service.bubble.active;
                                    }
                                    if (typeof element.service.bubble.iconbubble !== 'undefined' && element.service.bubble.iconbubble) {
                                        chatwebBody.metadata.icons.chatIdleImage = element.service.bubble.iconbubble;
                                    }
                                    if (typeof element.service.bubble.messagebubble !== 'undefined' && element.service.bubble.messagebubble) {
                                        chatwebBody.metadata.personalization.idleMessage = element.service.bubble.messagebubble;
                                    }
                                }
                                if (typeof element.service.extra !== 'undefined' && element.service.extra) {
                                    if (typeof element.service.extra.uploadfile !== 'undefined') {
                                        chatwebBody.metadata.extra.uploadfile = element.service.extra.uploadfile;
                                    }
                                    if (typeof element.service.extra.uploadvideo !== 'undefined') {
                                        chatwebBody.metadata.extra.uploadvideo = element.service.extra.uploadvideo;
                                    }
                                    if (typeof element.service.extra.uploadlocation !== 'undefined') {
                                        chatwebBody.metadata.extra.uploadlocation = element.service.extra.uploadlocation;
                                    }
                                    if (typeof element.service.extra.uploadimage !== 'undefined') {
                                        chatwebBody.metadata.extra.uploadimage = element.service.extra.uploadimage;
                                    }
                                    if (typeof element.service.extra.uploadaudio !== 'undefined') {
                                        chatwebBody.metadata.extra.uploadaudio = element.service.extra.uploadaudio;
                                    }
                                    if (typeof element.service.extra.reloadchat !== 'undefined') {
                                        chatwebBody.metadata.extra.showchatrestart = element.service.extra.reloadchat;
                                    }
                                    if (typeof element.service.extra.poweredby !== 'undefined') {
                                        chatwebBody.metadata.extra.showplatformlogo = element.service.extra.poweredby;
                                    }
                                    if (typeof element.service.extra.persistentinput !== 'undefined') {
                                        chatwebBody.metadata.extra.inputalwaysactive = element.service.extra.persistentinput;
                                    }
                                    if (typeof element.service.extra.abandonevent !== 'undefined') {
                                        chatwebBody.metadata.extra.enableabandon = element.service.extra.abandonevent;
                                    }
                                    if (typeof element.service.extra.alertsound !== 'undefined') {
                                        chatwebBody.metadata.extra.playalertsound = element.service.extra.alertsound;
                                    }
                                    if (typeof element.service.extra.formhistory !== 'undefined') {
                                        chatwebBody.metadata.extra.enableformhistory = element.service.extra.formhistory;
                                    }
                                    if (typeof element.service.extra.enablemetadata !== 'undefined') {
                                        chatwebBody.metadata.extra.sendmetadata = element.service.extra.enablemetadata;
                                    }
                                    if (typeof element.service.extra.customcss !== 'undefined' && element.service.extra.customcss) {
                                        chatwebBody.metadata.extra.cssbody = element.service.extra.customcss;
                                    }
                                    if (typeof element.service.extra.customjs !== 'undefined' && element.service.extra.customjs) {
                                        chatwebBody.metadata.extra.jsscript = element.service.extra.customjs;
                                    }
                                    if (typeof element.service.extra.botnameenabled !== 'undefined') {
                                        chatwebBody.metadata.extra.showmessageheader = element.service.extra.botnameenabled;
                                    }
                                    if (typeof element.service.extra.botnametext !== 'undefined' && element.service.extra.botnametext) {
                                        chatwebBody.metadata.extra.headermessage = element.service.extra.botnametext;
                                    }
                                }
                            }

                            const responseChatWebSave = await axios({
                                url: `${URLBROKER}api/integrations/save`,
                                method: 'post',
                                data: chatwebBody
                            });
            
                            integrationId = responseChatWebSave.data.id;

                            if (typeof integrationId !== 'undefined' && integrationId) {
                                const responseChatWebhookSave = await axios({
                                    url: `${URLBROKER}api/webhooks/save`,
                                    method: 'post',
                                    data: {
                                        name: element.parameters.description,
                                        description: element.parameters.description,
                                        integration: integrationId,
                                        webUrl: `${URLHOOK}api/chatweb/webhookasync`,
                                        status: 'ACTIVO'
                                    }
                                });

                                webhookId = responseChatWebhookSave.data.id;

                                const responseChatPluginSave = await axios({
                                    url: `${URLBROKER}api/plugins/save`,
                                    method: 'post',
                                    data: {
                                        name: element.parameters.description,
                                        integration: integrationId,
                                        status: 'ACTIVO'
                                    }
                                });
            
                                integrationApiKey = responseChatPluginSave.data.apiKey;
                                integrationKeyId = responseChatPluginSave.data.id;

                                if (typeof integrationApiKey !== 'undefined' && integrationApiKey) {
                                }
                                else {
                                    return res.status(500).json({
                                        success: false,
                                        msg: 'Error while creating plugin'
                                    });
                                }
                            }
                            else {
                                return res.status(500).json({
                                    msg: 'Error while creating integration',
                                    success: false
                                });
                            }
                            break;
                    }
                }
            });
        }

        const salt = await bcryptjs.genSalt(10);
        parameters.password = await bcryptjs.hash(parameters.password, salt);

        const responseSubscriptionCreate = await triggerfunctions.executesimpletransaction(method, parameters);

        if (responseSubscriptionCreate instanceof Array) {
            if (responseSubscriptionCreate.length > 0) {
                corpId = responseSubscriptionCreate[0].corpid;
                orgId = responseSubscriptionCreate[0].orgid;

                if (channellist instanceof Array) {
                    channellist.forEach(async (element) => {
                        if (element) {
                            var channelMethod = 'UFN_COMMUNICATIONCHANNEL_INS';
                            var channelParameters = element.parameters;

                            channelParameters.username = parameters.username;
                            channelParameters.corpid = corpId;
                            channelParameters.orgid = orgId;

                            channelParameters.motive = 'Insert channel';
                            channelParameters.operation = 'INSERT';
                            channelParameters.status = 'ACTIVO';
                    
                            channelParameters.communicationchannelcontact = '';
                    
                            channelParameters.communicationchanneltoken = null;
                            channelParameters.botconfigurationid = null;
                            channelParameters.channelparameters = null;
                            channelParameters.appintegrationid = null;
                            channelParameters.resolvelithium = null;
                            channelParameters.updintegration = null;
                            channelParameters.botenabled = null;
                            channelParameters.customicon = null;
                            channelParameters.coloricon = null;
                            channelParameters.schedule = null;
                            channelParameters.country = null;

                            switch (element.type) {
                                case 'FACEBOOK':
                                case 'INSTAGRAM':
                                case 'MESSENGER':
                                    var channelType = null;
                                    var serviceType = null;

                                    switch (element.type) {
                                        case 'FACEBOOK':
                                            channelType = 'FBWA';
                                            serviceType = 'WALL';
                                            break;
                
                                        case 'INSTAGRAM':
                                            channelType = 'INST';
                                            serviceType = 'INSTAGRAM';
                                            break;
                
                                        case 'MESSENGER':
                                            channelType = 'FBDM';
                                            serviceType = 'MESSENGER';
                                            break;
                                    }

                                    var servicecredentials = {
                                        accessToken: element.service.accesstoken,
                                        endpoint: 'https://graph.facebook.com/v8.0/',
                                        serviceType: serviceType,
                                        siteId: element.service.siteid
                                    };

                                    if (businessId !== '') {
                                        channelParameters.communicationchannelsite = businessId;
                                        channelParameters.communicationchannelowner = element.service.siteid;
            
                                        servicecredentials.siteId = businessId;
                                    }

                                    channelParameters.servicecredentials = JSON.stringify(servicecredentials);
                                    channelParameters.type = channelType;

                                    const responseFacebookChannel = await triggerfunctions.executesimpletransaction(channelMethod, channelParameters);

                                    if (responseFacebookChannel instanceof Array) {
                                    }
                                    else {
                                        return res.status(500).json({
                                            msg: responseFacebookChannel.msg,
                                            success: false
                                        });
                                    }
                                    break;
        
                                case 'WHATSAPP':
                                    var whatsappservicecredentials = {
                                        apiKey: element.service.accesstoken,
                                        endpoint: 'https://waba.360dialog.io/v1/',
                                        number: element.service.siteid
                                    };
                
                                    channelParameters.servicecredentials = JSON.stringify(whatsappservicecredentials);
                                    channelParameters.type = 'WHAD';
                
                                    const responseWhatsAppChannel = await triggerfunctions.executesimpletransaction(channelMethod, channelParameters);
                
                                    if (responseWhatsAppChannel instanceof Array) {
                                    }
                                    else {
                                        return res.status(500).json({
                                            msg: responseWhatsAppChannel.msg,
                                            success: false
                                        });
                                    }
                                    break;
        
                                case 'TELEGRAM':
                                    var telegramservicecredentials = {
                                        bot: element.service.siteid,
                                        endpoint: 'https://api.telegram.org/bot',
                                        token: element.service.accesstoken
                                    };
                
                                    channelParameters.servicecredentials = JSON.stringify(telegramservicecredentials);
                                    channelParameters.type = 'TELE';
                
                                    const responseTelegramChannel = await triggerfunctions.executesimpletransaction(channelMethod, channelParameters);
                
                                    if (responseTelegramChannel instanceof Array) {
                                    }
                                    else {
                                        return res.status(500).json({
                                            msg: responseTelegramChannel.msg,
                                            success: false
                                        });
                                    }
                                    break;
        
                                case 'TWITTER':
                                case 'TWITTERDM':
                                    var servicecredentialstwitter = {
                                        accessSecret: element.service.accesssecret,
                                        accessToken: element.service.accesstoken,
                                        consumerKey: element.service.consumerkey,
                                        consumerSecret: element.service.consumersecret,
                                        twitterPageId: element.service.siteid,
                                        devEnvironment: element.service.devenvironment
                                    };

                                    if (element.type === 'TWITTER') {
                                        channelParameters.type = 'TWIT';
                                    }
                                    else {
                                        channelParameters.type = 'TWMS';
                                    }

                                    channelParameters.servicecredentials = JSON.stringify(servicecredentialstwitter);

                                    const responseTwitterChannel = await triggerfunctions.executesimpletransaction(channelMethod, channelParameters);

                                    if (responseTwitterChannel instanceof Array) {
                                    }
                                    else {
                                        return res.status(500).json({
                                            msg: responseTwitterChannel.msg,
                                            success: false
                                        });
                                    }
                                    break;
        
                                case 'CHATWEB':
                                    channelParameters.communicationchannelcontact = integrationKeyId;
                                    channelParameters.communicationchannelsite = integrationId;
                                    channelParameters.communicationchannelowner = webhookId;

                                    channelParameters.appintegrationid = chatwebApplicationId;
                                    channelParameters.integrationid = integrationId;

                                    channelParameters.apikey = integrationApiKey;

                                    channelParameters.servicecredentials = '';
                                    channelParameters.type = 'CHAZ';

                                    channelParameters.channelparameters = JSON.stringify(chatwebBody);

                                    const responseChatWebChannel = await triggerfunctions.executesimpletransaction(channelMethod, channelParameters);

                                    if (responseChatWebChannel instanceof Array) {
                                    }
                                    else {
                                        return res.status(500).json({
                                            msg: responseChatWebChannel.msg,
                                            success: false
                                        });
                                    }
                                    break;
                            }
                        }
                    });
                }
            }
            else {
                return res.status(500).json({
                    msg: 'Not found',
                    success: false
                });
            }
        }
        else {
            return res.status(500).json({
                msg: responseSubscriptionCreate.msg,
                success: false
            });
        }

        return res.json({
            integrationid: integrationId,
            success: true
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            msg: error
        });
    }
}

exports.GetPageList = async (req, res) => {
    try {
        const responseGetPageList = await axios({
            url: `${URLBRIDGE}api/processlaraigo/facebook/managefacebooklink`,
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

exports.ValidateUsername = async (req, res) => {
    try {
        var { method, parameters = {} } = req.body;

        const responseUserSelect = await triggerfunctions.executesimpletransaction(method, parameters);

        if (responseUserSelect instanceof Array) {
            if (responseUserSelect.length > 0) {
                return res.status(200).json({
                    isvalid: true,
                    success: true
                });
            }
            else {
                return res.status(200).json({
                    isvalid: false,
                    success: true
                });
            }
        }
        else {
            return res.status(500).json({
                msg: responseUserSelect.msg,
                success: false
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