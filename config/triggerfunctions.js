const sequelize = require('./database');
const functionsbd = require('./functions');
const { generatefilter, generateSort, errors, getErrorSeq, getErrorCode } = require('./helpers');

const { QueryTypes } = require('sequelize');
require('pg').defaults.parseInt8 = true;

exports.executequery = async (query) => {
    return await sequelize.query(query, {
        type: QueryTypes.SELECT,
        bind: {}
    }).catch(err => getErrorSeq(err));
}

exports.executesimpletransaction = async (method, data, permissions = false) => {
    let functionMethod = functionsbd[method];
    if (functionMethod) {
        if (permissions && functionMethod.module) {
            const application = permissions[functionMethod.module];

            if (functionMethod.protected && (!application || ((functionMethod.protected === "SELECT" && !application[0]) || (functionMethod.protected === "INSERT" && !application[2])))) {
                return getErrorCode(errors.FORBIDDEN);
            }
        }
        const query = functionMethod.query;
        if (data instanceof Object) {
            return await sequelize.query(query, {
                type: QueryTypes.SELECT,
                bind: data
            }).catch(err => getErrorSeq(err));
        } else {
            return getErrorCode(errors.VARIABLE_INCOMPATIBILITY_ERROR);
        }
    } else {
        return getErrorCode(errors.NOT_FUNCTION_ERROR);
    }
}

exports.getCollectionPagination = async (methodcollection, methodcount, data, permissions = false) => {

    try {
        let functionMethod = functionsbd[methodcollection];

    if (functionMethod && functionsbd[methodcount]) {

        if (permissions && functionMethod.module) {
            const application = permissions[functionMethod.module];
            if (functionMethod.protected && (!application || ((functionMethod.protected === "SELECT" && !application[0]) || (functionMethod.protected === "INSERT" && !application[2])))) {
                return getErrorCode(errors.FORBIDDEN);
            }
        }

        const querycollection = functionMethod.query;
        const querycount = functionsbd[methodcount].query;

        if (data instanceof Object) {
            data.where = generatefilter(data.filters, data.origin, data.daterange, data.offset);
            data.order = generateSort(data.sorts, data.origin);

            const results = await Promise.all([
                sequelize.query(querycollection, {
                    type: QueryTypes.SELECT,
                    bind: data
                }),
                sequelize.query(querycount, {
                    type: QueryTypes.SELECT,
                    bind: data
                })
            ]).catch(err => getErrorSeq(err));

            if (!(results instanceof Array)) {
                return results
            }
            return {
                data: results[0],
                count: results[1][0].p_totalrecords,
                success: true,
                message: null,
                error: false
            }
        } else {
            return getErrorCode(errors.VARIABLE_INCOMPATIBILITY_ERROR);
        }
    } else {
        return getErrorCode(errors.NOT_FUNCTION_ERROR);
    }
    } catch (error) {
        return getErrorCode(errors.UNEXPECTED_ERROR);
    }
}

exports.exporttmp = async (method, data) => {
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

                data.where = generatefilter(data.filters, data.origin, data.daterange, data.offset);
                data.order = generateSort(data.sorts, data.origin);

                const result = await sequelize.query(query, {
                    type: QueryTypes.SELECT,
                    bind: data
                });
                return result;

            } else {
                return getErrorCode(errors.VARIABLE_INCOMPATIBILITY_ERROR);
            }
        } else {
            return getErrorCode(errors.NOT_FUNCTION_ERROR);
        }
    } catch (e) {
        console.log(e);
        return getErrorCode(errors.UNEXPECTED_ERROR);
    }
}

exports.GetMultiCollection = async (detail, permissions = false) => {
    return await Promise.all(detail.map(async (item) => {
        let functionMethod = functionsbd[item.method];
        if (functionMethod) {
            if (permissions && functionMethod.module) {
                const application = permissions[functionMethod.module];
                if (functionMethod.protected && (!application || ((functionMethod.protected === "SELECT" && !application[0]) || (functionMethod.protected === "INSERT" && !application[2])))) {
                    return getErrorCode(errors.FORBIDDEN);
                }
            }
            
            const r = await sequelize.query(functionMethod.query, {
                type: QueryTypes.SELECT,
                bind: item.parameters
            }).catch(err => getErrorSeq(err));

            if (!(r instanceof Array))
                return r;

            return {
                success: true,
                data: r,
                key: item.key
            }
        } else {
            return getErrorCode(errors.NOT_FUNCTION_ERROR);
        }
    }))
}

exports.executeTransaction = async (header, detail, permissions = false) => {
    let detailtmp = detail;
    const transaction = await sequelize.transaction();

    let lasterror = null;
    if (header) {
        const { method, parameters } = header;

        let functionMethod = functionsbd[method];
        if (functionMethod) {
            if (permissions && functionMethod.module) {
                const application = permissions[functionMethod.module];
                if (functionMethod.protected && (!application || ((functionMethod.protected === "SELECT" && !application[0]) || (functionMethod.protected === "INSERT" && !application[2])))) {
                    return getErrorCode(errors.FORBIDDEN);
                }
            }

            if (parameters instanceof Object) {
                //console.log(parameters);
                const result = await sequelize.query(functionMethod.query, {
                    type: QueryTypes.SELECT,
                    bind: parameters,
                    transaction
                }).catch(err => getErrorSeq(err));

                if (!(result instanceof Array)) {
                    await transaction.rollback();
                    return result;
                }

                if (result.length > 0) {
                    const keysResult = Object.keys(result[0])
                    if (keysResult.length > 0) {
                        detailtmp = detailtmp.map(x => {
                            x.parameters = {
                                ...x.parameters,
                                ...result[0]
                            }
                            return x;
                        })
                    }
                }
            } else
                return getErrorCode(errors.VARIABLE_INCOMPATIBILITY_ERROR);
        } else
            return getErrorCode(errors.NOT_FUNCTION_ERROR)
    }
    try {
        await Promise.all(detailtmp.map(async (item) => {
            if (functionsbd[item.method]) {
                const query = functionsbd[item.method];
                await sequelize.query(query, {
                    type: QueryTypes.SELECT,
                    bind: item.parameters,
                    transaction
                }).catch(err => {
                    lasterror = getErrorSeq(err);
                    throw 'error'
                });
            } else {
                lasterror = getErrorCode(errors.NOT_FUNCTION_ERROR);
                throw 'error'
            }
        }))
        await transaction.commit();
        return {
            success: true,
            error: false
        };
    } catch (e) {
        await transaction.rollback();
        return lasterror;
    }
}