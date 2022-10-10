const { errors, getErrorCode, axiosObservable } = require('../config/helpers');

exports.geocode = async (req, res) => {
    const { lat, lng } = req.query;

    const APIKEY = process.env.APIKEY_GMAPS;

    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${APIKEY}`;

        const response = await axiosObservable({
            url: url,
            method: "get",
            _requestid: req._requestid,
        });

        if (response.data && response.data.status === "OK") {
            return res.json(response.data);
        }

        return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
    } catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}