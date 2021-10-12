require('dotenv').config();
const bcryptjs = require("bcryptjs");
const { setSessionParameters } = require('../config/helpers');
const { errors, getErrorCode } = require('../config/helpers');

exports.updateInformation = async (req, res) => {
    const { data: parameters } = req.body;

    console.log("updateInformation", parameters)

    setSessionParameters(parameters, req.user);

    try {
        if (parameters.newpassword) {
            const resUser = await tf.executesimpletransaction("QUERY_GET_PWD_BY_USERID", parameters)
    
            const user = resUser[0]
    
            const ispasswordmatch = await bcryptjs.compare(parameters.oldpassword, user.pwd)
    
            if (!ispasswordmatch)
                return res.status(401).json({ code: errors.LOGIN_USER_INCORRECT })
    
            const salt = await bcryptjs.genSalt(10);
    
            parameters.password = await bcryptjs.hash(parameters.newpassword, salt);
        }

        const result = await tf.executesimpletransaction("UFN_USER_UPDATE", parameters)

        if (result instanceof Array)
            return res.json({ error: false, success: true, data: result });
        else
            return res.status(result.rescode).json(result);
    } catch (error) {
        return res.status(500).json(getErrorCode(null, error));
    }
}