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

const metaCatalogSel = async (corpid, orgid, metabusinessid, id, requestid) => {
    const queryResult = await triggerfunctions.executesimpletransaction("UFN_METACATALOG_SEL", {
        corpid: corpid,
        orgid: orgid,
        metabusinessid: metabusinessid,
        id: id,
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

const productCatalogInsArray = async (corpid, orgid, metacatalogid, username, table, requestid) => {
    const queryResult = await triggerfunctions.executesimpletransaction("UFN_PRODUCTCATALOG_INS_ARRAY", {
        corpid: corpid,
        metacatalogid: metacatalogid,
        orgid: orgid,
        table: table,
        username: username,
        _requestid: requestid,
    });

    if (queryResult instanceof Array) {
        return queryResult;
    }

    return null;
}

const productCatalogIns = async (corpid, orgid, metacatalogid, id, productid, retailerid, title, description, descriptionshort, availability, category, condition, currency, price, saleprice, link, imagelink, additionalimagelink, brand, color, gender, material, pattern, size, datestart, datelaunch, dateexpiration, labels, customlabel0, customlabel1, customlabel2, customlabel3, customlabel4, reviewstatus, status, type, username, operation, requestid) => {
    const queryResult = await triggerfunctions.executesimpletransaction("UFN_PRODUCTCATALOG_INS", {
        corpid: corpid,
        orgid: orgid,
        metacatalogid: metacatalogid,
        id: id,
        productid: productid,
        retailerid: retailerid,
        title: title,
        description: description,
        descriptionshort: descriptionshort,
        availability: availability,
        category: category,
        condition: condition,
        currency: currency,
        price: price,
        saleprice: saleprice,
        link: link,
        imagelink: imagelink,
        additionalimagelink: additionalimagelink,
        brand: brand,
        color: color,
        gender: gender,
        material: material,
        pattern: pattern,
        size: size,
        datestart: datestart,
        datelaunch: datelaunch,
        dateexpiration: dateexpiration,
        labels: labels,
        customlabel0: customlabel0,
        customlabel1: customlabel1,
        customlabel2: customlabel2,
        customlabel3: customlabel3,
        customlabel4: customlabel4,
        reviewstatus: reviewstatus,
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

exports.manageCatalog = async (request, response) => {
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
                case "INSERT":
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
                            url: `${facebookEndpoint}${businessid}/owned_product_catalogs?access_token=${accessToken}`,
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
                            url: `${facebookEndpoint}${catalogid}?access_token=${accessToken}`,
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
                            url: `${facebookEndpoint}${catalogid}?access_token=${accessToken}`,
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

exports.synchroCatalog = async (request, response) => {
    try {
        const { corpid, orgid, usr } = request.user;
        const { metabusinessid } = request.body;

        var responsedata = genericfunctions.generateResponseData(request._requestid);

        const businessresponse = await metaBusinessSel(corpid, orgid, metabusinessid, request._requestid);

        if (businessresponse) {
            let accessToken = businessresponse[0].accesstoken;
            let businessid = businessresponse[0].businessid;

            const config = { headers: { Authorization: 'Bearer ' + accessToken } };

            const result = await axiosObservable({
                headers: config,
                method: 'get',
                url: `${facebookEndpoint}${businessid}/owned_product_catalogs?limit=100&fields=name,description,vertical&access_token=${accessToken}`,
                _requestid: request._requestid,
            });

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
        return response.status(500).json({ ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid), msg: exception.message });
    }
}

exports.manageProduct = async (request, response) => {
    try {
        const { corpid, orgid, usr } = request.user;
        const { operation, metacatalogid } = request.body;

        var responsedata = genericfunctions.generateResponseData(request._requestid);

        var responsedata = genericfunctions.generateResponseData(request._requestid);

        const catalogresponse = await metaCatalogSel(corpid, orgid, 0, metacatalogid, request._requestid);

        if (catalogresponse) {
            const businessresponse = await metaBusinessSel(corpid, orgid, catalogresponse[0].metabusinessid, request._requestid);

            if (businessresponse) {
                let accessToken = businessresponse[0].accesstoken;
                let catalogid = catalogresponse[0].catalogid;

                switch (operation) {
                    case "CREATE":
                    case "INSERT":
                        if (accessToken) {
                            const { productid, title, description, descriptionshort, availability, category, condition, currency, price, saleprice, link, imagelink, additionalimagelink, brand, color, gender, material, pattern, size, datestart, datelaunch, dateexpiration, labels, customlabel0, customlabel1, customlabel2, customlabel3, customlabel4, reviewstatus, status, type } = request.body;

                            const config = { headers: { Authorization: 'Bearer ' + accessToken } };

                            const result = await axiosObservable({
                                data: JSON.parse(JSON.stringify({
                                    retailer_id: productid || null,
                                    name: title || null,
                                    description: description || null,
                                    short_description: descriptionshort || null,
                                    availability: availability || null,
                                    category: category || null,
                                    condition: condition || null,
                                    currency: currency || null,
                                    price: (price * 100) || null,
                                    sale_price: (saleprice * 100) || null,
                                    url: link || null,
                                    image_url: imagelink || null,
                                    additional_image_urls: additionalimagelink || null,
                                    brand: brand || null,
                                    color: color || null,
                                    gender: gender || null,
                                    material: material || null,
                                    pattern: pattern || null,
                                    size: size || null,
                                    start_date: datestart || null,
                                    launch_date: datelaunch || null,
                                    expiration_date: dateexpiration || null,
                                    custom_label_0: customlabel0 || null,
                                    custom_label_1: customlabel1 || null,
                                    custom_label_2: customlabel2 || null,
                                    custom_label_3: customlabel3 || null,
                                    custom_label_4: customlabel4 || null,
                                }, (k, v) => v ?? undefined)),
                                headers: config,
                                method: 'post',
                                url: `${facebookEndpoint}${catalogid}/products?access_token=${accessToken}`,
                                _requestid: request._requestid,
                            });

                            if (result?.data?.id) {
                                const productcatalogid = result.data.id

                                let catalogResponse = await productCatalogIns(corpid, orgid, metacatalogid, 0, productid, productcatalogid, title, description, descriptionshort, availability, category, condition, currency, price, saleprice, link, imagelink, additionalimagelink, brand, color, gender, material, pattern, size, datestart, datelaunch, dateexpiration, labels, customlabel0, customlabel1, customlabel2, customlabel3, customlabel4, reviewstatus, status, type, usr, operation, request._requestid);

                                responsedata = genericfunctions.changeResponseData(responsedata, catalogResponse, result.data, null, 200, true);
                            }
                            else {
                                responsedata = genericfunctions.changeResponseData(responsedata, 'catalog_error_productcreate', result?.data, 'Error creating product', 400, false);
                            }
                        }
                        break;

                    case "EDIT":
                        if (accessToken) {
                        }
                        break;

                    case "DELETE":
                        if (accessToken) {
                        }
                        break;
                }
            }
            else {
                responsedata = genericfunctions.changeResponseData(responsedata, 'catalog_error_nobusiness', null, 'Business not found', 400, false);
            }
        }
        else {
            responsedata = genericfunctions.changeResponseData(responsedata, 'catalog_error_nocatalog', null, 'Catalog not found', 400, false);
        }

        return response.status(responsedata.status).json(responsedata);
    } catch (exception) {
        return response.status(500).json({ ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid), msg: exception.message });
    }
}

exports.synchroProduct = async (request, response) => {
    try {
        const { corpid, orgid, usr } = request.user;
        const { metacatalogid } = request.body;

        var responsedata = genericfunctions.generateResponseData(request._requestid);

        const catalogresponse = await metaCatalogSel(corpid, orgid, 0, metacatalogid, request._requestid);

        if (catalogresponse) {
            const businessresponse = await metaBusinessSel(corpid, orgid, catalogresponse[0].metabusinessid, request._requestid);

            if (businessresponse) {
                let accessToken = businessresponse[0].accesstoken;
                let catalogid = catalogresponse[0].catalogid;

                const config = { headers: { Authorization: 'Bearer ' + accessToken } };

                const result = await axiosObservable({
                    headers: config,
                    method: 'get',
                    url: `${facebookEndpoint}${catalogid}/products?fields=additional_image_urls,availability,brand,category,color,condition,currency,custom_label_0,custom_label_1,custom_label_2,custom_label_3,custom_label_4,description,expiration_date,start_date,gender,id,image_url,material,name,pattern,price,retailer_id,review_status,sale_price,short_description,size,url&limit=100&access_token=${accessToken}`,
                    _requestid: request._requestid,
                });

                if (result.data) {
                    const listCatalog = result.data.data;

                    const insertData = listCatalog?.map(data => {
                        return {
                            metacatalogid: metacatalogid || 0,
                            productid: data?.retailer_id || '',
                            retailerid: data?.id || '',
                            title: data?.name || '',
                            description: data?.description || '',
                            descriptionshort: data?.short_description || '',
                            availability: data?.availability || '',
                            category: data?.category || '',
                            condition: data?.condition || '',
                            currency: data?.currency || '',
                            price: parseFloat(data?.price?.substring(1) || 0.00),
                            saleprice: parseFloat(data?.sale_price?.substring(1) || 0.00),
                            link: data?.url || '',
                            imagelink: data?.image_url || '',
                            additionalimagelink: (data?.additional_image_urls ? data?.additional_image_urls[0] : '') || '',
                            brand: data?.brand || '',
                            color: data?.color || '',
                            gender: data?.gender || '',
                            material: data?.material || '',
                            pattern: data?.pattern || '',
                            size: data?.size || '',
                            datestart: data?.start_date || null,
                            datelaunch: data?.launch_date || null,
                            dateexpiration: data?.expiration_date || null,
                            labels: `${data?.custom_label_0},${data?.custom_label_1},${data?.custom_label_2},${data?.custom_label_3},${data?.custom_label_4}`,
                            customlabel0: data?.custom_label_0 || '',
                            customlabel1: data?.custom_label_1 || '',
                            customlabel2: data?.custom_label_2 || '',
                            customlabel3: data?.custom_label_3 || '',
                            customlabel4: data?.custom_label_4 || '',
                            reviewstatus: data?.review_status || 'approved',
                            status: 'ACTIVO',
                            type: '',
                        };
                    })

                    const productresponse = await productCatalogInsArray(corpid, orgid, metacatalogid, usr, JSON.stringify(insertData), request._requestid);

                    responsedata = genericfunctions.changeResponseData(responsedata, null, productresponse, null, 200, true);
                }
                else {
                    responsedata = genericfunctions.changeResponseData(responsedata, 'catalog_error_productget', result?.data, 'Error obtaining product list', 400, false);
                }
            }
            else {
                responsedata = genericfunctions.changeResponseData(responsedata, 'catalog_error_nobusiness', null, 'Business not found', 400, false);
            }
        }
        else {
            responsedata = genericfunctions.changeResponseData(responsedata, 'catalog_error_nocatalog', null, 'Catalog not found', 400, false);
        }

        return response.status(responsedata.status).json(responsedata);
    } catch (exception) {
        return response.status(500).json({ ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid), msg: exception.message });
    }
}

exports.deleteProduct = async (request, response) => {
    try {
        var responsedata = genericfunctions.generateResponseData(request._requestid);

        return response.status(responsedata.status).json(responsedata);
    } catch (exception) {
        return response.status(500).json({ ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid), msg: exception.message });
    }
}

exports.importProduct = async (request, response) => {
    try {
        var responsedata = genericfunctions.generateResponseData(request._requestid);

        return response.status(responsedata.status).json(responsedata);
    } catch (exception) {
        return response.status(500).json({ ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid), msg: exception.message });
    }
}

exports.downloadProduct = async (request, response) => {
    try {
        var responsedata = genericfunctions.generateResponseData(request._requestid);

        return response.status(responsedata.status).json(responsedata);
    } catch (exception) {
        return response.status(500).json({ ...getErrorCode(null, exception, `Request to ${request.originalUrl}`, request._requestid), msg: exception.message });
    }
}