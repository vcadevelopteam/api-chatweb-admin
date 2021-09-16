const axios = require('axios')
const tf = require('../config/triggerfunctions');;

exports.reply = async (req, res) => {
    try {
        const { data } = req.body;

        for (const [key, value] of Object.entries(data)) {
            if (value === null)
                data[key] = "";
        }

        data.fromasesor = "fromasesor";

        if (!data.corpid)
            data.p_corpid = req.user.corpid ? req.user.corpid : 1;
        if (!data.orgid)
            data.p_orgid = req.user.orgid ? req.user.orgid : 1;
        if (!data.username)
            data.username = req.user.usr;
        if (!data.userid)
            data.p_userid = req.user.userid;

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
            ticketnum: data.ticketnum,
            personcommunicationchannel: data.p_messagesourcekey1,
            lastmessage: data.p_messagetext,
            typemessage: data.p_type,
            interactionid: 0,
            userid: data.p_userid,
            corpid: data.p_corpid,
            orgid: data.p_orgid,
            wasanswered: data.newanswered
        }
        // const responseapp = await axios.post(`${process.env.APP}inbox/AnswerAsesorUpdateSupervisor`, ticket);

        // if (!responseapp.data || !responseapp.data instanceof Object)
        //     return res.status(500).json({ msg: "Hubo un problema, vuelva a intentarlo" });

        res.json(responseservices.data);
    }
    catch (ee) {
        console.log(ee);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}

exports.close = async (req, res) => {
    try {
        const { data } = req.body;
        console.log(data)

        for (const [key, value] of Object.entries(data)) {
            if (value === null)
                data[key] = "";
        }

        data.fromasesor = "fromasesor";

        if (!data.corpid)
            data.p_corpid = req.user.corpid ? req.user.corpid : 1;
        if (!data.orgid)
            data.p_orgid = req.user.orgid ? req.user.orgid : 1;
        if (!data.username)
            data.p_username = req.user.usr;
        if (!data.userid)
            data.p_userid = req.user.userid;

        data.closeby = "USER";
        data.p_status = "CERRADO";

        const responseservices = await axios.post(
            `${process.env.SERVICES}ServiceLogicHook/closeticket`,
            { method: "", parameters: data });
        console.log(responseservices.data)
        if (!responseservices.data || !responseservices.data instanceof Object)
            return res.status(500).json({ msg: "Hubo un problema, vuelva a intentarlo" });

        if (!responseservices.data.Success) {
            return res.status(500).json({ msg: responseservices.data.Msg });
        }
        // data.isanswered = data.isanswered.toString();
        // const responseapp = await axios.post(`${process.env.APP}inbox/CloseTicketUpdateSupervisors`, data);

        // if (!responseapp.data || !responseapp.data instanceof Object)
        //     return res.status(500).json({ msg: "Hubo un problema, vuelva a intentarlo" });

        res.json(responseservices.data);
    }
    catch (ee) {
        console.log(ee);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}
exports.reasign = async (req, res) => {
    try {
        const { data } = req.body;

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
            data.newuserid = 51;
            data.userid = 51;
        }

        await tf.executesimpletransaction("UFN_CONVERSATION_REASSIGNTICKET", data);

        const responseapp = await axios.post(`${process.env.APP}inbox/ReassignedTicketHub`, data);

        if (!responseapp.data || !responseapp.data instanceof Object)
            return res.status(500).json({ msg: "Hubo un problema, vuelva a intentarlo" });

        res.json(responseapp.data);
    }
    catch (ee) {
        console.log(ee);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}
