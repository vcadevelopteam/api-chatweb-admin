const { getErrorCode } = require('../config/helpers');
const { executesimpletransaction } = require('../config/triggerfunctions');
const { getFileRequest, extractDataFile } = require('../config/productCatalog.helper');
// var https = require('https');

// const agent = new https.Agent({
//     rejectUnauthorized: false
// });

exports.import = async (req, res) => {
    try {
        let isvalid = true;
        const { corpid, orgid, url, catalogid, catalogname, username, isxml } = req.body;
        
        let file_response_request = await getFileRequest({
            method: 'get',
            url: url
        });
        
        if (file_response_request.status === 200) {
            let dataToInsert = extractDataFile(isxml, file_response_request.data, catalogid, catalogname, isvalid);
            
            if(isvalid){
                const productCatalog_result = await executesimpletransaction("UFN_PRODUCTCATALOG_INS_ARRAY", {
                    corpid, orgid, catalogid, catalogname, username: username || "admin", table: JSON.stringify(dataToInsert),
                    _requestid: req._requestid,
                });

                res.json({ success: true, data: productCatalog_result });
            } else {
            res.json({ success: false, msg: 'productimportmissing' });
            }             
            
        }
        else {
            res.json({ success: false, data: "productimportalert" });
        }
        res.json({ success: true, data: url });
    }
    catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}