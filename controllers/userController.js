const { executesimpletransaction, executeTransaction } = require('../config/triggerfunctions');
const jwt = require("jsonwebtoken");
require('dotenv').config();
const bcryptjs = require("bcryptjs");
const { setSessionParameters } = require('../config/helpers');
const { errors, getErrorCode } = require('../config/helpers');
const voximplant = require("../config/voximplantfunctions");

exports.updateInformation = async (req, res) => {
    const { data: parameters } = req.body;

    console.log("updateInformation", parameters)

    setSessionParameters(parameters, req.user);
    /*
    oldpassword
    password
    firstname
    lastname
    image
    operation="UPDATEINFORMATION"
    */
    try {
        if (parameters.password) {
            const resUser = await executesimpletransaction("QUERY_GET_PWD_BY_USERID", parameters)
            const user = resUser[0]

            const ispasswordmatch = await bcryptjs.compare(parameters.oldpassword, user.pwd)

            if (!ispasswordmatch)
                return res.status(401).json({ code: errors.LOGIN_USER_INCORRECT })

            const salt = await bcryptjs.genSalt(10);

            parameters.password = await bcryptjs.hash(parameters.password, salt);
            parameters.firstname = "";
            parameters.lastname = "";
            parameters.image = "";
        } else {
            parameters.password = "";
        }

        const result = await executesimpletransaction("UFN_USER_UPDATE", parameters)

        if (result instanceof Array) {
            const newusertoken = {
                ...req.user,
                firstname: parameters.firstname || req.user.firstname,
                lastname: parameters.lastname || req.user.lastname,
                image: parameters.image || req.user.image,
            };
            jwt.sign({ user: newusertoken }, (process.env.SECRETA || "palabrasecreta"), {}, (error, token) => {
                if (error) throw error;
                return res.json({ data: { token } });
            })
        }
        else
            return res.status(result.rescode).json(result);
    } catch (error) {
        return res.status(500).json(getErrorCode(null, error));
    }
}

exports.sendMailPassword = async (req, res) => {
    const { header, detail: detailtmp } = req.body;
    const parameters = header.parameters;

    const passwordtext = parameters.password;

    if (header && header.parameters.password) {
        const salt = await bcryptjs.genSalt(10);
        header.parameters.password = await bcryptjs.hash(header.parameters.password, salt);
    }

    if (header) {
        setSessionParameters(header.parameters, req.user);
    }

    const detail = detailtmp.map(x => {
        setSessionParameters(x.parameters, req.user);
        return x;
    })

    const result = await executeTransaction(header, detail, req.user.menu || {});

    // VOXIMPLANT //
    const APPLICATION_ID = 10451952;
    const VOXI_PASSWORD = 'Laraigo2022$CDFD';
    for (let di = 0; di < detail.length; di++) {
        if (detail[di].parameters.type === 'ASESOR') {
            let bind = true;
            let voxiuser = undefined;
            // Validar si existe algún canal VOXI en el ORGUSER
            const voxidata = await executesimpletransaction("QUERY_GET_VOXIMPLANT_VALIDATION", {channels: detail[di].parameters.channels});
            if (voxidata instanceof Array && voxidata.length > 0) {
                voxiuser = await voximplant.getUser({
                    application_id: APPLICATION_ID,
                    user_name: `user${header.parameters.id}.${detail[di].parameters.orgid}`
                });
                if (!voxiuser?.user_id) {
                    // Create user in voximplant
                    voxiuser = await voximplant.addUser({
                        application_id: APPLICATION_ID,
                        user_name: `user${header.parameters.id}.${detail[di].parameters.orgid}`,
                        user_display_name: header.parameters.usr,
                        user_password: VOXI_PASSWORD
                    })
                }
            }
            else {
                bind = false;
            }
            if (voxiuser?.user_id) {
                if (bind && detail[di].parameters.operation !== 'DELETE') {
                    // Get queues from voximplant application
                    let voxiqueues = await voximplant.getQueues({application_id: APPLICATION_ID});
                    let voxiqueues_names = voxiqueues.result.map(vq => vq.acd_queue_name.split('.')[1]);
                    let groups = ['laraigo', ...(detail[di].parameters.groups || '').split(',')];
                    let groups_to_unbind = voxiqueues_names.filter(vq => !groups.includes(vq))
                    for (let vi = 0; vi < voxidata.length; vi++) {
                        // Create queues if not exists
                        for (let gi = 0; gi < groups.length; gi++) {
                            if (!voxiqueues_names.includes(groups[gi])) {
                                await voximplant.addQueue({
                                    application_id: APPLICATION_ID,
                                    acd_queue_name: `${voxidata[vi].communicationchannelsite}.${groups[gi]}`
                                })
                            }
                        }
                        // Bind to {site}.{group}
                        await voximplant.bindUserToQueue({
                            application_id: APPLICATION_ID,
                            user_id: voxiuser.user_id,
                            acd_queue_name: groups.map(g => `${voxidata[vi].communicationchannelsite}.${g}`).join(';'),
                            bind
                        })
                        // Unbind to {site}.{group}
                        await voximplant.bindUserToQueue({
                            application_id: APPLICATION_ID,
                            user_id: voxiuser.user_id,
                            acd_queue_name: groups_to_unbind.map(g => `${voxidata[vi].communicationchannelsite}.${g}`).join(';'),
                            bind: false
                        })
                    }
                }
                else {
                    await voximplant.delUser({
                        application_id: APPLICATION_ID,
                        user_name: `user${header.parameters.id}.${detail[di].parameters.orgid}`
                    })
                }
            }
        }
    }
    // VOXIMPLANT //


    if (parameters.sendMailPassword && result.success === true) {
        parameters.namespace = parameters.language === "es" ? "TEMPLATESENDPASSWORD-SPANISH" : "TEMPLATESENDPASSWORD-ENGLISH";

        let jsonconfigmail = "";
        const resBD = await Promise.all([
            executesimpletransaction("QUERY_GET_CONFIG_MAIL", parameters),
            executesimpletransaction("QUERY_GET_MESSAGETEMPLATE_BYNAMESPACE", parameters)
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

        const variablereplace = [
            { name: "firstname", text: parameters.firstname },
            { name: "lastname", text: parameters.lastname },
            { name: "username", text: parameters.usr },
            { name: "password", text: passwordtext },
        ]

        const result1 = await executesimpletransaction("QUERY_INSERT_TASK_SCHEDULER", {
            corpid: parameters.corpid,
            orgid: parameters.orgid,
            tasktype: "sendmail",
            taskbody: JSON.stringify({
                messagetype: "OWNERBODY",
                receiver: parameters.email,
                subject: mailtemplate.header,
                priority: mailtemplate.priority,
                body: variablereplace.reduce((acc, item) => acc.replace(`{{${item.name}}}`, item.text), mailtemplate.body),
                blindreceiver: "",
                copyreceiver: "",
                credentials: jsonconfigmail,
                config: {
                    ShippingReason: "SENDPASSWORD",
                },
                attachments: []
            }),
            repeatflag: false,
            repeatmode: 0,
            repeatinterval: 0,
            completed: false,
        });
    }

    if (!result.error)
        return res.json(result);
    else
        return res.status(result.rescode).json({ ...result, key: header.key });
}

exports.delete = async (req, res) => {
    const { header, detail: detailtmp } = req.body;

    if (header && header.parameters.password) {
        const salt = await bcryptjs.genSalt(10);
        header.parameters.password = await bcryptjs.hash(header.parameters.password, salt);
    }

    if (header) {
        setSessionParameters(header.parameters, req.user);
    }

    const detail = detailtmp.map(x => {
        setSessionParameters(x.parameters, req.user);
        return x;
    })

    const result = await executeTransaction(header, detail, req.user.menu || {});

    // VOXIMPLANT //
    const APPLICATION_ID = 10451952;
    const VOXI_PASSWORD = 'Laraigo2022$CDFD';
    const orgs = await executesimpletransaction("UFN_ORGUSER_SEL", {all: true, corpid: 0, orgid: 0, userid: detail[0].parameters.id, username: ''})
    for (let i = 0; i < orgs.length; i++) {
        if (orgs[i].type === 'ASESOR') {
            let voxiuser = await voximplant.getUser({
                application_id: APPLICATION_ID,
                user_name: `user${detail[0].parameters.id}.${orgs[i].orgid}`
            })
            if (voxiuser) {
                await voximplant.delUser({
                    application_id: APPLICATION_ID,
                    user_name: `user${detail[0].parameters.id}.${orgs[i].orgid}`
                })
            }
        }
    }
    // VOXIMPLANT //

    if (!result.error)
        return res.json(result);
    else
        return res.status(result.rescode).json({ ...result, key: header.key });
}