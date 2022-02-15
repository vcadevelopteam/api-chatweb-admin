const ipsAllowed = (process.env.IPS_ALLOWED || '').split(',');

module.exports = async function (req, res, next) {
    let origin = req.headers['origin'];
    console.log('ips:', req.ips)
    console.log('x-forwarded-for:', req.headers['x-forwarded-for'])
    console.log('remoteAddress:', req.connection.remoteAddress)

    try {
        if (!!origin) {
            next();
        }
        else {
            console.log(req.ip)
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