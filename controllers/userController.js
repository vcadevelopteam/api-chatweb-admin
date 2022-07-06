const { executesimpletransaction, executeTransaction } = require('../config/triggerfunctions');
const { setSessionParameters } = require('../config/helpers');
const { errors, getErrorCode } = require('../config/helpers');

const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const voximplant = require("../config/voximplantfunctions");

require('dotenv').config();

const VOXIMPLANT_ENVIRONMENT = process.env.VOXIMPLANT_ENVIRONMENT;

exports.updateInformation = async (req, res) => {
    const { data: parameters } = req.body;

    setSessionParameters(parameters, req.user, req._requestid);
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
    } catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
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
        setSessionParameters(header.parameters, req.user, req._requestid);
    }

    const detail = detailtmp.map(x => {
        setSessionParameters(x.parameters, req.user, req._requestid);
        return x;
    })

    const result = await executeTransaction(header, detail, req.user.menu || {}, req._requestid);

    if (result.success) {
        // VOXIMPLANT //
        const VOXI_PASSWORD = 'Laraigo2022$CDFD';
        // Loop for every ORGUSER_INS
        for (let di = 0; di < detail.length; di++) {
            let bind = true;
            let voxiuser = undefined;
            let account_id = undefined;
            let api_key = undefined;
            let application_id = undefined;
            let v_corpid = detail[di].parameters.corpid;
            let v_orgid = detail[di].parameters.orgid;
            let v_userid = [null, undefined, 0].includes(header.parameters.id) ? result?.resultHeader?.p_userid : header.parameters.id;

            // Try to get information of VOXI in org table
            const voxiorgdata = await executesimpletransaction("QUERY_GET_VOXIMPLANT_ORG", {
                corpid: v_corpid,
                orgid: v_orgid,
                _requestid: req._requestid,
            });

            // If exists info of VOXI in org
            if (voxiorgdata instanceof Array && voxiorgdata.length > 0) {
                account_id = voxiorgdata[0].voximplantaccountid;
                api_key = voxiorgdata[0].voximplantapikey;
                application_id = voxiorgdata[0].voximplantapplicationid;
            }

            // If not exists info of VOXI in org, try to get from VOXI directly
            if (!account_id) {
                account_id = (await voximplant.getChildrenAccount({
                    child_account_name: `${VOXIMPLANT_ENVIRONMENT}aco-${v_orgid}-${v_corpid}`
                }))?.account_id;
                application_id = (await voximplant.getApplication({
                    account_id: account_id,
                    application_name: `${VOXIMPLANT_ENVIRONMENT}apl-${v_orgid}-${v_corpid}.`
                }))?.application_id;
            }

            if (application_id) {
                // Validar si existe algún canal VOXI en el ORGUSER
                const voxichanneldata = await executesimpletransaction("QUERY_GET_VOXIMPLANT_VALIDATION", {
                    corpid: v_corpid,
                    orgid: v_orgid,
                    channels: detail[di].parameters.channels,
                    _requestid: req._requestid,
                });
                if (voxichanneldata instanceof Array && voxichanneldata.length > 0) {
                    voxiuser = await voximplant.getUser({
                        account_id: account_id,
                        application_id: application_id,
                        user_name: `user${v_userid}.${v_orgid}`
                    });
                    if (!voxiuser?.user_id) {
                        // Create user in voximplant
                        voxiuser = await voximplant.addUser({
                            account_id: account_id,
                            application_id: application_id,
                            user_name: `user${v_userid}.${v_orgid}`,
                            user_display_name: header.parameters.usr,
                            user_password: VOXI_PASSWORD
                        });
                    }
                }
                else {
                    bind = false;
                }
                if (voxiuser?.user_id) {
                    if (bind && detail[di].parameters.operation !== 'DELETE') {
                        // if usertype === 'ASESOR' bind queues
                        if (detail[di].parameters.type === 'ASESOR') {
                            // Get queues from voximplant application
                            let voxiqueues = await voximplant.getQueues({
                                account_id: account_id,
                                application_id: application_id
                            });
                            // let voxiqueues_names = voxiqueues.result.map(vq => vq.acd_queue_name.split('.')[1]);
                            let voxiqueues_names = voxiqueues.result.map(vq => vq.acd_queue_name);
                            let groups = ['laraigo', ...(detail[di].parameters.groups || '').split(',')].filter(g => g !== '');
                            // Loop for every VOXI channel
                            let channel_group = []
                            for (let vi = 0; vi < voxichanneldata.length; vi++) {
                                channel_group = [...channel_group, ...groups.map(cg => `${voxichanneldata[vi].communicationchannelsite}.${cg}`)];
                                // Create queues if not exists {site}.{group}
                                for (let gi = 0; gi < groups.length; gi++) {
                                    if (!voxiqueues_names.includes(`${voxichanneldata[vi].communicationchannelsite}.${groups[gi]}`)) {
                                        await voximplant.addQueue({
                                            account_id: account_id,
                                            application_id: application_id,
                                            acd_queue_name: channel_group[gi]
                                        });
                                    }
                                }
                            }
                            let groups_to_unbind = voxiqueues_names.filter(vq => !channel_group.includes(vq));
                            // Bind to {site}.{group}
                            await voximplant.bindUserToQueue({
                                account_id: account_id,
                                application_id: application_id,
                                user_id: voxiuser.user_id,
                                acd_queue_name: channel_group.join(';'),
                                bind
                            });
                            // Unbind to {site}.{group}
                            await voximplant.bindUserToQueue({
                                account_id: account_id,
                                application_id: application_id,
                                user_id: voxiuser.user_id,
                                acd_queue_name: groups_to_unbind.join(';'),
                                bind: false
                            });
                        }
                    }
                    else {
                        await voximplant.delUser({
                            account_id: account_id,
                            application_id: application_id,
                            user_name: `user${v_userid}.${v_orgid}`
                        });
                    }
                }
            }
        }
        // VOXIMPLANT //
    }

    if (parameters.sendMailPassword && result.success === true) {
        parameters.namespace = parameters.language === "es" ? "TEMPLATESENDPASSWORD-SPANISH" : "TEMPLATESENDPASSWORD-ENGLISH";

        let jsonconfigmail = "";
        const resBD = await Promise.all([
            executesimpletransaction("QUERY_GET_CONFIG_MAIL", { ...parameters, _requestid: req._requestid }),
            executesimpletransaction("QUERY_GET_MESSAGETEMPLATE_BYNAMESPACE", { ...parameters, _requestid: req._requestid })
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
            _requestid: req._requestid,
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
    const orgs = await executesimpletransaction("UFN_ORGUSER_SEL", { all: true, corpid: 0, orgid: 0, userid: detail[0].parameters.id, username: '', _requestid: req._requestid })
    // Loop for every ORGUSER_SEL
    for (let i = 0; i < orgs.length; i++) {
        let account_id = undefined;
        let api_key = undefined;
        let application_id = undefined;
        let v_corpid = orgs[i].corpid;
        let v_orgid = orgs[i].orgid;
        let v_userid = detail[0].parameters.id;

        // Try to get information of VOXI in org table
        const voxiorgdata = await executesimpletransaction("QUERY_GET_VOXIMPLANT_ORG", {
            corpid: v_corpid,
            orgid: v_orgid,
            _requestid: req._requestid,
        });

        // If exists info of VOXI in org
        if (voxiorgdata instanceof Array && voxiorgdata.length > 0) {
            account_id = voxiorgdata[0].voximplantaccountid;
            api_key = voxiorgdata[0].voximplantapikey;
            application_id = voxiorgdata[0].voximplantapplicationid;
        }

        // If not exists info of VOXI in org, try to get from VOXI directly
        if (!account_id) {
            account_id = (await voximplant.getChildrenAccount({
                child_account_name: `${VOXIMPLANT_ENVIRONMENT}aco-${v_orgid}-${v_corpid}`
            }))?.account_id;
            application_id = (await voximplant.getApplication({
                account_id: account_id,
                application_name: `${VOXIMPLANT_ENVIRONMENT}apl-${v_orgid}-${v_corpid}`
            }))?.application_id;
        }

        if (application_id) {
            let voxiuser = await voximplant.getUser({
                account_id: account_id,
                application_id: application_id,
                user_name: `user${v_userid}.${v_orgid}`
            });
            if (voxiuser) {
                await voximplant.delUser({
                    account_id: account_id,
                    application_id: application_id,
                    user_name: `user${v_userid}.${v_orgid}`
                });
            }
        }
    }
    // VOXIMPLANT //

    if (!result.error)
        return res.json(result);
    else
        return res.status(result.rescode).json({ ...result, key: header.key });
}