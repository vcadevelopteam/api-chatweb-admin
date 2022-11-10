const { executesimpletransaction } = require('../config/triggerfunctions');
const { getErrorCode, errors, axiosObservable } = require('../config/helpers');
const logger = require('../config/winston');
const { setSessionParameters } = require('../config/helpers');
const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');

const method_allowed = [
    "QUERY_GET_PERSON_FROM_BOOKING",
    "QUERY_EVENT_BY_CODE",
    "UFN_CALENDARYBOOKING_INS",
    "UFN_CALENDARYBOOKING_SEL_DATETIME",
    "QUERY_GET_EVENTS_PER_PERSON",
    "QUERY_CANCEL_EVENT_BY_CALENDARBOOKINGID",
    "QUERY_GET_EVENT_BY_BOOKINGID"
]

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

            if (notificationtype === "EMAIL" || notificationtype === "HSM") {
                const sendmessage = {
                    corpid: parameters.corpid,
                    orgid: parameters.orgid,
                    username: parameters.username,
                    communicationchannelid: communicationchannelid,
                    hsmtemplateid: messagetemplateid,
                    type: notificationtype,
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
        logger.child({ _requestid: params._requestid, context: { ...params, extradata }}).error(exception)
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
        logger.child({ _requestid: params._requestid, context: { ...params, extradata }}).error(exception)
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
                const calendar_data = await calendar.calendars.get({calendarId: 'primary'})
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
            oauth2Client.setCredentials(credentials)
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
        logger.child({ _requestid: params._requestid, context: params }).error(exception)
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
            try {
                const calendar = google.calendar({
                    version: 'v3',
                    auth: oauth2Client
                });
                await calendar.channels.stop({
                    requestBody: {
                        id: extradata?.watchid,
                        resourceId: extradata?.resourceid
                    }})
            }
            catch (exception) {
                logger.child({ _requestid: params._requestid, context: { ...params, extradata }}).error(exception)
            }
            // Revoke
            const access_token = await oauth2Client.getAccessToken()
            const success = await oauth2Client.revokeToken(access_token.token)
            if (success) {
                await googleCalendarCredentialsClean({ params, extradata })
            }
            return success
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
        logger.child({ _requestid: params._requestid, context: params }).error(exception)
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
                    }})
            }
            catch (exception) {
                logger.child({ _requestid: params._requestid, context: { ...params, extradata }}).error(exception)
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
        logger.child({ _requestid: params._requestid, context: { ...params, extradata }}).error(exception)
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
        logger.child({ _requestid: request._requestid, context: request.body }).error(exception)
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
        logger.child({ _requestid: request._requestid, context: request.body }).error(exception)
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
        const params = { ...request.body, _requestid: request._requestid }
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
        logger.child({ _requestid: request._requestid, context: request.body }).error(exception)
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
        logger.child({ _requestid: request._requestid, context: request.body }).error(exception)
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
        if (calendar
            && params?.watchid === extradata?.watchid
            && params?.resourceid === extradata?.resourceid
        ) {
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
        logger.child({ _requestid: request._requestid, context: request.body }).error(exception)
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
        logger.child({ _requestid: request._requestid, context: request.body }).error(exception)
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
                }})
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
        logger.child({ _requestid: request._requestid, context: request.body }).error(exception)
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