const columnsFunction = require('./columnsFunction');

exports.generatefilter = (filters, origin, daterange, offset) => {
    let where = "";
    for (const [key, f] of Object.entries(filters)) {
        if (f) {
            const column = columnsFunction[origin][key].column;
            const type = columnsFunction[origin][key].type;
            if (f.value !== '' ) {

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

        const columndate = columnsFunction[origin]["fechafilter"].column.replace(/###OFFSET###/gi, offset.toString());
        where += ` and ${columndate} between '${startdate}' and '${enddate}' `;
    }
    return where;
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