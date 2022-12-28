const { executesimpletransaction, exportMobile } = require('../../config/mobile/triggerMobileFunction');
const { setSessionParameters } = require('../../config/helpers');
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
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
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
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}

exports.getCollectionPagination = async (req, res) => {
    try {
        const { data, methodcollection, methodcount, consultcount } = req.body;

        if (!data.corpid)
            data.corpid = req.user.corpid;
        if (!data.orgid)
            data.orgid = req.user.orgid;
        if (!data.username)
            data.username = req.user.usr;
        if (!data.userid)
            data.userid = req.user.userid;

        const result = await getCollectionPagination(methodcollection, methodcount, data, consultcount);
        res.json(result);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}
exports.export = async (req, res) => {
    try {
        const { data, method } = req.body;

        if (!data.corpid)
            data.corpid = req.user.corpid ? req.user.corpid : 1;
        if (!data.orgid)
            data.orgid = req.user.orgid ? req.user.orgid : 1;
        if (!data.username)
            data.username = req.user.usr;

        const result = await exportMobile(method, data);
        res.json(result);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}
