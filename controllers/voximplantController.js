const channelfunctions = require("../config/channelfunctions");
const voximplant = require("../config/voximplantfunctions");

const { executesimpletransaction } = require('../config/triggerfunctions');

const { setSessionParameters, getErrorCode, buildcsv } = require('../config/helpers');
const axios = require("axios");

const voximplantParentAccountId = process.env.VOXIMPLANT_ACCOUNT_ID;
const voximplantParentApiKey = process.env.VOXIMPLANT_APIKEY;

exports.getChildrenAccounts = async (request, response) => {
    try {
        let requestResult = await voximplant.getChildrenAccounts({ ...request.body, requestid: request._requestid });
        if (requestResult)
            return response.json(requestResult);
        return response.status(400).json(requestResult)
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.getAccountInvoices = async (request, response) => {
    try {
        let requestResult = await voximplant.getAccountInvoices({ ...request.body, requestid: request._requestid });
        if (requestResult)
            return response.json(requestResult);
        return response.status(400).json(requestResult)
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.addAccount = async (request, response) => {
    try {
        let requestResult = await voximplant.addAccount({ ...request.body, requestid: request._requestid });
        if (requestResult)
            return response.json(requestResult);
        return response.status(400).json(requestResult)
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.getAccountInfo = async (request, response) => {
    try {
        let requestResult = await voximplant.getAccountInfo({ ...request.body, requestid: request._requestid });
        if (requestResult)
            return response.json(requestResult);
        return response.status(400).json(requestResult)
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.setChildAccountInfo = async (request, response) => {
    try {
        let requestResult = await voximplant.setChildAccountInfo({ ...request.body, requestid: request._requestid });
        if (requestResult)
            return response.json(requestResult);
        return response.status(400).json(requestResult)
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.transferMoneyToChildAccount = async (request, response) => {
    try {
        let requestResult = await voximplant.transferMoneyToUser({ ...request.body, requestid: request._requestid });
        if (requestResult)
            return response.json(requestResult);
        return response.status(400).json(requestResult)
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.addApplication = async (request, response) => {
    try {
        let requestResult = await voximplant.addApplication({ ...request.body, requestid: request._requestid });
        if (requestResult)
            return response.json(requestResult);
        return response.status(400).json(requestResult)
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.getApplications = async (request, response) => {
    try {
        let requestResult = await voximplant.getApplications({ ...request.body, requestid: request._requestid });
        if (requestResult)
            return response.json(requestResult);
        return response.status(400).json(requestResult)
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.getApplication = async (request, response) => {
    try {
        let requestResult = await voximplant.getApplication({ ...request.body, requestid: request._requestid });
        if (requestResult)
            return response.json(requestResult);
        return response.status(400).json(requestResult)
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.getCallHistory = async (request, response) => {
    try {
        let requestResult = await voximplant.getCallHistory({ ...request.body, requestid: request._requestid });
        if (requestResult)
            return response.json(requestResult);
        return response.status(400).json(requestResult)
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.getTransactionHistory = async (request, response) => {
    try {
        let requestResult = await voximplant.getTransactionHistory({ ...request.body, requestid: request._requestid });
        if (requestResult)
            return response.json(requestResult);
        return response.status(400).json(requestResult)
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.getCallRecord = async (request, response) => {
    let resultData = {
        code: "error_unexpected_error",
        error: true,
        message: "",
        success: false,
    }
    try {
        if (!request.body.call_session_history_id) {
            return response.status(400).json({
                ...resultData,
                code: "error_invalid_call",
                message: "Invalid call"
            })
        }

        setSessionParameters(request.body, request.user, request._requestid);

        // Try to get information of VOXI in org table
        const voxiorgdata = await executesimpletransaction("QUERY_GET_VOXIMPLANT_ORG", {
            corpid: request.body.corpid,
            orgid: request.body.orgid,
            _requestid: request._requestid,
        });

        // If exists info of VOXI in org
        if (voxiorgdata instanceof Array && voxiorgdata.length > 0) {
            request.body['account_id'] = voxiorgdata[0].voximplantaccountid;
            request.body['api_key'] = voxiorgdata[0].voximplantapikey;
            request.body['application_id'] = voxiorgdata[0].voximplantapplicationid;
        }

        let requestResult = await voximplant.getCallRecord({ ...request.body, requestid: request._requestid });
        if (requestResult) {
            if (requestResult?.result.length > 0) {
                let record_url_str = requestResult?.result[0]?.records?.[0]?.record_url;
                if (!record_url_str) {
                    return response.status(400).json({
                        ...resultData,
                        code: "error_no_record",
                        message: "No record"
                    })
                }
                let record_url = new URL(record_url_str);
                record_url.searchParams.append('account_id', request.body['account_id']);
                record_url.searchParams.append('api_key', request.body['api_key']);
                record_url_str = record_url.toString();
                try {
                    record_data = await axios.get(record_url_str, {
                        responseType: 'arraybuffer',
                    });
                    if (record_data.status === 200) {
                        response.set('Content-Disposition', record_data.headers["content-disposition"]);
                        response.set('Content-Type', record_data.headers["content-type"]);
                        let base64data = record_data.data.toString('base64');
                        return response.send(base64data)
                    }
                }
                catch (error) {
                    return response.status(400).json({
                        ...resultData,
                        code: "error_record_error",
                        message: "Record error"
                    })
                }
            }
        }
        return response.status(400).json({
            ...resultData,
            code: "error_invalid_call",
            message: "Invalid call"
        })
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.addUser = async (request, response) => {
    try {
        let requestResult = await voximplant.addUser({ ...request.body, requestid: request._requestid });
        if (requestResult)
            return response.json(requestResult);
        return response.status(400).json(requestResult)
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.getUsers = async (request, response) => {
    try {
        let requestResult = await voximplant.getUsers({ ...request.body, requestid: request._requestid });
        if (requestResult)
            return response.json(requestResult);
        return response.status(400).json(requestResult)
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.getUser = async (request, response) => {
    try {
        let requestResult = await voximplant.getUser({ ...request.body, requestid: request._requestid });
        if (requestResult)
            return response.json(requestResult);
        return response.status(400).json(requestResult)
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.delUser = async (request, response) => {
    try {
        let requestResult = await voximplant.delUser({ ...request.body, requestid: request._requestid });
        if (requestResult)
            return response.json(requestResult);
        return response.status(400).json(requestResult)
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.addQueue = async (request, response) => {
    try {
        let requestResult = await voximplant.addQueue({ ...request.body, requestid: request._requestid });
        if (requestResult)
            return response.json(requestResult);
        return response.status(400).json(requestResult)
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.getQueues = async (request, response) => {
    try {
        let requestResult = await voximplant.getQueues({ ...request.body, requestid: request._requestid });
        if (requestResult)
            return response.json(requestResult);
        return response.status(400).json(requestResult)
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.bindUserToQueue = async (request, response) => {
    try {
        let requestResult = await voximplant.bindUserToQueue({ ...request.body, requestid: request._requestid });
        if (requestResult)
            return response.json(requestResult);
        return response.status(400).json(requestResult)
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.getPhoneNumberCategories = async (request, response) => {
    try {
        var requestCode = "error_unexpected_error";
        var requestData = null;
        var requestMessage = "request error";
        var requestStatus = 400;
        var requestSuccess = false;

        let requestResult = await voximplant.getPhoneNumberCategories({ ...request.body, requestid: request._requestid });

        if (requestResult) {
            if (requestResult.result) {
                requestCode = null;
                requestData = requestResult.result;
                requestMessage = null;
                requestStatus = 200;
                requestSuccess = true;
            }
        }

        return response.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.getPhoneNumberCountryStates = async (request, response) => {
    try {
        var requestCode = "error_unexpected_error";
        var requestData = null;
        var requestMessage = "request error";
        var requestStatus = 400;
        var requestSuccess = false;

        let requestResult = await voximplant.getPhoneNumberCountryStates({ ...request.body, requestid: request._requestid });

        if (requestResult) {
            if (requestResult.result) {
                requestCode = null;
                requestData = requestResult.result;
                requestMessage = null;
                requestStatus = 200;
                requestSuccess = true;
            }
        }

        return response.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.getPhoneNumberRegions = async (request, response) => {
    try {
        var requestCode = "error_unexpected_error";
        var requestData = null;
        var requestMessage = "request error";
        var requestStatus = 400;
        var requestSuccess = false;

        let requestResult = await voximplant.getPhoneNumberRegions({ ...request.body, requestid: request._requestid });

        if (requestResult) {
            if (requestResult.result) {
                requestCode = null;
                requestData = requestResult.result;
                requestMessage = null;
                requestStatus = 200;
                requestSuccess = true;
            }
        }

        return response.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.attachPhoneNumber = async (request, response) => {
    try {
        let requestResult = await voximplant.attachPhoneNumber({ ...request.body, requestid: request._requestid });
        if (requestResult)
            return response.json(requestResult);
        return response.status(400).json(requestResult)
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.getPhoneNumbers = async (request, response) => {
    try {
        let requestResult = await voximplant.getPhoneNumbers({ ...request.body, requestid: request._requestid });
        if (requestResult)
            return response.json(requestResult);
        return response.status(400).json(requestResult)
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.getResourcePrice = async (request, response) => {
    try {
        let requestResult = await voximplant.getResourcePrice({ ...request.body, requestid: request._requestid });
        if (requestResult)
            return response.json(requestResult);
        return response.status(400).json(requestResult)
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.bindPhoneNumberToApplication = async (request, response) => {
    try {
        let requestResult = await voximplant.bindPhoneNumberToApplication({ ...request.body, requestid: request._requestid });
        if (requestResult)
            return response.json(requestResult);
        return response.status(400).json(requestResult)
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.addCustomRecordStorage = async (request, response) => {
    try {
        let requestResult = await voximplant.addCustomRecordStorage({ ...request.body, requestid: request._requestid });
        if (requestResult)
            return response.json(requestResult);
        return response.status(400).json(requestResult)
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.getCustomRecordStorages = async (request, response) => {
    try {
        let requestResult = await voximplant.getCustomRecordStorages({ ...request.body, requestid: request._requestid });
        if (requestResult)
            return response.json(requestResult);
        return response.status(400).json(requestResult)
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.setCustomRecordStorageInfo = async (request, response) => {
    try {
        let requestResult = await voximplant.setCustomRecordStorageInfo({ ...request.body, requestid: request._requestid });
        if (requestResult)
            return response.json(requestResult);
        return response.status(400).json(requestResult)
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.getMaximumConsumption = async (request, response) => {
    var requestCode = "error_unexpected_error";
    var requestData = null;
    var requestMessage = "error_unexpected_error";
    var requestStatus = 400;
    var requestSuccess = false;

    try {
        if (request.body) {
            const { orgid, daterange, timezoneoffset } = request.body;
            const { corpid } = request.user;

            const orgData = await channelfunctions.voximplantManageOrg(corpid, orgid, "SELECT", null, null, null, null, null, null, null, null, null, null, request._requestid);

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
                        requestid: request._requestid,
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
                                    requestid: request._requestid,
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

        return response.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.transferAccountBalance = async (request, response) => {
    var requestCode = "error_unexpected_error";
    var requestMessage = "error_unexpected_error";
    var requestStatus = 400;
    var requestSuccess = false;

    try {
        if (request.body) {
            const { orgid, transferamount } = request.body;
            const { corpid, usr } = request.user;

            const orgData = await channelfunctions.voximplantManageOrg(corpid, orgid, "SELECT", null, null, null, null, null, null, null, null, null, null, request._requestid);

            if (orgData) {
                if (orgData.voximplantaccountid && orgData.voximplantapplicationid && orgData.voximplantapikey) {
                    var transferResult = await voximplant.transferMoneyToUser({
                        child_account_id: orgData.voximplantaccountid,
                        amount: (transferamount || 0).toString(),
                        currency: "USD",
                        requestid: request._requestid,
                    })

                    if (transferResult) {
                        if (transferResult.result) {
                            await channelfunctions.voximplantTransferIns(corpid, orgid, 'MANUAL', 'ACTIVO', 'MANUAL', voximplantParentAccountId, voximplantParentApiKey, orgData.voximplantaccountid, (transferamount || 0), 'MANUAL', usr, request._requestid)

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

        return response.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.getAccountBalance = async (request, response) => {
    var requestCode = "error_unexpected_error";
    var requestData = null;
    var requestMessage = "error_unexpected_error";
    var requestStatus = 400;
    var requestSuccess = false;

    try {
        if (request.body) {
            const { orgid } = request.body;
            const { corpid } = request.user;

            const orgData = await channelfunctions.voximplantManageOrg(corpid, orgid, "SELECT", null, null, null, null, null, null, null, null, null, null, request._requestid);

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
                        requestid: request._requestid,
                    })

                    if (childInfoResult) {
                        if (childInfoResult.result) {
                            requestData.balancechild = childInfoResult.result.live_balance;
                        }
                    }
                }

                var parentInfoResult = await voximplant.getAccountInfo({ requestid: request._requestid });

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

        return response.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.directGetMaximumConsumption = async (request, response) => {
    var requestCode = "error_unexpected_error";
    var requestData = null;
    var requestMessage = "error_unexpected_error";
    var requestStatus = 400;
    var requestSuccess = false;

    try {
        if (request.body) {
            const { corpid, orgid, daterange, timezoneoffset } = request.body;

            const orgData = await channelfunctions.voximplantManageOrg(corpid, orgid, "SELECT", null, null, null, null, null, null, null, null, null, null, request._requestid);

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
                        requestid: request._requestid,
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
                                    requestid: request._requestid,
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

        return response.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.directTransferAccountBalance = async (request, response) => {
    var requestCode = "error_unexpected_error";
    var requestMessage = "error_unexpected_error";
    var requestStatus = 400;
    var requestSuccess = false;

    try {
        if (request.body) {
            const { corpid, orgid, usr, transferamount, description, type, motive } = request.body;

            const orgData = await channelfunctions.voximplantManageOrg(corpid, orgid, "SELECT", null, null, null, null, null, null, null, null, null, null, request._requestid);

            if (orgData) {
                if (orgData.voximplantaccountid && orgData.voximplantapplicationid && orgData.voximplantapikey) {
                    var transferResult = await voximplant.transferMoneyToUser({
                        child_account_id: orgData.voximplantaccountid,
                        amount: (transferamount || 0).toString(),
                        currency: "USD",
                        requestid: request._requestid,
                    })

                    if (transferResult) {
                        if (transferResult.result) {
                            await channelfunctions.voximplantTransferIns(corpid, orgid, description, 'ACTIVO', type, voximplantParentAccountId, voximplantParentApiKey, orgData.voximplantaccountid, (transferamount || 0), motive, usr, request._requestid)

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

        return response.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.directGetAccountBalance = async (request, response) => {
    var requestCode = "error_unexpected_error";
    var requestData = null;
    var requestMessage = "error_unexpected_error";
    var requestStatus = 400;
    var requestSuccess = false;

    try {
        if (request.body) {
            const { corpid, orgid } = request.body;

            const orgData = await channelfunctions.voximplantManageOrg(corpid, orgid, "SELECT", null, null, null, null, null, null, null, null, null, null, request._requestid);

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
                        requestid: request._requestid,
                    })

                    if (childInfoResult) {
                        if (childInfoResult.result) {
                            requestData.balancechild = childInfoResult.result.live_balance;
                        }
                    }
                }

                var parentInfoResult = await voximplant.getAccountInfo({ requestid: request._requestid });

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

        return response.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.updateVoximplantPeriod = async (request, response) => {
    var requestCode = "error_unexpected_error";
    var requestMessage = "error_unexpected_error";
    var requestStatus = 400;
    var requestSuccess = false;

    try {
        if (request.body) {
            const { corpid, orgid, year, month } = request.body;

            const orgData = await channelfunctions.voximplantManageOrg(corpid, orgid, "SELECT", null, null, null, null, null, null, null, null, null, null, request._requestid);

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
                        requestid: request._requestid,
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
                                    requestid: request._requestid,
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

                                const channellist = await channelfunctions.voximplantChannelSel(corpid, orgid, year, month, (orgData.timezoneoffset || 0), request._requestid);

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

                                await channelfunctions.voximplantPeriodUpdate(corpid, orgid, year, month, (phonecost || 0), (pstncost || 0), (voipcost || 0), (recordcost || 0), (othercost || 0), true, request._requestid);
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

        return response.status(requestStatus).json({
            code: requestCode,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.pricingCountryList = async (request, response) => {
    var requestCode = "error_unexpected_error";
    var requestData = null;
    var requestMessage = "error_unexpected_error";
    var requestStatus = 400;
    var requestSuccess = false;

    try {
        const countryTransaction = await executesimpletransaction("UFN_VOXIMPLANTLANDING_COUNTRY_SEL", { _requestid: request._requestid });

        if (countryTransaction instanceof Array && countryTransaction.length > 0) {
            requestCode = "";
            requestData = countryTransaction;
            requestMessage = "";
            requestStatus = 200;
            requestSuccess = true;
        }

        return response.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
        });
    }
}

exports.pricingCountryData = async (request, response) => {
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

            const numberTransaction = await executesimpletransaction("UFN_VOXIMPLANTLANDING_NUMBER_SEL", { countrycode: countrycode, _requestid: request._requestid });

            if (numberTransaction instanceof Array && numberTransaction.length > 0) {
                requestData.numberData = numberTransaction;
            }

            const inboundTransaction = await executesimpletransaction("UFN_VOXIMPLANTLANDING_INBOUND_SEL", { countrycode: countrycode, _requestid: request._requestid });

            if (inboundTransaction instanceof Array && inboundTransaction.length > 0) {
                requestData.inboundData = inboundTransaction;
            }

            const outboundTransaction = await executesimpletransaction("UFN_VOXIMPLANTLANDING_OUTBOUND_SEL", { countrycode: countrycode, _requestid: request._requestid });

            if (outboundTransaction instanceof Array && outboundTransaction.length > 0) {
                requestData.outboundData = outboundTransaction;
            }
        }

        return response.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    }
    catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message
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

exports.createCallList = async (request, result) => {
    try {
        if (!request.body?.message) {
            return result.status(500).json({ success: false, msg: 'No message' });
        }
        if (!request.body?.data?.length > 0) {
            return result.status(500).json({ success: false, msg: 'No members' });
        }
        let unix_start_at = Math.trunc(new Date().getTime() / 1000);
        let data = request.body?.data.map(d => {
            let message = request.body?.message;
            Object.keys(d).forEach(k => {
                message = message.replace(`{{${k}}}`, d[k])
            });
            return {
                ...d,
                message,
                __start_execution_time: '00:00:00',
                __end_execution_time: '23:59:59',
                __start_at: unix_start_at
            }
        });
        let csv = buildcsv(data);
        request.body['file_content'] = csv;
        let requestResult = await voximplant.createCallList(request.body);
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

exports.createManualCallList = async (request, result) => {
    try {
        if (!request.body?.message) {
            return res.status(500).json({ success: false, msg: 'No message' });
        }
        if (!request.body?.data?.length > 0) {
            return res.status(500).json({ success: false, msg: 'No members' });
        }
        let unix_start_at = Math.trunc(new Date().getTime() / 1000);
        let data = request.body?.data.map(d => {
            let message = request.body?.message;
            Object.keys(d).forEach(k => {
                message = message.replace(`{{${k}}}`, d[k])
            });
            return {
                ...d,
                message,
                __start_execution_time: '00:00:00',
                __end_execution_time: '23:59:59',
                __start_at: unix_start_at
            }
        });
        let csv = buildcsv(data);
        request.body['file_content'] = csv;
        let requestResult = await voximplant.createManualCallList(request.body);
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

exports.startNextCallTask = async (request, result) => {
    try {
        let requestResult = await voximplant.startNextCallTask(request.body)
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

exports.getCallLists = async (request, result) => {
    try {
        let requestResult = await voximplant.getCallLists(request.body)
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

exports.stopCallListProcessing = async (request, result) => {
    try {
        let requestResult = await voximplant.stopCallListProcessing(request.body)
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