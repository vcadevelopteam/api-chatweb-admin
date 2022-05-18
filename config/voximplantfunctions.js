const fs = require("fs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const FormData = require("form-data");
require('dotenv').config();

const VOXIMPLANT_CREDENTIALS = process.env.VOXIMPLANT_CREDENTIALS
const VOXIMPLANT_ACCOUNT_ID = process.env.VOXIMPLANT_ACCOUNT_ID
const VOXIMPLANT_APIRUL = process.env.VOXIMPLANT_APIRUL
const VOXIMPLANT_APIKEY = process.env.VOXIMPLANT_APIKEY

// Parent //
const getJWT = async () => {
    try {
        const data = await fs.promises.readFile(VOXIMPLANT_CREDENTIALS, 'utf8')
        key = JSON.parse(data);
        const nowTS = (+new Date()) / 1000 | 0;
        const tokenData = { iss: key.account_id, iat: nowTS, exp: nowTS + 3600 };
        const token = jwt.sign(tokenData, key.private_key, { algorithm: 'RS256', header: { kid: key.key_id } });
        return token;
    }
    catch (err) {
        console.log(err);
        return ''
    }
}

const voximplantParentRequest = async (path, form) => {
    const token = await getJWT();
    return await axios({
        method: "post",
        url: `${VOXIMPLANT_APIRUL}${path}`,
        data: form,
        headers: Object.assign({}, form.getHeaders(), { 'Authorization': 'Bearer ' + token }),
    });
}

exports.getChildrenAccounts = async ({ child_account_id, child_account_name }) => {
    try {
        const form = new FormData();
        if (child_account_id)
            form.append('child_account_id', child_account_id);
        else if (child_account_name)
            form.append('child_account_name', child_account_name);
        const result = await voximplantParentRequest('GetChildrenAccounts', form);
        return result.data;
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.getAccountInvoices = async () => {
    try {
        const form = new FormData();
        form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
        const result = await voximplantParentRequest('GetAccountInvoices', form);
        return result.data;
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.getChildrenAccount = async ({ child_account_id, child_account_name }) => {
    try {
        const form = new FormData();
        if (child_account_id)
            form.append('child_account_id', child_account_id);
        else if (child_account_name)
            form.append('child_account_name', child_account_name);
        const result = await voximplantParentRequest('GetChildrenAccounts', form);
        return result.data?.result?.[0];
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.transferMoneyToUser = async ({ child_account_id, amount, currency }) => {
    try {
        const form = new FormData();
        form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
        form.append('api_key', VOXIMPLANT_APIKEY);
        form.append('child_account_id', child_account_id);
        form.append('amount', amount);
        form.append('currency', currency);
        const result = await voximplantParentRequest('TransferMoneyToChildAccount', form);
        if (result.data.error) {
            console.log(result.data.error);
            return { error: result.data.error };
        }
        return result.data;
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.addAccount = async ({ account_name, account_email, account_password }) => {
    try {
        const form = new FormData();
        form.append('parent_account_id', VOXIMPLANT_ACCOUNT_ID);
        form.append('parent_account_api_key', VOXIMPLANT_APIKEY);
        form.append('account_name', account_name);
        form.append('account_email', account_email);
        form.append('account_password', account_password);
        form.append('active', `${true}`);
        const result = await voximplantParentRequest('AddAccount', form);
        if (result.data.error) {
            console.log(result.data.error);
            return { error: result.data.error };
        }
        return result.data;
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.setChildAccountInfo = async ({ child_account_id, child_account_name, active }) => {
    try {
        const form = new FormData();
        if (child_account_id)
            form.append('child_account_id', child_account_id);
        else if (child_account_name)
            form.append('child_account_name', child_account_name);
        form.append('active', `${active}`);
        const result = await voximplantParentRequest('SetChildAccountInfo', form);
        if (result.data.error) {
            console.log(result.data.error);
            return { error: result.data.error };
        }
        return result.data;
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

// Childs //
const setChildData = ({ data, account_id, account_name }) => {
    if (account_id)
        data['account_id'] = account_id;
    else if (account_name)
        data['account_name'] = account_name;
}

const getApiKey = async ({ child_account_id, child_account_name, child_apikey = null }) => {
    if (child_apikey) {
        return child_apikey;
    }
    else {
        const result = await this.getChildrenAccount({ child_account_id, child_account_name })
        return result?.api_key;
    }
}

const voximplantRequest = async (path, data) => {
    const form = new FormData();
    Object.keys(data).forEach(k => {
        if (![undefined, null].includes(data[k])) {
            form.append(k, data[k])
        }
    });
    if (data['account_id'] || data['account_name']) {
        const api_key = await getApiKey({
            child_account_id: data['account_id'],
            child_account_name: data['account_name'],
            child_apikey: data['child_apikey'],
        });
        form.append('api_key', api_key);
        return await axios({
            method: "post",
            url: `${VOXIMPLANT_APIRUL}${path}`,
            data: form,
            headers: Object.assign({}, form.getHeaders()),
        });
    }
    else {
        return await voximplantParentRequest(path, form);
    }
}

exports.addApplication = async ({ account_id, account_name, application_name, child_apikey = null }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['application_name'] = application_name;
        data['secure_record_storage'] = `${true}`;
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        const result = await voximplantRequest('AddApplication', data);
        if (result.data.error) {
            console.log(result.data.error);
            return { error: result.data.error };
        }
        return result.data;
        // {
        //     "result": 1,
        //     "application_name": "myapp1.test.voximplant.com",
        //     "application_id": 1,
        //     "secure_record_storage": false
        // }
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.addScenario = async ({ account_id, account_name, scenario_name, scenario_script, child_apikey = null }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['scenario_name'] = scenario_name;
        data['scenario_script'] = scenario_script;
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        const result = await voximplantRequest('AddScenario', data);
        if (result.data.error) {
            console.log(result.data.error);
            return { error: result.data.error };
        }
        return result.data;
        // {
        //     "result": 1,
        //     "rule_name": "myapp1.test.voximplant.com",
        //     "application_id": 1,
        //     "secure_record_storage": false
        // }
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.addRule = async ({ account_id, account_name, application_id, rule_name, rule_pattern, scenario_id, child_apikey = null }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['application_id'] = application_id;
        data['rule_name'] = rule_name;
        data['rule_pattern'] = rule_pattern;
        data['scenario_id'] = scenario_id;
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        const result = await voximplantRequest('AddRule', data);
        if (result.data.error) {
            console.log(result.data.error);
            return { error: result.data.error };
        }
        return result.data;
        // {
        //     "result": 1,
        //     "rule_name": "myapp1.test.voximplant.com",
        //     "application_id": 1,
        //     "secure_record_storage": false
        // }
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.getApplications = async ({ account_id, account_name, application_name }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        if (application_name)
            data['application_name'] = application_name;
        const result = await voximplantRequest('GetApplications', data);
        return result.data;
        // {
        //     "result": [
        //         {
        //             "application_name": "demo.nanoxxi93.voximplant.com",
        //             "created": "2022-05-04 15:42:32",
        //             "modified": "2022-05-04 15:42:32",
        //             "secure_record_storage": true,
        //             "application_id": 10454252,
        //             "extended_application_name": "demo.nanoxxi93.n2.voximplant.com"
        //         }
        //     ],
        //     "total_count": 2,
        //     "count": 2
        // }
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.getApplication = async ({ account_id, account_name, application_name }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['application_name'] = application_name;
        const result = await voximplantRequest('GetApplications', data);
        return result.data?.result?.[0];
        // {
        //     "application_name": "demo.nanoxxi93.voximplant.com",
        //     "created": "2022-05-04 15:42:32",
        //     "modified": "2022-05-04 15:42:32",
        //     "secure_record_storage": true,
        //     "application_id": 10454252,
        //     "extended_application_name": "demo.nanoxxi93.n2.voximplant.com"
        // }
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.addUser = async ({ account_id, account_name, application_id, user_name, user_display_name, parent_accounting = true, user_password, child_apikey = null }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['application_id'] = application_id;
        data['user_name'] = user_name;
        data['user_display_name'] = user_display_name;
        data['user_password'] = user_password;
        data['parent_accounting'] = `${parent_accounting}`;
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        const result = await voximplantRequest('AddUser', data);
        if (result.data.error) {
            console.log(result.data.error);
            return { error: result.data.error };
        }
        return result.data;
        // {
        //     "result": 1,
        //     "user_id": 3883041
        // }
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.getUsers = async ({ account_id, account_name, application_id }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['application_id'] = application_id;
        const result = await voximplantRequest('GetUsers', data);
        return result.data;
        // {
        //     "result": [
        //         {
        //             "fixed_balance": 0,
        //             "user_name": "demo1",
        //             "created": "2022-05-04 18:38:49",
        //             "frozen": false,
        //             "two_factor_auth_required": false,
        //             "acd_status": "OFFLINE",
        //             "user_active": true,
        //             "balance": 0,
        //             "user_id": 3883041,
        //             "live_balance": 0,
        //             "modified": "2022-05-04 18:38:49",
        //             "user_display_name": "demo1@demo.com",
        //             "parent_accounting": true
        //         }
        //     ],
        //     "total_count": 1,
        //     "count": 1
        // }
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.getUser = async ({ account_id, account_name, application_id, user_name }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['application_id'] = application_id;
        data['user_name'] = user_name;
        const result = await voximplantRequest('GetUsers', data);
        return result.data?.result?.[0];
        // {
        //     "fixed_balance": 0,
        //     "user_name": "demo1",
        //     "created": "2022-05-04 18:38:49",
        //     "frozen": false,
        //     "two_factor_auth_required": false,
        //     "acd_status": "OFFLINE",
        //     "user_active": true,
        //     "balance": 0,
        //     "user_id": 3883041,
        //     "live_balance": 0,
        //     "modified": "2022-05-04 18:38:49",
        //     "user_display_name": "demo1@demo.com",
        //     "parent_accounting": true
        // }
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.delUser = async ({ account_id, account_name, application_id, user_name }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['application_id'] = application_id;
        data['user_name'] = user_name;
        const result = await voximplantRequest('DelUser', data);
        if (result.data.error) {
            console.log(result.data.error);
            return { error: result.data.error };
        }
        return result.data;
        // {
        //     "result": 1
        // }
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.addQueue = async ({ account_id, account_name, application_id, acd_queue_name, child_apikey = null }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['application_id'] = application_id;
        data['acd_queue_name'] = acd_queue_name;
        data['auto_binding'] = `${false}`;
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        const result = await voximplantRequest('AddQueue', data);
        if (result.data.error) {
            console.log(result.data.error);
            return { error: result.data.error };
        }
        return result.data;
        // {
        //     "result": 1,
        //     "acd_queue_id": 1
        // }
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.getQueues = async ({ account_id, account_name, application_id }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        if (application_id)
            data['application_id'] = application_id;
        const result = await voximplantRequest('GetQueues', data);
        return result.data;
        // {
        //     "result": [
        //         {
        //             "auto_binding": true,
        //             "service_probability": 1,
        //             "acd_queue_name": "demo",
        //             "acd_queue_priority": 1,
        //             "created": "2022-05-04 18:41:40",
        //             "modified": "2022-05-04 18:41:40",
        //             "acd_queue_id": 1033,
        //             "application_id": 10454252
        //         }
        //     ],
        //     "total_count": 1,
        //     "count": 1
        // }
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.bindUserToQueue = async ({ account_id, account_name, application_id, user_id, acd_queue_name, bind = true }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['application_id'] = application_id;
        data['user_id'] = user_id;
        data['acd_queue_name'] = acd_queue_name;
        data['bind'] = `${bind}`;
        const result = await voximplantRequest('BindUserToQueue', data);
        if (result.data.error) {
            console.log(result.data.error);
            return undefined;
        }
        return result.data;
        // {
        //     "result": 1
        // }
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.getPhoneNumberCategories = async ({ account_id, account_name, country_code = '', sandbox = false }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['country_code'] = country_code;
        data['sandbox'] = `${sandbox}`;
        const result = await voximplantRequest('GetPhoneNumberCategories', data);
        return result.data;
        // {
        //     "result": [
        //         {
        //             "country_code": "XX",
        //             "can_list_phone_numbers": true,
        //             "phone_categories": [
        //                 {
        //                     "incoming_calls_resource_id": 13,
        //                     "localized_phone_category_name": "GEOGRAPHIC",
        //                     "incoming_calls_resource_name": "PSTN_IN_GEOGRAPHIC",
        //                     "phone_installation_price": 0,
        //                     "can_list_phone_numbers": true,
        //                     "phone_period": "0-1-0 0:0:0",
        //                     "phone_category_name": "GEOGRAPHIC",
        //                     "country_has_states": false,
        //                     "phone_price": 0.01
        //                 }
        //             ],
        //             "phone_prefix": "699"
        //         }
        //     ],
        //     "count": 1
        // }
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.getPhoneNumberCountryStates = async ({ account_id, account_name, country_code, phone_category_name }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['country_code'] = country_code;
        data['phone_category_name'] = phone_category_name;
        const result = await voximplantRequest('GetPhoneNumberCountryStates', data);
        return result.data;
        // {
        //     "result": [
        //         {
        //             "can_list_phone_numbers": false,
        //             "country_state_name": "Alaska",
        //             "country_state": "AK"
        //         }
        //     ],
        //     "count": 52
        // }
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.getPhoneNumberRegions = async ({ account_id, account_name, country_code, country_state = '', phone_category_name }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['country_code'] = country_code;
        if (country_state)
            data['country_state'] = country_state;
        data['phone_category_name'] = phone_category_name;
        const result = await voximplantRequest('GetPhoneNumberRegions', data);
        return result.data;
        // {
        //     "result": [
        //         {
        //             "localized_phone_category_name": "GEOGRAPHIC",
        //             "phone_installation_price": 0,
        //             "phone_region_name": "Gotham City",
        //             "phone_category_name": "GEOGRAPHIC",
        //             "multiple_numbers_price": [],
        //             "phone_region_code": "1",
        //             "is_need_regulation_address": false,
        //             "country_code": "XX",
        //             "phone_region_id": 51,
        //             "is_sms_supported": false,
        //             "phone_count": 110,
        //             "localized_phone_region_name": "Gotham City",
        //             "phone_period": "0-1-0 0:0:0",
        //             "phone_price": 0.01
        //         }
        //     ],
        //     "count": 3
        // }
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.attachPhoneNumber = async ({ account_id, account_name, country_code, country_state = null, phone_category_name, phone_region_id, phone_count, child_apikey = null }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['country_code'] = country_code;
        if (country_state)
            data['country_state'] = country_state;
        data['phone_category_name'] = phone_category_name;
        if (phone_region_id) {
            data['phone_region_id'] = phone_region_id;
        }
        data['phone_count'] = phone_count;
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        const result = await voximplantRequest('AttachPhoneNumber', data);
        return result.data;
        // {
        //     "result": 1,
        //     "phone_numbers": [
        //         {
        //             "subscription_id": 32488,
        //             "phone_number": "699116588",
        //             "verification_status": "VERIFIED",
        //             "phone_id": 1620500
        //         }
        //     ]
        // }
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.deactivatePhoneNumber = async ({ account_id, account_name, phone_id, child_apikey = null }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['phone_id'] = phone_id;
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        const result = await voximplantRequest('DeactivatePhoneNumber', data);
        return result.data;
        // {
        //     "result": 1
        // }
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.delQueue = async ({ account_id, account_name, acd_queue_id, child_apikey = null }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['acd_queue_id'] = acd_queue_id;
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        const result = await voximplantRequest('DelQueue', data);
        return result.data;
        // {
        //     "result": 1
        // }
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.getPhoneNumbers = async ({ account_id, account_name, application_id = null, sandbox = false }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['sandbox'] = `${sandbox}`;
        if (application_id)
            data['application_id'] = application_id;
        const result = await voximplantRequest('GetPhoneNumbers', data);
        return result.data;
        // {
        //     "result": [
        //         {
        //             "auto_charge": true,
        //             "can_be_used": true,
        //             "phone_tags": [],
        //             "category_name": "GEOGRAPHIC",
        //             "phone_country_code": "XX",
        //             "phone_region_name": "Gotham City",
        //             "phone_purchase_date": "2022-05-04 18:22:07",
        //             "verification_status": "NOT_REQUIRED",
        //             "issues": [],
        //             "deactivated": false,
        //             "subscription_id": 32488,
        //             "phone_region_id": 51,
        //             "account_id": 3955559,
        //             "is_sms_supported": false,
        //             "phone_next_renewal": "2022-06-04",
        //             "is_sms_enabled": false,
        //             "modified": "2022-05-04 18:22:08",
        //             "phone_number": "699116588",
        //             "phone_price": 0.01,
        //             "phone_id": 1620500
        //         }
        //     ],
        //     "total_count": 1,
        //     "count": 1
        // }
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.bindPhoneNumberToApplication = async ({ account_id, account_name, phone_id, application_id, rule_id, child_apikey = null }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['phone_id'] = phone_id;
        data['application_id'] = application_id;
        data['rule_id'] = rule_id;
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        const result = await voximplantRequest('BindPhoneNumberToApplication', data);
        return result.data;
        // {
        //     "result": 1
        // }
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}