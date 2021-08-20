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
            data.corporation = req.user.corporation;
        if (!data.corpid)
            data.corpid = req.user.corpid ? req.user.corpid : 1;
        if (!data.orgid)
            data.orgid = req.user.orgid ? req.user.orgid : 1;
        if (!data.username)
            data.username = req.user.usr;
        if (!data.userid)
            data.userid = req.user.userid;
    
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
exports.changepassword= async (req,res) =>{
    try {  
        const { pwdnuevo,userid,type, usr, status, firstname, lastname, email, pwd } = req.body;
        
        const salt = await bcryptjs.genSalt(10);
    
        try {

            const result = await triggerfunctions.executesimpletransaction("QUERY_AUTHENTICATED", { usr });
            const usuario = result[0];
            const ispasswordmatch = await bcryptjs.compare(pwd, usuario.pwd)

            if (!ispasswordmatch)
                return res.status(500).json({
                    msg: "Contraseña incorrecta"
                });

        } catch (error) {
        }
        const data = {
            pwd: await bcryptjs.hash(pwdnuevo, salt),
            id: userid,
            status: status,
            type: type,
            usr: usr,
            firstname: firstname,
            lastname: lastname,
            email: email,
            operation: "UPDATE",
            username: "admin"
        }
        
        const result = await triggerfunctions.executesimpletransaction('UFN_USER_INS', data);    
        
        res.json({
            result,
            msg: 'Contraseña actualizada'
        });
        return res;
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });

    }
}

exports.insertUser = async (req, res) => {
    try {  
        const { pwd, usr, firstname, lastname, email } = req.body.data;
        
        let resultuser;
        try{
            resultuser = await triggerfunctions.executequery(`select 1 from usr where usr = '${usr}'`);
        }catch (error){

        }
        if (resultuser.length>0) {
            return res.status(500).json({
                msg: "El usuario ya fue registrado"
            });
        }
        const salt = await bcryptjs.genSalt(10);
        const data = {
            pwd: await bcryptjs.hash(pwd, salt),
            id: 0,
            status: "ACTIVO",
            type: "NINGUNO",
            usr: usr,
            firstname: firstname,
            lastname: lastname,
            email: email,
            operation: "INSERT",
            username: "admin"
        }
        
        const result = await triggerfunctions.executesimpletransaction('UFN_USER_INS', data);
        
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
