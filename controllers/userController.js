const { executesimpletransaction, executeTransaction } = require('../config/triggerfunctions');
const jwt = require("jsonwebtoken");
require('dotenv').config();
const bcryptjs = require("bcryptjs");
const { setSessionParameters } = require('../config/helpers');
const { errors, getErrorCode } = require('../config/helpers');

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