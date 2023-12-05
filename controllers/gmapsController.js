const { errors, getErrorCode, axiosObservable } = require('../config/helpers');
const { executesimpletransaction } = require('../config/triggerfunctions');

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

exports.polygonsinsertmassive = async (req, res) => {
    const corpid = req.body.corpid;
    const orgid = req.body.orgid;
    const username = req.body.username;

    const buffer = req.file.buffer;
    const json = JSON.parse(buffer.toString());

    const table = JSON.stringify([
        {
            "id": 0,
            "name": "Reparto Puente 1",
            "schedule": {},
            "polygons": [{ "latitude": 0, "longitude": 0 }],
            "operation": "INSERT"
        },
        {
            "id": 0,
            "name": "Reparto Puente 1",
            "schedule": {},
            "polygons": [{ "latitude": 0, "longitude": 0 }],
            "operation": "INSERT"
        }
    ])

    await executesimpletransaction("UFN_POLYGONS_INS_ARRAY", { corpid, orgid, username, table })

    return res.json({ json, corpid, orgid });
}
