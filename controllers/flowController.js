const axios = require('axios')
const FormData = require('form-data');

exports.Location = async (req, res) => {
    const data = req.body;

    axios.post(`${process.env.SERVICES}handler/sendlocation`, data);

    res.json({ success: true });
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
        defaults['Authorization'] = `Bearer ${token}`;
    }
    if (type === 'BASIC') {
        // defaults['Authorization'] = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
        defaults['auth'] = {
            username: username,
            password: password
        }
    }
    return defaults;
}

exports.TestRequest = async (req, res) => {
    try {
        const { method, url, authorization, headers, postformat, body, parameters } = req.body;
        let headersjson = headers.reduce((a, x) => ({...a, [x.key]: x.value}), {});
        let parametersjson = parameters.reduce((a, x) => ({...a, [x.key]: x.value}), {});
        let result = {}
        if (method === 'POST') {
            if (postformat.toLowerCase() === 'urlencoded') {
                const formData = new FormData();
                Object.keys(parametersjson).forEach(key => formData.append(key, parametersjson[key]));
                result = await axios.post(url, formData, {...setConfig(authorization, {...formData.getHeaders(), ...headersjson})});
            }
            else if (postformat.toLowerCase() === 'json') {
                result = await axios.post(url, JSON.parse(body), {...setConfig(authorization, headersjson)});
            }
            else {
                result = await axios.post(url, body, {...setConfig(authorization, headersjson)});
            }
        }
        else {
            result = await axios.get(url, {...setConfig(authorization, headersjson)});
        }
        return res.json(result.data);
    }
    catch (err) {
        if (!!err.response) {
            return res.json({error: 'ERROR', status: err.response?.status, data: err.response?.data}); 
        }
        else {
            return res.json({error: err.message}); 
        }
    }
}