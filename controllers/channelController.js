const triggerfunctions = require('../config/triggerfunctions');
const axios = require('axios');
const { setSessionParameters } = require('../config/helpers');

const URLBRIDGE = "https://zyxmelinux.zyxmeapp.com/zyxme/bridge/";

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
                else
                {
                    return res.json({
                        success: false,
                        msg: 'Not found'
                    });
                }
            } else {
                return res.status(500).json({
                    success: false,
                    msg: resx.msg
                });
            }
        }
        else {
            method = 'UFN_COMMUNICATIONCHANNELHOOK_SEL';
            data = {
                site:  req.body.siteId,
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
                else
                {
                    return res.json({
                        success: false,
                        msg: 'Not found'
                    });
                }
            } else {
                return res.status(500).json({
                    success: false,
                    msg: resx.msg
                });
            }
        }
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
            res.status(500).json({
                success: false,
                msg: responseGetPageList.data.operationMessage
            });
        }
    }
    catch (error) {
        res.status(400).json({
            success: false,
            msg: error
        });
    }
}

exports.GetLongToken = async (req, res) => {
    try {
        const responseGetLongToken = await axios({
            url: `${URLBRIDGE}api/processlaraigo/facebook/managefacebooklink`,
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
            res.status(500).json({
                success: false,
                msg: responseGetLongToken.data.operationMessage
            });
        }
    }
    catch (error) {
        res.status(400).json({
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

        parameters.motive = "Insert channel";
        parameters.operation = "INSERT";
        parameters.status = "ACTIVO";

        parameters.communicationchannelcontact = "";
        parameters.communicationchanneltoken = null;
        parameters.customicon = null;
        parameters.coloricon = null;
        parameters.botenabled = null;
        parameters.botconfigurationid = null;
        parameters.schedule = null;
        parameters.appintegrationid = null;
        parameters.country = null;
        parameters.channelparameters = null;
        parameters.updintegration = null;
        parameters.resolvelithium = null;

        if (req.body.type === 'INSTAGRAM') {
            const responseGetBusiness = await axios({
                url: `${URLBRIDGE}api/processlaraigo/facebook/managefacebooklink`,
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
                res.status(500).json({
                    success: false,
                    msg: "No Instagram business found"
                });
            }
        }

        switch (req.body.type) {
            case "FACEBOOK":
            case "INSTAGRAM":
            case "MESSENGER":
                const responseGetLongToken = await axios({
                    url: `${URLBRIDGE}api/processlaraigo/facebook/managefacebooklink`,
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
                        case "FACEBOOK":
                            channelService = "WALLADD";
                            channelType = "FBWA";
                            serviceType = "WALL";
                            break;

                        case "INSTAGRAM":
                            channelService = "INSTAGRAMADD";
                            channelType = "INST";
                            serviceType = "INSTAGRAM";
                            break;

                        case "MESSENGER":
                            channelService = "MESSENGERADD";
                            channelType = "FBDM";
                            serviceType = "MESSENGER";
                            break;
                    }

                    const responseChannelAdd = await axios({
                        url: `${URLBRIDGE}api/processlaraigo/facebook/managefacebooklink`,
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
                            endpoint: 'https://graph.facebook.com/v8.0/',
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
                        } else {
                            return res.status(500).json({
                                success: false,
                                msg: resx.msg
                            });
                        }
                    }
                    else {
                        res.status(500).json({
                            success: false,
                            msg: responseChannelAdd.data.operationMessage
                        });
                    }
                }
                else {
                    res.status(500).json({
                        success: false,
                        msg: responseGetLongToken.data.operationMessage
                    });
                }
                break;

            case "WHATSAPP":
                const responseWhatsAppAdd = await axios({
                    url: `${URLBRIDGE}api/processlaraigo/whatsapp/managewhatsapplink`,
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
                        endpoint: 'https://waba.360dialog.io/v1/',
                        number: req.body.service.siteid
                    };

                    parameters.servicecredentials = JSON.stringify(servicecredentials);
                    parameters.type = "WHAD";

                    const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (resx instanceof Array) {
                        return res.json({
                            success: true
                        });
                    } else {
                        return res.status(500).json({
                            success: false,
                            msg: resx.msg
                        });
                    }
                }
                else {
                    res.status(500).json({
                        success: false,
                        msg: responseWhatsAppAdd.data.operationMessage
                    });
                }
                break;

            case "TELEGRAM":
                const responseTelegramAdd = await axios({
                    url: `${URLBRIDGE}api/processlaraigo/telegram/managetelegramlink`,
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
                        endpoint: 'https://api.telegram.org/bot',
                        token: req.body.service.accesstoken
                    };

                    parameters.servicecredentials = JSON.stringify(servicecredentials);
                    parameters.type = "TELE";

                    const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (resx instanceof Array) {
                        return res.json({
                            success: true
                        });
                    } else {
                        return res.status(500).json({
                            success: false,
                            msg: resx.msg
                        });
                    }
                }
                else {
                    res.status(500).json({
                        success: false,
                        msg: responseTelegramAdd.data.operationMessage
                    });
                }
                break;

            case "TWITTER":
            case "TWITTERDM":
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
                        url: `${URLBRIDGE}api/processlaraigo/twitter/managetwitterlink`,
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
                            parameters.type = "TWIT";
                        }
                        else {
                            parameters.type = "TWDM";
                        }

                        parameters.servicecredentials = JSON.stringify(servicecredentialstwitter);

                        const resx = await triggerfunctions.executesimpletransaction(method, parameters);
    
                        if (resx instanceof Array) {
                            return res.json({
                                success: true
                            });
                        } else {
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

                        res.status(500).json({
                            success: false,
                            msg: responseTwitterAdd.data.operationMessage
                        });
                    }
                } else {
                    return res.status(500).json({
                        success: false,
                        msg: resx.msg
                    });
                }
                break;

            default:
                res.status(500).json({
                    success: false,
                    msg: "undefined"
                });
                break;
        }
    }
    catch (error) {
        res.status(400).json({
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

        parameters.motive = "Delete channel";
        parameters.operation = "DELETE";
        parameters.status = "ELIMINADO";

        parameters.updintegration = null;

        switch (req.body.parameters.type) {
            case "FBDM":
                if (typeof req.body.parameters.servicecredentials !== 'undefined' && req.body.parameters.servicecredentials) {
                    var serviceData = JSON.parse(req.body.parameters.servicecredentials);

                    const responseChannelRemoveFBDM = await axios({
                        url: `${URLBRIDGE}api/processlaraigo/facebook/managefacebooklink`,
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
                        } else {
                            return res.status(500).json({
                                success: false,
                                msg: resx.msg
                            });
                        }
                    }
                    else {
                        res.status(500).json({
                            success: false,
                            msg: responseChannelRemoveFBDM.data.operationMessage
                        });
                    }
                }
                else
                {
                    const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (resx instanceof Array) {
                        return res.json({
                            success: true
                        });
                    } else {
                        return res.status(500).json({
                            success: false,
                            msg: resx.msg
                        });
                    }
                }
                break;

            case "FBWA":
                if (typeof req.body.parameters.servicecredentials !== 'undefined' && req.body.parameters.servicecredentials) {
                    var serviceData = JSON.parse(req.body.parameters.servicecredentials);

                    const responseChannelRemoveFBWA = await axios({
                        url: `${URLBRIDGE}api/processlaraigo/facebook/managefacebooklink`,
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
                        } else {
                            return res.status(500).json({
                                success: false,
                                msg: resx.msg
                            });
                        }
                    }
                    else {
                        res.status(500).json({
                            success: false,
                            msg: responseChannelRemoveFBWA.data.operationMessage
                        });
                    }
                }
                else
                {
                    const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (resx instanceof Array) {
                        return res.json({
                            success: true
                        });
                    } else {
                        return res.status(500).json({
                            success: false,
                            msg: resx.msg
                        });
                    }
                }
                break;

            case "INST":
                if (typeof req.body.parameters.servicecredentials !== 'undefined' && req.body.parameters.servicecredentials) {
                    var serviceData = JSON.parse(req.body.parameters.servicecredentials);

                    const responseChannelRemoveINST = await axios({
                        url: `${URLBRIDGE}api/processlaraigo/facebook/managefacebooklink`,
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
                        } else {
                            return res.status(500).json({
                                success: false,
                                msg: resx.msg
                            });
                        }
                    }
                    else {
                        res.status(500).json({
                            success: false,
                            msg: responseChannelRemoveINST.data.operationMessage
                        });
                    }
                }
                else
                {
                    const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (resx instanceof Array) {
                        return res.json({
                            success: true
                        });
                    } else {
                        return res.status(500).json({
                            success: false,
                            msg: resx.msg
                        });
                    }
                }
                break;

            case "WHAD":
                if (typeof req.body.parameters.servicecredentials !== 'undefined' && req.body.parameters.servicecredentials) {
                    var serviceData = JSON.parse(req.body.parameters.servicecredentials);

                    const responseChannelRemoveWHAD = await axios({
                        url: `${URLBRIDGE}api/processlaraigo/whatsapp/managewhatsapplink`,
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
                        } else {
                            return res.status(500).json({
                                success: false,
                                msg: resx.msg
                            });
                        }
                    }
                    else {
                        res.status(500).json({
                            success: false,
                            msg: responseChannelRemoveWHAD.data.operationMessage
                        });
                    }
                }
                else
                {
                    const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (resx instanceof Array) {
                        return res.json({
                            success: true
                        });
                    } else {
                        return res.status(500).json({
                            success: false,
                            msg: resx.msg
                        });
                    }
                }
                break;

            case "TELE":
                if (typeof req.body.parameters.servicecredentials !== 'undefined' && req.body.parameters.servicecredentials) {
                    var serviceData = JSON.parse(req.body.parameters.servicecredentials);

                    const responseChannelRemoveTELE = await axios({
                        url: `${URLBRIDGE}api/processlaraigo/telegram/managetelegramlink`,
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
                        } else {
                            return res.status(500).json({
                                success: false,
                                msg: resx.msg
                            });
                        }
                    }
                    else {
                        res.status(500).json({
                            success: false,
                            msg: responseChannelRemoveTELE.data.operationMessage
                        });
                    }
                }
                else
                {
                    const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (resx instanceof Array) {
                        return res.json({
                            success: true
                        });
                    } else {
                        return res.status(500).json({
                            success: false,
                            msg: resx.msg
                        });
                    }
                }
                break;

            case "TWIT":
            case "TWDM":
                if (typeof req.body.parameters.servicecredentials !== 'undefined' && req.body.parameters.servicecredentials) {
                    var methodremove = 'UFN_COMMUNICATIONCHANNELSITE_SEL';
                    var dataremove = {
                        communicationchannelsite: serviceData.twitterPageId,
                        type: ''
                    };

                    if (req.body.parameters.type === 'TWIT') {
                        dataremove.type = 'TWDM';
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
                            } else {
                                return res.status(500).json({
                                    success: false,
                                    msg: resx.msg
                                });
                            }
                        }
                        else
                        {
                            var serviceData = JSON.parse(req.body.parameters.servicecredentials);

                            const responseChannelRemoveTWDM = await axios({
                                url: `${URLBRIDGE}api/processlaraigo/twitter/managetwitterlink`,
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
                        
                            if (responseChannelRemoveTWDM.data.success) {
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
                                } else {
                                    return res.status(500).json({
                                        success: false,
                                        msg: resx.msg
                                    });
                                }
                            }
                            else {
                                res.status(500).json({
                                    success: false,
                                    msg: responseChannelRemoveTWDM.data.operationMessage
                                });
                            }
                        }
                    } else {
                        return res.status(500).json({
                            success: false,
                            msg: rest.msg
                        });
                    }
                }
                else
                {
                    const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (resx instanceof Array) {
                        return res.json({
                            success: true
                        });
                    } else {
                        return res.status(500).json({
                            success: false,
                            msg: resx.msg
                        });
                    }
                }
                break;

            default:
                const resx = await triggerfunctions.executesimpletransaction(method, parameters);

                if (resx instanceof Array) {
                    return res.json({
                        success: true
                    });
                } else {
                    return res.status(500).json({
                        success: false,
                        msg: resx.msg
                    });
                }
        }
    }
    catch (error) {
        res.status(400).json({
            success: false,
            msg: error
        });
    }
}