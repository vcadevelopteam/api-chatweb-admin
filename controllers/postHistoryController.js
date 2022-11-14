const { errors, getErrorCode } = require('../config/helpers');

exports.schedulePost = async (request, response) => {
    try {
        if (request.body) {
            return response.json({
                success: true
            });
        }
        else {
            return response.json({
                success: false
            });
        }
    } catch (exception) {
        return response.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR, exception, `Request to ${request.originalUrl}`, request._requestid));
    }
}