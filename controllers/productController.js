const { getErrorCode } = require("../config/helpers");
const { executesimpletransaction } = require("../config/triggerfunctions");
const { getFileRequest, extractDataFile } = require("../config/productCatalog.helper");
// var https = require('https');

// const agent = new https.Agent({
//     rejectUnauthorized: false
// });

exports.import = async (req, res) => {
    try {
        const { corpid, orgid, metacatalogid, url, username, isxml, override } = req.body;

        let isvalid = true;

        let file_response_request = await getFileRequest({
            method: "get",
            url: url,
        });

        if (file_response_request.status === 200) {
            let dataToInsert = extractDataFile(isxml, file_response_request.data, metacatalogid, override);

            if (dataToInsert) {
                if (isvalid || override) {
                    const productCatalog_result = await executesimpletransaction("UFN_PRODUCTCATALOG_INS_ARRAY", {
                        corpid,
                        orgid,
                        metacatalogid,
                        username: username || "admin",
                        table: JSON.stringify(dataToInsert),
                        _requestid: req._requestid,
                    });

                    return res.json({ success: true, data: productCatalog_result });
                } else {
                    return res.json({ success: false, code: "productimportmissing" });
                }
            } else {
                return res.json({ success: false, code: "productimportmissing" });
            }
        } else {
            return res.json({ success: false, code: "productimportalert" });
        }
    } catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
};

exports.create = async (req, res) => {
    const { corpid, orgid, title, descriptionshort, description, category, saleprice, imagelink, status } = req.body;

    try {
        const insertData = await executesimpletransaction("UFN_API_PRODUCTCATALOG_INS", {
            corpid,
            orgid,
            title,
            descriptionshort,
            description,
            category,
            saleprice,
            imagelink,
            status,
            metacatalogid: 0,
            type: "NINGUNO",
            username: "admin",
        });

        if (!(insertData instanceof Array)) {
            return res.status(500).json(getErrorCode(insertData.code || "UNEXPECTED_ERROR"));
        }

        return res.json({ error: false, success: true, data: { productid: insertData[0].productid } });
    } catch (exception) {
        return res.status(500).json({ message: "Error al procesar el registro.", error: true, success: false });
    }
};

exports.createorder = async (req, res) => {
    const {
        corpid,
        orgid,
        conversationid,
        personid,
        personcommunicationchannel,
        status,
        currency = "PEN",
        amount = 0,
        paymentstatus,
        paymentref,
        deliverytype,
        deliveryaddress,
    } = req.body;
    try {
        const insertData = await executesimpletransaction("UFN_API_ORDER_INS", {
            corpid,
            orgid,
            conversationid,
            personid,
            personcommunicationchannel,
            status,
            currency,
            amount: 0,
            paymentstatus,
            paymentref,
            deliverytype,
            deliveryaddress,
            username: "admin",
        });

        if (!(insertData instanceof Array)) {
            return res.status(500).json(getErrorCode(insertData.code || "UNEXPECTED_ERROR"));
        }

        return res.json({
            error: false,
            success: true,
            data: { ordernumber: insertData[0].ordernumber, orderid: insertData[0].orderid },
        });
    } catch (exception) {
        return res.status(500).json({ message: "Error al procesar el registro.", error: true, success: false });
    }
};

exports.createorderitem = async (req, res) => {
    const {
        corpid,
        orgid,
        orderid,
        conversationid,
        personid,
        personcommunicationchannel,
        description,
        productid,
        type,
        title,
        imagelink,
        quantity,
        currency = "PEN",
        unitprice,
        amount,
    } = req.body;
    try {
        const insertData = await executesimpletransaction("UFN_API_ORDERLINE_INS", {
            corpid,
            orgid,
            orderid,
            conversationid,
            personid,
            personcommunicationchannel,
            description,
            productid,
            type,
            title,
            imagelink,
            quantity,
            currency,
            unitprice,
            amount,
            username: "admin",
        });

        if (!(insertData instanceof Array)) {
            return res.status(500).json(getErrorCode());
        }

        return res.json({ error: false, success: true, data: "Actualizado correctamente." });
    } catch (exception) {
        return res.status(500).json({ message: "Error al procesar el registro.", error: true, success: false });
    }
};

exports.getinfo = async (req, res) => {
    const { corpid, orgid, productid } = req.body;

    try {
        const data = await executesimpletransaction("UFN_API_PRODUCTCATALOG_SEL", {
            corpid,
            orgid,
            productid,
        });

        if (!(data instanceof Array)) {
            return res.status(500).json(getErrorCode(insertData.code || "UNEXPECTED_ERROR"));
        }

        return res.json({ error: false, success: true, data });
    } catch (exception) {
        return res.status(500).json({ message: "Error al procesar el registro.", error: true, success: false });
    }
};
