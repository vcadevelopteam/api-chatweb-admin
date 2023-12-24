const { errors, getErrorCode } = require('../config/helpers');
const { setSessionParameters } = require('../config/helpers');

const triggerfunctions = require('../config/triggerfunctions');

exports.exchangeRate = async (req, res) => {
    const { parameters = {} } = req.body;

    setSessionParameters(parameters, req.user, req._requestid);

    try {
        var exchangeRate = 0;

        const currency = await getExchangeRate(parameters?.code || 'USD', req._requestid);

        if (currency) {
            exchangeRate = currency.exchangerate;
        }

        if (exchangeRate) {
            return res.json({
                exchangeRate: exchangeRate,
                success: true
            });
        }
        else {
            return res.status(400).json({
                exchangeRate: exchangeRate,
                success: false
            });
        }
    } catch (exception) {
        return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}

const getExchangeRate = async (code, requestId) => {
    const queryString = "UFN_APPSETTING_INVOICE_SEL_EXCHANGERATE";
    const queryParameters = {
        code: code,
        _requestid: requestId,
    }

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);

    if (queryResult instanceof Array) {
        if (queryResult.length > 0) {
            return queryResult[0];
        }
    }

    return null;
}