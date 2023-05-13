const { getErrorCode } = require('../config/helpers');

const triggerfunctions = require('../config/triggerfunctions');

exports.schedulePost = async (request, response) => {
    var requestCode = "error_unexpected_error";
    var requestMessage = "error_unexpected_error";
    var requestStatus = 400;
    var requestSuccess = false;

    try {
        const { corpid, orgid, usr } = request.user;

        if (request.body) {
            if (request.body.data) {
                if (request.body.data.channeldata) {
                    var scheduleDate = new Date(request.body.date);
                    var scheduleTime = new Date(request.body.time);

                    for (let counter = 0; counter < request.body.data.channeldata.length; counter++) {
                        var parameters = {
                            corpid: corpid || 0,
                            orgid: orgid || 0,
                            communicationchannelid: request.body.data.channeldata[counter].communicationchannelid || 0,
                            communicationchanneltype: request.body.data.channeldata[counter].type || '',
                            posthistoryid: 0,
                            status: request.body.type === "DRAFT" ? "DRAFT" : "SCHEDULED",
                            type: request.body.publication || '',
                            publishdate: `${scheduleDate.toISOString()?.split('T')[0]}T${scheduleTime.toISOString()?.split('T')[1]}`,
                            texttitle: request.body.data.texttitle || '',
                            textbody: request.body.data.textbody || '',
                            hashtag: request.body.data.hashtag || '',
                            sentiment: request.body.data.sentiment || '',
                            activity: request.body.data.activity || '',
                            mediatype: request.body.data.mediatype || '',
                            medialink: JSON.stringify(request.body.data.mediadata),
                            username: usr || '',
                            operation: 'INSERT',
                        }

                        switch (request.body.data.channeldata[counter].type) {
                            case "FBWA":
                                parameters.textbody = request.body.data.textcustomfacebook || textbody;
                                break;

                            case "INST":
                                parameters.textbody = request.body.data.textcustominstagram || textbody;
                                break;

                            case "YOUT":
                                parameters.textbody = request.body.data.textcustomyoutube || textbody;
                                break;

                            case "LNKD":
                                parameters.textbody = request.body.data.textcustomlinkedin || textbody;
                                break;

                            case "TKTK":
                            case "TKTA":
                                parameters.textbody = request.body.data.textcustomtiktok || textbody;
                                break;

                            case "TWIT":
                                parameters.textbody = request.body.data.textcustomtwitter || textbody;
                                break;
                        }

                        const queryResult = await triggerfunctions.executesimpletransaction("UFN_POSTHISTORY_INS", parameters);

                        if (queryResult instanceof Array) {
                            requestCode = "";
                            requestMessage = "";
                            requestStatus = 200;
                            requestSuccess = true;
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
            message: exception.message
        });
    }
}