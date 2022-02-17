const axios = require('axios')
const { errors, getErrorCode } = require('../config/helpers');

exports.geocode = async (req, res) => {
    const { lat, lng } = req.query;
    
    const APIKEY = process.env.APIKEY_GMAPS;

    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${APIKEY}`;

        const response = await axios.get(url);

        if (response.data && response.data.status === "OK") {
            return res.json(response.data);
        }

    } catch (error) {
        console.log(error)
        return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
    }

    return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
}