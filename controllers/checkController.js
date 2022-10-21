const sequelize = require('../config/database');
const { getErrorSeq } = require('../config/helpers');
const { QueryTypes } = require('sequelize');
const cache = require('../config/cache')();

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
    const version = (cache.get('release-version') + "").replace("releases/", "");
    const date = cache.get('release-date');

    return res.json({ error: false, success: true, data: { version, date } });
}