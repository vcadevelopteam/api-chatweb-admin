const sequelize = require('./database');
const functionsbd = require('./functions');
const { generatefilter, generateSort, errors } = require('./helpers');

const { QueryTypes } = require('sequelize');
require('pg').defaults.parseInt8 = true;

const getErrorSeq = err => {
    console.log(`${new Date()}: ${err.toString()}: ${JSON.stringify(err)}`);
    const messageerror = err.toString().replace("SequelizeDatabaseError: ", "");
    return {
        success: false,
        error: true,
        rescode: (err.parent.code === 'P0001' && messageerror === errors.FORBIDDEN) ? 403 : 400,
        code: (err.parent.code === 'P0001') ? messageerror : errors.UNEXPECTED_DB_DBERROR
    };
};

const getErrorCode = code => ({
    success: false,
    error: true,
    rescode: code === errors.FORBIDDEN ? 401 : 400,
    code: code || errors.UNEXPECTED_ERROR
});

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

exports.getCollectionPagination = async (methodcollection, methodcount, data) => {
    if (functionsbd[methodcollection] && functionsbd[methodcount]) {
        const querycollection = functionsbd[methodcollection];
        const querycount = functionsbd[methodcount];

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

                data.where = generatefilter(data.filters, data.origin, data.daterange);
                data.order = generateSort(data.sorts, data.origin);

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

exports.GetMultiCollection = async (detail) => {
    return await Promise.all(detail.map(async (item) => {
        if (functionsbd[item.method]) {
            const query = functionsbd[item.method];
            const r = await sequelize.query(query, {
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

exports.executeTransaction = async (header, detail) => {
    let detailtmp = detail;
    const transaction = await sequelize.transaction();

    let lasterror = null;
    if (header) {
        const { method, parameters } = header;
        if (functionsbd[method]) {
            let query = functionsbd[method];
            if (parameters instanceof Object) {
                const result = await sequelize.query(query, {
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
                return getErrorCode("VARIABLE_INCOMPATIBILITY_ERROR")
        } else
            return getErrorCode("NOT_FUNCTION_ERROR")
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