const { getErrorCode, axiosObservable } = require('../config/helpers');
const { executesimpletransaction } = require('../config/triggerfunctions');
// var https = require('https');

// const agent = new https.Agent({
//     rejectUnauthorized: false
// });

exports.import = async (req, res) => {
    try {
        const { corpid, orgid, url, catalogid, catalogname } = req.body;
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
                    productid: x["g:id"] || '',
                    title: x["g:title"] || '',
                    link: x["g:link"] || '',
                    imagelink: x["g:image_link"] || '',
                    additionalimagelink: JSON.stringify(x["g:additional_image_link"]) || '',
                    brand: x["g:brand"] || '',
                    condition: x["g:condition"] || '',
                    availability: x["g:availability"] || '',
                    category: x["g:google_product_category"] || '',
                    material: x["g:material"] || '',
                    color: x["g:color"] || '',
                    pattern: x["g:pattern"] || '',
                    currency: x["g:currency"] || 'PEN',
                    price: x["g:price"] || 0.00,
                    saleprice: x["g:sale_price"] || 0.00,
                    customlabel1: x["g:custom_label_1"] || '',
                    customlabel2: x["g:custom_label_2"] || '',
                    customlabel3: x["g:custom_label_3"] || '',
                    customlabel4: x["g:custom_label_4"] || '',
                    customlabel5: x["g:custom_label_5"] || '',
                    labels: customlabels ? customlabels.map(y => typeof x[y] === "object" ? JSON.stringify(x[y]) : x[y]).join(',') : '',
                    catalogid: catalogid || '',
                    catalogname: catalogname || '',
                    description: x["g:description"],
                    status: x["g:status"] || 'ACTIVO',
                    type: x["g:type"] || '',
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
        res.json({ success: true, error: JSON.stringify(exception) });
    }
}