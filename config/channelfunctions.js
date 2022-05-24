const triggerfunctions = require('../config/triggerfunctions');
const voximplant = require("../config/voximplantfunctions");

const voximplantAccountEnvironment = process.env.VOXIMPLANT_ENVIRONMENT;
const voximplantPassword = process.env.VOXIMPLANT_PASSWORD;
const voximplantRulePattern = process.env.VOXIMPLANT_RULEPATTERN;

const voximplantManageOrg = async (corpid, orgid, operation, voximplantuser = null, voximplantmail = null, voximplantpassword = null, voximplantaccountid = null, voximplantapikey = null, voximplantapplicationid = null, voximplantruleid = null, voximplantscenarioid = null, voximplantuserid = null, voximplantapplicationname = null) => {
    const queryMethod = "UFN_ORG_VOXIMPLANT_UPD";
    const queryParameters = {
        corpid: corpid,
        orgid: orgid,
        operation: operation,
        voximplantuser: voximplantuser,
        voximplantmail: voximplantmail,
        voximplantpassword: voximplantpassword,
        voximplantaccountid: voximplantaccountid,
        voximplantapikey: voximplantapikey,
        voximplantapplicationid: voximplantapplicationid,
        voximplantruleid: voximplantruleid,
        voximplantscenarioid: voximplantscenarioid,
        voximplantuserid: voximplantuserid,
        voximplantapplicationname: voximplantapplicationname,
    }

    const queryResult = await triggerfunctions.executesimpletransaction(queryMethod, queryParameters);

    if (queryResult instanceof Array) {
        if (queryResult.length > 0) {
            return queryResult[0];
        }
    }

    return null;
}

const getAppSetting = async () => {
    const queryResult = await triggerfunctions.executesimpletransaction("UFN_APPSETTING_VOXIMPLANT_SEL");

    if (queryResult instanceof Array) {
        if (queryResult.length > 0) {
            return queryResult[0];
        }
    }

    return null
}

exports.voximplantHandleEnvironment = async (corpid, orgid) => {
    var voximplantEnvironment = {
        accountid: null,
        apikey: null,
        applicationid: null,
        applicationname: null,
        userid: null,
    };

    try {
        const orgData = await voximplantManageOrg(corpid, orgid, 'SELECT');

        if (orgData) {
            var createApplication = false;
            var createUser = false;

            if (!orgData.voximplantuser && !orgData.voximplantmail && !orgData.voximplantpassword && !orgData.voximplantaccountid && !orgData.voximplantapikey) {
                createApplication = true;

                var childUserBody = {
                    account_name: `${voximplantAccountEnvironment}aco-${orgid}-${corpid}`,
                    account_email: `${voximplantAccountEnvironment}aco-${orgid}-${corpid}@vcaperu.com`,
                    account_password: voximplantPassword,
                    active: true,
                };

                let childUserResult = await voximplant.addAccount(childUserBody);

                if (childUserResult) {
                    if (childUserResult.result) {
                        await voximplantManageOrg(corpid, orgid, 'ACCOUNT', childUserBody.account_name, childUserBody.account_email, childUserBody.account_password, childUserResult.account_id, childUserResult.api_key);

                        voximplantEnvironment.accountid = childUserResult.account_id;
                        voximplantEnvironment.apikey = childUserResult.api_key;
                    }
                }
            }
            else {
                voximplantEnvironment.accountid = orgData.voximplantaccountid;
                voximplantEnvironment.apikey = orgData.voximplantapikey;

                if (!orgData.voximplantapplicationid) {
                    createApplication = true;
                }
                else {
                    voximplantEnvironment.applicationid = orgData.voximplantapplicationid;
                    voximplantEnvironment.applicationname = orgData.voximplantapplicationname;
                }
            }

            if (createApplication) {
                var applicationBody = {
                    account_id: voximplantEnvironment.accountid,
                    application_name: `${voximplantAccountEnvironment}apl-${orgid}-${corpid}`,
                    child_apikey: voximplantEnvironment.apikey,
                };

                let applicationResult = await voximplant.addApplication(applicationBody);

                if (applicationResult) {
                    if (applicationResult.result) {
                        await voximplantManageOrg(corpid, orgid, 'APPLICATION', null, null, null, null, null, applicationResult.application_id, null, null, null, applicationResult.application_name);

                        voximplantEnvironment.applicationid = applicationResult.application_id;
                        voximplantEnvironment.applicationname = applicationResult.application_name;

                        await voximplant.addCustomRecordStorage({
                            account_id: voximplantEnvironment.accountid,
                            child_apikey: voximplantEnvironment.apikey,
                            application_id: applicationResult.application_id
                        });
                    }
                }
            }

            if (!orgData.voximplantuserid) {
                createUser = true;
            }
            else {
                voximplantEnvironment.userid = orgData.voximplantuserid;
            }

            if (createUser) {
                var userBody = {
                    account_id: voximplantEnvironment.accountid,
                    user_name: `${voximplantAccountEnvironment}use-${orgid}-${corpid}`,
                    user_display_name: `${voximplantAccountEnvironment}use-${orgid}-${corpid}`,
                    user_password: voximplantPassword,
                    application_id: voximplantEnvironment.applicationid,
                    parent_accounting: 'true',
                    user_active: 'true',
                    child_apikey: voximplantEnvironment.apikey,
                };

                let userResult = await voximplant.addUser(userBody);

                if (userResult) {
                    if (userResult.result) {
                        await voximplantManageOrg(corpid, orgid, 'USER', null, null, null, null, null, null, null, null, userResult.user_id);

                        voximplantEnvironment.userid = userResult.user_id;
                    }
                }
            }
        }
    }
    catch (exception) {
        voximplantEnvironment.accountid = null;
        voximplantEnvironment.apikey = null;
        voximplantEnvironment.applicationid = null;
        voximplantEnvironment.applicationname = null;
        voximplantEnvironment.userid = null;
    }

    return voximplantEnvironment;
}

exports.voximplantHandleScenario = async (corpid, orgid, accountid, apikey, applicationid) => {
    var voximplantScenario = {
        ruleid: null,
        scenarioid: null,
    };

    try {
        const orgData = await voximplantManageOrg(corpid, orgid, 'SELECT');

        if (orgData) {
            var createRule = false;

            if (!orgData.voximplantscenarioid) {
                const appsetting = await getAppSetting();

                if (appsetting) {
                    createRule = true;

                    var scenarioBody = {
                        account_id: accountid,
                        scenario_name: `${voximplantAccountEnvironment}sce-${orgid}-${corpid}`,
                        scenario_script: appsetting.scenarioscript,
                        child_apikey: apikey,
                    };

                    let scenarioResult = await voximplant.addScenario(scenarioBody);

                    if (scenarioResult) {
                        if (scenarioResult.result) {
                            await voximplantManageOrg(corpid, orgid, 'SCENARIO', null, null, null, null, null, null, null, scenarioResult.scenario_id);

                            voximplantScenario.scenarioid = scenarioResult.scenario_id;
                        }
                    }
                }
            }
            else {
                voximplantScenario.scenarioid = orgData.voximplantscenarioid;

                if (!orgData.voximplantruleid) {
                    createRule = true;
                }
                else {
                    voximplantScenario.ruleid = orgData.voximplantruleid;
                }
            }

            if (createRule) {
                var ruleBody = {
                    account_id: accountid,
                    application_id: applicationid,
                    rule_name: `${voximplantAccountEnvironment}rul-${orgid}-${corpid}`,
                    rule_pattern: voximplantRulePattern,
                    scenario_id: voximplantScenario.scenarioid,
                    child_apikey: apikey,
                };

                let ruleResult = await voximplant.addRule(ruleBody);

                if (ruleResult) {
                    if (ruleResult.result) {
                        await voximplantManageOrg(corpid, orgid, 'RULE', null, null, null, null, null, null, ruleResult.rule_id);

                        voximplantScenario.ruleid = ruleResult.rule_id;
                    }
                }
            }
        }
    }
    catch (exception) {
        voximplantScenario.ruleid = null;
        voximplantScenario.scenarioid = null;
    }

    return voximplantScenario;
}

exports.voximplantHandlePhoneNumber = async (accountid, apikey, applicationid, ruleid, country, category, state, region, cost) => {
    var voximplantPhoneNumber = {
        phoneid: null,
        phonenumber: null,
        queueid: null,
    };

    try {
        var hasMoney = false;
        var transferBody = {};

        if (cost) {
            transferBody = {
                child_account_id: accountid,
                amount: cost,
                currency: "USD",
            }

            let transferResult = await voximplant.transferMoneyToUser(transferBody);

            if (transferResult.result) {
                hasMoney = true;
            }
        }

        if (hasMoney) {
            var phoneNumberBody = {
                account_id: accountid,
                phone_count: '1',
                country_code: country,
                phone_category_name: category,
                country_state: state,
                phone_region_id: region,
                child_apikey: apikey,
            };

            let phoneNumberResult = await voximplant.attachPhoneNumber(phoneNumberBody);

            if (phoneNumberResult) {
                if (phoneNumberResult.result) {
                    if (phoneNumberResult.phone_numbers[0]) {
                        voximplantPhoneNumber.phoneid = phoneNumberResult.phone_numbers[0].phone_id;
                        voximplantPhoneNumber.phonenumber = phoneNumberResult.phone_numbers[0].phone_number;
                    }
                }
            }

            if (voximplantPhoneNumber.phoneid && voximplantPhoneNumber.phonenumber) {
                var queueBody = {
                    account_id: accountid,
                    application_id: applicationid,
                    acd_queue_name: `${voximplantPhoneNumber.phonenumber}.laraigo`,
                    child_apikey: apikey,
                };

                let queueResult = await voximplant.addQueue(queueBody);

                if (queueResult) {
                    if (queueResult.result) {
                        voximplantPhoneNumber.queueid = queueResult.acd_queue_id;
                    }
                }

                var bindBody = {
                    account_id: accountid,
                    phone_id: voximplantPhoneNumber.phoneid,
                    application_id: applicationid,
                    rule_id: ruleid,
                    child_apikey: apikey,
                };

                let bindResult = await voximplant.bindPhoneNumberToApplication(bindBody);

                console.log(JSON.stringify(bindResult));

                transferBody = {
                    child_account_id: accountid,
                    amount: '1',
                    currency: "USD",
                }
    
                let transferResult = await voximplant.transferMoneyToUser(transferBody);

                console.log(JSON.stringify(transferResult));
            }
            else {
                transferBody = {
                    child_account_id: accountid,
                    amount: cost * -1,
                    currency: "USD",
                }

                let transferResult = await voximplant.transferMoneyToUser(transferBody);

                if (transferResult.result) {
                    console.log(JSON.stringify(transferResult));
                }
            }
        }
    }
    catch (exception) {
        voximplantPhoneNumber.phoneid = null;
        voximplantPhoneNumber.phonenumber = null;
    }

    return voximplantPhoneNumber;
}

exports.voximplantDeletePhoneNumber = async (corpid, orgid, phoneid, queueid) => {
    var voximplantPhoneNumber = {
        phoneid: null,
        queueid: null,
    };

    try {
        const orgData = await voximplantManageOrg(corpid, orgid, 'SELECT');

        if (orgData) {
            if (orgData.voximplantaccountid && orgData.voximplantapikey) {
                if (phoneid) {
                    phoneBody = {
                        account_id: orgData.voximplantaccountid,
                        phone_id: (phoneid || 0).toString(),
                        child_apikey: orgData.voximplantapikey,
                    }

                    let phoneResult = await voximplant.deactivatePhoneNumber(phoneBody);

                    if (phoneResult.result) {
                        voximplantPhoneNumber.phoneid = phoneid;
                    }
                }

                if (queueid) {
                    queueBody = {
                        account_id: orgData.voximplantaccountid,
                        acd_queue_id: (queueid || 0).toString(),
                        child_apikey: orgData.voximplantapikey,
                    }

                    let queueResult = await voximplant.delQueue(queueBody);

                    if (queueResult.result) {
                        voximplantPhoneNumber.queueid = queueid;
                    }
                }
            }
        }
    }
    catch (exception) {
        voximplantPhoneNumber.phoneid = null;
        voximplantPhoneNumber.queueid = null;
    }

    return voximplantPhoneNumber;
}