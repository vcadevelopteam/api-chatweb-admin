const axios = require('axios')
const tf = require('../config/triggerfunctions');
const { generatefilter, generateSort, errors, getErrorCode } = require('../config/helpers');
const { executesimpletransaction } = require('../config/triggerfunctions');
const { uploadToCOS, unrar, unzip } = require('../config/filefunctions');
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

        if (data.listmembers.every(x => !!x.personid)) {
            await tf.executesimpletransaction("QUERY_UPDATE_PERSON_BY_HSM", undefined, false, {
                personids: data.listmembers.map(x => x.personid),
                corpid: data.corpid,
                orgid: data.orgid,
            })
        }

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

            data.listmembers.forEach(async x => {
                const resCheck = await tf.executesimpletransaction("UFN_BALANCE_CHECK", { ...data, receiver: x.email, communicationchannelid: 0 })

                let send = false;
                if (resCheck instanceof Array && resCheck.length > 0) {
                    data.fee = resCheck[0].fee;
                    const balanceid = resCheck[0].balanceid;
                    
                    if (balanceid == 0) {
                        send = true;
                    } else {
                        const resValidate = await tf.executesimpletransaction("UFN_BALANCE_OUTPUT", { ...data, receiver: x.email, communicationchannelid: 0 })
                        if (resValidate instanceof Array) {
                            send = true;
                        }
                    }
                }
                
                
                if (send) {
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
                    })
                } else {
                    tf.executesimpletransaction("QUERY_INSER_HSM_HISTORY", {
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
            console.log(responseservices.data)
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

exports.import = async (req, res) => {
    try {
        const { data = {}, channelsite } = req.body;
        if (req.files.length > 10) {
            return res.status(400).json(getErrorCode(errors.LIMIT_EXCEEDED));
        }
        
        const attachments = []

        const zip_list = req.files.filter(f => f.mimetype === 'application/x-zip-compressed' && f.originalname !== 'wa_layout.css');
        for (let i = 0; i < zip_list.length; i++) {
            let files = await unzip(zip_list[i])
            if (files) {
                for (let j = 0; j < files.length; j++) {
                    if (files[j]?.size < 10*1024*1024) {
                        let cosname = await uploadToCOS({
                            size: files[j]?.size,
                            originalname: files[j]?.name,
                            buffer: files[j]?.data,
                            mimetype: null
                        }, req.user?.orgdesc || "anonymous")
                        attachments.push({filename: files[j].name, url: cosname });
                    }
                }
            }
        }
        
        const rar_list = req.files.filter(f => f.originalname.includes('.rar'));
        for (let i = 0; i < rar_list.length; i++) {
            let files = await unrar(rar_list[i])
            if (files) {
                for (let j = 0; j < files.length; j++) {
                    if (files[j]?.size < 10*1024*1024) {
                        let cosname = await uploadToCOS({
                            size: files[j]?.fileHeader?.unpSize,
                            originalname: files[j]?.fileHeader?.name,
                            buffer: Buffer.from(files[j]?.extraction),
                            mimetype: null
                        }, req.user?.orgdesc || "anonymous")
                        attachments.push({filename: files[j].name, url: cosname });
                    }
                }
            }
        }

        // Joining csv files
        const csv_list = req.files.filter(f => f.mimetype === 'text/csv');
        let datatable = [];
        for (const csv_elem of csv_list) {
            const csv = csv_elem.buffer.toString();
            let allTextLines = csv.split(/\r\n|\n/);
            let headers = allTextLines[0].split(';');
            let lines = [];
            for (let i = 1; i < allTextLines.length; i++) {
                if (allTextLines[i].split(';').length === headers.length) {
                    const line = allTextLines[i].split(';')
                    const data = {
                        ...headers.reduce((ad, key, j) => ({
                            ...ad,
                            [key]: line[j][0] === '"' && line[j].slice(-1) === '"' ? line[j].slice(1,-1) : line[j]
                        }), {}),
                    }
                    for (let j = 0; j < attachments.length; j++) {
                        data.MessageBody = data.MessageBody.replace(attachments[j].filename, attachments[j].url)
                    }
                    lines.push(data)
                }
            }
            // const phones = [...new Set(lines.map(d => d.UserPhone))];
            // const personphone = phones.filter(p => p !== channelsite)?.[0];
            const personphone = csv_elem.originalname.split('.')[0];
            const personname = lines.filter(l => l.UserPhone === personphone)?.[0]?.UserName;
            datatable = [
                ...datatable,
                ...lines.map(line => ({
                    ...line,
                    "channel": channelsite,
                    "personname": personname,
                    "personphone": personphone,
                    "interactiontext": line.MessageBody,
                    "interactionfrom": personphone === line.UserPhone ? 'CLIENT' : 'BOT'
                }))
            ]
        }

        if (!data?.corpid)
            data.corpid = req.user?.corpid ? req.user.corpid : 1;
        if (!data?.orgid)
            data.orgid = req.user?.orgid ? req.user.orgid : 1;

        const bot_result = await executesimpletransaction("QUERY_ORG_BOT_SEL", {
            corpid: data.corpid,
            orgid: data.orgid,
        });
        
        const botid = bot_result?.[0]?.userid || 2;
        const botname = bot_result?.[0]?.fullname || 'BOT SYSTEM';
        
        // Add conversation unique identifier
        datatable = datatable.map(d => ({
            ...d,
            auxid: d.personphone
        }));

        // Unique channels
        const channel_list = [...new Set(datatable.map(d => d.channel))];

        // Channels info
        const channel_result = await executesimpletransaction("QUERY_TICKETIMPORT_CHANNELS_SEL", {
            corpid: data.corpid,
            orgid: data.orgid,
            channels: channel_list.join(',')
        });

        const channel_dict = channel_result.reduce((ac, c) => ({
            ...ac,
            [c.communicationchannelsite]: c 
        }), {});

        // Add channel information to the data
        datatable = datatable.map(d => ({
            ...d,
            communicationchannelid: channel_dict[d.channel]?.communicationchannelid,
            channeltype: channel_dict[d.channel]?.channeltype,
            personcommunicationchannel: `${d.personphone}_${channel_dict[d.channel]?.channeltype}`
        }));

        // Pcc info
        const pcc_result = await executesimpletransaction("QUERY_TICKETIMPORT_PCC_SEL", {
            corpid: data.corpid,
            orgid: data.orgid
        });

        const pcc_dict = pcc_result.reduce((ac, c) => ({
            ...ac,
            [c.personcommunicationchannel]: c
        }), {});

        // Add pcc information to the data
        datatable = datatable.map(d => ({
            ...d,
            personid: pcc_dict[d.personcommunicationchannel]?.personid
        }));

        // Get uniques personcommunicationchannel
        let pcc_to_create = [...new Map(datatable.map(d => [d['personcommunicationchannel'], d])).values()];

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
                datatable: JSON.stringify(pcc_to_create)
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
                datatable: JSON.stringify(pcc_to_create)
            });
    
            // Add person information to the data
            datatable = datatable.map(d => ({
                ...d,
                personid: !d.personid ? person_dict[d.personcommunicationchannel]?.personid : d.personid
            }));
        }

        // Get uniques conversation
        const conversation_to_create = [...new Map(datatable.map(d => [d['auxid'], d])).values()];

        // Create conversations
        const conversation_result = await executesimpletransaction("QUERY_TICKETIMPORT_CONVERSATION_INS", {
            corpid: data.corpid,
            orgid: data.orgid,
            botid: botid,
            datatable: JSON.stringify(conversation_to_create)
        });

        // Actualización de ticketnum<orgid>seq
        await executesimpletransaction("UFN_TICKETNUM_FIX", {
            corpid: data.corpid,
            orgid: data.orgid,
        });

        const conversation_dict = conversation_result.reduce((ac, c) => ({
            ...ac,
            [c.auxid]: c
        }), {});

        // Add conversation information to the data
        datatable = datatable.map(d => ({
            ...d,
            conversationid: conversation_dict[d.auxid]?.conversationid,
            interactionuserid: d.interactionfrom === 'CLIENT' ? null : botid
        }));

        // Create interactions
        await executesimpletransaction("QUERY_TICKETIMPORT_INTERACTION_INS", {
            corpid: data.corpid,
            orgid: data.orgid,
            datatable: JSON.stringify(datatable)
        });
        
        res.json({ success: true });
    }
    catch (ee) {
        return res.status(400).json(ee);
    }
}