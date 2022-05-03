const voximplant = require("../config/voximplantfunctions");

exports.getChildrenAccounts = async (request, result) => {
    try {
        let requestResult = await voximplant.getChildrenAccounts(request.body)
        return result.json(requestResult);
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
        return result.json(requestResult);
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
        return result.json(requestResult);
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
        return result.json(requestResult);
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
        return result.json(requestResult);
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
        return result.json(requestResult);
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
        return result.json(requestResult);
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