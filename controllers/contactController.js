const { executesimpletransaction } = require('../config/triggerfunctions');
const { getErrorCode, errors, axiosObservable } = require('../config/helpers');

const method_allowed = [
    "UFN_PERSONS_BY_CATEGORY_SEL",
    "UFN_LIST_PERSONS_BY_CATEGORY_SEL",
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
                executesimpletransaction("QUERY_INSERT_TASK_SCHEDULER", {
                    corpid: data.corpid,
                    orgid: data.orgid,
                    tasktype: "sendmail",
                    taskbody: JSON.stringify({
                        messagetype: "OWNERBODY",
                        receiver: data.listmembers[0].email,
                        subject: mailtemplate.header,
                        priority: mailtemplate.priority,
                        body: data.listmembers[0].parameters.reduce((acc, item) => acc.replace(eval(`/{{${item.name}}}/gi`), item.text), (data.body || mailtemplate.body)),
                        blindreceiver: "",
                        copyreceiver: "",
                        credentials: jsonconfigmail,
                        config: {
                            CommunicationChannelSite: "",
                            FirstName: data.listmembers[0].firstname,
                            LastName: data.listmembers[0].lastname,
                            HsmTo: data.listmembers[0].email,
                            Origin: "EXTERNAL",
                            MessageTemplateId: data.hsmtemplateid,
                            ShippingReason: data.shippingreason,
                            // HsmId: data.hsmtemplatename,
                            Body: data.listmembers[0].parameters.reduce((acc, item) => acc.replace(eval(`/{{${item.name}}}/gi`), item.text), (data.body || mailtemplate.body))
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

exports.Collection = async (req, res) => {
    const { parameters = {}, method } = req.body;

    if (!method_allowed.includes(method)) {
        const resError = getErrorCode(errors.FORBIDDEN);
        return res.status(resError.rescode).json(resError);
    }

    parameters._requestid = req._requestid;

    const result = await executesimpletransaction(method, parameters);
    if (!result.error) {
        return res.json({ error: false, success: true, data: result });
    }
    else
        return res.status(result.rescode).json(({ ...result }));

}
