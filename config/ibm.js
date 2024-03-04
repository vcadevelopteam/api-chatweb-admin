const { getErrorCode, errors, axiosObservable } = require('./helpers');
const qs = require('qs');
const axios = require('axios');


exports.iamToken = async (_requestid) => {
    try {
        const data = qs.stringify({
            'apikey': process.env.APIKEY_IAM,
            'response_type': 'cloud_iam',
            'grant_type': 'urn:ibm:params:oauth:grant-type:apikey'
        });

        const res = await axios.post("https://iam.cloud.ibm.com/oidc/token", data, {
            'Content-Type': 'application/x-www-form-urlencoded'
        });

        return res.data.access_token;
    } catch (exception) {
        return getErrorCode(errors.UNEXPECTED_ERROR, exception, "Executing iamToken", _requestid);;
    }
}

exports.createDNS = async (token, subdomain, _requestid) => {
    try {
        const url = `https://api.cis.cloud.ibm.com/v1/${process.env.DNS_CRN}/zones/${process.env.DNS_ZONE}/dns_records`;
        const data = {
            name: subdomain,
            type: "CNAME",
            content: process.env.DNS_URL,
            proxied: true
        };
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };
        const res = await axiosObservable({
            url,
            data,
            headers: config.headers
        });

        return res.data;
    } catch (exception) {
        return getErrorCode(errors.UNEXPECTED_ERROR, exception, "Executing createDNS", _requestid);;
    }
}

exports.createPageRule = async (token, endpoint, name, _requestid) => {
    try {
        const url = `https://api.cis.cloud.ibm.com/v1/${process.env.DNS_CRN}/zones/${process.env.DNS_ZONE}/pagerules`;
        const data = {
            targets: [
                {
                    "target": "url",
                    "constraint": {
                        "operator": "matches",
                        "value": `${name}/*`
                    }
                }
            ],
            actions: [
                {
                    "id": "host_header_override",
                    "value": endpoint
                },
            ],
            "priority": 1,
            "status": "active"
        };

        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        const res = await axiosObservable({
            url,
            data,
            headers: config.headers
        });

        return res.data;
    } catch (exception) {
        console.log
        return getErrorCode(errors.UNEXPECTED_ERROR, exception, "Executing createPageRule", _requestid);;
    }
}