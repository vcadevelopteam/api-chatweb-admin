require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

const tf = require('../config/triggerfunctions');;
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { errors, getErrorCode } = require('../config/helpers');

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
];

const cleanPropertyValue = (property, type) => {
    if (property) {
        return type === "bool" ? property.propertyvalue === "1" : (type === "int" ? parseInt(property.propertyvalue) : property.propertyvalue);
    }
    return type === "bool" ? false : (type === "int" ? 0 : '');
}

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

exports.authenticate = async (req, res) => {
    const { data: { usr, password, facebookid, googleid } } = req.body;
    let integration = false;
    try {
        let result;
        if (facebookid) {
            result = await tf.executesimpletransaction("QUERY_AUTHENTICATED_BY_FACEBOOKID", { facebookid });
            integration = true;
        } else if (googleid) {
            result = await tf.executesimpletransaction("QUERY_AUTHENTICATED_BY_GOOGLEID", { googleid });
            integration = true;
        } else {
            result = await tf.executesimpletransaction("QUERY_AUTHENTICATED", { usr });
        }

        if (integration && !(result instanceof Array))
            return res.status(401).json({ code: errors.LOGIN_NO_INTEGRATION });

        if (!result instanceof Array || result.length === 0)
            return res.status(401).json({ code: errors.LOGIN_USER_INCORRECT });

        const user = result[0];

        if (!integration) {
            const ispasswordmatch = await bcryptjs.compare(password, user.pwd)
            if (!ispasswordmatch)
                return res.status(401).json({ code: errors.LOGIN_USER_INCORRECT })
        }

        const tokenzyx = uuidv4();

        const dataSesion = {
            userid: user.userid,
            orgid: user.orgid,
            corpid: user.corpid,
            username: usr,
            status: 'ACTIVO',
            motive: null,
            token: tokenzyx,
            origin: 'WEB',
            type: 'LOGIN',
            description: null
        };
        let notifications = [];
        
        if (user.status === 'ACTIVO') {
            // let resultProperties = {};
            const resConnection = await tf.executesimpletransaction("UFN_PROPERTY_SELBYNAME", { ...user, propertyname: 'CONEXIONAUTOMATICAINBOX' })

            const automaticConnection = validateResProperty(resConnection, 'bool');

            await Promise.all([
                tf.executesimpletransaction("UFN_USERTOKEN_INS", dataSesion),
                tf.executesimpletransaction("UFN_USERSTATUS_UPDATE", dataSesion),
                ...(automaticConnection ? [tf.executesimpletransaction("UFN_USERSTATUS_UPDATE", {
                    ...user,
                    type: 'INBOX',
                    status: 'ACTIVO',
                    description: null,
                    motive: null,
                    username: user.usr
                })] : [])
            ]);

            user.token = tokenzyx;
            delete user.pwd;

            jwt.sign({ user }, (process.env.SECRETA ? process.env.SECRETA : "palabrasecreta"), {}, (error, token) => {
                if (error) throw error;
                delete user.corpid;
                delete user.orgid;
                delete user.userid;
                return res.json({ data: { ...user, token, automaticConnection, notifications }, success: true });
            })
        } else if (user.status === 'PENDIENTE') {
            return res.status(401).json({ code: errors.LOGIN_USER_PENDING })
        } else if (user.status === 'BLOQUEADO') {
            if (user.lastuserstatus === 'INTENTOSFALLIDOS') {
                return res.status(401).json({ code: errors.LOGIN_LOCKED_BY_ATTEMPTS_FAILED_PASSWORD })
            } else if (user.lastuserstatus === 'INACTIVITY') {
                return res.status(401).json({ code: errors.LOGIN_LOCKED_BY_INACTIVED })
            } else if (user.lastuserstatus === 'PASSEXPIRED') {
                return res.status(401).json({ code: errors.LOGIN_LOCKED_BY_PASSWORD_EXPIRED })
            } else {
                return res.status(401).json({ code: errors.LOGIN_LOCKED })
            }
        } else {
            return res.status(401).json({ code: errors.LOGIN_USER_INACTIVE })
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json(getErrorCode(null, error));
    }
}

exports.getUser = async (req, res) => {
    let resultProperties = {};
    try {
        const resultBD = await Promise.all([
            tf.executesimpletransaction("UFN_APPLICATION_SEL", req.user),
            tf.executesimpletransaction("UFN_ORGANIZATION_CHANGEORG_SEL", { userid: req.user.userid }),
            tf.executesimpletransaction("UFN_LEADACTIVITY_DUEDATE_SEL", {...req.user, username: req.user.usr}),
            tf.executesimpletransaction("QUERY_SEL_PROPERTY_ON_LOGIN", undefined, false, { propertynames: properties.map(x => x.propertyname), corpid: req.user.corpid, orgid: req.user.orgid, userid: req.user.userid }),
        ]);

        const resultBDProperties = resultBD[3];

        if (!resultBD[0] instanceof Array) {
            return res.status(500).json(getErrorCode());
        }

        if (resultBDProperties instanceof Array && resultBDProperties.length > 0) {
            resultProperties = properties.reduce((acc, item) => ({
                ...acc,
                [item.key]: cleanPropertyValue(resultBDProperties.find(x => x.propertyname === item.propertyname), item.type)
            }), {});
        }

        const menu = resultBD[0].reduce((acc, item) => ({
            ...acc, [item.path]:
                [item.view ? 1 : 0,
                item.modify ? 1 : 0,
                item.insert ? 1 : 0,
                item.delete ? 1 : 0]
        }), {})

        jwt.sign({ user: { ...req.user, menu: { ...menu, "system-label": undefined, "/": undefined } } }, (process.env.SECRETA || "palabrasecreta"), {}, (error, token) => {
            if (error) throw error;
            delete req.user.token;
            // delete req.user.corpid;
            // delete req.user.orgid;
            // delete req.user.userid;
            return res.json({ data: { ...req.user, menu, properties: resultProperties, token, organizations: resultBD[1], notifications: resultBD[2] } });
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json(getErrorCode(null, error));
    }
}

exports.logout = async (req, res) => {
    try {
        tf.executesimpletransaction("UFN_USERSTATUS_UPDATE", { ...req.user, type: 'LOGOUT', status: 'DESCONECTADO', description: null, motive: null, username: req.user.usr });
    } catch (error) {
        console.log(`${new Date()}: ${JSON.stringify(error)}`);
    }
    return res.json({ data: null, error: false })
}

exports.connect = async (req, res) => {
    try {
        const { connect, description, motive } = req.body.data;
        tf.executesimpletransaction("UFN_USERSTATUS_UPDATE", {
            ...req.user,
            type: 'INBOX',
            status: connect ? 'ACTIVO' : 'DESCONECTADO',
            description,
            motive,
            username: req.user.usr
        });
    } catch (error) {
        console.log(`${new Date()}: ${JSON.stringify(error)}`);
    }
    return res.json({ data: null, error: false })
}

exports.changeOrganization = async (req, res) => {
    const { parameters } = req.body;
    const resultBD = await tf.executesimpletransaction("UFN_USERSTATUS_UPDATE_ORG", { ...req.user, ...parameters });

    if (!resultBD.error) {
        const newusertoken = {
            ...req.user,
            orgid: parameters.neworgid,
            corpid: parameters.newcorpid,
            corpdesc: parameters.corpdesc,
            orgdesc: parameters.orgdesc,
            redirect: resultBD[0] ? resultBD[0].redirect : '/tickets',
            currencysymbol: resultBD[0] ? resultBD[0].currencysymbol : 'S/', 
            countrycode: resultBD[0] ? resultBD[0].countrycode : 'PE'
        };

        const resBDMenu = await tf.executesimpletransaction("UFN_APPLICATION_SEL", newusertoken);

        const menu = resBDMenu.reduce((acc, item) => ({
            ...acc, [item.path]:
                [item.view ? 1 : 0,
                item.modify ? 1 : 0,
                item.insert ? 1 : 0,
                item.delete ? 1 : 0]
        }), {});

        newusertoken.menu = { ...menu, "system-label": undefined, "/": undefined };

        jwt.sign({ user: newusertoken }, (process.env.SECRETA || "palabrasecreta"), {}, (error, token) => {
            if (error) throw error;
            delete req.user.token;
            // delete req.user.corpid;
            // delete req.user.orgid;
            // delete req.user.userid;
            return res.json({ data: { token } });
        })
    } else {
        const error = getErrorCode();
        return res.status(error.rescode).json(error);
    }
}