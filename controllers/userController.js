const { executesimpletransaction } = require('../config/triggerfunctions');
const jwt = require("jsonwebtoken");
require('dotenv').config();
const bcryptjs = require("bcryptjs");
const { setSessionParameters } = require('../config/helpers');
const { errors, getErrorCode } = require('../config/helpers');

exports.updateInformation = async (req, res) => {
    const { data: parameters } = req.body;

    console.log("updateInformation", parameters)

    setSessionParameters(parameters, req.user);

    try {
        if (parameters.password) {
            const resUser = await executesimpletransaction("QUERY_GET_PWD_BY_USERID", parameters)
            const user = resUser[0]

            const ispasswordmatch = await bcryptjs.compare(parameters.oldpassword, user.pwd)

            if (!ispasswordmatch)
                return res.status(401).json({ code: errors.LOGIN_USER_INCORRECT })

            const salt = await bcryptjs.genSalt(10);

            parameters.password = await bcryptjs.hash(parameters.password, salt);
        }

        const result = await executesimpletransaction("UFN_USER_UPDATE", parameters)

        if (result instanceof Array) {
            const newusertoken = {
                ...req.user,
                firstname: parameters.firstname,
                lastname: parameters.lastname,
                image: parameters.image,
            };
            jwt.sign({ user: newusertoken }, (process.env.SECRETA || "palabrasecreta"), {}, (error, token) => {
                if (error) throw error;
                return res.json({ data: { token } });
            })
        }
        else
            return res.status(result.rescode).json(result);
    } catch (error) {
        return res.status(500).json(getErrorCode(null, error));
    }
}