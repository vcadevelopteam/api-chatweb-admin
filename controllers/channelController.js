const triggerfunctions = require('../config/triggerfunctions');
const axios = require('axios');

const URLBRIDGE = "https://zyxmedev.com/zyxme/bridge/";

exports.GetChannelService = async (req, res) => {
    try {
        var method = null;
        var data = null;

        if (req.body.siteType === 'SMCH') {
            method = 'UFN_COMMUNICATIONCHANNELSITE_SMOOCH_SEL';
            data = {
                communicationchannelsite:  req.body.siteId
            };
        }
        else {
            method = 'UFN_COMMUNICATIONCHANNELSITE_SEL';
            data = {
                communicationchannelsite:  req.body.siteId,
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
                        var { parameters = {}, method } = req.body;

                        const servicecredentials = {
                            accessToken: longToken,
                            endpoint: 'https://graph.facebook.com/v8.0/',
                            serviceType: serviceType,
                            siteId: req.body.service.siteid
                        };

                        parameters.servicecredentials = JSON.stringify(servicecredentials);
                        parameters.type = channelType;
                        parameters.motive = "Insert channel";
                        parameters.operation = "INSERT";
                        parameters.status = "ACTIVO";

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
                const responseChannelAdd = await axios({
                    url: `${URLBRIDGE}api/processlaraigo/whatsapp/managewhatsapplink`,
                    method: 'post',
                    data: {
                        linkType: 'WHATSAPPADD',
                        accessToken: req.body.service.accesstoken,
                        siteId: req.body.service.siteid
                    }
                });

                if (responseChannelAdd.data.success) {
                    var { parameters = {}, method } = req.body;

                    const servicecredentials = {
                        apiKey: req.body.service.accesstoken,
                        endpoint: 'https://waba.360dialog.io/v1/',
                        number: req.body.service.siteid
                    };

                    parameters.servicecredentials = JSON.stringify(servicecredentials);
                    parameters.motive = "Insert channel";
                    parameters.operation = "INSERT";
                    parameters.status = "ACTIVO";
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
                        msg: responseChannelAdd.data.operationMessage
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
        switch (req.body.parameters.type) {
            case "FBDM":
                var serviceData = JSON.parse(req.body.parameters.servicecredentials);

                const responseChannelRemove = await axios({
                    url: `${URLBRIDGE}api/processlaraigo/facebook/managefacebooklink`,
                    method: 'post',
                    data: {
                        linkType: 'MESSENGERREMOVE',
                        accessToken: serviceData.accesstoken,
                        siteId: serviceData.siteid
                    }
                });

                if (responseChannelRemove.data.success) {
                    var { parameters = {}, method } = req.body;

                    parameters.motive = "Delete channel";
                    parameters.operation = "DELETE";
                    parameters.status = "ELIMINADO";

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
                        msg: responseChannelRemove.data.operationMessage
                    });
                }
                break;

            case "FBWA":
                var serviceData = JSON.parse(req.body.parameters.servicecredentials);

                const responseChannelRemove = await axios({
                    url: `${URLBRIDGE}api/processlaraigo/facebook/managefacebooklink`,
                    method: 'post',
                    data: {
                        linkType: 'WALLREMOVE',
                        accessToken: serviceData.accesstoken,
                        siteId: serviceData.siteid
                    }
                });

                if (responseChannelRemove.data.success) {
                     var { parameters = {}, method } = req.body;
                    
                    parameters.motive = "Delete channel";
                    parameters.operation = "DELETE";
                    parameters.status = "ELIMINADO";

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
                        msg: responseChannelRemove.data.operationMessage
                    });
                }
                break;

            case "INST":
                var serviceData = JSON.parse(req.body.parameters.servicecredentials);

                const responseChannelRemove = await axios({
                    url: `${URLBRIDGE}api/processlaraigo/facebook/managefacebooklink`,
                    method: 'post',
                    data: {
                        linkType: 'INSTAGRAMREMOVE',
                        accessToken: serviceData.accesstoken,
                        siteId: serviceData.siteid
                    }
                });

                if (responseChannelRemove.data.success) {
                    var { parameters = {}, method } = req.body;
                    
                    parameters.motive = "Delete channel";
                    parameters.operation = "DELETE";
                    parameters.status = "ELIMINADO";

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
                        msg: responseChannelRemove.data.operationMessage
                    });
                }
                break;

            case "WHAD":
                var serviceData = JSON.parse(req.body.parameters.servicecredentials);

                const responseChannelRemove = await axios({
                    url: `${URLBRIDGE}api/processlaraigo/whatsapp/managewhatsapplink`,
                    method: 'post',
                    data: {
                        linkType: 'WHATSAPPREMOVE',
                        accessToken: serviceData.apiKey,
                        siteId: serviceData.number
                    }
                });

                if (responseChannelRemove.data.success) {
                    var { parameters = {}, method } = req.body;
                    
                    parameters.motive = "Delete channel";
                    parameters.operation = "DELETE";
                    parameters.status = "ELIMINADO";

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
                        msg: responseChannelRemove.data.operationMessage
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