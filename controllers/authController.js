require('dotenv').config({ path: 'process.env' });
const tf = require('../config/triggerfunctions');;
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

exports.authenticate = async (req, res) => {
    const { data: { usr, password } } = req.body;

    try {
        const result = await tf.executesimpletransaction("QUERY_AUTHENTICATED", { usr });

        if (!result instanceof Array || result.length === 0)
            return res.status(401).json({ message: "El usuario no existe", code: "USER_INCORRECT" });
        
        const user = result[0];
        const ispasswordmatch = await bcryptjs.compare(password, user.pwd)

        if (!ispasswordmatch)
            return res.status(401).json({ message: "Contraseña incorrecta", code: "PASSWORD_INCORRECT" })

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
    
            jwt.sign({ user }, (process.env.SECRETA ? process.env.SECRETA : "palabrasecreta"), {
                expiresIn: 60 * 60 * 24
            }, (error, token) => {
                if (error) throw error;
                delete user.corpid;
                delete user.orgid;
                delete user.userid;
                return res.json({ data: { ...user, token }, success: true });
            })
        } else if (user.status === 'PENDIENTE') {
            return res.status(401).json({ message: "Tu usuario está pendiente de confirmación", code: "USER_PENDING" })
        } else if (user.status === 'BLOQUEADO') {
            if (user.lastuserstatus === 'INTENTOSFALLIDOS') {
                return res.status(401).json({ message: "Tu usuario fue bloqueado por exceder los intentos permitidos al loguearse.", code: "LOCKED_BY_ATTEMPTS_FAILED_PASSWORD" })
            } else if (user.lastuserstatus === 'INACTIVITY') {
                return res.status(401).json({ message: "Tu usuario fue bloqueado por exceder los dias permitidos sin conectarse.", code: "LOCKED_BY_INACTIVED" })
            } else if (user.lastuserstatus === 'PASSEXPIRED') {
                return res.status(401).json({ message: "Tu usuario fue bloqueado por qué tu contraseña expiró.", code: "LOCKED_BY_PASSWORD_EXPIRED" })
            } else {
                return res.status(401).json({ message: "Tu usuario fue bloqueado.", code: "LOCKED" })
            }
        } else {
            return res.status(401).json({ message: "Tu usuario está inactivo", code: "USER_INACTIVE" })
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            code: "ERROR_DB",
            message: "Hubo un problema, intentelo más tarde"
        });
    }
}

exports.getUser = async (req, res) => {
    try {
        res.json({ data: req.user, error: false })
    } catch (error) {
        return res.status(500).json({
            message: "Hubo un problema, intentelo más tarde",
            code: "ERROR_AUTH",
        });
    }
}

exports.logout = async (req, res) => { 

    try {
        const result = await tf.executesimpletransaction("UFN_USERSTATUS_UPDATE", cifrado.user);

    } catch (error) {
        console.log(error);
    }

    return res.json({ data: null, error: false })
}
