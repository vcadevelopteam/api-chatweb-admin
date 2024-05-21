const { axiosObservable, setSessionParameters } = require("../config/helpers");
const { getErrorCode } = require("../config/helpers");

const channelfunctions = require("../config/channelfunctions");
const jwt = require("jsonwebtoken");
const triggerfunctions = require("../config/triggerfunctions");

const ayrshareEndpoint = process.env.AYRSHARE;
const bridgeEndpoint = process.env.BRIDGE;
const brokerEndpoint = process.env.CHATBROKER;
const facebookEndpoint = process.env.FACEBOOKAPI;
const googleClientId = process.env.GOOGLE_CLIENTID;
const googleClientSecret = process.env.GOOGLE_CLIENTSECRET;
const googleTopicName = process.env.GOOGLE_TOPICNAME;
const hookEndpoint = process.env.HOOK;
const linkedinEndpoint = process.env.LINKEDIN;
const linkedinTokenEndpoint = process.env.LINKEDINTOKEN;
const metaEndpoint = process.env.METAAPI;
const smoochEndpoint = process.env.SMOOCHAPI;
const smoochVersion = process.env.SMOOCHVERSION;
const telegramEndpoint = process.env.TELEGRAMAPI;
const tikApiEndpoint = process.env.TIKAPI;
const webChatApplication = process.env.CHATAPPLICATION;
const webChatScriptEndpoint = process.env.WEBCHATSCRIPT;
const whatsAppCloudEndpoint = process.env.WHATSAPPCLOUDAPI;
const whatsAppEndpoint = process.env.WHATSAPPAPI;

exports.checkPaymentPlan = async (request, response) => {
    try {
        let { method, parameters } = request.body;

        setSessionParameters(parameters, request.user, request._requestid);

        const transactionCheckPaymentPlan = await triggerfunctions.executesimpletransaction(method, parameters);

        if (transactionCheckPaymentPlan instanceof Array) {
            if (transactionCheckPaymentPlan.length > 0) {
                let createChannel =
                    transactionCheckPaymentPlan[0].channelnumber < transactionCheckPaymentPlan[0].channelscontracted;

                return response.json({
                    createChannel: createChannel,
                    providerWhatsApp: transactionCheckPaymentPlan[0].providerwhatsapp,
                    success: true,
                });
            } else {
                return response.json({
                    createChannel: true,
                    providerWhatsApp: "DIALOG",
                    success: true,
                });
            }
        } else {
            return response.status(400).json({
                msg: transactionCheckPaymentPlan.code,
                success: false,
            });
        }
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            msg: exception.message,
        });
    }
};

exports.deleteChannel = async (request, response) => {
    try {
        let { method, parameters = {} } = request.body;

        setSessionParameters(parameters, request.user, request._requestid);

        parameters.corpid = request.user.corpid;
        parameters.motive = "Delete from API";
        parameters.operation = "DELETE";
        parameters.orgid = request.user.orgid;
        parameters.status = "ELIMINADO";
        parameters.updintegration = null;
        parameters.username = request.user.usr;

        switch (parameters.type) {
            case "ANDR":
            case "APPL":
                if (typeof parameters.servicecredentials !== "undefined" && parameters.servicecredentials) {
                    const requestDeleteSmooch = await axiosObservable({
                        _requestid: request._requestid,
                        method: "post",
                        url: `${bridgeEndpoint}processlaraigo/smooch/managesmoochlink`,
                        data: {
                            applicationId: parameters.communicationchannelsite,
                            integrationId: parameters.integrationid,
                            linkType: parameters.type === "ANDR" ? "ANDROIDREMOVE" : "IOSREMOVE",
                        },
                    });

                    if (requestDeleteSmooch.data.success) {
                        const transactionDeleteSmooch = await triggerfunctions.executesimpletransaction(
                            method,
                            parameters
                        );

                        if (transactionDeleteSmooch instanceof Array) {
                            await channelfunctions.clearHookCache("SmoochService", request._requestid);

                            return response.json({
                                success: true,
                            });
                        } else {
                            return response.status(400).json({
                                msg: transactionDeleteSmooch.code,
                                success: false,
                            });
                        }
                    } else {
                        return response.status(400).json({
                            msg: requestDeleteSmooch.data.operationMessage,
                            success: false,
                        });
                    }
                } else {
                    const transactionDeleteSmooch = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionDeleteSmooch instanceof Array) {
                        await channelfunctions.clearHookCache("SmoochService", request._requestid);

                        return response.json({
                            success: true,
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionDeleteSmooch.code,
                            success: false,
                        });
                    }
                }

            case "CHAZ":
                if (
                    typeof parameters.communicationchannelcontact !== "undefined" &&
                    parameters.communicationchannelcontact
                ) {
                    await axiosObservable({
                        _requestid: request._requestid,
                        method: "put",
                        url: `${brokerEndpoint}plugins/update/${parameters.communicationchannelcontact}`,
                        data: {
                            status: "ELIMINADO",
                        },
                    });
                }

                if (
                    typeof parameters.communicationchannelowner !== "undefined" &&
                    parameters.communicationchannelowner
                ) {
                    await axiosObservable({
                        _requestid: request._requestid,
                        method: "put",
                        url: `${brokerEndpoint}webhooks/update/${parameters.communicationchannelowner}`,
                        data: {
                            status: "ELIMINADO",
                        },
                    });
                }

                if (typeof parameters.integrationid !== "undefined" && parameters.integrationid) {
                    await axiosObservable({
                        _requestid: request._requestid,
                        method: "put",
                        url: `${brokerEndpoint}integrations/update/${parameters.integrationid}`,
                        data: {
                            status: "ELIMINADO",
                        },
                    });
                }

                const transactionDeleteChatWeb = await triggerfunctions.executesimpletransaction(method, parameters);

                if (transactionDeleteChatWeb instanceof Array) {
                    await channelfunctions.clearHookCache("ChatWebService", request._requestid);

                    return response.json({
                        success: true,
                    });
                } else {
                    return response.status(400).json({
                        msg: transactionDeleteChatWeb.code,
                        success: false,
                    });
                }

            case "FORM":
                if (typeof parameters.integrationid !== "undefined" && parameters.integrationid) {
                    await axiosObservable({
                        _requestid: request._requestid,
                        method: "put",
                        url: `${brokerEndpoint}integrations/update/${parameters.integrationid}`,
                        data: {
                            status: "ELIMINADO",
                        },
                    });
                }

                const transactionDeleteChatWeb1 = await triggerfunctions.executesimpletransaction(method, parameters);

                if (transactionDeleteChatWeb1 instanceof Array) {
                    await channelfunctions.clearHookCache("ChatWebService", request._requestid);

                    return response.json({
                        success: true,
                    });
                } else {
                    return response.status(400).json({
                        msg: transactionDeleteChatWeb1.code,
                        success: false,
                    });
                }

            case "FBLD":
            case "WORKPLACE":
                const deleteChannelWorkplace = await triggerfunctions.executesimpletransaction(method, parameters);

                if (deleteChannelWorkplace instanceof Array) {
                    await channelfunctions.clearHookCache("EveryService", request._requestid);

                    return response.json({
                        success: true,
                    });
                } else {
                    return response.status(400).json({
                        msg: deleteChannelWorkplace.code,
                        success: false,
                    });
                }

            case "FBDM":
            case "FBWA":
            case "INDM":
            case "INST":
                if (typeof parameters.servicecredentials !== "undefined" && parameters.servicecredentials) {
                    let serviceCredentials = JSON.parse(parameters.servicecredentials);
                    let linkType = "";

                    let DeleteIntegration = true;

                    if (parameters.type === "FBDM") {
                        linkType = "MESSENGERREMOVE";
                    }

                    if (parameters.type === "FBWA") {
                        linkType = "WALLREMOVE";
                    }

                    if (parameters.type === "INST" || parameters.type === "INDM") {
                        linkType = "INSTAGRAMREMOVE";
                    }

                    if (linkType === "INSTAGRAMREMOVE") {
                        let validateParameters = {
                            _requestid: request._requestid,
                            communicationchannelsite: serviceCredentials.siteId,
                            type: parameters.type === "INST" ? "INDM" : "INST",
                        };

                        const transactionValidateInstagram = await triggerfunctions.executesimpletransaction(
                            "UFN_COMMUNICATIONCHANNELSITE_SEL",
                            validateParameters
                        );

                        if (transactionValidateInstagram instanceof Array) {
                            if (transactionValidateInstagram.length > 0) {
                                DeleteIntegration = false;
                            }
                        } else {
                            return response.status(400).json({
                                msg: transactionValidateInstagram.code,
                                success: false,
                            });
                        }
                    }

                    if (DeleteIntegration) {
                        const requestDeleteFacebook = await axiosObservable({
                            _requestid: request._requestid,
                            method: "post",
                            url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`,
                            data: {
                                accessToken: serviceCredentials.accessToken,
                                linkType: linkType,
                                siteId:
                                    parameters.type === "INST" || parameters.type === "INDM"
                                        ? parameters.communicationchannelowner
                                        : serviceCredentials.siteId,
                            },
                        });

                        if (!requestDeleteFacebook.data.success) {
                            return response.status(400).json({
                                msg: requestDeleteFacebook.data.operationMessage,
                                success: false,
                            });
                        }
                    }

                    const transactionDeleteFacebook = await triggerfunctions.executesimpletransaction(
                        method,
                        parameters
                    );

                    if (transactionDeleteFacebook instanceof Array) {
                        await channelfunctions.clearHookCache("FacebookService", request._requestid);

                        return response.json({
                            success: true,
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionDeleteFacebook.code,
                            success: false,
                        });
                    }
                } else {
                    const transactionDeleteFacebook = await triggerfunctions.executesimpletransaction(
                        method,
                        parameters
                    );

                    if (transactionDeleteFacebook instanceof Array) {
                        await channelfunctions.clearHookCache("FacebookService", request._requestid);

                        return response.json({
                            success: true,
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionDeleteFacebook.code,
                            success: false,
                        });
                    }
                }

            case "INMS":
                if (typeof parameters.servicecredentials !== "undefined" && parameters.servicecredentials) {
                    let serviceCredentials = JSON.parse(parameters.servicecredentials);

                    const requestDeleteInstagramSmooch = await axiosObservable({
                        _requestid: request._requestid,
                        method: "post",
                        url: `${bridgeEndpoint}processlaraigo/smooch/managesmoochlink`,
                        data: {
                            apiKeyId: serviceCredentials.apiKeyId,
                            apiKeySecret: serviceCredentials.apiKeySecret,
                            applicationId: parameters.communicationchannelsite,
                            integrationId: parameters.integrationid,
                            linkType: "WEBHOOKREMOVE",
                        },
                    });

                    if (requestDeleteInstagramSmooch.data.success) {
                        const transactionDeleteInstagramSmooch = await triggerfunctions.executesimpletransaction(
                            method,
                            parameters
                        );

                        if (transactionDeleteInstagramSmooch instanceof Array) {
                            await channelfunctions.clearHookCache("SmoochService", request._requestid);

                            return response.json({
                                success: true,
                            });
                        } else {
                            return response.status(400).json({
                                msg: transactionDeleteInstagramSmooch.code,
                                success: false,
                            });
                        }
                    } else {
                        return response.status(400).json({
                            msg: requestDeleteInstagramSmooch.data.operationMessage,
                            success: false,
                        });
                    }
                } else {
                    const transactionDeleteInstagramSmooch = await triggerfunctions.executesimpletransaction(
                        method,
                        parameters
                    );

                    if (transactionDeleteInstagramSmooch instanceof Array) {
                        await channelfunctions.clearHookCache("SmoochService", request._requestid);

                        return response.json({
                            success: true,
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionDeleteInstagramSmooch.code,
                            success: false,
                        });
                    }
                }

            case "TELE":
                if (typeof parameters.servicecredentials !== "undefined" && parameters.servicecredentials) {
                    let serviceCredentials = JSON.parse(parameters.servicecredentials);

                    const requestDeleteTelegram = await axiosObservable({
                        _requestid: request._requestid,
                        method: "post",
                        url: `${bridgeEndpoint}processlaraigo/telegram/managetelegramlink`,
                        data: {
                            accessToken: serviceCredentials.token,
                            linkType: "TELEGRAMREMOVE",
                            siteId: serviceCredentials.bot,
                        },
                    });

                    if (requestDeleteTelegram.data.success) {
                        const transactionDeleteTelegram = await triggerfunctions.executesimpletransaction(
                            method,
                            parameters
                        );

                        if (transactionDeleteTelegram instanceof Array) {
                            await channelfunctions.clearHookCache("TelegramService", request._requestid);

                            return response.json({
                                success: true,
                            });
                        } else {
                            return response.status(400).json({
                                msg: transactionDeleteTelegram.code,
                                success: false,
                            });
                        }
                    } else {
                        return response.status(400).json({
                            msg: requestDeleteTelegram.data.operationMessage,
                            success: false,
                        });
                    }
                } else {
                    const transactionDeleteTelegram = await triggerfunctions.executesimpletransaction(
                        method,
                        parameters
                    );

                    if (transactionDeleteTelegram instanceof Array) {
                        await channelfunctions.clearHookCache("TelegramService", request._requestid);

                        return response.json({
                            success: true,
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionDeleteTelegram.code,
                            success: false,
                        });
                    }
                }

            case "WHAD":
                if (typeof parameters.servicecredentials !== "undefined" && parameters.servicecredentials) {
                    let serviceCredentials = JSON.parse(parameters.servicecredentials);

                    const requestDeleteWhatsApp = await axiosObservable({
                        _requestid: request._requestid,
                        method: "post",
                        url: `${bridgeEndpoint}processlaraigo/whatsapp/managewhatsapplink`,
                        data: {
                            accessToken: serviceCredentials.apiKey,
                            isCloud: !!serviceCredentials.isCloud,
                            linkType: "WHATSAPPREMOVE",
                            siteId: serviceCredentials.number,
                        },
                    });

                    if (requestDeleteWhatsApp.data.success) {
                        const transactionDeleteWhatsApp = await triggerfunctions.executesimpletransaction(
                            method,
                            parameters
                        );

                        if (transactionDeleteWhatsApp instanceof Array) {
                            await channelfunctions.clearHookCache("Dialog360Service", request._requestid);

                            return response.json({
                                success: true,
                            });
                        } else {
                            return response.status(400).json({
                                msg: transactionDeleteWhatsApp.code,
                                success: false,
                            });
                        }
                    } else {
                        return response.status(400).json({
                            msg: requestDeleteWhatsApp.data.operationMessage,
                            success: false,
                        });
                    }
                } else {
                    const transactionDeleteWhatsApp = await triggerfunctions.executesimpletransaction(
                        method,
                        parameters
                    );

                    if (transactionDeleteWhatsApp instanceof Array) {
                        await channelfunctions.clearHookCache("Dialog360Service", request._requestid);

                        return response.json({
                            success: true,
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionDeleteWhatsApp.code,
                            success: false,
                        });
                    }
                }

            case "WHAT":
                if (typeof parameters.servicecredentials !== "undefined" && parameters.servicecredentials) {
                    let serviceCredentials = JSON.parse(parameters.servicecredentials);

                    if (typeof serviceCredentials.apiKeyId !== "undefined" && serviceCredentials.apiKeyId) {
                        const requestDeleteWhatsAppSmooch = await axiosObservable({
                            _requestid: request._requestid,
                            method: "post",
                            url: `${bridgeEndpoint}processlaraigo/smooch/managesmoochlink`,
                            data: {
                                apiKeyId: serviceCredentials.apiKeyId,
                                apiKeySecret: serviceCredentials.apiKeySecret,
                                applicationId: parameters.communicationchannelsite,
                                integrationId: parameters.integrationid,
                                linkType: "WEBHOOKCLEAR",
                            },
                        });

                        if (requestDeleteWhatsAppSmooch.data.success) {
                            const transactionDeleteWhatsAppSmooch = await triggerfunctions.executesimpletransaction(
                                method,
                                parameters
                            );

                            if (transactionDeleteWhatsAppSmooch instanceof Array) {
                                await channelfunctions.clearHookCache("SmoochService", request._requestid);

                                return response.json({
                                    success: true,
                                });
                            } else {
                                return response.status(400).json({
                                    msg: transactionDeleteWhatsAppSmooch.code,
                                    success: false,
                                });
                            }
                        } else {
                            return response.status(400).json({
                                msg: requestDeleteWhatsAppSmooch.data.operationMessage,
                                success: false,
                            });
                        }
                    } else {
                        const transactionDeleteWhatsAppSmooch = await triggerfunctions.executesimpletransaction(
                            method,
                            parameters
                        );

                        if (transactionDeleteWhatsAppSmooch instanceof Array) {
                            await channelfunctions.clearHookCache("SmoochService", request._requestid);

                            return response.json({
                                success: true,
                            });
                        } else {
                            return response.status(400).json({
                                msg: transactionDeleteWhatsAppSmooch.code,
                                success: false,
                            });
                        }
                    }
                } else {
                    const transactionDeleteWhatsAppSmooch = await triggerfunctions.executesimpletransaction(
                        method,
                        parameters
                    );

                    if (transactionDeleteWhatsAppSmooch instanceof Array) {
                        await channelfunctions.clearHookCache("SmoochService", request._requestid);

                        return response.json({
                            success: true,
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionDeleteWhatsAppSmooch.code,
                            success: false,
                        });
                    }
                }

            case "VOXI":
                if (typeof parameters.servicecredentials !== "undefined" && parameters.servicecredentials) {
                    let serviceCredentials = JSON.parse(parameters.servicecredentials);

                    let voximplantPhoneNumber = await channelfunctions.voximplantDeletePhoneNumber(
                        request.user.corpid,
                        request.user.orgid,
                        serviceCredentials.phoneid,
                        serviceCredentials.queueid,
                        request.originalUrl,
                        request._requestid
                    );

                    if (voximplantPhoneNumber.phoneid && voximplantPhoneNumber.queueid) {
                        const transactionDeleteVoximplant = await triggerfunctions.executesimpletransaction(
                            method,
                            parameters
                        );

                        if (transactionDeleteVoximplant instanceof Array) {
                            return response.json({
                                success: true,
                            });
                        } else {
                            return response.status(400).json({
                                msg: transactionDeleteVoximplant.code,
                                success: false,
                            });
                        }
                    }

                    return response.status(400).json({
                        msg: "voximplant_phonenumberdelete_error",
                        success: false,
                    });
                } else {
                    const transactionDeleteVoximplant = await triggerfunctions.executesimpletransaction(
                        method,
                        parameters
                    );

                    if (transactionDeleteVoximplant instanceof Array) {
                        return response.json({
                            success: true,
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionDeleteVoximplant.code,
                            success: false,
                        });
                    }
                }

            case "WHAG":
                if (typeof parameters.servicecredentials !== "undefined" && parameters.servicecredentials) {
                    let serviceCredentials = JSON.parse(parameters.servicecredentials);

                    const requestDeleteWhatsAppGupshup = await axiosObservable({
                        _requestid: request._requestid,
                        method: "post",
                        url: `${bridgeEndpoint}processlaraigo/gupshup/managegupshuplink`,
                        data: {
                            apiKey: serviceCredentials.apiKey,
                            appId: parameters.communicationchannelowner,
                            linkType: "GUPSHUPREMOVE",
                        },
                    });

                    if (requestDeleteWhatsAppGupshup.data.success) {
                        const transactionDeleteWhatsAppGupshup = await triggerfunctions.executesimpletransaction(
                            method,
                            parameters
                        );

                        if (transactionDeleteWhatsAppGupshup instanceof Array) {
                            await channelfunctions.clearHookCache("GupshupService", request._requestid);

                            return response.json({
                                success: true,
                            });
                        } else {
                            return response.status(400).json({
                                msg: transactionDeleteWhatsAppGupshup.code,
                                success: false,
                            });
                        }
                    } else {
                        return response.status(400).json({
                            msg: requestDeleteWhatsAppGupshup.data.operationMessage,
                            success: false,
                        });
                    }
                } else {
                    const transactionDeleteWhatsAppGupshup = await triggerfunctions.executesimpletransaction(
                        method,
                        parameters
                    );

                    if (transactionDeleteWhatsAppGupshup instanceof Array) {
                        await channelfunctions.clearHookCache("GupshupService", request._requestid);

                        return response.json({
                            success: true,
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionDeleteWhatsAppGupshup.code,
                            success: false,
                        });
                    }
                }

            default:
                const transactionDeleteGeneric = await triggerfunctions.executesimpletransaction(method, parameters);

                if (transactionDeleteGeneric instanceof Array) {
                    await channelfunctions.clearHookCache("EveryService", request._requestid);

                    return response.json({
                        success: true,
                    });
                } else {
                    return response.status(400).json({
                        msg: transactionDeleteGeneric.code,
                        success: false,
                    });
                }
        }
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            msg: exception.message,
        });
    }
};

exports.getChannelService = async (request, response) => {
    try {
        let method = null;
        let parameters = null;

        if (request.body.siteType === "SMCH") {
            method = "UFN_COMMUNICATIONCHANNELSITE_SMOOCH_SEL";
            parameters = {
                _requestid: request._requestid,
                communicationchannelsite: request.body.siteId,
            };
        } else {
            method = "UFN_COMMUNICATIONCHANNELSITE_SEL";
            parameters = {
                _requestid: request._requestid,
                communicationchannelsite: request.body.siteId,
                type: request.body.siteType,
            };
        }

        const transactionSelectCredentials = await triggerfunctions.executesimpletransaction(method, parameters);

        if (transactionSelectCredentials instanceof Array) {
            if (transactionSelectCredentials.length > 0) {
                if (request.body.siteType !== "TWTR") {
                    return response.json({
                        serviceData: transactionSelectCredentials[0].servicecredentials,
                        success: true,
                    });
                } else {
                    return response.json({
                        serviceData: transactionSelectCredentials[0].servicedata,
                        success: true,
                    });
                }
            } else {
                return response.json({
                    msg: "Not found",
                    success: false,
                });
            }
        } else {
            return response.status(400).json({
                msg: transactionSelectCredentials.code,
                success: false,
            });
        }
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            msg: exception.message,
        });
    }
};

exports.getLongToken = async (request, response) => {
    try {
        const requestGetLongToken = await axiosObservable({
            _requestid: request._requestid,
            method: "post",
            url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`,
            data: {
                accessToken: request.body.accessToken,
                appId: request.body.appId,
                linkType: "GENERATELONGTOKEN",
            },
        });

        if (requestGetLongToken.data.success) {
            return response.json({
                longToken: requestGetLongToken.data.longToken,
                success: true,
            });
        } else {
            return response.status(400).json({
                msg: requestGetLongToken.data.operationMessage,
                success: false,
            });
        }
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            msg: exception.message,
        });
    }
};

exports.getPageList = async (request, response) => {
    try {
        const requestGetPageList = await axiosObservable({
            _requestid: request._requestid,
            method: "post",
            url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`,
            data: {
                accessToken: request.body.accessToken,
                appId: request.body.appId,
                linkType: "GETPAGES",
            },
        });

        if (requestGetPageList.data.success) {
            return response.json({
                pageData: requestGetPageList.data.pageData,
                success: true,
            });
        } else {
            return response.status(400).json({
                msg: requestGetPageList.data.operationMessage,
                success: false,
            });
        }
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            msg: exception.message,
        });
    }
};

exports.getPhoneList = async (request, response) => {
    try {
        const requestGetPhoneList = await axiosObservable({
            _requestid: request._requestid,
            method: "post",
            url: `${bridgeEndpoint}processpartner/getnumberlist`,
            data: {
                channelList: request.body.channelList,
                partnerId: request.body.partnerId,
            },
        });

        if (requestGetPhoneList.data.success) {
            return response.json({
                data: requestGetPhoneList.data.phoneList,
                success: true,
            });
        } else {
            return response.status(400).json({
                msg: requestGetPhoneList.data.operationMessage,
                success: false,
            });
        }
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            msg: exception.message,
        });
    }
};
exports.getGroupList = async (request, response) => {
    try {
        const { accesstoken } = request.body;

        if (!accesstoken) {
            return response.status(400).json({
                msg: "there is no accesstoken parameter.",
                success: false,
            });
        }

        const requestGroupList = await axiosObservable({
            _requestid: request._requestid,
            method: "get",
            url: `https://graph.workplace.com/community/groups?access_token=${accesstoken}`,
        });

        if (requestGroupList.data) {
            return response.json({
                data: requestGroupList.data,
                success: true,
            });
        }
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            msg: exception.message,
        });
    }
};

exports.insertChannel = async (request, response) => {
    try {
        let { method, parameters = {}, service = {} } = request.body;

        setSessionParameters(parameters, request.user, request._requestid);

        parameters.apikey = null;
        parameters.appintegrationid = null;
        parameters.botconfigurationid = null;
        parameters.botenabled = null;
        parameters.channelparameters = null;
        parameters.chatflowenabled = true;
        parameters.coloricon = parameters.coloricon || null;
        parameters.communicationchannelcontact = "";
        parameters.communicationchanneltoken = null;
        parameters.corpid = request.user.corpid;
        parameters.country = null;
        parameters.customicon = null;
        parameters.motive = "Insert from API";
        parameters.operation = parameters.id ? "UPDATE" : "INSERT";
        parameters.orgid = request.user.orgid;
        parameters.phone = null;
        parameters.resolvelithium = null;
        parameters.schedule = null;
        parameters.status = "ACTIVO";
        parameters.updintegration = null;
        parameters.username = request.user.usr;
        parameters.voximplantholdtone = null;
        parameters.voximplantrecording = null;
        parameters.voximplantwelcometone = null;

        switch (request.body.type) {
            case "SMOOCHANDROID":
            case "CHATWEB":
                const webChatData = {
                    applicationId: webChatApplication,
                    name: parameters.description,
                    status: "ACTIVO",
                    type: "CHAZ",
                    metadata: {
                        form: service.form ? service.form : null,
                        color: {
                            chatBackgroundColor: service.color ? service.color.background : "",
                            chatBorderColor: service.color ? service.color.border : "",
                            chatHeaderColor: service.color ? service.color.header : "",
                            iconscolor: service.color ? service.color.iconscolor : "",
                            messageBotColor: service.color ? service.color.bot : "",
                            messageClientColor: service.color ? service.color.client : "",
                        },
                        extra: {
                            abandonendpoint: `${webChatScriptEndpoint}smooch`,
                            chatTextSize: service.extra?.chatTextSize || 0,
                            chatTextWeight: service.extra?.chatTextWeight || 0,
                            cssbody: service.extra?.customcss || "",
                            enableabandon: service.extra ? service.extra.abandonevent : false,
                            enableformhistory: service.extra ? service.extra.formhistory : false,
                            enableidlemessage: service.bubble ? service.bubble.active : false,
                            headermessage: service.extra ? service.extra.botnametext : "",
                            iconColorActive: service.extra?.iconColorActive || "",
                            iconColorDisabled: service.extra?.iconColorDisabled || "",
                            inputalwaysactive: service.extra ? service.extra.persistentinput : false,
                            inputTextSize: service.extra?.inputTextSize || 0,
                            inputTextWeight: service.extra?.inputTextWeight || 0,
                            jsscript: service.extra ? service.extra.customjs : "",
                            playalertsound: service.extra ? service.extra.alertsound : false,
                            sendmetadata: service.extra ? service.extra.enablemetadata : false,
                            showchatrestart: service.extra ? service.extra.reloadchat : false,
                            showlaraigologo: service.extra ? service.extra.poweredby : false,
                            showmessageheader: service.extra ? service.extra.botnameenabled : false,
                            showplatformlogo: false,
                            uploadaudio: service.extra ? service.extra.uploadaudio : false,
                            uploadfile: service.extra ? service.extra.uploadfile : false,
                            uploadimage: service.extra ? service.extra.uploadimage : false,
                            uploadlocation: service.extra ? service.extra.uploadlocation : false,
                            uploadvideo: service.extra ? service.extra.uploadvideo : false,
                            withBorder: service.extra?.withBorder || false,
                            withHour: service.extra?.withHour || false,
                        },
                        icons: {
                            chatBotImage: service.interface ? service.interface.iconbot : "",
                            chatHeaderImage: service.interface ? service.interface.iconheader : "",
                            chatIdleImage: service.bubble ? service.bubble.iconbubble : "",
                            chatOpenImage: service.interface ? service.interface.iconbutton : "",
                        },
                        personalization: {
                            headerMessage: service.extra ? service.extra.botnametext : "",
                            headerSubTitle: service.interface ? service.interface.chatsubtitle : "",
                            headerTitle: service.interface ? service.interface.chattitle : "",
                            idleMessage: service.bubble ? service.bubble.messagebubble : "",
                        },
                    },
                };

                const requestWebChatCreate = await axiosObservable({
                    _requestid: request._requestid,
                    data: webChatData,
                    method: "post",
                    url: `${brokerEndpoint}integrations/save`,
                });

                if (typeof requestWebChatCreate.data.id !== "undefined" && requestWebChatCreate.data.id) {
                    const requestWebChatWebhook = await axiosObservable({
                        _requestid: request._requestid,
                        method: "post",
                        url: `${brokerEndpoint}webhooks/save`,
                        data: {
                            description: parameters.description,
                            integration: requestWebChatCreate.data.id,
                            name: parameters.description,
                            status: "ACTIVO",
                            webUrl: `${hookEndpoint}chatweb/webhookasync`,
                        },
                    });

                    if (typeof requestWebChatWebhook.data.id !== "undefined" && requestWebChatWebhook.data.id) {
                        const requestWebChatPlugin = await axiosObservable({
                            _requestid: request._requestid,
                            method: "post",
                            url: `${brokerEndpoint}plugins/save`,
                            data: {
                                integration: requestWebChatCreate.data.id,
                                name: parameters.description,
                                status: "ACTIVO",
                            },
                        });

                        if (typeof requestWebChatPlugin.data.id !== "undefined" && requestWebChatPlugin.data.id) {
                            parameters.apikey = requestWebChatPlugin.data.apiKey;
                            parameters.appintegrationid = webChatApplication;
                            parameters.channelparameters = JSON.stringify(webChatData);
                            parameters.communicationchannelcontact = requestWebChatPlugin.data.id;
                            parameters.communicationchannelowner = requestWebChatWebhook.data.id;
                            parameters.communicationchannelsite = requestWebChatCreate.data.id;
                            parameters.integrationid = requestWebChatCreate.data.id;
                            parameters.servicecredentials = JSON.stringify(service);
                            parameters.type = "CHAZ";

                            const transactionCreateWebChat = await triggerfunctions.executesimpletransaction(
                                method,
                                parameters
                            );

                            if (transactionCreateWebChat instanceof Array) {
                                await channelfunctions.clearHookCache("ChatWebService", request._requestid);

                                return response.json({
                                    integrationid: requestWebChatCreate.data.id,
                                    success: true,
                                    result: transactionCreateWebChat[0]
                                });
                            } else {
                                return response.status(400).json({
                                    msg: transactionCreateWebChat.code,
                                    success: false,
                                });
                            }
                        } else {
                            return response.status(400).json({
                                msg: "Could not create plugin",
                                success: false,
                            });
                        }
                    } else {
                        return response.status(400).json({
                            msg: "Could not create webhook",
                            success: false,
                        });
                    }
                } else {
                    return response.status(400).json({
                        msg: "Could not create integration",
                        success: false,
                    });
                }

            case "FORM":
                const webChatData1 = {
                    applicationId: webChatApplication,
                    name: parameters.description,
                    status: "ACTIVO",
                    type: "FORM",
                    metadata: {
                        form: service.form ? service.form : null,
                        extra: {
                            ...(service.extra || {}),
                            corpid: request.user.corpid,
                            orgid: request.user.orgid,
                        },
                    },
                };

                const requestWebChatCreate1 = await axiosObservable({
                    _requestid: request._requestid,
                    data: webChatData1,
                    method: "post",
                    url: `${brokerEndpoint}integrations/save`,
                });

                if (typeof requestWebChatCreate1.data.id !== "undefined" && requestWebChatCreate1.data.id) {
                    parameters.apikey = "";
                    parameters.appintegrationid = webChatApplication;
                    parameters.channelparameters = JSON.stringify(webChatData1);
                    parameters.communicationchannelcontact = "";
                    parameters.communicationchannelowner = "";
                    parameters.communicationchannelsite = requestWebChatCreate1.data.id;
                    parameters.integrationid = requestWebChatCreate1.data.id;
                    parameters.servicecredentials = JSON.stringify(service);
                    parameters.type = "FORM";

                    const transactionCreateWebChat = await triggerfunctions.executesimpletransaction(
                        method,
                        parameters
                    );

                    if (transactionCreateWebChat instanceof Array) {
                        await channelfunctions.clearHookCache("ChatWebService", request._requestid);

                        return response.json({
                            integrationid: requestWebChatCreate1.data.id,
                            success: true,
                            result: transactionCreateWebChat[0]
                        });
                    } else {
                        return response.status(400).json({
                            msg: "Could not create integration",
                            success: false,
                        });
                    }
                } else {
                    return response.status(400).json({
                        msg: "Could not create integration",
                        success: false,
                    });
                }

            case "FACEBOOKWORPLACE":
                const requestTokenWorkplace = await axiosObservable({
                    _requestid: request._requestid,
                    method: "get",
                    url: `https://graph.workplace.com/me?access_token=${service.accesstoken}`,
                });

                if (requestTokenWorkplace.status === 200) {
                    let serviceCredentials = {
                        accessToken: service.accesstoken,
                        appid: service.appid || null,
                        appsecret: service.appsecret || null,
                        endpoint: facebookEndpoint,
                        serviceType: "WORKPLACE",
                        siteId: requestTokenWorkplace.data.id,
                    };

                    parameters.communicationchannelowner = requestTokenWorkplace.data.id;
                    parameters.communicationchannelsite = requestTokenWorkplace.data.id;
                    parameters.servicecredentials = JSON.stringify(serviceCredentials);
                    parameters.type = "FBWP";

                    const transactionCreateWorkplace = await triggerfunctions.executesimpletransaction(
                        method,
                        parameters
                    );

                    if (transactionCreateWorkplace instanceof Array) {
                        await channelfunctions.clearHookCache("FacebookService", request._requestid);

                        return response.json({
                            success: true,
                            result: transactionCreateWorkplace[0]
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionCreateWorkplace.code,
                            success: false,
                        });
                    }
                } else {
                    return response.status(400).json({
                        msg: requestTokenWorkplace.data.error.message,
                        success: false,
                    });
                }

            case "FBWM":
                const requestTokenWorkplaceWall = await axiosObservable({
                    _requestid: request._requestid,
                    method: "get",
                    url: `https://graph.workplace.com/me?access_token=${service.accesstoken}`,
                });

                if (requestTokenWorkplaceWall.status === 200) {
                    let serviceCredentials = {
                        accessToken: service.accesstoken,
                        appid: service.appid || null,
                        appsecret: service.appsecret || null,
                        endpoint: facebookEndpoint,
                        serviceType: "WORKPLACE",
                        siteId: requestTokenWorkplaceWall.data.id,
                    };

                    parameters.communicationchannelowner = requestTokenWorkplaceWall.data.id;
                    parameters.communicationchannelsite = service.groupid;
                    parameters.servicecredentials = JSON.stringify(serviceCredentials);
                    parameters.type = "FBWM";

                    const transactionCreateWorkplace = await triggerfunctions.executesimpletransaction(
                        method,
                        parameters
                    );

                    if (transactionCreateWorkplace instanceof Array) {
                        await channelfunctions.clearHookCache("FacebookService", request._requestid);

                        return response.json({
                            success: true,
                            result: transactionCreateWorkplace[0]
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionCreateWorkplace.code,
                            success: false,
                        });
                    }
                } else {
                    return response.status(400).json({
                        msg: requestTokenWorkplaceWall.data.error.message,
                        success: false,
                    });
                }

            case "FACEBOOK":
            case "FBLD":
            case "INSTAGRAM":
            case "INSTAMESSENGER":
            case "MESSENGER":
                const requestGetLongToken = await axiosObservable({
                    _requestid: request._requestid,
                    method: "post",
                    url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`,
                    data: {
                        accessToken: service.accesstoken,
                        appId: service.appid,
                        linkType: "GENERATELONGTOKEN",
                    },
                });

                if (requestGetLongToken.data.success) {
                    let businessId = null;
                    let channelLinkService = null;
                    let channelType = null;
                    let serviceType = null;

                    switch (request.body.type) {
                        case "FACEBOOK":
                            channelLinkService = "WALLADD";
                            channelType = "FBWA";
                            serviceType = "WALL";
                            break;

                        case "FBLD":
                            channelLinkService = "WALLADD";
                            channelType = "FBLD";
                            serviceType = "FBLD";
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

                    if (request.body.type === "INSTAGRAM" || request.body.type === "INSTAMESSENGER") {
                        const requestGetBusiness = await axiosObservable({
                            _requestid: request._requestid,
                            method: "post",
                            url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`,
                            data: {
                                accessToken: service.accesstoken,
                                linkType: "GETBUSINESS",
                                siteId: service.siteid,
                            },
                        });

                        if (requestGetBusiness.data.success) {
                            businessId = requestGetBusiness.data.businessId;
                        } else {
                            return response.status(400).json({
                                msg: "No Instagram account",
                                success: false,
                            });
                        }
                    }

                    const requestCreateFacebook = await axiosObservable({
                        _requestid: request._requestid,
                        method: "post",
                        url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`,
                        data: {
                            linkType: channelLinkService,
                            accessToken: requestGetLongToken.data.longToken,
                            siteId: service.siteid,
                        },
                    });

                    if (requestCreateFacebook.data.success) {
                        let serviceCredentials = {
                            accessToken: requestGetLongToken.data.longToken,
                            endpoint: facebookEndpoint,
                            serviceType: serviceType,
                            siteId: service.siteid,
                        };

                        if (request.body.type === "FBLD") {
                            serviceCredentials = {
                                accessToken: requestGetLongToken.data.longToken,
                                corpid: request.user.corpid,
                                endpoint: facebookEndpoint,
                                org: request.user.orgid,
                                serviceType: serviceType,
                                siteId: service.siteid,
                            };
                        }

                        if (typeof businessId !== "undefined" && businessId) {
                            parameters.communicationchannelowner = service.siteid;
                            parameters.communicationchannelsite = businessId;

                            serviceCredentials.siteId = businessId;
                        }

                        parameters.servicecredentials = JSON.stringify(serviceCredentials);
                        parameters.type = channelType;

                        const transactionCreateFacebook = await triggerfunctions.executesimpletransaction(
                            method,
                            parameters
                        );

                        if (transactionCreateFacebook instanceof Array) {
                            await channelfunctions.clearHookCache("FacebookService", request._requestid);

                            return response.json({
                                success: true,
                                result: transactionCreateFacebook[0]
                            });
                        } else {
                            return response.status(400).json({
                                msg: transactionCreateFacebook.code,
                                success: false,
                            });
                        }
                    } else {
                        return response.status(400).json({
                            msg: requestCreateFacebook.data.operationMessage,
                            success: false,
                        });
                    }
                } else {
                    return response.status(400).json({
                        msg: requestGetLongToken.data.operationMessage,
                        success: false,
                    });
                }

            case "SMOOCHIOS":
                const requestCreateSmooch = await axiosObservable({
                    _requestid: request._requestid,
                    method: "post",
                    url: `${bridgeEndpoint}processlaraigo/smooch/managesmoochlink`,
                    data: {
                        linkType: request.body.type === "SMOOCHANDROID" ? "ANDROIDADD" : "IOSADD",
                        name: parameters.description,
                    },
                });

                if (requestCreateSmooch.data.success) {
                    let serviceCredentials = {
                        apiKeyId: requestCreateSmooch.data.appApiKey,
                        apiKeySecret: requestCreateSmooch.data.appSecret,
                        appId: requestCreateSmooch.data.applicationId,
                        endpoint: smoochEndpoint,
                        integrationId: requestCreateSmooch.data.integrationId,
                        version: smoochVersion,
                    };

                    parameters.communicationchannelowner = requestCreateSmooch.data.applicationId;
                    parameters.communicationchannelsite = requestCreateSmooch.data.applicationId;
                    parameters.integrationid = requestCreateSmooch.data.integrationId;
                    parameters.servicecredentials = JSON.stringify(serviceCredentials);
                    parameters.type = request.body.type === "SMOOCHANDROID" ? "ANDR" : "APPL";

                    const transactionCreateSmooch = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionCreateSmooch instanceof Array) {
                        await channelfunctions.clearHookCache("SmoochService", request._requestid);

                        return response.json({
                            applicationId: requestCreateSmooch.data.applicationId,
                            integrationId: requestCreateSmooch.data.integrationId,
                            success: true,
                            result: transactionCreateSmooch[0]
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionCreateSmooch.code,
                            success: false,
                        });
                    }
                } else {
                    return response.status(400).json({
                        msg: requestCreateSmooch.data.operationMessage,
                        success: false,
                    });
                }

            case "INFOBIPEMAIL":
            case "INFOBIPSMS":
                if (service) {
                    let serviceCredentials = {
                        apiKey: service.apikey,
                        callbackType: "application/json",
                        endpoint: service.url,
                        number: service.emittername,
                        callbackEndpoint: `${hookEndpoint}infobip/${request.body.type === "INFOBIPEMAIL" ? "mail" : ""
                            }webhookasync`,
                    };

                    if (request.body.type === "INFOBIPEMAIL") {
                        serviceCredentials.validateMail = false;
                    }

                    parameters.communicationchannelowner = service.emittername;
                    parameters.communicationchannelsite = service.emittername;
                    parameters.integrationid = service.emittername;
                    parameters.servicecredentials = JSON.stringify(serviceCredentials);
                    parameters.type = request.body.type === "INFOBIPEMAIL" ? "MAII" : "SMSI";

                    const transactionCreateInfobip = await triggerfunctions.executesimpletransaction(
                        method,
                        parameters
                    );

                    if (transactionCreateInfobip instanceof Array) {
                        if (request.body.type === "INFOBIPEMAIL") {
                            await channelfunctions.clearHookCache("InfobipMailService", request._requestid);
                        } else {
                            await channelfunctions.clearHookCache("InfobipService", request._requestid);
                        }

                        return response.json({
                            success: true,
                            result: transactionCreateInfobip[0]
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionCreateInfobip.code,
                            success: false,
                        });
                    }
                }
                break;

            case "IMAP":
                if (service) {
                    parameters.communicationchannelowner = service.imapusername;
                    parameters.communicationchannelsite = `${service.imapusername}|IMAP|`;
                    parameters.integrationid = service.imapusername;
                    parameters.servicecredentials = JSON.stringify(service);
                    parameters.status = "ACTIVO";
                    parameters.type = "MAIL";

                    let extraData = {
                        accessToken: service.imapaccesstoken || "",
                        host: service.imaphost || "",
                        incomingEndpoint: service.imapincomingendpoint || "",
                        incomingPort: parseInt(service.imapincomingport || 0),
                        password: service.imappassword || "",
                        port: parseInt(service.imapport || 0),
                        username: service.imapusername || "",
                        useSsl: service.imapssl === "SSL",
                        useStartTls: service.imapssl === "STARTTLS",
                    };

                    await channelfunctions.serviceTokenUpdate(
                        service.imapusername,
                        "",
                        "",
                        JSON.stringify(extraData),
                        "IMAP",
                        "ACTIVO",
                        request?.user?.usr,
                        1
                    );

                    await channelfunctions.serviceSubscriptionUpdate(
                        service.imapusername,
                        service.imapusername,
                        JSON.stringify(extraData),
                        "MAIL-IMAP",
                        "ACTIVO",
                        request?.user?.usr,
                        `${hookEndpoint}mail/imapwebhookasync`,
                        2
                    );

                    const transactionCreateGeneric = await triggerfunctions.executesimpletransaction(
                        method,
                        parameters
                    );

                    if (transactionCreateGeneric instanceof Array) {
                        return response.json({
                            success: true,
                            result: transactionCreateGeneric[0]
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionCreateGeneric.code,
                            success: false,
                        });
                    }
                }
                break;

            case "GMAIL":
                if (service) {
                    let informationtoken = jwt.decode(service.idtoken);

                    parameters.communicationchannelowner = informationtoken.name;
                    parameters.communicationchannelsite = informationtoken.email;
                    parameters.integrationid = informationtoken.email;
                    parameters.servicecredentials = JSON.stringify(service);
                    parameters.status = "ACTIVO";
                    parameters.type = "MAIL";

                    await channelfunctions.serviceTokenUpdate(
                        informationtoken.email,
                        service.accesstoken,
                        service.refreshtoken,
                        JSON.stringify({
                            clientId: googleClientId,
                            clientSecret: googleClientSecret,
                            topicName: googleTopicName,
                        }),
                        "GOOGLE",
                        "ACTIVO",
                        request?.user?.usr,
                        50
                    );

                    await channelfunctions.serviceSubscriptionUpdate(
                        informationtoken.email,
                        informationtoken.email,
                        JSON.stringify({
                            clientId: googleClientId,
                            clientSecret: googleClientSecret,
                            topicName: googleTopicName,
                        }),
                        "GOOGLE-GMAIL",
                        "ACTIVO",
                        request?.user?.usr,
                        `${hookEndpoint}mail/gmailwebhookasync`,
                        2880
                    );

                    const transactionCreateGeneric = await triggerfunctions.executesimpletransaction(
                        method,
                        parameters
                    );

                    if (transactionCreateGeneric instanceof Array) {
                        return response.json({
                            success: true,
                            result: transactionCreateGeneric[0]
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionCreateGeneric.code,
                            success: false,
                        });
                    }
                }
                break;

            case "BUSINESS":
                if (service) {
                    let informationtoken = jwt.decode(service.idtoken);

                    parameters.communicationchannelowner = informationtoken.name;
                    parameters.communicationchannelsite = informationtoken.email;
                    parameters.integrationid = informationtoken.email;
                    parameters.servicecredentials = JSON.stringify(service);
                    parameters.status = "ACTIVO";
                    parameters.type = "GOBU";

                    await channelfunctions.serviceTokenUpdate(
                        informationtoken.email,
                        service.accesstoken,
                        service.refreshtoken,
                        JSON.stringify({
                            clientId: googleClientId,
                            clientSecret: googleClientSecret,
                            topicName: googleTopicName,
                        }),
                        "GOOGLE",
                        "ACTIVO",
                        request?.user?.usr,
                        50
                    );

                    await channelfunctions.serviceSubscriptionUpdate(
                        informationtoken.email,
                        informationtoken.email,
                        JSON.stringify({
                            clientId: googleClientId,
                            clientSecret: googleClientSecret,
                            topicName: googleTopicName,
                        }),
                        "GOOGLE-BUSINESS",
                        "ACTIVO",
                        request?.user?.usr,
                        `${hookEndpoint}business/webhookasync`,
                        2
                    );

                    const transactionCreateGeneric = await triggerfunctions.executesimpletransaction(
                        method,
                        parameters
                    );

                    if (transactionCreateGeneric instanceof Array) {
                        return response.json({
                            success: true,
                            result: transactionCreateGeneric[0]
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionCreateGeneric.code,
                            success: false,
                        });
                    }
                }
                break;

            case "BLOGGER":
            case "YOUTUBE":
                if (service) {
                    let informationtoken = jwt.decode(service.idtoken);

                    parameters.communicationchannelowner = informationtoken.name;
                    parameters.integrationid = service.channel;
                    parameters.servicecredentials = JSON.stringify(service);
                    parameters.status = "ACTIVO";

                    await channelfunctions.serviceTokenUpdate(
                        informationtoken.email,
                        service.accesstoken,
                        service.refreshtoken,
                        JSON.stringify({
                            clientId: googleClientId,
                            clientSecret: googleClientSecret,
                            topicName: googleTopicName,
                        }),
                        "GOOGLE",
                        "ACTIVO",
                        request?.user?.usr,
                        50
                    );

                    switch (request.body.type) {
                        case "BLOGGER":
                            parameters.communicationchannelsite = `${informationtoken.email}&%BLOG%&${service.channel}`;
                            parameters.type = "BLOG";

                            await channelfunctions.serviceSubscriptionUpdate(
                                informationtoken.email,
                                service.channel,
                                JSON.stringify({
                                    clientId: googleClientId,
                                    clientSecret: googleClientSecret,
                                    topicName: googleTopicName,
                                }),
                                "GOOGLE-BLOGGER",
                                "ACTIVO",
                                request?.user?.usr,
                                `${hookEndpoint}blogger/webhookasync`,
                                2
                            );
                            break;

                        case "YOUTUBE":
                            parameters.communicationchannelsite = `${informationtoken.email}&%YOUT%&${service.channel}`;
                            parameters.type = "YOUT";

                            await channelfunctions.serviceSubscriptionUpdate(
                                informationtoken.email,
                                service.channel,
                                JSON.stringify({
                                    clientId: googleClientId,
                                    clientSecret: googleClientSecret,
                                    topicName: googleTopicName,
                                }),
                                "GOOGLE-YOUTUBE",
                                "ACTIVO",
                                request?.user?.usr,
                                `${hookEndpoint}youtube/webhookasync`,
                                2
                            );
                            break;
                    }

                    const transactionCreateGeneric = await triggerfunctions.executesimpletransaction(
                        method,
                        parameters
                    );

                    if (transactionCreateGeneric instanceof Array) {
                        return response.json({
                            success: true,
                            result: transactionCreateGeneric[0]
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionCreateGeneric.code,
                            success: false,
                        });
                    }
                }
                break;

            case "AYRSHARE-TIKTOK":
                if (service) {
                    const requestCreateAyrshare = await axiosObservable({
                        _requestid: request._requestid,
                        method: "post",
                        url: `${bridgeEndpoint}processlaraigo/ayrshare/manageayrsharelink`,
                        data: {
                            accessToken: service.accesstoken,
                            integrationType: "TIKTOK",
                            linkType: "CHECKINTEGRATION",
                        },
                    });

                    if (requestCreateAyrshare.data.success) {
                        let serviceCredentials = {
                            accessToken: service.accesstoken,
                            endpoint: ayrshareEndpoint,
                            username: requestCreateAyrshare.data.username,
                        };

                        parameters.communicationchannelowner = requestCreateAyrshare.data.username;
                        parameters.communicationchannelsite = requestCreateAyrshare.data.username;
                        parameters.integrationid = requestCreateAyrshare.data.username;
                        parameters.servicecredentials = JSON.stringify(serviceCredentials);
                        parameters.status = "ACTIVO";
                        parameters.type = "TKTA";

                        await channelfunctions.serviceSubscriptionUpdate(
                            requestCreateAyrshare.data.username,
                            requestCreateAyrshare.data.username,
                            JSON.stringify(serviceCredentials),
                            "AYRSHARE-TIKTOK",
                            "ACTIVO",
                            request?.user?.usr,
                            `${hookEndpoint}ayrshare/webhookasync`,
                            6
                        );

                        const transactionCreateGeneric = await triggerfunctions.executesimpletransaction(
                            method,
                            parameters
                        );

                        if (transactionCreateGeneric instanceof Array) {
                            return response.json({
                                success: true,
                                result: transactionCreateGeneric[0]
                            });
                        } else {
                            return response.status(400).json({
                                msg: transactionCreateGeneric.code,
                                success: false,
                            });
                        }
                    } else {
                        return response.status(400).json({
                            msg: requestCreateAyrshare.data.operationMessage,
                            success: false,
                        });
                    }
                }
                break;

            case "TIKAPI-TIKTOK":
                if (service) {
                    const requestCreateTikApi = await axiosObservable({
                        _requestid: request._requestid,
                        method: "post",
                        url: `${bridgeEndpoint}processlaraigo/tikapi/managetikapilink`,
                        data: {
                            accountKey: service.accountkey,
                            apiKey: service.apikey,
                            linkType: "CHECKINTEGRATION",
                        },
                    });

                    if (requestCreateTikApi.data.success) {
                        let serviceCredentials = {
                            accountKey: service.accountkey,
                            apiKey: service.apikey,
                            endpoint: tikApiEndpoint,
                            username: requestCreateTikApi.data.username,
                        };

                        parameters.communicationchannelowner = requestCreateTikApi.data.username;
                        parameters.communicationchannelsite = requestCreateTikApi.data.username;
                        parameters.integrationid = requestCreateTikApi.data.username;
                        parameters.servicecredentials = JSON.stringify(serviceCredentials);
                        parameters.status = "ACTIVO";
                        parameters.type = "TKTT";

                        await channelfunctions.serviceSubscriptionUpdate(
                            requestCreateTikApi.data.username,
                            requestCreateTikApi.data.username,
                            JSON.stringify(serviceCredentials),
                            "TIKAPI-TIKTOK",
                            "ACTIVO",
                            request?.user?.usr,
                            `${hookEndpoint}tikapi/webhookasync`,
                            4
                        );

                        const transactionCreateGeneric = await triggerfunctions.executesimpletransaction(
                            method,
                            parameters
                        );

                        if (transactionCreateGeneric instanceof Array) {
                            return response.json({
                                success: true,
                                result: transactionCreateGeneric[0]
                            });
                        } else {
                            return response.status(400).json({
                                msg: transactionCreateGeneric.code,
                                success: false,
                            });
                        }
                    } else {
                        return response.status(400).json({
                            msg: requestCreateTikApi.data.operationMessage,
                            success: false,
                        });
                    }
                }
                break;

            case "PLAYSTORE":
                if (service) {
                    parameters.communicationchannelowner = service.mail;
                    parameters.communicationchannelsite = `${service.mail}|AC|${service.appcode}`;
                    parameters.integrationid = service.appcode;
                    parameters.servicecredentials = JSON.stringify(service);
                    parameters.status = "ACTIVO";
                    parameters.type = "PLAY";

                    await channelfunctions.serviceTokenUpdate(
                        service.mail,
                        "",
                        "",
                        JSON.stringify(service),
                        "PLAYSTORE",
                        "ACTIVO",
                        request?.user?.usr,
                        50
                    );

                    await channelfunctions.serviceSubscriptionUpdate(
                        service.mail,
                        service.appcode,
                        JSON.stringify(service),
                        "GOOGLE-PLAYSTORE",
                        "ACTIVO",
                        request?.user?.usr,
                        `${hookEndpoint}appstore/playstorewebhookasync`,
                        2
                    );

                    const transactionCreateGeneric = await triggerfunctions.executesimpletransaction(
                        method,
                        parameters
                    );

                    if (transactionCreateGeneric instanceof Array) {
                        return response.json({
                            success: true,
                            result: transactionCreateGeneric[0]
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionCreateGeneric.code,
                            success: false,
                        });
                    }
                }
                break;

            case "LINKEDIN":
                if (service) {
                    parameters.communicationchannelowner = service.clientid;
                    parameters.communicationchannelsite = service.clientid;
                    parameters.integrationid = `urn:li:organization:${service.organizationid}`;
                    parameters.status = "ACTIVO";
                    parameters.type = "LNKD";

                    parameters.servicecredentials = JSON.stringify({
                        clientId: service.clientid,
                        clientSecret: service.clientsecret,
                        endpoint: linkedinEndpoint,
                        organizationId: `urn:li:organization:${service.organizationid}`,
                    });

                    await channelfunctions.serviceTokenUpdate(
                        service.clientid,
                        service.accesstoken,
                        service.refreshtoken,
                        JSON.stringify({
                            clientId: service.clientid,
                            clientSecret: service.clientsecret,
                            endpoint: linkedinTokenEndpoint,
                        }),
                        "LINKEDIN",
                        "ACTIVO",
                        request?.user?.usr,
                        1400
                    );

                    const transactionCreateGeneric = await triggerfunctions.executesimpletransaction(
                        method,
                        parameters
                    );

                    if (transactionCreateGeneric instanceof Array) {
                        return response.json({
                            success: true,
                            result: transactionCreateGeneric[0]
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionCreateGeneric.code,
                            success: false,
                        });
                    }
                }
                break;

            case "MICROSOFTTEAMS":
            case "TIKTOK":
                if (service) {
                    parameters.communicationchannelowner = service.account;
                    parameters.communicationchannelsite = service.account;
                    parameters.integrationid = service.account;
                    parameters.servicecredentials = JSON.stringify(service);
                    parameters.status = "PENDIENTE";

                    switch (request.body.type) {
                        case "MICROSOFTTEAMS":
                            parameters.type = "TEAM";
                            break;

                        case "TIKTOK":
                            parameters.type = "TKTK";
                            break;
                    }

                    const transactionCreateGeneric = await triggerfunctions.executesimpletransaction(
                        method,
                        parameters
                    );

                    if (transactionCreateGeneric instanceof Array) {
                        return response.json({
                            success: true,
                            result: transactionCreateGeneric[0]
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionCreateGeneric.code,
                            success: false,
                        });
                    }
                }
                break;

            case "APPSTORE":
                if (service) {
                    parameters.communicationchannelowner = service.keyid;
                    parameters.communicationchannelsite = service.issuerid;
                    parameters.integrationid = service.issuerid;
                    parameters.servicecredentials = JSON.stringify(service);
                    parameters.status = "ACTIVO";
                    parameters.type = "APPS";

                    await channelfunctions.serviceTokenUpdate(
                        service.issuerid,
                        "",
                        "",
                        JSON.stringify({
                            issuerId: service.issuerid,
                            keyId: service.keyid,
                            secretKey: service.secretkey,
                        }),
                        "APPSTORE",
                        "ACTIVO",
                        request?.user?.usr,
                        15
                    );

                    await channelfunctions.serviceSubscriptionUpdate(
                        service.issuerid,
                        service.keyid,
                        JSON.stringify({
                            issuerId: service.issuerid,
                            keyId: service.keyid,
                            secretKey: service.secretkey,
                        }),
                        "APPLE-APPSTORE",
                        "ACTIVO",
                        request?.user?.usr,
                        `${hookEndpoint}appstore/appstorewebhookasync`,
                        2
                    );

                    const transactionCreateGeneric = await triggerfunctions.executesimpletransaction(
                        method,
                        parameters
                    );

                    if (transactionCreateGeneric instanceof Array) {
                        return response.json({
                            success: true,
                            result: transactionCreateGeneric[0]
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionCreateGeneric.code,
                            success: false,
                        });
                    }
                }
                break;

            case "TELEGRAM":
                const requestCreateTelegram = await axiosObservable({
                    _requestid: request._requestid,
                    method: "post",
                    url: `${bridgeEndpoint}processlaraigo/telegram/managetelegramlink`,
                    data: {
                        accessToken: service.accesstoken,
                        linkType: "TELEGRAMADD",
                    },
                });

                if (requestCreateTelegram.data.success) {
                    let serviceCredentials = {
                        bot: requestCreateTelegram.data.botName,
                        endpoint: telegramEndpoint,
                        token: service.accesstoken,
                    };

                    parameters.communicationchannelsite = requestCreateTelegram.data.botName;
                    parameters.servicecredentials = JSON.stringify(serviceCredentials);
                    parameters.type = "TELE";

                    const transactionCreateTelegram = await triggerfunctions.executesimpletransaction(
                        method,
                        parameters
                    );

                    if (transactionCreateTelegram instanceof Array) {
                        await channelfunctions.clearHookCache("TelegramService", request._requestid);

                        return response.json({
                            success: true,
                            result: transactionCreateTelegram[0]
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionCreateTelegram.code,
                            success: false,
                        });
                    }
                } else {
                    return response.status(400).json({
                        msg: requestCreateTelegram.data.operationMessage,
                        success: false,
                    });
                }

            case "TWITTER":
            case "TWITTERDM":
                const requestPageTwitter = await axiosObservable({
                    _requestid: request._requestid,
                    method: "post",
                    url: `${bridgeEndpoint}processlaraigo/twitter/managetwitterlink`,
                    data: {
                        accesstoken: service.accesstoken || null,
                        code: service.code || null,
                        linkType: service.code ? "EXCHANGECODE" : "GETUSERID",
                    },
                });

                if (requestPageTwitter.data.success) {
                    let serviceCredentials = {
                        accessToken: (service.code ? requestPageTwitter.data.accessToken : service.accesstoken) || null,
                        clientId: requestPageTwitter.data.clientId,
                        clientSecret: requestPageTwitter.data.clientSecret,
                        code: service.code || null,
                        refreshToken: (service.code ? requestPageTwitter.data.refreshToken : service.refreshtoken) || null,
                        userId: requestPageTwitter.data.userId,
                    };

                    parameters.communicationchannelsite = requestPageTwitter.data.userId;
                    parameters.servicecredentials = JSON.stringify(serviceCredentials);

                    if (request.body.type === "TWITTER") {
                        parameters.type = "TWIT";
                    } else {
                        parameters.type = "TWMS";
                    }

                    await channelfunctions.serviceTokenUpdate(
                        requestPageTwitter.data.userId,
                        (service.code ? requestPageTwitter.data.accessToken : service.accesstoken) || "",
                        (service.code ? requestPageTwitter.data.refreshToken : service.refreshtoken) || "",
                        JSON.stringify(serviceCredentials),
                        "TWITTER",
                        "ACTIVO",
                        request?.user?.usr,
                        50,
                    );

                    await channelfunctions.serviceSubscriptionUpdate(
                        requestPageTwitter.data.userId,
                        requestPageTwitter.data.userId,
                        JSON.stringify(serviceCredentials),
                        request.body.type === "TWITTER" ? "TWITTER-WALL" : "TWITTER-MESSENGER",
                        "ACTIVO",
                        request?.user?.usr,
                        `${hookEndpoint}twitter/webhookasync`,
                        request.body.type === "TWITTER" ? 1 : 3,
                    );

                    const transactionCreateTwitter = await triggerfunctions.executesimpletransaction(
                        method,
                        parameters
                    );

                    if (transactionCreateTwitter instanceof Array) {
                        return response.json({
                            result: transactionCreateTwitter[0],
                            success: true,
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionCreateTwitter.code,
                            success: false,
                        });
                    }
                } else {
                    return response.status(400).json({
                        msg: requestPageTwitter.data.operationMessage,
                        success: false,
                    });
                }

            case "WHATSAPP":
                if (!service.accesstoken && service.channelid) {
                    const requestGetApiKey = await axiosObservable({
                        _requestid: request._requestid,
                        method: "post",
                        url: `${bridgeEndpoint}processpartner/getapikey`,
                        data: {
                            channelId: service.channelid,
                            partnerId: service.partnerid,
                        },
                    });

                    if (requestGetApiKey.data.success) {
                        service.accesstoken = requestGetApiKey.data.apiKey;
                    }
                }

                const requestCreateWhatsApp = await axiosObservable({
                    _requestid: request._requestid,
                    method: "post",
                    url: `${bridgeEndpoint}processlaraigo/whatsapp/managewhatsapplink`,
                    data: {
                        accessToken: service.accesstoken,
                        isCloud: !!service.iscloud,
                        linkType: "WHATSAPPADD",
                    },
                });

                if (requestCreateWhatsApp.data.success) {
                    let serviceCredentials = {
                        apiKey: service.accesstoken,
                        endpoint: service.iscloud ? whatsAppCloudEndpoint : whatsAppEndpoint,
                        isCloud: !!service.iscloud,
                        number: requestCreateWhatsApp.data.phoneNumber,
                    };

                    parameters.communicationchannelsite = requestCreateWhatsApp.data.phoneNumber;
                    parameters.phone = requestCreateWhatsApp.data.phoneNumber;
                    parameters.servicecredentials = JSON.stringify(serviceCredentials);
                    parameters.type = "WHAD";

                    const transactionCreateWhatsApp = await triggerfunctions.executesimpletransaction(
                        method,
                        parameters
                    );

                    if (transactionCreateWhatsApp instanceof Array) {
                        await channelfunctions.clearHookCache("Dialog360Service", request._requestid);

                        return response.json({
                            success: true,
                            result: transactionCreateWhatsApp[0]
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionCreateWhatsApp.code,
                            success: false,
                        });
                    }
                } else {
                    return response.status(400).json({
                        msg: requestCreateWhatsApp.data.operationMessage,
                        success: false,
                    });
                }

            case "WHATSAPPSMOOCH":
                parameters.communicationchannelowner = "";
                parameters.communicationchannelsite = "";
                parameters.servicecredentials = JSON.stringify(service);
                parameters.status = "PENDIENTE";
                parameters.type = "WHAT";

                const transactionCreateWhatsAppSmooch = await triggerfunctions.executesimpletransaction(
                    method,
                    parameters
                );

                if (transactionCreateWhatsAppSmooch instanceof Array) {
                    if (parameters.type === "WHAT") {
                        let domainParameters = {
                            _requestid: request._requestid,
                            all: false,
                            corpid: 1,
                            domainname: "WHATSAPPRECIPIENT",
                            orgid: 0,
                            username: request.user.usr,
                        };

                        const transactionGetRecipient = await triggerfunctions.executesimpletransaction(
                            "UFN_DOMAIN_VALUES_SEL",
                            domainParameters
                        );

                        if (transactionGetRecipient instanceof Array) {
                            if (transactionGetRecipient.length > 0) {
                                domainParameters = {
                                    _requestid: request._requestid,
                                    all: false,
                                    corpid: 1,
                                    domainname: "WHATSAPPSUBJECT",
                                    orgid: 0,
                                    username: request.user.usr,
                                };

                                const transactionGetSubject = await triggerfunctions.executesimpletransaction(
                                    "UFN_DOMAIN_VALUES_SEL",
                                    domainParameters
                                );

                                if (transactionGetSubject instanceof Array) {
                                    if (transactionGetSubject.length > 0) {
                                        domainParameters = {
                                            _requestid: request._requestid,
                                            all: false,
                                            corpid: 1,
                                            domainname: "WHATSAPPBODY",
                                            orgid: 0,
                                            username: request.user.usr,
                                        };

                                        const transactionGetBody = await triggerfunctions.executesimpletransaction(
                                            "UFN_DOMAIN_VALUES_SEL",
                                            domainParameters
                                        );

                                        if (transactionGetBody instanceof Array) {
                                            if (transactionGetBody.length > 0) {
                                                let mailBody = transactionGetBody[0].domainvalue;
                                                let mailRecipient = transactionGetRecipient[0].domainvalue;
                                                let mailSubject = transactionGetSubject[0].domainvalue;

                                                mailBody = mailBody.split("{{brandname}}").join(service.brandname);
                                                mailBody = mailBody.split("{{corpid}}").join(request.user.corpid);
                                                mailBody = mailBody.split("{{email}}").join(service.email);
                                                mailBody = mailBody.split("{{firstname}}").join(service.firstname);
                                                mailBody = mailBody.split("{{lastname}}").join(service.lastname);
                                                mailBody = mailBody.split("{{orgid}}").join(request.user.orgid);
                                                mailBody = mailBody.split("{{phone}}").join(service.phone);
                                                mailBody = mailBody.split("{{username}}").join(request.user.usr);

                                                mailBody = mailBody
                                                    .split("{{brandaddress}}")
                                                    .join(service.brandaddress);

                                                mailBody = mailBody
                                                    .split("{{customerfacebookid}}")
                                                    .join(service.customerfacebookid);

                                                mailBody = mailBody
                                                    .split("{{phonenumberwhatsappbusiness}}")
                                                    .join(service.phonenumberwhatsappbusiness);

                                                mailBody = mailBody
                                                    .split("{{nameassociatednumber}}")
                                                    .join(service.nameassociatednumber);

                                                mailSubject = mailSubject.split("{{corpid}}").join(request.user.corpid);
                                                mailSubject = mailSubject.split("{{email}}").join(service.email);
                                                mailSubject = mailSubject.split("{{lastname}}").join(service.lastname);
                                                mailSubject = mailSubject.split("{{orgid}}").join(request.user.orgid);
                                                mailSubject = mailSubject.split("{{phone}}").join(service.phone);
                                                mailSubject = mailSubject.split("{{username}}").join(request.user.usr);

                                                mailSubject = mailSubject
                                                    .split("{{brandname}}")
                                                    .join(service.brandname);

                                                mailSubject = mailSubject
                                                    .split("{{brandaddress}}")
                                                    .join(service.brandaddress);

                                                mailSubject = mailSubject
                                                    .split("{{firstname}}")
                                                    .join(service.firstname);

                                                mailSubject = mailSubject
                                                    .split("{{customerfacebookid}}")
                                                    .join(service.customerfacebookid);

                                                mailSubject = mailSubject
                                                    .split("{{phonenumberwhatsappbusiness}}")
                                                    .join(service.phonenumberwhatsappbusiness);

                                                mailSubject = mailSubject
                                                    .split("{{nameassociatednumber}}")
                                                    .join(service.nameassociatednumber);

                                                const requestSendMail = await axiosObservable({
                                                    _requestid: request._requestid,
                                                    method: "post",
                                                    url: `${bridgeEndpoint}processscheduler/sendmail`,
                                                    data: {
                                                        mailAddress: mailRecipient,
                                                        mailBody: mailBody,
                                                        mailTitle: mailSubject,
                                                    },
                                                });

                                                if (!requestSendMail.data.success) {
                                                    return response.status(400).json({
                                                        error: true,
                                                        msg: requestSendMail.data.operationMessage,
                                                        success: false,
                                                    });
                                                }
                                            }
                                        } else {
                                            return response.status(400).json({
                                                error: true,
                                                msg: transactionGetBody.code,
                                                success: false,
                                            });
                                        }
                                    }
                                } else {
                                    return response.status(400).json({
                                        error: true,
                                        msg: transactionGetSubject.code,
                                        success: false,
                                    });
                                }
                            }
                        } else {
                            return response.status(400).json({
                                error: true,
                                msg: transactionGetRecipient.code,
                                success: false,
                            });
                        }
                    }

                    return response.json({
                        success: true,
                        result: transactionCreateWhatsAppSmooch[0]
                    });
                } else {
                    return response.status(400).json({
                        msg: transactionCreateWhatsAppSmooch.code,
                        success: false,
                    });
                }

            case "WHATSAPPSMOOCHINSERT":
                const requestInsertWhatsAppSmooch = await axiosObservable({
                    _requestid: request._requestid,
                    method: "post",
                    url: `${bridgeEndpoint}processlaraigo/smooch/managesmoochlink`,
                    data: {
                        apiKeyId: service.apikeyid,
                        apiKeySecret: service.apikeysecret,
                        applicationId: service.appid,
                        linkType: "WEBHOOKMIGRATE",
                    },
                });

                if (requestInsertWhatsAppSmooch.data.success) {
                    let serviceCredentials = {
                        apiKeyId: service.apikeyid,
                        apiKeySecret: service.apikeysecret,
                        appId: service.appid,
                        endpoint: "https://api.smooch.io/",
                        integrationId: requestInsertWhatsAppSmooch.data.integrationId,
                        version: "v1.1",
                    };

                    parameters.communicationchannelowner = service.appid;
                    parameters.communicationchannelsite = service.appid;
                    parameters.integrationid = requestInsertWhatsAppSmooch.data.integrationId;
                    parameters.phone = requestInsertWhatsAppSmooch.data.phoneNumber;
                    parameters.servicecredentials = JSON.stringify(serviceCredentials);
                    parameters.type = "WHAT";

                    const transactionInsertWhatsApp = await triggerfunctions.executesimpletransaction(
                        method,
                        parameters
                    );

                    if (transactionInsertWhatsApp instanceof Array) {
                        await channelfunctions.clearHookCache("SmoochService", request._requestid);

                        return response.json({
                            success: true,
                            result: transactionInsertWhatsApp[0]
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionInsertWhatsApp.code,
                            success: false,
                        });
                    }
                } else {
                    return response.status(400).json({
                        msg: requestInsertWhatsAppSmooch.data.operationMessage,
                        success: false,
                    });
                }

            case "WHATSAPPGUPSHUP":
                const requestInsertWhatsAppGupshup = await axiosObservable({
                    _requestid: request._requestid,
                    method: "post",
                    url: `${bridgeEndpoint}processlaraigo/gupshup/managegupshuplink`,
                    data: {
                        apiKey: service.apikey,
                        appId: service.appid,
                        linkType: "GUPSHUPADD",
                    },
                });

                if (requestInsertWhatsAppGupshup.data.success) {
                    let serviceCredentials = {
                        apiKey: service.apikey,
                        app: service.appname,
                        endpoint: `${requestInsertWhatsAppGupshup.data.endpoint}sm/api/v1/`,
                        number: service.appnumber,
                    };

                    parameters.communicationchannelowner = service.appid;
                    parameters.communicationchannelsite = service.appname;
                    parameters.phone = service.appnumber;
                    parameters.servicecredentials = JSON.stringify(serviceCredentials);
                    parameters.type = "WHAG";

                    const transactionInsertWhatsAppGupshup = await triggerfunctions.executesimpletransaction(
                        method,
                        parameters
                    );

                    if (transactionInsertWhatsAppGupshup instanceof Array) {
                        await channelfunctions.clearHookCache("GupshupService", request._requestid);

                        return response.json({
                            success: true,
                            result: transactionInsertWhatsAppGupshup[0]
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionInsertWhatsAppGupshup.code,
                            success: false,
                        });
                    }
                } else {
                    return response.status(400).json({
                        msg: requestInsertWhatsAppGupshup.data.operationMessage,
                        success: false,
                    });
                }

            case "WHATSAPPMETA":
                const requestCreateMeta = await axiosObservable({
                    _requestid: request._requestid,
                    method: "post",
                    url: `${bridgeEndpoint}processlaraigo/meta/managemetalink`,
                    data: {
                        accessToken: service.accesstoken,
                        linkType: "METACHECK",
                        phoneId: service.phone,
                    },
                });

                if (requestCreateMeta.data.success) {
                    let serviceCredentials = {
                        accessToken: service.accesstoken,
                        endpoint: metaEndpoint,
                        numberId: service.phone,
                        siteId: `${requestCreateMeta.data.phoneNumber}`.replace(/[^0-9.]/g, ""),
                    };

                    parameters.communicationchannelsite = `${requestCreateMeta.data.phoneNumber}`.replace(/[^0-9.]/g, "");
                    parameters.phone = `${requestCreateMeta.data.phoneNumber}`.replace(/[^0-9.]/g, "");
                    parameters.servicecredentials = JSON.stringify(serviceCredentials);
                    parameters.type = "WHAM";

                    const transactionCreateMeta = await triggerfunctions.executesimpletransaction(method, parameters);

                    if (transactionCreateMeta instanceof Array) {
                        await channelfunctions.clearHookCache("WhatsAppService", request._requestid);

                        return response.json({
                            success: true,
                            result: transactionCreateMeta[0]
                        });
                    } else {
                        return response.status(400).json({
                            msg: transactionCreateMeta.code,
                            success: false,
                        });
                    }
                } else {
                    return response.status(400).json({
                        msg: requestCreateMeta.data.operationMessage,
                        success: false,
                    });
                }

            case "VOXIMPLANTPHONE":
                let voximplantEnvironment = await channelfunctions.voximplantHandleEnvironment(
                    request.user.corpid,
                    request.user.orgid,
                    request.originalUrl,
                    request._requestid
                );

                if (voximplantEnvironment) {
                    if (
                        voximplantEnvironment.accountid &&
                        voximplantEnvironment.apikey &&
                        voximplantEnvironment.applicationid &&
                        voximplantEnvironment.userid
                    ) {
                        let voximplantScenario = await channelfunctions.voximplantHandleScenario(
                            request.user.corpid,
                            request.user.orgid,
                            voximplantEnvironment.accountid,
                            voximplantEnvironment.apikey,
                            voximplantEnvironment.applicationid,
                            request.originalUrl,
                            request._requestid
                        );

                        if (voximplantScenario) {
                            if (voximplantScenario.ruleid && voximplantScenario.scenarioid) {
                                let voximplantPhoneNumber = await channelfunctions.voximplantHandlePhoneNumber(
                                    request.user.corpid,
                                    request.user.orgid,
                                    request.user.usr,
                                    voximplantEnvironment.accountid,
                                    voximplantEnvironment.apikey,
                                    voximplantEnvironment.applicationid,
                                    voximplantScenario.ruleid,
                                    service.country,
                                    service.category,
                                    service.state,
                                    (service.region || 0).toString(),
                                    service.cost,
                                    service.costinstallation,
                                    voximplantEnvironment.additionalperchannel,
                                    request.originalUrl,
                                    request._requestid
                                );

                                if (voximplantPhoneNumber) {
                                    if (
                                        voximplantPhoneNumber.phoneid &&
                                        voximplantPhoneNumber.phonenumber &&
                                        voximplantPhoneNumber.queueid
                                    ) {
                                        let serviceCredentials = {
                                            accountid: voximplantEnvironment.accountid,
                                            additionalperchannel: voximplantEnvironment.additionalperchannel,
                                            apikey: voximplantEnvironment.apikey,
                                            applicationid: voximplantEnvironment.applicationid,
                                            applicationname: voximplantEnvironment.applicationname,
                                            callsupervision: service.callsupervision,
                                            category: service.category,
                                            categoryname: service.categoryname,
                                            cost: service.cost,
                                            costinstallation: service.costinstallation,
                                            costvca: service.costvca,
                                            country: service.country,
                                            countryname: service.countryname,
                                            outbound: service.outbound,
                                            phoneid: voximplantPhoneNumber.phoneid,
                                            phonenumber: voximplantPhoneNumber.phonenumber,
                                            queueid: voximplantPhoneNumber.queueid,
                                            recording: service.recording,
                                            recordingquality: service.recordingquality?.value,
                                            recordingstorage: service.recordingstorage?.value,
                                            region: service.region,
                                            regionname: service.regionname,
                                            ruleid: voximplantScenario.ruleid,
                                            ruleoutid: voximplantScenario.ruleoutid,
                                            scenarioid: voximplantScenario.scenarioid,
                                            scenariooutid: voximplantScenario.scenariooutid,
                                            sms: service.sms,
                                            state: service.state,
                                            statename: service.statename,
                                        };

                                        let voximplantRecording = {
                                            recording: service.recording,
                                            recordingquality: service.recordingquality?.value,
                                            recordingstorage: service.recordingstorage?.value,
                                        };

                                        parameters.communicationchannelowner = voximplantEnvironment.applicationname;
                                        parameters.communicationchannelsite = voximplantPhoneNumber.phonenumber;
                                        parameters.phone = voximplantPhoneNumber.phonenumber;
                                        parameters.servicecredentials = JSON.stringify(serviceCredentials);
                                        parameters.type = "VOXI";
                                        parameters.voximplantrecording = JSON.stringify(voximplantRecording);

                                        parameters.voximplantwelcometone =
                                            "https://staticfileszyxme.s3.us-east.cloud-object-storage.appdomain.cloud/VCA%20PERU/994eacd0-4520-4aec-8f4e-fe7dcab5f5ed/intel.mp3";

                                        parameters.voximplantholdtone =
                                            "https://staticfileszyxme.s3.us-east.cloud-object-storage.appdomain.cloud/VCA%20PERU/932a8ad1-0a67-467f-aef5-e56c52e05c3f/halos-of-eternity.mp3";

                                        const transactionCreateVoximplant =
                                            await triggerfunctions.executesimpletransaction(method, parameters);

                                        if (transactionCreateVoximplant instanceof Array) {
                                            return response.json({
                                                integrationId: voximplantPhoneNumber.phonenumber,
                                                success: true,
                                                result: transactionCreateVoximplant[0]
                                            });
                                        } else {
                                            return response.status(400).json({
                                                msg: transactionCreateVoximplant.code,
                                                success: false,
                                            });
                                        }
                                    } else {
                                        return response.status(400).json({
                                            msg: "voximplant_phonenumberqueue_error",
                                            success: false,
                                        });
                                    }
                                } else {
                                    return response.status(400).json({
                                        msg: "voximplant_phonenumberqueue_error",
                                        success: false,
                                    });
                                }
                            } else {
                                return response.status(400).json({
                                    msg: "voximplant_scenariorule_error",
                                    success: false,
                                });
                            }
                        } else {
                            return response.status(400).json({
                                msg: "voximplant_scenariorule_error",
                                success: false,
                            });
                        }
                    } else {
                        return response.status(400).json({
                            msg: "voximplant_accountapplication_error",
                            success: false,
                        });
                    }
                } else {
                    return response.status(400).json({
                        msg: "voximplant_accountapplication_error",
                        success: false,
                    });
                }

            default:
                return response.status(400).json({
                    msg: "Channel not supported",
                    success: false,
                });
        }
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            msg: exception.message,
        });
    }
};

exports.updateChannel = async (request, response) => {
    try {
        let { method, parameters = {}, service = {}, type } = request.body;

        setSessionParameters(parameters, request.user, request._requestid);

        parameters.corpid = request.user.corpid;
        parameters.orgid = request.user.orgid;
        parameters.phone = null;
        parameters.username = request.user.usr;

        if (type === "CHATWEB") {
            const webChatData = {
                applicationId: webChatApplication,
                name: parameters.description,
                status: "ACTIVO",
                type: "CHAZ",
                metadata: {
                    form: service.form ? service.form : null,
                    color: {
                        chatBackgroundColor: service.color ? service.color.background : "",
                        chatBorderColor: service.color ? service.color.border : "",
                        chatHeaderColor: service.color ? service.color.header : "",
                        iconscolor: service.color ? service.color.iconscolor : "",
                        messageBotColor: service.color ? service.color.bot : "",
                        messageClientColor: service.color ? service.color.client : "",
                    },
                    extra: {
                        abandonendpoint: `${webChatScriptEndpoint}smooch`,
                        chatTextSize: service.extra?.chatTextSize || 0,
                        chatTextWeight: service.extra?.chatTextWeight || 0,
                        cssbody: service.extra?.customcss || "",
                        enableabandon: service.extra ? service.extra.abandonevent : false,
                        enableformhistory: service.extra ? service.extra.formhistory : false,
                        enableidlemessage: service.bubble ? service.bubble.active : false,
                        headermessage: service.extra ? service.extra.botnametext : "",
                        iconColorActive: service.extra?.iconColorActive || "",
                        iconColorDisabled: service.extra?.iconColorDisabled || "",
                        inputalwaysactive: service.extra ? service.extra.persistentinput : false,
                        inputTextSize: service.extra?.inputTextSize || 0,
                        inputTextWeight: service.extra?.inputTextWeight || 0,
                        jsscript: service.extra ? service.extra.customjs : "",
                        playalertsound: service.extra ? service.extra.alertsound : false,
                        sendmetadata: service.extra ? service.extra.enablemetadata : false,
                        showchatrestart: service.extra ? service.extra.reloadchat : false,
                        showlaraigologo: service.extra ? service.extra.poweredby : false,
                        showmessageheader: service.extra ? service.extra.botnameenabled : false,
                        showplatformlogo: false,
                        uploadaudio: service.extra ? service.extra.uploadaudio : false,
                        uploadfile: service.extra ? service.extra.uploadfile : false,
                        uploadimage: service.extra ? service.extra.uploadimage : false,
                        uploadlocation: service.extra ? service.extra.uploadlocation : false,
                        uploadvideo: service.extra ? service.extra.uploadvideo : false,
                        withBorder: service.extra?.withBorder || false,
                        withHour: service.extra?.withHour || false,
                    },
                    icons: {
                        chatBotImage: service.interface ? service.interface.iconbot : "",
                        chatHeaderImage: service.interface ? service.interface.iconheader : "",
                        chatIdleImage: service.bubble ? service.bubble.iconbubble : "",
                        chatOpenImage: service.interface ? service.interface.iconbutton : "",
                    },
                    personalization: {
                        headerMessage: service.extra ? service.extra.botnametext : "",
                        headerSubTitle: service.interface ? service.interface.chatsubtitle : "",
                        headerTitle: service.interface ? service.interface.chattitle : "",
                        idleMessage: service.bubble ? service.bubble.messagebubble : "",
                    },
                },
            };

            const requestWebChatCreate = await axiosObservable({
                _requestid: request._requestid,
                data: webChatData,
                method: "put",
                url: `${brokerEndpoint}integrations/update/${parameters.communicationchannelsite}`,
            });

            if (typeof requestWebChatCreate.data.id !== "undefined" && requestWebChatCreate.data.id) {
                parameters.channelparameters = JSON.stringify(webChatData);
                parameters.servicecredentials = JSON.stringify(service);

                const transactionCreateWebChat = await triggerfunctions.executesimpletransaction(method, parameters);

                if (transactionCreateWebChat instanceof Array) {
                    return response.json({
                        integrationid: requestWebChatCreate.data.id,
                        success: true,
                    });
                } else {
                    return response.status(400).json({
                        msg: transactionCreateWebChat.code,
                        success: false,
                    });
                }
            } else {
                return response.status(400).json({
                    msg: "Could not update integration",
                    success: false,
                });
            }
        } else {
            const webChatData = {
                applicationId: webChatApplication,
                name: parameters.description,
                status: "ACTIVO",
                type: "FORM",
                metadata: {
                    form: service.form || null,
                    extra: {
                        ...(service.extra || {}),
                        corpid: request.user.corpid,
                        orgid: request.user.orgid,
                    },
                },
            };

            const requestWebChatCreate = await axiosObservable({
                _requestid: request._requestid,
                data: webChatData,
                method: "put",
                url: `${brokerEndpoint}integrations/update/${parameters.communicationchannelsite}`,
            });

            if (typeof requestWebChatCreate.data.id !== "undefined" && requestWebChatCreate.data.id) {
                parameters.channelparameters = JSON.stringify(webChatData);
                parameters.servicecredentials = JSON.stringify(service);

                const transactionCreateWebChat = await triggerfunctions.executesimpletransaction(method, parameters);

                if (transactionCreateWebChat instanceof Array) {
                    return response.json({
                        integrationid: requestWebChatCreate.data.id,
                        success: true,
                    });
                } else {
                    return response.status(400).json({
                        msg: transactionCreateWebChat.code,
                        success: false,
                    });
                }
            } else {
                return response.status(400).json({
                    msg: "Could not update integration",
                    success: false,
                });
            }
        }
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            msg: exception.message,
        });
    }
};

exports.activateChannel = async (request, response) => {
    try {
        let { method, parameters = {}, service = {} } = request.body;

        setSessionParameters(parameters, request.user, request._requestid);

        parameters.apikey = null;
        parameters.appintegrationid = null;
        parameters.botconfigurationid = null;
        parameters.botenabled = true;
        parameters.channelparameters = null;
        parameters.communicationchannelcontact = "";
        parameters.communicationchanneltoken = "";
        parameters.corpid = request.user.corpid;
        parameters.country = null;
        parameters.customicon = null;
        parameters.motive = "Activate from API";
        parameters.operation = "UPDATE";
        parameters.orgid = request.user.orgid;
        parameters.phone = null;
        parameters.resolvelithium = null;
        parameters.schedule = null;
        parameters.status = "ACTIVO";
        parameters.updintegration = null;
        parameters.username = request.user.usr;
        parameters.voximplantholdtone = null;
        parameters.voximplantrecording = null;
        parameters.voximplantwelcometone = null;

        if (request.body.type === "WHATSAPP") {
            const requestCreateWhatsApp = await axiosObservable({
                _requestid: request._requestid,
                method: "post",
                url: `${bridgeEndpoint}processlaraigo/whatsapp/managewhatsapplink`,
                data: {
                    accessToken: service.accesstoken,
                    isCloud: !!service.iscloud,
                    linkType: "WHATSAPPADD",
                },
            });

            if (requestCreateWhatsApp.data.success) {
                let serviceCredentials = {
                    apiKey: service.accesstoken,
                    endpoint: service.iscloud ? whatsAppCloudEndpoint : whatsAppEndpoint,
                    isCloud: !!service.iscloud,
                    number: requestCreateWhatsApp.data.phoneNumber,
                };

                parameters.communicationchannelsite = requestCreateWhatsApp.data.phoneNumber;
                parameters.phone = requestCreateWhatsApp.data.phoneNumber;
                parameters.servicecredentials = JSON.stringify(serviceCredentials);
                parameters.type = "WHAD";

                const transactionActivateWhatsApp = await triggerfunctions.executesimpletransaction(method, parameters);

                if (transactionActivateWhatsApp instanceof Array) {
                    return response.json({
                        success: true,
                    });
                } else {
                    return response.status(400).json({
                        msg: transactionActivateWhatsApp.code,
                        success: false,
                    });
                }
            } else {
                return response.status(400).json({
                    msg: requestCreateWhatsApp.data.operationMessage,
                    success: false,
                });
            }
        } else {
            const requestMigrateWhatsApp = await axiosObservable({
                _requestid: request._requestid,
                method: "post",
                url: `${bridgeEndpoint}processlaraigo/smooch/managesmoochlink`,
                data: {
                    apiKeyId: service.apikeyid,
                    apiKeySecret: service.apikeysecret,
                    applicationId: service.appid,
                    linkType: "WEBHOOKMIGRATE",
                },
            });

            if (requestMigrateWhatsApp.data.success) {
                parameters.servicecredentials = JSON.stringify({
                    apiKeyId: service.apikeyid,
                    apiKeySecret: service.apikeysecret,
                    appId: service.appid,
                    endpoint: "https://api.smooch.io/",
                    integrationId: requestMigrateWhatsApp.data.integrationId,
                    version: "v1.1",
                });

                parameters.communicationchannelowner = service.appid;
                parameters.communicationchannelsite = service.appid;
                parameters.integrationid = requestMigrateWhatsApp.data.integrationId;
                parameters.phone = requestMigrateWhatsApp.data.phoneNumber;
                parameters.type = "WHAT";

                const transactionActivateWhatsApp = await triggerfunctions.executesimpletransaction(method, parameters);

                if (transactionActivateWhatsApp instanceof Array) {
                    return response.json({
                        success: true,
                    });
                } else {
                    return response.status(400).json({
                        msg: transactionActivateWhatsApp.code,
                        success: false,
                    });
                }
            } else {
                return response.status(400).json({
                    msg: requestMigrateWhatsApp.data.operationMessage,
                    success: false,
                });
            }
        }
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            msg: exception.message,
        });
    }
};

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
            let { corpid, orgid } = request.body;

            if (!corpid) {
                corpid = request.user?.corpid;
            }

            if (!orgid) {
                orgid = request.user?.orgid;
            }

            if (corpid && orgid) {
                const channeldata = await getChannelData(corpid, orgid, 0, request._requestid);

                if (channeldata) {
                    for (const communicationchannel of channeldata) {
                        let templatelist = [];

                        const servicecredentials = JSON.parse(communicationchannel.servicecredentials);

                        if (communicationchannel.servicecredentials) {
                            switch (communicationchannel.type) {
                                case "WHAM":
                                    const requestListMeta = await axiosObservable({
                                        _requestid: request._requestid,
                                        method: "post",
                                        url: `${bridgeEndpoint}processlaraigo/meta/metamessagetemplate`,
                                        data: {
                                            AccessToken: servicecredentials.accessToken,
                                            NumberId: servicecredentials.numberId,
                                            Type: "LIST",
                                        },
                                    });

                                    if (requestListMeta.data.success) {
                                        if (requestListMeta.data.templateList) {
                                            templatelist = [...templatelist, ...requestListMeta.data.templateList];
                                        }
                                    } else {
                                        requestCode = requestListMeta.data.operationMessage;
                                        requestMessage = requestListMeta.data.operationMessage;
                                    }
                                    break;

                                case "WHAD":
                                    const requestListDialog = await axiosObservable({
                                        _requestid: request._requestid,
                                        method: "post",
                                        url: `${bridgeEndpoint}processlaraigo/dialog360/dialog360messagetemplate`,
                                        data: {
                                            ApiKey: servicecredentials.apiKey,
                                            IsCloud: !!servicecredentials.isCloud,
                                            Type: "LIST",
                                        },
                                    });

                                    if (requestListDialog.data.success) {
                                        if (requestListDialog.data.templateList) {
                                            templatelist = [...templatelist, ...requestListDialog.data.templateList];
                                        }
                                    } else {
                                        requestCode = requestListDialog.data.operationMessage;
                                        requestMessage = requestListDialog.data.operationMessage;
                                    }
                                    break;

                                case "WHAG":
                                    const requestListGupshup = await axiosObservable({
                                        _requestid: request._requestid,
                                        method: "post",
                                        url: `${bridgeEndpoint}processlaraigo/gupshup/gupshupmessagetemplate`,
                                        data: {
                                            ApiKey: servicecredentials.apiKey,
                                            AppName: servicecredentials.app,
                                            Type: "LIST",
                                        },
                                    });

                                    if (requestListGupshup.data.success) {
                                        if (requestListGupshup.data.templateList) {
                                            templatelist = [...templatelist, ...requestListGupshup.data.templateList];
                                        }
                                    } else {
                                        requestCode = requestListGupshup.data.operationMessage;
                                        requestMessage = requestListGupshup.data.operationMessage;
                                    }
                                    break;
                            }
                        }

                        if (templatelist) {
                            if (templatelist.length > 0) {
                                await channelfunctions.messageTemplateReset(
                                    corpid,
                                    orgid,
                                    communicationchannel.communicationchannelid,
                                    templatelist[0].namespace || null,
                                    request.user?.usr || "scheduler",
                                    request._requestid,
                                );

                                for (const templatedata of templatelist) {
                                    let authenticationData = null;
                                    let bodyData = null;
                                    let buttonGenericData = null;
                                    let buttonQuickReplyData = null;
                                    let carouselData = null;
                                    let footerData = null;
                                    let headerData = null;

                                    if (templatedata.category === "AUTHENTICATION") {
                                        authenticationData = {
                                            buttonautofilltext: null,
                                            buttonotptype: null,
                                            buttonpackagename: null,
                                            buttonsignaturehash: null,
                                            buttontext: null,
                                            buttontype: null,
                                            codeexpirationminutes: 0,
                                            configurevalidityperiod: false,
                                            safetyrecommendation: false,
                                            showexpirationdate: false,
                                            validityperiod: null,
                                        }

                                        if (templatedata.components) {
                                            for (const templatecomponent of templatedata.components) {
                                                if (templatedata.messageSendTtlSeconds) {
                                                    authenticationData.configurevalidityperiod = true;
                                                    authenticationData.validityperiod = templatedata.messageSendTtlSeconds;
                                                }

                                                if (templatecomponent.type === "BODY") {
                                                    authenticationData.safetyrecommendation = templatecomponent.addSecurityRecommendation;
                                                }

                                                if (templatecomponent.type === "FOOTER") {
                                                    authenticationData.codeexpirationminutes = templatecomponent.codeExpirationMinutes;

                                                    if (authenticationData.codeexpirationminutes) {
                                                        authenticationData.showexpirationdate = true;
                                                    }
                                                }

                                                if (templatecomponent.type === "BUTTONS") {
                                                    if (templatecomponent.buttons) {
                                                        for (const templatebutton of templatecomponent.buttons) {
                                                            authenticationData.buttonautofilltext = templatebutton.autofillText;
                                                            authenticationData.buttonotptype = templatebutton.otpType;
                                                            authenticationData.buttonpackagename = templatebutton.packageName;
                                                            authenticationData.buttonsignaturehash = templatebutton.signatureHash;
                                                            authenticationData.buttontext = templatebutton.text;
                                                            authenticationData.buttontype = templatebutton.type;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        if (templatedata.components) {
                                            for (const templatecomponent of templatedata.components) {
                                                if (templatecomponent.type === "BODY") {
                                                    bodyData = {
                                                        text: templatecomponent.text,
                                                    }

                                                    if (templatecomponent.example) {
                                                        if (templatecomponent.example.bodyText) {
                                                            bodyData.example = templatecomponent.example.bodyText;
                                                        }
                                                    }
                                                }

                                                if (templatecomponent.type === "FOOTER") {
                                                    footerData = {
                                                        text: templatecomponent.text,
                                                    }
                                                }

                                                if (templatecomponent.type === "HEADER") {
                                                    headerData = {
                                                        text: templatecomponent.text,
                                                        type: templatecomponent.format,
                                                    }

                                                    if (templatecomponent.example) {
                                                        if (templatecomponent.example.headerHandle) {
                                                            headerData.example = templatecomponent.example.headerHandle;
                                                            headerData.text = headerData.text || templatecomponent.example.headerHandle[0];
                                                        }

                                                        if (templatecomponent.example.headerText) {
                                                            headerData.example = templatecomponent.example.headerText;
                                                        }
                                                    }
                                                }

                                                if (templatecomponent.type === "BUTTONS") {
                                                    buttonGenericData = [];
                                                    buttonQuickReplyData = [];

                                                    if (templatecomponent.buttons) {
                                                        for (const templatebutton of templatecomponent.buttons) {
                                                            if (templatebutton.type === "QUICK_REPLY") {
                                                                buttonQuickReplyData.push({
                                                                    type: templatebutton.type,
                                                                    btn: {
                                                                        payload: templatebutton.text,
                                                                        text: templatebutton.text,
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                buttonGenericData.push({
                                                                    type: templatebutton.type,
                                                                    btn: {
                                                                        code: templatebutton.countryCode,
                                                                        phone_number: templatebutton.phoneNumber,
                                                                        text: templatebutton.text,
                                                                        type: templatebutton.example ? "dynamic" : "static",
                                                                        url: templatebutton.url,
                                                                        variables: templatebutton.example,
                                                                    }
                                                                });
                                                            }
                                                        }
                                                    }
                                                }

                                                if (templatecomponent.type === "CAROUSEL") {
                                                    if (templatecomponent.cards) {
                                                        carouselData = [];

                                                        for (const templatecarousel of templatecomponent.cards) {
                                                            if (templatecarousel.components) {
                                                                carouselComponent = {
                                                                    body: null,
                                                                    header: null,
                                                                    headertype: null,
                                                                    buttons: [],
                                                                };

                                                                for (const templatecarouselcomponent of templatecarousel.components) {
                                                                    if (templatecarouselcomponent.type === "BODY") {
                                                                        carouselComponent.body = templatecarouselcomponent.text;

                                                                        if (templatecarouselcomponent.example) {
                                                                            if (templatecarouselcomponent.example.bodyText) {
                                                                                carouselComponent.bodyvariables = templatecarouselcomponent.example.bodyText;
                                                                            }
                                                                        }
                                                                    }

                                                                    if (templatecarouselcomponent.type === "HEADER") {
                                                                        carouselComponent.header = templatecarouselcomponent.text;
                                                                        carouselComponent.headertype = templatecarouselcomponent.format;

                                                                        if (templatecarouselcomponent.example) {
                                                                            if (templatecarouselcomponent.example.headerHandle) {
                                                                                carouselComponent.header = carouselComponent.header || templatecarouselcomponent.example.headerHandle[0];
                                                                            }
                                                                        }
                                                                    }

                                                                    if (templatecarouselcomponent.type === "BUTTONS") {
                                                                        if (templatecarouselcomponent.buttons) {
                                                                            for (const templatecarouselcomponentbutton of templatecarouselcomponent.buttons) {
                                                                                carouselComponent.buttons.push({
                                                                                    type: templatecarouselcomponentbutton.type,
                                                                                    btn: {
                                                                                        payload: templatecarouselcomponentbutton.text,
                                                                                        code: templatecarouselcomponentbutton.countryCode,
                                                                                        phone_number: templatecarouselcomponentbutton.phoneNumber,
                                                                                        text: templatecarouselcomponentbutton.text,
                                                                                        type: templatecarouselcomponentbutton.example ? "dynamic" : "static",
                                                                                        url: templatecarouselcomponentbutton.url,
                                                                                        variables: templatecarouselcomponentbutton.example,
                                                                                    }
                                                                                });
                                                                            }
                                                                        }
                                                                    }
                                                                }

                                                                carouselData.push(carouselComponent);
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    const templateType = carouselData ? "CAROUSEL" : ((authenticationData || buttonGenericData || buttonQuickReplyData || footerData || headerData) ? "MULTIMEDIA" : "STANDARD");

                                    await channelfunctions.messageTemplateUpd(
                                        corpid,
                                        orgid,
                                        '',
                                        "HSM",
                                        "ACTIVO",
                                        templatedata.name || null,
                                        templatedata.namespace || null,
                                        templatedata.category || null,
                                        templatedata.language || null,
                                        templateType || null,
                                        headerData ? true : false,
                                        headerData ? headerData.type : null,
                                        headerData ? headerData.text : null,
                                        bodyData ? bodyData.text : null,
                                        footerData ? true : false,
                                        footerData ? footerData.text : null,
                                        (buttonGenericData || buttonQuickReplyData) ? true : false,
                                        2,
                                        null,
                                        communicationchannel.communicationchannelid,
                                        communicationchannel.type,
                                        authenticationData ? JSON.stringify(authenticationData) : null,
                                        bodyData ? (bodyData.example ? JSON.stringify(bodyData.example) : null) : null,
                                        buttonGenericData ? JSON.stringify(buttonGenericData) : null,
                                        buttonQuickReplyData ? JSON.stringify(buttonQuickReplyData) : null,
                                        carouselData ? JSON.stringify(carouselData) : null,
                                        headerData ? JSON.stringify(headerData.example) : null,
                                        templatedata.wabaAccountId || null,
                                        templatedata.externalId || null,
                                        templatedata.id || null,
                                        null,
                                        templatedata.partnerId || null,
                                        null,
                                        templatedata.status || null,
                                        request.user?.usr || "scheduler",
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
                }
            }
        }

        return response.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
};

exports.addTemplate = async (request, response) => {
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
            const { communicationchannelid } = request.body;

            if (communicationchannelid) {
                let createsuccess = false;

                const channellist = await getChannelData(request.user.corpid, request.user.orgid, communicationchannelid, request._requestid);

                if (channellist) {
                    if (channellist[0]) {
                        const channeldata = channellist[0];

                        if (channeldata.servicecredentials) {
                            const servicecredentials = JSON.parse(channeldata.servicecredentials);

                            let templatebody = request.body;

                            templatebody.authenticationdata = templatebody.authenticationdata ? JSON.parse(templatebody.authenticationdata) : null;
                            templatebody.bodyvariables = templatebody.bodyvariables ? JSON.parse(templatebody.bodyvariables) : null;
                            templatebody.buttonsgeneric = templatebody.buttonsgeneric ? JSON.parse(templatebody.buttonsgeneric) : null;
                            templatebody.buttonsquickreply = templatebody.buttonsquickreply ? JSON.parse(templatebody.buttonsquickreply) : null;
                            templatebody.carouseldata = templatebody.carouseldata ? JSON.parse(templatebody.carouseldata) : null;
                            templatebody.headervariables = templatebody.headervariables ? JSON.parse(templatebody.headervariables) : null;

                            switch (channeldata.type) {
                                case "WHAD":
                                    const requestCreateDialog = await axiosObservable({
                                        _requestid: request._requestid,
                                        method: "post",
                                        url: `${bridgeEndpoint}processlaraigo/dialog360/dialog360messagetemplate`,
                                        data: {
                                            ApiKey: servicecredentials.apiKey,
                                            IsCloud: !!servicecredentials.isCloud,
                                            TemplateData: templatebody,
                                            Type: "CREATE",
                                        },
                                    });

                                    if (requestCreateDialog.data.success) {
                                        let parameters = request.body;

                                        parameters.corpid = request.user.corpid;
                                        parameters.orgid = request.user.orgid;
                                        parameters.username = request.user.usr;
                                        parameters.namespace = requestCreateDialog.data.namespace || null;
                                        parameters.status = requestCreateDialog.data.status || null;
                                        parameters.authenticationdata = parameters.authenticationdata ? JSON.stringify(parameters.authenticationdata) : null;
                                        parameters.bodyvariables = parameters.bodyvariables ? JSON.stringify(parameters.bodyvariables) : null;
                                        parameters.buttonsgeneric = parameters.buttonsgeneric ? JSON.stringify(parameters.buttonsgeneric) : null;
                                        parameters.buttonsquickreply = parameters.buttonsquickreply ? JSON.stringify(parameters.buttonsquickreply) : null;
                                        parameters.carouseldata = parameters.carouseldata ? JSON.stringify(parameters.carouseldata) : null;
                                        parameters.headervariables = parameters.headervariables ? JSON.stringify(parameters.headervariables) : null;

                                        const queryMessageTemplateCreate = await triggerfunctions.executesimpletransaction(
                                            "UFN_MESSAGETEMPLATE_INS",
                                            parameters,
                                        );

                                        if (queryMessageTemplateCreate instanceof Array) {
                                            createsuccess = true;
                                        } else {
                                            requestCode = queryMessageTemplateCreate.code;
                                            requestMessage = queryMessageTemplateCreate.code;
                                        }
                                    } else {
                                        requestCode = requestCreateDialog.data.operationMessage;
                                        requestMessage = requestCreateDialog.data.operationMessage;
                                    }
                                    break;

                                case "WHAM":
                                    const requestCreateMeta = await axiosObservable({
                                        _requestid: request._requestid,
                                        method: "post",
                                        url: `${bridgeEndpoint}processlaraigo/meta/metamessagetemplate`,
                                        data: {
                                            AccessToken: servicecredentials.accessToken,
                                            NumberId: servicecredentials.numberId,
                                            TemplateData: templatebody,
                                            Type: "CREATE",
                                        },
                                    });

                                    if (requestCreateMeta.data.success) {
                                        let parameters = request.body;

                                        parameters.corpid = request.user.corpid;
                                        parameters.orgid = request.user.orgid;
                                        parameters.username = request.user.usr;
                                        parameters.namespace = requestCreateMeta.data.namespace || null;
                                        parameters.status = requestCreateMeta.data.status || null;
                                        parameters.authenticationdata = parameters.authenticationdata ? JSON.stringify(parameters.authenticationdata) : null;
                                        parameters.bodyvariables = parameters.bodyvariables ? JSON.stringify(parameters.bodyvariables) : null;
                                        parameters.buttonsgeneric = parameters.buttonsgeneric ? JSON.stringify(parameters.buttonsgeneric) : null;
                                        parameters.buttonsquickreply = parameters.buttonsquickreply ? JSON.stringify(parameters.buttonsquickreply) : null;
                                        parameters.carouseldata = parameters.carouseldata ? JSON.stringify(parameters.carouseldata) : null;
                                        parameters.headervariables = parameters.headervariables ? JSON.stringify(parameters.headervariables) : null;

                                        const queryMessageTemplateCreate = await triggerfunctions.executesimpletransaction(
                                            "UFN_MESSAGETEMPLATE_INS",
                                            parameters,
                                        );

                                        if (queryMessageTemplateCreate instanceof Array) {
                                            createsuccess = true;
                                        } else {
                                            requestCode = queryMessageTemplateCreate.code;
                                            requestMessage = queryMessageTemplateCreate.code;
                                        }
                                    } else {
                                        requestCode = requestCreateMeta.data.operationMessage;
                                        requestMessage = requestCreateMeta.data.operationMessage;
                                    }
                                    break;
                            }
                        }
                    }
                }

                if (createsuccess) {
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
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
};

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
            const { messagetemplatelist } = request.body;

            if (messagetemplatelist) {
                for (const messagetemplate of messagetemplatelist) {
                    let deletesuccess = true;

                    if (messagetemplate.communicationchannelid) {
                        const channellist = await getChannelData(request.user.corpid, request.user.orgid, messagetemplate.communicationchannelid, request._requestid);

                        if (channellist) {
                            if (channellist[0]) {
                                const channeldata = channellist[0];

                                if (channeldata.servicecredentials) {
                                    deletesuccess = false;

                                    const servicecredentials = JSON.parse(channeldata.servicecredentials);

                                    switch (messagetemplate.communicationchanneltype) {
                                        case "WHAD":
                                            const requestDeleteDialog = await axiosObservable({
                                                _requestid: request._requestid,
                                                method: "post",
                                                url: `${bridgeEndpoint}processlaraigo/dialog360/dialog360messagetemplate`,
                                                data: {
                                                    ApiKey: servicecredentials.apiKey,
                                                    IsCloud: !!servicecredentials.isCloud,
                                                    TemplateName: messagetemplate.name,
                                                    Type: "DELETE",
                                                },
                                            });

                                            if (requestDeleteDialog.data.success) {
                                                deletesuccess = true;
                                            } else {
                                                requestCode = requestDeleteDialog.data.operationMessage;
                                                requestMessage = requestDeleteDialog.data.operationMessage;
                                            }
                                            break;

                                        case "WHAM":
                                            const requestDeleteMeta = await axiosObservable({
                                                _requestid: request._requestid,
                                                method: "post",
                                                url: `${bridgeEndpoint}processlaraigo/meta/metamessagetemplate`,
                                                data: {
                                                    AccessToken: servicecredentials.accessToken,
                                                    NumberId: servicecredentials.numberId,
                                                    TemplateName: messagetemplate.name,
                                                    Type: "DELETE",
                                                },
                                            });

                                            if (requestDeleteMeta.data.success) {
                                                deletesuccess = true;
                                            } else {
                                                requestCode = requestDeleteMeta.data.operationMessage;
                                                requestMessage = requestDeleteMeta.data.operationMessage;
                                            }
                                            break;

                                        default:
                                            deletesuccess = true;
                                            break;
                                    }
                                }
                            }
                        }
                    } else {
                        deletesuccess = true;
                    }

                    if (deletesuccess) {
                        let parameters = messagetemplate;

                        parameters.corpid = request.user.corpid;
                        parameters.orgid = request.user.orgid;
                        parameters.username = request.user.usr;
                        parameters.authenticationdata = messagetemplate.authenticationdata ? JSON.stringify(messagetemplate.authenticationdata) : null;
                        parameters.bodyvariables = messagetemplate.bodyvariables ? JSON.stringify(messagetemplate.bodyvariables) : null;
                        parameters.buttonsgeneric = messagetemplate.buttonsgeneric ? JSON.stringify(messagetemplate.buttonsgeneric) : null;
                        parameters.buttonsquickreply = messagetemplate.buttonsquickreply ? JSON.stringify(messagetemplate.buttonsquickreply) : null;
                        parameters.carouseldata = messagetemplate.carouseldata ? JSON.stringify(messagetemplate.carouseldata) : null;
                        parameters.headervariables = messagetemplate.headervariables ? JSON.stringify(messagetemplate.headervariables) : null;

                        const queryMessageTemplateDelete = await triggerfunctions.executesimpletransaction(
                            "UFN_MESSAGETEMPLATE_INS",
                            parameters,
                        );

                        if (queryMessageTemplateDelete instanceof Array) {
                            requestCode = "";
                            requestMessage = "";
                            requestStatus = 200;
                            requestSuccess = true;
                        } else {
                            requestCode = queryMessageTemplateDelete.code;
                            requestMessage = queryMessageTemplateDelete.code;
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
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
};

const getChannelData = async (corpId, orgId, communicationChannelId, requestId) => {
    if (orgId) {
        const queryString = "UFN_COMMUNICATIONCHANNEL_SEL_WHATSAPP_PROVIDER";
        const queryParameters = {
            corpid: corpId,
            orgid: orgId,
            communicationchannelid: communicationChannelId,
            _requestid: requestId,
        }

        const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);

        if (queryResult instanceof Array) {
            return queryResult;
        }
    }

    return null;
}