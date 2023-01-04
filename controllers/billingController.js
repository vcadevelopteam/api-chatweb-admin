const { errors, getErrorCode, axiosObservable } = require('../config/helpers');
const { executesimpletransaction } = require('../config/triggerfunctions');;
const { setSessionParameters, printException } = require('../config/helpers');

const exchangeEndpoint = process.env.EXCHANGE;

exports.sendInvoice = async (req, res) => {
    const { parameters = {} } = req.body;

    setSessionParameters(parameters, req.user, req._requestid);

    parameters.status = "ERROR";
    parameters.error = "";
    parameters.qrcode = "";
    parameters.hashcode = "";
    parameters.urlcdr = "";
    parameters.urlpdf = "";
    parameters.urlxml = "";

    try {
        const resultBD = await Promise.all([
            executesimpletransaction("QUERY_SEL_INOVICE_BY_ID", parameters),
            executesimpletransaction("QUERY_SEL_INOVICEDETAIL_BY_ID", parameters),
            executesimpletransaction("UFN_INVOICE_CORRELATIVE", parameters),
        ]);

        if (resultBD[0] instanceof Array) {
            const header = {};
            const invoice = resultBD[0][0];
            const invoiceDetail = resultBD[1];
            const invoiceCorrelative = resultBD[2][0];
            const correlative = invoiceCorrelative.p_correlative;

            header.CodigoAnexoEmisor = invoice.annexcode;
            header.CodigoFormatoImpresion = invoice.printingformat;
            header.CodigoMoneda = invoice.currency;
            header.CodigoRucReceptor = invoice.receiverdoctype;
            header.CodigoOperacionSunat = invoice.sunatopecode;
            header.CodigoUbigeoEmisor = invoice.issuerubigeo;
            header.EnviarSunat = invoice.sendtosunat;
            header.MailEnvio = invoice.receivermail;
            header.MontoTotal = invoice.totalamount;
            header.MontoTotalGravado = invoice.subtotal;
            header.MontoTotalIgv = invoice.taxes;
            header.NombreComercialEmisor = invoice.issuertradename;
            header.RazonSocialEmisor = invoice.issuerbusinessname;
            header.RazonSocialReceptor = invoice.receiverbusinessname;
            header.CorrelativoDocumento = correlative.toString().padStart(8, '0');
            header.RucEmisor = invoice.issuerruc;
            header.NumeroDocumentoReceptor = invoice.receiverdocnum;
            header.NumeroSerieDocumento = (invoice.invoicetype === '01' ? `F${invoice.serie}` : `B${invoice.serie}`);
            header.RetornaPdf = invoice.returnpdf;
            header.RetornaXmlSunat = invoice.returnxmlsunat;
            header.RetornaXml = invoice.returnxml;
            header.TipoCambio = invoice.exchangerate;
            header.DireccionFiscalEmisor = invoice.issuerfiscaladdress;
            header.DireccionFiscalReceptor = invoice.receiverfiscaladdress;
            header.VersionXml = invoice.xmlversion;
            header.VersionUbl = invoice.ublversion;
            header.TipoDocumento = invoice.invoicetype;
            header.TipoRucEmisor = invoice.emittertype;
            header.Endpoint = invoice.sunaturl;
            header.Username = invoice.sunatusername;
            header.Token = invoice.token;
            header.FechaEmision = new Date(new Date(invoice.invoicedate).setHours(5)).toISOString().substring(0, 10);

            header.ProductList = invoiceDetail.map(x => ({
                CantidadProducto: x.quantity,
                CodigoProducto: x.productcode,
                AfectadoIgv: x.hasigv,
                TipoVenta: x.saletype,
                TributoIgv: x.igvtribute,
                UnidadMedida: x.measureunit,
                IgvTotal: x.totaligv,
                MontoTotal: x.totalamount,
                TasaIgv: x.igvrate,
                PrecioProducto: x.productprice,
                DescripcionProducto: x.productdescription,
                PrecioNetoProducto: x.productnetprice,
                ValorNetoProducto: x.productnetworth,
            }));

            const resSendInvoice = await axiosObservable({
                data: header,
                method: 'post',
                url: `${process.env.BRIDGE}processmifact/sendinvoice`,
                _requestid: req._requestid,
            });
            if (resSendInvoice.data.success) {
                parameters.status = "INVOICED";
                parameters.qrcode = resSendInvoice.data.result.cadenaCodigoQr;
                parameters.hashcode = resSendInvoice.data.result.codigoHash;
                parameters.urlcdr = resSendInvoice.data.result.urlCdrSunat;
                parameters.urlpdf = resSendInvoice.data.result.urlPdf;
                parameters.urlxml = resSendInvoice.data.result.urlXml;
            } else {
                parameters.error = resSendInvoice.data.operationMessage;
            }

            await executesimpletransaction("UFN_INVOICE_SUNAT", parameters)

            if (parameters.status === "INVOICED") {
                return res.json({ error: false, success: true });
            } else {
                return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));
            }
        } else {
            return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
        }
    } catch (exception) {
        return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}

exports.exchangeRate = async (req, res) => {
    const { parameters = {} } = req.body;

    setSessionParameters(parameters, req.user, req._requestid);

    try {
        var exchangeRate = 0;
        var retryNumber = 0;

        var currentDate = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));

        currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));

        while (exchangeRate === 0 && retryNumber <= 20) {
            try {
                const requestGetExchange = await axiosObservable({
                    method: 'get',
                    url: `${retryNumber === 0 ? exchangeEndpoint.split('?')[0] : (exchangeEndpoint + currentDate.toISOString().split('T')[0])}`,
                    _requestid: req._requestid,
                });

                if (requestGetExchange.data.venta) {
                    exchangeRate = requestGetExchange.data.venta;
                }
                else {
                    currentDate = new Date(currentDate.setDate(currentDate.getDate() - 1));
                }
            }
            catch (exception) {
                currentDate = new Date(currentDate.setDate(currentDate.getDate() - 1));
            }

            retryNumber++;

            await sleep(4000);
        }

        if (exchangeRate) {
            return res.json({
                exchangeRate: exchangeRate,
                success: true
            });
        }
        else {
            return res.status(400).json({
                exchangeRate: exchangeRate,
                success: false
            });
        }
    } catch (exception) {
        return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}

async function sleep(msec) {
    return new Promise(resolve => setTimeout(resolve, msec));
}