require('dotenv').config();
const bcryptjs = require("bcryptjs");

const axios = require('axios')
const { errors, getErrorCode } = require('../config/helpers');

exports.updateInformation = async (req, res) => {
    const { parameters = {} } = req.body;

    setSessionParameters(parameters, req.user);

    const salt = await bcryptjs.genSalt(10);
    parameters.password = await bcryptjs.hash(parameters.password, salt);

    const result = await tf.executesimpletransaction("UFN_USER_UPDATE", parameters)

    if (result instanceof Array)
        return res.json({ error: false, success: true, data: result });
    else
        return res.status(result.rescode).json(result);
}