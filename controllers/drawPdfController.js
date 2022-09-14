let ejs = require("ejs");
let path = require("path");
const pdf = require('html-pdf')
const { uploadBufferToCos } = require('../config/triggerfunctions');
const logger = require('../config/winston');
const { executesimpletransaction } = require('../config/triggerfunctions');
const { errors, setSessionParameters, getErrorCode } = require('../config/helpers');


exports.draw = async (req, res) => {
    const { parameters = {}, method, template, reportname, dataonparameters = false, key } = req.body;

    setSessionParameters(parameters, req.user, req._requestid);

    const result = dataonparameters ? [parameters] : await executesimpletransaction(method, parameters, req.user.menu || {});

    if (result instanceof Array) {
        ejs.renderFile(path.join('./views/', template), {
            data: result
        }, (error, data) => {
            if (error) {
                logger.child({ _requestid: req._requestid, error: { detail: error.stack, message: error.message } }).error(`Request to ${req.originalUrl}: ${error.message}`);
                return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
            } else {
                let options = {
                    format: 'A4',
                    border: {
                        top: "10px",
                        right: "0px",
                        bottom: "10px",
                        left: "0px",
                    },
                    orientation: 'portrait',
                    zoomFactor: "0.6",
                };
                pdf.create(data, options).toBuffer(async (error1, buffer) => {
                    if (error1) {
                        logger.child({ _requestid: req._requestid, error: { detail: error1.stack, message: error1.message } }).error(`Request to ${req.originalUrl}: ${error1.message}`);
                        return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
                    }
                    const rr = await uploadBufferToCos(req._requestid, buffer, "application/zip", `${reportname}.pdf`);
                    return res.json({ error: false, success: true, url: rr.url });
                })
            }
        });
    }
    else
        return res.status(result.rescode).json({ ...result, key });
}