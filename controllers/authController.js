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
            return res.status(401).json({ msg: "El usuario no existe" });
        console.log(result);
        const usuario = result[0];
        const ispasswordmatch = await bcryptjs.compare(password, usuario.pwd)

        if (!ispasswordmatch)
            return res.status(401).json({ msg: "Contraseña incorrecta" })

        delete usuario.pwd;

        jwt.sign({ usuario }, (process.env.SECRETA ? process.env.SECRETA : "palabrasecreta"), {
            expiresIn: 60 * 60 * 24
        }, (error, token) => {
            if (error) throw error;
            res.json({ ...usuario, token });
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
        res.json({ user: req.usuario })
    } catch (error) {
        
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}

