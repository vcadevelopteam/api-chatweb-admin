const { executesimpletransaction } = require('../config/triggerfunctions');
const { setSessionParameters, axiosObservable, getErrorCode } = require('../config/helpers');
const logger = require('../config/winston');

const witai_url = 'https://api.wit.ai'
const witai_version = '20220622'
const witai_token = process.env.WITAI_TOKEN;

const witai_request = async (url, method, headers, params, data) => {
    try {
        const myUrlWithParams = new URL(url);
        myUrlWithParams.searchParams.append("v", witai_version);
        if (params) {
            for (const [key, value] of Object.entries(params)) {
                myUrlWithParams.searchParams.append(key, value);
            }
        }
        headersWithAuth = headers ? headers : {};
        if (data?.token) {
            headersWithAuth = {
                ...headers,
                'Authorization': 'Bearer ' + data?.token
            };
        }
        else {
            headersWithAuth = {
                ...headers,
                'Authorization': 'Bearer ' + witai_token
            };
        }
        return await axiosObservable({
            url: myUrlWithParams.toString(),
            method: method,
            headers: headersWithAuth,
            data: data?.data,
            _requestid: data?._requestid
        });
    }
    catch (exception) {
        console.log(exception);
        return exception.response;
    }
}

exports.cron = async (req, res) => {
    let resultData = {
        code: "error_unexpected_error",
        error: true,
        message: "",
        success: false,
    };
    let result = [];
    try {
        const witai_list = await executesimpletransaction("UFN_WITAI_APP_CRON", { _requestid: req._requestid });
        const url = `${witai_url}/apps`;
        for (const item of witai_list) {
            const witai_response = await witai_request(url, 'post', null, null, {
                _requestid: req._requestid,
                data: {
                    name: item.name,
                    lang: item.lang || 'es',
                    timezone: item.timezone || 'America/Lima',
                    private: true,
                }
            });
            if (witai_response?.status == 200 && witai_response?.data instanceof Object) {
                result.push(await executesimpletransaction("UFN_WITAI_APP_CONFIG", {
                    _requestid: req._requestid,
                    corpid: item.corpid,
                    orgid: item.orgid,
                    id: item.id,
                    appid: witai_response?.data?.app_id,
                    token: witai_response?.data?.access_token,
                }));
            }
        }
        return res.json({
            code: "",
            error: false,
            data: result,
            message: "",
            success: true
        });
    }
    catch (err) {
        return res.status(500).json({
            ...resultData,
            message: err.message
        });
    }
}

exports.entity = async (req, res) => {
    let resultData = {
        code: "error_unexpected_error",
        error: true,
        message: "",
        success: false,
    }
    let result = null;
    try {
        const { corpid, orgid, operation, data } = req.body;
        result = await executesimpletransaction("UFN_WITAI_TRAIN_INS", {
            _requestid: req._requestid,
            corpid: corpid,
            orgid: orgid,
            type: 'entity',
            name: data.name,
            datajson: data,
            operation: operation, // DELETE or ANY
            username: 'admin',
        });
        return res.json({
            code: "",
            error: false,
            data: result?.[0],
            message: "",
            success: true
        });
    }
    catch (err) {
        return res.status(500).json({
            ...resultData,
            message: err.message
        });
    }
}

exports.intent = async (req, res) => {
    let resultData = {
        code: "error_unexpected_error",
        error: true,
        message: "",
        success: false,
    }
    let result = null;
    try {
        const { corpid, orgid, operation, data } = req.body;
        result = await executesimpletransaction("UFN_WITAI_TRAIN_INS", {
            _requestid: req._requestid,
            corpid: corpid,
            orgid: orgid,
            type: 'intent',
            name: data.name,
            datajson: data,
            operation: operation, // DELETE or ANY
            username: 'admin',
        });
        return res.json({
            code: "",
            error: false,
            data: result?.[0],
            message: "",
            success: true
        });
    }
    catch (err) {
        return res.status(500).json({
            ...resultData,
            message: err.message
        });
    }
}

exports.utterance = async (req, res) => {
    let resultData = {
        code: "error_unexpected_error",
        error: true,
        message: "",
        success: false,
    }
    let result = null;
    try {
        const { corpid, orgid, operation, data } = req.body;
        result = await executesimpletransaction("UFN_WITAI_TRAIN_INS", {
            _requestid: req._requestid,
            corpid: corpid,
            orgid: orgid,
            type: 'utterance',
            name: data.text,
            datajson: data,
            operation: operation, // DELETE or ANY
            username: 'admin',
        });
        return res.json({
            code: "",
            error: false,
            data: result?.[0],
            message: "",
            success: true
        });
    }
    catch (err) {
        return res.status(500).json({
            ...resultData,
            message: err.message
        });
    }
}

const train_entities = async ({ _requestid, corpid, orgid, workerid, token, worker_n, witaistatus, witai_train }) => {
    let result = [];
    const url = `${witai_url}/entities`;
    let witai_response = null;
    let w_train_items = witai_train.filter(w => !w[`d${worker_n}`] && w.type === 'entity');
    for (const item of w_train_items) { // type, name, datajson, todelete, w1, d1, w2, d2
        if (item?.todelete) {
            witai_response = await witai_request(`${url}/${item.name}`, 'delete', null, null, {
                _requestid,
                token
            });
            if (witai_response?.status === 200 || witai_response?.data?.code === 'not-found') {
                await executesimpletransaction("UFN_WITAI_TRAIN_UPD", { _requestid, corpid, orgid, ...item, [`w${worker_n}`]: true });
            }
        }
        else {
            // Si existe d[n] es UPDATE si no existe es INSERT
            if (item[`d${worker_n}`]) {
                witai_response = await witai_request(`${url}/${item.name}`, 'put', null, null, {
                    _requestid,
                    token,
                    data: item.datajson
                });
            }
            else {
                witai_response = await witai_request(url, 'post', null, null, {
                    _requestid,
                    token,
                    data: {
                        ...item.datajson,
                        roles: [item.datajson.roles?.[0]?.name || item.datajson.roles[0]]
                    }
                });
            }
            if (witai_response?.status === 200) {
                await executesimpletransaction("UFN_WITAI_TRAIN_UPD", { _requestid, corpid, orgid, ...item, [`w${worker_n}`]: true });
            }
            else if (witai_response?.data?.code === 'already-exists' || witai_response?.data?.error.includes('already exists')) {
                witai_response = await witai_request(`${url}/${item.name}`, 'put', null, null, {
                    _requestid,
                    token,
                    data: item.datajson
                });
                await executesimpletransaction("UFN_WITAI_TRAIN_UPD", { _requestid, corpid, orgid, ...item, [`w${worker_n}`]: true });
            }
        }
        witaistatus = 'scheduled'
        result.push(witai_response?.data);
    }
    return witaistatus, result;
}

const train_intents = async ({ _requestid, corpid, orgid, workerid, token, worker_n, witaistatus, witai_train }) => {
    let result = [];
    const url = `${witai_url}/intents`;
    let witai_response = null;
    let w_train_items = witai_train.filter(w => !w[`d${worker_n}`] && w.type === 'intent');
    for (const item of w_train_items) {
        if (item?.todelete) {
            witai_response = await witai_request(`${url}/${item.name}`, 'delete', null, null, {
                _requestid,
                token
            });
            if (witai_response?.status === 200 || witai_response?.data?.code === 'not-found') {
                await executesimpletransaction("UFN_WITAI_TRAIN_UPD", { _requestid, corpid, orgid, ...item, [`w${worker_n}`]: true });
            }
        }
        else {
            // Si existe d[n] es UPDATE si no existe es INSERT
            if (item[`d${worker_n}`]) {
                witai_response = await witai_request(`${url}/${item.name}`, 'put', null, null, {
                    _requestid,
                    token,
                    data: item.datajson
                });
            }
            else {
                witai_response = await witai_request(url, 'post', null, null, {
                    _requestid,
                    token, data:
                    item.datajson
                });
            }

            if (witai_response?.status === 200) {
                await executesimpletransaction("UFN_WITAI_TRAIN_UPD", { _requestid, corpid, orgid, ...item, [`w${worker_n}`]: true });
            }
            else if (witai_response?.data?.code === 'already-exists' || witai_response?.data?.error.includes('already exists')) {
                witai_response = await witai_request(`${url}/${item.name}`, 'put', null, null, {
                    _requestid,
                    token,
                    data: item.datajson
                });
                await executesimpletransaction("UFN_WITAI_TRAIN_UPD", { _requestid, corpid, orgid, ...item, [`w${worker_n}`]: true });
            }
        }
        witaistatus = 'scheduled'
        result.push(witai_response?.data);
    }
    return witaistatus, result;
}

const train_utterances = async ({ _requestid, corpid, orgid, workerid, token, worker_n, witaistatus, witai_train }) => {
    let result = [];
    const url = `${witai_url}/utterances`;
    let witai_response = null;
    let w_train_items = witai_train.filter(w => !w[`d${worker_n}`] && w.type === 'utterance' && w.todelete);
    if (w_train_items?.length > 0) {
        witai_response = await witai_request(url, 'delete', null, null, {
            _requestid,
            token,
            data: w_train_items.map(d => d.datajson)
        });
        if (witai_response?.status === 200) {
            for (const item of w_train_items) {
                await executesimpletransaction("UFN_WITAI_TRAIN_UPD", { _requestid, corpid, orgid, ...item, [`w${worker_n}`]: true });
            }
        }
        witaistatus = 'scheduled'
        result.push(witai_response?.data);
    }

    w_train_items = witai_train.filter(w => !w[`d${worker_n}`] && w.type === 'utterance' && !w.todelete);
    if (w_train_items?.length > 0) {
        witai_response = await witai_request(url, 'post', null, null, {
            _requestid,
            token,
            data: w_train_items.map(d => ({
                ...d.datajson,
                intent: d.datajson.intent?.name || d.datajson.intent,
                entities: d.datajson.entities.map(e => ({
                    ...e,
                    entity: e?.entity || `${e?.name}:${e?.role}`,
                    entities: e.entities.map(e2 => ({
                        ...e2,
                        entity: e2?.entity || `${e2?.name}:${e2?.role}`,
                    }))
                }))
            }))
        });
        if (witai_response?.status === 200) {
            for (const item of w_train_items) {
                await executesimpletransaction("UFN_WITAI_TRAIN_UPD", { _requestid, corpid, orgid, ...item, [`w${worker_n}`]: true });
            }
        }
        witaistatus = 'scheduled'
        result.push(witai_response?.data);
    }
    return witaistatus, result;
}

exports.train = async (req, res) => {
    let resultData = {
        code: "error_unexpected_error",
        error: true,
        message: "",
        success: false,
    }
    let result = {};
    try {
        const worker_list = await executesimpletransaction("UFN_WITAI_WORKER_TRAIN_SEL", { _requestid: req._requestid });
        for (const worker of worker_list) { // corpid, orgid, worker, id, appid, token
            const corpid = worker?.corpid;
            const orgid = worker?.orgid;
            const workerid = worker?.id;
            const token = worker?.token;
            const worker_n = worker?.worker;
            if (token) {
                let url = '';
                let witai_response = null;
                let witaistatus = 'done';
                
                await executesimpletransaction("QUERY_WITAI_WORKER_INTASK", { _requestid: req._requestid, corpid, orgid, id: workerid, intask: true, witaistatus });
                
                try {
                    const witai_train = await executesimpletransaction("UFN_WITAI_TRAIN_SEL", { _requestid: req._requestid, corpid, orgid });

                    // Entrenar entities
                    witaistatus, result['entity'] = await train_entities({ _requestid: req._requestid, corpid, orgid, workerid, token, worker_n, witaistatus, witai_train });

                    // Entrenar intents
                    witaistatus, result['intent'] = await train_intents({ _requestid: req._requestid, corpid, orgid, workerid, token, worker_n, witaistatus, witai_train });

                    // Entrenar utterances
                    witaistatus, result['utterance'] = await train_utterances({ _requestid: req._requestid, corpid, orgid, workerid, token, worker_n, witaistatus, witai_train });

                    await executesimpletransaction("QUERY_WITAI_WORKER_UPDATED", { _requestid: req._requestid, corpid, orgid, id: workerid, witaistatus });
                } catch (error) {
                    console.log(error)
                    await executesimpletransaction("QUERY_WITAI_WORKER_INTASK", { _requestid: req._requestid, corpid, orgid, id: workerid, intask: false, witaistatus });
                }
            }
        }
        return res.json({
            code: "",
            error: false,
            data: result,
            message: "",
            success: true
        });
    }
    catch (err) {
        return res.status(500).json({
            ...resultData,
            message: err.message
        })
    }
}

exports.train_model = async (req, res) => {
    let resultData = {
        code: "error_unexpected_error",
        error: true,
        message: "",
        success: false,
    }
    let result = {};
    try {
        const { corpid, orgid, model = '' } = req.body;
        
        const worker_list = await executesimpletransaction("UFN_WITAI_WORKER_TRAIN_MODEL_SEL", {
            _requestid: req._requestid,
            corpid, orgid, model
        });
        if (worker_list instanceof Array && worker_list.length > 0) {
            const worker = worker_list[0];
            const workerid = worker?.id;
            const token = worker?.token;
            const worker_n = worker?.worker;
            if (token) {
                let witaistatus = 'done';
                
                await executesimpletransaction("QUERY_WITAI_WORKER_INTASK", { _requestid: req._requestid, corpid, orgid, id: workerid, intask: true, witaistatus });
                
                try {
                    const witai_train = await executesimpletransaction("UFN_WITAI_TRAIN_SEL", { _requestid: req._requestid, corpid, orgid });

                    // Entrenar entities
                    witaistatus, result['entity'] = await train_entities({ _requestid: req._requestid, corpid, orgid, workerid, token, worker_n, witaistatus, witai_train });

                    // Entrenar intents
                    witaistatus, result['intent'] = await train_intents({ _requestid: req._requestid, corpid, orgid, workerid, token, worker_n, witaistatus, witai_train });

                    // Entrenar utterances
                    witaistatus, result['utterance'] = await train_utterances({ _requestid: req._requestid, corpid, orgid, workerid, token, worker_n, witaistatus, witai_train });

                    await executesimpletransaction("QUERY_WITAI_WORKER_UPDATED", { _requestid: req._requestid, corpid, orgid, id: workerid, witaistatus });
                } catch (error) {
                    console.log(error)
                    await executesimpletransaction("QUERY_WITAI_WORKER_INTASK", { _requestid: req._requestid, corpid, orgid, id: workerid, intask: false, witaistatus });
                }
            }
        }
        return res.json({
            code: "",
            error: false,
            data: result,
            message: "",
            success: true
        });
    }
    catch (err) {
        return res.status(500).json({
            ...resultData,
            message: err.message
        })
    }
}

exports.status = async (req, res) => {
    let resultData = {
        code: "error_unexpected_error",
        error: true,
        message: "",
        success: false,
    }
    let result = [];
    try {
        const worker_list = await executesimpletransaction("QUERY_WITAI_WORKER_SCHEDULED_SEL", { _requestid: req._requestid });
        const url = `${witai_url}/apps`;
        for (const worker of worker_list) {
            const corpid = worker?.corpid;
            const orgid = worker?.orgid;
            const workerid = worker?.id;
            const token = worker?.token;
            try {
                const witai_response = await witai_request(`${url}/${worker.appid}`, 'get', null, null, { _requestid: req._requestid, token });
                if (witai_response?.status === 200) {
                    const witaistatus = witai_response?.data?.training_status;
                    await executesimpletransaction("QUERY_WITAI_WORKER_STATUS_UPD", { _requestid: req._requestid, corpid, orgid, id: workerid, witaistatus });
                }
                result.push(witai_response?.data)
            }
            catch (error) {
                console.log(error);
            }
        }
        return res.json({
            code: "",
            error: false,
            data: result,
            message: "",
            success: true
        });
    }
    catch (err) {
        return res.status(500).json({
            ...resultData,
            message: err.message
        });
    }
}

exports.status_model = async (req, res) => {
    let resultData = {
        code: "error_unexpected_error",
        error: true,
        message: "",
        success: false,
    }
    let result = null;
    try {
        const { corpid, orgid, model = '' } = req.body;

        const worker_list = await executesimpletransaction("QUERY_WITAI_MODEL_WORKER_SCHEDULED_SEL", {
            _requestid: req._requestid,
            corpid, orgid, model
        });
        if (worker_list instanceof Array && worker_list.length > 0) {
            const url = `${witai_url}/apps`;
            const worker = worker_list[0];
            const workerid = worker?.id;
            const token = worker?.token;
            try {
                const witai_response = await witai_request(`${url}/${worker.appid}`, 'get', null, null, { _requestid: req._requestid, token });
                if (witai_response?.status === 200) {
                    const witaistatus = witai_response?.data?.training_status;
                    await executesimpletransaction("QUERY_WITAI_WORKER_STATUS_UPD", { _requestid: req._requestid, corpid, orgid, id: workerid, witaistatus });
                }
                result = witai_response?.data
            }
            catch (error) {
                console.log(error);
            }
        }
        return res.json({
            code: "",
            error: false,
            data: result,
            message: "",
            success: true
        });
    }
    catch (err) {
        return res.status(500).json({
            ...resultData,
            message: err.message
        });
    }
}

exports.message = async (req, res) => {
    let resultData = {
        code: "error_unexpected_error",
        error: true,
        message: "",
        success: false,
    }
    try {
        const { corpid, orgid, message } = req.body;
        if (!!message) {
            const worker_list = await executesimpletransaction("UFN_WITAI_APP_GET", { _requestid: req._requestid, corpid, orgid });
            if (worker_list instanceof Array && worker_list.length > 0) {
                const worker = worker_list[0];
                const workerid = worker?.id;
                const token = worker?.token;
                const url = `${witai_url}/message`;
                const witai_response = await witai_request(`${url}`, 'get', null, {q: message}, { _requestid: req._requestid, token });
                await executesimpletransaction("QUERY_WITAI_WORKER_USAGE_UPD", { _requestid: req._requestid, corpid, orgid, id: workerid });
                if (witai_response?.status === 200) {
                    return res.json({
                        code: "",
                        error: false,
                        data: witai_response.data,
                        message: "",
                        success: true
                    });
                }
                else {
                    return res.json({
                        ...resultData,
                        message: witai_response?.data?.error
                    });
                }
            }
        }
        return res.json({
            code: "",
            error: false,
            data: null,
            message: "",
            success: true
        });
    }
    catch (err) {
        return res.status(500).json({
            ...resultData,
            message: err.message
        });
    }
}