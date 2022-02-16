const ipsAllowed = (process.env.IPS_ALLOWED || '').split(',');

module.exports = async function (req, res, next) {
    return next();
    let origin = req.headers['origin'];
    try {
        if (!!origin) {
            next();
        }
        else {
            console.log('ip', req.ip)
            console.log('x-forwarded-for:', req.headers['x-forwarded-for'])
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