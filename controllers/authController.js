require('dotenv').config({ path: 'process.env' });
const tf = require('../config/triggerfunctions');;
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { errors, getErrorCode } = require('../config/helpers');

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

exports.authenticate = async (req, res) => {
    const { data: { usr, password, facebookid, googleid } } = req.body;
    let integration = false;
    try {
        let result;
        if (facebookid) {
            result = await tf.executesimpletransaction("QUERY_AUTHENTICATED_BY_FACEBOOKID", { usr });
            integration = true;
        } else if (googleid) {
            result = await tf.executesimpletransaction("QUERY_AUTHENTICATED_BY_GOOGLEID", { facebookid });
            integration = true;
        } else {
            result = await tf.executesimpletransaction("QUERY_AUTHENTICATED", { googleid });
        }

        if (integration)
            return res.status(401).json({ code: errors.LOGIN_NO_INTEGRATION });

        if (!result instanceof Array || result.length === 0)
            return res.status(401).json({ code: errors.LOGIN_USER_INCORRECT });

        const user = result[0];
        const ispasswordmatch = await bcryptjs.compare(password, user.pwd)

        if (!ispasswordmatch)
            return res.status(401).json({ code: errors.LOGIN_USER_INCORRECT })

        const tokenzyx = uuidv4();

        const dataSesion = {
            userid: user.userid,
            orgid: user.orgid,
            username: usr,
            status: 'ACTIVO',
            motive: null,
            token: tokenzyx,
            origin: 'WEB',
            type: 'LOGIN',
            description: null
        };

        if (user.status === 'ACTIVO') {
            await Promise.all([
                tf.executesimpletransaction("UFN_USERTOKEN_INS", dataSesion),
                tf.executesimpletransaction("UFN_USERSTATUS_UPDATE", dataSesion),
            ]);
            user.token = tokenzyx;
            delete user.pwd;

            jwt.sign({ user: { ...user } }, (process.env.SECRETA ? process.env.SECRETA : "palabrasecreta"), {}, (error, token) => {
                if (error) throw error;
                delete user.corpid;
                delete user.orgid;
                delete user.userid;
                return res.json({ data: { ...user, token }, success: true });
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
        return res.status(500).json(getErrorCode(null, error));
    }
}

exports.getUser = async (req, res) => {
    try {
        const resultApps = await tf.executesimpletransaction("UFN_APPLICATION_SEL", req.user);

        const menu = resultApps.reduce((acc, item) => ({
            ...acc, [item.path]:
                [item.view ? 1 : 0,
                item.modify ? 1 : 0,
                item.insert ? 1 : 0,
                item.delete ? 1 : 0]
        }), {})

        jwt.sign({ user: { ...req.user, menu: { ...menu, "system-label": undefined, "/": undefined } } }, (process.env.SECRETA || "palabrasecreta"), {}, (error, token) => {
            if (error) throw error;
            delete req.user.token;
            delete req.user.corpid;
            delete req.user.orgid;
            delete req.user.userid;
            return res.json({ data: { ...req.user, menu, token } });
        })
    } catch (error) {
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