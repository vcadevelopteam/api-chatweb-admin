require('dotenv').config();
const axios = require('axios')
const { errors, getErrorCode } = require('../config/helpers');
const { executesimpletransaction } = require('../config/triggerfunctions');;
const { setSessionParameters } = require('../config/helpers');

exports.getLeads = async (req, res) => {
    const { parameters = {} } = req.body;
    setSessionParameters(parameters, req.user, req._requestid);

    try {
        const result = await executesimpletransaction("UFN_LEADBYPERSONCOMMUNICATIONCHANNEL_SEL", parameters);

        if (result instanceof Array)
            return res.json({ error: false, success: true, data: result });
        else
            return res.status(result.rescode).json(result);

    } catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, "Request person/get/leads", req._requestid));
    }
}