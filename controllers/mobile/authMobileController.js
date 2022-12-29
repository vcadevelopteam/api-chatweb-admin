const logger = require('../../config/winston');
const { v4: uuidv4 } = require('uuid');
const { executesimpletransaction } = require('../../config/mobile/triggerMobileFunction');
const { errors, getErrorCode, cleanPropertyValue } = require('../../config/helpers');
const { addApplication } = require('../voximplantController');
const axios = require('axios')

const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECONDS_EXPIRE_IN = 60 * 60 * 12;

//type: int|string|bool
const properties = [
    {
        propertyname: "SONIDOPORTICKETNUEVO",
        key: "alertTicketNew",
        type: 'int'
    },
    {
        propertyname: "SONIDOPORMENSAJEENTRANTE",
        key: "alertMessageIn",
        type: 'int'
    },
    {
        propertyname: "CIERREAUTOMATICOHOLDING",
        key: "auto_close_holding",
        type: 'communicationchannelid',
        subtype: 'int'
    },
    {
        propertyname: "CIERREAUTOMATICO",
        key: "auto_close",
        type: 'communicationchannelid',
        subtype: 'int'
    },
    {
        propertyname: "TIEMPOBALANCEOLLAMADA",
        key: "time_reassign_call",
        type: 'int'
    },
    {
        propertyname: "TIMBRERINGINGBELL",
        key: "ringer_volume",
        type: 'int'
    },
    {
        propertyname: "SEGUNDOSARESPONDERLLAMADA",
        key: "seconds_to_answer_call",
        type: 'int'
    },
    {
        propertyname: "HOLDINGBYSUPERVISOR",
        key: "holding_by_supervisor",
        type: 'text'
    },
    {
        propertyname: "OCULTARLOGCONVERSACION",
        key: "hide_log_conversation",
        type: 'bool',
    },
    {
        propertyname: "LIMITARREASIGNACIONGRUPO",
        key: "limit_reassign_group",
        type: 'bool',
    },
    {
        propertyname: "WAITINGTIMECUSTOMERMESSAGE",
        key: "waiting_customer_message",
        type: 'text',
    },
    {
        propertyname: "FILTROFECHA",
        key: "range_date_filter",
        type: 'int',
    },
    {
        propertyname: "ETIQUETAORIGEN",
        key: "origin_label",
        type: 'bool',
    },
];

const validateResProperty = (r, type) => {
    let vv;
    if (r instanceof Array && r.length > 0)
        vv = r[0].propertyvalue;
    else
        return null;

    if (type === "bool")
        return vv === "1"
    else if (type === "string")
        return vv
    else if (type === "int")
        return parseInt(vv);
}

exports.authenticateMobile = async (req, res) => {
    const { username, password, token } = req.body;

    try {

        const result = await executesimpletransaction("QUERY_AUTHENTICATED", { usr: username });
        
        if (!result instanceof Array || result.length === 0) {
            return res.status(401).json({ code: "LOGIN_USER_INCORRECT", msg: 'Usuario o contraseña incorrecta.' })
        }

        
        const user = result[0];
        const ispasswordmatch = await bcryptjs.compare(password, user.pwd)
        if (!ispasswordmatch)
            return res.status(401).json({ code: "LOGIN_USER_INCORRECT", msg: 'Usuario o contraseña incorrecta.' })

        // const tokenzyx = uuidv4();

        const dataSesion = {
            userid: user.userid,
            orgid: user.orgid,
            corpid: user.corpid,
            usr: user.usr,
            username: user.usr,
            status: 'ACTIVO',
            roleid: user.roleid,
            motive: null,
            token,
            fullname: user.firstname + " " + user.lastname,
            origin: 'MOVIL',
            type: 'LOGIN',
            description: null,
        };

        await Promise.all([
            executesimpletransaction("UFN_USERTOKEN_INS", dataSesion),
            executesimpletransaction("UFN_USERSTATUS_UPDATE", dataSesion),
        ]);
        delete user.pwd;
        
        const properties = {
            flagtipification: false,
            flagmotivedesconection: false,
            tmobycommunicationchannelid: {}
        };
        console.time("get properties");

        await Promise.all([
            executesimpletransaction("UFN_PROPERTY_SELBYNAME", { ...dataSesion, propertyname: "TIPIFICACION" }).then(r => properties.flagtipification = validateResProperty(r, "bool")),
            executesimpletransaction("UFN_PROPERTY_SELBYNAME", { ...dataSesion, propertyname: "MOTIVODESCONEXION" }).then(r => properties.flagmotivedesconection = validateResProperty(r, "bool")),
            executesimpletransaction("UFN_PROPERTY_SELBYNAME", { ...dataSesion, propertyname: "ASESORASIGNACIONGRUPO" }).then(r => properties.flagdelegationgroup = validateResProperty(r, "bool")),
            executesimpletransaction("UFN_PROPERTY_SELBYNAME", { ...dataSesion, propertyname: "ASESORDELEGACION" }).then(r => properties.flagdelegationagent = validateResProperty(r, "bool")),
            executesimpletransaction("UFN_PROPERTY_SELBYNAME", { ...dataSesion, propertyname: "EXPIRACIONSESIONASESOR" }).then(r => properties.minutes_to_expire = validateResProperty(r, "int")),
            executesimpletransaction("UFN_PROPERTY_SELBYNAME", { ...dataSesion, propertyname: "ALERTATMO" }).then(r => properties.tmobycommunicationchannelid = r instanceof Array ? r.reduce((ob, i) => ({ ...ob, [i.communicationchannelid]: parseInt(i.propertyvalue) }), {}) : {}),
        ]);
        console.timeEnd("get properties");

        const usertt = {
            usr: user.username,
            defaultsort: false,
            orgdesc: user.orgdesc,
            corpdesc: user.corpdesc,
            fullname: dataSesion.fullname,
            firstname: user.firstname,
            lastname: user.lastname,
            docnum: user.docnum,
            doctype: user.doctype,
            email: user.email,
            userid: user.userid,
            pwdchangefirstlogin: false,
            properties
        }

        jwt.sign({ usertoken: dataSesion }, process.env.SECRETA, {
            // expiresIn: SECONDS_EXPIRE_IN
        }, (error, token) => {
             if (error) throw error;
             const dateExpire = new Date(new Date().getTime() + SECONDS_EXPIRE_IN);
             return res.json({ token, user: usertt, dateExpire });
        })


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}

exports.getUser = async (req, res) => {
    try {
        res.json({ user: req.user })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}

exports.connectMobile = async (req, res) => {
    try {
        const { data: { connected, type = "INBOX", motive = "", description = "" } } = req.body;

        const method = 'UFN_USERSTATUS_UPDATE';
        const data = {
            corpid: req.user.corpid,
            userid: req.user.userid,
            orgid: req.user.orgid,
            username: req.user.usr,
            type: type,
            status: connected ? 'ACTIVO' : 'DESCONECTADO',
            motive,
            description
        }

        await Promise.all([
            executesimpletransaction(method, data),
            axios({
                url: `${process.env.APP_MOBILE_SOCKET}inbox/ConnUserHub`,
                method: 'post',
                data: { corpid: data.corpid, orgid: data.orgid, userid: data.userid, isconnected: connected }
            })
        ]);

        res.json({ success: true })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}

exports.changeOrganization = async (req, res) => {
    try {
        const { data: { orgidnew } } = req.body;

        const method = 'UFN_USERSTATUS_UPDATE_ORG';

        const data = {
            orgidnew,
            orgidold: req.user.orgid,
            userid: req.user.userid,
            username: req.user.usr,
        }

        const ff = await executesimpletransaction(method, data);
        console.log("changeorganizaiton", ff)

        const dataSesion = {
            ...req.user,
            orgid: orgidnew
        }

        jwt.sign({ usertoken: dataSesion }, process.env.SECRETA, {
        }, (error, token) => {
            if (error) throw error;
            return res.json({ success: true, token });
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}

exports.changePassword = async (req, res) => {
    try {
        const { data: { password } } = req.body;

        if (!password)
            return res.status(400).json({ msg: "La contraseña no puede ser vacia." });

        // const response = await axios({
        //     url: `${process.env.APISERVICES}main/encrypt`,
        //     method: 'post',
        //     data: { text: password }
        // });
        // if (!response.data || !response.data instanceof Object || !response.data.success)
        //     return res.status(400).json({ msg: "Hubo un problema, vuelva a intentarlo" });

        const salt = await bcryptjs.genSalt(10);
        const newpassword = await bcryptjs.hash(password, salt);

        const data = {
            username: req.user.usr,
            userid: req.user.userid,
            pwd: newpassword
        }

        const result = await executesimpletransaction("UFN_USR_UPDATEPWD", data);
        if (result instanceof Array)
            return res.json(result);
        else
            return res.status(400).json(result);

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}