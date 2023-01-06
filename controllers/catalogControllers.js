const { getErrorCode, axiosObservable } = require('../config/helpers');

const axios = require('axios');
const genericfunctions = require('../config/genericfunctions');
const triggerfunctions = require('../config/triggerfunctions');

const bridgeEndpoint = process.env.BRIDGE;

const metaBusinessIns = async (corpid, orgid, id, businessid, businessname, accesstoken, userid, userfullname, graphdomain, description, status, type, username, operation, requestid) => {
    const queryResult = await triggerfunctions.executesimpletransaction("UFN_METABUSINESS_INS", {
        corpid: corpid,
        orgid: orgid,
        id: id,
        businessid: businessid,
        businessname: businessname,
        accesstoken: accesstoken,
        userid: userid,
        userfullname: userfullname,
        graphdomain: graphdomain,
        description: description,
        status: status,
        type: type,
        username: username,
        operation: operation,
        _requestid: requestid,
    });

    if (queryResult instanceof Array) {
        return queryResult;
    }

    return null;
}

const metaBusinessSel = async (corpid, orgid, id, requestid) => {
        const queryResult = await triggerfunctions.executesimpletransaction("UFN_METABUSINESS_SEL", {
            corpid: corpid,
            orgid: orgid,
            id: id,
            _requestid: requestid,
        });
        if (queryResult instanceof Array) {
            return queryResult;
        }
    
        return null;
}

const metacatalogins = async (corpid, orgid, metabusinessid, id, catalogid, catalogname, catalogdescription, catalogtype, description, status, type, username, operation) => {
    const queryResult = await triggerfunctions.executesimpletransaction("UFN_METACATALOG_INS", {
        corpid: corpid,
        orgid: orgid,
        metabusinessid: metabusinessid,
        id: id,
        catalogid: catalogid,
        catalogname: catalogname,
        catalogdescription: catalogdescription,
        catalogtype: catalogtype,
        description: description,
        status: status,
        type: type, 
        username: username,
        operation: operation,
      
    });
    if (queryResult instanceof Array) {
        return queryResult;
    }

    return null;
}

exports.getBusinessList = async (request, response) => {
    try {
        const { corpid, orgid, usr } = request.user;
        const { accesstoken, appid, graphdomain, userfullname, userid } = request.body;

        var responsedata = genericfunctions.generateResponseData(request._requestid);

        if (accesstoken && appid) {
            const requestGetBusinessList = await axiosObservable({
                data: {
                    accessToken: accesstoken,
                    appId: appid,
                    linkType: 'GETBUSINESSLIST',
                },
                method: 'post',
                url: `${bridgeEndpoint}processlaraigo/facebook/managefacebooklink`,
                _requestid: request._requestid,
            });

            if (requestGetBusinessList.data.success) {
                if (requestGetBusinessList.data.businessData) {
                    if (requestGetBusinessList.data.businessData.data) {
                        for (const businessdata of requestGetBusinessList.data.businessData.data) {
                            await metaBusinessIns(corpid, orgid, 0, businessdata.id, businessdata.name, requestGetBusinessList.data.longToken, userid, userfullname, graphdomain, '', 'ACTIVO', '', usr, 'INSERT', request._requestid);
                        }
                    }
                }
            }
        }

        let businessresponse = await metaBusinessSel(corpid, orgid, 0, request._requestid);

        if (businessresponse) {
            businessresponse = businessresponse.map(({ accesstoken, ...data }) => { return data; });
        }

        if (businessresponse) {
            responsedata = genericfunctions.changeResponseData(responsedata, null, businessresponse, null, 200, true);
        }
        else {
            responsedata = genericfunctions.changeResponseData(responsedata, 'catalog_error_businesslist', null, 'Error retrieving business list', 400, false);
        }

        return response.status(responsedata.status).json(responsedata);
    }
    catch (exception) {
        return response.status(500).json({ ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid), msg: exception.message });
    }
}


exports.managecatalog = async (request, response) => {
    
    //const { corpid, orgid } = request.user;
    
   console.log(request.body)
    
   const {operation, metabusinessid } = request.body;
   var responsedata = genericfunctions.generateResponseData(request._requestid);

   let businessresponse = await metaBusinessSel(1, 1, metabusinessid, request._requestid);
   let accessToken = businessresponse[0].accesstoken;
   let businessid = businessresponse[0].businessid;
   const config = { headers: { Authorization: 'Bearer ' + accessToken, } };


   switch (operation) {
       case "CREATE":
           try {
               const {catalogdescription, catalogname , catalogtype, description, id, operation, status, type} = request.body;
       
               const url = `https://graph.facebook.com/${businessid}/owned_product_catalogs`;
       
               const result = await axios.post(url, {name: catalogname}, config);

               const metacatalogid = result.data.id

               let catalogResponse = await metacatalogins(1,1,metabusinessid,id,metacatalogid,catalogname,catalogdescription,catalogtype,description,status,type,'KEVIN',operation);

               responsedata = genericfunctions.changeResponseData(responsedata, catalogResponse, result.data, null, 200, true);

               return response.status(responsedata.status).json(responsedata);
               
           } catch (exception) {
               console.log(exception)
               return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
               
           }
           break;
       case "EDIT":
           try {
               const { catalogid } = req.body;

               const url = `https://graph.facebook.com/${catalogid}`;
       
               const result = await axios.get(url, config);
               responsedata = genericfunctions.changeResponseData(responsedata, null, result.data, null, 200, true);

               return response.status(responsedata.status).json(responsedata);
               
           } catch (error) {
               return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
           }
       break;
       case "DELETE":
           try {
               const { catalogid } = request.body;

               const url = `https://graph.facebook.com/${catalogid}`;
       
               //const result = await axios.delete(url, config);

               let catalogResponse = await metacatalogins(1,1,metabusinessid,3,catalogid,'sdadasdasdasd','catalogdescription','catalogtype','','ELIMINADO','','KEVIN','DELETE');


               responsedata = genericfunctions.changeResponseData(responsedata, null, catalogResponse, null, 200, true);
               return response.status(responsedata.status).json(responsedata);
               
           } catch (exception) {
               console.log(exception)
               return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
           }
       break;
       case "ALL":
           try {

               const url = `https://graph.facebook.com/${businessid}/owned_product_catalogs`;
       
               const result = await axios.get(url, config);

               responsedata = genericfunctions.changeResponseData(responsedata, null, result.data, null, 200, true);
               return response.status(responsedata.status).json(responsedata);
               
           } catch (error) {
               return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
           }
       break;
       default:
           break;
   }

}

exports.getAllBusiness = async (req, res) => {
    try {

        const token = "EAAeSP9wcsHQBAFZB58CnwsX31r8tHOA1nd6ZBr1aZAmZBqZCldYt6RjrEOlnLiJkZAZCwtYJpiySMB4Q5ohqglNb4rBAZBI48OzTAsMMizlEEwq98FZCHDkeNQbrcp5XwwvxyEKSjvgHs0GJokXroA1Ielp0MQ0x1H3DWMmbool3AVDKleJ3lXZAKt";
        const url = `https://graph.facebook.com/me/businesses`;
        const config = { headers: { Authorization: 'Bearer ' + token, } };

        const result = await axios.get(url, config);
        console.log(result.data);
        return res.status(200).json(result.data);

    } catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}
