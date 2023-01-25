const sequelize = require('../database');
const functionsbd = require('./mobileFunction');

const columnsFunction = require('./columnsFunction');

const { QueryTypes } = require('sequelize');
require('pg').defaults.parseInt8 = true;

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
                        msg: "Hubo un error, vuelva a intentarlo.",
                        success: false,
                        result: err.toString()
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
        response.msg = "Hubo un error, vuelva a intentarlo";
    }

    return response;
}


exports.getCollectionPagination = async (methodcollection, methodcount, data, consultcount) => {
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
                if (!consultcount) {
                    const result = await sequelize.query(querycollection, {
                        type: QueryTypes.SELECT,
                        bind: data
                    }).catch(function (err) {
                        return {
                            msg: err.toString(),
                            success: false,
                            result: err
                        };
                    });;
                    return {
                        result,
                        count: 0
                    };
                } else {
                    data.where = '';

                    for (const [key, value] of Object.entries(data.filters)) {
                        if (value) {
                            const column = columnsFunction[data.origin][key].column;
                            const type = columnsFunction[data.origin][key].type;

                            if (type === 'string') {
                                data.where += ` and ${column} like '%${value}%'`;
                            } else if (type === 'int') {
                                if (!isNaN(value))
                                    data.where += ` and ${column} = ${value}`;
                                else
                                    data.where += ` and 1 = 0`;
                            }
                        }
                    }
                    data.order = '';
                    for (const [key, value] of Object.entries(data.sorts)) {
                        if (value) {
                            const column = columnsFunction[data.origin][key].column;
                            data.order += ` ${column} ${value},`;
                        }
                    }

                    if (data.order.length > 0) {
                        data.order = data.order.substring(0, data.order.length - 1);
                    }

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
                }
            } else
                response.msg = "Mal formato";
        } else
            response.msg = "No existe el método";
    } catch (e) {
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

                data.where = '';

                for (const [key, value] of Object.entries(data.filters)) {
                    if (value) {
                        const column = columnsFunction[data.origin][key].column;
                        const type = columnsFunction[data.origin][key].type;

                        if (type === 'string') {
                            data.where += ` and ${column} like '%${value}%'`;
                        } else if (type === 'int') {
                            if (!isNaN(value))
                                data.where += ` and ${column} = ${value}`;
                            else
                                data.where += ` and 1 = 0`;
                        }
                    }
                }
                data.order = '';
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
        response.msg = "Hubo un error, vuelva a intentarlo";
    }

    return response;
}