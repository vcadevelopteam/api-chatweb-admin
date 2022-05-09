const voximplant = require("../config/voximplantfunctions");

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