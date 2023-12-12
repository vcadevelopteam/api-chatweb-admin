const logger = require('./winston');
const sequelize = require('./database');
const functionsbd = require('./functions');
const XLSX = require('xlsx');
const { generatefilter, generateSort, errors, getErrorSeq, getErrorCode, stringToSeconds, secondsToTime } = require('./helpers');
const { QueryTypes } = require('sequelize');
require('pg').defaults.parseInt8 = true;

const IBM = require('ibm-cos-sdk');
const AWS = require('aws-sdk');

const configCOS = {
    endpoint: process.env.COS_ENDPOINT,
    ibmAuthEndpoint: process.env.COS_IBMAUTHENDPOINT,
    apiKeyId: process.env.COS_APIKEYID,
    serviceInstanceId: process.env.COS_SERVICEINSTANCEID,
};

const COS_BUCKET_NAME = process.env.COS_BUCKET;
const REPLACEFILTERS = "###FILTERS###";
const REPLACESEL = "###REPLACESEL###";

const executeQuery = async (query, bind, _requestid) => {
    const profiler = logger.child({ ctx: bind || {}, _requestid }).startTimer();

    return await sequelize.query(query, {
        type: QueryTypes.SELECT,
        bind
    })
        .catch(err => getErrorSeq(err, profiler, query, _requestid));
}

exports.executeQuery = () => executeQuery();

//no se puede usar bind y replace en el mismo query 
exports.executesimpletransaction = async (method, data, permissions = false, replacements = undefined) => {
    let functionMethod = functionsbd[method];
    if (functionMethod) {
        if (permissions && functionMethod.module) {
            const application = permissions[functionMethod.module];
            if (functionMethod.protected && (!application || ((functionMethod.protected === "SELECT" && !application[0]) || (functionMethod.protected === "INSERT" && !application[2])))) { 
                return getErrorCode(errors.FORBIDDEN);
            }
        }
        const query = functionMethod.query;

        if (data instanceof Object || data === undefined) {
            const profiler = logger.child({ ctx: { ...data, menu: undefined }, _requestid: data?._requestid || replacements?._requestid }).startTimer();

            return await sequelize.query(query, {
                type: QueryTypes.SELECT,
                replacements,
                bind: data
            })
                .catch(err => getErrorSeq(err, profiler, method));
        } else {
            return getErrorCode(errors.VARIABLE_INCOMPATIBILITY_ERROR);
        }
    } else {
        return getErrorCode(errors.NOT_FUNCTION_ERROR);
    }
}

exports.getCollectionPagination = async (methodcollection, methodcount, data, permissions, _requestid) => {
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

                const queryCollectionCleaned = querycollection.replace("###WHERE###", data.where || "").replace("###ORDER###", data.order ? " order by " + data.order : "");
                const queryCountCleaned = querycount.replace("###WHERE###", data.where || "");

                const profiler = logger.child({ ctx: data, _requestid: data._requestid }).startTimer();

                const results = await Promise.all([
                    sequelize.query(queryCollectionCleaned, {
                        type: QueryTypes.SELECT,
                        bind: data
                    }),
                    sequelize.query(queryCountCleaned, {
                        type: QueryTypes.SELECT,
                        bind: data
                    })
                ])
                    .catch(err => getErrorSeq(err, profiler, `paginated ${methodcollection}`, _requestid))

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
    } catch (exception) {
        return getErrorCode(errors.UNEXPECTED_ERROR, exception, "Executing getCollectionPagination", _requestid);
    }
}

exports.buildQueryWithFilterAndSort = async (method, data) => {
    try {
        if (functionsbd[method]) {
            let query = functionsbd[method].query;
            if (data instanceof Object) {

                data.where = generatefilter(data.filters, data.origin, data.daterange, data.offset);
                data.order = generateSort(data.sorts, data.origin);

                const queryCollectionCleaned = query.replace("###WHERE###", data.where || "").replace("###ORDER###", data.order ? " order by " + data.order : "");

                const profiler = logger.child({ ctx: data, _requestid: data._requestid }).startTimer();

                logger.child({ ctx: data, _requestid: data._requestid }).debug(`executing ${queryCollectionCleaned}`)

                return await sequelize.query(queryCollectionCleaned, {
                    type: QueryTypes.SELECT,
                    bind: data
                })
                    .catch(err => getErrorSeq(err, profiler, `builded query ${queryCollectionCleaned}`));

            } else {
                return getErrorCode(errors.VARIABLE_INCOMPATIBILITY_ERROR);
            }
        } else {
            return getErrorCode(errors.NOT_FUNCTION_ERROR);
        }
    } catch (exception) {
        return getErrorCode(errors.UNEXPECTED_ERROR, exception, "Executing buildQueryWithFilterAndSort", data._requestid);
    }
}

exports.GetMultiCollection = async (detail, permissions, _requestid) => {
    return await Promise.all(detail.map(async (item, index) => {
        let functionMethod = functionsbd[item.method];
        if (functionMethod) {
            if (permissions && functionMethod.module) {
                const application = permissions[functionMethod.module];
                if (functionMethod.protected && (!application || ((functionMethod.protected === "SELECT" && !application[0]) || (functionMethod.protected === "INSERT" && !application[2])))) {
                    return getErrorCode(errors.FORBIDDEN);
                }
            }
            const profiler = logger.child({ ctx: item.parameters, _requestid }).startTimer();

            const r = await sequelize.query(functionMethod.query, {
                type: QueryTypes.SELECT,
                bind: item.parameters
            })
                .catch(err => getErrorSeq(err, profiler, `multi ${item.method}`, _requestid));

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

exports.executeTransaction = async (header, detail, permissions, _requestid) => {
    let detailtmp = detail;
    const transaction = await sequelize.transaction();
    let resultHeader = null;
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
                const profiler = logger.child({ ctx: parameters, _requestid }).startTimer();

                const result = await sequelize.query(functionMethod.query, {
                    type: QueryTypes.SELECT,
                    bind: parameters,
                    transaction
                })
                    .catch(err => getErrorSeq(err, profiler, `transaction header ${method}`, _requestid));

                if (!(result instanceof Array)) {
                    await transaction.rollback();
                    return result;
                }

                if (result.length > 0) {
                    resultHeader = result[0];
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
                const profiler = logger.child({ ctx: item.parameters, _requestid }).startTimer();

                const query = functionsbd[item.method];
                await sequelize.query(query, {
                    type: QueryTypes.SELECT,
                    bind: item.parameters,
                    transaction
                })
                    .catch(err => {
                        lasterror = getErrorSeq(err, profiler, `transaction detail ${item.method}`, _requestid);
                        throw new Error('error')

                    });
            } else {
                lasterror = getErrorCode(errors.NOT_FUNCTION_ERROR);
                throw new Error('error')
            }
        }))
        await transaction.commit();
        return {
            success: true,
            error: false,
            resultHeader
        };
    } catch (e) {
        await transaction.rollback();
        return lasterror;
    }
}
const NUMBERS = ["bigint", "integer", "numeric", "double precision"];
const DATES = ["timestamp without time zone", "date"];
/*
{ function: 'total' },
    { function: 'count' },
    { function: 'average' },
    { function: 'minimum' },
    { function: 'maximum' },
    { function: 'median' },
    { function: 'mode' },
*/
exports.buildQueryDynamic2 = async (columns, filters, parameters, summaries, fromExport = false, user = {}) => {
    try {
        const applyFilterGroups = columns.some(x => x.tablename === "conversation") && user?.environment === "CLARO";
        
        if (applyFilterGroups) {
            parameters.roles = user?.roledesc
        }

        const queriesFilterGroups = {
            queryWith: !applyFilterGroups ? '' :
            `WITH w1 AS (
                SELECT DISTINCT unnest(string_to_array(groups,'','')) AS groups
                FROM orguser ous
                WHERE ous.corpid = $corpid
                AND ous.orgid = $orgid
                AND ous.userid = $userid
            )`,
            queryJoin: (applyFilterGroups && !columns.some(x => x.join_alias === "lastorguser")) ? `
            LEFT JOIN orguser lastorguser ON lastorguser.corpid = conversation.corpid AND lastorguser.orgid = conversation.orgid AND lastorguser.userid = conversation.lastuserid
            ` : '',
            queryWhere: !applyFilterGroups ? '' :
            `AND CASE WHEN string_to_array($roles,',') && Array['ADMINISTRADOR', 'ADMINISTRADOR P', 'SUPERADMIN']
            THEN TRUE
            ELSE
                CASE WHEN (SELECT(array_length(array_agg(groups), 1)) FROM w1) IS NOT NULL THEN 
                    (string_to_array(lastorguser.groups, ',') && (SELECT array_agg(groups) FROM w1)) OR
                    ((string_to_array($roles, ',') && array ['SUPERVISOR CLIENTE'] AND (conversation.lastuserid = 2 OR (conversation.lastuserid = 3 AND array [conversation.usergroup::text] && (SELECT array_agg(groups) FROM w1)))))
                ELSE TRUE 
                END
            END`
        }

        const TABLENAME = columns[0].tablename;
        const ALLCOLUMNS = [...columns, ...filters];

        let JOINNERS = Array.from(new Set(ALLCOLUMNS.filter(x => !!x.join_alias).map(x => x.join_alias))).reduce((acc, join_alias) => {
            const { join_table, join_on } = ALLCOLUMNS.find(x => x.join_alias === join_alias);

            if (join_alias === "hsmcampaign") {
                return acc +
                    `\nLEFT JOIN hsmhistory hsmhistory ON hsmhistory.corpid = conversation.corpid AND hsmhistory.orgid = conversation.orgid AND hsmhistory.conversationid = conversation.conversationid
                \nLEFT JOIN campaignhistory campaignhistory ON campaignhistory.corpid = conversation.corpid AND campaignhistory.orgid = conversation.orgid AND campaignhistory.conversationid = conversation.conversationid`;
            }

            return acc + `\nLEFT JOIN ${join_table} ${join_alias} ${join_on}`;
        }, "");

        const columnValueUnique = filters.find(x => x.type_filter === "unique_value");

        let columnToAdd = [];

        if (columnValueUnique) {
            const columnFound = columns.find(x => x.columnname === columnValueUnique.columnname)
            if (!columnFound) {
                columnToAdd = [columnValueUnique]
            }
        }

        const COLUMNESSELECT = [...columns, ...columnToAdd].reduce((acc, item, index) => {
            let selcol = item.columnname;

            if (item.type === "interval") {
                selcol = `cast(EXTRACT(epoch FROM ${item.columnname}) as integer)`;
            } else if (item.columnname === "hsmcampaign.success") {
                selcol = `CASE WHEN (hsmhistory.success = true OR campaignhistory.success = true) AND conversation.personlastreplydate IS NOT NULL THEN 'attended' 
                    WHEN (hsmhistory.success = true OR campaignhistory.success = true) THEN 'sent' 
                    ELSE 'not sent' END`;
            } else if (item.type === "variable") {
                selcol = `conversation.variablecontextsimple->>'${item.columnname}'`;
            } else if (DATES.includes(item.type) && fromExport) {
                selcol = `to_char(${item.columnname} + $offset * interval '1hour', 'YYYY-MM-DD HH24:MI:SS')`;
            }

            if (item.columnname === columnValueUnique?.columnname) {
                return ` distinct on (${selcol}) ${selcol} as "${item.columnname.replace(".", "")}"` + (acc ? ", " : "") + acc;
            } else {
                return acc + (index === 0 ? "" : ",") + `${selcol} as "${item.columnname.replace(".", "")}"`
            }
        }, "")

        const FILTERS = filters.reduce((acc, { type, columnname, start, end, value }) => {
            if (DATES.includes(type)) {
                return `${acc}\nand ${columnname} >= '${start}'::DATE - $offset * INTERVAL '1hour' and ${columnname} < '${end}'::DATE + INTERVAL '1day' - $offset * INTERVAL '1hour'`
            } else if (!!value) {
                const valueCleaned = value === "''" ? "" : value;
                const filter_array = `ANY(string_to_array('${valueCleaned}',',')::${type === "variable" ? "text" : type}[])`

                if (NUMBERS.includes(type)) {
                    return `${acc}\nand ${columnname} = ${valueCleaned.includes(",") ? filter_array : valueCleaned}`
                } else if (type === "variable") {
                    return `${acc}\nand conversation.variablecontextsimple->>'${columnname}' ilike ${valueCleaned.includes(",") ? filter_array : "'" + valueCleaned + "'"}`
                } else if (type === "boolean") {
                    return `${acc}\nand ${columnname} = ${valueCleaned}`
                } else {
                    if (columnname === "conversation.tags") {
                        if (valueCleaned.includes(",")) {
                            return `${acc}\nand ${filter_array}  && string_to_array(${columnname}, ',')`
                        } else {
                            return `${acc}\nand '${valueCleaned}'  = any(string_to_array(${columnname}, ','))`
                        }
                    } else {
                        if (valueCleaned === "") {
                            return `${acc}\nand COALESCE(${columnname}, '') ilike '${valueCleaned}'`
                        } else {
                            return `${acc}\nand ${columnname} ilike ${valueCleaned.includes(",") ? filter_array : "'" + valueCleaned + "'"}`
                        }
                    }
                }
            } else {
                return acc;
            }
        }, "")

        let query = `
            ${queriesFilterGroups.queryWith}
            SELECT
                ${COLUMNESSELECT}
            FROM ${TABLENAME}
            ${JOINNERS}
            ${queriesFilterGroups.queryJoin}
            WHERE 
                ${TABLENAME}.corpid = $corpid AND ${TABLENAME}.orgid = $orgid ${queriesFilterGroups.queryWhere}
                ${FILTERS}
            `;
        const resultbd = await executeQuery(query, parameters, parameters._requestid);

        if (summaries.length > 0 && resultbd.length > 0) {
            const firstColumn = columns.reduce((acc, item) => ({
                ...acc,
                [item.columnname.replace(".", "")]: ''
            }), {})

            const datawith = summaries.reduce((acc, item) => {
                let columnname = item.columnname.replace(".", "");
                const columnnameonly = item.columnname.replace(".", "");
                let tmpdata = [...resultbd];

                if (item.function === "count") {
                    acc[columnnameonly] += (acc[columnnameonly] ? " - " : "") + item.function.toUpperCase() + ": " + tmpdata.filter(x => !!x[columnname]).length;
                } else if (item.function === "count_unique") {
                    acc[columnnameonly] += (acc[columnnameonly] ? " - " : "") + item.function.toUpperCase() + ": " + Array.from(new Set(tmpdata.map(x => x[columnname] || ""))).length;
                } else if (item.function === "total") {
                    const auxq = item.function.toUpperCase() + ": " + tmpdata.reduce((a, b) => a + b[columnname], 0);
                    const aux2 = acc[columnnameonly] ? " - " : "";
                    acc[columnnameonly] += aux2 + item.type === "interval" ? secondsToTime(auxq, item.format) : auxq;
                } else if (item.function === "average") {
                    const auxq = tmpdata.map(x => x[columnname]).reduce((a, b) => a + b, 0) / tmpdata.length;
                    acc[columnnameonly] += (acc[columnnameonly] ? " - " : "") + item.function.toUpperCase() + ": " + (item.type === "interval" ? secondsToTime(auxq, item.format) : auxq);
                } else if (item.function === "minimum") {
                    const auxq = tmpdata.reduce((a, b) => a < b[columnname] ? a : b[columnname], tmpdata[0][columnname]);
                    acc[columnnameonly] += (acc[columnnameonly] ? " - " : "") + item.function.toUpperCase() + ": " + (item.type === "interval" ? secondsToTime(auxq, item.format) : auxq);
                } else if (item.function === "maximum") {
                    const auxq = tmpdata.reduce((a, b) => a > b[columnname] ? a : b[columnname], tmpdata[0][columnname]);
                    acc[columnnameonly] += (acc[columnnameonly] ? " - " : "") + item.function.toUpperCase() + ": " + (item.type === "interval" ? secondsToTime(auxq, item.format) : auxq);
                } else if (item.function === "median") {
                    const mid = Math.floor(tmpdata.length / 2);
                    const numbs = tmpdata.map(x => x[columnname]).sort((a, b) => a - b);
                    const auxq = tmpdata.length % 2 !== 0 ? numbs[mid] : (numbs[mid - 1] + numbs[mid]) / 2;
                    acc[columnnameonly] += (acc[columnnameonly] ? " - " : "") + item.function.toUpperCase() + ": " + (item.type === "interval" ? secondsToTime(auxq, item.format) : auxq);
                } else if (item.function === "mode") {
                    const auxq = tmpdata.map(x => x[columnname]).sort((a, b) =>
                        tmpdata.filter(v => v === a).length
                        - tmpdata.filter(v => v === b).length
                    ).pop();
                    acc[columnnameonly] += (acc[columnnameonly] ? " - " : "") + item.function.toUpperCase() + ": " + (item.type === "interval" ? secondsToTime(auxq, item.format) : auxq);
                }
                return acc;
            }, firstColumn)

            resultbd.unshift(datawith);
        }
        return resultbd;
    } catch (exception) {
        return getErrorCode(errors.UNEXPECTED_ERROR, exception, "Executing buildQueryDynamic2", parameters._requestid);
    }
}

exports.buildQueryDynamicGroupInterval = async (columns, filters, parameters, interval, dataorigin, summarizationfunction) => {
    try {
        const TABLENAME = columns[0].tablename;
        const ALLCOLUMNS = [...columns, ...filters];
        let GROUP_BY = "";
        let JOINNERS = Array.from(new Set(ALLCOLUMNS.filter(x => !!x.join_alias).map(x => x.join_alias))).reduce((acc, join_alias) => {
            const { join_table, join_on } = ALLCOLUMNS.find(x => x.join_alias === join_alias);
            return acc + `\nLEFT JOIN ${join_table} ${join_alias} ${join_on}`;
        }, "");

        const aux = interval === "month" ?
            `to_char(${dataorigin}.createdate + $offset * INTERVAL '1hour', 'YYYY-MM') "interval"` :
            `date_part('${interval}', ${dataorigin}.createdate + $offset * INTERVAL '1hour') "interval"`

        const firstSelect = interval === "day" ?
            `to_char(${dataorigin}.createdate + $offset * INTERVAL '1hour', 'MM-DD') "interval"` : aux;

        const COLUMNESSELECT = columns.reduce((acc, item, index) => {
            let selcol = item.columnname;

            let coalescedefault = '0';

            if (item.type === "interval") {
                coalescedefault = "'00:00:00'"
            } else if (item.type === "variable") {
                selcol = `conversation.variablecontextsimple->>'${item.columnname}'`;
            } else if (DATES.includes(item.type)) {
                selcol = `to_char(${item.columnname} + $offset * interval '1hour', 'YYYY-MM-DD HH24:MI:SS')`;
            }

            if (!summarizationfunction) {
                GROUP_BY = `coalesce(${selcol}::text, '')`;
                return acc + `, coalesce(${selcol}::text, '') as "${item.columnname.replace(".", "")}", count(coalesce(${selcol}::text, '')) total`
            } else if (summarizationfunction === "total") {
                if (coalescedefault === "'00:00:00'") {
                    return acc + `, date_trunc('seconds', sum(coalesce(${selcol}, ${coalescedefault})))::text total`
                }
                return acc + `, sum(coalesce(${selcol}, ${coalescedefault})) total`
            } else if (summarizationfunction === "count") {
                return acc + `, count(coalesce(${selcol}::text, '')) total`
            } else if (summarizationfunction === "average") {
                if (coalescedefault === "'00:00:00'") {
                    return acc + `, date_trunc('seconds', avg(coalesce(${selcol}, ${coalescedefault})))::text total`
                }
                return acc + `, avg(coalesce(${selcol}, ${coalescedefault})) total`
            } else if (summarizationfunction === "minimum") {
                if (coalescedefault === "'00:00:00'") {
                    return acc + `, date_trunc('seconds', min(coalesce(${selcol}, ${coalescedefault})))::text total`
                }
                return acc + `, min(coalesce(${selcol}, ${coalescedefault})) total`
            } else if (summarizationfunction === "maximum") {
                if (coalescedefault === "'00:00:00'") {
                    return acc + `, date_trunc('seconds', max(coalesce(${selcol}, ${coalescedefault})))::text total`
                }
                return acc + `, max(coalesce(${selcol}, ${coalescedefault})) total`
            } else if (summarizationfunction === "count_unique") {
                return acc + `, count(distinct(coalesce(${selcol}::text, ''))) total`
            }

        }, firstSelect)

        const FILTERS = filters.reduce((acc, { type, columnname, start, end, value }) => {
            if (DATES.includes(type)) {
                return `${acc}\nand ${columnname} >= '${start}'::DATE - $offset * INTERVAL '1hour' and ${columnname} < '${end}'::DATE + INTERVAL '1day' - $offset * INTERVAL '1hour'`
            } else if (!!value) {
                const valueCleaned = value === "''" ? "" : value;
                const filter_array = `ANY(string_to_array('${valueCleaned}',',')::${type === "variable" ? "text" : type}[])`

                if (NUMBERS.includes(type)) {
                    return `${acc}\nand ${columnname} = ${valueCleaned.includes(",") ? filter_array : valueCleaned}`
                } else if (type === "variable") {
                    return `${acc}\nand conversation.variablecontextsimple->>'${columnname}' ilike ${valueCleaned.includes(",") ? filter_array : "'" + valueCleaned + "'"}`
                } else if (type === "boolean") {
                    return `${acc}\nand ${columnname} = ${valueCleaned}`
                } else {
                    if (columnname === "conversation.tags") {
                        if (valueCleaned.includes(",")) {
                            return `${acc}\nand ${filter_array}  && string_to_array(${columnname}, ',')`
                        } else {
                            return `${acc}\nand '${valueCleaned}'  = any(string_to_array(${columnname}, ','))`
                        }
                    } else {
                        if (valueCleaned === "") {
                            return `${acc}\nand COALESCE(${columnname}, '') ilike '${valueCleaned}'`
                        } else {
                            return `${acc}\nand ${columnname} ilike ${valueCleaned.includes(",") ? filter_array : "'" + valueCleaned + "'"}`
                        }
                    }
                }
            } else {
                return acc;
            }
        }, "")

        let query = `
        select
            ${COLUMNESSELECT}
        from ${TABLENAME}
        ${JOINNERS}
        WHERE 
            ${TABLENAME}.corpid = $corpid and ${TABLENAME}.orgid = $orgid
            ${FILTERS}
        GROUP BY 1${!!GROUP_BY ? "," : ""} ${GROUP_BY}
        ORDER BY 1 desc
        `;

        const resultbd = await executeQuery(query, parameters, parameters._requestid);

        return resultbd;
    } catch (exception) {
        return getErrorCode(errors.UNEXPECTED_ERROR, exception, "Executing buildQueryDynamicGroupInterval", parameters._requestid);
    }
}

exports.buildQueryDynamic = async (columns, filters, parameters) => {
    try {
        let whereQuery = "";
        let selQuery = "";
        let query = `
        select
            co.conversationid
            ${REPLACESEL}
        from conversation co
        WHERE 
            
            co.corpid = $corpid 
            and co.orgid = $orgid
            ${REPLACEFILTERS}
        `;

        if (filters && filters instanceof Array) {
            whereQuery = filters.reduce((acc, item) => {
                if (!item.value && !item.start)
                    return acc;

                if (item.column === "startdate")
                    return `${acc} and co.startdate >= '${item.start}'::DATE - $offset * INTERVAL '1hour' and co.startdate < '${item.end}'::DATE + INTERVAL '1day' - $offset * INTERVAL '1hour'`
                else if (item.column === "finishdate")
                    return `${acc} and co.finishdate >= '${item.start}'::DATE - $offset * INTERVAL '1hour' and co.finishdate < '${item.end}'::DATE + INTERVAL '1day' - $offset * INTERVAL '1hour'`
                else if (item.column === "communicationchannelid")
                    return `${acc} and co.communicationchannelid = ANY(string_to_array('${item.value}',',')::bigint[])`
                else if (item.column === "usergroup")
                    return `${acc} and co.usergroup = ANY(string_to_array('${item.value}',',')::character varying[])`
                else if (item.column === "tag")
                    return `${acc} and co.tags ilike '%${item.value}%'`
            }, "");
        }

        if (columns && columns instanceof Array) {
            selQuery = columns.reduce((acc, item) => {
                if (item.key === "startdateticket" || item.key === "finishdateticket") {
                    const cc = item.key.split("ticket")[0];
                    return `${acc}, to_char(co.${cc} + interval '$offset hour', 'YYYY-MM-DD HH24:MI:SS') as "${item.key}"`
                } else if (["status", "closecomment", "firstusergroup", "closetype", "conversationid"].includes(item.key)) {
                    if (item.filter)
                        whereQuery += ` and co.${item.key} = '${item.filter}'`;
                    return `${acc}, co.${item.key} as "${item.key}"`
                }
                else if (item.key === "alltags") {
                    if (item.filter)
                        whereQuery += ` and co.tags ilike '%${item.filter}%'`;
                    return `${acc}, co.tags as "${item.key}"`
                }
                else if (item.key === "ticketgroup") {
                    if (item.filter)
                        whereQuery += ` and co.usergroup = '${item.filter}'`;
                    return `${acc}, co.usergroup as "${item.key}"`
                }
                else if (item.key === "startonlydateticket") {
                    if (item.filter)
                        whereQuery += ` and to_char(co.startdate + interval '$offset hour', 'DD/MM/YYYY') = '${item.filter}'`;
                    return `${acc}, to_char(co.startdate + interval '$offset hour', 'DD/MM/YYYY') as "${item.key}"`
                }
                else if (item.key === "startonlyhourticket") {
                    if (item.filter)
                        whereQuery += ` and to_char(co.startdate + interval '$offset hour', 'HH24:MI') = '${item.filter}'`;
                    return `${acc}, to_char(co.startdate + interval '$offset hour', 'HH24:MI') as "${item.key}"`
                }
                else if (item.key === "initialagent")
                    return `${acc}, (select CONCAT(us.firstname, ' ', us.lastname) from usr us where us.userid = co.firstuserid) as "${item.key}"`
                else if (item.key === "currentagent")
                    return `${acc}, (select CONCAT(us.firstname, ' ', us.lastname) from usr us where us.userid = co.lastuserid) as "${item.key}"`
                else if (item.key === "typifications")
                    return `${acc}, (select string_agg(c.path, ',') from conversationclassification cc 
                    inner join classification c on c.classificationid = cc.classificationid 
                    where cc.conversationid = co.conversationid)  as "${item.key}"`
                else {
                    if (item.filter) {
                        const filterCleaned = item.filter.trim();
                        if (filterCleaned.includes(",")) {
                            const listFilters = filterCleaned.split(",").map(x => `'${x.trim()}'`);
                            whereQuery += ` and co.variablecontextsimple->>'${item.key}' in (${listFilters}) `;
                        }
                        else
                            whereQuery += ` and co.variablecontextsimple->>'${item.key}' = '${filterCleaned}'`;
                    }
                    return `${acc}, co.variablecontextsimple->>'${item.key}' as "${item.key}"`
                }

            }, "");
        }

        query = query.replace(REPLACEFILTERS, whereQuery).replace(REPLACESEL, selQuery);

        return await executeQuery(query, parameters, parameters._requestid);
    } catch (exception) {
        return getErrorCode(errors.UNEXPECTED_ERROR, exception, "Executing buildQueryDynamic", parameters._requestid);
    }
}

exports.exportData = async (dataToExport, reportName, formatToExportx, headerClient, _requestid) => {
    const formatToExport = "csv";
    try {
        const titlefile = (reportName || "report") + new Date().toISOString() + (formatToExport !== "csv" ? ".xlsx" : ".csv");
        if (dataToExport instanceof Array && dataToExport.length > 0) {

            let keysHeaders;
            const keys = Object.keys(dataToExport[0]);
            keysHeaders = keys;

            if (headerClient) {
                keysHeaders = keys.reduce((acc, item) => {
                    const keyclientfound = headerClient.find(x => x.key === item);
                    if (!keyclientfound)
                        return acc;
                    else {
                        return {
                            ...acc,
                            [item]: keyclientfound.alias
                        }
                    }
                }, {});
                dataToExport.unshift(keysHeaders);
            }
            if (formatToExport === "excel") {
                logger.child({ _requestid }).debug(`executing excel`)

                const ws = XLSX.utils.json_to_sheet(dataToExport, headerClient ? {
                    skipHeader: !!headerClient,
                } : undefined);

                const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
                const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

                const r = await this.uploadBufferToCos(
                    _requestid,
                    excelBuffer,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
                    titlefile,
                    true);
                return r;

            } else {
                logger.child({ _requestid }).debug(`drawing csv`)

                const profiler = logger.child({ _requestid }).startTimer();

                let content =
                    (headerClient ? "" : (Object.keys(dataToExport[0]).join("|") + "\n")) +
                    dataToExport.map(item => Object.values(item).join("|").replace(/(?![\x00-\x7FáéíóúñÁÉÍÓÚÑ]|[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3})./g, '')).join("\n");

                dataToExport = null;

                profiler.done({ level: "debug", message: `Drawed csv` });

                const r = await this.uploadBufferToCos(_requestid, Buffer.from(content, 'ASCII'), "text/csv", titlefile, true);
                return r;
            }
        } else {
            return getErrorCode(errors.ZERO_RECORDS_ERROR);
        }
    } catch (exception) {
        return getErrorCode(errors.UNEXPECTED_ERROR, exception, "Executing exportdata");
    }
}

exports.getQuery = (method, data, isNotPaginated) => {
    try {
        if (functionsbd[method]) {
            let query = functionsbd[method].query;

            if (!isNotPaginated) {
                if (data instanceof Object) {
                    data.where = generatefilter(data.filters, data.origin, data.daterange, data.offset);
                    data.order = generateSort(data.sorts, data.origin);

                    query = query.replace("###WHERE###", data.where || "").replace("###ORDER###", data.order ? " order by " + data.order : "");
                } else {
                    return getErrorCode(errors.VARIABLE_INCOMPATIBILITY_ERROR);
                }
            }

            const resultRx = query.match(/\$[\_\w]+/g)

            resultRx?.forEach((x, i) => {
                query = query.replace(x, "$" + (i + 1))
            })

            const values = resultRx?.map(x => data[x.replace("$", "")]) || []
            return { query, values };

        } else {
            return getErrorCode(errors.NOT_FUNCTION_ERROR);
        }
    } catch (exception) {
        return getErrorCode(errors.UNEXPECTED_ERROR, exception, "Executing buildQueryWithFilterAndSort", data._requestid);
    }
}

exports.uploadBufferToCos = async (_requestid, buffer, contentType, key, presigned = false) => {
    const s3 = new IBM.S3(configCOS);

    const params = {
        ACL: presigned ? undefined : 'public-read',
        Key: key,
        Body: buffer,
        Bucket: COS_BUCKET_NAME,
        ContentType: contentType,
    }

    logger.child({ _requestid }).debug(`Uploading to COS`)

    const profiler1 = logger.child({ _requestid }).startTimer();
    return new Promise((res, rej) => {
        try {
            s3.upload(params, async (err, data) => {
                if (err) {
                    profiler1.done({ level: "error", error: err, message: `Uploaded cos` });
                    rej(getErrorCode(errors.COS_UNEXPECTED_ERROR, err));
                }
                profiler1.done({ level: "debug", message: `Upload cos` });
                if (presigned) {
                    AWS.config.update({
                        accessKeyId: process.env.COS_ACCESSKEYID,
                        secretAccessKey: process.env.COS_SECRETACCESSKEY,
                    });

                    const cosSigned = new AWS.S3({
                        endpoint: `https://${configCOS.endpoint}`,
                    });

                    const signedUrl = await cosSigned.getSignedUrlPromise("getObject", {
                        Bucket: COS_BUCKET_NAME,
                        Key: key,
                        Expires: 300,
                    });

                    res({ url: (signedUrl ?? data.Location).replace("http:", "https:") })
                } else {
                    res({ url: data.Location.replace("http:", "https:") })
                }
            });
        } catch (error) {
            console.log(error)
        }
    });
}

exports.exportMobile = async (method, data) => {
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
