const Culqi = require('culqi-node');

const triggerfunctions = require('../config/triggerfunctions');
const genericfunctions = require('../config/genericfunctions');

const { getErrorCode } = require('../config/helpers');


exports.createCharge = async (req, res) => {
    try {
        const token = req.body
        
        const culqi = new Culqi({
            privateKey: 'sk_test_X1Wkaiiv7kRqlDgL'
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
    
        console.log(charge.id);
               
    } catch (error) {
        console.log(error)
    }   

}