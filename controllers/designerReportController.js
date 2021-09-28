const { buildQueryDynamic } = require('../config/triggerfunctions');
const { setSessionParameters } = require('../config/helpers');



exports.drawReport = async (req, res) => {

    const { columns, filters, parameters = {} } = req.body;

    setSessionParameters(parameters, req.user);
    
    const result = await buildQueryDynamic(columns, filters, parameters);

    if (!result.error)
        return res.json(result);
    else
        return res.status(result.rescode).json(result);
}

exports.exportReport = async (req, res) => {
    const { columns, filters, parameters = {} } = req.body;

    setSessionParameters(parameters, req.user);
    
    const result = await buildQueryDynamic(columns, filters, parameters);
}