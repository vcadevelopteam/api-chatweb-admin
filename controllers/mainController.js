const bcryptjs = require("bcryptjs");
const logger = require('../config/winston');
const { executesimpletransaction, executeTransaction, getCollectionPagination, exportData, buildQueryWithFilterAndSort, GetMultiCollection } = require('../config/triggerfunctions');
const { setSessionParameters, getErrorCode, axiosObservable } = require('../config/helpers');

exports.GetCollection = async (req, res) => {
    const { parameters = {}, method, key } = req.body;

    setSessionParameters(parameters, req.user, req._requestid);

    const result = await executesimpletransaction(method, parameters, req.user.menu || {});

    if (result instanceof Array)
        return res.json({ error: false, success: true, data: result, key });
    else
        return res.status(result.rescode).json({ ...result, key });
}

exports.GetCollectionDomainValues = async (req, res) => {
    const { parameters = {} } = req.body;
    parameters.orgid = 1;
    parameters.corpid = 1;
    parameters._requestid = req._requestid;

    const result = await executesimpletransaction("UFN_DOMAIN_LST_VALORES", parameters);

    if (result instanceof Array)
        return res.json({ error: false, success: true, data: result });
    else
        return res.status(result.rescode).json(result);
}

exports.GetMultiDomainsValue = async (req, res) => {
    try {
        const { parameters = {} } = req.body;
        parameters._requestid = req._requestid;

        if (parameters.domains && parameters.domains instanceof Array) {
            const detailRequest = parameters.domains.map(domainname => ({
                method: "UFN_DOMAIN_LST_VALORES",
                parameters: {
                    corpid: 1,
                    orgid: 1,
                    domainname
                }
            }))

            const result = await GetMultiCollection(detailRequest, false, req._requestid);
            return res.json({ success: true, data: result });
        }

        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
    catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
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

    const result = await executeTransaction(header, detail, req.user.menu || {}, req._requestid);

    if (!result.error)
        return res.json(result);
    else
        return res.status(result.rescode).json({ ...result, key: header?.key || '' });
}

exports.getCollectionPagination = async (req, res) => {
    const { parameters, methodCollection, methodCount } = req.body;

    setSessionParameters(parameters, req.user, req._requestid);

    const result = await getCollectionPagination(methodCollection, methodCount, parameters, req.user.menu || {});
    if (!result.error) {
        res.json(result);
    } else {
        return res.status(result.rescode).json(result);
    }
}

exports.getGraphic = async (req, res) => {
    const { parameters, method } = req.body;

    setSessionParameters(parameters, req.user, req._requestid);

    const result = !parameters.isNotPaginated ? await buildQueryWithFilterAndSort(method, parameters) : await executesimpletransaction(method, parameters);

    if (!result.error) {
        res.json(result);
    } else {
        return res.status(result.rescode).json(result);
    }
}

exports.exportTrigger = async (req, res) => {
    const { parameters, method } = req.body;

    const authHeader = String(req.headers['authorization'] || '');

    const responseservices = await axiosObservable({
        method: "post",
        url: `${process.env.API2}main/exportTrigger`,
        data: { parameters, method },
        headers: {
            "Authorization": authHeader
        },
        _requestid: req._requestid,
    });

    logger.child({ _requestid, responseservices }).debug(`executing excel`)

    if (!responseservices.data || !responseservices.data instanceof Object)
        return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));

    return res.json(responseservices.data);
}

exports.export = async (req, res) => {
    const { parameters, method } = req.body;

    setSessionParameters(parameters, req.user, req._requestid);

    const resultBD = !parameters.isNotPaginated ? await buildQueryWithFilterAndSort(method, parameters) : await executesimpletransaction(method, parameters);

    const result = await exportData(resultBD, parameters.reportName, parameters.formatToExport, parameters.headerClient, req._requestid);

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

        const result = await GetMultiCollection(data, req.user.menu || {}, req._requestid);

        return res.json({ success: true, data: result });
    }
    catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}

exports.getToken = async (req, res) => {
    const { data } = req.body;

    const result = await executesimpletransaction("UFN_GET_TOKEN_LOGGED_MOVIL", { ...data, _requestid: req._requestid });

    if (result instanceof Array) {
        if (result.length > 0) {
            return res.json({ error: false, success: true, token: result[0].token });
        }
        return res.json({ error: false, success: true, token: '' });
    }
    else
        return res.status(result.rescode).json(result);
}

exports.validateConversationWhatsapp = async (req, res) => {
    const { corpid, orgid } = req.body;

    const result = await executesimpletransaction("UFN_MIGRATION_CONVERSATIONWHATSAPP_SEL", { corpid, orgid, _requestid: req._requestid });

    const indexChannels = {}

    const cwsp = result.reduce((acc, item) => {
        const foundConversation = acc.some(x =>
            x.communicationchannelid === item.communicationchannelid &&
            x.personcommunicationchannel === item.personcommunicationchannel &&
            new Date(x.startconversation) < new Date(item.createdate) &&
            new Date(x.endconversation) >= new Date(item.createdate))

        let indexchannel = 0;
        if (!foundConversation) {
            indexchannel = (indexChannels[item.communicationchannelid] || 0) + 1;
            indexChannels[item.communicationchannelid] = indexchannel;
        }
        return foundConversation ? acc : [
            ...acc,
            {
                communicationchannelid: item.communicationchannelid,
                personcommunicationchannel: item.personcommunicationchannel,
                personid: item.personid,
                conversationid: item.conversationid,
                corpid: item.corpid,
                orgid: item.orgid,
                type: item.interactiontext.substring(0, 9) === "Campaña: " && item.interactiontext.includes(" - Fecha: ") ? "HSM" : "NINGUNO",
                initiatedby: item.userid ? "BUSINESS" : "CLIENT",
                phonenumber: item.personcommunicationchannelowner,
                startconversation: item.createdate,
                isfree: indexchannel <= 1000,
                endconversation: new Date(new Date(item.createdate).getTime() + 24 * 60 * 60 * 1000).toISOString()
            }
        ]
    }, []);

    const insert = await executesimpletransaction("UFN_MIGRATION_CONVERSATIONWHATSAPP_INS", { corpid, orgid, table: JSON.stringify(cwsp), _requestid: req._requestid });

    return res.json({ error: false, success: true, insert, cwsp });
}