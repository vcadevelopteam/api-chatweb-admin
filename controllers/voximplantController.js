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
        let requestResult = await voximplant.getPhoneNumberCategories(request.body)
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

exports.getPhoneNumberCountryStates = async (request, result) => {
    try {
        let requestResult = await voximplant.getPhoneNumberCountryStates(request.body)
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

exports.getPhoneNumberRegions = async (request, result) => {
    try {
        let requestResult = await voximplant.getPhoneNumberRegions(request.body)
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