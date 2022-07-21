exports.generateResponseData = (requestId) => {
    return {
        code: null,
        data: null,
        error: true,
        id: requestId,
        message: "error_unexpected_error",
        status: 400,
        success: false,
    };
}

exports.changeResponseData = (responseData, code, data, message, status = 400, success = false) => {
    responseData.code = code;
    responseData.data = data;
    responseData.error = !success;
    responseData.message = message;
    responseData.status = status;
    responseData.success = success;

    return responseData;
}