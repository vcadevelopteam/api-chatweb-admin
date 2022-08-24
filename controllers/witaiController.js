const { executesimpletransaction } = require('../config/triggerfunctions');
const { setSessionParameters, axiosObservable, getErrorCode } = require('../config/helpers');
const logger = require('../config/winston');

const witai_url = 'https://api.wit.ai'
const witai_version = '20220622'
const witai_token = 'N4JLYN6QZJGK7CUJAKHKOCHA4WKHSKLF';

const witai_request = async (url, method, headers, params, data) => {
    try {
        const myUrlWithParams = new URL(url);
        myUrlWithParams.searchParams.append("v", witai_version);
        if (params) {
            for (const [key, value] in Object.entries(params)) {
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
        for (const item of witai_list) {
            const url = `${witai_url}/apps`;
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
                    appid: witai_response.data?.app_id,
                    token: witai_response.data?.access_token,
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

exports.train = async (req, res) => {
    let resultData = {
        code: "error_unexpected_error",
        error: true,
        message: "",
        success: false,
    }
    let result = null;
    try {
        const worker_list = await executesimpletransaction("UFN_WITAI_WORKER_TRAIN_SEL", { _requestid: req._requestid });
        for (const worker of worker_list) { // corpid, orgid, worker, id, appid, token
            const corpid = worker?.corpid;
            const orgid = worker?.orgid;
            const workerid = worker?.id;
            const token = worker?.token;
            const worker_n = worker?.worker;
            if (token) {
                await executesimpletransaction("QUERY_WITAI_WORKER_INTASK", { _requestid: req._requestid, corpid, orgid, id: workerid, intask: true });
                
                try {
                    let url = '';
                    let witai_response = null;
                    const witai_train = await executesimpletransaction("UFN_WITAI_TRAIN_SEL", { _requestid: req._requestid, corpid, orgid });

                    // Entrenar entities
                    url = `${witai_url}/entities`;
                    let w_train_items = witai_train.filter(w => !w[`d${worker_n}`] && w.type === 'entity');
                    for (const item of w_train_items) { // type, name, datajson, todelete, w1, d1, w2, d2
                        if (item?.todelete) {
                            witai_response = await witai_request(`${url}/${item.name}`, 'delete', null, null, { _requestid: req._requestid, token });
                            if (witai_response?.status === 200) {
                                await executesimpletransaction("UFN_WITAI_TRAIN_UPD", { _requestid: req._requestid, corpid, orgid, ...item, [`w${worker_n}`]: true });
                            }
                        }
                        else {
                            // Si existe d[n] es UPDATE si no existe es INSERT
                            if (item[`d${worker_n}`]) {
                                witai_response = await witai_request(`${url}/${item.name}`, 'put', null, null, { _requestid: req._requestid, token, data: item.datajson });
                            }
                            else {
                                witai_response = await witai_request(url, 'post', null, null, { _requestid: req._requestid, token, data: item.datajson });
                            }

                            if (witai_response?.status === 200) {
                                await executesimpletransaction("UFN_WITAI_TRAIN_UPD", { _requestid: req._requestid, corpid, orgid, ...item, [`w${worker_n}`]: true });
                            }
                            else if (witai_response.data.code === 'already-exists') {
                                witai_response = await witai_request(`${url}/${item.name}`, 'put', null, null, { _requestid: req._requestid, token, data: item.datajson });
                                await executesimpletransaction("UFN_WITAI_TRAIN_UPD", { _requestid: req._requestid, corpid, orgid, ...item, [`w${worker_n}`]: true });
                            }
                        }
                    }

                    // Entrenar intents
                    url = `${witai_url}/intents`;
                    w_train_items = witai_train.filter(w => !w[`d${worker_n}`] && w.type === 'intent');
                    for (const item of w_train_items) {
                        if (item?.todelete) {
                            witai_response = await witai_request(`${url}/${item.name}`, 'delete', null, null, { _requestid: req._requestid, token });
                            if (witai_response?.status === 200) {
                                await executesimpletransaction("UFN_WITAI_TRAIN_UPD", { _requestid: req._requestid, corpid, orgid, ...item, [`w${worker_n}`]: true });
                            }
                        }
                        else {
                            // Si existe d[n] es UPDATE si no existe es INSERT
                            if (item[`d${worker_n}`]) {
                                witai_response = await witai_request(`${url}/${item.name}`, 'put', null, null, { _requestid: req._requestid, token, data: item.datajson });
                            }
                            else {
                                witai_response = await witai_request(url, 'post', null, null, { _requestid: req._requestid, token, data: item.datajson });
                            }

                            if (witai_response?.status === 200) {
                                await executesimpletransaction("UFN_WITAI_TRAIN_UPD", { _requestid: req._requestid, corpid, orgid, ...item, [`w${worker_n}`]: true });
                            }
                            else if (witai_response.data.code === 'already-exists') {
                                witai_response = await witai_request(`${url}/${item.name}`, 'put', null, null, { _requestid: req._requestid, token, data: item.datajson });
                                await executesimpletransaction("UFN_WITAI_TRAIN_UPD", { _requestid: req._requestid, corpid, orgid, ...item, [`w${worker_n}`]: true });
                            }
                        }
                    }

                    // Entrenar utterances
                    url = `${witai_url}/utterances`;
                    w_train_items = witai_train.filter(w => !w[`d${worker_n}`] && w.type === 'utterance' && w.todelete);
                    if (w_train_items?.length > 0) {
                        witai_response = await witai_request(url, 'delete', null, null, { _requestid: req._requestid, token, data: w_train_items });
                        if (witai_response.status === 200) {
                            for (const item of w_train_items) {
                                await executesimpletransaction("UFN_WITAI_TRAIN_UPD", { _requestid: req._requestid, corpid, orgid, ...item, [`w${w_index}`]: true });
                            }
                        }
                    }

                    w_train_items = witai_train.filter(w => !w[`d${worker_n}`] && w.type === 'utterance' && !w.todelete);
                    if (w_train_items?.length > 0) {
                        witai_response = await witai_request(url, 'post', null, null, { _requestid: req._requestid, token, data: w_train_items });
                        if (witai_response.status === 200) {
                            for (const item of w_train_items) {
                                await executesimpletransaction("UFN_WITAI_TRAIN_UPD", { _requestid: req._requestid, corpid, orgid, ...item, [`w${w_index}`]: true });
                            }
                        }
                    }

                    await executesimpletransaction("QUERY_WITAI_WORKER_UPDATED", { _requestid: req._requestid, corpid, orgid, id: workerid });
                } catch (error) {
                    await executesimpletransaction("QUERY_WITAI_WORKER_INTASK", { _requestid: req._requestid, corpid, orgid, id: workerid, intask: false });
                }
            }
        }
        
        // // Trae toda la data que hay para entrenar
        // const witai_train = await executesimpletransaction("UFN_WITAI_TRAIN_SEL", { _requestid: req._requestid, corpid, orgid });
        // let witai_response = null;
        // for (const w_index of [1,2]) {
        //     // Valida si hay data para entrenar para el worker n
        //     const w_train = witai_train.filter(w => !w[`w${w_index}`]);
        //     if (w_train.length > 0) {
        //         // Traer la info del worker
        //         const worker_data = await executesimpletransaction("UFN_WITAI_WORKER_SEL", { _requestid: req._requestid, corpid, orgid, worker: w_index });
        //         const token = worker_data?.[0]?.token;
        //         if (token) {
        //             // Entrenar entities
        //             url = `${witai_url}/entities`;
        //             let w_train_items = w_train.filter(w => w.type === 'entity');
        //             for (const item of w_train_items) {
        //                 if (item[`d${w_index}`]) {
        //                     witai_response = await witai_request(`${url}/${item.name}`, 'put', null, null, { _requestid: req._requestid, token, data: item.datajson });
        //                 }
        //                 else {
        //                     witai_response = await witai_request(url, 'post', null, null, { _requestid: req._requestid, token, data: item.datajson });
        //                 }
        //                 if (witai_response.status === 200) {
        //                     await executesimpletransaction("UFN_WITAI_TRAIN_UPD", { _requestid: req._requestid, corpid, orgid, ...item, [`w${w_index}`]: true });
        //                 }
        //                 else if (witai_response.data.code === 'already-exists') {
        //                     witai_response = await witai_request(`${url}/${item.name}`, 'put', null, null, { _requestid: req._requestid, token, data: item.datajson });
        //                     await executesimpletransaction("UFN_WITAI_TRAIN_UPD", { _requestid: req._requestid, corpid, orgid, ...item, [`w${w_index}`]: true });
        //                 }
        //             }
        //             // Entrenar intents
        //             url = `${witai_url}/intents`;
        //             w_train_items = w_train.filter(w => w.type === 'intent');
        //             for (const item of w_train_items) {
        //                 if (item[`d${w_index}`]) {
        //                     witai_response = await witai_request(`${url}/${item.name}`, 'put', null, null, { _requestid: req._requestid, token, data: item.datajson });
        //                 }
        //                 else {
        //                     witai_response = await witai_request(url, 'post', null, null, { _requestid: req._requestid, token, data: item.datajson });
        //                 }
        //                 if (witai_response.status === 200) {
        //                     await executesimpletransaction("UFN_WITAI_TRAIN_UPD", { _requestid: req._requestid, corpid, orgid, ...item, [`w${w_index}`]: true });
        //                 }
        //                 else if (witai_response.data.code === 'already-exists') {
        //                     witai_response = await witai_request(`${url}/${item.name}`, 'put', null, null, { _requestid: req._requestid, token, data: item.datajson });
        //                     await executesimpletransaction("UFN_WITAI_TRAIN_UPD", { _requestid: req._requestid, corpid, orgid, ...item, [`w${w_index}`]: true });
        //                 }
        //             }
        //             // Entrenar utterances
        //             url = `${witai_url}/utterances`;
        //             w_train_items = w_train.filter(w => w.type === 'utterance');
        //             if (w_train_items?.length > 0) {
        //                 witai_response = await witai_request(url, 'post', null, null, { _requestid: req._requestid, token, data: w_train_items });
        //                 if (witai_response.status === 200) {
        //                     for (const item of w_train_items) {
        //                         await executesimpletransaction("UFN_WITAI_TRAIN_UPD", { _requestid: req._requestid, corpid, orgid, ...item, [`w${w_index}`]: true });
        //                     }
        //                 }
        //             }
        //         }
        //         break;
        //     }
        // }
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
