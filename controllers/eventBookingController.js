const { executesimpletransaction } = require('../config/triggerfunctions');
const { getErrorCode, errors, axiosObservable } = require('../config/helpers');

const method_allowed = ["QUERY_GET_PERSON_FROM_BOOKING", "QUERY_EVENT_BY_CODE", "UFN_CALENDARYBOOKING_INS", "UFN_CALENDARYBOOKING_SEL_DATETIME","QUERY_GET_EVENTS_PER_PERSON",
                        "QUERY_CANCEL_EVENT_BY_CALENDARBOOKINGID","QUERY_GET_EVENT_BY_BOOKINGID"]

// var https = require('https');

// const agent = new https.Agent({
//     rejectUnauthorized: false
// });

const send = async (data, requestid) => {

    data._requestid = requestid;

    try {
        if (data.listmembers.every(x => !!x.personid)) {
            await executesimpletransaction("QUERY_UPDATE_PERSON_BY_HSM", undefined, false, {
                personids: data.listmembers.map(x => x.personid),
                corpid: data.corpid,
                orgid: data.orgid,
                _requestid: requestid,
            })
        }

        if (data.type === "MAIL" || data.type === "EMAIL") {
            let jsonconfigmail = "";
            const resBD = await Promise.all([
                executesimpletransaction("QUERY_GET_CONFIG_MAIL", data),
                executesimpletransaction("QUERY_GET_MESSAGETEMPLATE", data),
            ]);
            const configmail = resBD[0];
            const mailtemplate = resBD[1][0];

            if (configmail instanceof Array && configmail.length > 0) {
                jsonconfigmail = JSON.stringify({
                    username: configmail[0].email,
                    password: configmail[0].pass,
                    port: configmail[0].port,
                    host: configmail[0].host,
                    enableSsl: configmail[0].ssl,
                    default_credentials: configmail[0].default_credentials,
                })
            }

            data.listmembers.forEach(async x => {
                const resCheck = await executesimpletransaction("UFN_BALANCE_CHECK", { ...data, receiver: x.email, communicationchannelid: 0 })

                let send = false;
                if (resCheck instanceof Array && resCheck.length > 0) {
                    data.fee = resCheck[0].fee;
                    const balanceid = resCheck[0].balanceid;

                    if (balanceid == 0) {
                        send = true;
                    } else {
                        const resValidate = await executesimpletransaction("UFN_BALANCE_OUTPUT", { ...data, receiver: x.email, communicationchannelid: 0 })
                        if (resValidate instanceof Array) {
                            send = true;
                        }
                    }
                }

                if (send) {
                    executesimpletransaction("QUERY_INSERT_TASK_SCHEDULER", {
                        corpid: data.corpid,
                        orgid: data.orgid,
                        tasktype: "sendmail",
                        taskbody: JSON.stringify({
                            messagetype: "OWNERBODY",
                            receiver: x.email,
                            subject: mailtemplate.header,
                            priority: mailtemplate.priority,
                            body: x.parameters.reduce((acc, item) => acc.replace(`{{${item.name}}}`, item.text), mailtemplate.body),
                            blindreceiver: "",
                            copyreceiver: "",
                            credentials: jsonconfigmail,
                            config: {
                                CommunicationChannelSite: "",
                                FirstName: x.firstname,
                                LastName: x.lastname,
                                HsmTo: x.email,
                                Origin: "EXTERNAL",
                                MessageTemplateId: data.hsmtemplateid,
                                ShippingReason: data.shippingreason,
                                HsmId: data.hsmtemplatename,
                                Body: x.parameters.reduce((acc, item) => acc.replace(`{{${item.name}}}`, item.text), mailtemplate.body)
                            },
                            attachments: mailtemplate.attachment ? mailtemplate.attachment.split(",").map(x => ({
                                type: 'FILE',
                                value: x?.value ? x.value : x,
                            })) : []
                        }),
                        repeatflag: false,
                        repeatmode: 0,
                        repeatinterval: 0,
                        completed: false,
                        _requestid: requestid,
                    })
                } else {
                    executesimpletransaction("QUERY_INSERT_HSM_HISTORY", {
                        ...data,
                        status: 'FINALIZADO',
                        success: false,
                        message: 'no credit',
                        messatemplateid: data.hsmtemplateid,
                        config: JSON.stringify({
                            CommunicationChannelSite: "zyxme@vcaperu.com",
                            FirstName: x.firstname,
                            LastName: x.lastname,
                            HsmTo: x.email,
                            Origin: "EXTERNAL",
                            MessageTemplateId: data.hsmtemplateid,
                            ShippingReason: data.shippingreason,
                            HsmId: data.hsmtemplatename,
                            Body: x.parameters.reduce((acc, item) => acc.replace(`{{${item.name}}}`, item.text), mailtemplate.body)
                        }),
                    })
                }
            })
        } else {
            if (data.type === "SMS") {
                const smschannel = await executesimpletransaction("QUERY_GET_SMS_DEFAULT_BY_ORG", data);
                if (smschannel[0] && smschannel) {
                    data.communicationchannelid = smschannel[0].communicationchannelid;
                    data.communicationchanneltype = smschannel[0].type;
                    data.platformtype = smschannel[0].type;
                }
            }

            const responseservices = await axiosObservable({
                url: `${process.env.SERVICES}handler/external/sendhsm`,
                data,
                method: "post",
                _requestid: requestid,
            });
            if (!responseservices.data || !responseservices.data instanceof Object) {
                return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));
            }
        }
    }
    catch (exception) {
        getErrorCode(null, exception, `Request to ${req.originalUrl}`, data._requestid);
    }
}

exports.Collection = async (req, res) => {
    const { parameters = {}, method, key } = req.body;

    if (!method_allowed.includes(method)) {
        const resError = getErrorCode(errors.FORBIDDEN);
        return res.status(resError.rescode).json(resError);
    }

    parameters._requestid = req._requestid;

    const result = await executesimpletransaction(method, parameters);

    if (!result.error) {
        if (method === "UFN_CALENDARYBOOKING_INS") {
            const resultCalendar = await executesimpletransaction("QUERY_EVENT_BY_CALENDAR_EVENT_ID", parameters);

            const { communicationchannelid, messagetemplateid, notificationtype, messagetemplatename, communicationchanneltype } = resultCalendar[0]

            if (notificationtype === "EMAIL") {
                const sendmessage = {
                    corpid: parameters.corpid,
                    orgid: parameters.orgid,
                    username: parameters.username,
                    communicationchannelid: communicationchannelid,
                    hsmtemplateid: messagetemplateid,
                    type: "EMAIL",
                    shippingreason: "BOOKING",
                    _requestid: req._requestid,
                    hsmtemplatename: messagetemplatename,
                    communicationchanneltype: communicationchanneltype,
                    platformtype: communicationchanneltype,
                    userid: 0,
                    listmembers: [{
                        phone: parameters.phone,
                        firstname: parameters.name,
                        email: parameters.email,
                        lastname: "",
                        parameters: parameters.parameters
                    }]
                }

                await send(sendmessage, req._requestid);
            }

            if (!!parameters.conversationid && !!parameters.personid) {
                const dataServices = {
                    corpid: parameters.corpid,
                    orgid: parameters.orgid,
                    conversationid: parameters.conversationid,
                    personid: parameters.personid,
                    ...(parameters.parameters.reduce((acc, item) => ({ ...acc, [item.name]: item.text }), {}))
                }

                await axiosObservable({
                    url: `${process.env.SERVICES}handler/sendbooking`,
                    data: dataServices,
                    method: "post",
                    _requestid: req._requestid,
                });
            }
        }
        return res.json({ error: false, success: true, data: result, key });
    }
    else
        return res.status(result.rescode).json(({ ...result, key }));
}

exports.CancelEvent = async (req,res) => {
    const { orgid, corpid,calendarbookingid } = req.params;
    const { parameters = {}, method, key} = req.body;
    
    parameters.corpid = Number(corpid);
    parameters.orgid = Number(orgid);
    parameters.calendarbookingid = Number(calendarbookingid);

    
    if (!method_allowed.includes(method)) {
        const resError = getErrorCode(errors.FORBIDDEN);
        return res.status(resError.rescode).json(resError);
    }

    parameters._requestid = req._requestid;

    const result = await executesimpletransaction(method, parameters);

    if (!result.error) {
        return res.json({ error: false, success: true, data: result, key });
    }
    else
        return res.status(result.rescode).json(({ ...result, key }));
}

exports.GetEventByBookingid = async (req,res) => {
    const { parameters = {}, method, key} = req.body;

    if (!method_allowed.includes(method)) {
        const resError = getErrorCode(errors.FORBIDDEN);
        return res.status(resError.rescode).json(resError);
    }

    const result = await executesimpletransaction(method, parameters);

    if (!result.error) {
        return res.json({ error: false, success: true, data: result, key });
    }
    else
        return res.status(result.rescode).json(({ ...result, key }));
}