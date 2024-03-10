const { getErrorCode, errors, axiosObservable } = require('./helpers');
const { GoogleAuth } = require('google-auth-library');
const axios = require('axios')

async function getTokenAuth() {
    const auth = new GoogleAuth({
        keyFilename: './googleauth.json',
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    try {
        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();
        console.log("accessToken", accessToken)
        return accessToken.token;
    } catch (error) {
        console.error('Error al obtener el token de autenticación:', error);
        return null;
    }
}

const getDomains = async (token, projectId, keyid) => {
    const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/keys/${keyid}`;

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const allowedDomains = response.data.webSettings.allowedDomains;

        return allowedDomains;
    } catch (exception) {
        return getErrorCode(errors.UNEXPECTED_ERROR, exception, "Executing createDNS", _requestid);;
    }
};

async function AddDomainToKey(token, projectId, keyId, domains) {
    const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/keys/${keyId}?updateMask=webSettings.allowedDomains`;
    const body = {
        webSettings: {
            allowedDomains: domains
        }
    };

    try {
        const response = await axios.patch(url, body, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (exception) {
        return getErrorCode(errors.UNEXPECTED_ERROR, exception, "Executing createDNS", _requestid);;
    }
}

exports.updateDomainRecaptcha = async (newdomain) => {
    const projectId = 'zyxme-263623';
    const keyId = '6LeOA44nAAAAAMsIQ5QyEg-gx6_4CUP3lekPbT0n';

    try {
        const token = await getTokenAuth();
        if (token.error) {
            throw new Error("Error to get auth token")
        }
        const webdomains = await getDomains(token, projectId, keyId);
        if (webdomains.error) {
            throw new Error("Error to get webdomains")
        }
        const resx = await AddDomainToKey(token, projectId, keyId, [...webdomains, newdomain]);
        if (resx.error) {
            throw new Error("Error to update domains")
        }
        return resx
    } catch (exception) {
        return getErrorCode(errors.UNEXPECTED_ERROR, exception, "Executing createDNS", _requestid);;
    }
};