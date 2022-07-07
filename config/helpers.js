const columnsFunction = require('./columnsFunction');
const logger = require('./winston');
const axios = require('axios')

exports.generatefilter = (filters, origin, daterange, offset) => {
    let where = "";
    if (Object.values(filters)[0]?.operator === 'or') {
        where += `and (${Object.entries(filters).map(([key, f]) => `(${columnsFunction[origin][key].column})::text ilike '%${f.value}%'`
        ).join(' or ')})`
    }
    else {
        for (const [key, f] of Object.entries(filters)) {
            if (f) {
                const column = columnsFunction[origin][key].column;
                const type = columnsFunction[origin][key].type;
                if (f.value !== '' || ['empty', 'isempty', 'noempty', 'isnotempty', 'isnull', 'isnotnull'].includes(f.operator)) {
                    switch (type) {
                        case "json":
                            where += ` and ${column.replace('###JVALUE###', f.value)}`;
                            break;
                        case "number":
                            switch (f.operator) {
                                case 'greater':
                                    where += ` and ${column} > ${f.value}`;
                                    break;
                                case 'greaterequal': case 'greaterorequals':
                                    where += ` and ${column} >= ${f.value}`;
                                    break;
                                case 'smaller': case 'less':
                                    where += ` and ${column} < ${f.value}`;
                                    break;
                                case 'smallerequal': case 'lessorequals':
                                    where += ` and ${column} <= ${f.value}`;
                                    break;
                                case 'isnull':
                                    where += ` and ${column} is null`;
                                    break;
                                case 'isnotnull':
                                    where += ` and ${column} is not null`;
                                    break;
                                case 'noequals': case 'notequals':
                                    where += ` and ${column} <> ${f.value}`;
                                    break;
                                case 'equals':
                                    where += ` and ${column} = ${f.value}`;
                                    break;
                                default:
                                    break;
                            }
                            break;
                        case "datestr":
                            switch (f.operator) {
                                case 'after':
                                    where += ` and (${column})::DATE > '${f.value}'::DATE`;
                                    break;
                                case 'afterequals':
                                    where += ` and (${column})::DATE >= '${f.value}'::DATE`;
                                    break;
                                case 'before':
                                    where += ` and (${column})::DATE < '${f.value}'::DATE`;
                                    break;
                                case 'beforeequals':
                                    where += ` and (${column})::DATE <= '${f.value}'::DATE`;
                                    break;
                                case 'isnull':
                                    where += ` and ${column} is null`;
                                    break;
                                case 'isnotnull':
                                    where += ` and ${column} is not null`;
                                    break;
                                case 'notequals':
                                    where += ` and (${column})::DATE <> '${f.value}'::DATE`;
                                    break;
                                case 'equals':
                                    where += ` and (${column})::DATE = '${f.value}'::DATE`;
                                    break;
                                default:
                                    break;
                            }
                            break;
                        case "date":
                            switch (f.operator) {
                                case 'after':
                                    where += column.includes("p_offset") ? ` and (${column})::DATE > '${f.value}'::DATE` : ` and ${column} > '${f.value}'::DATE + INTERVAL '1DAY' - ${offset} * INTERVAL '1HOUR'`;
                                    break;
                                case 'afterequals':
                                    where += column.includes("p_offset") ? ` and (${column})::DATE >= '${f.value}'::DATE` : ` and ${column} >= '${f.value}'::DATE - ${offset} * INTERVAL '1HOUR'`;
                                    break;
                                case 'before':
                                    where += column.includes("p_offset") ? ` and (${column})::DATE < '${f.value}'::DATE` : ` and ${column} < '${f.value}'::DATE - ${offset} * INTERVAL '1HOUR'`;
                                    break;
                                case 'beforeequals':
                                    where += column.includes("p_offset") ? ` and (${column})::DATE <= '${f.value}'::DATE` : ` and ${column} <= '${f.value}'::DATE + INTERVAL '1DAY' - ${offset} * INTERVAL '1HOUR'`;
                                    break;
                                case 'isnull':
                                    where += ` and ${column} is null`;
                                    break;
                                case 'isnotnull':
                                    where += ` and ${column} is not null`;
                                    break;
                                case 'notequals':
                                    where += column.includes("p_offset") ? ` and (${column})::DATE <> '${f.value}'::DATE` : ` and (${column} + ${offset} * INTERVAL '1HOUR')::DATE <> '${f.value}'::DATE`;
                                    break;
                                case 'equals':
                                    where += column.includes("p_offset") ? ` and (${column})::DATE = '${f.value}'::DATE` : ` and (${column} + ${offset} * INTERVAL '1HOUR')::DATE = '${f.value}'::DATE`;
                                    break;
                                default:
                                    break;
                            }
                            break;
                        case "datetime":
                            switch (f.operator) {
                                case 'after':
                                    where += column.includes("p_offset") ? ` and (${column})::TIMESTAMP > ('${f.value}')::TIMESTAMP` : ` and ${column} > ('${f.value}' + INTERVAL '1DAY')::TIMESTAMP - ${offset} * INTERVAL '1HOUR'`;
                                    break;
                                case 'afterequals':
                                    where += column.includes("p_offset") ? ` and (${column})::TIMESTAMP >= ('${f.value}')::TIMESTAMP` : ` and ${column} >= ('${f.value}')::TIMESTAMP - ${offset} * INTERVAL '1HOUR'`;
                                    break;
                                case 'before':
                                    where += column.includes("p_offset") ? ` and (${column})::TIMESTAMP < ('${f.value}')::TIMESTAMP` : ` and ${column} < ('${f.value}')::TIMESTAMP - ${offset} * INTERVAL '1HOUR'`;
                                    break;
                                case 'beforeequals':
                                    where += column.includes("p_offset") ? ` and (${column})::TIMESTAMP <= ('${f.value}')::TIMESTAMP` : ` and ${column} <= ('${f.value}' + INTERVAL '1DAY')::TIMESTAMP - ${offset} * INTERVAL '1HOUR'`;
                                    break;
                                case 'isnull':
                                    where += ` and ${column} is null`;
                                    break;
                                case 'isnotnull':
                                    where += ` and ${column} is not null`;
                                    break;
                                case 'notequals':
                                    where += column.includes("p_offset") ? ` and DATE_TRUNC('MINUTE', (${column})::TIMESTAMP) <> ('${f.value}')::TIMESTAMP` : ` and DATE_TRUNC('MINUTE', (${column})::TIMESTAMP) <> (('${f.value}')::TIMESTAMP - ${offset} * INTERVAL '1HOUR')::TIMESTAMP`;
                                    break;
                                case 'equals':
                                    where += column.includes("p_offset") ? ` and DATE_TRUNC('MINUTE', (${column})::TIMESTAMP) = ('${f.value}')::TIMESTAMP` : ` and DATE_TRUNC('MINUTE', (${column})::TIMESTAMP) = (('${f.value}')::TIMESTAMP - ${offset} * INTERVAL '1HOUR')::TIMESTAMP`;
                                    break;
                                default:
                                    break;
                            }
                            break;
                        case "time":
                            switch (f.operator) {
                                case 'after':
                                    where += ` and ${column}::INTERVAL > ('${f.value}')::INTERVAL`;
                                    break;
                                case 'afterequals':
                                    where += ` and ${column}::INTERVAL >= ('${f.value}')::INTERVAL`;
                                    break;
                                case 'before':
                                    where += ` and ${column}::INTERVAL < ('${f.value}')::INTERVAL`;
                                    break;
                                case 'beforeequals':
                                    where += ` and ${column}::INTERVAL <= ('${f.value}')::INTERVAL`;
                                    break;
                                case 'isnull':
                                    where += ` and ${column} is null`;
                                    break;
                                case 'isnotnull':
                                    where += ` and ${column} is not null`;
                                    break;
                                case 'notequals':
                                    where += ` and ${column}::INTERVAL <> ('${f.value}')::INTERVAL`;
                                    break;
                                case 'equals':
                                    where += ` and ${column}::INTERVAL = ('${f.value}')::INTERVAL`;
                                    break;
                                default:
                                    break;
                            }
                            break;
                        case "boolean":
                            switch (f.operator) {
                                case 'istrue':
                                    where += ` and ${column} = true`;
                                    break;
                                case 'isfalse':
                                    where += ` and ${column} = false`;
                                    break;
                                case 'isnull':
                                    where += ` and ${column} is null`;
                                    break;
                                case 'isnotnull':
                                    where += ` and ${column} is not null`;
                                    break;
                                case 'all':
                                default:
                                    break;
                            }
                            break;
                        case "string":
                        default:
                            switch (f.operator) {
                                case 'equals':
                                    where += ` and ${column} = '${f.value}'`;
                                    break;
                                case 'noequals': case 'notequals':
                                    where += ` and ${column} <> '${f.value}'`;
                                    break;
                                case 'empty': case 'isempty':
                                    where += ` and (${column} = '' or ${column} is null)`;
                                    break;
                                case 'noempty': case 'isnotempty':
                                    where += ` and ${column} <> '' and ${column} is not null`;
                                    break;
                                case 'isnull':
                                    where += ` and ${column} is null`;
                                    break;
                                case 'isnotnull':
                                    where += ` and ${column} is not null`;
                                    break;
                                case 'nocontains': case 'notcontains':
                                    where += ` and ${column} not ilike '%${f.value}%'`;
                                    break;
                                case 'contains':
                                    where += ` and ${column} ilike '%${f.value}%'`;
                                    break;
                                case 'greater':
                                    where += ` and ${column} > ${f.value}`;
                                    break;
                                case 'greaterequal': case 'greaterorequals':
                                    where += ` and ${column} >= ${f.value}`;
                                    break;
                                case 'smaller': case 'less':
                                    where += ` and ${column} < ${f.value}`;
                                    break;
                                case 'smallerequal': case 'lessorequals':
                                    where += ` and ${column} <= ${f.value}`;
                                    break;
                                default:
                                    break;
                            }
                            break;
                    }
                }
            }
        }
    }

    if (daterange && daterange.startDate) {
        const startdate = daterange.startDate.substring(0, 10);
        const enddate = daterange.endDate.substring(0, 10);

        const columndate = columnsFunction[origin]["datefilter"].column;
        where += ` and ${columndate} between '${startdate}' and '${enddate}' `;
    }
    return where.replace(/###OFFSET###/gi, offset.toString());
}

exports.generateSort = (sorts, origin) => {
    let order = "";

    for (const [key, value] of Object.entries(sorts)) {
        if (value) {
            const column = columnsFunction[origin][key].column;
            order += ` ${column} ${value},`;
        }
    }
    if (order)
        order = order.substring(0, order.length - 1);

    return order;
}

exports.setSessionParameters = (parameters, user, id) => {
    if (id)
        parameters._requestid = id;
    if (parameters.corpid === null || parameters.corpid === undefined)
        parameters.corpid = user.corpid ? user.corpid : 1;
    if (parameters.orgid === null || parameters.orgid === undefined)
        parameters.orgid = user.orgid ? user.orgid : 1;
    if (parameters.username === null || parameters.username === undefined)
        parameters.username = user.usr;
    if (parameters.userid === null || parameters.userid === undefined)
        parameters.userid = user.userid;

    return parameters;
}
const errorstmp = {
    VARIABLE_INCOMPATIBILITY_ERROR: "VARIABLE_INCOMPATIBILITY_ERROR",
    NOT_FUNCTION_ERROR: "NOT_FUNCTION_ERROR",
    UNEXPECTED_DB_DBERROR: "UNEXPECTED_DB_ERROR",
    UNEXPECTED_ERROR: "UNEXPECTED_ERROR",
    COS_UNEXPECTED: "COS_UNEXPECTED",
    ZERO_RECORDS_ERROR: "ZERO_RECORDS",
    FORBIDDEN: "E-ZYX-FORBIDDEN",

    LOGIN_USER_INCORRECT: "LOGIN_USER_INCORRECT",
    LOGIN_USER_PENDING: "LOGIN_USER_PENDING",
    LOGIN_LOCKED_BY_ATTEMPTS_FAILED_PASSWORD: "LOGIN_LOCKED_BY_ATTEMPTS_FAILED_PASSWORD",
    LOGIN_LOCKED_BY_INACTIVED: "LOGIN_LOCKED_BY_INACTIVED",
    LOGIN_LOCKED_BY_PASSWORD_EXPIRED: "LOGIN_LOCKED_BY_PASSWORD_EXPIRED",
    LOGIN_LOCKED: "LOGIN_LOCKED",
    LOGIN_USER_INACTIVE: "LOGIN_USER_INACTIVE",
    LOGIN_NO_INTEGRATION: "LOGIN_NO_INTEGRATION",
    PARAMETER_IS_MISSING: "PARAMETER_IS_MISSING",
    REQUEST_SERVICES: "REQUEST_SERVICES",
    REQUEST_BRIDGE: "REQUEST_BRIDGE",
    LIMIT_EXCEEDED: "LIMIT_EXCEEDED",

    "23505": "ALREADY_EXISTS_RECORD",
    "E-ZYX-23505": "ALREADY_EXISTS_RECORD",
    "E-ZYX-23509": "ALREADY_EXISTS_CHANNEL",
    "E-ZYX-23510": "CHANNEL_ALREADY_IN_USE",
    "22012": "DIVISON_BY_ZERO",
    "E-ZYX-22012": "DIVISON_BY_ZERO",
    "22001": "PARAMETER_TOO_LONG",
    "E-ZYX-42622": "PARAMETER_TOO_LONG",
    "23502": "NULL_NOT_ALLOWED",
    "E-ZYX-23502": "NULL_NOT_ALLOWED",
    "42601": "SINTAX_ERROR",
    "E-ZYX-42601": "SINTAX_ERROR",
    "42883": "FUNCTION_NOT_EXISTS",
    "E-ZYX-50050": "NO_CREDIT",
    "E-ZYX-50051": "EXCESS_CHANNELS",
    "E-ZYX-50052": "EXCESS_USERS",
    "E-ZYX-50151": "CHANNELS_LIMIT",
    "E-ZYX-50152": "USERS_LIMIT",
    "E-ZYX-50100": "NOT_ALLOWED_TIME",
}
exports.errors = errorstmp;

exports.axiosObservable = async ({ method = "post", url, data = undefined, headers = undefined, _requestid = undefined }) => {
    const profiler = logger.startTimer();

    return await axios({
        method,
        url,
        data,
        headers,
    })
        .then(r => {
            profiler.done({ _requestid, message: `Request to ${url}`, status: r.status, input: data, output: r.data });
            return r;
        })
        .catch(r => {
            profiler.done({ level: "warn", _requestid, message: `Request to ${url}`, status: r.response?.status, input: data, output: r.data });
            throw { ...r, notLog: true }
        });
}

exports.getErrorSeq = (err, profiler, method) => {
    //profiler es el contorl de tiempo
    const messageerror = err.toString().replace("SequelizeDatabaseError: ", "");
    const errorcode = messageerror.includes("Named bind parameter") ? "PARAMETER_IS_MISSING" : err.parent.code;

    profiler && profiler.done({ message: `Executed ${method}`, level: "error", error: { message: messageerror, code: errorcode, detail: err } });

    const codeError = (errorcode === 'P0001') ? messageerror : errorcode;

    return {
        success: false,
        error: true,
        rescode: 400,
        code: errorstmp[codeError] || errorstmp.UNEXPECTED_DB_DBERROR
    };
};

exports.getErrorCode = (code, error = false, origin = "", _requestid = "") => {
    if (error && !error?.notLog) {
        logger.child({ _requestid, error: { detail: error.stack || error, message: error.toString() } }).error(origin || "anonymous");
    }
    return {
        success: false,
        error: true,
        rescode: code === errorstmp.FORBIDDEN ? 401 : 400,
        code: code || errorstmp.UNEXPECTED_ERROR
    }
};

exports.printException = (error = false, origin = "", _requestid = "") => {
    logger.child({ _requestid, error: { detail: error.stack || error, message: error.toString() } }).error(origin || "anonymous");
};

exports.stringToSeconds = (str) => {
    let seconds = 0;
    let days = 0;
    let newstr = str;
    if (str.includes("day")) {
        days = parseInt(str.split(" day")[0]);
        newstr = str.split(" day")[1];
    }

    let parts = str.split(":");

    seconds += parseInt(parts[2]);
    const minutes = parseInt(parts[1]);
    const hours = parseInt(parts[0]);

    seconds += minutes * 60;
    seconds += hours * 60 * 60;
    seconds += days * 24 * 60 * 60;


    return seconds;
}

exports.stringToMinutes = (str) => {
    let seconds = 0;
    let days = 0;
    let newstr = str;
    if (str.includes("day")) {
        days = parseInt(str.split(" day")[0]);
        newstr = str.split(" day")[1];
    }

    let parts = str.split(":");

    seconds += parseInt(parts[2]);
    const minutes = parseInt(parts[1]);
    const hours = parseInt(parts[0]);

    seconds += minutes * 60;
    seconds += hours * 60 * 60;
    seconds += days * 24 * 60 * 60;


    return parseFloat((seconds / 60).toFixed(2));
}

exports.secondsToTime = (sec_num) => {
    sec_num = parseInt(sec_num)
    let days = Math.floor(sec_num / 86400);
    let hours = Math.floor((sec_num - (days * 86400)) / 3600);
    let minutes = Math.floor((sec_num - (days * 86400) - (hours * 3600)) / 60);
    let seconds = sec_num - (days * 86400) - (hours * 3600) - (minutes * 60);

    if (hours < 10) { hours = "0" + hours; }
    if (minutes < 10) { minutes = "0" + minutes; }
    if (seconds < 10) { seconds = "0" + seconds; }

    const stringdays = days === 0 ? days + " day " : (days > 1 ? days + " days " : days + " day ");
    return stringdays + hours + ':' + minutes + ':' + seconds;
}
