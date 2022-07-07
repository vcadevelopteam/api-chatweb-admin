const { v4: uuidv4 } = require('uuid');
const ipsAllowed = (process.env.IPS_ALLOWED || '').split(',');

module.exports = async function (req, res, next) {
    req._requestid = uuidv4();

    return next();
    let origin = req.headers['origin'];
    try {
        if (!!origin) {
            next();
        }
        else {
            if (ipsAllowed.includes(req.ip)) {
                next();
            }
            else {
                return res.status(401).json({ message: 'Ip inválida' });
            }
        }
    } catch (error) {
        res.status(401).json({ message: 'Origen inválido' });
    }
}