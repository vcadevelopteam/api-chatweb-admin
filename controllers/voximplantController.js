const channelfunctions = require("../config/channelfunctions");
const voximplant = require("../config/voximplantfunctions");
const { executesimpletransaction } = require('../config/triggerfunctions');
const { setSessionParameters } = require('../config/helpers');

const voximplantParentAccountId = process.env.VOXIMPLANT_ACCOUNT_ID;
const voximplantParentApiKey = process.env.VOXIMPLANT_APIKEY;

exports.getChildrenAccounts = async (request, result) => {
    try {
        let requestResult = await voximplant.getChildrenAccounts(request.body)
        if (requestResult)
            return result.json(requestResult);
        return result.status(400).json(requestResult)
    }
    catch (err) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: err.message,
            success: false,
        })
    }
}

exports.getAccountInvoices = async (request, result) => {
    try {
        let requestResult = await voximplant.getAccountInvoices(request.body)
        if (requestResult)
            return result.json(requestResult);
        return result.status(400).json(requestResult)
    }
    catch (err) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: err.message,
            success: false,
        })
    }
}

exports.addAccount = async (request, result) => {
    try {
        let requestResult = await voximplant.addAccount(request.body)
        if (requestResult)
            return result.json(requestResult);
        return result.status(400).json(requestResult)
    }
    catch (err) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: err.message,
            success: false,
        })
    }
}

exports.getAccountInfo = async (request, result) => {
    try {
        let requestResult = await voximplant.getAccountInfo(request.body)
        if (requestResult)
            return result.json(requestResult);
        return result.status(400).json(requestResult)
    }
    catch (err) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: err.message,
            success: false,
        })
    }
}

exports.setChildAccountInfo = async (request, result) => {
    try {
        let requestResult = await voximplant.setChildAccountInfo(request.body)
        if (requestResult)
            return result.json(requestResult);
        return result.status(400).json(requestResult)
    }
    catch (err) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: err.message,
            success: false,
        })
    }
}

exports.transferMoneyToChildAccount = async (request, result) => {
    try {
        let requestResult = await voximplant.transferMoneyToUser(request.body)
        if (requestResult)
            return result.json(requestResult);
        return result.status(400).json(requestResult)
    }
    catch (err) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: err.message,
            success: false,
        })
    }
}

exports.addApplication = async (request, result) => {
    try {
        let requestResult = await voximplant.addApplication(request.body)
        if (requestResult)
            return result.json(requestResult);
        return result.status(400).json(requestResult)
    }
    catch (err) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: err.message,
            success: false,
        })
    }
}

exports.getApplications = async (request, result) => {
    try {
        let requestResult = await voximplant.getApplications(request.body)
        if (requestResult)
            return result.json(requestResult);
        return result.status(400).json(requestResult)
    }
    catch (err) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: err.message,
            success: false,
        })
    }
}

exports.getApplication = async (request, result) => {
    try {
        let requestResult = await voximplant.getApplication(request.body)
        if (requestResult)
            return result.json(requestResult);
        return result.status(400).json(requestResult)
    }
    catch (err) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: err.message,
            success: false,
        })
    }
}

exports.getCallHistory = async (request, result) => {
    try {
        let requestResult = await voximplant.getCallHistory(request.body)
        if (requestResult)
            return result.json(requestResult);
        return result.status(400).json(requestResult)
    }
    catch (err) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: err.message,
            success: false,
        })
    }
}

exports.getTransactionHistory = async (request, result) => {
    try {
        let requestResult = await voximplant.getTransactionHistory(request.body)
        if (requestResult)
            return result.json(requestResult);
        return result.status(400).json(requestResult)
    }
    catch (err) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: err.message,
            success: false,
        })
    }
}

exports.getCallRecord = async (request, result) => {
    let resultData = {
        code: "error_unexpected_error",
        error: true,
        message: "",
        success: false,
    }
    try {
        if (!request.body.call_session_history_id) {
            return result.status(400).json({
                ...resultData,
                code: "error_invalid_call",
                message: "Invalid call"
            })
        }

        setSessionParameters(request.body, request.user);

        // Try to get information of VOXI in org table
        const voxiorgdata = await executesimpletransaction("QUERY_GET_VOXIMPLANT_ORG", {
            corpid: request.body.corpid,
            orgid: request.body.orgid,
        });

        // If exists info of VOXI in org
        if (voxiorgdata instanceof Array && voxiorgdata.length > 0) {
            request.body['account_id'] = voxiorgdata[0].voximplantaccountid;
            request.body['api_key'] = voxiorgdata[0].voximplantapikey;
            request.body['application_id'] = voxiorgdata[0].voximplantapplicationid;
        }

        let requestResult = await voximplant.getCallRecord(request.body)
        if (requestResult) {
            if (requestResult?.result.length > 0) {
                return result.json({
                    code: "",
                    error: false,
                    data: requestResult?.result[0]?.records?.[0]?.record_url,
                    message: "",
                    success: true
                });
            }
        }
        return result.status(400).json({
            ...resultData,
            code: "error_invalid_call",
            message: "Invalid call"
        })
    }
    catch (err) {
        return result.status(500).json({
            ...resultData,
            message: err.message
        })
    }
}

exports.addUser = async (request, result) => {
    try {
        let requestResult = await voximplant.addUser(request.body)
        if (requestResult)
            return result.json(requestResult);
        return result.status(400).json(requestResult)
    }
    catch (err) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: err.message,
            success: false,
        })
    }
}

exports.getUsers = async (request, result) => {
    try {
        let requestResult = await voximplant.getUsers(request.body)
        if (requestResult)
            return result.json(requestResult);
        return result.status(400).json(requestResult)
    }
    catch (err) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: err.message,
            success: false,
        })
    }
}

exports.getUser = async (request, result) => {
    try {
        let requestResult = await voximplant.getUser(request.body)
        if (requestResult)
            return result.json(requestResult);
        return result.status(400).json(requestResult)
    }
    catch (err) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: err.message,
            success: false,
        })
    }
}

exports.delUser = async (request, result) => {
    try {
        let requestResult = await voximplant.delUser(request.body)
        if (requestResult)
            return result.json(requestResult);
        return result.status(400).json(requestResult)
    }
    catch (err) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: err.message,
            success: false,
        })
    }
}

exports.addQueue = async (request, result) => {
    try {
        let requestResult = await voximplant.addQueue(request.body)
        if (requestResult)
            return result.json(requestResult);
        return result.status(400).json(requestResult)
    }
    catch (err) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: err.message,
            success: false,
        })
    }
}

exports.getQueues = async (request, result) => {
    try {
        let requestResult = await voximplant.getQueues(request.body)
        if (requestResult)
            return result.json(requestResult);
        return result.status(400).json(requestResult)
    }
    catch (err) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: err.message,
            success: false,
        })
    }
}

exports.bindUserToQueue = async (request, result) => {
    try {
        let requestResult = await voximplant.bindUserToQueue(request.body)
        if (requestResult)
            return result.json(requestResult);
        return result.status(400).json(requestResult)
    }
    catch (err) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: err.message,
            success: false,
        })
    }
}

exports.getPhoneNumberCategories = async (request, result) => {
    try {
        var requestCode = "error_unexpected_error";
        var requestData = null;
        var requestMessage = "request error";
        var requestStatus = 400;
        var requestSuccess = false;

        let requestResult = await voximplant.getPhoneNumberCategories(request.body);

        if (requestResult) {
            if (requestResult.result) {
                requestCode = null;
                requestData = requestResult.result;
                requestMessage = null;
                requestStatus = 200;
                requestSuccess = true;
            }
        }

        return result.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.getPhoneNumberCountryStates = async (request, result) => {
    try {
        var requestCode = "error_unexpected_error";
        var requestData = null;
        var requestMessage = "request error";
        var requestStatus = 400;
        var requestSuccess = false;

        let requestResult = await voximplant.getPhoneNumberCountryStates(request.body);

        if (requestResult) {
            if (requestResult.result) {
                requestCode = null;
                requestData = requestResult.result;
                requestMessage = null;
                requestStatus = 200;
                requestSuccess = true;
            }
        }

        return result.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.getPhoneNumberRegions = async (request, result) => {
    try {
        var requestCode = "error_unexpected_error";
        var requestData = null;
        var requestMessage = "request error";
        var requestStatus = 400;
        var requestSuccess = false;

        let requestResult = await voximplant.getPhoneNumberRegions(request.body);

        if (requestResult) {
            if (requestResult.result) {
                requestCode = null;
                requestData = requestResult.result;
                requestMessage = null;
                requestStatus = 200;
                requestSuccess = true;
            }
        }

        return result.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.attachPhoneNumber = async (request, result) => {
    try {
        let requestResult = await voximplant.attachPhoneNumber(request.body)
        if (requestResult)
            return result.json(requestResult);
        return result.status(400).json(requestResult)
    }
    catch (err) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: err.message,
            success: false,
        })
    }
}

exports.getPhoneNumbers = async (request, result) => {
    try {
        let requestResult = await voximplant.getPhoneNumbers(request.body)
        if (requestResult)
            return result.json(requestResult);
        return result.status(400).json(requestResult)
    }
    catch (err) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: err.message,
            success: false,
        })
    }
}

exports.getResourcePrice = async (request, result) => {
    try {
        let requestResult = await voximplant.getResourcePrice(request.body)
        if (requestResult)
            return result.json(requestResult);
        return result.status(400).json(requestResult)
    }
    catch (err) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: err.message,
            success: false,
        })
    }
}

exports.bindPhoneNumberToApplication = async (request, result) => {
    try {
        let requestResult = await voximplant.bindPhoneNumberToApplication(request.body)
        if (requestResult)
            return result.json(requestResult);
        return result.status(400).json(requestResult)
    }
    catch (err) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: err.message,
            success: false,
        })
    }
}

exports.addCustomRecordStorage = async (request, result) => {
    try {
        let requestResult = await voximplant.addCustomRecordStorage(request.body)
        if (requestResult)
            return result.json(requestResult);
        return result.status(400).json(requestResult)
    }
    catch (err) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: err.message,
            success: false,
        })
    }
}

exports.getCustomRecordStorages = async (request, result) => {
    try {
        let requestResult = await voximplant.getCustomRecordStorages(request.body)
        if (requestResult)
            return result.json(requestResult);
        return result.status(400).json(requestResult)
    }
    catch (err) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: err.message,
            success: false,
        })
    }
}

exports.setCustomRecordStorageInfo = async (request, result) => {
    try {
        let requestResult = await voximplant.setCustomRecordStorageInfo(request.body)
        if (requestResult)
            return result.json(requestResult);
        return result.status(400).json(requestResult)
    }
    catch (err) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: err.message,
            success: false,
        })
    }
}

exports.getMaximumConsumption = async (request, result) => {
    var requestCode = "error_unexpected_error";
    var requestData = null;
    var requestMessage = "error_unexpected_error";
    var requestStatus = 400;
    var requestSuccess = false;

    try {
        if (request.body) {
            const { orgid, daterange, timezoneoffset } = request.body;
            const { corpid } = request.user;

            const orgData = await channelfunctions.voximplantManageOrg(corpid, orgid, "SELECT");

            if (orgData) {
                requestCode = "";
                requestData = { maximumconsumption: 0.00, consumptiondate: null };
                requestMessage = "";
                requestStatus = 200;
                requestSuccess = true;

                if (orgData.voximplantaccountid && orgData.voximplantapplicationid && orgData.voximplantapikey) {
                    var datestart = convertToUtc(new Date());
                    var dateend = convertToUtc(new Date());
                    var offset = 0;

                    datestart.setHours(datestart.getHours() + (timezoneoffset || 0));
                    datestart.setHours(0, 0, 0, 0);
                    datestart.setHours(datestart.getHours() - (timezoneoffset || 0));

                    dateend = new Date(datestart);

                    dateend.setHours(dateend.getHours() - ((daterange || 0) * 24));

                    var callHistoryResult = await voximplant.getCallHistory({
                        from_date: getDateString(dateend),
                        to_date: getDateString(datestart),
                        account_id: orgData.voximplantaccountid,
                        application_id: orgData.voximplantapplicationid,
                        child_apikey: orgData.voximplantapikey,
                        count: "1000",
                        offset: offset.toString(),
                    })

                    if (callHistoryResult) {
                        if (callHistoryResult.result) {
                            var datalist = [];

                            if (callHistoryResult.count) {
                                datalist = datalist.concat(callHistoryResult.result);
                            }

                            while (callHistoryResult.count != callHistoryResult.total_count) {
                                offset = offset + 1000;

                                callHistoryResult = await voximplant.getCallHistory({
                                    from_date: getDateString(dateend),
                                    to_date: getDateString(datestart),
                                    account_id: orgData.voximplantaccountid,
                                    application_id: orgData.voximplantapplicationid,
                                    child_apikey: orgData.voximplantapikey,
                                    count: "1000",
                                    offset: offset.toString(),
                                })

                                if (callHistoryResult) {
                                    if (callHistoryResult.result) {
                                        if (callHistoryResult.count) {
                                            datalist = datalist.concat(callHistoryResult.result);
                                        }
                                        else {
                                            break;
                                        }
                                    }
                                    else {
                                        break;
                                    }
                                }
                                else {
                                    break;
                                }
                            }

                            if (datalist) {
                                datalist.sort((a, b) => a.start_date - b.start_date);

                                var maximumdate = null;
                                var maximumprice = 0.00;

                                var comparedate = null;
                                var compareprice = 0.00;

                                datalist.forEach(element => {
                                    var dateelement = new Date(element.start_date);
                                    var datestring = "";
                                    var datevalue = 0;

                                    dateelement.setHours(dateelement.getHours() + (timezoneoffset || 0));
                                    datestring = getDateString(dateelement).split(" ")[0];

                                    if (element.calls) {
                                        element.calls.forEach(call => {
                                            if (call.cost) {
                                                datevalue = datevalue + call.cost;
                                            }
                                        });
                                    }

                                    if (!comparedate) {
                                        comparedate = datestring;
                                        compareprice = compareprice + datevalue;
                                    }
                                    else {
                                        if (comparedate === datestring) {
                                            compareprice = compareprice + datevalue;
                                        }
                                        else {
                                            comparedate = datestring;
                                            compareprice = datevalue;
                                        }
                                    }

                                    if (maximumprice < compareprice) {
                                        maximumprice = compareprice;
                                        maximumdate = comparedate;
                                    }
                                });

                                requestData.maximumconsumption = maximumprice;
                                requestData.consumptiondate = maximumdate;
                            }
                        }
                        else {
                            requestCode = "error_voximplant_failedrequest";
                            requestData = null;
                            requestMessage = "error_voximplant_failedrequest";
                            requestStatus = 400;
                            requestSuccess = false;
                        }
                    }
                    else {
                        requestCode = "error_voximplant_failedrequest";
                        requestData = null;
                        requestMessage = "error_voximplant_failedrequest";
                        requestStatus = 400;
                        requestSuccess = false;
                    }
                }
            }
            else {
                requestCode = "error_org_notfound";
                requestMessage = "error_org_notfound";
            }
        }

        return result.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.transferAccountBalance = async (request, result) => {
    var requestCode = "error_unexpected_error";
    var requestMessage = "error_unexpected_error";
    var requestStatus = 400;
    var requestSuccess = false;

    try {
        if (request.body) {
            const { orgid, transferamount } = request.body;
            const { corpid, usr } = request.user;

            const orgData = await channelfunctions.voximplantManageOrg(corpid, orgid, "SELECT");

            if (orgData) {
                if (orgData.voximplantaccountid && orgData.voximplantapplicationid && orgData.voximplantapikey) {
                    var transferResult = await voximplant.transferMoneyToUser({
                        child_account_id: orgData.voximplantaccountid,
                        amount: (transferamount || 0).toString(),
                        currency: "USD"
                    })

                    if (transferResult) {
                        if (transferResult.result) {
                            await channelfunctions.voximplantTransferIns(corpid, orgid, 'MANUAL', 'ACTIVO', 'MANUAL', voximplantParentAccountId, voximplantParentApiKey, orgData.voximplantaccountid, (transferamount || 0), 'MANUAL', usr)

                            requestCode = "";
                            requestMessage = "";
                            requestStatus = 200;
                            requestSuccess = true;
                        }
                        else {
                            requestCode = "error_voximplant_failedrequest";
                            requestMessage = "error_voximplant_failedrequest";

                            if (transferResult.error) {
                                if (transferResult.error.code === 127) {
                                    requestCode = "error_voximplant_nofunds";
                                    requestMessage = "error_voximplant_nofunds";
                                }

                                if (transferResult.error.code === 125) {
                                    requestCode = "error_voximplant_invalidamount";
                                    requestMessage = "error_voximplant_invalidamount";
                                }
                            }
                        }
                    }
                    else {
                        requestCode = "error_voximplant_failedrequest";
                        requestMessage = "error_voximplant_failedrequest";
                    }
                }
                else {
                    requestCode = "error_voximplant_notfound";
                    requestMessage = "error_voximplant_notfound";
                }
            }
            else {
                requestCode = "error_org_notfound";
                requestMessage = "error_org_notfound";
            }
        }

        return result.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.getAccountBalance = async (request, result) => {
    var requestCode = "error_unexpected_error";
    var requestData = null;
    var requestMessage = "error_unexpected_error";
    var requestStatus = 400;
    var requestSuccess = false;

    try {
        if (request.body) {
            const { orgid } = request.body;
            const { corpid } = request.user;

            const orgData = await channelfunctions.voximplantManageOrg(corpid, orgid, "SELECT");

            if (orgData) {
                requestCode = "";
                requestData = { balancechild: 0.00, balanceparent: 0.00, };
                requestMessage = "";
                requestStatus = 200;
                requestSuccess = true;

                if (orgData.voximplantaccountid && orgData.voximplantapplicationid && orgData.voximplantapikey) {
                    var childInfoResult = await voximplant.getAccountInfo({
                        account_id: orgData.voximplantaccountid,
                        account_apikey: orgData.voximplantapikey,
                    })

                    if (childInfoResult) {
                        if (childInfoResult.result) {
                            requestData.balancechild = childInfoResult.result.live_balance;
                        }
                    }
                }

                var parentInfoResult = await voximplant.getAccountInfo({})

                if (parentInfoResult) {
                    if (parentInfoResult.result) {
                        requestData.balanceparent = parentInfoResult.result.live_balance;
                    }
                }
            }
            else {
                requestCode = "error_org_notfound";
                requestMessage = "error_org_notfound";
            }
        }

        return result.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.directGetMaximumConsumption = async (request, result) => {
    var requestCode = "error_unexpected_error";
    var requestData = null;
    var requestMessage = "error_unexpected_error";
    var requestStatus = 400;
    var requestSuccess = false;

    try {
        if (request.body) {
            const { corpid, orgid, daterange, timezoneoffset } = request.body;

            const orgData = await channelfunctions.voximplantManageOrg(corpid, orgid, "SELECT");

            if (orgData) {
                requestCode = "";
                requestData = { maximumconsumption: 0.00, consumptiondate: null };
                requestMessage = "";
                requestStatus = 200;
                requestSuccess = true;

                if (orgData.voximplantaccountid && orgData.voximplantapplicationid && orgData.voximplantapikey) {
                    var datestart = convertToUtc(new Date());
                    var dateend = convertToUtc(new Date());
                    var offset = 0;

                    datestart.setHours(datestart.getHours() + (timezoneoffset || 0));
                    datestart.setHours(0, 0, 0, 0);
                    datestart.setHours(datestart.getHours() - (timezoneoffset || 0));

                    dateend = new Date(datestart);

                    dateend.setHours(dateend.getHours() - ((daterange || 0) * 24));

                    var callHistoryResult = await voximplant.getCallHistory({
                        from_date: getDateString(dateend),
                        to_date: getDateString(datestart),
                        account_id: orgData.voximplantaccountid,
                        application_id: orgData.voximplantapplicationid,
                        child_apikey: orgData.voximplantapikey,
                        count: "1000",
                        offset: offset.toString(),
                    })

                    if (callHistoryResult) {
                        if (callHistoryResult.result) {
                            var datalist = [];

                            if (callHistoryResult.count) {
                                datalist = datalist.concat(callHistoryResult.result);
                            }

                            while (callHistoryResult.count != callHistoryResult.total_count) {
                                offset = offset + 1000;

                                callHistoryResult = await voximplant.getCallHistory({
                                    from_date: getDateString(dateend),
                                    to_date: getDateString(datestart),
                                    account_id: orgData.voximplantaccountid,
                                    application_id: orgData.voximplantapplicationid,
                                    child_apikey: orgData.voximplantapikey,
                                    count: "1000",
                                    offset: offset.toString(),
                                })

                                if (callHistoryResult) {
                                    if (callHistoryResult.result) {
                                        if (callHistoryResult.count) {
                                            datalist = datalist.concat(callHistoryResult.result);
                                        }
                                        else {
                                            break;
                                        }
                                    }
                                    else {
                                        break;
                                    }
                                }
                                else {
                                    break;
                                }
                            }

                            if (datalist) {
                                datalist.sort((a, b) => a.start_date - b.start_date);

                                var maximumdate = null;
                                var maximumprice = 0.00;

                                var comparedate = null;
                                var compareprice = 0.00;

                                datalist.forEach(element => {
                                    var dateelement = new Date(element.start_date);
                                    var datestring = "";
                                    var datevalue = 0;

                                    dateelement.setHours(dateelement.getHours() + (timezoneoffset || 0));
                                    datestring = getDateString(dateelement).split(" ")[0];

                                    if (element.calls) {
                                        element.calls.forEach(call => {
                                            if (call.cost) {
                                                datevalue = datevalue + call.cost;
                                            }
                                        });
                                    }

                                    if (!comparedate) {
                                        comparedate = datestring;
                                        compareprice = compareprice + datevalue;
                                    }
                                    else {
                                        if (comparedate === datestring) {
                                            compareprice = compareprice + datevalue;
                                        }
                                        else {
                                            comparedate = datestring;
                                            compareprice = datevalue;
                                        }
                                    }

                                    if (maximumprice < compareprice) {
                                        maximumprice = compareprice;
                                        maximumdate = comparedate;
                                    }
                                });

                                requestData.maximumconsumption = maximumprice;
                                requestData.consumptiondate = maximumdate;
                            }
                        }
                        else {
                            requestCode = "error_voximplant_failedrequest";
                            requestData = null;
                            requestMessage = "error_voximplant_failedrequest";
                            requestStatus = 400;
                            requestSuccess = false;
                        }
                    }
                    else {
                        requestCode = "error_voximplant_failedrequest";
                        requestData = null;
                        requestMessage = "error_voximplant_failedrequest";
                        requestStatus = 400;
                        requestSuccess = false;
                    }
                }
            }
            else {
                requestCode = "error_org_notfound";
                requestMessage = "error_org_notfound";
            }
        }

        return result.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.directTransferAccountBalance = async (request, result) => {
    var requestCode = "error_unexpected_error";
    var requestMessage = "error_unexpected_error";
    var requestStatus = 400;
    var requestSuccess = false;

    try {
        if (request.body) {
            const { corpid, orgid, usr, transferamount, description, type, motive } = request.body;

            const orgData = await channelfunctions.voximplantManageOrg(corpid, orgid, "SELECT");

            if (orgData) {
                if (orgData.voximplantaccountid && orgData.voximplantapplicationid && orgData.voximplantapikey) {
                    var transferResult = await voximplant.transferMoneyToUser({
                        child_account_id: orgData.voximplantaccountid,
                        amount: (transferamount || 0).toString(),
                        currency: "USD"
                    })

                    if (transferResult) {
                        if (transferResult.result) {
                            await channelfunctions.voximplantTransferIns(corpid, orgid, description, 'ACTIVO', type, voximplantParentAccountId, voximplantParentApiKey, orgData.voximplantaccountid, (transferamount || 0), motive, usr)

                            requestCode = "";
                            requestMessage = "";
                            requestStatus = 200;
                            requestSuccess = true;
                        }
                        else {
                            requestCode = "error_voximplant_failedrequest";
                            requestMessage = "error_voximplant_failedrequest";

                            if (transferResult.error) {
                                if (transferResult.error.code === 127) {
                                    requestCode = "error_voximplant_nofunds";
                                    requestMessage = "error_voximplant_nofunds";
                                }

                                if (transferResult.error.code === 125) {
                                    requestCode = "error_voximplant_invalidamount";
                                    requestMessage = "error_voximplant_invalidamount";
                                }
                            }
                        }
                    }
                    else {
                        requestCode = "error_voximplant_failedrequest";
                        requestMessage = "error_voximplant_failedrequest";
                    }
                }
                else {
                    requestCode = "error_voximplant_notfound";
                    requestMessage = "error_voximplant_notfound";
                }
            }
            else {
                requestCode = "error_org_notfound";
                requestMessage = "error_org_notfound";
            }
        }

        return result.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.directGetAccountBalance = async (request, result) => {
    var requestCode = "error_unexpected_error";
    var requestData = null;
    var requestMessage = "error_unexpected_error";
    var requestStatus = 400;
    var requestSuccess = false;

    try {
        if (request.body) {
            const { corpid, orgid } = request.body;

            const orgData = await channelfunctions.voximplantManageOrg(corpid, orgid, "SELECT");

            if (orgData) {
                requestCode = "";
                requestData = { balancechild: 0.00, balanceparent: 0.00, };
                requestMessage = "";
                requestStatus = 200;
                requestSuccess = true;

                if (orgData.voximplantaccountid && orgData.voximplantapplicationid && orgData.voximplantapikey) {
                    var childInfoResult = await voximplant.getAccountInfo({
                        account_id: orgData.voximplantaccountid,
                        account_apikey: orgData.voximplantapikey,
                    })

                    if (childInfoResult) {
                        if (childInfoResult.result) {
                            requestData.balancechild = childInfoResult.result.live_balance;
                        }
                    }
                }

                var parentInfoResult = await voximplant.getAccountInfo({})

                if (parentInfoResult) {
                    if (parentInfoResult.result) {
                        requestData.balanceparent = parentInfoResult.result.live_balance;
                    }
                }
            }
            else {
                requestCode = "error_org_notfound";
                requestMessage = "error_org_notfound";
            }
        }

        return result.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.updateVoximplantPeriod = async (request, result) => {
    var requestCode = "error_unexpected_error";
    var requestMessage = "error_unexpected_error";
    var requestStatus = 400;
    var requestSuccess = false;

    try {
        if (request.body) {
            const { corpid, orgid, year, month } = request.body;

            const orgData = await channelfunctions.voximplantManageOrg(corpid, orgid, "SELECT");

            if (orgData) {
                requestCode = "";
                requestMessage = "";
                requestStatus = 200;
                requestSuccess = true;

                if (orgData.voximplantaccountid && orgData.voximplantapplicationid && orgData.voximplantapikey) {
                    var datestart = new Date(year, month - 1, 1);
                    var dateend = new Date(year, month, 0, 23, 59, 59);
                    var offset = 0;

                    datestart.setHours(datestart.getHours() + (orgData.timezoneoffset || 0));
                    dateend.setHours(dateend.getHours() + (orgData.timezoneoffset || 0));

                    var transactionHistoryResult = await voximplant.getTransactionHistory({
                        from_date: getDateString(datestart),
                        to_date: getDateString(dateend),
                        account_id: orgData.voximplantaccountid,
                        account_apikey: orgData.voximplantapikey,
                        count: "1000",
                        offset: offset.toString(),
                    })

                    if (transactionHistoryResult) {
                        if (transactionHistoryResult.result) {
                            var datalist = [];

                            if (transactionHistoryResult.count) {
                                datalist = datalist.concat(transactionHistoryResult.result);
                            }

                            while (transactionHistoryResult.count != transactionHistoryResult.total_count) {
                                offset = offset + 1000;

                                transactionHistoryResult = await voximplant.getTransactionHistory({
                                    from_date: getDateString(datestart),
                                    to_date: getDateString(dateend),
                                    account_id: orgData.voximplantaccountid,
                                    account_apikey: orgData.voximplantapikey,
                                    count: "1000",
                                    offset: offset.toString(),
                                })

                                if (transactionHistoryResult) {
                                    if (transactionHistoryResult.result) {
                                        if (transactionHistoryResult.count) {
                                            datalist = datalist.concat(transactionHistoryResult.result);
                                        }
                                        else {
                                            break;
                                        }
                                    }
                                    else {
                                        break;
                                    }
                                }
                                else {
                                    break;
                                }
                            }

                            if (datalist) {
                                var phonecost = 0.00;
                                var pstncost = 0.00;
                                var voipcost = 0.00;
                                var recordcost = 0.00;
                                var othercost = 0.00;

                                datalist.forEach(element => {
                                    var datatype = 'OTHER';

                                    if (element.resource_type) {
                                        if (element.resource_type.includes("PSTN")) {
                                            datatype = 'PSTN';
                                        }
                                        if (element.resource_type.includes("VOIP")) {
                                            datatype = 'VOIP';
                                        }
                                        if (element.resource_type.includes("RECORD")) {
                                            datatype = 'RECORD';
                                        }
                                        if (element.resource_type.includes("PHONE")) {
                                            datatype = 'PHONE';
                                        }
                                    }
                                    else {
                                        datatype = null;

                                        if (element.transaction_type) {
                                            if (element.transaction_type.includes("phone_number")) {
                                                datatype = 'PHONE';
                                            }
                                            else {
                                                if (element.transaction_type !== 'money_distribution') {
                                                    datatype = 'OTHER';
                                                }
                                            }
                                        }
                                    }

                                    if (element.amount) {
                                        if (element.amount < 0) {
                                            switch (datatype) {
                                                case "PSTN":
                                                    pstncost = pstncost + parseFloat(element.amount);
                                                    break;

                                                case "VOIP":
                                                    voipcost = voipcost + parseFloat(element.amount);
                                                    break;

                                                case "RECORD":
                                                    recordcost = recordcost + parseFloat(element.amount);
                                                    break;

                                                case "PHONE":
                                                    phonecost = phonecost + parseFloat(element.amount);
                                                    break;

                                                case "OTHER":
                                                    othercost = othercost + parseFloat(element.amount);
                                                    break;
                                            }
                                        }
                                    }
                                });

                                phonecost = Math.abs(phonecost);
                                pstncost = Math.abs(pstncost);
                                voipcost = Math.abs(voipcost);
                                recordcost = Math.abs(recordcost);
                                othercost = Math.abs(othercost);

                                const channellist = await channelfunctions.voximplantChannelSel(corpid, orgid, year, month, (orgData.timezoneoffset || 0));

                                if (channellist) {
                                    channellist.forEach(element => {
                                        if (element.servicecredentials) {
                                            var servicecredentials = JSON.parse(element.servicecredentials);

                                            if (servicecredentials.costinstallation) {
                                                phonecost = phonecost + parseFloat(servicecredentials.costinstallation);
                                            }
                                        }
                                    });
                                }

                                await channelfunctions.voximplantPeriodUpdate(corpid, orgid, year, month, (phonecost || 0), (pstncost || 0), (voipcost || 0), (recordcost || 0), (othercost || 0), true);
                            }
                        }
                    }
                }
            }
            else {
                requestCode = "error_org_notfound";
                requestMessage = "error_org_notfound";
            }
        }

        return result.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.pricingCountryList = async (request, result) => {
    var requestCode = "error_unexpected_error";
    var requestData = null;
    var requestMessage = "error_unexpected_error";
    var requestStatus = 400;
    var requestSuccess = false;

    try {
        const countryTransaction = await executesimpletransaction("UFN_VOXIMPLANTLANDING_COUNTRY_SEL");

        if (countryTransaction instanceof Array && countryTransaction.length > 0) {
            requestCode = "";
            requestData = countryTransaction;
            requestMessage = "";
            requestStatus = 200;
            requestSuccess = true;
        }

        return result.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

exports.pricingCountryData = async (request, result) => {
    var requestCode = "error_unexpected_error";
    var requestData = null;
    var requestMessage = "error_unexpected_error";
    var requestStatus = 400;
    var requestSuccess = false;

    try {
        if (request.body) {
            const { countrycode } = request.body;

            requestCode = "";
            requestData = {
                numberData: null,
                inboundData: null,
                outboundData: null,
            };
            requestMessage = "";
            requestStatus = 200;
            requestSuccess = true;

            const numberTransaction = await executesimpletransaction("UFN_VOXIMPLANTLANDING_NUMBER_SEL", { countrycode: countrycode });

            if (numberTransaction instanceof Array && numberTransaction.length > 0) {
                requestData.numberData = numberTransaction;
            }

            const inboundTransaction = await executesimpletransaction("UFN_VOXIMPLANTLANDING_INBOUND_SEL", { countrycode: countrycode });

            if (inboundTransaction instanceof Array && inboundTransaction.length > 0) {
                requestData.inboundData = inboundTransaction;
            }

            const outboundTransaction = await executesimpletransaction("UFN_VOXIMPLANTLANDING_OUTBOUND_SEL", { countrycode: countrycode });

            if (outboundTransaction instanceof Array && outboundTransaction.length > 0) {
                requestData.outboundData = outboundTransaction;
            }
        }

        return result.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return result.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
}

const convertToUtc = (date) => {
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
}

function getDateString(date) {
    return (
        [
            date.getFullYear(),
            padTwoDigits(date.getMonth() + 1),
            padTwoDigits(date.getDate()),
        ].join("-") +
        " " +
        [
            padTwoDigits(date.getHours()),
            padTwoDigits(date.getMinutes()),
            padTwoDigits(date.getSeconds()),
        ].join(":")
    );
}

function padTwoDigits(num) {
    return num.toString().padStart(2, "0");
}