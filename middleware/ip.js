const ipsAllowed = (process.env.IPS_ALLOWED || '').split(',');

module.exports = async function (req, res, next) {
    let origin = req.headers['origin'];
    console.log(req.ips)

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