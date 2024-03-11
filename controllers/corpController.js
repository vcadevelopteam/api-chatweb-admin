require('dotenv').config();
const axios = require('axios')
const { errors, getErrorCode, axiosObservable } = require('../config/helpers');
const { executesimpletransaction, executeQuery } = require('../config/triggerfunctions');;
const { setSessionParameters } = require('../config/helpers');
const { iamToken, createDNS, createPageRule } = require('../config/ibm');
const logger = require('../config/winston');
const { updateDomainRecaptcha } = require('../config/google');

exports.insCorp = async (req, res) => {
    let parameters = req.body.parameters || req.body.data || {};
    let succesdomain = false;
    const { key } = req.body;
    const method = "UFN_CORP_INS";
    let triggerDomain = parameters.olddomainname !== parameters.domainname;

    setSessionParameters(parameters, req.user, req._requestid);

    logger.child({ _requestid: req._requestid, ctx: parameters }).info(`${method}: ${parameters.username}`);
    
    if (!triggerDomain && parameters.domainname !== "") {
        const resultDomain = await executesimpletransaction("QUERY_GET_UPDATE_DOMAIN", parameters, req.user.menu || {});
        triggerDomain = !resultDomain[0]?.domainname;
    }
    const result = await executesimpletransaction(method, parameters, req.user.menu || {});

    if (result instanceof Array) {
        if (triggerDomain) {
            const token = await iamToken(req._requestid);
            succesdomain = true;
            if (token.error) {
                succesdomain = false;
            }
            const DNS = await createDNS(token, parameters.domainname, req._requestid);
            if (DNS.error) {
                succesdomain = false;
            }
            const pageRule = await createPageRule(token, DNS.result.content, DNS.result.name, req._requestid);
            if (pageRule.error) {
                succesdomain = false;
            }
            await updateDomainRecaptcha(DNS.result.name)
        }
        return res.json({ error: false, success: true, data: result, key, succesdomain });
    }
    else
        return res.status(result.rescode).json({ ...result, key });
}

exports.getInfoDomain = async (req, res) => {
    const { subdomain } = req.body;

    const result = await executesimpletransaction("QUERY_GET_INFO_DOMAIN", { subdomain });

    if (result instanceof Array) {
        return res.json({ error: false, success: true, data: result });
    }
    else
        return res.status(result.rescode).json({ ...result, key });
}