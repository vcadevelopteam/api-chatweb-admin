const FormData = require('form-data');
const axios = require('axios')

const { axiosObservable, setSessionParameters } = require('../config/helpers');

exports.Location = async (req, res) => {
    const data = req.body;

    axiosObservable({
        url: `${process.env.SERVICES}handler/sendlocation`,
        data,
        method: "POST",
        _requestid: req._requestid,
    });

    res.json({ success: true });
}

exports.TriggerBlock = async (req, res) => {
    const parameters = req.body;

    setSessionParameters(parameters, req.user, req._requestid);
    parameters.p_userid = parameters.userid;
    parameters.p_corpid = parameters.corpid;
    parameters.p_orgid = parameters.orgid;

    axiosObservable({
        url: `${process.env.SERVICES}handler/triggerblock`,
        data: parameters,
        method: "POST",
        _requestid: req._requestid,
    });

    res.json({ success: true });
}

exports.ShippingCar = async (req, res) => {
    const data = req.body;
    const listreq = data.list.map(x => ({
        ...data,
        list: undefined,
        PR_CODIGO: x.key,
        PD_CANTIDAD: x.quantity,
        DESCRIPCION: x.description
    }))
    const response = await axiosObservable({
        url: `https://backend.laraigo.com/zyxme/bridge/api/processsolgas/sendrequestlist`,
        data: listreq,
        method: "post",
        _requestid: req._requestid,
    });

    res.json(response.data?.[0] || { success: false });
}

const getHttpAuthorization = (authorization) => {
    if (authorization.length > 0) {
        let auth = authorization[0];
        if (auth.type === 'bearertoken') {
            return { type: 'BEARER', token: auth.token }
        }
        else if (auth.type === 'basicauth') {
            return { type: 'BASIC', username: auth.username, password: auth.password }
        }
        else {
            return { type: 'NONE' }
        }
    }
    return { type: 'NONE' }
}

const setConfig = (auth, headers) => {
    const defaults = { headers: headers };
    const { type, token, username, password } = getHttpAuthorization(auth);
    if (token) {
        defaults.headers['Authorization'] = `Bearer ${token}`;
    }
    if (type === 'BASIC') {
        // defaults['Authorization'] = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
        defaults['auth'] = {
            username: username,
            password: password,
        }
    }
    return defaults;
}

exports.TestRequest = async (req, res) => {
    try {
        const { method, url, authorization, headers, postformat, body, parameters } = req.body;
        let headersjson = headers.reduce((a, x) => ({ ...a, [x.key]: x.value }), {});
        let parametersjson = parameters.reduce((a, x) => ({ ...a, [x.key]: x.value }), {});
        let result = {}
        if (method === 'POST') {
            if (postformat.toLowerCase() === 'urlencoded') {
                const formData = new FormData();
                Object.keys(parametersjson).forEach(key => formData.append(key, parametersjson[key]));
                result = await axios.post(url, formData, { ...setConfig(authorization, { ...formData.getHeaders(), ...headersjson }) });
            }
            else if (postformat.toLowerCase() === 'json') {
                result = await axios.post(url, JSON.parse(body), { ...setConfig(authorization, headersjson) });
            }
            else {
                result = await axios.post(url, body, { ...setConfig(authorization, headersjson) });
            }
        }
        else {
            result = await axios.get(url, { ...setConfig(authorization, headersjson) });
        }
        return res.json(result.data);
    }
    catch (exception) {
        if (!!exception.response) {
            return res.json({ error: 'ERROR', status: exception.response?.status, data: exception.response?.data });
        }
        else {
            return res.json({ error: exception.message });
        }
    }
}