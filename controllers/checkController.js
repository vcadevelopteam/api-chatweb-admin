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
    console.log(req.body)
    const data = { secret: req.body.secret, response: req.body.token };
    const response = axiosObservable({
        url: `https://www.google.com/recaptcha/api/siteverify`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data),
        method: "POST",
        _requestid: req._requestid,
    })
    return res.json(response);
}