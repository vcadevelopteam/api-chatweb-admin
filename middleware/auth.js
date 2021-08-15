require('dotenv').config({ path: 'variables.env' });
const jwt = require("jsonwebtoken");
const tf = require('../config/triggerfunctions');;

module.exports = async function (req, res, next) {
    let token = "";

    const authHeader = String(req.headers['authorization'] || '');

    if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7, authHeader.length);
    }

    if (!token)
        return res.status(401).json({ message: "permiso no valido" });

    try {
        const cifrado = jwt.verify(token, process.env.SECRETA);
        req.user = cifrado.user;
        
        const result = await tf.executesimpletransaction("UFN_USERTOKEN_SEL", cifrado.user);

        if (result && result instanceof Array && result.length > 0) {
            if (result[0].status !== 'ACTIVO') {
                if (result[0].status === 'INACTIVO')
                    return res.status(401).json({ message: 'Su usuario ha sido logeado en otra PC', code: 'USER_CONNECTED_OTHER_PC' });
                else
                    return res.status(401).json({ message: 'Su sesión ha sido expirada', code: 'SESION_EXPIRED' });
            }
        } else {
            return res.status(401).json({ message: 'Token no valido' });
        }
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token no valido' });
    }
}