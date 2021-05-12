require('dotenv').config({ path: 'variables.env' });
const axios = require('axios')

const triggerfunctions = require('../config/triggerfunctions');

exports.sendMessage = async (req, res) => {
    if (req.body instanceof Object && req.body.MessageContent !== "") {
        try {
            const response = await axios({
                url: `${process.env.ANALYTICAPI}communication/SendFacebookMessage`,
                method: 'post',
                data: req.body
            });
            if (response.data.success) {
                await triggerfunctions.executesimpletransaction("UFN_UPDATE_ANSWER_FBPOST", {
                    answered: true,
                    facebookpostid: req.body.facebookpostid
                });
            }
            res.json(response.data);
        } catch (error) {
            return res.status(500).json({
                msg: "Hubo un problema, intentelo más tarde"
            });
        }
    } else {
        return res.status(500).json({
            msg: "Bad Format"
        });
    }
}

