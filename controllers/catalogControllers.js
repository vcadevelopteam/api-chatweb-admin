const { getErrorCode, axiosObservable } = require('../config/helpers');

const axios = require('axios');
const genericfunctions = require('../config/genericfunctions');
const triggerfunctions = require('../config/triggerfunctions');

const bridgeEndpoint = process.env.BRIDGE;
const facebookEndpoint = process.env.FACEBOOKAPI;

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

const metaCatalogSel = async (corpid, orgid, metabusinessid, metacatalogid, requestid) => {
    const queryResult = await triggerfunctions.executesimpletransaction("UFN_METACATALOG_SEL", {
        corpid: corpid,
        orgid: orgid,
        metabusinessid: metabusinessid,
        id: metacatalogid,
        _requestid: requestid,
    });

    if (queryResult instanceof Array) {
        return queryResult;
    }

    return null;
}

const metaCatalogIns = async (corpid, orgid, metabusinessid, id, catalogid, catalogname, catalogdescription, catalogtype, description, status, type, username, operation, requestid) => {
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
        _requestid: requestid,
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
    try {
        const { corpid, orgid, usr } = request.user;
        const { operation, metabusinessid } = request.body;

        var responsedata = genericfunctions.generateResponseData(request._requestid);

        const businessresponse = await metaBusinessSel(corpid, orgid, metabusinessid, request._requestid);

        if (businessresponse) {
            let accessToken = businessresponse[0].accesstoken;
            let businessid = businessresponse[0].businessid;

            const config = { Authorization: 'Bearer ' + accessToken };

            switch (operation) {
                case "CREATE":
                    if (accessToken) {
                        const { catalogdescription, catalogname, catalogtype, description, id, operation, status, type } = request.body;

                        const result = await axiosObservable({
                            data: {
                                description: catalogdescription,
                                name: catalogname,
                                vertical: catalogtype,
                            },
                            headers: config,
                            method: 'post',
                            url: `${facebookEndpoint}${businessid}/owned_product_catalogs?fields=name,vertical`,
                            _requestid: request._requestid,
                        });

                        if (result?.data?.id) {
                            const metacatalogid = result.data.id

                            let catalogResponse = await metaCatalogIns(corpid, orgid, metabusinessid, id, metacatalogid, catalogname, catalogdescription, catalogtype, description, status, type, usr, operation);

                            responsedata = genericfunctions.changeResponseData(responsedata, catalogResponse, result.data, null, 200, true);
                        }
                        else {
                            responsedata = genericfunctions.changeResponseData(responsedata, 'catalog_error_catalogcreate', result?.data, 'Error creating catalog', 400, false);
                        }
                    }
                    break;

                case "EDIT":
                    if (accessToken) {
                        const { catalogdescription, catalogid, catalogname, catalogtype, description, id, metabusinessid, operation, status, type } = request.body;

                        const result = await axiosObservable({
                            data: {
                                name: catalogname,
                                vertical: catalogtype
                            },
                            headers: config,
                            method: 'post',
                            url: `${facebookEndpoint}${catalogid}`,
                            _requestid: request._requestid,
                        });

                        if (result?.data) {
                            let catalogResponse = await metaCatalogIns(corpid, orgid, metabusinessid, id, catalogid, catalogname, catalogdescription, catalogtype, description, status, type, usr, operation);

                            responsedata = genericfunctions.changeResponseData(responsedata, null, catalogResponse, null, 200, true);
                        }
                        else {
                            responsedata = genericfunctions.changeResponseData(responsedata, 'catalog_error_catalogedit', result?.data, 'Error updating catalog', 400, false);
                        }
                    }
                    break;

                case "DELETE":
                    if (accessToken) {
                        const { metabusinessid, metacatalogid, catalogid, catalogname, catalogdescription, catalogtype, description, status, type } = request.body;

                        const result = await axiosObservable({
                            url: `${facebookEndpoint}${catalogid}`,
                            headers: config,
                            method: 'delete',
                            _requestid: request._requestid,
                        });

                        if (result?.data) {
                            let catalogResponse = await metaCatalogIns(corpid, orgid, metabusinessid, metacatalogid, catalogid, catalogname, catalogdescription, catalogtype, description, status, type, usr, operation);

                            responsedata = genericfunctions.changeResponseData(responsedata, null, catalogResponse, null, 200, true);
                        }
                        else {
                            responsedata = genericfunctions.changeResponseData(responsedata, 'catalog_error_catalogdelete', result?.data, 'Error deleting catalog', 400, false);
                        }
                    }
                    break;
            }
        }
        else {
            responsedata = genericfunctions.changeResponseData(responsedata, 'catalog_error_nobusiness', null, 'Business not found', 400, false);
        }

        return response.status(responsedata.status).json(responsedata);
    }
    catch (exception) {
        return response.status(500).json({ ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid), msg: exception.message });
    }
}

exports.synchrocatalog = async (request, response) => {
    try {
        const { corpid, orgid, usr } = request.user;
        const { metabusinessid } = request.body;

        var responsedata = genericfunctions.generateResponseData(request._requestid);

        const businessresponse = await metaBusinessSel(corpid, orgid, metabusinessid, request._requestid);

        if (businessresponse) {
            let accessToken = businessresponse[0].accesstoken;
            let businessid = businessresponse[0].businessid;

            const config = { headers: { Authorization: 'Bearer ' + accessToken } };

            const result = await axios.get(`${facebookEndpoint}${businessid}/owned_product_catalogs?limit=100&fields=name,description,vertical`, config);

            if (result.data) {
                const listCatalog = result.data.data;

                listCatalog.forEach(async (catalog) => {
                    await metaCatalogIns(corpid, orgid, metabusinessid, businessid, catalog.id, catalog.name, catalog.description || "", catalog.vertical, "", "ACTIVO", "", usr, "CREATE");
                });

                responsedata = genericfunctions.changeResponseData(responsedata, null, listCatalog, null, 200, true);
            }
            else {
                responsedata = genericfunctions.changeResponseData(responsedata, 'catalog_error_catalogget', result?.data, 'Error obtaining catalog list', 400, false);
            }
        }
        else {
            responsedata = genericfunctions.changeResponseData(responsedata, 'catalog_error_nobusiness', null, 'Business not found', 400, false);
        }

        return response.status(responsedata.status).json(responsedata);
    } catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}
