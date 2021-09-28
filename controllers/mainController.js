const { executesimpletransaction, executeTransaction, getCollectionPagination, exportDataToCSV, buildQueryWithFilterAndSort, GetMultiCollection } = require('../config/triggerfunctions');
const bcryptjs = require("bcryptjs");
const { setSessionParameters } = require('../config/helpers');
var ibm = require('ibm-cos-sdk');

var config = {
    endpoint: 's3.us-east.cloud-object-storage.appdomain.cloud',
    ibmAuthEndpoint: 'https://iam.cloud.ibm.com/identity/token',
    apiKeyId: 'LwD1YXNXSp8ZYMGIUWD2D3-wmHkmWRVcFm-5a1Wz_7G1', //'GyvV7NE7QiuAMLkWLXRiDJKJ0esS-R5a6gc8VEnFo0r5',
    serviceInstanceId: '0268699b-7d23-4e1d-9d17-e950b6804633' //'9720d58a-1b9b-42ed-a246-f2e9d7409b18',
};
const COS_BUCKET_NAME = "staticfileszyxme"

exports.GetCollection = async (req, res) => {
    const { parameters = {}, method } = req.body;

    setSessionParameters(parameters, req.user);

    const result = await executesimpletransaction(method, parameters, req.user.menu || {});

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
exports.exportexcel = async (req, res) => {
    const { parameters, method } = req.body;

    setSessionParameters(parameters, req.user);

    console.time(`exe-${method}`);
    const resultBD = !parameters.isNotPaginated ? await buildQueryWithFilterAndSort(method, parameters) : await executesimpletransaction(method, parameters);
    console.timeEnd(`exe-${method}`);

    const result = await exportDataToCSV(resultBD, parameters.titlefile);

    if (!result.error) {
        return res.json(result);
    } else {
        return res.status(result.rescode).json(result);
    }
}

exports.export = async (req, res) => {
    try {
        const { parameters, method } = req.body;

        setSessionParameters(parameters, req.user);

        const result = await exporttmp(method, parameters);
        res.json(result);
    }
    catch (error) {

        return res.status(result.rescode).json({
            message: "Hubo un problema, intentelo más tarde"
        });
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
