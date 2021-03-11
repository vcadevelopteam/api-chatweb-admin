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
        msg: null,
        result: null
    }
    try {
        const result = await sequelize.query(query, {
            type: QueryTypes.SELECT,
            bind: {}
        }).catch(function (err) {
            console.log(err);
            return {
                msg: err.toString(),
                success: false,
                result: err
            };
        });
        return result;
    } catch (e) {
        console.log(e);
        response.result = e;
        response.msg = "Hubo un error, vuelva a intentarlo";
    }

    return response;
}

exports.executesimpletransaction = async (method, data) => {
    const response = {
        success: false,
        msg: null,
        result: null
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
                        msg: err.toString(),
                        success: false,
                        result: err
                    };
                });
                return result;

            } else {
                response.msg = "Mal formato";
            }
        } else {
            response.msg = "No existe el método";
        }
    } catch (e) {
        console.log(e);
        response.result = e;
        response.msg = "Hubo un error, vuelva a intentarlo";
    }

    return response;
}


exports.getCollectionPagination = async (methodcollection, methodcount, data) => {
    const response = {
        success: false,
        msg: null,
        result: null,
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
            } else
                response.msg = "Mal formato";
        } else
            response.msg = "No existe el método";
    } catch (e) {
        console.log(e);
        response.msg = "Hubo un error, vuelva a intentarlo";
    }

    return response;
}

exports.export = async (method, data) => {
    const response = {
        success: false,
        msg: null,
        result: null
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
                response.msg = "Mal formato";
            }
        } else {
            response.msg = "No existe el método";
        }
    } catch (e) {
        console.log(e);
        response.msg = "Hubo un error, vuelva a intentarlo";
    }

    return response;
}