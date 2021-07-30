require('dotenv').config({ path: 'variables.env' });
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
    let token = "";

    const authHeader = String(req.headers['authorization'] || '');
    if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7, authHeader.length);
    }

    if (!token)
        return res.status(401).json({ message: "permiso no valido" });

    try {
        const cifrado = jwt.verify(token, process.env.SECRETA);
        req.usuario = cifrado.usuario;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token no valido' });
    }
}