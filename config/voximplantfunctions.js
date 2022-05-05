const fs = require("fs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const FormData = require("form-data");
require('dotenv').config();

const VOXIMPLANT_CREDENTIALS = process.env.VOXIMPLANT_CREDENTIALS
const VOXIMPLANT_ACCOUNT_ID = process.env.VOXIMPLANT_ACCOUNT_ID
const VOXIMPLANT_APIRUL = process.env.VOXIMPLANT_APIRUL
const VOXIMPLANT_APIKEY = process.env.VOXIMPLANT_APIKEY

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

const voximplantRequest = async (path, form) => {
    const token = await getJWT();
    return await axios({
        method: "post",
        url: `${VOXIMPLANT_APIRUL}${path}`,
        data: form,
        headers: Object.assign({}, form.getHeaders(), { 'Authorization': 'Bearer ' + token }),
    });
}

exports.getChildrenAccounts = async () => {
    try {
        const form = new FormData();
        form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
        const result = await voximplantRequest('GetChildrenAccounts', form);
        return result.data;
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.addAccount = async ({account_name, account_email, account_password}) => {
    try {
        const form = new FormData();
        form.append('parent_account_id', VOXIMPLANT_ACCOUNT_ID);
        form.append('parent_account_api_key', VOXIMPLANT_APIKEY);
        form.append('account_name', account_name);
        form.append('account_email', account_email);
        form.append('account_password', account_password);
        const result = await voximplantRequest('AddAccount', form);
        if (result.data.error) {
            console.log(result.data.error);
            return undefined;
        }
        return result.data;
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
        const result = await voximplantRequest('GetApplications', form);
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

exports.getUsers = async ({application_id}) => {
    try {
        const form = new FormData();
        form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
        form.append('application_id', application_id);
        const result = await voximplantRequest('GetUsers', form);
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

exports.getUser = async ({application_id, user_name}) => {
    try {
        const form = new FormData();
        form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
        form.append('application_id', application_id);
        form.append('user_name', user_name);
        const result = await voximplantRequest('GetUsers', form);
        return result.data?.result?.[0];
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.addUser = async ({application_id, user_name, user_display_name, user_password}) => {
    try {
        const form = new FormData();
        form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
        form.append('application_id', application_id);
        form.append('user_name', user_name);
        form.append('user_display_name', user_display_name);
        form.append('user_password', user_password);
        const result = await voximplantRequest('AddUser', form);
        if (result.data.error) {
            console.log(result.data.error);
            return {error: result.data.error};
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

exports.delUser = async ({application_id, user_name}) => {
    try {
        const form = new FormData();
        form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
        form.append('application_id', application_id);
        form.append('user_name', user_name);
        const result = await voximplantRequest('DelUser', form);
        if (result.data.error) {
            console.log(result.data.error);
            return {error: result.data.error};
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

exports.addQueue = async ({application_id, acd_queue_name}) => {
    try {
        const form = new FormData();
        form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
        form.append('application_id', application_id);
        form.append('acd_queue_name', acd_queue_name);
        form.append('auto_binding', `${false}`);
        const result = await voximplantRequest('AddQueue', form);
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

exports.getQueues = async ({application_id}) => {
    try {
        const form = new FormData();
        form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
        if (application_id)
            form.append('application_id', application_id);
        const result = await voximplantRequest('GetQueues', form);
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

exports.bindUserToQueue = async ({application_id, user_id, acd_queue_name, bind = true}) => {
    try {
        const form = new FormData();
        form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
        form.append('application_id', application_id);
        form.append('user_id', user_id);
        form.append('acd_queue_name', acd_queue_name);
        form.append('bind', `${bind}`);
        const result = await voximplantRequest('BindUserToQueue', form);
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

exports.getPhoneNumberCategories = async ({country_code = '', sandbox = false}) => {
    try {
        const form = new FormData();
        form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
        form.append('country_code', country_code);
        form.append('sandbox', `${sandbox}`);
        const result = await voximplantRequest('GetPhoneNumberCategories', form);
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

exports.getPhoneNumberCountryStates = async ({country_code, phone_category_name}) => {
    try {
        const form = new FormData();
        form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
        form.append('country_code', country_code);
        form.append('phone_category_name', phone_category_name);
        const result = await voximplantRequest('GetPhoneNumberCountryStates', form);
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

exports.getPhoneNumberRegions = async ({country_code, country_state = '', phone_category_name}) => {
    try {
        const form = new FormData();
        form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
        form.append('country_code', country_code);
        if (country_state)
            form.append('country_state', country_state);
        form.append('phone_category_name', phone_category_name);
        const result = await voximplantRequest('GetPhoneNumberRegions', form);
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

exports.attachPhoneNumber = async ({country_code, country_state = null, phone_category_name, phone_region_id, phone_count}) => {
    try {
        const form = new FormData();
        form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
        form.append('country_code', country_code);
        if (country_state)
            form.append('country_state', country_state);
        form.append('phone_category_name', phone_category_name);
        form.append('phone_region_id', phone_region_id);
        form.append('phone_count', phone_count);
        const result = await voximplantRequest('AttachPhoneNumber', form);
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

exports.getPhoneNumbers = async ({application_id = null, sandbox = false}) => {
    try {
        const form = new FormData();
        form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
        form.append('sandbox', `${sandbox}`);
        if (application_id)
            form.append('application_id', application_id);
        const result = await voximplantRequest('GetPhoneNumbers', form);
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

exports.bindPhoneNumberToApplication = async ({application_id, phone_number}) => {
    try {
        const form = new FormData();
        form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
        form.append('application_id', application_id);
        form.append('phone_number', phone_number);
        const result = await voximplantRequest('BindPhoneNumberToApplication', form);
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