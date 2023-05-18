let ejs = require("ejs");
let path = require("path");
const pdf = require('html-pdf')
const { uploadBufferToCos } = require('../config/triggerfunctions');
const logger = require('../config/winston');
const { executesimpletransaction } = require('../config/triggerfunctions');
const { errors, setSessionParameters, getErrorCode, formatDecimals } = require('../config/helpers');
const { v4: uuidv4 } = require('uuid');

let options = {
    format: 'A4',
    orientation: 'portrait',
    border: 0,
};

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
                pdf.create(data, options).toBuffer(async (error1, buffer) => {
                    if (error1) {
                        logger.child({ _requestid: req._requestid, error: { detail: error1.stack, message: error1.message } }).error(`Request to ${req.originalUrl}: ${error1.message}`);
                        return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
                    }
                    const rr = await uploadBufferToCos(req._requestid, buffer, "application/x-pdf", `${reportname}.pdf`);
                    return res.json({ error: false, success: true, url: rr.url });
                })
            }
        });
    }
    else
        return res.status(result.rescode).json({ ...result, key });
}

//corpid, orgid, personid, limit
exports.drawCardOrder = async (req, res) => {
    const { reportname, parameters } = req.body;

    const result = await executesimpletransaction("QUERY_ORDER_DETAIL_CARD", parameters);

    if (result instanceof Array) {
        if (result.length === 0) {
            return res.json({ error: false, success: true, url: "", code: "WITHOUT-ORDERS" });
        } else {
            const ff = result.reduce((acc, item) => ({
                ...acc,
                [`item${item.orderid}`]: {
                    ...item,
                    productmetaid: undefined,
                    producttitle: undefined,
                    quantity: undefined,
                    unitprice: undefined,
                    detailamount: undefined,
                    orderid: `${item.orderid}`.padStart(2, "7"),
                    createdate: new Date(item.createdate).toLocaleString("es-PE"),
                    orderamount: `${item.currency} ${formatDecimals(item.orderamount.toFixed(2))}`,
                    detail: [
                        ...(acc[`item${item.orderid}`]?.detail || []),
                        { ...item, subtotal: `${item.currency} ${formatDecimals(item.detailamount.toFixed(2))}` },
                    ]
                }
            }), {});
            const listx = Object.values(ff);
            const aa = listx.map((x, i) => ({
                ...x,
                heightContainer: listx.length === i + 1 ? "750px" : "812px"
            }))

            ejs.renderFile(path.join('./views/', "card-order.html"), {
                data: aa
            }, (error, data) => {
                if (error) {
                    logger.child({ _requestid: req._requestid, error: { detail: error.stack, message: error.message } }).error(`Request to ${req.originalUrl}: ${error.message}`);
                    return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
                } else {
                    const newdata = data.replace(/(\bdefaultheight\b)(?!.*[\r\n]*.*\1)/, "750px");

                    pdf.create(newdata, options).toBuffer(async (error1, buffer) => {
                        if (error1) {
                            logger.child({ _requestid: req._requestid, error: { detail: error1.stack, message: error1.message } }).error(`Request to ${req.originalUrl}: ${error1.message}`);
                            return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
                        }
                        const rr = await uploadBufferToCos(req._requestid, buffer, "application/x-pdf", `${reportname}.pdf`);
                        return res.json({ error: false, success: true, url: rr.url });
                    })
                }
            });
        }
    }
    else
        return res.status(result.rescode).json({ ...result, key });
}

exports.drawCardDynamic = async (req, res) => {
    try {
        const { templateid, variables, corpid, orgid, fileType } = req.body;

        const result = await executesimpletransaction("QUERY_GET_MESSAGETEMPLATE", { hsmtemplateid: templateid, corpid, orgid });

        if (result instanceof Array) {
            if (result.length === 0) {
                return res.json({ error: false, success: true, url: "", code: "WITHOUT-TEMPLATE" });
            } else {
                let template = result[0].body;
                const filename = (result[0].name || "").replace(/\r?\n|\r/g, '').replace(/[^a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ\s]+/g, '') || "file-lar"
                variables.forEach(x => { template = template.replace(new RegExp(`{{${x.Key}}}`, 'gi'), x.Value) });

                const data = ejs.render(template, {});

                pdf.create(data, { ...options, type: (fileType === "image" ? "jpeg" : undefined) }).toBuffer(async (error1, buffer) => {
                    if (error1) {
                        logger.child({ _requestid: req._requestid, error: { detail: error1.stack, message: error1.message } }).error(`Request to ${req.originalUrl}: ${error1.message}`);
                        return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
                    }
                    const rr = await uploadBufferToCos(req._requestid, buffer, (fileType === "image" ? "image/jpeg" : "application/pdf"), `${uuidv4()}/${filename}.${fileType === "image" ? "jpeg" : "pdf"}`);
                    return res.json({ error: false, success: true, url: rr.url });
                })
            }
        }
        else
            return res.status(result.rescode).json({ ...result, key });
    } catch (exception) {
        return getErrorCode(errors.UNEXPECTED_ERROR, exception, "Executing drawCardDynamic");
    }
}

//corpid, orgid, personid, limit
exports.drawPDFSBS = async (req, res) => {
    const { parameters, reportname} = req.body;

    try {
        // parameters.detalle
        // parameters.persona_natural

        const data = parameters.detalle.map((x, i) => ({
            ...x,
            fecha_reporte: new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' }),
            ...parameters.persona_natural,
            heightContainer: parameters.detalle.length !== i + 1 ? "always" : "avoid"
        }))

        ejs.renderFile(path.join('./views/', "debt-report.html"), {
            data
        }, (error, data) => {
            if (error) {
                logger.child({ _requestid: req._requestid, error: { detail: error.stack, message: error.message } }).error(`Request to ${req.originalUrl}: ${error.message}`);
                return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
            } else {
                pdf.create(data, options).toBuffer(async (error1, buffer) => {
                    if (error1) {
                        logger.child({ _requestid: req._requestid, error: { detail: error1.stack, message: error1.message } }).error(`Request to ${req.originalUrl}: ${error1.message}`);
                        return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
                    }
                    const rr = await uploadBufferToCos(req._requestid, buffer, "application/x-pdf", `${uuidv4()}/reporte_deudas.pdf`);
                    return res.json({ error: false, success: true, url: rr.url });
                })
            }
        });
    } catch (exception) {
        const result = getErrorCode(errors.UNEXPECTED_ERROR, exception, "Executing drawPDFSBS");
        return res.status(result.rescode).json({ ...result });
    }
}