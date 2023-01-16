const Culqi = require('culqi-node');

const triggerfunctions = require('../config/triggerfunctions');
const genericfunctions = require('../config/genericfunctions');

const { getErrorCode } = require('../config/helpers');


exports.createCharge = async (req, res) => {
    try {
        const token = req.body
        
        const culqi = new Culqi({
            privateKey: 'sk_test_d901e8f07d45a485'
        });

        const charge = await culqi.charges.createCharge({
            amount: 1000,
            currency_code: 'PEN',
            email: token.email,
            source_id: token.id,
            capture: true,
            description: 'Prueba',
            installments: 2,
            metadata: {dni: '70202170'},
            antifraud_details: {
              address: 'Avenida Lima 213',
              address_city: 'Lima',
              country_code: 'PE',
              first_name: 'Richard',
              last_name: 'Hendricks',
              phone_number: '999999987'
            }
        });
    
        console.log(charge);
               
    } catch (error) {
        console.log(error)
    }   

}

exports.getPaymentOrder = async(request, response) => {
    try {
        var responsedata = genericfunctions.generateResponseData(request._requestid);

        const { corpid, orgid, conversationid, paymentid } = request.body;

        const queryResult = await triggerfunctions.executesimpletransaction("UFN_PAYMENT_SEL", { corpid: corpid, orgid: orgid, conversationid: conversationid, paymentid: paymentid });
        const paymentorder = queryResult[0];

        if (paymentorder) {
            responsedata = genericfunctions.changeResponseData(responsedata, null, paymentorder, 'success', 200, true);
        }
        else {
            responsedata = genericfunctions.changeResponseData(responsedata, responsedata.code, responsedata.data, 'Payment order not found', responsedata.status, responsedata.success);
        }
        return response.status(responsedata.status).json(responsedata);

    } catch (exception) {
        return response.status(500).json(getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid));
    }
}