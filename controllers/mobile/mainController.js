const { executesimpletransaction, exportMobile } = require('../../config/mobile/triggerMobileFunction');
const { setSessionParameters, getErrorCode, errors } = require('../../config/helpers');
const fs = require('fs');

exports.GetCollection = async (req, res) => {
    try {
        const { parameters = {}, method } = req.body;
        console.log("method executed", method);
        setSessionParameters(parameters, req.user, req._requestid);

        const result = await executesimpletransaction(method, parameters, req.user.menu || {});
        if (result instanceof Array)
            return res.json(result);
        else
            return res.status(400).json(result);
    }
    catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}

exports.multiTransaction = async (req, res) => {
    try {
        const data = req.body.map(x => {
            if (!x.data.corpid)
                x.data.corpid = req.user.corpid ? req.user.corpid : 1;
            if (!x.data.orgid)
                x.data.orgid = req.user.orgid ? req.user.orgid : 1;
            if (!x.data.username)
                x.data.username = req.user.usr;
            if (!x.data.userid)
                x.data.userid = req.user.userid;
            return x;
        })

        const result = await executeMultiTransactions(data);

        return res.json(result);
    }
    catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}

exports.getCollectionPagination = async (req, res) => {
    try {
        const { data, methodcollection, methodcount, consultcount } = req.body;

        setSessionParameters(data, req.user, req._requestid);

        const result = await getCollectionPagination(methodcollection, methodcount, data, consultcount);
        res.json(result);
    }
    catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}
exports.export = async (req, res) => {
    try {
        const { data, method } = req.body;

        setSessionParameters(data, req.user, req._requestid);
        const result = await exportMobile(method, data);
        res.json(result);
    }
    catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}
