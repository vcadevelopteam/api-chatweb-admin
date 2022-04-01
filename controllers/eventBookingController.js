const { executesimpletransaction } = require('../config/triggerfunctions');
const { getErrorCode, errors } = require('../config/helpers');

const method_allowed = ["QUERY_EVENT_BY_CODE", "UFN_CALENDARYBOOKING_INS", "UFN_CALENDARYBOOKING_SEL_DATETIME"]

exports.Collection = async (req, res) => {
    const { parameters = {}, method, key } = req.body;
    if (!method_allowed.includes(method)) {
        const resError = getErrorCode(errors.FORBIDDEN);
        return res.status(resError.rescode).json(resError);
    }
    const result = await executesimpletransaction(method, parameters);

    if (result instanceof Array)
        return res.json({ error: false, success: true, data: result, key });
    else
        return res.status(result.rescode).json(result);
}