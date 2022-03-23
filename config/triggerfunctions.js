const sequelize = require('./database');
const functionsbd = require('./functions');
const XLSX = require('xlsx');
const { generatefilter, generateSort, errors, getErrorSeq, getErrorCode, stringToSeconds, secondsToTime } = require('./helpers');

const { QueryTypes } = require('sequelize');
require('pg').defaults.parseInt8 = true;

var ibm = require('ibm-cos-sdk');

var config = {
    endpoint: 's3.us-east.cloud-object-storage.appdomain.cloud',
    ibmAuthEndpoint: 'https://iam.cloud.ibm.com/identity/token',
    apiKeyId: 'LwD1YXNXSp8ZYMGIUWD2D3-wmHkmWRVcFm-5a1Wz_7G1', //'GyvV7NE7QiuAMLkWLXRiDJKJ0esS-R5a6gc8VEnFo0r5',
    serviceInstanceId: '0268699b-7d23-4e1d-9d17-e950b6804633' //'9720d58a-1b9b-42ed-a246-f2e9d7409b18',
};
const COS_BUCKET_NAME = "staticfileszyxme"
const REPLACEFILTERS = "###FILTERS###";
const REPLACESEL = "###REPLACESEL###";

const executeQuery = async (query, bind = {}) => {
    return await sequelize.query(query, {
        type: QueryTypes.SELECT,
        bind
    }).catch(err => getErrorSeq(err));
}
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
            console.time("simple-" + method);
            const result = await sequelize.query(query, {
                type: QueryTypes.SELECT,
                replacements,
                bind: data
            }).catch(err => {
                console.log(err)
                return getErrorSeq(err)
            });
            console.timeEnd("simple-" + method);
            return result;
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

                const queryCollectionCleaned = querycollection.replace("###WHERE###", data.where || "").replace("###ORDER###", data.order ? " order by " + data.order : "");
                const queryCountCleaned = querycount.replace("###WHERE###", data.where || "");

                console.time("pagination-" + methodcollection);
                const results = await Promise.all([
                    sequelize.query(queryCollectionCleaned, {
                        type: QueryTypes.SELECT,
                        bind: data
                    }),
                    sequelize.query(queryCountCleaned, {
                        type: QueryTypes.SELECT,
                        bind: data
                    })
                ]).catch(err => getErrorSeq(err));
                console.timeEnd("pagination-" + methodcollection);

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

exports.buildQueryWithFilterAndSort = async (method, data) => {
    try {
        if (functionsbd[method]) {
            let query = functionsbd[method].query;
            if (data instanceof Object) {

                data.where = generatefilter(data.filters, data.origin, data.daterange, data.offset);
                data.order = generateSort(data.sorts, data.origin);

                const queryCollectionCleaned = query.replace("###WHERE###", data.where || "").replace("###ORDER###", data.order ? " order by " + data.order : "");

                console.time("build-" + method);
                const result = await sequelize.query(queryCollectionCleaned, {
                    type: QueryTypes.SELECT,
                    bind: data
                });
                console.timeEnd("build-" + method);
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
    return await Promise.all(detail.map(async (item, index) => {
        let functionMethod = functionsbd[item.method];
        if (functionMethod) {
            if (permissions && functionMethod.module) {
                const application = permissions[functionMethod.module];
                if (functionMethod.protected && (!application || ((functionMethod.protected === "SELECT" && !application[0]) || (functionMethod.protected === "INSERT" && !application[2])))) {
                    return getErrorCode(errors.FORBIDDEN);
                }
            }
            console.time("multi-" + index + "-" + item.method);
            const r = await sequelize.query(functionMethod.query, {
                type: QueryTypes.SELECT,
                bind: item.parameters
            }).catch(err => getErrorSeq(err));
            console.timeEnd("multi-" + index + "-" + item.method);

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
                console.time("header-" + method);
                const result = await sequelize.query(functionMethod.query, {
                    type: QueryTypes.SELECT,
                    bind: parameters,
                    transaction
                }).catch(err => getErrorSeq(err));
                console.timeEnd("header-" + method);
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
                console.time("detail-" + item.method);
                const query = functionsbd[item.method];
                await sequelize.query(query, {
                    type: QueryTypes.SELECT,
                    bind: item.parameters,
                    transaction
                }).catch(err => {
                    lasterror = getErrorSeq(err);
                    throw 'error'
                });
                console.timeEnd("detail-" + item.method);
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
exports.buildQueryDynamic2 = async (columns, filters, parameters, summaries, fromExport = false) => {
    try {
        const TABLENAME = columns[0].tablename;
        const ALLCOLUMNS = [...columns, ...filters];
        let JOINNERS = Array.from(new Set(ALLCOLUMNS.filter(x => !!x.join_alias).map(x => x.join_alias))).reduce((acc, join_alias) => {
            const { join_table, join_on } = ALLCOLUMNS.find(x => x.join_alias === join_alias);
            return acc + `\nLEFT JOIN ${join_table} ${join_alias} ${join_on}`;
        }, "");

        if (ALLCOLUMNS.some(x => x.type === "variable")) {
            JOINNERS += `\nCROSS JOIN CAST(conversation.variablecontext as jsonb) as jo`
        }

        const columnValueUnique = filters.find(x => x.type_filter === "unique_value")?.columnname;
        // console.log("columnValueUnique", columnValueUnique)
        
        const COLUMNESSELECT = columns.reduce((acc, item, index) => {
            let selcol = item.columnname;

            // console.log("selcol", selcol);

            if (item.type === "interval") {
                selcol = `date_trunc('seconds', ${item.columnname})::text`;
            } else if (item.type === "variable") {
                selcol = `jo->'${item.columnname}'->>'Value'`;
            } else if (DATES.includes(item.type) && fromExport) {
                selcol = `to_char(${item.columnname} + $offset * interval '1hour', 'YYYY-MM-DD HH24:MI:SS')`;
            }

            if (item.columnname === columnValueUnique) {
                return ` distinct on (${selcol}) ${selcol} as "${item.columnname.replace(".", "")}"` + (acc ? ", " : "") + acc;
            } else {
                return acc + (index === 0 ? "" : ",") + `${selcol} as "${item.columnname.replace(".", "")}"`
            }
        }, "")
        console.log(filters)
        const FILTERS = filters.reduce((acc, { type, columnname, start, end, value }) => {
            if (DATES.includes(type)) {
                return `${acc}\nand ${columnname} >= '${start}'::DATE - $offset * INTERVAL '1hour' and ${columnname} < '${end}'::DATE + INTERVAL '1day' - $offset * INTERVAL '1hour'`
            } else if (!!value) {

                const filter_array = `ANY(string_to_array('${value}',',')::${type}[])`

                if (NUMBERS.includes(type)) {
                    return `${acc}\nand ${columnname} = ${value.includes(",") ? filter_array : value}`
                } else if (type === "variable") {
                    return `${acc}\nand (conversation.variablecontext::jsonb)->'${columnname}'->>'Value' ilike ${value.includes(",") ? filter_array : "'" + value + "'"}`
                } else {
                    if (columnname === "conversation.tags") {
                        if (value.includes(",")) {
                            return `${acc}\nand ${filter_array}  && string_to_array(${columnname}, ',')`
                        } else {
                            return `${acc}\nand '${value}'  = any(string_to_array(${columnname}, ','))`
                        }
                    } else {
                        return `${acc}\nand ${columnname} ilike ${value.includes(",") ? filter_array : "'" + value + "'"}`
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
        `;
        console.log(query)
        const resultbd = await executeQuery(query, parameters);
        
        if (summaries.length > 0 && resultbd.length > 0) {
            const firstColumn = columns.reduce((acc, item) => ({
                ...acc,
                [item.columnname.replace(".", "")]: ''
            }), {})

            const datawith = summaries.reduce((acc, item) => {
                let columnname = item.columnname.replace(".", "");
                const columnnameonly = item.columnname.replace(".", "");
                let tmpdata = [...resultbd];

                if (item.type === "interval") {
                    tmpdata = tmpdata.map(x => ({
                        ...x,
                        [columnname + "seconds"]: stringToSeconds(x[columnname] || "00:00:00")
                    }))
                    columnname = columnname + "seconds";
                }

                if (item.function === "count") {
                    acc[columnnameonly] += (acc[columnnameonly] ? " - " : "") + item.function.toUpperCase() + ": " + tmpdata.filter(x => !!x[columnname]).length;
                } else if (item.function === "count_unique") {
                    acc[columnnameonly] += (acc[columnnameonly] ? " - " : "") + item.function.toUpperCase() + ": " + Array.from(new Set(tmpdata.map(x => x[columnname] || ""))).length;
                } else if (item.function === "total") {
                    const auxq = item.function.toUpperCase() + ": " + tmpdata.reduce((a, b) => a + b[columnname], 0);
                    acc[columnnameonly] += (acc[columnnameonly] ? " - " : "") + item.type === "interval" ? secondsToTime(auxq) : auxq;
                } else if (item.function === "average") {
                    const auxq = tmpdata.map(x => x[columnname]).reduce((a, b) => a + b, 0) / tmpdata.length;
                    acc[columnnameonly] += (acc[columnnameonly] ? " - " : "") + item.function.toUpperCase() + ": " + (item.type === "interval" ? secondsToTime(auxq) : auxq);
                } else if (item.function === "minimum") {
                    const auxq = tmpdata.reduce((a, b) => a < b[columnname] ? a : b[columnname], tmpdata[0][columnname]);
                    acc[columnnameonly] += (acc[columnnameonly] ? " - " : "") + item.function.toUpperCase() + ": " + (item.type === "interval" ? secondsToTime(auxq) : auxq);
                } else if (item.function === "maximum") {
                    const auxq = tmpdata.reduce((a, b) => a > b[columnname] ? a : b[columnname], tmpdata[0][columnname]);
                    acc[columnnameonly] += (acc[columnnameonly] ? " - " : "") + item.function.toUpperCase() + ": " + (item.type === "interval" ? secondsToTime(auxq) : auxq);
                } else if (item.function === "median") {
                    const mid = Math.floor(tmpdata.length / 2);
                    const numbs = tmpdata.map(x => x[columnname]).sort((a, b) => a - b);
                    const auxq = tmpdata.length % 2 !== 0 ? numbs[mid] : (numbs[mid - 1] + numbs[mid]) / 2;
                    acc[columnnameonly] += (acc[columnnameonly] ? " - " : "") + item.function.toUpperCase() + ": " + (item.type === "interval" ? secondsToTime(auxq) : auxq);
                } else if (item.function === "mode") {
                    const auxq = tmpdata.map(x => x[columnname]).sort((a, b) =>
                        tmpdata.filter(v => v === a).length
                        - tmpdata.filter(v => v === b).length
                    ).pop();
                    acc[columnnameonly] += (acc[columnnameonly] ? " - " : "") + item.function.toUpperCase() + ": " + (item.type === "interval" ? secondsToTime(auxq) : auxq);
                }
                return acc;
            }, firstColumn)

            resultbd.unshift(datawith);
        }
        return resultbd;
    } catch (error) {
        console.log(error)
        return getErrorCode(errors.UNEXPECTED_ERROR, error);
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

        if (ALLCOLUMNS.some(x => x.type === "variable")) {
            JOINNERS += `\nCROSS JOIN CAST(conversation.variablecontext as jsonb) as jo`
        }
        
        const COLUMNESSELECT = columns.reduce((acc, item, index) => {
            let selcol = item.columnname;
            
            let coalescedefault = '0';

            if (item.type === "interval") {
                coalescedefault = "'00:00:00'"
                // selcol = `date_trunc('seconds', ${item.columnname})`;
            } else if (item.type === "variable") {
                selcol = `jo->'${item.columnname}'->>'Value'`;
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
                return acc + `, sum(coalesce(${sel0l}, ${coalescedefault})) total`
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

        }, `date_part('${interval}', ${dataorigin}.createdate + $offset * INTERVAL '1hour') "interval"`)

        const FILTERS = filters.reduce((acc, { type, columnname, start, end, value }) => {
            if (DATES.includes(type)) {
                return `${acc}\nand ${columnname} >= '${start}'::DATE - $offset * INTERVAL '1hour' and ${columnname} < '${end}'::DATE + INTERVAL '1day' - $offset * INTERVAL '1hour'`
            } else if (!!value) {
                if (NUMBERS.includes(type)) {
                    return `${acc}\nand ${columnname} = ${value}`
                } else if (type === "variable") {
                    return `${acc}\nand (conversation.variablecontext::jsonb)->'${columnname}'->>'Value' ilike '${value}'`
                } else {
                    if (columnname === "conversation.tags") {
                        return `${acc}\nand '${value}'  = any(string_to_array(${columnname}, ','))`
                    } else {
                        return `${acc}\nand ${columnname} ilike '${value}'`
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
        console.log(query)
        const resultbd = await executeQuery(query, parameters);
        
        return resultbd;
    } catch (error) {
        console.log(error)
        return getErrorCode(errors.UNEXPECTED_ERROR, error);
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
            json_typeof(co.variablecontext::json) = 'object' 
            and co.corpid = $corpid 
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
                            whereQuery += ` and (co.variablecontext::jsonb)->'${item.key}'->>'Value' in (${listFilters}) `;
                        }
                        else
                            whereQuery += ` and (co.variablecontext::jsonb)->'${item.key}'->>'Value' = '${filterCleaned}'`;
                    }
                    return `${acc}, (co.variablecontext::jsonb)->'${item.key}'->>'Value' as "${item.key}"`
                }

            }, "");
        }

        query = query.replace(REPLACEFILTERS, whereQuery).replace(REPLACESEL, selQuery);
        // console.log(query)

        return await executeQuery(query, parameters);
    } catch (error) {
        return getErrorCode(errors.UNEXPECTED_ERROR, error);
    }
}

exports.exportData = (dataToExport, reportName, formatToExport, headerClient = null) => {
    let content = "";
    try {
        const titlefile = (reportName || "report") + new Date().toISOString() + (formatToExport ? ".xlsx" : ".csv");
        if (dataToExport instanceof Array && dataToExport.length > 0) {
            var s3 = new ibm.S3(config);
            let keysHeaders;
            const keys = Object.keys(dataToExport[0]);
            keysHeaders = keys;
            // console.log(headerClient)
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
                const ws = XLSX.utils.json_to_sheet(dataToExport, headerClient ? {
                    skipHeader: !!headerClient,
                } : undefined);

                const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
                const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

                const params = {
                    ACL: 'public-read',
                    Key: titlefile,
                    Body: excelBuffer,
                    Bucket: COS_BUCKET_NAME,
                    ContentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
                }
                console.time(`uploadcos`);
                return new Promise((res, rej) => {
                    s3.upload(params, (err, data) => {
                        if (err) {
                            res(getErrorCode(errors.COS_UNEXPECTED, err));
                        } else {
                            console.timeEnd(`uploadcos`);
                            res({ url: (data.Location || "").replace("http.", "https.") })
                        }
                    });
                });
            } else {
                console.time(`draw-csv`);
                content += Object.keys(dataToExport[0]).join() + "\n";
                dataToExport.forEach((rowdata) => {
                    let rowjoined = Object.values(rowdata).join("##");
                    if (rowjoined.includes(",")) {
                        rowjoined = Object.values(rowdata).map(x => (x && typeof x === "string") ? (x.includes(",") ? `"${x}"` : x) : x).join();
                    } else {
                        rowjoined = rowjoined.replace(/##/gi, ",");
                    }
                    content += rowjoined + "\n";
                });
                console.timeEnd(`draw-csv`);


                const params = {
                    ACL: 'public-read',
                    Key: titlefile,
                    Body: Buffer.from(content, 'ASCII'),
                    Bucket: COS_BUCKET_NAME,
                    ContentType: "text/csv",
                }
                console.time(`uploadcos`);
                return new Promise((res, rej) => {
                    s3.upload(params, (err, data) => {
                        if (err) {
                            rej(getErrorCode(errors.COS_UNEXPECTED_ERROR, err));
                        }
                        console.timeEnd(`uploadcos`);
                        res({ url: (data.Location || "").replace("http.", "https.") })
                    });
                });
            }
        } else {
            return getErrorCode(errors.ZERO_RECORDS_ERROR);
        }
    } catch (error) {
        return getErrorCode(errors.UNEXPECTED_ERROR, error);
    }
}