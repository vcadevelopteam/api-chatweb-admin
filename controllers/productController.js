const { errors, getErrorCode, axiosObservable } = require('../config/helpers');
const { executesimpletransaction } = require('../config/triggerfunctions');
const { uploadToCOS, unrar, unzip, xlsxToJSON } = require('../config/filefunctions');
// var https = require('https');

// const agent = new https.Agent({
//     rejectUnauthorized: false
// });

exports.import = async (req, res) => {
    try {
        const { corpid, orgid, url } = req.body;
        let xml_response = await axiosObservable({
            _requestid: req._requestid,
            method: "get",
            url: url,
        });
        if (xml_response.status === 200) {
            var parser = require('xml2json');
            const jsondata = JSON.parse(parser.toJson(xml_response.data));
            let simplifieddata = jsondata.rss.channel.item.map(x => {
                let customlabels = Object.keys(x).filter(y => y.indexOf("custom_label") >= 0)
                return {
                    id: parseInt(x["g:id"]) || null,
                    title: x["g:title"],
                    description: x["g:description"],
                    link: x["g:link"],
                    condition: x["g:condition"],
                    imagelink: x["g:image_link"],
                    brand: x["g:brand"],
                    availability: x["g:availability"],
                    price: x["g:price"],
                    additionalimagelink: JSON.stringify(x["g:additional_image_link"]),
                    material: x["g:material"],
                    color: x["g:color"],
                    pattern: x["g:pattern"],
                    saleprice: x["g:sale_price"],
                    labels: customlabels.map(y => typeof x[y] === "object" ? JSON.stringify(x[y]) : x[y]).join(','),
                    category: x["g:google_product_category"],
                }
            })
            const productCatalog_result = await executesimpletransaction("UFN_PRODUCTCATALOG_INS_ARRAY", {
                corpid, orgid, username: "admin", table: JSON.stringify(simplifieddata),
                _requestid: req._requestid,
            });
            res.json({ success: true, data: productCatalog_result });
        }
        else {
            res.json({ success: true, data: "File not exists" });
        }
        res.json({ success: true, data: url });
    }
    catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}