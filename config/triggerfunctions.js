const sequelize = require('./database');
const functionsbd = require('./functions');
const columnsFunction = require('./columnsFunction');
const helper = require('./helpers');

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
                code: "UNEXPECTED_DBERROR",
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
                    console.log(err);
                    return {
                        message: err.toString(),
                        success: false,
                        code: "UNEXPECTED_DBERROR",
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
        message: null,
        data: null,
        error: true
    }
    try {
        return await Promise.all(detail.map(async (item) => {
            if (functionsbd[item.method]) {
                const query = functionsbd[item.method];
                const r = await sequelize.query(query, {
                    type: QueryTypes.SELECT,
                    bind: item.parameters
                }).catch(function (err) {
                    console.log(err);
                    return {
                        message: err.toString(),
                        success: false,
                        code: "UNEXPECTED_DBERROR",
                    };
                });
                return {
                    success: true,
                    data: r,
                    key: item.key
                }
            } else {
                return {
                    message: "No existe el método",
                    code: "METHOD_ERROR",
                    success: false,
                    data: null
                };
            }
        }))

    } catch (e) {
        console.log(e);
        response.code = "UNEXPECTED_ERROR"
        response.message = "Hubo un error, vuelva a intentarlo";
    }

    return response;
}


exports.executeTransaction = async (header, detail) => {
    let transaction;
    let detailtmp = detail;
    const response = {
        success: true,
        message: null,
        error: false
    }
    try {
        transaction = await sequelize.transaction();

        if (header) {
            const { method, parameters } = header;

            if (functionsbd[method]) {
                let query = functionsbd[method];
                if (data instanceof Object) {
                    const result = await sequelize.query(query, {
                        type: QueryTypes.SELECT,
                        bind: parameters
                    }).catch(function (err) {
                        console.log(err);
                        throw 'Hubo un error vuelva a intentarlo'
                    });
                    if (result.length > 0) {
                        const keysResult = Object.keys(result[0])
                        if (keysResult.length > 0) {
                            detailtmp = detailtmp.map(x => ({
                                ...x,
                                ...result[0]
                            }))
                        }
                    }
                } else {
                    throw 'Hubo un error vuelva a intentarlo'
                }
            } else {
                throw 'Hubo un error vuelva a intentarlo'
            }
        }

        await Promise.all(detailtmp.map(async (item) => {
            if (functionsbd[item.method]) {
                const query = functionsbd[item.method];
                const r = await sequelize.query(query, {
                    type: QueryTypes.SELECT,
                    bind: item.parameters
                }).catch(function (err) {
                    console.log(err);
                    throw 'Hubo un error vuelva a intentarlo'
                });
            } else {
                throw 'Hubo un error vuelva a intentarlo'
            }
        }))
        await transaction.commit();
    } catch (e) {
        if (transaction)
            await transaction.rollback();
        console.log(e);
        return {
            success: false,
            error: true,
            code: "UNEXPECTED_ERROR",
            message: "Hubo un error, vuelva a intentarlo"
        }
    }

    return response;
}