require('dotenv').config();
const axios = require('axios')
const { errors, getErrorCode } = require('../config/helpers');
const { executesimpletransaction } = require('../config/triggerfunctions');;
const { setSessionParameters } = require('../config/helpers');
const { iamToken, createDNS, createPageRule } = require('../config/ibm');
const logger = require('../config/winston');

exports.insCorp = async (req, res) => {
    let parameters = req.body.parameters || req.body.data || {};
    const { method, key } = req.body;

    setSessionParameters(parameters, req.user, req._requestid);

    logger.child({ _requestid: req._requestid, ctx: parameters }).info(`${method}: ${parameters.username}`);

    const result = await executesimpletransaction(method, parameters, req.user.menu || {});

    if (result instanceof Array) {
        if (parameters.domainname && parameters.operation === "INSERT") {
            const token = await iamToken(req._requestid);
            console.log("ibmmmm token", token)
            const DNS = await createDNS(token, parameters.domainname, req._requestid);
            console.log("ibmmmm DNS", DNS)
            const pageRule = await createPageRule(token, DNS.result.content, DNS.result.name, req._requestid);
            console.log("pageRule", pageRule)
        }
        return res.json({ error: false, success: true, data: result, key });
    }
    else
        return res.status(result.rescode).json({ ...result, key });
}