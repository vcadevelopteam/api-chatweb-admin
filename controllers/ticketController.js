const axios = require('axios')
const tf = require('../config/triggerfunctions');
const { generatefilter, generateSort, errors, getErrorCode } = require('../config/helpers');
// var https = require('https');

// const agent = new https.Agent({
//     rejectUnauthorized: false
// });
exports.reply = async (req, res) => {
    try {
        const { data } = req.body;

        for (const [key, value] of Object.entries(data)) {
            if (value === null)
                data[key] = "";
        }

        data.fromasesor = "fromasesor";

        if (!data.corpid)
            data.p_corpid = req.user.corpid;
        if (!data.orgid)
            data.p_orgid = req.user.orgid;
        if (!data.username)
            data.username = req.user.usr;
        if (!data.userid)
            data.p_userid = req.user.userid;

        data.agentName = req.user.fullname;

        const responseservices = await axios.post(
            `${process.env.SERVICES}ServiceLogicHook/ProcessMessageOut`,
            { method: "", parameters: data });

        if (!responseservices.data || !responseservices.data instanceof Object)
            return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));

        if (!responseservices.data.Success) {
            return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));
        }

        res.json(responseservices.data);
    }
    catch (ee) {
        console.log(ee);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}

exports.replyListMessages = async (req, res) => {
    try {
        const { data: listMessages } = req.body;

        listMessages.forEach(async data => {
            for (const [key, value] of Object.entries(data)) {
                if (value === null)
                    data[key] = "";
            }

            data.fromasesor = "fromasesor";

            if (!data.corpid)
                data.p_corpid = req.user.corpid;
            if (!data.orgid)
                data.p_orgid = req.user.orgid;
            if (!data.username)
                data.username = req.user.usr;
            if (!data.userid)
                data.p_userid = req.user.userid;

            data.agentName = req.user.fullname;

            const responseservices = await axios.post(
                `${process.env.SERVICES}ServiceLogicHook/ProcessMessageOut`,
                { method: "", parameters: data });

            if (!responseservices.data || !responseservices.data instanceof Object)
                return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));

            if (!responseservices.data.Success) {
                return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));
            }
        })
        res.json({ success: true });
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
            return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));

        if (!responseservices.data.Success) {
            return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));
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

exports.reassign = async (req, res) => {
    try {
        const { data } = req.body;

        if (!data.corpid)
            data.corpid = req.user.corpid ? req.user.corpid : 1;
        if (!data.orgid)
            data.orgid = req.user.orgid ? req.user.orgid : 1;
        if (!data.username)
            data.username = req.user.usr;

        data.userid = req.user.userid;

        if (!data.newuserid && data.usergroup) { //id del bot
            data.newuserid = 3;
        }

        if (!data.newuserid && !data.usergroup) { //esta siendo reasigando x el mismo supervisor
            data.newuserid = req.user.userid;
        }

        await tf.executesimpletransaction("UFN_CONVERSATION_REASSIGNTICKET", data);

        res.json({ success: true });
    }
    catch (ee) {
        console.log(ee);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}

exports.massiveClose = async (req, res) => {
    try {
        const { data } = req.body;
        if (!data.corpid)
            data.p_corpid = req.user.corpid ? req.user.corpid : 1;
        if (!data.orgid)
            data.p_orgid = req.user.orgid ? req.user.orgid : 1;
        if (!data.username)
            data.p_username = req.user.usr;
        if (!data.userid)
            data.p_userid = req.user.userid;
        const responseservices = await axios.post(
            `${process.env.SERVICES}ServiceLogicHook/ManageTickets`,
            { method: "", parameters: data });

        console.log(responseservices.data)

        if (!responseservices.data || !responseservices.data instanceof Object) {
            return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));
        }

        if (!responseservices.data.Success) {
            return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));
        }
        res.json({ success: true });
    }
    catch (ee) {
        return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES, ee));
    }
}

exports.sendHSM = async (req, res) => {
    try {
        const { data } = req.body;
        if (!data.corpid)
            data.corpid = req.user.corpid ? req.user.corpid : 1;
        if (!data.orgid)
            data.orgid = req.user.orgid ? req.user.orgid : 1;
        if (!data.username)
            data.username = req.user.usr;
        if (!data.userid)
            data.userid = req.user.userid;

        if (data.type === "MAIL") {
            let jsonconfigmail = "";

            const resBD = await Promise.all([
                tf.executesimpletransaction("QUERY_GET_CONFIG_MAIL", data),
                tf.executesimpletransaction("QUERY_GET_MESSAGETEMPLATE", data)
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

            data.listmembers.forEach(x => {
                tf.executesimpletransaction("QUERY_INSERT_TASK_SCHEDULER", {
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
                        attachments: mailtemplate.attachment ? mailtemplate.attachment.split(",") : []
                    }),
                    repeatflag: false,
                    repeatmode: 0,
                    repeatinterval: 0,
                    completed: false,
                })
            })
        } else {
            if (data.type === "SMS") {
                const smschannel = await tf.executesimpletransaction("QUERY_GET_SMS_DEFAULT_BY_ORG", data);
                console.log(smschannel)
                if (smschannel[0] && smschannel) {
                    data.communicationchannelid = smschannel[0].communicationchannelid;
                    data.communicationchanneltype = smschannel[0].type;
                    data.platformtype = smschannel[0].type;
                }
            }

            const responseservices = await axios.post(
                `${process.env.SERVICES}handler/external/sendhsm`, data);

            if (!responseservices.data || !responseservices.data instanceof Object) {
                return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));
            }

            if (!responseservices.data.Success) {
                return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));
            }
        }
        res.json({ success: true });
    }
    catch (ee) {
        console.log(ee)
        return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR, ee));
    }
}