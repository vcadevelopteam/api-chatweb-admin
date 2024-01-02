const FormData = require('form-data');
const axios = require('axios')
const OAuth = require("oauth-1.0a");
const crypto = require("crypto");

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

exports.ContinueFlow = async (req, res) => {
    const { key, variables } = req.body;

    if (key && key.split("-").length === 4) {
        const [corpid, orgid, conversationid, personid] = key.split("-");
        axiosObservable({
            url: `${process.env.SERVICES}handler/continueflow`,
            data: {
                corpid, 
                orgid, 
                conversationid, 
                personid,
                variables
            },
            method: "POST",
            _requestid: req._requestid,
        });

        return res.json({ success: true });
    } else {
        return res.status(400).json({ error: true, message: "key is obligatory" });
    }
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
        else if (auth.type === 'oauth1_0') {
            return { 
                type: 'oauth1_0',
                oauth_config: {
                    consumer_key: auth.consumerkey,
                    consumer_secret: auth.consumersecret,
                    realm: auth.realm,
                    access_token: auth.accesstoken,
                    token_secret: auth.tokensecret
                }
            }
        }
        else {
            return { type: 'NONE' }
        }
    }
    return { type: 'NONE' }
}

const setConfig = (auth, headers, url = null, method = null) => {
  const defaults = { headers: headers };
  const { type, token, username, password, oauth_config } =
    getHttpAuthorization(auth);
  if (token) {
    defaults.headers["Authorization"] = `Bearer ${token}`;
  }
  if (type === "BASIC") {
    defaults["auth"] = {
      username: username,
      password: password,
    };
  }
  if (type === "oauth1_0") {
    const oauth = OAuth({
      consumer: {
        key: oauth_config.consumer_key,
        secret: oauth_config.consumer_secret,
      },
      signature_method: "HMAC-SHA256",
      hash_function(base_string, key) {
        return crypto
          .createHmac("sha256", key)
          .update(base_string)
          .digest("base64");
      },
      realm: oauth_config.realm,
    });

    const oauth_token = {
        key: oauth_config.access_token,
        secret: oauth_config.token_secret,
      };

      const requestData = {
        url: url,
        method: method,
      };

    const authorization = oauth.toHeader(oauth.authorize(requestData, oauth_token));
    defaults.headers["Authorization"] = authorization.Authorization
  }
  return defaults;
};

exports.TestRequest = async (req, res) => {
    try {
        const { method, url, authorization, headers, postformat, body, parameters } = req.body;
        let headersjson = headers.reduce((a, x) => ({ ...a, [x.key]: x.value }), {});
        let parametersjson = parameters.reduce((a, x) => ({ ...a, [x.key]: x.value }), {});
        let result = {}
        if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
            if (postformat.toLowerCase() === 'urlencoded') {
                const formData = new FormData();
                Object.keys(parametersjson).forEach(key => formData.append(key, parametersjson[key]));
                result = await axios.post(url, formData, { ...setConfig(authorization, { ...formData.getHeaders(), ...headersjson }) });
            }
            else {
                if (method === "POST") {
                    result = await axios.post(url, postformat.toLowerCase() === 'json' ? JSON.parse(body) : body, { ...setConfig(authorization, headersjson, url, method) });
                } else if (method === "PUT") {
                    result = await axios.put(url, postformat.toLowerCase() === 'json' ? JSON.parse(body) : body, { ...setConfig(authorization, headersjson, url, method) });
                } else if (method === "DELETE") {
                    result = await axios.delete(url, postformat.toLowerCase() === 'json' ? JSON.parse(body) : body, { ...setConfig(authorization, headersjson, url, method) });
                } else if (method === "PATCH") {
                    result = await axios.patch(url, postformat.toLowerCase() === 'json' ? JSON.parse(body) : body, { ...setConfig(authorization, headersjson, url, method) });
                }
            }
        }
        else {
            result = await axios.get(url, { ...setConfig(authorization, headersjson, url, method) });
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

exports.bridgeOauth10 = async (req, res) => {
    try {
        const reqBody = ['method', 'url', 'body']
        for (const prop of reqBody) {
            if (!req.body.hasOwnProperty(prop)) {
              throw new Error(`Missing property in body: ${prop}`);
            }
        }
        const { method, url, body } = req.body;
        const finalHeaders = buildAuthOauth(req.headers, url, method)

        if (method === "POST") {
            result = await axios.post(url, body, finalHeaders);
        } else if (method === "PUT") {
            result = await axios.put(url, body, finalHeaders);
        } else if (method === "DELETE") {
            result = await axios.delete(url, body, finalHeaders);
        } else if (method === "PATCH") {
            result = await axios.patch(url, body, finalHeaders);
        }
        else {
            result = await axios.get(url, finalHeaders);
        }

        return res.json(result.data);
    } catch (exception) {
        if (!!exception.response) {
            return res.json({ error: 'ERROR', status: exception.response?.status, data: exception.response?.data });
        }
        else {
            return res.json({ error: exception.message });
        }
    }
}

const buildAuthOauth = (headers, url, method) => {
    const reqProperties = ['consumerkey', 'consumersecret', 'accesstoken', 'secrettoken', 'realm']
    for (const prop of reqProperties) {
        if (!headers.hasOwnProperty(prop)) {
            throw new Error(`Missing property in header: ${prop}`);
        }
    }

    const { consumerkey, consumersecret, accesstoken, secrettoken, realm } = headers
    const defaults = { headers: headers };

    const deleteProperties = ['authorization', 'host', 'connection', 'accept', 'content-type', 'content-length', 'user-agent']
    for (const prop of [...reqProperties, ...deleteProperties]) {
        delete headers[prop]
    }
    
    const oauth = OAuth({
        consumer: {
            key: consumerkey,
            secret: consumersecret,
        },
        signature_method: "HMAC-SHA256",
        hash_function(base_string, key) {
            return crypto
            .createHmac("sha256", key)
            .update(base_string)
            .digest("base64");
        },
        realm: realm,
    });

    const oauth_token = {
        key: accesstoken,
        secret: secrettoken,
    };

    const requestData = {
        url: url,
        method: method,
    };

    const authorization = oauth.toHeader(oauth.authorize(requestData, oauth_token));
    defaults.headers["Authorization"] = authorization.Authorization

    return defaults
}