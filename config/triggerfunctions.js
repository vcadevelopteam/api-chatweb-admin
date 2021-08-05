const sequelize = require('./database');
const functionsbd = require('./functions');
const columnsFunction = require('./columnsFunction');
const helper = require('./helpers');
const Sequelize = require('sequelize');

const { QueryTypes } = require('sequelize');
require('pg').defaults.parseInt8 = true;

exports.executequery = async (query) => {
    const response = {
        success: false,
        message: null,
        result: null
    }
    try {
        const result = await sequelize.query(query, {
            type: QueryTypes.SELECT,
            bind: {}
        }).catch(function (err) {
            return {
                message: err.toString(),
                success: false,
                code: "METHOD_ERROR",
                result: err
            };
        });
        return result;
    } catch (e) {
        response.result = e;
        response.message = "Hubo un error, vuelva a intentarlo";
        response.code = "UNEXPECTED_ERROR"
    }

    return response;
}

exports.executesimpletransaction = async (method, data) => {
    const response = {
        success: false,
        message: null,
        result: null,
        error: true
    }
    try {
        if (functionsbd[method]) {
            let query = functionsbd[method];
            if (data instanceof Object) {
                const result = await sequelize.query(query, {
                    type: QueryTypes.SELECT,
                    bind: data
                }).catch(function (err) {
                    return {
                        message: err.toString(),
                        success: false,
                        result: err
                    };
                });
                return result;

            } else {
                response.message = "Mal formato";
                response.code = "BAD_FORMAT_ERROR";
            }
        } else {
            response.code = "METHOD_ERROR";
            response.message = "No existe el método";
        }
    } catch (e) {
        
        response.result = e;
        response.message = "Hubo un error, vuelva a intentarlo";
        response.code = "UNEXPECTED_ERROR"
    }

    return response;
}

exports.getCollectionPagination = async (methodcollection, methodcount, data) => {
    const response = {
        success: false,
        message: null,
        result: null,
        error: true
    }
    try {
        if (functionsbd[methodcollection] && functionsbd[methodcount]) {

            const querycollection = functionsbd[methodcollection];
            const querycount = functionsbd[methodcount];

            if (data instanceof Object) {

                data.where = helper.generatefilter(data.filters, data.origin, data.daterange, data.offset);
                data.order = helper.generateSort(data.sorts, data.origin);

                const res = {
                    data: [],
                    count: 0
                }

                await Promise.all([
                    sequelize.query(querycollection, {
                        type: QueryTypes.SELECT,
                        bind: data
                    }).then(result => res.data = result),
                    sequelize.query(querycount, {
                        type: QueryTypes.SELECT,
                        bind: data
                    }).then(result => {
                        res.count = result[0].totalrecords;
                    }),
                ]);

                return res;
            } else {
                response.message = "Mal formato";
                response.code = "BAD_FORMAT_ERROR";
            }
        } else {
            response.code = "METHOD_ERROR";   
            response.message = "No existe el método";
        }
    } catch (e) {
        response.message = "Hubo un error, vuelva a intentarlo";
        response.code = "UNEXPECTED_ERROR"
    }

    return response;
}

exports.export = async (method, data) => {
    const response = {
        success: false,
        message: null,
        result: null,
        error: true
    }
    try {
        if (functionsbd[method]) {
            let query = functionsbd[method];
            if (data instanceof Object) {

                data.where = helper.generatefilter(data.filters, data.origin, data.daterange);
                data.order = helper.generateSort(data.sorts, data.origin);

                const result = await sequelize.query(query, {
                    type: QueryTypes.SELECT,
                    bind: data
                });
                return result;

            } else {
                response.message = "Mal formato";
                response.code = "BAD_FORMAT_ERROR";
            }
        } else {
            response.code = "METHOD_ERROR";
            response.message = "No existe el método";
        }
    } catch (e) {
        response.code = "UNEXPECTED_ERROR"
        response.message = "Hubo un error, vuelva a intentarlo";
    }

    return response;
}

exports.executeMultiTransactions = async (detail) => {
    const response = {
        success: false,
        msg: null,
    }
    try {
        //detail is a array of objects with the following format
        // {
        //     method: 'methodName',
        //     data: object
        //}
        //loop over the array in paralel executing with sequelize.query.
        return await Promise.all(detail.map(async (item) => {
            console.log("executing");
            //have to validate method on functionsbd, the value is the query tu use on sequelize.query and return the result.
            if (functionsbd[item.method]) {
                const query = functionsbd[item.method];
                const r = await sequelize.query(query, {
                    type: QueryTypes.SELECT,
                    bind: item.data
                }).catch(function (err) {
                    return {
                        msg: err.toString(),
                        success: false,
                        result: err
                    };
                });
                //validate type of r is an array or object.
                if (Array.isArray(r)) {
                    return {
                        success: true,
                        result: r
                    }
                }
                return r;
            } else {
                return {
                    msg: "No existe el método",
                    success: false,
                    result: null
                };
            }
        }))

    } catch (e) {
        console.log(e);
        response.msg = "Hubo un error, vuelva a intentarlo";
    }

    return response;
}