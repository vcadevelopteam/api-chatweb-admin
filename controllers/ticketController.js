const { errors, getErrorCode, axiosObservable } = require('../config/helpers');
const { executesimpletransaction } = require('../config/triggerfunctions');

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

        const responseservices = await axiosObservable({
            method: "post",
            url: `${process.env.SERVICES}ServiceLogicHook/ProcessMessageOut`,
            data: { method: "", parameters: data },
            _requestid: req._requestid,
        });

        if (!responseservices.data || !responseservices.data instanceof Object)
            return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));

        if (!responseservices.data.Success) {
            return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));
        }

        res.json(responseservices.data);
    }
    catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
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

            const responseservices = await axiosObservable({
                method: "post",
                url: `${process.env.SERVICES}ServiceLogicHook/ProcessMessageOut`,
                data: { method: "", parameters: data },
                _requestid: req._requestid,
            });

            if (!responseservices.data || !responseservices.data instanceof Object)
                return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));

            if (!responseservices.data.Success) {
                return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));
            }
        })
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

        const responseservices = await axiosObservable({
            method: "post",
            url: `${process.env.SERVICES}ServiceLogicHook/closeticket`,
            data: { method: "", parameters: data },
            _requestid: req._requestid,
        });

        if (!responseservices.data || !responseservices.data instanceof Object)
            return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));

        if (!responseservices.data.Success) {
            return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));
        }

        res.json(responseservices.data);
    }
    catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
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
        data._requestid = req._requestid;

        if (!data.newuserid && data.usergroup) { //id del bot
            data.newuserid = 3;
        }

        if (!data.newuserid && !data.usergroup) { //esta siendo reasigando x el mismo supervisor
            data.newuserid = req.user.userid;
        }

        await executesimpletransaction("UFN_CONVERSATION_REASSIGNTICKET", { ...data, _requestid: req._requestid });

        res.json({ success: true });
    }
    catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
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

        const responseservices = await axiosObservable({
            method: "post",
            url: `${process.env.SERVICES}ServiceLogicHook/ManageTickets`,
            data: { method: "", parameters: data },
            _requestid: req._requestid,
        });

        if (!responseservices.data || !responseservices.data instanceof Object) {
            return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));
        }

        if (!responseservices.data.Success) {
            return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));
        }
        res.json({ success: true });
    }
    catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
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

        data._requestid = req._requestid;

        if (data.listmembers.every(x => !!x.personid)) {
            await executesimpletransaction("QUERY_UPDATE_PERSON_BY_HSM", { _requestid: req._requestid }, false, {
                personids: data.listmembers.map(x => x.personid),
                corpid: data.corpid,
                orgid: data.orgid,
            })
        }

        if (data.type === "MAIL") {
            let jsonconfigmail = "";
            const resBD = await Promise.all([
                executesimpletransaction("QUERY_GET_CONFIG_MAIL", data),
                executesimpletransaction("QUERY_GET_MESSAGETEMPLATE", data)
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
                                x: x.value
                            })) : []
                        }),
                        repeatflag: false,
                        repeatmode: 0,
                        repeatinterval: 0,
                        completed: false,
                        _requestid: req._requestid,
                    })
                } else {
                    executesimpletransaction("QUERY_INSER_HSM_HISTORY", {
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
                method: "post",
                url: `${process.env.SERVICES}handler/external/sendhsm`,
                data,
                _requestid: req._requestid,
            });

            if (!responseservices.data.Success) {
                return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));
            }
        }
        res.json({ success: true });
    }
    catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}

exports.import = async (req, res) => {
    try {
        const { data } = req.body;
        if (!data?.corpid)
            data.corpid = req.user?.corpid ? req.user.corpid : 1;
        if (!data?.orgid)
            data.orgid = req.user?.orgid ? req.user.orgid : 1;

        data._requestid = req._requestid;

        const bot_result = await executesimpletransaction("QUERY_ORG_BOT_SEL", {
            corpid: data.corpid,
            orgid: data.orgid,
            _requestid: req._requestid,
        });

        const botid = bot_result?.[0]?.userid || 2;
        const botname = bot_result?.[0]?.fullname || 'BOT SYSTEM';

        // Add conversation unique identifier
        data.datatable = data.datatable.map(d => ({
            ...d,
            auxid: d.personphone
        }));

        // Unique channels
        const channel_list = [...new Set(data.datatable.map(d => d.channel))];

        // Channels info
        const channel_result = await executesimpletransaction("QUERY_TICKETIMPORT_CHANNELS_SEL", {
            corpid: data.corpid,
            orgid: data.orgid,
            channels: channel_list.join(','),
            _requestid: req._requestid,
        });

        const channel_dict = channel_result.reduce((ac, c) => ({
            ...ac,
            [c.communicationchannelsite]: c
        }), {});

        // Add channel information to the data
        data.datatable = data.datatable.map(d => ({
            ...d,
            communicationchannelid: channel_dict[d.channel]?.communicationchannelid,
            channeltype: channel_dict[d.channel]?.channeltype,
            personcommunicationchannel: `${d.personphone}_${channel_dict[d.channel]?.channeltype}`
        }));

        // Pcc info
        const pcc_result = await executesimpletransaction("QUERY_TICKETIMPORT_PCC_SEL", {
            corpid: data.corpid,
            orgid: data.orgid,
            _requestid: req._requestid,
        });

        const pcc_dict = pcc_result.reduce((ac, c) => ({
            ...ac,
            [c.personcommunicationchannel]: c
        }), {});

        // Add pcc information to the data
        data.datatable = data.datatable.map(d => ({
            ...d,
            personid: pcc_dict[d.personcommunicationchannel]?.personid
        }));

        // Get uniques personcommunicationchannel
        let pcc_to_create = [...new Map(data.datatable.map(d => [d['personcommunicationchannel'], d])).values()];

        // Filter the pcc that should be created
        pcc_to_create = pcc_to_create.filter(d => !pcc_result.map(pcc => pcc.personcommunicationchannel).includes(d.personcommunicationchannel));

        /*
        CREATE TYPE udtt_ticket_import AS (
            corpid bigint,
            orgid bigint,
            personid bigint,
            personcommunicationchannel text,
            communicationchannelid bigint,
            channeltype text,
            personname text,
            personphone text,
            auxid text,
            conversationid bigint,
            interactiontext text,
            interactionuserid bigint
        );
        ALTER TABLE person ADD COLUMN auxpcc TEXT;
        ALTER TABLE conversation ADD COLUMN auxid BIGINT;
        */

        // Create persons
        if (pcc_to_create.length > 0) {
            const person_result = await executesimpletransaction("QUERY_TICKETIMPORT_PERSON_INS", {
                corpid: data.corpid,
                orgid: data.orgid,
                botname: botname,
                datatable: JSON.stringify(pcc_to_create),
                _requestid: req._requestid,
            });

            const person_dict = person_result.reduce((ac, c) => ({
                ...ac,
                [c.personcommunicationchannel]: c
            }), {});

            // Add person information to pcc to create
            pcc_to_create = pcc_to_create.map(p => ({
                ...p,
                personid: person_dict[p.personcommunicationchannel]?.personid
            }));

            // Create pccs
            await executesimpletransaction("QUERY_TICKETIMPORT_PCC_INS", {
                corpid: data.corpid,
                orgid: data.orgid,
                datatable: JSON.stringify(pcc_to_create),
                _requestid: req._requestid,
            });

            // Add person information to the data
            data.datatable = data.datatable.map(d => ({
                ...d,
                personid: !d.personid ? person_dict[d.personcommunicationchannel]?.personid : d.personid
            }));
        }

        // Get uniques conversation
        const conversation_to_create = [...new Map(data.datatable.map(d => [d['auxid'], d])).values()];

        // Create conversations
        const conversation_result = await executesimpletransaction("QUERY_TICKETIMPORT_CONVERSATION_INS", {
            corpid: data.corpid,
            orgid: data.orgid,
            botid: botid,
            datatable: JSON.stringify(conversation_to_create),
            _requestid: req._requestid,
        });

        // Actualización de ticketnum<orgid>seq
        await executesimpletransaction("UFN_TICKETNUM_FIX", {
            corpid: data.corpid,
            orgid: data.orgid,
            _requestid: req._requestid,
        });

        const conversation_dict = conversation_result.reduce((ac, c) => ({
            ...ac,
            [c.auxid]: c
        }), {});

        // Add conversation information to the data
        data.datatable = data.datatable.map(d => ({
            ...d,
            conversationid: conversation_dict[d.auxid]?.conversationid,
            interactionuserid: d.interactionfrom === 'CLIENT' ? null : botid
        }));

        // Create interactions
        await executesimpletransaction("QUERY_TICKETIMPORT_INTERACTION_INS", {
            corpid: data.corpid,
            orgid: data.orgid,
            datatable: JSON.stringify(data.datatable),
            _requestid: req._requestid,
        });

        res.json({ success: true });
    }
    catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}