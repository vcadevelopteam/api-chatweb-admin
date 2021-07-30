require('dotenv').config({ path: 'process.env' });
const triggerfunctions = require('../config/triggerfunctions');;
const bcryptjs = require("bcryptjs");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

exports.authenticate = async (req, res) => {
    const { data: { usr, password } } = req.body;

    try {
        const result = await triggerfunctions.executesimpletransaction("QUERY_AUTHENTICATED", { usr });

        if (!result instanceof Array || result.length === 0)
            return res.status(401).json({ message: "El usuario no existe", code: "USER_INCORRECT" });
        console.log(result);
        const usuario = result[0];
        const ispasswordmatch = await bcryptjs.compare(password, usuario.pwd)

        if (!ispasswordmatch)
            return res.status(401).json({ message: "Contraseña incorrecta", code: "PASSWORD_INCORRECT" })

        delete usuario.pwd;

        jwt.sign({ usuario }, (process.env.SECRETA ? process.env.SECRETA : "palabrasecreta"), {
            expiresIn: 60 * 60 * 24
        }, (error, token) => {
            if (error) throw error;
            delete usuario.corpid;
            delete usuario.orgid;
            delete usuario.userid;
            res.json({ data: { ...usuario, token }, success: true });
        })
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
        res.json({ data: req.usuario, error: false })
    } catch (error) {
        return res.status(500).json({
            message: "Hubo un problema, intentelo más tarde",
            code: "ERROR_AUTH",
        });
    }
}

