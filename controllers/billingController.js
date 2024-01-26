const { errors, getErrorCode, axiosObservable } = require('../config/helpers');
const { executesimpletransaction } = require('../config/triggerfunctions');;
const { setSessionParameters, printException } = require('../config/helpers');

const exchangeEndpoint = process.env.EXCHANGE;

exports.exchangeRate = async (req, res) => {
    const { parameters = {} } = req.body;

    setSessionParameters(parameters, req.user, req._requestid);

    try {
        var exchangeRate = 0;
        var retryNumber = 0;

        var currentDate = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));

        currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));

        while (exchangeRate === 0 && retryNumber <= 20) {
            try {
                const requestGetExchange = await axiosObservable({
                    method: 'get',
                    url: `${retryNumber === 0 ? exchangeEndpoint.split('?')[0] : (exchangeEndpoint + currentDate.toISOString().split('T')[0])}`,
                    _requestid: req._requestid,
                });

                if (requestGetExchange.data.venta) {
                    exchangeRate = requestGetExchange.data.venta;
                }
                else {
                    currentDate = new Date(currentDate.setDate(currentDate.getDate() - 1));
                }
            }
            catch (exception) {
                currentDate = new Date(currentDate.setDate(currentDate.getDate() - 1));
            }

            retryNumber++;

            await sleep(4000);
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

async function sleep(msec) {
    return new Promise(resolve => setTimeout(resolve, msec));
}