require('dotenv').config();
const axios = require('axios')
const { errors, getErrorCode } = require('../config/helpers');

exports.getLeads = async (req, res) => {
    const { parameters = {} } = req.body;
    try {
        const resBridge = await axios.post(
            `${process.env.BRIDGE}processzyxme/getleadbypersonid`,
            { personId: parameters.personid }
        );
        if (resBridge.data && resBridge.data.success) {
            return res.json({ error: false, success: true, data: JSON.parse(resBridge.data.leadData) });
        }
        return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
    } catch (error) {
        console.log(error)
        return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
    }
}