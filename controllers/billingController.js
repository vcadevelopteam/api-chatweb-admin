require('dotenv').config();
const axios = require('axios')
const { errors, getErrorCode } = require('../config/helpers');
const { executesimpletransaction } = require('../config/triggerfunctions');;
const { setSessionParameters } = require('../config/helpers');

exports.sendInvoice = async (req, res) => {
    const { parameters = {} } = req.body;
    setSessionParameters(parameters, req.user);

    try {
        // process.env.BRIDGE
        // const result = await executesimpletransaction("UFN_LEADBYPERSONCOMMUNICATIONCHANNEL_SEL", parameters);

        const requestDeleteSmooch = await axios({
            data: {
                // linkType: parameters.type === 'ANDR' ? 'ANDROIDREMOVE' : 'IOSREMOVE',
                applicationId: parameters.communicationchannelsite,
                integrationId: parameters.integrationid
            },
            method: 'post',
            url: `${process.env.BRIDGE}processmifact/sendinvoice`
        });

        // if (result instanceof Array)
        //     return res.json({ error: false, success: true, data: result });
        // else
        //     return res.status(result.rescode).json(result);

    } catch (error) {
        console.log(error)
        return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
    }
}