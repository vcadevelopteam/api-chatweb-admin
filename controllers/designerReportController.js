const { executeQuery } = require('../config/triggerfunctions');
const { setSessionParameters } = require('../config/helpers');

const REPLACEFILTERS = "###FILTERS###";
const REPLACESEL = "###REPLACESEL###";

exports.drawReport = async (req, res) => {

    const { columns, filters, parameters = {} } = req.body;

    setSessionParameters(parameters, req.user);
    let whereQuery = "";
    let whereSel = "";
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
                return `${acc} and co.createdate >= '${item.start}'::DATE + $offset * INTERVAL '1hour' and co.createdate < '${item.end}'::DATE + INTERVAL '1day' + $offset * INTERVAL '1hour'`
            else if (item.column === "finishdate")
                return `${acc} and co.finishdate >= '${item.start}'::DATE + $offset * INTERVAL '1hour' and co.finishdate < '${item.end}'::DATE + INTERVAL '1day' + $offset * INTERVAL '1hour'`
            else if (item.column === "communicationchannelid")
                return `${acc} and co.communicationchannelid = ANY(string_to_array('${item.value}',',')::bigint[])`
            else if (item.column === "usergroup")
                return `${acc} and co.usergroup = ANY(string_to_array('${item.value}',',')::character varying[])`
            else if (item.column === "tag")
                return `${acc} and co.tags ilike '%${item.value}%'`
        } , "");
    }
    
    if (columns && columns instanceof Array) {
        whereSel = columns.reduce((acc, item) => {
            const alias = item.value.replace(" ", "");
            if (item.key === "startdateticket" || item.key === "finishdateticket") {
                const cc = item.key.Split("ticket")[0];
                return `${acc}, to_char(j.${cc} - interval '$offset hour', 'YYYY-MM-DD HH24:MI:SS') as "${alias}"`
            } else if (["status", "closecomment", "firstusergroup", "closetype"].includes(item.key)) 
                return `${acc}, co.${item.key} as "${alias}"`
            else if (item.key === "alltags") 
                return `${acc}, co.tags as "${alias}"`
            else if (item.key === "ticketgroup") 
                return `${acc}, co.usergroup as "${alias}"`
            else if (item.key === "startonlydateticket") 
                return `${acc}, to_char(co.startdate + interval '$offset hour', 'DD/MM/YYYY') as "${alias}"`
            else if (item.key === "startonlyhourticket") 
                return `${acc}, to_char(co.startdate + interval '$offset hour', 'HH24:MI') as "${alias}"`
            else if (item.key === "asesorinitial") 
                return `${acc}, (select CONCAT(us.firstname, ' ', us.lastname) from usr us where us.userid = j.firstuserid) as "${alias}"`
            else if (item.key === "typifications") 
                return `${acc}, (select string_agg(c.path, ',') from conversationclassification cc 
                inner join classification c on c.classificationid = cc.classificationid 
                where cc.conversationid = co.conversationid)  as "${alias}"`
            else if (item.key !== "conversationid") {
                return `${acc}, (co.variablecontext::jsonb)->'${item.key}'->>'Value' as "${alias}"`
            }

        } , "");
    }

    query = query.replace(REPLACEFILTERS, whereQuery).replace(REPLACESEL, whereSel);
    console.log(query, parameters)
    const result = await executeQuery(query, parameters);

    if (!result.error)
        return res.json(result);
    else
        return res.status(result.rescode).json(result);
}

