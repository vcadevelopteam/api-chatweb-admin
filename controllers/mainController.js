const { executesimpletransaction, executeTransaction, getCollectionPagination, exportData, buildQueryWithFilterAndSort, GetMultiCollection } = require('../config/triggerfunctions');
const bcryptjs = require("bcryptjs");
const { setSessionParameters } = require('../config/helpers');

exports.GetCollection = async (req, res) => {
    const { parameters = {}, method } = req.body;
    setSessionParameters(parameters, req.user);
    console.log(method, parameters)
    const result = await executesimpletransaction(method, parameters, req.user.menu || {});

    if (result instanceof Array)
        return res.json({ error: false, success: true, data: result });
    else
        return res.status(result.rescode).json(result);
}

exports.GetCollectionDomainValues = async (req, res) => {
    const { parameters = {}, method } = req.body;
    setSessionParameters(parameters, req.user);
    console.log(method, parameters)
    const result = await executesimpletransaction("UFN_DOMAIN_LST_VALORES", parameters);

    if (result instanceof Array)
        return res.json({ error: false, success: true, data: result });
    else
        return res.status(result.rescode).json(result);
}

exports.executeTransaction = async (req, res) => {
    const { header, detail: detailtmp } = req.body;

    if (header && header.parameters.password) {
        const salt = await bcryptjs.genSalt(10);
        header.parameters.password = await bcryptjs.hash(header.parameters.password, salt);
    }

    if (header) {
        setSessionParameters(header.parameters, req.user);
    }

    const detail = detailtmp.map(x => {
        setSessionParameters(x.parameters, req.user);
        return x;
    })

    const result = await executeTransaction(header, detail, req.user.menu || {});

    if (!result.error)
        return res.json(result);
    else
        return res.status(result.rescode).json(result);
}

exports.getCollectionPagination = async (req, res) => {
    const { parameters, methodCollection, methodCount } = req.body;

    setSessionParameters(parameters, req.user);

    const result = await getCollectionPagination(methodCollection, methodCount, parameters, req.user.menu || {});
    if (!result.error) {
        res.json(result);
    } else {
        return res.status(result.rescode).json(result);
    }
}
exports.export = async (req, res) => {
    const { parameters, method } = req.body;

    setSessionParameters(parameters, req.user);

    console.time(`exe-${method}`);
    const resultBD = !parameters.isNotPaginated ? await buildQueryWithFilterAndSort(method, parameters) : await executesimpletransaction(method, parameters);
    console.timeEnd(`exe-${method}`);

    const result = await exportData(resultBD, parameters.reportName, parameters.formatToExport);

    if (!result.error) {
        return res.json(result);
    } else {
        return res.status(result.rescode).json(result);
    }
}

exports.multiCollection = async (req, res) => {
    try {
        const datatmp = req.body;
        const data = datatmp.map(x => {
            setSessionParameters(x.parameters, req.user);
            return x;
        })

        const result = await GetMultiCollection(data, req.user.menu || {});

        return res.json({ success: true, data: result });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}
