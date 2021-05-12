const bcryptjs = require("bcryptjs");
const User = require("../models/user");
const triggerfunctions = require('../config/triggerfunctions');;

exports.getUsers = async (req, res) => {
    try {
        const result = await User.findAll({
            attributes: {
                exclude: ['password']
            }});
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ msg: error });
    }
}
exports.manage = async (req, res) => {
    try {
        const { data, method } = req.body;
    
        if (data.pwd) {
            const salt = await bcryptjs.genSalt(10);
            data.pwd = await bcryptjs.hash(data.pwd, salt);
        }

        if (!data.corporation)
            data.corporation = req.usuario.corporation;
        if (!data.corpid)
            data.corpid = req.usuario.corpid ? req.usuario.corpid : 1;
        if (!data.orgid)
            data.orgid = req.usuario.orgid ? req.usuario.orgid : 1;
        if (!data.username)
            data.username = req.usuario.usr;
        if (!data.userid)
            data.userid = req.usuario.userid;
    
        const resx = await triggerfunctions.executesimpletransaction(method, data);
        
        if (resx instanceof Array) {
            return res.json(resx);
        } else {
            return res.status(500).json({
                msg: resx.msg
            });
        }
        
        
    } catch (error) {
        
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}
exports.insertUser = async (req, res) => {
    try {
        const { pwd, usr } = req.body;

        const resultuser = await User.findOne({ where: { usr } });;
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
        
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });

    }
}

