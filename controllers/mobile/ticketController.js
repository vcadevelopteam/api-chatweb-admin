require('dotenv').config({ path: 'variables.env' });
const axios = require('axios')
const { executesimpletransaction } = require('../../config/mobile/triggerMobileFunction');
const { errors, getErrorCode, setSessionParameters } = require('../../config/helpers');
const { pushNotification } = require('../mobile/notificationMobileController')

exports.reply = async (req, res) => {
    try {
        const { data } = req.body;

        for (const [key, value] of Object.entries(data)) {
            if (value === null)
                data[key] = "";
        }

        data.fromasesor = "fromasesor";
        setSessionParameters(data, req.user, req._requestid);
        /*
        if (!data.corpid)
            data.p_corpid = req.user.corpid ? req.user.corpid : 1;
        if (!data.orgid)
            data.p_orgid = req.user.orgid ? req.user.orgid : 1;
        if (!data.username)
            data.username = req.user.usr;
        if (!data.userid)
            data.p_userid = req.user.userid;
*/
        data.agentName = req.user.fullname;

        const responseservices = await axios.post(
            `${process.env.SERVICES}ServiceLogicHook/ProcessMessageOut`,
            { method: "", parameters: data });

        if (!responseservices.data || !responseservices.data instanceof Object)
            return res.status(500).json({ msg: "Hubo un problema, vuelva a intentarlo" });

        if (!responseservices.data.Success) {
            return res.status(500).json({ msg: "No se pudo enviar el mensaje" });
        }
        const ticket = {
            conversationid: data.p_conversationid,
            ticketnum: data.ticketnum,
            personcommunicationchannel: data.p_messagesourcekey1,
            lastmessage: data.p_messagetext,
            typemessage: data.p_type,
            interactionid: 0,
            userid: data.p_userid,
            corpid: data.p_corpid,
            orgid: data.p_orgid,
            ticketWasAnswered: data.newanswered,
            wasanswered: data.newanswered,
            status: data.status || "ASIGNADO"
            
        }
        axios.post(`${process.env.APP_MOBILE_SOCKET}inbox/sendMessageFromBotHub`, ticket);

        res.json({ success: true });
    }
    catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}

exports.triggerBlock = async (req, res) => {
    try {
        const data = req.body;
        console.log("triggerBlock", data)
        data.p_corpid = req.user.corpid;
        data.p_orgid = req.user.orgid;
        data.username = req.user.usr;
        data.p_userid = req.user.userid;
        data.tokenmovil = req.user.token;

        const responseservices = await axios.post(`${process.env.SERVICES}handler/triggerblock`, data);

        if (!responseservices.data || !responseservices.data instanceof Object)
            return res.status(500).json({ msg: "Hubo un problema, vuelva a intentarlo" });

        res.json({ success: true });
    }
    catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}

exports.close = async (req, res) => {
    try {
        const { data } = req.body;

        for (const [key, value] of Object.entries(data)) {
            if (value === null)
                data[key] = "";
        }

        data.fromasesor = "fromasesor";
        setSessionParameters(data, req.user, req._requestid);
        /*
        if (!data.corpid)
            data.p_corpid = req.user.corpid ? req.user.corpid : 1;
        if (!data.orgid)
            data.p_orgid = req.user.orgid ? req.user.orgid : 1;
        if (!data.username)
            data.p_username = req.user.usr;
        if (!data.userid)
            data.p_userid = req.user.userid;
        */
        data.closeby = "USER";
        data.p_status = "CERRADO";

        const responseservices = await axios.post(
            `${process.env.SERVICES}ServiceLogicHook/closeticket`,
            { method: "", parameters: data });

        if (!responseservices.data || !responseservices.data instanceof Object)
            return res.status(500).json({ msg: "Hubo un problema, vuelva a intentarlo" });

        if (!responseservices.data.Success) {
            return res.status(500).json({ msg: responseservices.data.Msg });
        }
        data.isanswered = data.isanswered.toString();

        const body = new URLSearchParams({
            ticketnum: data.ticketnum,
            lastasesorid: data.p_userid,
            corpid: req.user.corpid,
            orgid: req.user.orgid,
            statusticket: data.status,
            conversationid: data.p_conversationid,
            isanswered: data.isanswered.toString()
        });

        const responseapp = await axios.post(`${process.env.APP_MOBILE_SOCKET}inbox/DeleteTicketHub`, body);

        // if (!responseapp.data || !responseapp.data instanceof Object)
        //     return res.status(500).json({ msg: "Hubo un problema, vuelva a intentarlo" });

        res.json({ success: true });
    }
    catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}

exports.reasign = async (req, res) => {
    try {
        const { data } = req.body;
        console.log("data-reassign", data);

        if (!data.corpid)
            data.corpid = req.user.corpid ? req.user.corpid : 1;
        if (!data.orgid)
            data.orgid = req.user.orgid ? req.user.orgid : 1;
        if (!data.username)
            data.username = req.user.usr;
        if (!data.userid) {
            data.lastuserid = req.user.userid;
            data.userid = data.newuserid;
        }
        if (!data.newuserid && data.usergroup) {
            data.newuserid = 3;
            data.userid = 3;
        }
        if (data.newuserid !== 3) {
            executesimpletransaction("UFN_GET_TOKEN_LOGGED_MOVIL", { userid: data.userid }).then(resBD => {
                if (resBD instanceof Array && resBD.length > 0) {
                    if (resBD[0].token) {
                        const ticketToGive = {
                            data: {
                                displayname: data.displayname,
                                lastmessage: 'Ticket reasignado',
                                interactiontype: 'text',
                                interactionid: 0,
                                ticketnum: data.ticketnum,
                                newConversation: true,
                                conversationid: data.conversationid,
                                mode: "messagein",
                                corpid: data.corpid,
                                orgid: data.orgid,
                                token: resBD[0].token,
                            },
                            notification: {
                                title: `Mensaje nuevo de ${data.displayname}`,
                                body: data.lastmessage,
                            }
                        }
                        pushNotification(ticketToGive)
                    }
                }
            });
        }


        await executesimpletransaction("UFN_CONVERSATION_REASSIGNTICKET", data);

        const responseapp = await axios.post(`${process.env.APP_MOBILE_SOCKET}inbox/ReassignedTicketHub`, data);

        if (!responseapp.data || !responseapp.data instanceof Object)
            return res.status(500).json({ msg: "Hubo un problema, vuelva a intentarlo" });

        res.json({ success: true, msg: '' });;
    }
    catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}

exports.sendhsm = async (req, res) => {
    try {
        const { data } = req.body;
        console.log("data-reassign", data);

        if (!data.corpid)
            data.corpid = req.user.corpid ? req.user.corpid : 1;
        if (!data.orgid)
            data.orgid = req.user.orgid ? req.user.orgid : 1;
        if (!data.username)
            data.username = req.user.usr;
        if (!data.userid) {
            data.lastuserid = req.user.userid;
            data.userid = data.newuserid;
        }
        if (!data.newuserid && data.usergroup) {
            data.newuserid = 3;
            data.userid = 3;
        }

        await executesimpletransaction("QUERY_UPDATE_PERSON_BY_HSM", { ...data, personid: data.listmembers[0].personid });

        const responseservices = await axios.post(`${process.env.SERVICES}handler/external/sendhsm`, data);

        if (!responseservices.data.Success) {
            return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));
        }

        const ticket = {
            conversationid: data.conversationid,
            ticketnum: data.ticketnum,
            personcommunicationchannel: data.personcommunicationchannel,
            lastmessage: data.message,
            wasanswered: data.newanswered,
            typemessage: "text",
            interactionid: 0,
            userid: data.userid,
            corpid: data.corpid,
            orgid: data.orgid,
        }
        axios.post(`${process.env.APP_MOBILE_SOCKET}inbox/sendMessageFromBotHub`, ticket);

        const ticketToGive = {
            data: {
                displayname: data.displanyame,
                lastmessage: data.message,
                interactiontype: 'text',
                interactionid: 0,
                ticketnum: data.ticketnum,
                newConversation: false,
                isAgent: true,
                conversationid: data.conversationid,
                mode: "messagein",
                corpid: data.corpid,
                orgid: data.orgid,
                token: req.user.token,
            },
            notification: {
                title: `Mensaje nuevo de ${data.displayname}`,
                body: data.message,
            }
        }
        pushNotification(ticketToGive)

        res.json({ success: true, msg: '' });;
    }
    catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}