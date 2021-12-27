require('dotenv').config();
const axios = require('axios')
const { errors, getErrorCode } = require('../config/helpers');
const { executesimpletransaction } = require('../config/triggerfunctions');;
const { setSessionParameters } = require('../config/helpers');

exports.sendInvoice = async (req, res) => {
    const { parameters = {} } = req.body;
    setSessionParameters(parameters, parameters);

    try {
        const resultBD = await Promise.all([
            executesimpletransaction("QUERY_SEL_INOVICE_BY_ID", dataSesion),
            executesimpletransaction("QUERY_SEL_INOVICEDETAIL_BY_ID", dataSesion),
            executesimpletransaction("UFN_INVOICE_CORRELATIVE", dataSesion),
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
            header.NumeroSerieDocumento = invoice.serie;
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

            return res.json({ error: false, success: true, data: header });

        } else {
            return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
        }
        // const result = await executesimpletransaction("UFN_LEADBYPERSONCOMMUNICATIONCHANNEL_SEL", parameters);

        // const requestDeleteSmooch = await axios({
        //     data: {
        //         // linkType: parameters.type === 'ANDR' ? 'ANDROIDREMOVE' : 'IOSREMOVE',
        //         applicationId: parameters.communicationchannelsite,
        //         integrationId: parameters.integrationid
        //     },
        //     method: 'post',
        //     url: `${process.env.BRIDGE}processmifact/sendinvoice`
        // });

        // if (result instanceof Array)
        //     return res.json({ error: false, success: true, data: result });
        // else
        //     return res.status(result.rescode).json(result);

    } catch (error) {
        console.log(error)
        return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
    }
}