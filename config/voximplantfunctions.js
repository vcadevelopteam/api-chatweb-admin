const fs = require("fs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const FormData = require("form-data");

const VOXIMPLANT_CREDENTIALS='./voximplant_credentials.json'
const VOXIMPLANT_ACCOUNT_ID = 4494102
const VOXIMPLANT_APIRUL = 'https://api.voximplant.com/platform_api/'
const VOXIMPLANT_APIKEY = '99f0e67a-80a0-4f18-b98b-1c025a4545da'

const getJWT = async () => {
    try {
        const data = await fs.promises.readFile(VOXIMPLANT_CREDENTIALS, 'utf8')
        key = JSON.parse(data);
        const nowTS = (+new Date()) / 1000 | 0;
        const tokenData = { iss: key.account_id, iat: nowTS, exp: nowTS + 3600 };
        const token = jwt.sign(tokenData, key.private_key, { algorithm: 'RS256', header: { kid: key.key_id } });
        return token
    }
    catch (err) {
        console.log(err);
        return ''
    }
}

exports.getChildrenAccounts = async () => {
    try {
        const form = new FormData();
        form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
        const token = await getJWT();
        const result = await await axios({
            method: "post",
            url: `${VOXIMPLANT_APIRUL}GetChildrenAccounts`,
            data: form,
            headers: Object.assign({}, form.getHeaders(), { 'Authorization': 'Bearer ' + token }),
        });
        return result.data
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.addAccount = async ({accountname, accountemail, accountpassword}) => {
    try {
        const form = new FormData();
        form.append('parent_account_id', VOXIMPLANT_ACCOUNT_ID);
        form.append('parent_account_api_key', VOXIMPLANT_APIKEY);
        form.append('account_name', accountname);
        form.append('account_email', accountemail);
        form.append('account_password', accountpassword);
        const token = await getJWT();
        const result = await axios({
            method: "post",
            url: `${VOXIMPLANT_APIRUL}AddAccount`,
            data: form,
            headers: Object.assign({}, form.getHeaders(), { 'Authorization': 'Bearer ' + token }),
        });
        if (result.data.error) {
            console.log(result.data.error);
            return undefined;
        }
        return result.data
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.getApplications = async () => {
    try {
        const form = new FormData();
        form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
        const token = await getJWT();
        const result = await axios({
            method: "post",
            url: `${VOXIMPLANT_APIRUL}GetApplications`,
            data: form,
            headers: Object.assign({}, form.getHeaders(), { 'Authorization': 'Bearer ' + token }),
        });
        return result.data
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.getUsers = async ({applicationid}) => {
    try {
        const form = new FormData();
        form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
        form.append('application_id', applicationid);
        const token = await getJWT();
        const result = await axios({
            method: "post",
            url: `${VOXIMPLANT_APIRUL}GetUsers`,
            data: form,
            headers: Object.assign({}, form.getHeaders(), { 'Authorization': 'Bearer ' + token }),
        });
        return result.data
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.getUser = async ({applicationid, username}) => {
    try {
        const form = new FormData();
        form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
        form.append('application_id', applicationid);
        form.append('user_name', username);
        const token = await getJWT();
        const result = await axios({
            method: "post",
            url: `${VOXIMPLANT_APIRUL}GetUsers`,
            data: form,
            headers: Object.assign({}, form.getHeaders(), { 'Authorization': 'Bearer ' + token }),
        });
        return result.data?.result?.[0]
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.addUser = async ({applicationid, username, displayname, password}) => {
    try {
        const form = new FormData();
        form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
        form.append('application_id', applicationid);
        // `user${userid}.${orgid}`
        form.append('user_name', username);
        form.append('user_display_name', displayname);
        // Laraigo2022$CDFD
        form.append('user_password', password);
        const token = await getJWT();
        const result = await axios({
            method: "post",
            url: `${VOXIMPLANT_APIRUL}AddUser`,
            data: form,
            headers: Object.assign({}, form.getHeaders(), { 'Authorization': 'Bearer ' + token }),
        });
        if (result.data.error) {
            console.log(result.data.error);
            return undefined;
        }
        return result.data
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.getQueues = async ({applicationid}) => {
    try {
        const form = new FormData();
        form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
        form.append('application_id', applicationid);
        const token = await getJWT();
        const result = await axios({
            method: "post",
            url: `${VOXIMPLANT_APIRUL}GetQueues`,
            data: form,
            headers: Object.assign({}, form.getHeaders(), { 'Authorization': 'Bearer ' + token }),
        });
        return result.data
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.bindUserToQueue = async ({applicationid, userid, queuename, bind = true}) => {
    try {
        const form = new FormData();
        form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
        form.append('application_id', applicationid);
        form.append('user_id', userid);
        form.append('acd_queue_name', queuename);
        form.append('bind', `${bind}`);
        const token = await getJWT();
        const result = await axios({
            method: "post",
            url: `${VOXIMPLANT_APIRUL}BindUserToQueue`,
            data: form,
            headers: Object.assign({}, form.getHeaders(), { 'Authorization': 'Bearer ' + token }),
        });
        if (result.data.error) {
            console.log(result.data.error);
            return undefined;
        }
        return result.data
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}