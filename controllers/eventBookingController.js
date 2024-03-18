const { executesimpletransaction, uploadBufferToCos } = require('../config/triggerfunctions');
const { getErrorCode, errors, axiosObservable } = require('../config/helpers');
const logger = require('../config/winston');
const { setSessionParameters } = require('../config/helpers');
const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');
const ical = require('ical-generator').default;
const { ICalCalendarMethod } = require('ical-generator');
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");

const method_allowed = [
    "QUERY_GET_PERSON_FROM_BOOKING",
    "QUERY_EVENT_BY_CODE",
    "UFN_CALENDARYBOOKING_INS",
    "UFN_CALENDARYBOOKING_SEL_DATETIME",
    "QUERY_GET_EVENTS_PER_PERSON",
    "QUERY_CANCEL_EVENT_BY_CALENDARBOOKINGID",
    "QUERY_GET_EVENT_BY_BOOKINGID",
    "QUERY_EVENT_BY_CODE_WITH_BOOKINGUUID",
    "UFN_CALENDARBOOKING_SEL_ONE",
    "UFN_CALENDARBOOKING_CANCEL"
]

const laraigoEndpoint = process.env.LARAIGO;

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

        if (["MAIL", "EMAIL"].includes(data.type)) {
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

            const resCheck = await executesimpletransaction("UFN_BALANCE_CHECK", {
                ...data,
                messagetemplateid: data.hsmtemplateid,
                receiver: data.listmembers[0].email,
                communicationchannelid: 0
            })

            let send = false;
            if (resCheck instanceof Array && resCheck.length > 0) {
                data.fee = resCheck[0].fee;
                const balanceid = resCheck[0].balanceid;

                if (balanceid == 0) {
                    send = true;
                }
                else {
                    const resValidate = await executesimpletransaction("UFN_BALANCE_OUTPUT", {
                        ...data,
                        receiver: data.listmembers[0].email,
                        communicationchannelid: 0
                    })
                    if (resValidate instanceof Array) {
                        send = true;
                    }
                }
            }

            if (send) {
                if (data.listmembers.length) {
                    data.listmembers.forEach(async (member) => {
                        executesimpletransaction("QUERY_INSERT_TASK_SCHEDULER", {
                            corpid: data.corpid,
                            orgid: data.orgid,
                            tasktype: "sendmail",
                            taskbody: JSON.stringify({
                                messagetype: "OWNERBODY",
                                receiver: member.email,
                                subject: mailtemplate.header,
                                priority: mailtemplate.priority,
                                body: member.parameters.reduce((acc, item) => acc.replace(eval(`/{{${item.name}}}/gi`), item.text), (data.body || mailtemplate.body)),
                                blindreceiver: "",
                                copyreceiver: "",
                                credentials: jsonconfigmail,
                                config: {
                                    CommunicationChannelSite: "",
                                    FirstName: member.firstname,
                                    LastName: member.lastname,
                                    HsmTo: member.email,
                                    Origin: "EXTERNAL",
                                    MessageTemplateId: data.hsmtemplateid,
                                    ShippingReason: data.shippingreason,
                                    // HsmId: data.hsmtemplatename,
                                    Body: member.parameters.reduce((acc, item) => acc.replace(eval(`/{{${item.name}}}/gi`), item.text), (data.body || mailtemplate.body))
                                },
                                attachments: [
                                    ...(mailtemplate.attachment ? mailtemplate.attachment.split(",").map(x => ({
                                        type: 'FILE',
                                        value: x?.value ? x.value : x,
                                    })) : []),
                                    ...(data.ics_attachment !== '' ? [{
                                        type: 'FILE',
                                        value: data.ics_attachment,
                                    }] : [])
                                ]
                            }),
                            repeatflag: false,
                            repeatmode: 0,
                            repeatinterval: 0,
                            completed: false,
                            _requestid: requestid,
                        })
                    })
                }
            }
            else {
                executesimpletransaction("QUERY_INSERT_HSM_HISTORY", {
                    ...data,
                    status: 'FINALIZADO',
                    success: false,
                    message: 'no credit',
                    messatemplateid: data.hsmtemplateid,
                    config: JSON.stringify({
                        CommunicationChannelSite: "zyxme@vcaperu.com",
                        FirstName: data.listmembers[0].firstname,
                        LastName: data.listmembers[0].lastname,
                        HsmTo: data.listmembers[0].email,
                        Origin: "EXTERNAL",
                        MessageTemplateId: data.hsmtemplateid,
                        ShippingReason: data.shippingreason,
                        // HsmId: data.hsmtemplatename,
                        Body: data.listmembers[0].parameters.reduce((acc, item) => acc.replace(eval(`/{{${item.name}}}/gi`), item.text), (data.body || mailtemplate.body))
                    }),
                })
            }
        } else if (["SMS", "HSM"].includes(data.type)) {
            if (data.type === "SMS") {
                const smschannel = await executesimpletransaction("QUERY_GET_SMS_DEFAULT_BY_ORG", data);
                if (smschannel[0] && smschannel) {
                    data.communicationchannelid = smschannel[0].communicationchannelid;
                    data.communicationchanneltype = smschannel[0].type;
                    data.platformtype = smschannel[0].type;
                }
            }

            // Balance validation is done in services

            const responseservices = await axiosObservable({
                url: `${process.env.SERVICES}handler/external/sendhsm`,
                data,
                method: "post",
                _requestid: requestid,
            });

            if (!responseservices.data || !(responseservices.data instanceof Object)) {
                return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));
            }
        }
    }
    catch (exception) {
        getErrorCode(null, exception, `Request to ${requestid}`, data._requestid);
    }
}

const setReminder = async (data, requestid) => {
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
        switch (data.reminderperiod) {
            case 'day':
                data.remindertime = data.reminderfrecuency.toString() + ' days';
                break;
            case 'hour':
                data.remindertime = data.reminderfrecuency.toString() + ' hours';
                break;
            case 'week':
                data.remindertime = data.reminderfrecuency.toString() + ' weeks';
                break;
            default:
                break;
        }
        let taskids = []

        if (data.remindertype === "EMAIL" || data.remindertype === "EMAIL/HSM") {
            let jsonconfigmail = "";
            const resBD = await Promise.all([
                executesimpletransaction("QUERY_GET_CONFIG_MAIL", data),
                executesimpletransaction("QUERY_GET_MESSAGETEMPLATE", {
                    ...data,
                    hsmtemplateid: data.remindermailtemplateid
                }),
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

            const resCheck = await executesimpletransaction("UFN_BALANCE_CHECK", {
                ...data,
                type: 'MAIL',
                messagetemplateid: data.remindermailtemplateid,
                receiver: data.listmembers[0].email,
                communicationchannelid: 0
            })

            let send = false;
            if (resCheck instanceof Array && resCheck.length > 0) {
                data.fee = resCheck[0].fee;
                const balanceid = resCheck[0].balanceid;

                if (balanceid == 0) {
                    send = true;
                }
                else {
                    const resValidate = await executesimpletransaction("UFN_BALANCE_OUTPUT", {
                        ...data,
                        type: 'MAIL',
                        receiver: data.listmembers[0].email,
                        communicationchannelid: 0
                    })
                    if (resValidate instanceof Array) {
                        send = true;
                    }
                }
            }
            if (send) {
                const taskResult = await executesimpletransaction("QUERY_INSERT_REMINDER_TASK_SCHEDULER", {
                    corpid: data.corpid,
                    orgid: data.orgid,
                    tasktype: "sendmail",
                    taskbody: JSON.stringify({
                        shippingreason: data.shippingreason,
                        calendareventid: data.calendareventid,
                        messagetype: "OWNERBODY",
                        receiver: data.listmembers[0].email,
                        subject: mailtemplate.header,
                        priority: mailtemplate.priority,
                        body: data.listmembers[0].parameters.reduce((acc, item) => acc.replace(eval(`/{{${item.name}}}/gi`), item.text), (data.bodyMailMessage || mailtemplate.body)),
                        blindreceiver: "",
                        copyreceiver: "",
                        credentials: jsonconfigmail,
                        config: {
                            CommunicationChannelSite: "",
                            FirstName: data.listmembers[0].firstname,
                            LastName: data.listmembers[0].lastname,
                            HsmTo: data.listmembers[0].email,
                            Origin: "EXTERNAL",
                            MessageTemplateId: data.remindermailtemplateid,
                            ShippingReason: data.shippingreason,
                            // HsmId: data.hsmtemplatename,
                            Body: data.listmembers[0].parameters.reduce((acc, item) => acc.replace(eval(`/{{${item.name}}}/gi`), item.text), (data.bodyMailMessage || mailtemplate.body))
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
                    monthdate: data.monthdate,
                    hourstart: data.hourstart,
                    remindertime: data.remindertime,
                    offset: data.offset,
                })
                if (taskResult?.[0]?.taskschedulerid) {
                    taskids.push(taskResult[0].taskschedulerid);
                }
            }
            else {
                executesimpletransaction("QUERY_INSERT_HSM_HISTORY", {
                    ...data,
                    status: 'FINALIZADO',
                    success: false,
                    message: 'no credit',
                    messatemplateid: data.remindermailtemplateid,
                    config: JSON.stringify({
                        CommunicationChannelSite: "zyxme@vcaperu.com",
                        FirstName: data.listmembers[0].firstname,
                        LastName: data.listmembers[0].lastname,
                        HsmTo: data.listmembers[0].email,
                        Origin: "EXTERNAL",
                        MessageTemplateId: data.remindermailtemplateid,
                        ShippingReason: data.shippingreason,
                        // HsmId: data.hsmtemplatename,
                        Body: data.listmembers[0].parameters.reduce((acc, item) => acc.replace(eval(`/{{${item.name}}}/gi`), item.text), (data.body || mailtemplate.body))
                    }),
                })
            }
        }
        if (data.remindertype === "HSM" || data.remindertype === "EMAIL/HSM") {

            // Balance validation is done in services

            const variables_keys = data.variables.reduce((ac, x) => ({ ...ac, [x.name]: x.text }), {})

            const taskResult = await executesimpletransaction("QUERY_INSERT_REMINDER_TASK_SCHEDULER", {
                corpid: data.corpid,
                orgid: data.orgid,
                tasktype: "sendhsmexternal",
                taskbody: JSON.stringify({
                    corpid: data.corpid,
                    orgid: data.orgid,
                    // hsmtemplatename: data.reminderhsmtemplatename,
                    hsmtemplateid: data.reminderhsmtemplateid,
                    communicationchannelid: data.reminderhsmcommunicationchannelid,
                    communicationchanneltype: data.reminderhsmcommunicationchanneltype,
                    platformtype: data.reminderhsmcommunicationchanneltype,
                    type: "HSM",
                    shippingreason: data.shippingreason,
                    calendareventid: data.calendareventid,
                    listmembers: [{
                        personid: data.listmembers[0].personid,
                        phone: data.listmembers[0].phone,
                        firstname: data.listmembers[0].firstname,
                        lastname: "",
                        parameters: data.bodyHsmMessage.match(/({{)(.*?)(}})/g)
                            .map(x => x.substring(x.indexOf("{{") + 2, x.indexOf("}}")))
                            .map(x => ({ text: variables_keys[x] }))
                    }]
                }),
                repeatflag: false,
                repeatmode: 1,
                repeatinterval: 1,
                completed: false,
                monthdate: data.monthdate,
                hourstart: data.hourstart,
                remindertime: data.remindertime,
                offset: data.offset,
                _requestid: requestid
            })
            if (taskResult?.[0]?.taskschedulerid) {
                taskids.push(taskResult[0].taskschedulerid);
            }
        }
        executesimpletransaction('QUERY_UPDATE_CALENDARBOOKING_TASKID', {
            corpid: data.corpid,
            orgid: data.orgid,
            calendareventid: data.calendareventid,
            calendarbookingid: data.calendarbookingid,
            taskid: taskids.join(','),
        })
    }
    catch (exception) {
        getErrorCode(null, exception, `Request to ${req.originalUrl}`, data._requestid);
    }
}

exports.Collection = async (req, res) => {
    try {
        const { parameters = {}, method, key } = req.body;
        let agentListMember = {}

        if (!method_allowed.includes(method)) {
            const resError = getErrorCode(errors.FORBIDDEN);
            return res.status(resError.rescode).json(resError);
        }

        parameters._requestid = req._requestid;

        const result = await executesimpletransaction(method, parameters);
        const newcalendarbookingid = result?.[0]?.calendarbookingid;
        const assignedAgentId = result?.[0]?.agentid;

        if (!result.error) {
            if (method === "UFN_CALENDARYBOOKING_INS") {
                logger.child({ _requestid: req._requestid }).error(`eventBookingController.Collection executesimpletransaction assignedAgentId: ${assignedAgentId}`)
                if (assignedAgentId) {
                    const agentInformation = await executesimpletransaction("QUERY_CALENDARINTEGRATION_INFO_SEL", { calendarintegrationid: assignedAgentId })
                    agentListMember = {
                        phone: '',
                        firstname: agentInformation[0].email,
                        email: agentInformation[0].email,
                        lastname: "",
                        parameters: parameters.parameters
                    }
                }

                logger.child({ _requestid: req._requestid }).error('eventBookingController.Collection resultCalendar')
                const resultCalendar = await executesimpletransaction("QUERY_EVENT_BY_CALENDAR_EVENT_ID", parameters);
                const {
                    messagetemplateid,
                    communicationchannelid,
                    communicationchanneltype,
                    notificationtype,
                    notificationmessage,
                    reminderhsmcommunicationchannelid,
                    reminderhsmcommunicationchanneltype,
                    reminderperiod,
                    reminderfrecuency,
                    remindermailmessage,
                    remindermailtemplateid,
                    reminderhsmmessage,
                    reminderhsmtemplateid,
                    remindertype,
                    notificationmessageemail,
                    messagetemplateidemail,
                    rescheduletemplateidhsm,
                    reschedulenotificationhsm,
                    reschedulecommunicationchannelid,
                    rescheduletemplateidemail,
                    reschedulenotificationemail,
                    rescheduletype
                } = resultCalendar[0]

                //si envia un calendarbookinguuid es porque quiere reprogramar, osea cancelar la antigua y crear una nueva
                if (parameters.calendarbookingid) {

                    await executesimpletransaction("QUERY_CANCEL_EVENT_BY_CALENDARBOOKINGUUID", {
                        ...parameters,
                        cancelcomment: "RESCHEDULED BOOKING"
                    });

                    // cancel google event if exists
                    const eventToCancel = await executesimpletransaction("QUERY_INTEGRATIONEVENT_SEL_BY_CALENDARBOOKINGID", parameters);
                    if (eventToCancel instanceof Array && eventToCancel.length > 0) deleteGoogleEvent({ eventid: eventToCancel[0].id, agentid: eventToCancel[0].calendarintegrationid }, parameters, 'externalOnly');

                    // create google event if theres any1 assinged
                    if (assignedAgentId) createGoogleEvent(assignedAgentId, newcalendarbookingid, resultCalendar[0], parameters)

                    await executesimpletransaction("QUERY_CANCEL_TASK_BY_CALENDARBOOKINGUUID", {
                        ...parameters,
                    });
                    try {

                        //Reschedulde start
                        if (["HSM", "HSMEMAIL", "EMAIL"].includes(rescheduletype)) {
                            const sendmessage = {
                                type: "HSM",
                                corpid: parameters.corpid,
                                orgid: parameters.orgid,
                                username: parameters.username,
                                communicationchannelid: reschedulecommunicationchannelid,
                                hsmtemplateid: rescheduletemplateidhsm,
                                shippingreason: "BOOKING",
                                _requestid: req._requestid,
                                communicationchanneltype: communicationchanneltype,
                                platformtype: communicationchanneltype,
                                userid: 0,
                                listmembers: [{
                                    phone: parameters.phone,
                                    firstname: parameters.name,
                                    email: parameters.email,
                                    lastname: "",
                                    parameters: parameters.parameters
                                }],
                                body: reschedulenotificationhsm
                            }

                        if ("HSMEMAIL" === rescheduletype) {
                            await send(sendmessage, req._requestid);
                            await send(
                              {
                                ...sendmessage,
                                type: "MAIL",
                                body: reschedulenotificationemail,
                                hsmtemplateid: rescheduletemplateidemail,
                                listmembers: Object.keys(agentListMember).length === 0 ? sendmessage.listmembers : sendmessage.listmembers.concat(agentListMember)
                              },
                              req._requestuestid
                            );
                        } else if ("EMAIL" === rescheduletype) {
                            await send(
                              {
                                ...sendmessage,
                                type: "MAIL",
                                body: reschedulenotificationemail,
                                hsmtemplateid: rescheduletemplateidemail,
                                listmembers: Object.keys(agentListMember).length === 0 ? sendmessage.listmembers : sendmessage.listmembers.concat(agentListMember)
                              },
                              req._requestuestid
                            );
                        } else {
                            await send(sendmessage, req._requestid);
                        }
                    }
                    //Reschedule end

                    } catch (exception) {
                        logger.child({ _requestid: req._requestid }).error(exception)
                        return res.status(500).json({
                            code: "error_unexpected_error",
                            error: true,
                            message: exception.message,
                            success: false,
                        });
                    }

                }

                if (["EMAIL", "HSM", "HSMEMAIL"].includes(notificationtype) && !parameters.calendarbookingid) {
                    logger.child({ _requestid: req._requestid }).error('eventBookingController.Collection notificationtype includes EMAIL')
                    logger.child({ _requestid: req._requestid }).error(resultCalendar)
                    logger.child({ _requestid: req._requestid }).error(parameters)
                    const ics_file = await generateIcs(req._requestid, resultCalendar[0], parameters);
                    logger.child({ _requestid: req._requestid }).error('eventBookingController.Collection ics_file')
                    if (assignedAgentId) createGoogleEvent(assignedAgentId, newcalendarbookingid, resultCalendar[0], parameters)
                    logger.child({ _requestid: req._requestid }).error('eventBookingController.Collection createGoogleEvent')

                    const sendmessage = {
                        corpid: parameters.corpid,
                        orgid: parameters.orgid,
                        username: parameters.username,
                        communicationchannelid: communicationchannelid,
                        hsmtemplateid: messagetemplateid,
                        type: "HSM",
                        shippingreason: "BOOKING",
                        _requestid: req._requestid,
                        // hsmtemplatename: messagetemplatename,
                        communicationchanneltype: communicationchanneltype,
                        platformtype: communicationchanneltype,
                        userid: 0,
                        listmembers: [{
                            phone: parameters.phone,
                            firstname: parameters.name,
                            email: parameters.email,
                            lastname: "",
                            parameters: parameters.parameters
                        }],
                        body: notificationmessage,
                        messagetemplateidemail: messagetemplateidemail,
                        notificationmessageemail: notificationmessageemail,
                        ics_attachment: ics_file?.url || ''
                    }

                if ("HSMEMAIL" === notificationtype) {
                    await send(sendmessage, req._requestid);
                    await send(
                      {
                        ...sendmessage,
                        type: "MAIL",
                        body: notificationmessageemail,
                        hsmtemplateid: messagetemplateidemail,
                        listmembers: Object.keys(agentListMember).length === 0 ? sendmessage.listmembers : sendmessage.listmembers.concat(agentListMember)
                      },
                      req._requestuestid
                    );
                } else if ("EMAIL" === notificationtype) {
                    await send(
                      {
                        ...sendmessage,
                        type: "MAIL",
                        listmembers: Object.keys(agentListMember).length === 0 ? sendmessage.listmembers : sendmessage.listmembers.concat(agentListMember)
                      },
                      req._requestuestid
                    );
                } else {
                    await send(sendmessage, req._requestid);
                }
            }

                //Inicio - Envio de recordatorio - JR
                logger.child({ _requestid: req._requestid }).error('eventBookingController.Collection reminderData')
                const reminderData = {
                    corpid: parameters.corpid,
                    orgid: parameters.orgid,
                    username: parameters.username,
                    communicationchannelid: communicationchannelid,
                    hsmtemplateid: messagetemplateid,
                    type: notificationtype,
                    shippingreason: "BOOKING",
                    _requestid: req._requestid,
                    // hsmtemplatename: messagetemplatename,
                    communicationchanneltype: communicationchanneltype,
                    platformtype: communicationchanneltype,
                    userid: 0,
                    listmembers: [{
                        phone: parameters.phone,
                        firstname: parameters.name,
                        email: parameters.email,
                        lastname: "",
                        parameters: parameters.parameters
                    }],
                    bodyMailMessage: remindermailmessage,
                    bodyHsmMessage: reminderhsmmessage,
                    reminderhsmcommunicationchannelid: reminderhsmcommunicationchannelid,
                    reminderhsmcommunicationchanneltype: reminderhsmcommunicationchanneltype,
                    reminderperiod: reminderperiod,
                    reminderfrecuency: reminderfrecuency,
                    remindermailtemplateid: remindermailtemplateid,
                    reminderhsmtemplateid: reminderhsmtemplateid,
                    // reminderhsmtemplatename: reminderhsmtemplatename,
                    remindertype: remindertype,
                    monthdate: parameters.monthdate,
                    hourstart: parameters.hourstart,
                    offset: parameters.persontimezone,
                    calendareventid: parameters.calendareventid,
                    calendarbookingid: newcalendarbookingid,
                    variables: parameters.parameters
                }

                await setReminder(reminderData, req._requestid);
                //Fin - Envio de recordatorio - JR

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
            logger.child({ _requestid: req._requestid }).error('eventBookingController.Collection result.error')
            return res.status(result.rescode).json(({ ...result, key }));
    } catch (exception) {
        logger.child({ _requestid: req._requestid }).error(exception)
        return res.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.EventsPerPerson = async (req, res) => {
    const { parameters = {} } = req.body;

    const result = await executesimpletransaction('QUERY_GET_EVENTS_PER_PERSON', parameters);

    if (!result.error) {
        const events = result.map(event => ({
            code: event.code,
            calendareventid: event.calendareventid,
            calendarbookingid: event.calendarbookingid,
            calendarbookinguuid: event.calendarbookinguuid,
            description: event.description,
            status: event.status,
            datestart: event.datestart,
            monthdate: event.monthdate,
            monthday: event.monthday,
            weekday: event.weekday,
            hourstart: event.hourstart,
            hourend: event.hourend,
            timeduration: event.timeduration,
            personname: event.personname,
            personcontact: event.personcontact,
            reprogramacion: `${laraigoEndpoint}events/${event.orgid}/${event.code}?booking=${event.calendarbookinguuid}`,
            cancelar: `${laraigoEndpoint}cancelevent/${event.corpid}/${event.orgid}/${event.calendareventid}/${event.calendarbookinguuid}`,
        }));

        return res.json({ error: false, success: true, count: events.length, data: events });
    }
    else
        return res.status(result.rescode).json(({ ...result, key }));
}

exports.GetEventByBookingid = async (req, res) => {
    const { parameters = {}, method, key } = req.body;

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

const GOOGLE_CALENDAR_CLIENTID = process.env.GOOGLE_CALENDAR_CLIENTID
const GOOGLE_CALENDAR_CLIENTSECRET = process.env.GOOGLE_CALENDAR_CLIENTSECRET
const GOOGLE_CALENDAR_REDIRECTURI = process.env.GOOGLE_CALENDAR_REDIRECTURI
const HOOK = process.env.HOOK
const BRIDGE = process.env.BRIDGE

const googleCalendarCredentialsClean = async ({ params, extradata }) => {
    try {
        await executesimpletransaction("UFN_CALENDAR_INTEGRATION_CREDENTIALS_CLEAN", {
            id: extradata.calendarintegrationid,
            email: extradata.email
        });
    }
    catch (exception) {
        logger.child({ _requestid: params._requestid, ctx: { ...params, extradata } }).error(exception)
    }
    try {
        await axiosObservable({
            method: "post",
            url: `${BRIDGE}ProcessScheduler/SendMail`,
            data: {
                mailAddress: extradata.email,
                mailTitle: "Laraigo - Google Calendar",
                mailBody: "Sus permisos de Google Calendar expiraron o fueron revocados, en caso desee seguir usando el servico por favor ingrese su cuenta de google nuevamente en nuestra plataforma."
            },
            _requestid: params._requestid,
        });
    }
    catch (exception) {
        logger.child({ _requestid: params._requestid, ctx: { ...params, extradata } }).error(exception)
    }
}

const googleExceptionHandler = async ({ exception, params, calendar, extradata }) => {
    let invalid_credentials = false;
    if (exception.code === 401) {
        invalid_credentials = true
    }
    else {
        switch (exception.message) {
            case 'Invalid Credentials':
                invalid_credentials = true
            case 'invalid_grant':
                switch (exception.response.data.error_description) {
                    case 'Token has been expired or revoked.':
                        invalid_credentials = true
                    default:
                        invalid_credentials = true
                }
        }
    }
    if (invalid_credentials) {
        await googleCalendarCredentialsClean({ params, extradata })
    }
    return invalid_credentials
}

const googleCalendarCredentials = async ({ params, code = null }) => {
    try {
        const oauth2Client = new google.auth.OAuth2(
            GOOGLE_CALENDAR_CLIENTID,
            GOOGLE_CALENDAR_CLIENTSECRET,
            GOOGLE_CALENDAR_REDIRECTURI
        )
        if (code) {
            // Log In from App { corpid, orgid, id } = params
            const { tokens: credentials } = await oauth2Client.getToken(code);
            if (credentials) {
                oauth2Client.setCredentials(credentials);
                const calendar = google.calendar({
                    version: 'v3',
                    auth: oauth2Client
                });
                const calendar_data = await calendar.calendars.get({ calendarId: 'primary' })
                const calendarintegration = await executesimpletransaction("UFN_CALENDAR_INTEGRATION_CREDENTIALS", {
                    ...params,
                    email: calendar_data.data.id,
                    type: 'GOOGLE',
                    credentials: JSON.stringify(credentials),
                    timezone: calendar_data.data.timeZone
                });
                return [calendar, {
                    calendarintegrationid: calendarintegration?.[0]?.calendarintegrationid,
                    email: calendar_data.data.id,
                    watchid: calendarintegration?.[0]?.watchid,
                    resourceid: calendarintegration?.[0]?.resourceid,
                }]
            }
        }
        else if (params.credentials) {
            // Operations from Task { credentials, calendarintegrationid, email } = params
            const { credentials, ...extradata } = params;
            let jsoncredentials = credentials;
            if (typeof jsoncredentials === 'string') {
                jsoncredentials = JSON.parse(jsoncredentials)
            }
            oauth2Client.setCredentials(jsoncredentials)
            const calendar = google.calendar({
                version: 'v3',
                auth: oauth2Client
            });
            return [calendar, extradata]
        }
        else if (params.calendarintegrationid) {
            // Operations from Webhook { calendarintegrationid, email } = params
            const google_data = await executesimpletransaction("UFN_CALENDAR_INTEGRATION_CREDENTIALS_SEL", {
                id: params.calendarintegrationid
            });
            if (google_data instanceof Array && google_data.length > 0) {
                const { credentials, ...extradata } = google_data[0];
                if (credentials) {
                    oauth2Client.setCredentials(credentials)
                    const calendar = google.calendar({
                        version: 'v3',
                        auth: oauth2Client
                    });
                    return [calendar, extradata]
                }
            }
        }
        else {
            // Operations from App { corpid, orgid, id } = params
            const google_data = await executesimpletransaction("UFN_CALENDAREVENT_INTEGRATION_CREDENTIALS_SEL", params);
            if (google_data instanceof Array && google_data.length > 0) {
                const { credentials, ...extradata } = google_data[0];
                if (credentials) {
                    oauth2Client.setCredentials(credentials)
                    const calendar = google.calendar({
                        version: 'v3',
                        auth: oauth2Client
                    });
                    return [calendar, extradata]
                }
            }
        }
    }
    catch (exception) {
        logger.child({ _requestid: params._requestid, ctx: params }).error(exception)
    }
    return [null, null]
}

const googleCalendarRevoke = async ({ params }) => {
    try {
        const oauth2Client = new google.auth.OAuth2(
            GOOGLE_CALENDAR_CLIENTID,
            GOOGLE_CALENDAR_CLIENTSECRET,
            GOOGLE_CALENDAR_REDIRECTURI
        )
        // Operations from App { corpid, orgid, id } = params
        const google_data = await executesimpletransaction("UFN_CALENDAREVENT_INTEGRATION_CREDENTIALS_SEL", params);
        if (google_data instanceof Array && google_data.length > 0) {
            const { credentials, ...extradata } = google_data[0];
            oauth2Client.setCredentials(credentials)
            // Stop watch
            if (extradata?.watchid && extradata?.resourceid) {
                try {
                    const calendar = google.calendar({
                        version: 'v3',
                        auth: oauth2Client
                    });
                    await calendar.channels.stop({
                        requestBody: {
                            id: extradata?.watchid,
                            resourceId: extradata?.resourceid
                        }
                    })
                }
                catch (exception) {
                    logger.child({ _requestid: params._requestid, ctx: { ...params, extradata } }).error(exception)
                }
            }
            // Revoke
            const access_token = await oauth2Client.getAccessToken()
            const revoke_res = await oauth2Client.revokeToken(access_token.token)
            if (revoke_res?.status === 200) {
                await googleCalendarCredentialsClean({ params, extradata })
            }
            return revoke_res.data
        }
    }
    catch (exception) {
        throw exception
    }
    return null
}

const googleCalendarGet = async ({ params, calendar, extradata = null }) => {
    try {
        const calendar_data = await calendar.calendars.get({
            calendarId: extradata.email || 'primary',
        })
        if (calendar_data?.status === 200) {
            return calendar_data.data
        }
        return null
    }
    catch (exception) {
        throw exception;
    }
}

const googleCalendarSync = async ({ params, calendar, extradata = null }) => {
    let calendar_data;
    let calerdar_items = [];
    let calerdar_events;
    let calendar_success = true;
    try {
        while (!calendar_data?.nextSyncToken) {
            // Incremental sync
            if (extradata?.nextsynctoken && calendar_success) {
                try {
                    calerdar_events = await calendar.events.list({
                        calendarId: extradata.email || 'primary',
                        maxAttendees: 1,
                        maxResults: 2500,
                        singleEvents: true,
                        syncToken: extradata.nextsynctoken,
                        ...(calendar_data?.nextPageToken ? {
                            pageToken: calendar_data?.nextPageToken
                        } : {})
                    });
                }
                catch (exception) {
                    const googleError = await googleExceptionHandler({ exception, params, calendar, extradata })
                    if (googleError) {
                        throw exception;
                    }
                    else {
                        // If the syncToken expires, the server will respond with a 410 GONE.
                        // Should perform a full synchronization without any syncToken
                        calendar_success = false
                    }
                }
            }
            // Full sync
            if (!extradata?.nextsynctoken || !calendar_success) {
                calerdar_events = await calendar.events.list({
                    calendarId: extradata.email || 'primary',
                    maxAttendees: 1,
                    maxResults: 2500,
                    showDeleted: true,
                    singleEvents: true,
                    timeMin: new Date().toISOString(),
                    ...(calendar_data?.nextPageToken ? {
                        pageToken: calendar_data?.nextPageToken
                    } : {})
                });
            }
            if (calerdar_events?.status !== 200) {
                break;
            }
            const { items, ...ce_data } = calerdar_events.data;
            calendar_data = ce_data;
            calerdar_items = [...calerdar_items, ...items];
        }
        if (calerdar_events?.status === 200) {
            if (calerdar_items.length > 0) {
                await executesimpletransaction("UFN_CALENDAR_INTEGRATION_SYNC", {
                    id: extradata.calendarintegrationid,
                    email: extradata.email,
                    timezone: calendar_data.timeZone,
                    updated: calendar_data.updated,
                    nextsynctoken: calendar_data.nextSyncToken,
                    table: JSON.stringify(calerdar_items.map(x => ({
                        id: x.id,
                        status: x?.status === 'cancelled' ? 'CANCELADO' : 'ACTIVO',
                        type: x?.eventType || null,
                        createdate: x?.created === '0000-12-31T00:00:00.000Z' ? null : x?.created,
                        changedate: x?.updated === '0000-12-31T00:00:00.000Z' ? null : x?.updated,
                        summary: x?.summary,
                        description: x?.description,
                        startdate: x?.start?.dateTime ? x?.start?.dateTime : x?.start?.date,
                        enddate: x?.end?.dateTime ? x?.end?.dateTime : x?.end?.date,
                    })))
                });
            }
            return calendar_data?.nextSyncToken
        }
        return null
    }
    catch (exception) {
        if (!calerdar_events) {
            throw exception;
        }
        logger.child({ _requestid: params._requestid, ctx: params }).error(exception)
    }
}

const googleCalendarWatch = async ({ params, calendar, extradata = null }) => {
    try {
        // Try Clean registered watch
        if (extradata?.watchid && extradata?.resourceid) {
            try {
                await calendar.channels.stop({
                    requestBody: {
                        id: extradata?.watchid,
                        resourceId: extradata?.resourceid
                    }
                })
            }
            catch (exception) {
                // logger.child({ _requestid: params._requestid, ctx: { ...params, extradata }}).error(exception)
            }
        }
        // Register new watch
        const calerdar_watch = await calendar.events.watch({
            calendarId: extradata.email || 'primary',
            requestBody: {
                address: `${HOOK}mail/calendarwebhookasync`,
                id: uuidv4(),
                token: JSON.stringify({
                    calendarintegrationid: extradata?.calendarintegrationid || params?.calendarintegrationid,
                    email: extradata?.email || params?.email,
                }),
                type: 'web_hook',
            }
        });
        if (calerdar_watch?.status === 200) {
            await executesimpletransaction("UFN_CALENDAR_INTEGRATION_WATCH", {
                id: extradata.calendarintegrationid,
                email: extradata.email,
                watchid: calerdar_watch?.data?.id,
                resourceid: calerdar_watch?.data?.resourceId,
                watchexpiredate: new Date(+calerdar_watch?.data?.expiration).toISOString()
            });
        }
        return calerdar_watch?.data
    }
    catch (exception) {
        const googleError = await googleExceptionHandler({ exception, params, calendar, extradata })
        if (googleError) {
            throw exception;
        }
        logger.child({ _requestid: params._requestid, ctx: { ...params, extradata } }).error(exception)
    }
    return null
}

exports.googleLogIn = async (request, response) => {
    try {
        const { id, code } = request.body
        const params = { id }
        setSessionParameters(params, request.user, request._requestid);
        const [calendar, extradata] = await googleCalendarCredentials({ params, code })
        if (calendar) {
            const nextSyncToken = await googleCalendarSync({ params, calendar, extradata })
            if (nextSyncToken) {
                createAutomaticAssignedBookings({ params, calendar, extradata })
                await googleCalendarWatch({ params, calendar, extradata })
            }
            return response.status(200).json({
                code: '',
                data: nextSyncToken,
                error: false,
                message: '',
                success: true,
            });
        }
        return response.status(400).json({
            code: 'error_unexpected_error',
            error: true,
            message: 'Invalid credentials',
            success: false,
        });
    }
    catch (exception) {
        logger.child({ _requestid: request._requestid, ctx: request.body }).error(exception)
        return response.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.googleDisconnect = async (request, response) => {
    try {
        const { calendareventid, calendarintegrationid } = request.body
        const params = { calendareventid, calendarintegrationid }
        setSessionParameters(params, request.user, request._requestid);

        const bd_data = await executesimpletransaction("UFN_CALENDAR_INTEGRATION_CREDENTIALS_DISCONNECT", params);
        if (bd_data instanceof Array && bd_data.length > 0) {
            const calendarToDelete = bd_data[0].v_mapping
            calendarToDelete.forEach(element => {
                deleteGoogleEvent({ eventid: element.id, agentid: calendarintegrationid }, {}, 'externalOnly')
            });

            return response.status(200).json({
                code: '',
                data: bd_data[0],
                error: false,
                message: '',
                success: true,
            });
        }
        else {
            return response.status(200).json({
                code: '',
                error: false,
                message: '',
                success: true,
            });
        }
    }
    catch (exception) {
        logger.child({ _requestid: request._requestid, ctx: request.body }).error(exception)
        return response.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.googleRevoke = async (request, response) => {
    try {
        const { id } = request.body
        const params = { id }
        setSessionParameters(params, request.user, request._requestid);
        const success = await googleCalendarRevoke({ params })
        return response.status(200).json({
            code: '',
            data: success,
            error: false,
            message: '',
            success: true,
        });
    }
    catch (exception) {
        logger.child({ _requestid: request._requestid, ctx: request.body }).error(exception)
        return response.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.googleValidate = async (request, response) => {
    try {
        const { id } = request.body
        const params = { id }
        setSessionParameters(params, request.user, request._requestid);
        const [calendar, extradata] = await googleCalendarCredentials({ params })
        if (calendar) {
            const calendar_data = await googleCalendarGet({ params, calendar, extradata })
            return response.status(200).json({
                code: '',
                data: calendar_data,
                error: false,
                message: '',
                success: true,
            });
        }
        return response.status(400).json({
            code: 'error_unexpected_error',
            error: true,
            message: 'Invalid credentials',
            success: false,
        });
    }
    catch (exception) {
        logger.child({ _requestid: request._requestid, ctx: request.body }).error(exception)
        return response.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.googleSync = async (request, response) => {
    try {
        const params = { ...request.body, _requestid: request._requestid }
        const [calendar, extradata] = await googleCalendarCredentials({ params })
        if (calendar) {
            const nextSyncToken = await googleCalendarSync({ params, calendar, extradata })
            return response.status(200).json({
                code: '',
                data: nextSyncToken,
                error: false,
                message: '',
                success: true,
            });
        }
        return response.status(400).json({
            code: 'error_unexpected_error',
            error: true,
            message: 'Invalid credentials',
            success: false,
        });
    }
    catch (exception) {
        logger.child({ _requestid: request._requestid, ctx: request.body }).error(exception)
        return response.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.googleWebhookSync = async (request, response) => {
    try {
        const { channelId, channelToken, resourceState, resourceId } = request.body
        const params = {
            ...JSON.parse(channelToken),
            watchid: channelId,
            resourceid: resourceId,
            _requestid: request._requestid
        }
        const [calendar, extradata] = await googleCalendarCredentials({ params })
        if (calendar) {
            if (params?.watchid === extradata?.watchid && params?.resourceid === extradata?.resourceid) {
                const nextSyncToken = await googleCalendarSync({ params, calendar, extradata })
                return response.status(200).json({
                    code: '',
                    data: nextSyncToken,
                    error: false,
                    message: '',
                    success: true,
                });
            }
            return response.status(200).json({
                code: '',
                error: false,
                message: '',
                success: true,
            });
        }
        return response.status(400).json({
            code: 'error_unexpected_error',
            error: true,
            message: 'Invalid credentials',
            success: false,
        });
    }
    catch (exception) {
        logger.child({ _requestid: request._requestid, ctx: request.body }).error(exception)
        return response.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.googleWatch = async (request, response) => {
    try {
        const params = { ...request.body, _requestid: request._requestid }
        const [calendar, extradata] = await googleCalendarCredentials({ params })
        if (calendar) {
            const calerdar_watch = await googleCalendarWatch({ params, calendar, extradata })
            return response.status(200).json({
                code: '',
                data: calerdar_watch,
                error: false,
                message: '',
                success: true,
            });
        }
        return response.status(400).json({
            code: 'error_unexpected_error',
            error: true,
            message: 'Invalid credentials',
            success: false,
        });
    }
    catch (exception) {
        logger.child({ _requestid: request._requestid, ctx: request.body }).error(exception)
        return response.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.googleWatchStop = async (request, response) => {
    try {
        const { id, resourceId, token } = request.body
        const params = { ...token, _requestid: request._requestid }
        const [calendar, extradata] = await googleCalendarCredentials({ params })
        if (calendar) {
            const calendar_channels = await calendar.channels.stop({
                requestBody: {
                    id,
                    resourceId
                }
            })
            return response.status(200).json({
                code: '',
                data: calendar_channels.data,
                error: false,
                message: '',
                success: true,
            });
        }
        return response.status(400).json({
            code: 'error_unexpected_error',
            error: true,
            message: 'Invalid credentials',
            success: false,
        });
    }
    catch (exception) {
        logger.child({ _requestid: request._requestid, ctx: request.body }).error(exception)
        return response.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.googleWebhook = async (request, response) => {
    try {
        const data = {
            'x-goog-channel-id': request.headers['x-goog-channel-id'],
            'x-goog-channel-token': request.headers['x-goog-channel-token'],
            'x-goog-resource-state': request.headers['x-goog-resource-state'],
            'x-goog-resource-id': request.headers['x-goog-resource-id']
        }
        logger.child({ _requestid: request._requestid }).info(data)
        return response.status(200).json({
            code: '',
            data: data,
            error: false,
            message: '',
            success: true,
        });
    }
    catch (exception) {
        logger.child({ _requestid: request._requestid }).error(exception)
        return response.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.cancelEventLaraigo = async (request, response) => {
    try {
        let parameters = request.body.parameters || request.body.data || {};
        const { method, key, phone, name, email } = request.body;

        const result = await executesimpletransaction(method, parameters, null || {});
        if (!(result instanceof Array))
            return response.status(result.rescode).json({ ...result, key });

        parameters._requestid = request._requestid;
        if (result?.[0]?.agentid) deleteGoogleEvent(result?.[0], parameters, 'externalOnly')
        if (["HSM", "HSMEMAIL", "EMAIL"].includes(parameters.canceltype)) {

            const resultCalendar = await executesimpletransaction("QUERY_EVENT_BY_CALENDAR_EVENT_ID", parameters);

            const {
                communicationchanneltype,
                canceltemplateidhsm,
                cancelnotificationhsm,
                cancelcommunicationchannelid,
                canceltemplateidemail,
                cancelnotificationemail,
            } = resultCalendar[0]

            const sendmessage = {
                type: "HSM",
                corpid: parameters.corpid,
                orgid: parameters.orgid,
                username: parameters.username,
                communicationchannelid: cancelcommunicationchannelid,
                hsmtemplateid: canceltemplateidhsm,
                shippingreason: "BOOKING",
                _requestid: request._requestid,
                communicationchanneltype: communicationchanneltype,
                platformtype: communicationchanneltype,
                userid: 0,
                listmembers: [{
                    phone: phone,
                    firstname: name,
                    email: email,
                    lastname: "",
                    parameters: parameters.otros
                }],
                body: cancelnotificationhsm,
            }
            if ("HSMEMAIL" === parameters.canceltype) {
                await send(sendmessage, request._requestid);
                await send({ ...sendmessage, type: "MAIL", body: cancelnotificationemail, hsmtemplateid: canceltemplateidemail }, request._requestuestid);
            } else if ("EMAIL" === parameters.canceltype) {
                await send({ ...sendmessage, type: "MAIL", body: cancelnotificationemail, hsmtemplateid: canceltemplateidemail }, request._requestuestid);
            } else {
                await send(sendmessage, request._requestid);
            }
        }

        return response.status(200).json({
            code: '',
            error: false,
            message: '',
            success: true,
        });

    }
    catch (exception) {
        logger.child({ _requestid: request._requestid }).error(exception)
        return response.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }

}

const generateIcs = async (requestid, calendarData, params) => {
    try {
        logger.error('eventBookingController.Collection generateIcs')
        const timestamp = Date.now();
        const icalfile = getIcalObjectInstance(
            params?.monthdate,
            params?.hourstart,
            calendarData?.timeduration,
            calendarData?.timezone,
            params?.parameters.find(param => param?.name === 'eventname')?.text,
            calendarData?.description,
            calendarData?.location,
            params?.parameters.find(param => param?.name === 'eventlink')?.text,
            'Laraigo',
            'laraigo@vcaperu.com'
        )

        logger.error('eventBookingController.Collection generateIcs buffer')

        const buffer = Buffer.from(icalfile.toString(), 'utf8');
        logger.error('eventBookingController.Collection generateIcs buffer contentType')
        const contentType = 'text/plain';
        const key = `${timestamp}/invite.ics`;

        const rr = await uploadBufferToCos(requestid, buffer, contentType, key);
        logger.error('eventBookingController.Collection generateIcs uploadBufferToCos')
        logger.error(rr)
        return { url: rr.url }
    } catch (error) {
        logger.error('eventBookingController.Collection generateIcs catch error')
        console.log(error)
        return { url: ''}
    }
}

function getIcalObjectInstance(monthdate, hourstart, eventduration, timezoneoffset, eventname, description, location, eventlink, name, email) {
    try {
        const calendar = ical({ name: 'ICal' });
        calendar.method(ICalCalendarMethod.REQUEST);

        const startTime = new Date(`${monthdate}T${hourstart}:00${timezoneoffset >= 0 ? '+' : '-'}${Math.abs(timezoneoffset).toString().padStart(2, '0')}:00`);
        const endTime = new Date(startTime.getTime());
        endTime.setMinutes(endTime.getMinutes() + eventduration);

        calendar.createEvent({
            start: startTime,
            end: endTime,
            summary: eventname,
            description: description,
            location: location,
            url: eventlink,
            organizer: {
                name: name,
                email: email || 'laraigo@vcaperu.com'
            },
        });
        return calendar;
    } catch (error) {
        console.log({ error })
    }
}

const createGoogleEvent = async (assignedAgentId, newcalendarbookingid, calendarData, params, googleCalendarData = null) => {
    dayjs.extend(utc);
    try {
        console.log("🚀 ~ [START]createGoogleEvent")
        let calendar = null, extradata = null;

        if (googleCalendarData) {
            [calendar, extradata] = googleCalendarData
        } else {
            params.calendarintegrationid = assignedAgentId;
            [calendar, extradata] = await googleCalendarCredentials({ params })
        }

        const eventInfo = {
            summary: params?.parameters.find(param => param?.name === 'eventname')?.text,
            location: calendarData?.location,
            description: calendarData?.description,
            start: {
                dateTime: dayjs(`${params?.monthdate} ${params?.hourstart}`).utcOffset(calendarData.timezone, true).format(),
            },
            end: {
                dateTime: dayjs(`${params?.monthdate} ${params?.hourstart}`).add(calendarData.timeduration, 'minute').utcOffset(-5, true).format(),
            },
            attendees: [
                { email: params.email },
            ],
            conferenceData: {
                createRequest: { requestId: uuidv4() },
            },
        }

        const eventData = await calendar.events.insert({
            calendarId: "primary",
            conferenceDataVersion: 1,
            sendUpdates: 'all',
            resource: eventInfo,
        });

        if (eventData?.status === 200) {
            const result = await executesimpletransaction("UFN_CALENDARINTEGRATION_INS", {
                corpid: params.corpid,
                orgid: params.orgid,
                calendarintegrationid: extradata.calendarintegrationid,
                eventid: eventData?.data?.id,
                email: extradata.email,
                status: 'ACTIVO',
                type: 'default',
                createdate: eventData?.data?.created,
                changedate: eventData?.data?.updated,
                summary: eventData?.data?.summary,
                description: eventData?.data?.description,
                timezone: calendarData?.timezone,
                startdate: eventData?.data?.start?.dateTime,
                enddate: eventData?.data?.end?.dateTime,
                timeduration: calendarData?.timeduration,
                calendarbookingid: newcalendarbookingid
            });
        }
        console.log("🚀 ~ [END]createGoogleEvent ~ eventid:", eventData?.data?.id)
    } catch (error) {
        console.log({ error })
    }
}

const deleteGoogleEvent = async (calendarInfo, params, sendUpdates = 'none') => {
    console.log("🚀 ~ [START]deleteGoogleEvent")
    try {
        params.calendarintegrationid = calendarInfo.agentid;
        const [calendar, extradata] = await googleCalendarCredentials({ params })

        if (calendar) {
            const result = await calendar.events.delete({
                calendarId: "primary",
                eventId: calendarInfo.eventid,
                sendUpdates
            });
            console.log("🚀 ~ [END]deleteGoogleEvent ~ result:", result?.status)
        }
    } catch (error) {
        console.log("🚀 ~ [ERROR]deleteGoogleEvent ~ result:", error?.response?.status)
    }
}

const createAutomaticAssignedBookings = async ({ params, calendar, extradata = null }) => {
    try {
        console.log("🚀 ~ [START]deleteGoogleEvent")

        let prevCalendar = extradata?.calendarintegrationid;
        const bd_data = await executesimpletransaction("UFN_CALENDAR_INTEGRATION_TO_CREATE_SEL", {
            calendarintegrationid: extradata?.calendarintegrationid,
            calendareventid: params?.id
        });

        if (bd_data instanceof Array && bd_data.length > 0) {
            bd_data.forEach(event => {
                createGoogleEvent(
                    event.calendarintegrationid,
                    event.calendarbookingid,
                    event,
                    { ...event, email: event.personmail, hourstart: event.hourstart.toString(), parameters: [{ name: 'eventname', text: event.name }] },
                    prevCalendar === event.calendarintegrationid ? [calendar, extradata] : null
                )
                prevCalendar = event.calendarintegrationid
            })
        }

        console.log("🚀 ~ [END]createAutomaticAssignedBookings")
    } catch (error) {
        console.log({ error })
    }
}