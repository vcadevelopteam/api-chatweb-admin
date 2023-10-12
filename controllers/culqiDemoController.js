const genericfunctions = require("../config/genericfunctions");

const { axiosObservable, getErrorCode } = require("../config/helpers");

exports.generateOrder = async (request, response) => {
    let responsedata = genericfunctions.generateResponseData(request._requestid);

    try {
        const {
            culqi_amount,
            culqi_clientfirstname,
            culqi_clientlastname,
            culqi_clientmail,
            culqi_clientphone,
            culqi_currency,
            culqi_description,
            culqi_ordernumber,
        } = request.body;

        if (culqi_amount) {
            const requestCulqiOrder = await axiosObservable({
                data: {
                    amount: culqi_amount * 100,
                    currency_code: culqi_currency,
                    description: culqi_description,
                    order_number: culqi_ordernumber,
                    expiration_date: `${Math.round(new Date().setHours(new Date().getHours() + 24) / 1000)}`,
                    confirm: false,
                    client_details: {
                        first_name: culqi_clientfirstname,
                        last_name: culqi_clientlastname,
                        email: culqi_clientmail,
                        phone_number: culqi_clientphone,
                    },
                },
                headers: {
                    Authorization: `Bearer sk_test_d901e8f07d45a485`,
                },
                method: "post",
                url: "https://api.culqi.com/v2/orders",
                _requestid: responsedata.id,
            });

            if (requestCulqiOrder.data) {
                responsedata = genericfunctions.changeResponseData(
                    responsedata,
                    null,
                    requestCulqiOrder.data,
                    "success",
                    200,
                    true
                );
            } else {
                responsedata = genericfunctions.changeResponseData(
                    responsedata,
                    responsedata.code,
                    requestCulqiOrder.data,
                    "Error processing order",
                    responsedata.status,
                    responsedata.success
                );
            }
        }

        return response.status(responsedata.status).json(responsedata);
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
};

exports.generateCharge = async (request, response) => {
    let responsedata = genericfunctions.generateResponseData(request._requestid);

    try {
        const { culqi_amount, culqi_currency, culqi_mail, culqi_token } = request.body;

        if (culqi_amount) {
            const requestCulqiCharge = await axiosObservable({
                data: {
                    amount: culqi_amount,
                    currency_code: culqi_currency,
                    email: culqi_mail,
                    source_id: culqi_token,
                },
                headers: {
                    Authorization: `Bearer sk_test_d901e8f07d45a485`,
                },
                method: "post",
                url: "https://api.culqi.com/v2/charges",
                _requestid: responsedata.id,
            });

            if (requestCulqiCharge.data) {
                responsedata = genericfunctions.changeResponseData(
                    responsedata,
                    null,
                    requestCulqiCharge.data,
                    "success",
                    200,
                    true
                );
            } else {
                responsedata = genericfunctions.changeResponseData(
                    responsedata,
                    responsedata.code,
                    requestCulqiCharge.data,
                    "Error processing charge",
                    responsedata.status,
                    responsedata.success
                );
            }
        }

        return response.status(responsedata.status).json(responsedata);
    } catch (exception) {
        return response.status(500).json({
            ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid),
            message: exception.message,
        });
    }
};