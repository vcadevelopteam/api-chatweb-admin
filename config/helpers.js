const columnsFunction = require('./columnsFunction');

exports.generatefilter = (filters, origin, daterange, offset) => {
    let where = "";
    for (const [key, f] of Object.entries(filters)) {
        if (f) {
            const column = columnsFunction[origin][key].column;
            const type = columnsFunction[origin][key].type;
            if (f.value !== '') {

                switch (f.operator) {
                    case 'contains':
                        where += ` and ${column} ilike '%${f.value}%'`;
                        break;
                    case 'nocontains':
                        where += ` and ${column} not ilike '%${f.value}%'`;
                        break;
                    case 'equals':
                        where += ` and ${column} = '${f.value}'`;
                        break;
                    case 'noequals':
                        where += ` and ${column} <> '${f.value}'`;
                        break;
                    case 'empty':
                        where += ` and (${column} = '' or ${column} is null)`;
                        break;
                    case 'noempty':
                        where += ` and ${column} <> '' and ${column} is not null`;
                        break;
                    case 'greater':
                        where += ` and ${column} > ${f.value}`;
                        break;
                    case 'greaterequal':
                        where += ` and ${column} >= ${f.value}`;
                        break;
                    case 'smaller':
                        where += ` and ${column} < ${f.value}`;
                        break;
                    case 'smallerequal':
                        where += ` and ${column} <= ${f.value}`;
                        break;
                    default:
                        break;
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

exports.setSessionParameters = (parameters, user) => {
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
    COS_UNEXPECTED_ERROR: "COS_UNEXPECTED_ERROR",
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

    "23505": "ALREADY_EXISTS_RECORD",
    "E-ZYX-23505": "ALREADY_EXISTS_RECORD",
    "22012": "DIVISON_BY_ZERO",
    "E-ZYX-22012": "DIVISON_BY_ZERO",
    "22001": "PARAMETER_TOO_LONG",
    "E-ZYX-42622": "PARAMETER_TOO_LONG",
    "23502": "NULL_NOT_ALLOWED",
    "E-ZYX-23502": "NULL_NOT_ALLOWED",
    "42601": "SINTAX_ERROR",
    "E-ZYX-42601": "SINTAX_ERROR",
    "42883": "FUNCTION_NOT_EXISTS",   
}
exports.errors = errorstmp;

exports.getErrorSeq = err => {
    const messageerror = err.toString().replace("SequelizeDatabaseError: ", "");
    const errorcode = messageerror.includes("Named bind parameter") ? "PARAMETER_IS_MISSING" : err.parent.code;
    console.log(`${new Date()}: ${errorcode}-${messageerror}`);
    const codeError = (errorcode === 'P0001') ? messageerror : errorcode;
    return {
        success: false,
        error: true,
        rescode: 400,
        code: errorstmp[codeError] || errorstmp.UNEXPECTED_DB_DBERROR
    };
};

exports.getErrorCode = (code, error = false) => {
    if (error)
        console.log(`${new Date()}: ${JSON.stringify(error) || error}`);
    return {
        success: false,
        error: true,
        rescode: code === error.FORBIDDEN ? 401 : 400,
        code: code || error.UNEXPECTED_ERROR
    }
};