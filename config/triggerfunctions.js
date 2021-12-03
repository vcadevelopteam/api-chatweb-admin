const sequelize = require('./database');
const functionsbd = require('./functions');
const XLSX = require('xlsx');
const { generatefilter, generateSort, errors, getErrorSeq, getErrorCode } = require('./helpers');

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
            
            return await sequelize.query(query, {
                type: QueryTypes.SELECT,
                replacements,
                bind: data
            }).catch(err => {
                console.log(err)
                return getErrorSeq(err)
            });
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

                const queryCollectionCleaned = query.replace("###WHERE###", data.where || "");

                const result = await sequelize.query(queryCollectionCleaned, {
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

exports.exportData = (dataToExport, reportName, formatToExport) => {
    let content = "";
    try {
        const titlefile = (reportName || "report") + new Date().toISOString() + (formatToExport ? ".xlsx" : ".csv");
        if (dataToExport instanceof Array && dataToExport.length > 0) {
            var s3 = new ibm.S3(config);

            if (formatToExport === "excel") {
                const ws = XLSX.utils.json_to_sheet(dataToExport);
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
                            res({ url: data.Location })
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
                        res({ url: data.Location })
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