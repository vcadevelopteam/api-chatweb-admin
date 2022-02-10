const axios = require('axios')

exports.Location = async (req, res) => {
    const data = req.body;

    axios.post(`${process.env.SERVICES}handler/sendlocation`, data);

    res.json({ success: true });
}