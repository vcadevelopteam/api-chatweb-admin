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
            data: data,
            _requestid: data?._requestid
        });
    }
    catch (exception) {
        console.log(exception);
        return null;
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
        const witai_list = await executesimpletransaction("UFN_WITAI_CRON", { _requestid: req._requestid });
        for (const item of witai_list) {
            const url = `${witai_url}/apps`;
            const witai_response = await witai_request(url, 'post', null, null, {
                _requestid: req._requestid,
                name: item.name,
                lang: item.lang || 'es',
                timezone: item.timezone || 'America/Lima',
                private: true,
            });
            if (witai_response?.status == 200 && witai_response?.data instanceof Object) {
                result.push(await executesimpletransaction("UFN_WITAI_CONFIG", {
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

exports.entity_train = async (req, res) => {
    let resultData = {
        code: "error_unexpected_error",
        error: true,
        message: "",
        success: false,
    }
    let result = null;
    try {
        const { corpid, orgid, operation, data } = req.body;
        const witai_list = await executesimpletransaction("UFN_WITAI_GET", { _requestid: req._requestid, corpid, orgid });
        for (const item of witai_list) {
            let url = `${witai_url}/entities`;
            let witai_response = null;
            let witai_data = null;
            switch (operation) {
                case 'INSERT':
                    witai_data = {
                        name: data.name,
                        roles: [data.name],
                        lookups: ["keywords"],
                        keywords: data.keywords,
                    };
                    witai_response = await witai_request(url, 'post', null, null, { _requestid: req._requestid, token: item.token, ...witai_data });
                    break;
                case 'UPDATE':
                    witai_data = {
                        name: data.name,
                        roles: [data.name],
                        lookups: ["keywords"],
                        keywords: data.keywords,
                    }   
                    witai_response = await witai_request(`${url}/${data.name}`, 'put', null, null, { _requestid: req._requestid, token: item.token, ...witai_data });
                    break;
                case 'DELETE':
                    witai_response = await witai_request(`${url}/${data.name}`, 'delete', null, null, {
                        _requestid: req._requestid,
                        token: item.token,
                    });
                    break;
                default:
                    break;
            }
        }
        if (witai_response && witai_data) {
            result = await executesimpletransaction("UFN_WITAI_TRAIN", {
                _requestid: req._requestid,
                corpid: item.corpid,
                orgid: item.orgid,
                type: 'entity',
                name: data.name,
                datajson: witai_data,
                username: 'admin',
            });
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