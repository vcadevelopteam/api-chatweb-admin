const columnsFunction = require('./columnsFunction');
const logger = require('./winston');
const axios = require('axios')
const crypto = require('crypto');

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
                const advance_search = columnsFunction[origin][key].advance_search;
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
                                    if (advance_search) {
                                        where += ` and ${column} ilike '%${f.value.replace(new RegExp(` `, 'g'), '%')}%'`;
                                    }
                                    else {
                                        where += ` and ${column} ilike '%${f.value}%'`;
                                    }
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
    if (parameters.partnerid === null || parameters.partnerid === undefined)
        parameters.partnerid = user.partnerid;
    if (parameters.username === null || parameters.username === undefined)
        parameters.username = user.usr;
    if (parameters.userid === null || parameters.userid === undefined)
        parameters.userid = user.userid;
    if (parameters.agentid === null || parameters.agentid === undefined)
        parameters.agentid = user.userid
    if (parameters.companyuser === null || parameters.companyuser === undefined)
        parameters.companyuser = (user?.companyuser || "")

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
    RECAPTCHA_ERROR: "RECAPTCHA_ERROR",
    PARAMETER_IS_MISSING: "PARAMETER_IS_MISSING",
    REQUEST_SERVICES: "REQUEST_SERVICES",
    REQUEST_BRIDGE: "REQUEST_BRIDGE",
    LIMIT_EXCEEDED: "LIMIT_EXCEEDED",
    COS_UNEXPECTED_ERROR: "COS_UNEXPECTED_ERROR",

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
    "E-ZYX-51000": "TICKET_OPEN",
}
exports.errors = errorstmp;

function runTimeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const statusAllowed = [400, 200, 401, 404, 500];

exports.axiosObservable = async ({ method = "post", url, data = undefined, headers = undefined, _requestid = undefined, timeout }) => {
    const profiler = logger.startTimer();

    let rr = null
    let retry = 3;
    retry = retry - 1;

    while (true) {
        try {
            rr = await axios({ method, url, data, headers, timeout: timeout || 600000 });

            profiler.done({ _requestid, message: `Request to ${url}`, status: rr.status, input: data, output: rr.data });
        } catch (error) {
            const errorLog = {
                level: "error",
                _requestid,
                message: `Request to ${url}`,
                input: data
            }

            if (error?.response) {
                if (!statusAllowed.includes(error?.response?.status) && retry !== 0) {
                    retry = retry - 1;
                    await runTimeout(3000);
                    continue;
                }
                errorLog.message += " " + error.response?.status;
                errorLog.detail = {
                    data: error.response?.data,
                    status: error.response?.status,
                    headers: error.response?.headers,
                }

                profiler.done(errorLog);

                throw ({ ...new Error(error), ...error, notLog: true });
            } else {
                if (retry !== 0) {
                    retry = retry - 1;
                    await runTimeout(3000);
                    continue;
                }

                errorLog.detail = error.request || error.message;

                profiler.done(errorLog);

                throw ({ ...new Error(error), ...error, notLog: true });
            }
        }
        break;
    }

    return rr;
}

exports.getErrorSeq = (err, profiler, method, _requestid = "") => {
    //profiler es el contorl de tiempo
    const messageerror = err.toString().replace("SequelizeDatabaseError: ", "");
    const errorcode = messageerror.includes("Named bind parameter") ? "PARAMETER_IS_MISSING" : err?.parent?.code;
    if (errorcode !== "P0001") {
        profiler && profiler.done({ _requestid, message: `Executed ${method}`, level: "error", err: { message: messageerror, code: errorcode, detail: err } });
    }

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
    if (str.includes("day")) {
        days = parseInt(str.split(" day")[0]);
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
    if (str.includes("day")) {
        days = parseInt(str.split(" day")[0]);
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

exports.cleanPropertyValue = (listproperty, { type, subtype }) => {
    if (type === "communicationchannelid") {
        return listproperty.reduce((acc, item) => ({
            ...acc,
            [item.communicationchannelid]: subtype === "int" ? parseInt(item.propertyvalue || '0') : (subtype === "bool" ? item.propertyvalue === "1" : item.propertyvalue)
        }), {})
    } else {
        const property = listproperty[0];
        if (property) {
            return type === "bool" ? property.propertyvalue === "1" : (type === "int" ? parseInt(property.propertyvalue) : property.propertyvalue);
        }
        return type === "bool" ? false : (type === "int" ? 0 : '');
    }
}

exports.secondsToTime = (sec_num, format = "time") => {
    sec_num = parseInt(sec_num)
    if (format === "seconds") {
        return sec_num
    } else if (format === "minutes") {
        return parseInt((sec_num / 60).toFixed())
    } else if (format === "hours") {
        return parseInt((sec_num / 3600).toFixed())
    }
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

exports.buildcsv = (data) => {
    let csv = ""
    csv += Object.keys(data[0]).join(";");
    data.forEach(dt => {
        csv += '\n';
        csv += Object.values(dt).map(x => `${x}`.replace(/\;/, ',')).join(';');
    });
    return csv;
}

exports.formatDecimals = (num) => {
    if (num) {
        return num.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
    }
    return "0"
}

exports.recaptcha = async (secret, key) => {
    const data = { secret, response: key };

    try {
        const response = await this.axiosObservable({
            url: `https://www.google.com/recaptcha/api/siteverify`,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            data: new URLSearchParams(Object.entries(data)).toString(),
            method: "POST",
        })
        return response.data;
    } catch (error) {
        return { error: true, message: error.message, detail: error.stack, err: error };
    }
}

exports.decryptString = (encryptedText, passphrase) => {
    const salt = Buffer.from('e436012c37657c7a1febc9ff250b2ac0', 'ascii');
    const iv = Buffer.alloc(16, 0); // Inicializando un buffer con ceros para el IV
    
    // Derivando la clave usando PBKDF2
    const key = crypto.pbkdf2Sync(passphrase, salt, 1000, 32, 'sha1');
  
    const encryptedTextBuffer = Buffer.from(encryptedText, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  
    let decrypted = decipher.update(encryptedTextBuffer, 'binary', 'utf8');
    decrypted += decipher.final('utf8');
  
    return decrypted;
}