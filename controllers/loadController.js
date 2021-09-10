const sequelize = require('../config/database');
const { getErrorSeq } = require('../config/helpers');
const { QueryTypes } = require('sequelize');

exports.load = async (req, res) => {
    const { filter = null, data = null, sort = null, limit = null} = req.body;
    const { table_name, action } = req.params;
    const coreTables = getCoreTables();
    const validActions = ['insert_one', 'insert_many', 'update','remove','find_one','find_many']
    // setSessionParameters(parameters, req.user);

    if (coreTables.includes(table_name))
        return res.status(400).json({ code: 'INVALID CORE TABLE' })

    if (!validActions.includes(action))
        return res.status(400).json({ code: 'INVALID ACTION' })
    

    let columns, values, q_data, w_data, s_data = []
    let query = '';
    
    switch (action) {
        case 'insert_one':
            columns = getColumns(data)
            values = getValues(data)
            query = `INSERT INTO ${table_name}(${columns.join(',')}) VALUES(${values.join(',')})`
            break;

        case 'insert_many':
            values = getValues(data)
            columns = getColumns(data)
            query = `INSERT INTO ${table_name}(${columns.join(',')}) VALUES ${values.map(e => "(" + e.join(',') + ")" )}`
            break;

        case 'update':
            q_data = equalQuery(data)
            w_data = equalQuery(filter)
            query = `UPDATE ${table_name} SET ${q_data.join(', ')} WHERE ${w_data.join(' AND ')}`
            break;

        case 'remove':
            w_data = equalQuery(filter)
            query = `UPDATE ${table_name} SET status = 'ELIMINADO' WHERE ${w_data.join(' AND ')}`
            break;

        case 'find_one':
            w_data = (filter) ? `WHERE ${equalQuery(filter).join(' AND ')}` : ''
            s_data = (sort) ? `order by ${getSort(sort).join(', ')}` : ''
            query = `SELECT * FROM ${table_name} ${w_data}  ${s_data} limit 1`;
            break;

        case 'find_many':
            w_data = (filter) ? `WHERE ${equalQuery(filter).join(' AND ')}` : ''
            s_data = (sort) ? `order by ${getSort(sort).join(', ')}` : ''
            let s_limit = (limit) ? ` limit ${limit}` : ''
            query = `SELECT * FROM ${table_name} ${w_data} ${s_data} ${s_limit}`;
            break;

        default:
            break;
    }
    
    let result = await sequelize.query(query,{type: QueryTypes.SELECT}).catch(err => getErrorSeq(err));

    if (result instanceof Array) {
        result = (action === 'find_one') ? result[0] : result;
        return res.json({ error: false, success: true, data: result });
    }
    else
        return res.status(result.rescode).json(result);
}

function getColumns(data) {
    data = (data instanceof Array) ? data[0] : data
    return Object.keys(data)
}

function getValues(data) {
    let values = []
    if (data instanceof Array)
        data.forEach((element, index) => {
            values[index] = [];
            Object.entries(element).forEach(([key, value]) => { values[index].push(`'${value}'`) })
        })
    else
        Object.entries(data).forEach(([key, value]) => { values.push(`'${value}'`) })
    return values;
}

function equalQuery(data) {
    return Object.entries(data).map(([k,v]) => `${k} = '${v}'`)
}

function getSort(data) {
    return Object.entries(data).map(([k,v]) => `${k} ${v}`)
}

function getCoreTables() {
    return ['appintegration','application','block','blockversion','classification','communicationchannel','communicationchannelhook','communicationchannelstatus','conversation','conversationclassification','corp','domain','groupconfiguration','inappropriatewords','inputvalidation','integrationmanager','intelligentmodels','interaction','location','messagetemplate','org','orguser','person','personcommunicationchannel','post','productivity','property','quickreply','report','reportbiinteraction','role','roleapplication','sla','survey','surveyanswer','surveyquestion','tablevariable','tablevariableconfiguration','timezone','userhistory','userstatus','usertoken','usr','usrnotification','whitelist']
}