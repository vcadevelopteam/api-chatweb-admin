const jwt = require("jsonwebtoken");

const { axiosObservable } = require("./helpers");

const fs = require("fs");
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
    catch (exception) {
        return undefined;
    }
}

const voximplantParentRequest = async (path, form, requestid = null) => {
    const token = await getJWT();
    return await axiosObservable({
        method: "post",
        url: `${VOXIMPLANT_APIRUL}${path}`,
        data: form,
        headers: Object.assign({}, form.getHeaders(), { 'Authorization': 'Bearer ' + token }),
        _requestid: requestid,
    });
}

exports.getChildrenAccounts = async ({ child_account_id, child_account_name, requestid }) => {
    try {
        const form = new FormData();
        if (child_account_id)
            form.append('child_account_id', child_account_id);
        else if (child_account_name)
            form.append('child_account_name', child_account_name);
        const result = await voximplantParentRequest('GetChildrenAccounts', form, requestid);
        return result.data;
    }
    catch (exception) {
        return undefined;
    }
}

exports.getAccountInvoices = async ({ account_id, account_name, account_apikey, requestid }) => {
    try {
        const form = new FormData();
        var result = null;

        if (account_id && account_apikey) {
            const data = {};
            setChildData({ data, account_id, account_name });
            if (account_apikey) {
                data['child_apikey'] = account_apikey;
            }
            result = await voximplantRequest('GetAccountInvoices', data, requestid);
        }
        else {
            form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
            form.append('api_key', VOXIMPLANT_APIKEY);
            result = await voximplantParentRequest('GetAccountInvoices', form, requestid);
        }

        if (result.data.error) {
            return { error: result.data.error };
        }
        return result.data;
    }
    catch (exception) {
        return undefined;
    }
}

exports.getChildrenAccount = async ({ child_account_id, child_account_name, requestid }) => {
    try {
        const form = new FormData();
        if (child_account_id)
            form.append('child_account_id', child_account_id);
        else if (child_account_name)
            form.append('child_account_name', child_account_name);
        const result = await voximplantParentRequest('GetChildrenAccounts', form, requestid);
        return result.data?.result?.[0];
    }
    catch (exception) {
        return undefined;
    }
}

exports.transferMoneyToUser = async ({ child_account_id, amount, currency, requestid }) => {
    try {
        const form = new FormData();
        form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
        form.append('api_key', VOXIMPLANT_APIKEY);
        form.append('child_account_id', child_account_id);
        form.append('amount', amount);
        form.append('currency', currency);
        const result = await voximplantParentRequest('TransferMoneyToChildAccount', form, requestid);
        if (result.data.error) {
            return { error: result.data.error };
        }
        return result.data;
    }
    catch (exception) {
        return undefined;
    }
}

exports.getAccountInfo = async ({ account_id, account_name, account_apikey, requestid }) => {
    try {
        const form = new FormData();
        var result = null;

        if (account_id && account_apikey) {
            const data = {};
            setChildData({ data, account_id, account_name });
            if (account_apikey) {
                data['child_apikey'] = account_apikey;
            }
            result = await voximplantRequest('GetAccountInfo', data, requestid);
        }
        else {
            form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
            form.append('api_key', VOXIMPLANT_APIKEY);
            result = await voximplantParentRequest('GetAccountInfo', form, requestid);
        }

        if (result.data.error) {
            return { error: result.data.error };
        }
        return result.data;
    }
    catch (exception) {
        return undefined;
    }
}

exports.addAccount = async ({ account_name, account_email, account_password, requestid }) => {
    try {
        const form = new FormData();
        form.append('parent_account_id', VOXIMPLANT_ACCOUNT_ID);
        form.append('parent_account_api_key', VOXIMPLANT_APIKEY);
        form.append('account_name', account_name);
        form.append('account_email', account_email);
        form.append('account_password', account_password);
        form.append('active', `${true}`);
        const result = await voximplantParentRequest('AddAccount', form, requestid);
        if (result.data.error) {
            return { error: result.data.error };
        }
        return result.data;
    }
    catch (exception) {
        return undefined;
    }
}

exports.setChildAccountInfo = async ({ child_account_id, child_account_name, active, requestid }) => {
    try {
        const form = new FormData();
        if (child_account_id)
            form.append('child_account_id', child_account_id);
        else if (child_account_name)
            form.append('child_account_name', child_account_name);
        form.append('active', `${active}`);
        const result = await voximplantParentRequest('SetChildAccountInfo', form, requestid);
        if (result.data.error) {
            return { error: result.data.error };
        }
        return result.data;
    }
    catch (exception) {
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

const voximplantRequest = async (path, data, requestid = null) => {
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
        
        return await axiosObservable({
            method: "post",
            url: `${VOXIMPLANT_APIRUL}${path}`,
            data: form,
            headers: Object.assign({}, form.getHeaders()),
            _requestid: requestid,
        });
    }
    else {
        return await voximplantParentRequest(path, form, requestid);
    }
}

exports.addApplication = async ({ account_id, account_name, application_name, child_apikey = null, requestid = null }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['application_name'] = application_name;
        data['secure_record_storage'] = `${true}`;
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        const result = await voximplantRequest('AddApplication', data, requestid);
        if (result.data.error) {
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
    catch (exception) {
        return undefined;
    }
}

exports.addScenario = async ({ account_id, account_name, scenario_name, scenario_script, child_apikey = null, requestid = null }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['scenario_name'] = scenario_name;
        data['scenario_script'] = scenario_script;
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        const result = await voximplantRequest('AddScenario', data, requestid);
        if (result.data.error) {
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
    catch (exception) {
        return undefined;
    }
}

exports.setScenarioInfo = async ({ account_id, account_name, scenario_id, scenario_script, child_apikey = null, requestid = null }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['scenario_id'] = scenario_id;
        data['scenario_script'] = scenario_script;
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        const result = await voximplantRequest('SetScenarioInfo', data, requestid);
        if (result.data.error) {
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
    catch (exception) {
        return undefined;
    }
}

exports.addRule = async ({ account_id, account_name, application_id, rule_name, rule_pattern, scenario_id, child_apikey = null, requestid = null }) => {
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
        const result = await voximplantRequest('AddRule', data, requestid);
        if (result.data.error) {
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
    catch (exception) {
        return undefined;
    }
}

exports.getApplications = async ({ account_id, account_name, application_name, requestid }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        if (application_name)
            data['application_name'] = application_name;
        const result = await voximplantRequest('GetApplications', data, requestid);
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
    catch (exception) {
        return undefined;
    }
}

exports.getApplication = async ({ account_id, account_name, application_name, requestid }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['application_name'] = application_name;
        const result = await voximplantRequest('GetApplications', data, requestid);
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
    catch (exception) {
        return undefined;
    }
}

exports.getCallHistory = async ({ account_id, account_name, from_date, to_date, application_id, count, offset, child_apikey = null, requestid = null }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        data['from_date'] = from_date;
        data['to_date'] = to_date;
        data['application_id'] = application_id;
        data['count'] = count;
        data['offset'] = offset;
        data['timezone'] = 'UTC/GMT';
        data['with_calls'] = 'true';
        data['with_records'] = 'true';
        data['with_other_resources'] = 'true';

        const result = await voximplantRequest('GetCallHistory', data, requestid);
        if (result.data.error) {
            return { error: result.data.error };
        }
        return result.data;
        // {
        //     "result": 1,
        //     "user_id": 3883041
        // }
    }
    catch (exception) {
        return undefined;
    }
}

exports.getTransactionHistory = async ({ account_id, account_name, account_apikey, from_date, to_date, count, offset, child_account_id, requestid }) => {
    try {
        const form = new FormData();
        var result = null;

        if (account_id && account_apikey) {
            const data = {};
            setChildData({ data, account_id, account_name });
            if (account_apikey) {
                data['child_apikey'] = account_apikey;
            }
            data['from_date'] = from_date;
            data['to_date'] = to_date;
            data['timezone'] = 'auto';
            data['count'] = count;
            data['offset'] = offset;
            data['desc_order'] = 'true';
            data['transaction_type'] = 'resource_charge;money_distribution;subscription_charge;subscription_installation_charge;card_periodic_payment;card_overrun_payment;card_payment;rub_card_periodic_payment;rub_card_overrun_payment;rub_card_payment;robokassa_payment;gift;promo;adjustment;wire_transfer;us_wire_transfer;refund;discount;mgp_charge;mgp_startup;mgp_business;mgp_big_business;mgp_enterprise;mgp_large_enterprise;techsupport_charge;tax_charge;monthly_fee_charge;grace_credit_payment;grace_credit_provision;mau_charge;mau_overrun;im_charge;im_overrun;fmc_charge;sip_registration_charge;development_fee;money_transfer_to_child;money_transfer_to_parent;money_acceptance_from_child;money_acceptance_from_parent;phone_number_installation;phone_number_charge;toll_free_phone_number_installation;toll_free_phone_number_charge;services;user_money_transfer;paypal_payment;paypal_overrun_payment;paypal_periodic_payment';

            result = await voximplantRequest('GetTransactionHistory', data, requestid);
        }
        else {
            form.append('account_id', VOXIMPLANT_ACCOUNT_ID);
            form.append('api_key', VOXIMPLANT_APIKEY);
            form.append('from_date', from_date);
            form.append('to_date', to_date);
            form.append('timezone', 'auto');
            form.append('count', count);
            form.append('offset', offset);
            form.append('desc_order', 'true');
            form.append('transaction_type', 'resource_charge;money_distribution;subscription_charge;subscription_installation_charge;card_periodic_payment;card_overrun_payment;card_payment;rub_card_periodic_payment;rub_card_overrun_payment;rub_card_payment;robokassa_payment;gift;promo;adjustment;wire_transfer;us_wire_transfer;refund;discount;mgp_charge;mgp_startup;mgp_business;mgp_big_business;mgp_enterprise;mgp_large_enterprise;techsupport_charge;tax_charge;monthly_fee_charge;grace_credit_payment;grace_credit_provision;mau_charge;mau_overrun;im_charge;im_overrun;fmc_charge;sip_registration_charge;development_fee;money_transfer_to_child;money_transfer_to_parent;money_acceptance_from_child;money_acceptance_from_parent;phone_number_installation;phone_number_charge;toll_free_phone_number_installation;toll_free_phone_number_charge;services;user_money_transfer;paypal_payment;paypal_overrun_payment;paypal_periodic_payment');
            if (child_account_id) {
                form.append('child_account_id', child_account_id);
                form.append('children_transactions_only', 'true');
            }

            result = await voximplantParentRequest('GetTransactionHistory', form, requestid);
        }

        if (result.data.error) {
            return { error: result.data.error };
        }
        return result.data;
    }
    catch (exception) {
        return undefined;
    }
}

exports.getCallRecord = async ({ account_id, account_name, call_session_history_id, child_apikey = null, requestid = null }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        data['call_session_history_id'] = call_session_history_id;
        data['with_calls'] = 'true';
        data['with_records'] = 'true';
        data['with_other_resources'] = 'true';

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        data['from_date'] = '2000-01-01 00:00:00';
        data['to_date'] = `${tomorrow.getFullYear()}-${tomorrow.getMonth() + 1}-${tomorrow.getDate()} 00:00:00`;
        const result = await voximplantRequest('GetCallHistory', data, requestid);
        if (result.data.error) {
            return { error: result.data.error };
        }
        return result.data;
    }
    catch (exception) {
        return undefined;
    }
}

exports.addUser = async ({ account_id, account_name, application_id, user_name, user_display_name, parent_accounting = true, user_password, child_apikey = null, requestid = null }) => {
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
        const result = await voximplantRequest('AddUser', data, requestid);
        if (result.data.error) {
            return { error: result.data.error };
        }
        return result.data;
        // {
        //     "result": 1,
        //     "user_id": 3883041
        // }
    }
    catch (exception) {
        return undefined;
    }
}

exports.getUsers = async ({ account_id, account_name, application_id, requestid }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['application_id'] = application_id;
        const result = await voximplantRequest('GetUsers', data, requestid);
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
    catch (exception) {
        return undefined;
    }
}

exports.getUser = async ({ account_id, account_name, application_id, user_name, requestid }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['application_id'] = application_id;
        data['user_name'] = user_name;
        const result = await voximplantRequest('GetUsers', data, requestid);
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
    catch (exception) {
        return undefined;
    }
}

exports.delUser = async ({ account_id, account_name, application_id, user_name, requestid }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['application_id'] = application_id;
        data['user_name'] = user_name;
        const result = await voximplantRequest('DelUser', data, requestid);
        if (result.data.error) {
            return { error: result.data.error };
        }
        return result.data;
        // {
        //     "result": 1
        // }
    }
    catch (exception) {
        return undefined;
    }
}

exports.addQueue = async ({ account_id, account_name, application_id, acd_queue_name, child_apikey = null, requestid = null }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['application_id'] = application_id;
        data['acd_queue_name'] = acd_queue_name;
        data['auto_binding'] = `${false}`;
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        const result = await voximplantRequest('AddQueue', data, requestid);
        if (result.data.error) {
            return { error: result.data.error };
        }
        return result.data;
        // {
        //     "result": 1,
        //     "acd_queue_id": 1
        // }
    }
    catch (exception) {
        return undefined;
    }
}

exports.getQueues = async ({ account_id, account_name, application_id, requestid }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        if (application_id)
            data['application_id'] = application_id;
        const result = await voximplantRequest('GetQueues', data, requestid);
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
    catch (exception) {
        return undefined;
    }
}

exports.bindUserToQueue = async ({ account_id, account_name, application_id, user_id, acd_queue_name, bind = true, requestid = null }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['application_id'] = application_id;
        data['user_id'] = user_id;
        data['acd_queue_name'] = acd_queue_name;
        data['bind'] = `${bind}`;
        const result = await voximplantRequest('BindUserToQueue', data, requestid);
        if (result.data.error) {
            return undefined;
        }
        return result.data;
        // {
        //     "result": 1
        // }
    }
    catch (exception) {
        return undefined;
    }
}

exports.getPhoneNumberCategories = async ({ account_id, account_name, country_code = '', sandbox = false, requestid = null }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['country_code'] = country_code;
        data['sandbox'] = `${sandbox}`;
        const result = await voximplantRequest('GetPhoneNumberCategories', data, requestid);
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
    catch (exception) {
        return undefined;
    }
}

exports.getPhoneNumberCountryStates = async ({ account_id, account_name, country_code, phone_category_name, requestid }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['country_code'] = country_code;
        data['phone_category_name'] = phone_category_name;
        const result = await voximplantRequest('GetPhoneNumberCountryStates', data, requestid);
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
    catch (exception) {
        return undefined;
    }
}

exports.getPhoneNumberRegions = async ({ account_id, account_name, country_code, country_state = '', phone_category_name, requestid }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['country_code'] = country_code;
        if (country_state)
            data['country_state'] = country_state;
        data['phone_category_name'] = phone_category_name;
        const result = await voximplantRequest('GetPhoneNumberRegions', data, requestid);
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
    catch (exception) {
        return undefined;
    }
}

exports.attachPhoneNumber = async ({ account_id, account_name, country_code, country_state = null, phone_category_name, phone_region_id, phone_count, child_apikey = null, requestid = null }) => {
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
        const result = await voximplantRequest('AttachPhoneNumber', data, requestid);
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
    catch (exception) {
        return undefined;
    }
}

exports.deactivatePhoneNumber = async ({ account_id, account_name, phone_id, child_apikey = null, requestid = null }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['phone_id'] = phone_id;
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        const result = await voximplantRequest('DeactivatePhoneNumber', data, requestid);
        return result.data;
        // {
        //     "result": 1
        // }
    }
    catch (exception) {
        return undefined;
    }
}

exports.delQueue = async ({ account_id, account_name, acd_queue_id, child_apikey = null, requestid = null }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['acd_queue_id'] = acd_queue_id;
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        const result = await voximplantRequest('DelQueue', data, requestid);
        return result.data;
        // {
        //     "result": 1
        // }
    }
    catch (exception) {
        return undefined;
    }
}

exports.getPhoneNumbers = async ({ account_id, account_name, application_id = null, sandbox = false, requestid = null }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['sandbox'] = `${sandbox}`;
        if (application_id)
            data['application_id'] = application_id;
        const result = await voximplantRequest('GetPhoneNumbers', data, requestid);
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
    catch (exception) {
        return undefined;
    }
}

exports.getResourcePrice = async ({ account_id, account_name, resource_type = null, resource_param = null, price_group_name = null, requestid = null }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        if (resource_type)
            data['resource_type'] = resource_type;
        if (resource_param)
            data['resource_param'] = resource_param;
        if (price_group_name)
            data['price_group_name'] = price_group_name;
        const result = await voximplantRequest('GetResourcePrice', data, requestid);
        return result.data;
    }
    catch (exception) {
        return undefined;
    }
}

exports.bindPhoneNumberToApplication = async ({ account_id, account_name, phone_id, application_id, rule_id, child_apikey = null, requestid = null }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['phone_id'] = phone_id;
        data['application_id'] = application_id;
        data['rule_id'] = rule_id;
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        const result = await voximplantRequest('BindPhoneNumberToApplication', data, requestid);
        return result.data;
        // {
        //     "result": 1
        // }
    }
    catch (exception) {
        return undefined;
    }
}

const VOXIMPLANT_COS_HOST = process.env.VOXIMPLANT_COS_HOST;
const VOXIMPLANT_COS_ACCESS_KEY_ID = process.env.VOXIMPLANT_COS_ACCESS_KEY_ID;
const VOXIMPLANT_COS_SECRET_ACCESS_KEY = process.env.VOXIMPLANT_COS_SECRET_ACCESS_KEY;
const VOXIMPLANT_COS_BUCKET = process.env.VOXIMPLANT_COS_BUCKET;

exports.addCustomRecordStorage = async ({ account_id, account_name, child_apikey, application_id, requestid }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['host'] = VOXIMPLANT_COS_HOST;
        data['access_key_id'] = VOXIMPLANT_COS_ACCESS_KEY_ID;
        data['secret_access_key'] = VOXIMPLANT_COS_SECRET_ACCESS_KEY;
        data['bucket'] = VOXIMPLANT_COS_BUCKET;
        if (application_id) {
            data['attached_application_id'] = application_id;
        }
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        const result = await voximplantRequest('AddCustomRecordStorage', data, requestid);
        return result.data;
        // {
        //     "result": 1
        // }
    }
    catch (exception) {
        return undefined;
    }
}

exports.getCustomRecordStorages = async ({ account_id, account_name, child_apikey, requestid }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['with_applications_attached'] = `${true}`
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        const result = await voximplantRequest('GetCustomRecordStorages', data, requestid);
        return result.data;
        // {
        //     "result": [
        //         {
        //             "access_key_id": "3a7c56b66cb645e796fab8fc299b6080",
        //             "bucket": "harima-voximplant",
        //             "custom_record_storage_id": 20,
        //             "attached_application_id": [
        //                 10456002,
        //                 10451952
        //             ],
        //             "host": "https://s3.us-south.cloud-object-storage.appdomain.cloud",
        //             "last_test_status": "COMPLETED",
        //             "bucket_is_domain": true
        //         }
        //     ]
        // }
    }
    catch (exception) {
        return undefined;
    }
}

exports.setCustomRecordStorageInfo = async ({ account_id, account_name, child_apikey, custom_record_storage_id, application_id = "none", requestid = null }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['custom_record_storage_id'] = custom_record_storage_id
        if (application_id) {
            data['attached_application_id'] = application_id
        }
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        const result = await voximplantRequest('SetCustomRecordStorageInfo', data, requestid);
        return result.data;
        // {
        //     "result": 1
        // }
    }
    catch (exception) {
        return undefined;
    }
}

exports.createCallList = async ({ account_id, account_name, child_apikey, rule_id, name = new Date().toISOString(), file_content, queue_id }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['rule_id'] = rule_id
        data['priority'] = 0
        data['max_simultaneous'] = 10
        data['num_attempts'] = 1
        data['name'] = name
        data['file_content'] = file_content
        if (queue_id) {
            data['queue_id'] = queue_id
        }
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        const result = await voximplantRequest('CreateCallList', data);
        return result.data;
        // {
        //     "result": true,
        //     "list_id": 250933,
        //     "count": 1
        // }
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.createTriggerCall = async ({ account_id, account_name, script_custom_data, child_apikey, rule_id, name = new Date().toISOString() }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['rule_id'] = rule_id
        data['script_custom_data'] = script_custom_data
        
        data['name'] = name
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        console.log("data", data)
        const result = await voximplantRequest('StartScenarios', data);
        return result.data;
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.createManualCallList = async ({ account_id, account_name, child_apikey, rule_id, name = new Date().toISOString(), file_content, queue_id }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['rule_id'] = rule_id
        data['priority'] = 0
        data['max_simultaneous'] = 10
        data['num_attempts'] = 1
        data['name'] = name
        data['file_content'] = file_content
        if (queue_id) {
            data['queue_id'] = queue_id
        }
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        const result = await voximplantRequest('CreateManualCallList', data);
        return result.data;
        // {
        //     "result": true,
        //     "list_id": 250933,
        //     "count": 1
        // }
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.startNextCallTask = async ({ account_id, account_name, child_apikey, list_id, custom_params }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['list_id'] = list_id
        if (custom_params) {
            data['custom_params'] = custom_params
        }
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        const result = await voximplantRequest('StartNextCallTask', data);
        return result.data;
        // {
        //     "result": 1,
        //     "list_id": 250940
        // }
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}

exports.getCallLists = async ({ account_id, account_name, child_apikey, list_id }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['list_id'] = list_id
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        const result = await voximplantRequest('GetCallLists', data);
        return result.data;
        // {
        //     "result": [
        //         {
        //             "rule_id": 763863,
        //             "num_attempts": 1,
        //             "type_list": "MANUAL",
        //             "list_id": 250968,
        //             "user_id": 3955559,
        //             "max_simultaneous": 10,
        //             "interval_seconds": 0,
        //             "dt_submit": "2022-06-01 18:57:10",
        //             "list_name": "2022-06-01T18:57:11.140Z",
        //             "priority": 0,
        //             "dt_complete": "2022-06-01 19:00:46",
        //             "status": "Completed"
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

exports.stopCallListProcessing = async ({ account_id, account_name, child_apikey, list_id }) => {
    try {
        const data = {};
        setChildData({ data, account_id, account_name });
        data['list_id'] = list_id
        if (child_apikey) {
            data['child_apikey'] = child_apikey;
        }
        const result = await voximplantRequest('StopCallListProcessing', data);
        return result.data;
        // {
        //     "result": true,
        //     "msg": "Tasks canceled."
        // }
    }
    catch (err) {
        console.log(err);
        return undefined;
    }
}