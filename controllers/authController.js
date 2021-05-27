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


exports.insertUser = async (req, res) => {
    try {
        const { pwd, usr } = req.body;

        const resultuser = await await triggerfunctions.executesimpletransaction('FALTA QUERY PARA VALIDAR SI EXISTE EL USUARIO', {usr});
        if (resultuser) {
            return res.status(500).json({
                msg: "El usuario ya fue registrado"
            });
        }
        const salt = await bcryptjs.genSalt(10);

        req.body.pwd = await bcryptjs.hash(pwd, salt);
        req.body.id = 0;
        req.body.doctype = "DNI";
        req.body.docnum = "73147683";
        req.body.pwdchangefirstlogin = false;
        req.body.status = "ACTIVO";
        req.body.type = "NINGUNO";
        req.body.username = "zyxmeadmin";
        req.body.operation = "INSERT";
        req.body.redirect = "";
        req.body.company = "";

        // const result = await User.create(req.body);
        const result = await triggerfunctions.executesimpletransaction('USN_USER_INS', req.body);
        res.json({
            result,
            msg: 'Usuario creado correctamente.'
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });

    }
}
