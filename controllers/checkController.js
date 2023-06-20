const sequelize = require('../config/database');
const { getErrorSeq, axiosObservable } = require('../config/helpers');
const { QueryTypes } = require('sequelize');

exports.auth = async (req, res) => {
    try {
        return res.json({ error: false, success: true, data: [] });
    }
    catch (err) {
        return res.json({ error: true, success: false, data: [] });
    }
}

exports.load = async (req, res) => {
    const query = 'SELECT 1'

    let result = await sequelize.query(query, { type: QueryTypes.SELECT }).catch(err => getErrorSeq(err));

    if (result instanceof Array) {
        return res.json({ error: false, success: true, data: result });
    }
    else
        return res.status(result.rescode).json(result);
}

exports.version = async (_, res) => {
    return res.json({
        version: process.env.RELEASE_VERSION,
        version_android: process.env.VERSION_APP_ANDROID,
        version_ios: process.env.VERSION_APP_IOS,
        date: process.env.RELEASE_DATE
    });
}

exports.recaptcha = async (req, res) => {
    const data = { secret: "6LdU-R4lAAAAAMew8ZJ_bxj0uxcX9mk3Z0bO_F5D", response: req.body.response };
    
    try {
        const response = await axiosObservable({
            url: `https://www.google.com/recaptcha/api/siteverify`,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            data: new URLSearchParams(Object.entries(data)).toString(),
            method: "POST",
            _requestid: req._requestid,
        })
        return res.json(response.data);
    } catch (error) {
        return res.json({ message: error.message, detail: error.stack, error });
    }
}