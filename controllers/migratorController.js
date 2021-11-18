const sequelize = require('../config/database');
const zyxmeSequelize = require("../config/databasezyxme");
const { getErrorSeq } = require('../config/helpers');
const { QueryTypes } = require('sequelize');
const axios = require('axios');
const bcryptjs = require("bcryptjs");

const logdna = require('@logdna/logger');
const logger = logdna.createLogger('b7c813e09fbbaceff7e34d4488b90db6', { app: 'laraigoApi', level: 'trace', meta: { module: 'migratorController' } });

/* Índice de tablas

Propios del sistema
"application"
"appsetting"
"country"
"currency"
"role"
"roleapplication"
"securityrules"
"tablevariable" --Revisar renombramiento de variables
"timezone"

Core
"corp" (Revisar planteamiento de los dominios ESTADOGENERICO, TIPOCORP, si aun no existe la corp no hay dominios de esa corp)
|"org" (No existe tabla orggroupid, revisar planteamiento de los dominios ESTADOGENERICO, TIPOORG, si aun no existe la org no hay dominios de esa org)
||"domain"
||"inputvalidation"
||"appintegration"
||"botconfiguration"
|||"communicationchannel"
||||"communicationchannelstatus"
||||"property"
"usr" (Falta la reencriptacion de la contraseña, no existe table billingroupid, que hacer con las columans nuevas?)
|"usertoken"
|"userstatus"
||"userhistory"
||"usrnotification"
||"orguser"

SubCoreClassification
"classification"
|"quickreply"
SubCorePerson
"person"
|"personaddinfo"
|"personcommunicationchannel"
SubcoreConversation
|"post"
||"pccstatus"
||"conversation"
|||"conversationclassification"
|||"conversationnote"
|||"conversationpause"
|||"conversationpending"
|||"conversationstatus"
|||"interaction"
|||"surveyanswered" ("survey", "surveyquestion", "surveyanswer")
SubcoreCampaign
"messagetemplate"
|"campaign"
||"campaignmember"
||"campaignhistory"
SubcoreOthers
||"taskscheduler"
"blockversion"
|"block"
|"tablevariableconfiguration"
|"intelligentmodels"
||"intelligentmodelsconfiguration"

Extras
"blacklist"
"hsmhistory"
"inappropriatewords"
"label"
"location"
"payment"
"productivity"
"reporttemplate"
"sla"
"whitelist"

Nuevas
"appointmentbyhsm"
"column"
"communicationchannelhook"
"integrationmanager"
"lead"
"leadactivity"
"leadnotes"
"leadstatus"
"paymentplan"
"report"

Unknown
"emoji"

SUNAT
"groupconfiguration"
*/

const parseHrtimeToSeconds = (hrtime) => {
    var seconds = (hrtime[0] + (hrtime[1] / 1e9)).toFixed(3);
    return seconds;
}

const errorSeq = err => {
    const messageerror = err.toString().replace("SequelizeDatabaseError: ", "");
    const errorcode = messageerror.includes("Named bind parameter") ? "PARAMETER_IS_MISSING" : err.parent.code;
    console.log(`${new Date()}: ${errorcode}-${messageerror}`);
    return {
        code: errorcode,
        msg: messageerror
    };
};

const zyxmeQuery = async (query, bind = {}) => {
    return await zyxmeSequelize.query(query, {
        type: QueryTypes.SELECT,
        bind
    }).catch(err => errorSeq(err));
}

const laraigoQuery = async (query, bind = {}) => {
    return await sequelize.query(query, {
        type: QueryTypes.SELECT,
        bind
    }).catch(err => errorSeq(err));
}

const apiServiceEndpoint = process.env.APISERVICES;
const recryptPwd = async (table, data) => {
    switch (table) {
        case 'usr':
            if (apiServiceEndpoint) {
                try {
                    const response = await axios({
                        data: data.map(d => ({userid: d.zyxmeuserid, pwd: d.pwd})),
                        method: 'post',
                        url: `${apiServiceEndpoint}decryption`,
                    });
                    const salt = await bcryptjs.genSalt(10);
                    for (let i = 0; i < data.length; i++) {
                        data[i].pwd = await bcryptjs.hash(response.data.find(r => r.userid === data[i].zyxmeuserid).pwd, salt);
                    }
                } catch (error) {
                    logger.error(error, { meta: { function: 'recryptPwd' }} );
                    console.log(error);
                }
            }
            break;
        }
    return data;
}

const apiZyxmeHookEndpoint = process.env.ZYXMEHOOK;
const apiLaraigoHookEndpoint = process.env.HOOK;
const reconfigWebhook = async (table, data, move = false) => {
    switch (table) {
        case 'communicationchannel':
            if (apiZyxmeHookEndpoint) {
                const url = new URL(apiLaraigoHookEndpoint);
                const laraigoUrl = url.origin + url.pathname.split('hook')[0];
                for (let i = 0; i< data.length; i++) {
                    try {
                        data[i].servicecredentials = null;
                        let zyxmeData = {
                            communicationChannelSite: data[i].communicationchannelsite,
                            migrationEnvironment: laraigoUrl,
                            type: data[i].type,
                            moveWebhook: move
                        }
                        switch (data[i].type) {
                            case 'CHAZ':
                                zyxmeData = {
                                    ...zyxmeData,
                                    communicationchannelowner: data[i].communicationchannelowner,
                                }
                                break;
                            case 'TWIT': case 'TWMS':
                                zyxmeData = {
                                    ...zyxmeData,
                                    twitterLink: false,
                                }
                            default:
                                break;
                        }
                        const response = await axios({
                            data: zyxmeData,
                            method: 'post',
                            url: `${apiZyxmeHookEndpoint}support/migratechannel`
                        });
                        if (response.data && response.data.success) {
                            data[i].servicecredentials = response.data.serviceCredentials
                            switch (data[i].type) {
                                case 'CHAZ':
                                    data[i].communicationchannelowner = response.data.communicationChannelOwner
                                    break;
                            }
                        }
                        else {
                            logger.error({data: zyxmeData, response: response.data}, { meta: { function: 'reconfigWebhook' }} );
                        }
                    } catch (error) {
                        logger.error(error, { meta: { function: 'reconfigWebhook' }} );
                        console.log(error);
                    }
                }
            }
        break;
    }
    return data;
}

const reconfigWebhookPart2 = async (table, data, move) => {
    switch (table) {
        case 'communicationchannel':
            if (apiZyxmeHookEndpoint) {
                const url = new URL(apiLaraigoHookEndpoint);
                const laraigoUrl = url.origin + url.pathname.split('hook')[0];
                for (let i = 0; i< data.length; i++) {
                    try {
                        let zyxmeData = {
                            communicationChannelSite: data[i].communicationchannelsite,
                            migrationEnvironment: laraigoUrl,
                            type: data[i].type,
                            moveWebhook: move
                        }
                        switch (data[i].type) {
                            case 'TWIT': case 'TWMS':
                                zyxmeData = {
                                    ...zyxmeData,
                                    twitterLink: true,
                                }
                                const response = await axios({
                                    data: zyxmeData,
                                    method: 'post',
                                    url: `${apiZyxmeHookEndpoint}support/migratechannel`
                                });
                                if (response.data && response.data.success) {
                                    console.log(response.data)
                                }
                                else {
                                    logger.error({data: zyxmeData, response: response.data}, { meta: { function: 'reconfigWebhookPart2' }} );
                                }
                            default:
                                break;
                        }
                    } catch (error) {
                        logger.error(error, { meta: { function: 'reconfigWebhookPart2' }} );
                        console.log(error);
                    }
                }
            }
        break;
    }
}

const variableRenameList = [
    ['name', 'fullname'],
    ['cc.type', 'syschannel'],
    ['inter.postexternalid', 'postexternalid'],
    ['dirección', 'address'],
    ['referencia de dirección', 'addressreference'],
    ['correo alternativo', 'alternativeemail'],
    ['teléfono alternativo', 'alternativephone'],
    ['monto aprobado', 'approvedamount'],
    ['cumpleaños', 'birthday'],
    ['estado civil', 'civilstatus'],
    ['número de cliente', 'clientnumber'],
    ['país', 'country'],
    ['siguiente evaluación (días)', 'daysfornextevaluation'],
    ['distrito', 'district'],
    ['número de documento', 'documentnumber'],
    ['tipo de documento', 'documenttype'],
    ['nivel de educación', 'educationlevel'],
    ['correo', 'email'],
    ['estado evaluación', 'evaluationstatus'],
    ['monto cuota', 'feeamount'],
    ['nombre', 'firstname'],
    ['género', 'gender'],
    ['cantidad de cuotas', 'installments'],
    ['fecha última evaluación', 'lastdateevaluation'],
    ['fecha estado evaluación', 'lastdatestatus'],
    ['apellido', 'lastname'],
    ['latitud', 'latitude'],
    ['longitud', 'longitude'],
    ['nombre completo', 'fullname'],
    ['ocupación', 'occupation'],
    ['teléfono', 'phone'],
    ['provincia', 'province'],
    ['región', 'region'],
    ['sueldo', 'salary'],
    ['sexo', 'sex'],
    ['términos y condiciones', 'termsandconditions'],
    ['canal activo', 'channelactive'],
    ['communicationchannelid', 'communicationchannelid'],
    ['conversationid', 'conversationid'],
    ['corpid', 'corpid'],
    ['orgid', 'orgid'],
    ['personcommunicationchannel', 'personcommunicationchannel'],
    ['personcommunicationchannelowner', 'personcommunicationchannelowner'],
    ['personid', 'personid'],
    ['ai_intención', 'watsonintention'],
    ['ai_respuestapredeterminada', 'watsondefaultvalue'],
    ['appointmentid', 'appointmentid'],
    ['busquedaubicacion', 'searchlocation'],
    ['cita_especialidad', 'appointmentspeciality'],
    ['cita_fecha', 'appointmentdate'],
    ['cita_hora', 'appointmenthour'],
    ['cita_medico', 'appointmentdoctor'],
    ['classification', 'classification'],
    ['communicationchannelsite', 'communicationchannelsite'],
    ['consulta', 'questionform'],
    ['fromfbwa', 'fromfacebookwall'],
    ['Grupo atencion', 'attentiongroup'],
    ['ip', 'ip'],
    ['refererurl', 'referrerurl'],
    ['respuesta_usuario', 'useranswer'],
    ['scriptvariable', 'scriptvariable'],
    ['syscampaignname', 'syscampaignname'],
    ['syscampaignusergroup', 'syscampaignusergroup'],
    ['sysdatetime', 'sysdatetime'],
    ['sysnlcclass', 'sysanalyticstype'],
    ['sysnlcsubclass', 'sysanalyticssubtype'],
    ['sysoriginhsm', 'sysoriginhsm'],
    ['syspaymentnotification', 'syspaymentnotification'],
    ['sysshowendconversation', 'sysshowendblock'],
    ['sysshowsurvey', 'sysshowsurvey'],
    ['ticketnum', 'ticketnum'],
    ['waentity_name', 'wa_entityname'],
    ['waentity_value', 'wa_entityvalue'],
    ['waintent1', 'wa_intent1'],
    ['waintent2', 'wa_intent2'],
    ['watext', 'wa_text'],
    ['wnlcclass1', 'wnlc_class1'],
    ['wnlcclass2', 'wnlc_class2'],
    ['wnluanger', 'wnlu_anger'],
    ['wnlucategories', 'wnlu_categories'],
    ['wnluconcepts', 'wnlu_concepts'],
    ['wnludisgust', 'wnlu_disgust'],
    ['wnluentities', 'wnlu_entities'],
    ['wnlufear', 'wnlu_fear'],
    ['wnlujoy', 'wnlu_joy'],
    ['wnlukeywords', 'wnlu_keywords'],
    ['wnlusadness', 'wnlu_sadness'],
    ['wnlusemanticrolesaction', 'wnlu_semanticrolesaction'],
    ['wnlusemanticrolesobject', 'wnlu_semanticrolesobjetct'],
    ['wnlusemanticrolessubject', 'wnlu_semanticrolessubject'],
    ['wnlusentiment_label', 'wnlu_sentiment_label'],
    ['wnlusentiment_score', 'wnlu_sentiment_score'],
    ['wtatone1', 'wta_tone1'],
    ['wtatone1tmp', 'wta_tone1_description'],
    ['wtatone2', 'wta_tone2'],
    ['wtatone2tmp', 'wta_tone2_description'],
    ['canal', 'syschannel'],
    ['postexternalid', 'postexternalid'],
    ['wnlu_sentiment_label', 'wnlu_sentimentlabel'],
    ['wnlu_sentiment_score', 'wnlu_sentimentscore']
]

const isJson = (s) => {
    try {
        JSON.parse(s);
    } catch (e) {
        return false;
    }
    return true;
}

const renameVariable = (table, data) => {
    switch (table) {
        case 'conversation':
            data = data.map(d => {
                if (d.variablecontext !== null && isJson(d.variablecontext)) {
                    for (const [oldname, newname] of variableRenameList) {
                        d.variablecontext = d.variablecontext.replace(new RegExp(`"id":"${oldname}_custom"`, "g"),`"id":"${newname}_custom"`);
                        d.variablecontext = d.variablecontext.replace(new RegExp(`"Name":"${oldname}"`, "g"),`"Name":"${newname}"`);
                    }
                }
                else {
                    d.variablecontext = null;
                }
                return d;
            });
            break;
        case 'tablevariable':
            data = data.map(d => {    
                for (const [oldname, newname] of variableRenameList) {
                    d.description = d.description.replace(`${oldname}`,`${newname}`);
                }
                return d;
            });
            break;
        case 'tablevariableconfiguration':
            data = data.map(d => {    
                for (const [oldname, newname] of variableRenameList) {
                    d.variable = d.variable.replace(`${oldname}`,`${newname}`);
                }
                return d;
            });
            break;
        case 'block': case 'blockversion':
            data = data.map(d => {       
                for (const [oldname, newname] of variableRenameList) {
                    d.blockgroup = d.blockgroup.replace(new RegExp(`"title":"${oldname}","caption"`, "g"),`"title":"${newname}","caption"`);
                    d.blockgroup = d.blockgroup.replace(new RegExp(`"variablename":"${oldname}"`, "g"),`"variablename":"${newname}"`);
                    d.blockgroup = d.blockgroup.replace(new RegExp(`"variablecontext":"${oldname}"`, "g"),`"variablecontext":"${newname}"`);
                    d.blockgroup = d.blockgroup.replace(new RegExp(`"conditionvariable":"${oldname}"`, "g"),`"conditionvariable":"${newname}"`);
                    d.blockgroup = d.blockgroup.replace(new RegExp(`"latitude":"${oldname}"`, "g"),`"latitude":"${newname}"`);
                    d.blockgroup = d.blockgroup.replace(new RegExp(`"longitude":"${oldname}"`, "g"),`"longitude":"${newname}"`);
                    d.blockgroup = d.blockgroup.replace(new RegExp(`{{${oldname}}}`, "g"),`{{${newname}}}`);
                    d.variablecustom = d.variablecustom.replace(new RegExp(`"id":"${oldname}_custom"`, "g"),`"id":"${newname}_custom"`);
                    d.variablecustom = d.variablecustom.replace(new RegExp(`"name":"${oldname}"`, "g"),`"name":"${newname}"`);
                }
                return d;
            });
            break;
    }
    return data;
}

const restructureVariable = (table, data) => {
    switch (table) {
        case 'conversation':
            data.map(d => {    
                if (d.variablecontext) {
                    let variablecontext = JSON.parse(d.variablecontext);
                    if (Array.isArray(variablecontext)) {
                        d.variablecontext = JSON.stringify(variablecontext.reduce((avc, vc) => ({
                            ...avc,
                            [vc.Name]: vc
                        }), {}));
                    }
                }
                return d
            });
        break;
    }
    return data;
}

const migrationExecute = async (corpidBind, queries, movewebhook = false) => {
    let executeResult = {};
    for (const [k,q] of Object.entries(queries)) {
        executeResult[k] = {success: true, errors: []};
        try {
            let conversations = await laraigoQuery(
                `SELECT conversationid, zyxmeconversationid
                FROM conversation
                WHERE zyxmecorpid = $corpid`, corpidBind);
            let persons = await laraigoQuery(
                `SELECT personid, zyxmepersonid
                FROM person
                WHERE zyxmecorpid = $corpid`, corpidBind);
            let limit = 10000;
            let counter = 0;
            const perChunk = 1000
            while (true) {
                let selectStartTime = process.hrtime();
                let selectResult = await zyxmeQuery(q.select.replace('\n',' '), {...corpidBind, offset: counter * limit, limit});
                let selectElapsedSeconds = parseHrtimeToSeconds(process.hrtime(selectStartTime));
                if (selectResult instanceof Array) {
                    logger.trace(selectResult[0], { meta: { function: 'selectResult', table: k, seconds: selectElapsedSeconds }} );
                    if (selectResult.length === 0) {
                        break;
                    }
                    selectResult = await recryptPwd(k, selectResult);
                    selectResult = await reconfigWebhook(k, selectResult, movewebhook);
                    selectResult = renameVariable(k, selectResult);
                    selectResult = restructureVariable(k, selectResult);
                    selectResult = selectResult.map(s => ({
                        ...s,
                        zyxmeconversationid: conversations.find(co => co.zyxmeconversationid === s.zyxmeconversationid)?.conversationid || s.zyxmeconversationid,
                        zyxmepersonid: persons.find(pe => pe.zyxmepersonid === s.zyxmepersonid)?.personid || s.zyxmepersonid
                    }))
                    let chunkArray = selectResult.reduce((chunk, item, index) => { 
                      const chunkIndex = Math.floor(index/perChunk)
                      if(!chunk[chunkIndex]) {
                        chunk[chunkIndex] = []
                      }
                      chunk[chunkIndex].push(item)
                      return chunk
                    }, []);
    
                    for (const chunk of chunkArray) {
                        if (q.preprocess) {
                            let startTime = process.hrtime();
                            try {
                                let preprocessResult = await laraigoQuery(q.preprocess.replace('\n',' '), { datatable: JSON.stringify(chunk) });
                                let elapsedSeconds = parseHrtimeToSeconds(process.hrtime(startTime));
                                if (preprocessResult instanceof Array) {
                                    logger.trace(preprocessResult, { meta: { function: 'preprocessResult', table: k, seconds: elapsedSeconds }} );
                                }
                                else {
                                    logger.error(preprocessResult, { meta: { function: 'preprocessResult', table: k, seconds: elapsedSeconds }} );
                                    console.log(preprocessResult);
                                    executeResult[k].success = false;
                                    executeResult[k].errors.push({script: preprocessResult});
                                }
                            } catch (error) {
                                let elapsedSeconds = parseHrtimeToSeconds(process.hrtime(startTime));
                                logger.error(error, { meta: { function: 'preprocessResult', table: k, seconds: elapsedSeconds }} );
                                console.log(error);
                                executeResult[k].errors.push({script: error});
                            }
                        }
                        if (q.insert) {
                            let startTime = process.hrtime();
                            try {
                                let insertResult = await laraigoQuery(q.insert.replace('\n',' '), { datatable: JSON.stringify(chunk) });
                                let elapsedSeconds = parseHrtimeToSeconds(process.hrtime(startTime));
                                if (insertResult instanceof Array) {
                                    logger.trace(insertResult, { meta: { function: 'insertResult', table: k, seconds: elapsedSeconds }} );
                                }
                                else {
                                    logger.error(insertResult, { meta: { function: 'insertResult', table: k, seconds: elapsedSeconds }} );
                                    console.log(insertResult);
                                    executeResult[k].success = false;
                                    executeResult[k].errors.push({script: insertResult});
                                }
                            } catch (error) {
                                let elapsedSeconds = parseHrtimeToSeconds(process.hrtime(startTime));
                                logger.error(error, { meta: { function: 'insertResult', table: k, seconds: elapsedSeconds }} );
                                console.log(error);
                                executeResult[k].errors.push({script: error});
                            }
                        }
                        if (q.postprocess) {
                            let startTime = process.hrtime();
                            try {
                                let postprocessResult = await laraigoQuery(q.postprocess.replace('\n',' '), { datatable: JSON.stringify(chunk) });
                                let elapsedSeconds = parseHrtimeToSeconds(process.hrtime(startTime));
                                if (postprocessResult instanceof Array) {
                                    logger.trace(postprocessResult, { meta: { function: 'postprocessResult', table: k, seconds: elapsedSeconds }} );
                                }
                                else {
                                    logger.error(postprocessResult, { meta: { function: 'postprocessResult', table: k, seconds: elapsedSeconds }} );
                                    console.log(postprocessResult);
                                    executeResult[k].success = false;
                                    executeResult[k].errors.push({script: postprocessResult});
                                }
                            } catch (error) {
                                let elapsedSeconds = parseHrtimeToSeconds(process.hrtime(startTime));
                                logger.error(error, { meta: { function: 'postprocessResult', table: k, seconds: elapsedSeconds }} );
                                console.log(error);
                                executeResult[k].errors.push({script: error});
                            }
                        }
                    }
                    await reconfigWebhookPart2(k, selectResult, movewebhook);
                    counter += 1;
                }
                else {
                    logger.error(selectResult, { meta: { function: 'selectResult', table: k, seconds: selectElapsedSeconds }} );
                    console.log(selectResult);
                    executeResult[k].success = false;
                    executeResult[k].errors.push({script: selectResult});
                    break;
                }
            }

            if (q.update) {
                let startTime = process.hrtime();
                try {
                    let updateResult = await laraigoQuery(q.update.replace('\n',' '), corpidBind);
                    let elapsedSeconds = parseHrtimeToSeconds(process.hrtime(startTime));
                    if (updateResult instanceof Array) {
                        logger.trace(updateResult, { meta: { function: 'updateResult', table: k, seconds: elapsedSeconds }} );
                    }
                    else {
                        logger.error(updateResult, { meta: { function: 'updateResult', table: k, seconds: elapsedSeconds }} );
                        console.log(updateResult);
                        executeResult[k].success = false;
                        executeResult[k].errors.push({script: updateResult});
                    }
                } catch (error) {
                    let elapsedSeconds = parseHrtimeToSeconds(process.hrtime(startTime));
                    logger.error(error, { meta: { function: 'updateResult', table: k, seconds: elapsedSeconds }} );
                    console.log(error);
                    executeResult[k].errors.push({script: error});
                }
            }
        } catch (error) {
            logger.error(error, { meta: { function: 'migrationExecute', table: k }} );
            console.log(error);
            executeResult[k].success = false;
            executeResult[k].errors.push({script: error});
        }
    };
    return executeResult;
}

const queryCore = {
    corp: {
        select: `SELECT corpid as zyxmecorpid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        logo, logotipo as logotype
        FROM corp
        WHERE corpid = $corpid
        ORDER BY corpid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO corp (
            zyxmecorpid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            logo, logotype, paymentplanid
        )
        SELECT
            dt.zyxmecorpid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.logo, dt.logotype, 2
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			logo text, logotype text,
			companysize character varying, paymentplanid bigint
        )`
    },
    org: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        description, status, type, createdate, createby, changedate, changeby, edit
        FROM org
        WHERE corpid = $corpid
        ORDER BY orgid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO org (
            zyxmecorpid,
            corpid,
            zyxmeorgid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            timezoneoffset, timezone, currency, country, ready
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            dt.zyxmeorgid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            -5, 'America/Lima', 'PEN', 'PE', false
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			timezoneoffset double precision, timezone character varying,
			currency character varying, country character varying
        )`
    },
    domain: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, domainid as zyxmedomainid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        domainname, domainvalue, domaindesc, bydefault, "system", priorityorder
        FROM domain
        WHERE corpid = $corpid
        ORDER BY domainid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO domain (
            zyxmecorpid,
            corpid,
            orgid,
            zyxmedomainid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            domainname, domainvalue, domaindesc, bydefault, "system", priorityorder
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            CASE WHEN COALESCE(dt.zyxmeorgid, 0) = 0 THEN 0
            ELSE (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1)
            END,
            dt.zyxmedomainid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.domainname, dt.domainvalue, dt.domaindesc, dt.bydefault, dt.system, dt.priorityorder
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmedomainid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			domainname character varying, domainvalue character varying, domaindesc character varying,
			bydefault boolean, system boolean, priorityorder bigint
        )`
    },
    inputvalidation: {
        select: `SELECT corpid as zyxmecorpid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        inputvalue
        FROM inputvalidation
        WHERE corpid = $corpid
        ORDER BY inputvalidationid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO inputvalidation (
            zyxmecorpid,
            corpid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            inputvalue
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.inputvalue
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			inputvalue character varying
        )`
    },
    /* appintegrationid is required for communicationchannel but no values seen */
    appintegration: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, appintegrationid as zyxmeappintegrationid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        appid, externalsource, environment, keyparameters, integrationid
        FROM appintegration
        WHERE corpid = $corpid
        ORDER BY appintegrationid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO appintegration (
            zyxmecorpid,
            corpid,
            orgid,
            zyxmeappintegrationid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            appid, externalsource, environment, keyparameters, integrationid
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            dt.zyxmeappintegrationid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.appid, dt.externalsource, dt.environment, dt.keyparameters, dt.integrationid
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmeappintegrationid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			appid character varying, externalsource character varying, environment character varying,
			keyparameters text, integrationid character varying
        )`
    },
    /* botconfiguration is required for communicationchannel */
    botconfiguration: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, botconfigurationid as zyxmebotconfigurationid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        bottype, parameterjson
        FROM botconfiguration
        WHERE corpid = $corpid
        ORDER BY botconfigurationid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO botconfiguration (
            zyxmecorpid,
            corpid,
            orgid,
            zyxmebotconfigurationid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            bottype, parameterjson
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            dt.zyxmebotconfigurationid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.bottype, dt.parameterjson
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
			zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmebotconfigurationid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			bottype character varying, parameterjson text
        )`
    },
    communicationchannel: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, communicationchannelid as zyxmecommunicationchannelid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        communicationchannelsite, communicationchannelowner, communicationchannelcontact, communicationchanneltoken,
        botenabled, customicon, coloricon, botconfigurationid as zyxmebotconfigurationid, relatedid, schedule, chatflowenabled,
        integrationid, appintegrationid as zyxmeappintegrationid, country, channelparameters, channelactive, resolvelithium,
        color, icons, other, form, apikey
        FROM communicationchannel
        WHERE corpid = $corpid
        ORDER BY communicationchannelid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO communicationchannel (
            zyxmecorpid,
            corpid,
            orgid,
            zyxmecommunicationchannelid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            communicationchannelsite, communicationchannelowner, communicationchannelcontact, communicationchanneltoken,
            botenabled, customicon, coloricon,
            botconfigurationid,
            relatedid, schedule, chatflowenabled,
            integrationid,
            appintegrationid,
            country, channelparameters, channelactive, resolvelithium,
            color, icons, other, form, apikey,
            servicecredentials
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            dt.zyxmecommunicationchannelid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            COALESCE(dt.communicationchannelsite, ''), COALESCE(dt.communicationchannelowner, ''), COALESCE(dt.communicationchannelcontact, ''), dt.communicationchanneltoken,
            dt.botenabled, dt.customicon, dt.coloricon,
            (SELECT botconfigurationid FROM botconfiguration WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmebotconfigurationid = dt.zyxmebotconfigurationid LIMIT 1),
            dt.relatedid, dt.schedule, dt.chatflowenabled,
            dt.integrationid,
            CASE WHEN COALESCE(dt.zyxmeappintegrationid, 0) = 0 THEN 0
            ELSE (SELECT appintegrationid FROM appintegration WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeappintegrationid = dt.zyxmeappintegrationid LIMIT 1)
            END,
            dt.country, dt.channelparameters, dt.channelactive, dt.resolvelithium,
            dt.color, dt.icons, dt.other, dt.form, dt.apikey,
            dt.servicecredentials
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmecommunicationchannelid bigint,
            description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			communicationchannelsite character varying, communicationchannelowner character varying,
			communicationchannelcontact character varying, communicationchanneltoken character varying,
			botenabled boolean, customicon boolean, coloricon character varying,
			zyxmebotconfigurationid bigint, relatedid bigint, schedule character varying,
			chatflowenabled boolean, integrationid character varying, zyxmeappintegrationid bigint,
			country character varying, channelparameters text, channelactive boolean, resolvelithium boolean,
			color text, icons text, other text, form text, apikey text,
			servicecredentials character varying
        )`
    },
    communicationchannelstatus: {
        select: `SELECT ccs.corpid as zyxmecorpid, ccs.orgid as zyxmeorgid, ccs.communicationchannelid as zyxmecommunicationchannelid,
        ccs.description, ccs.status, ccs.type, ccs.createdate, ccs.createby, ccs.changedate, ccs.changeby, ccs.edit
        FROM communicationchannelstatus ccs
        WHERE ccs.corpid = $corpid
        ORDER BY ccs.communicationchannelstatusid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO communicationchannelstatus (
            zyxmecorpid,
            corpid,
            orgid,
            communicationchannelid,
            description, status, type, createdate, createby, changedate, changeby, edit
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            COALESCE((SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmecommunicationchannelid = dt.zyxmecommunicationchannelid LIMIT 1), 0),
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmecommunicationchannelid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean
        )`
    },
    property: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, communicationchannelid as zyxmecommunicationchannelid,
        propertyid as zyxmepropertyid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        propertyname, propertyvalue
        FROM property
        WHERE corpid = $corpid
        ORDER BY propertyid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO property (
            zyxmecorpid,
            corpid,
            orgid,
            communicationchannelid,
            zyxmepropertyid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            propertyname, propertyvalue,
            inputtype,
            domainname,
            category,
            "group",
            level
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            CASE WHEN COALESCE(dt.zyxmeorgid, 0) = 0 THEN 0
            ELSE (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1)
            END,
            CASE WHEN COALESCE(dt.zyxmecommunicationchannelid, 0) = 0 THEN 0
            ELSE (SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmecommunicationchannelid = dt.zyxmecommunicationchannelid LIMIT 1)
            END,
            dt.zyxmepropertyid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.propertyname::CHARACTER VARYING, dt.propertyvalue,
            (SELECT inputtype FROM property WHERE propertyname = dt.propertyname LIMIT 1),
            (SELECT domainname FROM property WHERE propertyname = dt.propertyname LIMIT 1),
            (SELECT category FROM property WHERE propertyname = dt.propertyname LIMIT 1),
            (SELECT "group" FROM property WHERE propertyname = dt.propertyname LIMIT 1),
            (SELECT level FROM property WHERE propertyname = dt.propertyname LIMIT 1)
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmecommunicationchannelid bigint,
			zyxmepropertyid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			propertyname character varying, propertyvalue character varying,
			inputtype character varying, domainname character varying,
			category character varying, "group" character varying, level character varying
        )`
    },
    usr: {
        select: `SELECT ous.corpid as zyxmecorpid, usr.userid as zyxmeuserid,
        usr.description, usr.status, usr.type, usr.createdate, usr.createby, usr.changedate, usr.changeby, usr.edit,
        usr.usr as username, usr.doctype, usr.docnum, usr.pwd, usr.firstname, usr.lastname, usr.email,
        usr.pwdchangefirstlogin, usr.facebookid, usr.googleid, usr.company,
        usr.twofactorauthentication, usr.usersupport, usr.billinggroup, usr.registro as registercode, usr.usercall,
        usr.passwordchangedate, usr.lastlogin, usr.lastlogout, usr.lasttokenorigin, usr.lasttokenstatus,
        usr.lasthistorystatus, usr.lasthistorytype, usr.lastmotivetype, usr.lastmotivedescription,
        usr.attemptslogin, usr.lastuserstatus,
        usr.area, usr.location, usr.management, usr.phone
        FROM usr
        JOIN orguser ous ON ous.corpid = $corpid AND ous.userid = usr.userid
        WHERE usr.type <> 'SYSTEM'
        ORDER BY usr.userid
        LIMIT $limit
        OFFSET $offset`,
        preprocess: `UPDATE usr
        SET zyxmecorpid = dt.zyxmecorpid,
        zyxmeuserid = dt.zyxmeuserid
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeuserid bigint,
            pwd character varying,
            username character varying
        )
        WHERE usr = dt.username::CHARACTER VARYING`,
        insert: `INSERT INTO usr (
            zyxmecorpid,
            zyxmeuserid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            usr, doctype, docnum, pwd, firstname, lastname, email,
            pwdchangefirstlogin, facebookid, googleid, company,
            twofactorauthentication, usersupport,
            billinggroup,
            registercode, usercall,
            passwordchangedate, lastlogin, lastlogout, lasttokenorigin, lasttokenstatus,
            lasthistorystatus, lasthistorytype, lastmotivetype, lastmotivedescription,
            attemptslogin, lastuserstatus,
            area, location, management, phone
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeuserid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.username::CHARACTER VARYING, dt.doctype, dt.docnum, dt.pwd, dt.firstname, dt.lastname, dt.email,
            dt.pwdchangefirstlogin, dt.facebookid, dt.googleid, dt.company,
            dt.twofactorauthentication, dt.usersupport,
            (SELECT propertyid FROM property WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmepropertyid = dt.billinggroup LIMIT 1),
            dt.registercode, dt.usercall,
            dt.passwordchangedate, dt.lastlogin, dt.lastlogout, dt.lasttokenorigin, dt.lasttokenstatus,
            dt.lasthistorystatus, dt.lasthistorytype, dt.lastmotivetype, dt.lastmotivedescription,
            dt.attemptslogin, dt.lastuserstatus,
            dt.area, dt.location, dt.management, dt.phone
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
			zyxmeuserid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			username character varying, doctype character varying, docnum character varying, pwd character varying,
			firstname character varying, lastname character varying, email character varying,
			pwdchangefirstlogin boolean, facebookid text, googleid text, company character varying,
			twofactorauthentication boolean, usersupport boolean,
			billinggroup bigint,
			registercode character varying, usercall boolean,
			passwordchangedate timestamp without time zone,
			lastlogin timestamp without time zone, lastlogout timestamp without time zone,
			lasttokenorigin character varying, lasttokenstatus character varying,
			lasthistorystatus character varying, lasthistorytype character varying,
			lastmotivetype character varying, lastmotivedescription character varying,
			attemptslogin bigint, lastuserstatus character varying,
			area character varying, location character varying, management character varying, phone character varying,
			sales boolean, customerservice boolean, marketing boolean, rolecompany character varying,
			redirect character varying, image character varying, join_reason text, country character varying
        )`,
        update: `UPDATE usr
        SET zyxmeuserid = CASE
        WHEN usr = 'system.bot' THEN 42
        WHEN usr = 'system.holding' THEN 51
        END
        WHERE usr IN ('system.bot','system.holding')`,
    },
    usertoken: {
        select: `SELECT ous.corpid as zyxmecorpid, ut.userid as zyxmeuserid,
        ut.description, ut.status, ut.type, ut.createdate, ut.createby, ut.changedate, ut.changeby, ut.edit,
        ut.token, ut.expirationproperty, ut.origin
        FROM usertoken ut
        JOIN orguser ous ON ous.corpid = $corpid AND ous.userid = ut.userid
        ORDER BY ut.usertokenid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO usertoken (
            zyxmecorpid,
            userid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            token, expirationproperty, origin
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT userid FROM usr WHERE zyxmeuserid = dt.zyxmeuserid LIMIT 1),
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.token, dt.expirationproperty, dt.origin
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
			zyxmeuserid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			token text, expirationproperty character varying, origin character varying
        )`
    },
    userstatus: {
        select: `SELECT ous.corpid as zyxmecorpid, us.userid as zyxmeuserid,
        us.description, us.status, us.type, us.createdate, us.createby, us.changedate, us.changeby, us.edit
        FROM userstatus us
        JOIN orguser ous ON ous.corpid = $corpid AND ous.userid = us.userid
        ORDER BY us.userstatusid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO userstatus (
            zyxmecorpid,
            userid,
            description, status, type, createdate, createby, changedate, changeby, edit
        )
        SELECT
            dt.zyxmecorpid,
            COALESCE((SELECT userid FROM usr WHERE zyxmeuserid = dt.zyxmeuserid LIMIT 1), 0),
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
			zyxmeuserid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean
        )`
    },
    userhistory: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, userid as zyxmeuserid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        motivetype, motivedescription, desconectedtime::text
        FROM userhistory
        WHERE corpid = $corpid
        ORDER BY userhistoryid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO userhistory (
            zyxmecorpid,
            corpid,
            orgid,
            userid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            motivetype, motivedescription, desconectedtime
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            COALESCE((SELECT userid FROM usr WHERE zyxmeuserid = dt.zyxmeuserid LIMIT 1), 0),
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.motivetype, dt.motivedescription, dt.desconectedtime
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmeuserid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			motivetype character varying, motivedescription character varying, desconectedtime interval
        )`
    },
    usrnotification: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, usridfrom as zyxmeusridfrom, usrid as zyxmeusrid,
        description, status, type, createdate, createby, changedate, changeby, edit
        FROM usrnotification
        WHERE corpid = $corpid
        ORDER BY usrnotificationid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO usrnotification (
            zyxmecorpid,
            corpid,
            orgid,
            usridfrom,
            usrid,
            description, status, type, createdate, createby, changedate, changeby, edit
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            COALESCE((SELECT userid FROM usr WHERE zyxmeuserid = dt.zyxmeusridfrom LIMIT 1), 0),
            COALESCE((SELECT userid FROM usr WHERE zyxmeuserid = dt.zyxmeusrid LIMIT 1), 0),
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmeusridfrom bigint, zyxmeusrid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean
        )`
    },
    orguser: {
        select: `SELECT ous.corpid as zyxmecorpid, ous.orgid as zyxmeorgid, ous.userid as zyxmeuserid,
        ous.roleid, ous.supervisor,
        ous.description, ous.status, ous.type, ous.createdate, ous.createby, ous.changedate, ous.changeby, ous.edit,
        ous.bydefault, ous.labels, ous.groups, ous.channels, ous.defaultsort, ous.redirect,
        r.code as rolecode
        FROM orguser ous
        JOIN role r ON r.roleid = ous.roleid AND r.corpid = 1 AND r.orgid = 1
        WHERE ous.corpid = $corpid
        ORDER BY ous.corpid, ous.orgid, ous.userid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO orguser (
            zyxmecorpid,
            corpid,
            orgid,
            userid,
            roleid,
            supervisor,
            description, status, type, createdate, createby, changedate, changeby, edit,
            bydefault, labels, groups,
            channels,
            defaultsort, redirect
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            (SELECT userid FROM usr WHERE zyxmeuserid = dt.zyxmeuserid LIMIT 1),
            (SELECT roleid FROM role WHERE corpid = 1 AND orgid = 1 AND code = dt.rolecode LIMIT 1),
            (SELECT userid FROM usr WHERE zyxmeuserid = dt.supervisor LIMIT 1),
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.bydefault, dt.labels, dt.groups,
            (
                SELECT string_agg(communicationchannelid::text,',')
                FROM communicationchannel
                WHERE zyxmecorpid = dt.zyxmecorpid AND 
                zyxmecommunicationchannelid IN (SELECT UNNEST(string_to_array(dt.channels,',')::BIGINT[]))
            ),
            dt.defaultsort, dt.redirect
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmeuserid bigint, rolecode text, supervisor bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			bydefault boolean, labels character varying, groups character varying,
			channels character varying, defaultsort bigint, redirect character varying
        )`,
        update: `UPDATE orguser ous
        SET redirect = CASE
        WHEN r.code = 'ASESOR' THEN '/message_inbox'
        WHEN r.code = 'SUPERVISOR' THEN '/supervisor'
        ELSE '/usersettings' END
		FROM role r
		WHERE r.corpid = 1 AND r.orgid = 1 AND r.roleid = ous.roleid
        AND ous.zyxmecorpid = $corpid`,
    }
}

const querySubcoreClassification = {
    classification: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, classificationid as zyxmeclassificationid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        parent, communicationchannel, path, jobplan, usergroup, schedule
        FROM classification
        WHERE corpid = $corpid
        ORDER BY classificationid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO classification (
            zyxmecorpid,
            corpid,
            orgid,
            zyxmeclassificationid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            title, parent, communicationchannel, path, jobplan,
            usergroup,
            schedule
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            dt.zyxmeclassificationid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.description,
            dt.parent,
            dt.communicationchannel, dt.path, dt.jobplan,
            (SELECT propertyid FROM property WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmepropertyid = dt.usergroup LIMIT 1),
            dt.schedule
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmeclassificationid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			classificationid bigint,
			parent bigint,
			communicationchannel character varying, path character varying, jobplan text,
			usergroup bigint, schedule text, tags character varying
        )`,
		update: `UPDATE classification
		SET parent = (
			SELECT classificationid
			FROM classification
			WHERE zyxmeclassificationid = parent
			AND zyxmecorpid = $corpid
			LIMIT 1
		)
		WHERE COALESCE(parent, 0) <> 0
		AND zyxmecorpid = $corpid`
    },
    quickreply: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, classificationid as zyxmeclassificationid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        quickreply
        FROM quickreply
        WHERE corpid = $corpid
        ORDER BY quickreplyid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO quickreply (
            zyxmecorpid,
            corpid,
            orgid,
            classificationid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            quickreply
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            (SELECT classificationid FROM classification WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeclassificationid = dt.zyxmeclassificationid LIMIT 1),
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.quickreply
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmeclassificationid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			quickreply text
        )`
    },
}

const querySubcorePerson = {
    person: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, personid as zyxmepersonid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        groups, name, referringperson, referringpersonid, persontype, personstatus,
        phone, email, alternativephone, alternativeemail,
        firstcontact, lastcontact, lastcommunicationchannelid, documenttype, documentnumber,
        firstname, lastname, imageurldef, sex, gender, birthday, civilstatus, occupation, educationlevel,
        termsandconditions, installments, feeamount, approvedamount, evaluationstatus,
        lastdateevaluation, lastdatestatus, daysfornextevaluation,
        address, addressreference, clientnumber, mailflag, ecommerceaccounts, salary,
        country, region, district, latitude, longitude, province, contact, usercall, geographicalarea, age
        FROM person
        WHERE corpid = $corpid
        ORDER BY personid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO person (
            zyxmecorpid,
            corpid,
            orgid,
            zyxmepersonid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            groups, name, referringperson, referringpersonid, persontype, personstatus,
            phone, email, alternativephone, alternativeemail,
            firstcontact, lastcontact,
            lastcommunicationchannelid,
            documenttype, documentnumber,
            firstname, lastname, imageurldef, sex, gender, birthday, civilstatus, occupation, educationlevel,
            termsandconditions, installments, feeamount, approvedamount, evaluationstatus,
            lastdateevaluation, lastdatestatus, daysfornextevaluation,
            address, addressreference, clientnumber, mailflag, ecommerceaccounts, salary,
            country, region, district, latitude, longitude, province, contact, usercall, geographicalarea, age
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            dt.zyxmepersonid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.groups, dt.name, dt.referringperson,
            dt.referringpersonid,
            dt.persontype, dt.personstatus,
            dt.phone, dt.email, dt.alternativephone, dt.alternativeemail,
            dt.firstcontact, dt.lastcontact,
            (SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmecommunicationchannelid = dt.lastcommunicationchannelid LIMIT 1),
            dt.documenttype, dt.documentnumber,
            dt.firstname, dt.lastname, dt.imageurldef, dt.sex, dt.gender, dt.birthday, dt.civilstatus, dt.occupation, dt.educationlevel,
            dt.termsandconditions, dt.installments, dt.feeamount, dt.approvedamount, dt.evaluationstatus,
            dt.lastdateevaluation, dt.lastdatestatus, dt.daysfornextevaluation,
            dt.address, dt.addressreference, dt.clientnumber, dt.mailflag, dt.ecommerceaccounts, dt.salary,
            dt.country, dt.region, dt.district, dt.latitude, dt.longitude, dt.province, dt.contact, dt.usercall, dt.geographicalarea, dt.age
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmepersonid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			groups character varying, name character varying, referringperson boolean,
			referringpersonid bigint,
			persontype character varying, personstatus character varying,
			phone character varying, email character varying, alternativephone character varying, alternativeemail character varying,
			firstcontact timestamp without time zone, lastcontact timestamp without time zone,
			lastcommunicationchannelid bigint,
			documenttype character varying, documentnumber character varying,
			firstname character varying, lastname character varying, imageurldef character varying,
			sex character varying, gender character varying, birthday date, civilstatus character varying,
			occupation character varying, educationlevel character varying,
			termsandconditions character varying, installments integer, feeamount double precision,
			approvedamount double precision, evaluationstatus character varying,
			lastdateevaluation timestamp without time zone, lastdatestatus timestamp without time zone, daysfornextevaluation integer,
			address character varying, addressreference character varying, clientnumber character varying,
			mailflag boolean, ecommerceaccounts text, salary double precision,
			country character varying, region character varying, district character varying,
			latitude character varying, longitude character varying, province character varying, contact character varying,
			usercall boolean, geographicalarea character varying, age character varying
        )`
    },
    personaddinfo: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, personid as zyxmepersonid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        addinfo
        FROM personaddinfo
        WHERE corpid = $corpid
        ORDER BY personaddinfoid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO personaddinfo (
            zyxmecorpid,
            corpid,
            orgid,
            personid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            addinfo
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            dt.zyxmepersonid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.addinfo
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmepersonid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			addinfo text
        )`
    },
    personcommunicationchannel: {
        select: `SELECT pcc.corpid as zyxmecorpid, pcc.orgid as zyxmeorgid, pcc.personid as zyxmepersonid,
        pcc.personcommunicationchannel,
        pcc.description, pcc.status, pcc.type, pcc.createdate, pcc.createby, pcc.changedate, pcc.changeby, pcc.edit,
        pcc.imageurl, pcc.personcommunicationchannelowner, pcc.displayname, pcc.pendingsurvey, pcc.surveycontext, pcc.locked, pcc.lastusergroup
        FROM personcommunicationchannel pcc
        JOIN person pe ON pe.corpid = pcc.corpid AND pe.orgid = pcc.orgid AND pe.personid = pcc.personid
        WHERE pcc.corpid = $corpid
        AND pe.corpid = $corpid
        ORDER BY pcc.personid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO personcommunicationchannel (
            zyxmecorpid,
            corpid,
            orgid,
            personid,
            personcommunicationchannel,
            description, status, type, createdate, createby, changedate, changeby, edit,
            imageurl, personcommunicationchannelowner, displayname, pendingsurvey, surveycontext, "locked", lastusergroup
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            COALESCE(
                dt.zyxmepersonid,
                (SELECT personid FROM person WHERE zyxmecorpid = dt.zyxmecorpid AND orgid = (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1) LIMIT 1)
            ),
            dt.personcommunicationchannel,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.imageurl, dt.personcommunicationchannelowner, dt.displayname, dt.pendingsurvey, dt.surveycontext, dt.locked, dt.lastusergroup
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmepersonid bigint,
			personcommunicationchannel character varying,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			imageurl character varying, personcommunicationchannelowner character varying, displayname character varying,
			pendingsurvey boolean, surveycontext text, locked boolean, lastusergroup character varying
        )`
    },
}

const querySubcoreConversation = {
    post: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        communicationchannelid as zyxmecommunicationchannelid, personid as zyxmepersonid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        postexternalid, message, content, postexternalparentid, commentexternalid
        FROM post
        WHERE corpid = $corpid
        ORDER BY postid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO post (
            zyxmecorpid,
            corpid,
            orgid,
            communicationchannelid,
            personid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            postexternalid, message, content, postexternalparentid, commentexternalid
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            (SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmecommunicationchannelid = dt.zyxmecommunicationchannelid LIMIT 1),
            dt.zyxmepersonid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.postexternalid, dt.message, dt.content, dt.postexternalparentid, dt.commentexternalid
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmecommunicationchannelid bigint,
			zyxmepersonid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			postexternalid character varying, message text, content text,
			postexternalparentid character varying, commentexternalid character varying
        )`
    },
    pccstatus: {
        select: `SELECT pcc.corpid as zyxmecorpid, pcc.orgid as zyxmeorgid,
        pcc.communicationchannelid as zyxmecommunicationchannelid,
        pcc.personcommunicationchannel,
        pcc.description, pcc.status, pcc.type, pcc.createdate, pcc.createby, pcc.changedate, pcc.changeby, pcc.edit
        FROM pccstatus pcc
        WHERE pcc.corpid = $corpid
        ORDER BY pcc.pccstatusid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO pccstatus (
            zyxmecorpid,
            corpid,
            orgid,
            communicationchannelid,
            personcommunicationchannel,
            description, status, type, createdate, createby, changedate, changeby, edit
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            COALESCE((SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmecommunicationchannelid = dt.zyxmecommunicationchannelid LIMIT 1), 0),
            dt.personcommunicationchannel,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmecommunicationchannelid bigint,
			personcommunicationchannel character varying,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean
        )`
    },
    conversation: {
        select: `SELECT co.corpid as zyxmecorpid, co.orgid as zyxmeorgid, co.personid as zyxmepersonid,
        co.personcommunicationchannel, co.communicationchannelid as zyxmecommunicationchannelid,
        co.conversationid as zyxmeconversationid,
        co.description, co.status, co.type, co.createdate, co.createby, co.changedate, co.changeby, co.edit,
        co.firstconversationdate, co.lastconversationdate,
        co.firstuserid, co.lastuserid,
        co.firstreplytime::text, co.averagereplytime::text, co.userfirstreplytime::text, co.useraveragereplytime::text,
        co.ticketnum, co.startdate, co.finishdate, co.totalduration::text, co.realduration::text, co.totalpauseduration::text, co.personaveragereplytime::text,
        co.closetype, co.context, co.postexternalid, co.commentexternalid, co.replyexternalid,
        co.botduration::text, co.autoclosetime::text, co.handoffdate, co.pausedauto,
        co.chatflowcontext, co.variablecontext, co.usergroup, co.mailflag,
        co.sentiment, co.sadness, co.joy, co.fear, co.disgust, co.anger,
        co.usersentiment, co.usersadness, co.userjoy, co.userfear, co.userdisgust, co.useranger,
        co.personsentiment, co.personsadness, co.personjoy, co.personfear, co.persondisgust, co.personanger,
        co.balancetimes, co.firstassignedtime::text, co.extradata, co.holdingwaitingtime::text, co.closetabdate, co.abandoned,
        co.lastreplydate, co.personlastreplydate, co.tags,
        co.wnlucategories, co.wnluconcepts, co.wnluentities, co.wnlukeywords, co.wnlumetadata, co.wnlurelations, co.wnlusemanticroles,
        co.wnlcclass,
        co.wtaanger, co.wtafear, co.wtajoy, co.wtasadness, co.wtaanalytical, co.wtaconfident, co.wtatentative,
        co.wtaexcited, co.wtafrustrated, co.wtaimpolite, co.wtapolite, co.wtasad, co.wtasatisfied, co.wtasympathetic,
        co.wtauseranger, co.wtauserfear, co.wtauserjoy, co.wtausersadness, co.wtauseranalytical, co.wtauserconfident, co.wtausertentative,
        co.wtauserexcited, co.wtauserfrustrated, co.wtauserimpolite, co.wtauserpolite, co.wtausersad, co.wtausersatisfied, co.wtausersympathetic,
        co.wtapersonanger, co.wtapersonfear, co.wtapersonjoy, co.wtapersonsadness, co.wtapersonanalytical, co.wtapersonconfident, co.wtapersontentative,
        co.wtapersonexcited, co.wtapersonfrustrated, co.wtapersonimpolite, co.wtapersonpolite, co.wtapersonsad, co.wtapersonsatisfied, co.wtapersonsympathetic,
        co.wnlusyntax, co.wnlusentiment, co.wnlusadness, co.wnlujoy, co.wnlufear, co.wnludisgust, co.wnluanger,
        co.wnluusersentiment, co.wnluusersadness, co.wnluuserjoy, co.wnluuserfear, co.wnluuserdisgust, co.wnluuseranger,
        co.wnlupersonsentiment, co.wnlupersonsadness, co.wnlupersonjoy, co.wnlupersonfear, co.wnlupersondisgust, co.wnlupersonanger,
        co.enquiries, co.classification, co.firstusergroup, co.emailalertsent, co.tdatime::text,
        co.interactionquantity, co.interactionpersonquantity, co.interactionbotquantity, co.interactionasesorquantity,
        co.interactionaiquantity, co.interactionaipersonquantity, co.interactionaibotquantity, co.interactionaiasesorquantity,
        co.handoffafteransweruser, co.lastseendate, co.closecomment
        FROM conversation co
        WHERE co.corpid = $corpid
        ORDER BY co.conversationid ASC
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO conversation (
            zyxmecorpid,
            corpid,
            orgid,
            personid,
            personcommunicationchannel,
            communicationchannelid,
            zyxmeconversationid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            firstconversationdate, lastconversationdate,
            firstuserid, lastuserid,
            firstreplytime, averagereplytime, userfirstreplytime, useraveragereplytime,
            ticketnum, startdate, finishdate, totalduration, realduration, totalpauseduration, personaveragereplytime,
            closetype, context, postexternalid, commentexternalid, replyexternalid,
            botduration, autoclosetime, handoffdate, pausedauto,
            chatflowcontext, variablecontext, usergroup, mailflag,
            sentiment, sadness, joy, fear, disgust, anger,
            usersentiment, usersadness, userjoy, userfear, userdisgust, useranger,
            personsentiment, personsadness, personjoy, personfear, persondisgust, personanger,
            balancetimes, firstassignedtime, extradata, holdingwaitingtime, closetabdate, abandoned,
            lastreplydate, personlastreplydate, tags,
            wnlucategories, wnluconcepts, wnluentities, wnlukeywords, wnlumetadata, wnlurelations, wnlusemanticroles,
            wnlcclass,
            wtaanger, wtafear, wtajoy, wtasadness, wtaanalytical, wtaconfident, wtatentative,
            wtaexcited, wtafrustrated, wtaimpolite, wtapolite, wtasad, wtasatisfied, wtasympathetic,
            wtauseranger, wtauserfear, wtauserjoy, wtausersadness, wtauseranalytical, wtauserconfident, wtausertentative,
            wtauserexcited, wtauserfrustrated, wtauserimpolite, wtauserpolite, wtausersad, wtausersatisfied, wtausersympathetic,
            wtapersonanger, wtapersonfear, wtapersonjoy, wtapersonsadness, wtapersonanalytical, wtapersonconfident, wtapersontentative,
            wtapersonexcited, wtapersonfrustrated, wtapersonimpolite, wtapersonpolite, wtapersonsad, wtapersonsatisfied, wtapersonsympathetic,
            wnlusyntax, wnlusentiment, wnlusadness, wnlujoy, wnlufear, wnludisgust, wnluanger,
            wnluusersentiment, wnluusersadness, wnluuserjoy, wnluuserfear, wnluuserdisgust, wnluuseranger,
            wnlupersonsentiment, wnlupersonsadness, wnlupersonjoy, wnlupersonfear, wnlupersondisgust, wnlupersonanger,
            enquiries, classification, firstusergroup, emailalertsent, tdatime,
            interactionquantity, interactionpersonquantity, interactionbotquantity, interactionasesorquantity,
            interactionaiquantity, interactionaipersonquantity, interactionaibotquantity, interactionaiasesorquantity,
            handoffafteransweruser, lastseendate, closecomment
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            COALESCE(dt.zyxmepersonid, 0),
            dt.personcommunicationchannel,
            COALESCE((SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmecommunicationchannelid = dt.zyxmecommunicationchannelid LIMIT 1), 0),
            dt.zyxmeconversationid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.firstconversationdate, dt.lastconversationdate,
            COALESCE((SELECT userid FROM usr WHERE zyxmeuserid = dt.firstuserid LIMIT 1), 0),
            COALESCE((SELECT userid FROM usr WHERE zyxmeuserid = dt.lastuserid LIMIT 1), 0),
            dt.firstreplytime, dt.averagereplytime, dt.userfirstreplytime, dt.useraveragereplytime,
            dt.ticketnum, dt.startdate, dt.finishdate, dt.totalduration, dt.realduration, dt.totalpauseduration, dt.personaveragereplytime,
            dt.closetype, dt.context, dt.postexternalid, dt.commentexternalid, dt.replyexternalid,
            dt.botduration, dt.autoclosetime, dt.handoffdate, dt.pausedauto,
            dt.chatflowcontext, dt.variablecontext, dt.usergroup, dt.mailflag,
            dt.sentiment, dt.sadness, dt.joy, dt.fear, dt.disgust, dt.anger,
            dt.usersentiment, dt.usersadness, dt.userjoy, dt.userfear, dt.userdisgust, dt.useranger,
            dt.personsentiment, dt.personsadness, dt.personjoy, dt.personfear, dt.persondisgust, dt.personanger,
            dt.balancetimes, dt.firstassignedtime, dt.extradata, dt.holdingwaitingtime, dt.closetabdate, dt.abandoned,
            dt.lastreplydate, dt.personlastreplydate, dt.tags,
            dt.wnlucategories, dt.wnluconcepts, dt.wnluentities, dt.wnlukeywords, dt.wnlumetadata, dt.wnlurelations, dt.wnlusemanticroles,
            dt.wnlcclass,
            dt.wtaanger, dt.wtafear, dt.wtajoy, dt.wtasadness, dt.wtaanalytical, dt.wtaconfident, dt.wtatentative,
            dt.wtaexcited, dt.wtafrustrated, dt.wtaimpolite, dt.wtapolite, dt.wtasad, dt.wtasatisfied, dt.wtasympathetic,
            dt.wtauseranger, dt.wtauserfear, dt.wtauserjoy, dt.wtausersadness, dt.wtauseranalytical, dt.wtauserconfident, dt.wtausertentative,
            dt.wtauserexcited, dt.wtauserfrustrated, dt.wtauserimpolite, dt.wtauserpolite, dt.wtausersad, dt.wtausersatisfied, dt.wtausersympathetic,
            dt.wtapersonanger, dt.wtapersonfear, dt.wtapersonjoy, dt.wtapersonsadness, dt.wtapersonanalytical, dt.wtapersonconfident, dt.wtapersontentative,
            dt.wtapersonexcited, dt.wtapersonfrustrated, dt.wtapersonimpolite, dt.wtapersonpolite, dt.wtapersonsad, dt.wtapersonsatisfied, dt.wtapersonsympathetic,
            dt.wnlusyntax, dt.wnlusentiment, dt.wnlusadness, dt.wnlujoy, dt.wnlufear, dt.wnludisgust, dt.wnluanger,
            dt.wnluusersentiment, dt.wnluusersadness, dt.wnluuserjoy, dt.wnluuserfear, dt.wnluuserdisgust, dt.wnluuseranger,
            dt.wnlupersonsentiment, dt.wnlupersonsadness, dt.wnlupersonjoy, dt.wnlupersonfear, dt.wnlupersondisgust, dt.wnlupersonanger,
            dt.enquiries, dt.classification, dt.firstusergroup, dt.emailalertsent, dt.tdatime,
            dt.interactionquantity, dt.interactionpersonquantity, dt.interactionbotquantity, dt.interactionasesorquantity,
            dt.interactionaiquantity, dt.interactionaipersonquantity, dt.interactionaibotquantity, dt.interactionaiasesorquantity,
            dt.handoffafteransweruser, dt.lastseendate, dt.closecomment
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmepersonid bigint,
			personcommunicationchannel character varying,
			zyxmecommunicationchannelid bigint,
			zyxmeconversationid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			firstconversationdate timestamp without time zone, lastconversationdate timestamp without time zone,
			firstuserid bigint, lastuserid bigint,
			firstreplytime interval, averagereplytime interval, userfirstreplytime interval, useraveragereplytime interval,
			ticketnum character varying, startdate timestamp without time zone, finishdate timestamp without time zone,
			totalduration interval, realduration interval, totalpauseduration interval, personaveragereplytime interval,
			closetype character varying, context text, postexternalid character varying, commentexternalid character varying, replyexternalid character varying,
			botduration interval, autoclosetime interval, handoffdate timestamp without time zone, pausedauto boolean,
			chatflowcontext text, variablecontext text, usergroup character varying, mailflag boolean,
			sentiment numeric, sadness numeric, joy numeric, fear numeric, disgust numeric, anger numeric,
			usersentiment numeric, usersadness numeric, userjoy numeric, userfear numeric, userdisgust numeric, useranger numeric,
			personsentiment numeric, personsadness numeric, personjoy numeric, personfear numeric, persondisgust numeric, personanger numeric,
			balancetimes bigint, firstassignedtime interval, extradata text, holdingwaitingtime interval, closetabdate timestamp without time zone, abandoned boolean,
			lastreplydate timestamp without time zone, personlastreplydate timestamp without time zone, tags text,
			wnlucategories text, wnluconcepts text, wnluentities text, wnlukeywords text, wnlumetadata text, wnlurelations text, wnlusemanticroles text,
			wnlcclass text,
			wtaanger numeric, wtafear numeric, wtajoy numeric, wtasadness numeric, wtaanalytical numeric, wtaconfident numeric, wtatentative numeric,
			wtaexcited numeric, wtafrustrated numeric, wtaimpolite numeric, wtapolite numeric, wtasad numeric, wtasatisfied numeric, wtasympathetic numeric,
			wtauseranger numeric, wtauserfear numeric, wtauserjoy numeric, wtausersadness numeric, wtauseranalytical numeric, wtauserconfident numeric, wtausertentative numeric,
			wtauserexcited numeric, wtauserfrustrated numeric, wtauserimpolite numeric, wtauserpolite numeric, wtausersad numeric, wtausersatisfied numeric, wtausersympathetic numeric,
			wtapersonanger numeric, wtapersonfear numeric, wtapersonjoy numeric, wtapersonsadness numeric, wtapersonanalytical numeric, wtapersonconfident numeric, wtapersontentative numeric,
			wtapersonexcited numeric, wtapersonfrustrated numeric, wtapersonimpolite numeric, wtapersonpolite numeric, wtapersonsad numeric, wtapersonsatisfied numeric, wtapersonsympathetic numeric,
			wnlusyntax text, wnlusentiment numeric, wnlusadness numeric, wnlujoy numeric, wnlufear numeric, wnludisgust numeric, wnluanger numeric,
			wnluusersentiment numeric, wnluusersadness numeric, wnluuserjoy numeric, wnluuserfear numeric, wnluuserdisgust numeric, wnluuseranger numeric,
			wnlupersonsentiment numeric, wnlupersonsadness numeric, wnlupersonjoy numeric, wnlupersonfear numeric, wnlupersondisgust numeric, wnlupersonanger numeric,
			enquiries text, classification character varying, firstusergroup character varying, emailalertsent boolean, tdatime interval,
			interactionquantity bigint, interactionpersonquantity bigint, interactionbotquantity bigint, interactionasesorquantity bigint,
			interactionaiquantity bigint, interactionaipersonquantity bigint, interactionaibotquantity bigint, interactionaiasesorquantity bigint,
			handoffafteransweruser timestamp without time zone, lastseendate timestamp without time zone, closecomment text
        )`,
        update: `SELECT ufn_ticketnum_ins(orgid)
        FROM org
        WHERE zyxmecorpid = $corpid`
    },
    conversationclassification: {
        select: `SELECT co.corpid as zyxmecorpid, co.orgid as zyxmeorgid, co.personid as zyxmepersonid,
        co.personcommunicationchannel, co.conversationid as zyxmeconversationid,
        co.communicationchannelid as zyxmecommunicationchannelid,
        co.classificationid as zyxmeclassificationid,
        co.status, co.createdate, co.createby, co.changedate, co.changeby, co.edit,
        co.jobplan
        FROM conversationclassification co
        WHERE co.corpid = $corpid
        ORDER BY co.conversationid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO conversationclassification (
            zyxmecorpid,
            corpid,
            orgid,
            personid,
            personcommunicationchannel,
            conversationid,
            communicationchannelid,
            classificationid,
            status, createdate, createby, changedate, changeby, edit,
            jobplan
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            COALESCE(dt.zyxmepersonid, 0),
            dt.personcommunicationchannel,
            COALESCE(
                dt.zyxmeconversationid,
                (SELECT conversationid FROM conversation WHERE zyxmecorpid = dt.zyxmecorpid AND orgid = (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1) ORDER BY conversationid ASC LIMIT 1),
                0
            ),
            COALESCE((SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmecommunicationchannelid = dt.zyxmecommunicationchannelid LIMIT 1), 0),
            COALESCE((SELECT classificationid FROM classification WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeclassificationid = dt.zyxmeclassificationid LIMIT 1), 0),
            dt.status, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.jobplan
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmepersonid bigint,
			personcommunicationchannel character varying,
			zyxmeconversationid bigint,
			zyxmecommunicationchannelid bigint,
			zyxmeclassificationid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			jobplan text
        )`
    },
    conversationnote: {
        select: `SELECT co.corpid as zyxmecorpid, co.orgid as zyxmeorgid, co.personid as zyxmepersonid,
        co.personcommunicationchannel, co.communicationchannelid as zyxmecommunicationchannelid,
        co.conversationid as zyxmeconversationid,
        co.description, co.status, co.type, co.createdate, co.createby, co.changedate, co.changeby, co.edit,
        co.addpersonnote, co.note
        FROM conversationnote co
        WHERE co.corpid = $corpid
        ORDER BY co.conversationnoteid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO conversationnote (
            zyxmecorpid,
            corpid,
            orgid,
            personid,
            personcommunicationchannel,
            communicationchannelid,
            conversationid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            addpersonnote, note
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            COALESCE(dt.zyxmepersonid, 0),
            dt.personcommunicationchannel,
            COALESCE((SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmecommunicationchannelid = dt.zyxmecommunicationchannelid LIMIT 1), 0),
            COALESCE(dt.zyxmeconversationid, 0),
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.addpersonnote, dt.note
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmepersonid bigint,
			personcommunicationchannel character varying,
			zyxmecommunicationchannelid bigint,
			zyxmeconversationid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			addpersonnote boolean, note text
        )`
    },
    conversationpause: {
        select: `SELECT co.corpid as zyxmecorpid, co.orgid as zyxmeorgid, co.personid as zyxmepersonid,
        co.personcommunicationchannel, co.communicationchannelid as zyxmecommunicationchannelid,
        co.conversationid as zyxmeconversationid,
        co.description, co.status, co.type, co.createdate, co.createby, co.changedate, co.changeby, co.edit,
        co.startpause, co.stoppause
        FROM conversationpause co
        WHERE co.corpid = $corpid
        ORDER BY co.conversationpauseid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO conversationpause (
            zyxmecorpid,
            corpid,
            orgid,
            personid,
            personcommunicationchannel,
            communicationchannelid,
            conversationid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            startpause, stoppause
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            COALESCE(dt.zyxmepersonid, 0),
            dt.personcommunicationchannel,
            COALESCE((SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmecommunicationchannelid = dt.zyxmecommunicationchannelid LIMIT 1), 0),
            COALESCE(dt.zyxmeconversationid, 0),
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.startpause, dt.stoppause
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmepersonid bigint,
			personcommunicationchannel character varying,
			zyxmecommunicationchannelid bigint,
			zyxmeconversationid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			startpause timestamp without time zone, stoppause timestamp without time zone
        )`
    },
    conversationpending: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        personcommunicationchannel,
        userid as zyxmeuserid,
        conversationid as zyxmeconversationid,
        status, communicationchannelsite, interactiontext
        FROM conversationpending
        WHERE corpid = $corpid
        ORDER BY conversationid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO conversationpending (
            zyxmecorpid,
            corpid,
            orgid,
            personcommunicationchannel,
            userid,
            conversationid,
            status, communicationchannelsite, interactiontext
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            dt.personcommunicationchannel,
            COALESCE((SELECT userid FROM usr WHERE zyxmeuserid = dt.zyxmeuserid LIMIT 1), 0),
            COALESCE(
                dt.zyxmeconversationid,
                (SELECT conversationid FROM conversation WHERE zyxmecorpid = dt.zyxmecorpid AND orgid = (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1) ORDER BY conversationid ASC LIMIT 1)
            ),
            dt.status, dt.communicationchannelsite, dt.interactiontext
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			personcommunicationchannel character varying,
			zyxmeuserid bigint,
            zyxmeconversationid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			communicationchannelsite character varying, interactiontext text
        )`
    },
    conversationstatus: {
        select: `SELECT co.corpid as zyxmecorpid, co.orgid as zyxmeorgid, co.personid as zyxmepersonid,
        co.personcommunicationchannel, co.communicationchannelid as zyxmecommunicationchannelid,
        co.conversationid as zyxmeconversationid,
        co.description, co.status, co.type, co.createdate, co.createby, co.changedate, co.changeby, co.edit
        FROM conversationstatus co
        WHERE co.corpid = $corpid
        ORDER BY co.conversationstatusid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO conversationstatus (
            zyxmecorpid,
            corpid,
            orgid,
            personid,
            personcommunicationchannel,
            communicationchannelid,
            conversationid,
            description, status, type, createdate, createby, changedate, changeby, edit
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            COALESCE(dt.zyxmepersonid, 0),
            dt.personcommunicationchannel,
            COALESCE((SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmecommunicationchannelid = dt.zyxmecommunicationchannelid LIMIT 1), 0),
            COALESCE(dt.zyxmeconversationid, 0),
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmepersonid bigint,
			personcommunicationchannel character varying,
			zyxmecommunicationchannelid bigint,
			zyxmeconversationid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean
        )`
    },
    interaction: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, personid as zyxmepersonid,
        personcommunicationchannel, communicationchannelid as zyxmecommunicationchannelid,
        conversationid as zyxmeconversationid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        interactiontext, userid as zyxmeuserid, intent, intentexample, entityname, entityvalue,
        dialognode, dialogcondition, urlattachment, htmlattachment,
        interactiontype, highlight, labels, postexternalid,
        sentiment, sadness, joy, fear, disgust, anger,
        nluresult, likewall, hiddenwall,
        chatflowpluginid, chatflowcardid, carduuid, validinput, inputquestion, attempt,
        wnlucategories, wnluconcepts, wnluentities, wnlukeywords, wnlumetadata, wnlurelations, wnlusemanticroles,
        wnlcclass1, wnlcclass2, wnlcresult,
        wtaanger, wtafear, wtajoy, wtasadness, wtaanalytical, wtaconfident, wtatentative, wtaexcited,
        wtafrustrated, wtaimpolite, wtapolite, wtasad, wtasatisfied, wtasympathetic, wtaresult,
        wnlusyntax, wnlusentiment, wnlusadness, wnlujoy, wnlufear, wnludisgust, wnluanger, wnluresult,
        waintent, waentityname, waentityvalue, waresult
        FROM interaction
        WHERE corpid = $corpid
        ORDER BY interactionid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO interaction (
            zyxmecorpid,
            corpid,
            orgid,
            personid,
            personcommunicationchannel,
            communicationchannelid,
            conversationid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            interactiontext, userid, intent, intentexample, entityname, entityvalue,
            dialognode, dialogcondition, urlattachment, htmlattachment,
            interactiontype, highlight, labels, postexternalid,
            sentiment, sadness, joy, fear, disgust, anger,
            nluresult, likewall, hiddenwall,
            chatflowpluginid, chatflowcardid, carduuid, validinput, inputquestion, attempt,
            wnlucategories, wnluconcepts, wnluentities, wnlukeywords, wnlumetadata, wnlurelations, wnlusemanticroles,
            wnlcclass1, wnlcclass2, wnlcresult,
            wtaanger, wtafear, wtajoy, wtasadness, wtaanalytical, wtaconfident, wtatentative, wtaexcited,
            wtafrustrated, wtaimpolite, wtapolite, wtasad, wtasatisfied, wtasympathetic, wtaresult,
            wnlusyntax, wnlusentiment, wnlusadness, wnlujoy, wnlufear, wnludisgust, wnluanger, wnluresult,
            waintent, waentityname, waentityvalue, waresult
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            COALESCE(
                dt.zyxmepersonid,
                (SELECT personid FROM person WHERE zyxmecorpid = dt.zyxmecorpid AND orgid = (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1) LIMIT 1)
            ),
            dt.personcommunicationchannel,
            COALESCE((SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmecommunicationchannelid = dt.zyxmecommunicationchannelid LIMIT 1), 0),
            COALESCE(
                dt.zyxmeconversationid,
                (SELECT conversationid FROM conversation WHERE zyxmecorpid = dt.zyxmecorpid AND orgid = (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1) ORDER BY conversationid ASC LIMIT 1)
            ),
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.interactiontext,
            COALESCE((SELECT userid FROM usr WHERE zyxmeuserid = dt.zyxmeuserid LIMIT 1), 0),
            dt.intent, dt.intentexample, dt.entityname, dt.entityvalue,
            dt.dialognode, dt.dialogcondition, dt.urlattachment, dt.htmlattachment,
            dt.interactiontype, dt.highlight, dt.labels, dt.postexternalid,
            dt.sentiment, dt.sadness, dt.joy, dt.fear, dt.disgust, dt.anger,
            dt.nluresult, dt.likewall, dt.hiddenwall,
            dt.chatflowpluginid, dt.chatflowcardid, dt.carduuid, dt.validinput, dt.inputquestion, dt.attempt,
            dt.wnlucategories, dt.wnluconcepts, dt.wnluentities, dt.wnlukeywords, dt.wnlumetadata, dt.wnlurelations, dt.wnlusemanticroles,
            dt.wnlcclass1, dt.wnlcclass2, dt.wnlcresult,
            dt.wtaanger, dt.wtafear, dt.wtajoy, dt.wtasadness, dt.wtaanalytical, dt.wtaconfident, dt.wtatentative, dt.wtaexcited,
            dt.wtafrustrated, dt.wtaimpolite, dt.wtapolite, dt.wtasad, dt.wtasatisfied, dt.wtasympathetic, dt.wtaresult,
            dt.wnlusyntax, dt.wnlusentiment, dt.wnlusadness, dt.wnlujoy, dt.wnlufear, dt.wnludisgust, dt.wnluanger, dt.wnluresult,
            dt.waintent, dt.waentityname, dt.waentityvalue, dt.waresult
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmepersonid bigint,
			personcommunicationchannel character varying,
			zyxmecommunicationchannelid bigint,
			zyxmeconversationid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			interactiontext text,
			zyxmeuserid bigint,
			intent character varying, intentexample character varying, entityname character varying, entityvalue character varying,
			dialognode character varying, dialogcondition character varying, urlattachment character varying, htmlattachment character varying,
			interactiontype character varying, highlight boolean, labels character varying, postexternalid character varying,
			sentiment numeric, sadness numeric, joy numeric, fear numeric, disgust numeric, anger numeric,
			nluresult text, likewall boolean, hiddenwall boolean,
			chatflowpluginid character varying, chatflowcardid character varying, carduuid character varying, validinput boolean, inputquestion text, attempt bigint,
			wnlucategories text, wnluconcepts text, wnluentities text, wnlukeywords text, wnlumetadata text, wnlurelations text, wnlusemanticroles text,
			wnlcclass1 text, wnlcclass2 text, wnlcresult text,
			wtaanger numeric, wtafear numeric, wtajoy numeric, wtasadness numeric, wtaanalytical numeric, wtaconfident numeric, wtatentative numeric, wtaexcited numeric,
			wtafrustrated numeric, wtaimpolite numeric, wtapolite numeric, wtasad numeric, wtasatisfied numeric, wtasympathetic numeric, wtaresult text,
			wnlusyntax text, wnlusentiment numeric, wnlusadness numeric, wnlujoy numeric, wnlufear numeric, wnludisgust numeric, wnluanger numeric, wnluresult text,
			waintent text, waentityname text, waentityvalue text, waresult text
        )`
    },
    surveyanswered: {
        select: `SELECT sa.corpid as zyxmecorpid, sa.orgid as zyxmeorgid, sa.conversationid as zyxmeconversationid,
        sa.description, sa.status, COALESCE(split_part(pr.propertyname, 'NUMEROPREGUNTA', 1), 'NINGUNO') as type, sa.createdate, sa.createby, sa.changedate, sa.changeby, sa.edit,
        sa.answer, sa.answervalue, sa.comment,
        sq.question, (SELECT GREATEST(COUNT(q.a)::text, MAX(q.a[1])) FROM (SELECT regexp_matches(sq.question,'[\\d𝟏𝟐𝟑𝟒𝟓]+','g') a) q)::BIGINT scale
        FROM surveyanswered sa
        LEFT JOIN surveyquestion sq ON sq.corpid = sa.corpid AND sq.orgid = sa.orgid AND sq.surveyquestionid = sa.surveyquestionid
        LEFT JOIN property pr ON pr.corpid = sa.corpid AND pr.orgid = sa.orgid AND pr.status = 'ACTIVO'
        AND pr.propertyname ILIKE '%NUMEROPREGUNTA' AND pr.propertyvalue = sq.questionnumber::text
        WHERE sa.corpid = $corpid
        ORDER BY surveyansweredid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO surveyanswered (
            zyxmecorpid,
            corpid,
            orgid,
            conversationid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            answer, answervalue, comment,
            question, scale, high, medium, low, fcr
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            COALESCE(
                dt.zyxmeconversationid,
                (SELECT conversationid FROM conversation WHERE zyxmecorpid = dt.zyxmecorpid AND orgid = (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1) ORDER BY conversationid ASC LIMIT 1)
            ),
            dt.description, dt.status, dt.type::CHARACTER VARYING, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.answer, dt.answervalue, dt.comment,
            dt.question, dt.scale::BIGINT,
            CASE WHEN dt.type IN ('FCR','FIX') THEN '1'
            WHEN dt.type NOT IN ('FCR','FIX') AND dt.scale IN (9,10) THEN '9,10'
            WHEN dt.type NOT IN ('FCR','FIX') AND dt.scale IN (5) THEN '4,5'
            END,
            CASE WHEN dt.scale IN (9,10) THEN '7,8'
            WHEN dt.type <> 'FCR' AND dt.scale IN (5) THEN '3'
            END,
            CASE WHEN dt.type IN ('FCR','FIX') THEN '0,2'
            WHEN dt.type NOT IN ('FCR','FIX') AND dt.scale IN (9,10) THEN '1,2,3,4,5,6'
            WHEN dt.type NOT IN ('FCR','FIX') AND dt.scale IN (5) THEN '1,2'
            END,
            CASE WHEN dt.type IN ('FCR','FIX') THEN true END
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmeconversationid bigint,
			description character varying, status character varying, type text,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			answer text, answervalue integer, comment text, question text, scale bigint
        )`,
        update: `
        UPDATE surveyanswered
        SET rank = CASE WHEN answervalue = ANY(string_to_array(low,',')::BIGINT[]) THEN 'LOW'
        WHEN answervalue = ANY(string_to_array(medium,',')::BIGINT[]) THEN 'MEDIUM'
        WHEN answervalue = ANY(string_to_array(high,',')::BIGINT[]) THEN 'HIGH'
        END
        WHERE zyxmecorpid = $corpid AND rank is null`
    },
}

const querySubcoreCampaign = {    
    messagetemplate: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, hsmtemplateid as zyxmemessagetemplateid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        hsmid as name, namespace, category, language,
        message as body, header, buttons
        FROM hsmtemplate
        WHERE corpid = $corpid
        ORDER BY hsmtemplateid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO messagetemplate (
            zyxmecorpid,
            corpid,
            orgid,
            zyxmemessagetemplateid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            name, namespace, category, language,
            templatetype, headerenabled, headertype, header, body,
            footerenabled, footer, buttonsenabled, buttons
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            dt.zyxmemessagetemplateid,
            dt.description, dt.status, dt.type::CHARACTER VARYING, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.name, dt.namespace, dt.category, dt.language,
            CASE WHEN dt.type = 'HSM' THEN 'MULTIMEDIA' ELSE 'STANDARD' END,
            NULLIF(dt.header, '')::JSON->>'type' <> '',
            NULLIF(dt.header, '')::JSON->>'type',
            NULLIF(dt.header, '')::JSON->>'value',
            dt.body,
            false, '',
            NULLIF(NULLIF(dt.buttons, '[]'),'')::JSON IS NOT NULL,
            REPLACE(REPLACE(NULLIF(NULLIF(dt.buttons, '[]'),''),'"value":','"payload":'),'"text":','"title":')::JSON
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmemessagetemplateid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			name character varying, namespace character varying, category character varying, language character varying,
			header character varying, body character varying, buttons character varying
        )`
    },
    campaign: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, campaignid as zyxmecampaignid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        title, members, startdate, enddate, repeatable, frecuency,
        message, communicationchannelid as zyxmecommunicationchannelid, hsmid as messagetemplatename, hsmnamespace as messagetemplatenamespace,
        counter, lastrundate, usergroup, subject,
        hsmtemplateid as zyxmemessagetemplateid,
        REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(NULLIF(hsmheader,''), '\\\\+\\"', '"', 'g'),'^\\"+\\{','{','g'),'\\}\\"+dt.','}','g') as messagetemplateheader,
        REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(NULLIF(hsmbuttons,''), '\\\\+\\"', '"', 'g'),'^\\"+\\[','[','g'),'\\]\\"+dt.',']','g') as messagetemplatebuttons,
        executiontype, batchjson, taskid as zyxmetaskid, fields
        FROM campaign
        WHERE corpid = $corpid
        ORDER BY campaignid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO campaign (
            zyxmecorpid,
            corpid,
            orgid,
            zyxmecampaignid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            title, members, startdate, enddate, repeatable, frecuency,
            message,
            communicationchannelid,
            messagetemplatename, messagetemplatenamespace,
            counter, lastrundate, usergroup, subject,
            messagetemplateid,
            messagetemplateheader,
            messagetemplatebuttons,
            executiontype, batchjson, taskid, fields
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            dt.zyxmecampaignid,
            dt.description, dt.status, REPLACE(dt.type, 'HSMID', 'HSM'), dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.title, dt.members, dt.startdate::DATE, dt.enddate::DATE, dt.repeatable, dt.frecuency,
            dt.message,
            (SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmecommunicationchannelid = dt.zyxmecommunicationchannelid LIMIT 1),
            dt.messagetemplatename, dt.messagetemplatenamespace,
            dt.counter, dt.lastrundate, dt.usergroup, dt.subject,
            (SELECT messagetemplateid FROM messagetemplate WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmemessagetemplateid = dt.zyxmemessagetemplateid LIMIT 1),
            dt.messagetemplateheader::JSONB,
            REPLACE(REPLACE(NULLIF(NULLIF(dt.messagetemplatebuttons, '[]'),''),'"value":','"payload":'),'"text":','"title":')::JSONB,
            dt.executiontype, dt.batchjson::JSONB,
            (
                SELECT string_agg(taskschedulerid::text,',')
                FROM taskscheduler
                WHERE zyxmecorpid = dt.zyxmecorpid AND 
                zyxmetaskschedulerid IN (SELECT UNNEST(string_to_array(dt.zyxmetaskid,',')::BIGINT[]))
            ),
            dt.fields::JSONB
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmecampaignid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			title character varying, members json, startdate date, enddate date, repeatable boolean, frecuency bigint,
			message text,
			zyxmecommunicationchannelid bigint,
			messagetemplatename character varying, messagetemplatenamespace character varying,
			counter integer, lastrundate timestamp without time zone, usergroup character varying, subject text,
			zyxmemessagetemplateid bigint,
			messagetemplateheader text,
			messagetemplatebuttons text,
			executiontype character varying, batchjson text,
			zyxmetaskid text,
			fields text
        )`
    },
    campaignmember: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, campaignid as zyxmecampaignid,
        personid as zyxmepersonid, campaignmemberid as zyxmecampaignmemberid,
        status, personcommunicationchannel, type, displayname, personcommunicationchannelowner,
        field1, field2, field3, field4, field5, field6, field7, field8, field9,
        field10, field11, field12, field13, field14, field15,
        resultfromsend, batchindex
        FROM campaignmember
        WHERE corpid = $corpid
        ORDER BY campaignmemberid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO campaignmember (
            zyxmecorpid,
            corpid,
            orgid,
            campaignid,
            personid,
            zyxmecampaignmemberid,
            status, personcommunicationchannel, type, displayname, personcommunicationchannelowner,
            field1, field2, field3, field4, field5, field6, field7, field8, field9,
            field10, field11, field12, field13, field14, field15,
            resultfromsend, batchindex
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            (SELECT campaignid FROM campaign WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmecampaignid = dt.zyxmecampaignid LIMIT 1),
            dt.zyxmepersonid,
            dt.zyxmecampaignmemberid,
            dt.status, dt.personcommunicationchannel, dt.type, dt.displayname, dt.personcommunicationchannelowner,
            dt.field1, dt.field2, dt.field3, dt.field4, dt.field5, dt.field6, dt.field7, dt.field8, dt.field9,
            dt.field10, dt.field11, dt.field12, dt.field13, dt.field14, dt.field15,
            dt.resultfromsend, dt.batchindex
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmecampaignid bigint,
			zyxmepersonid bigint,
			zyxmecampaignmemberid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			personcommunicationchannel character varying, displayname character varying, personcommunicationchannelowner character varying,
			field1 character varying, field2 character varying, field3 character varying, field4 character varying, field5 character varying,
			field6 character varying, field7 character varying, field8 character varying, field9 character varying, field10 character varying,
			field11 character varying, field12 character varying, field13 character varying, field14 character varying, field15 character varying,
			resultfromsend text, batchindex bigint
        )`
    },
    campaignhistory: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, campaignid as zyxmecampaignid,
        personid as zyxmepersonid, campaignmemberid as zyxmecampaignmemberid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        success, message, rundate, conversationid as zyxmeconversationid, attended
        FROM campaignhistory
        WHERE corpid = $corpid
        ORDER BY campaignhistoryid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO campaignhistory (
            zyxmecorpid,
            corpid,
            orgid,
            campaignid,
            personid,
            campaignmemberid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            success, message, rundate, conversationid, attended
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            (SELECT campaignid FROM campaign WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmecampaignid = dt.zyxmecampaignid LIMIT 1),
            CASE WHEN COALESCE(dt.zyxmepersonid, 0) = 0 THEN 0
            ELSE COALESCE(
                    dt.zyxmepersonid,
                    (SELECT personid FROM person WHERE zyxmecorpid = dt.zyxmecorpid AND orgid = (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1) LIMIT 1)
                )
            END,
            COALESCE((SELECT campaignmemberid FROM campaignmember WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmecampaignmemberid = dt.zyxmecampaignmemberid LIMIT 1), 0),
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.success, dt.message, dt.rundate,
            CASE WHEN COALESCE(dt.zyxmeconversationid, 0) = 0 THEN 0
            ELSE dt.zyxmeconversationid
            END,
            dt.attended
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmecampaignid bigint,
			zyxmepersonid bigint,
			zyxmecampaignmemberid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			success boolean, message text, rundate timestamp without time zone,
			zyxmeconversationid bigint,
			attended boolean
        )`
    },
}

const querySubcoreOthers = {    
    taskscheduler: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, taskschedulerid as zyxmetaskschedulerid,
        tasktype, taskbody, repeatflag, repeatmode, repeatinterval, completed,
        datetimestart, datetimeend, datetimeoriginalstart, datetimelastrun, taskprocessedids
        FROM taskscheduler
        WHERE corpid = $corpid
        AND tasktype NOT IN
        ('CHECKABANDONMENT',
        'CLEANSMOOCHSESSION',
        'CLEANTICKET',
        'CONVERSATIONCHECK',
        'EXECUTEQUERY',
        'PLAYSTORECOMMENTCHECK',
        'REFRESHOUTLOOKTOKEN',
        'REFRESHPLAYSTORETOKEN',
        'RELOCATEFILE',
        'SENDPASSWORDALERT',
        'STATUSCHECK',
        'UPDATECHANNEL',
        'UPDATEOUTLOOKSUBSCRIPTION',
        'UPDATESESSION',
        'UPDATEUSER',
        'YOUTUBECOMMENTCHECK')
        ORDER BY taskschedulerid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO taskscheduler (
            zyxmecorpid,
            corpid,
            orgid,
            zyxmetaskschedulerid,
            tasktype,
            taskbody,
            repeatflag, repeatmode, repeatinterval, completed,
            datetimestart, datetimeend, datetimeoriginalstart, datetimelastrun, taskprocessedids
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            dt.zyxmetaskschedulerid,
            dt.tasktype::TEXT,
            CASE WHEN dt.tasktype = 'ExecuteCampaign'
            THEN jsonb_set(
                dt.taskbody::JSONB,
                '{campaignid}',
                to_jsonb((SELECT campaignid FROM campaign WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmecampaignid = (dt.taskbody::JSONB->>'campaignid')::BIGINT LIMIT 1)),
                false
            )::TEXT
            ELSE dt.taskbody::TEXT
            END,
            dt.repeatflag, dt.repeatmode, dt.repeatinterval, dt.completed,
            dt.datetimestart, dt.datetimeend, dt.datetimeoriginalstart, dt.datetimelastrun, dt.taskprocessedids
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmetaskschedulerid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			tasktype character varying,
			taskbody character varying,
			repeatflag boolean, repeatmode integer, repeatinterval integer, completed boolean,
			datetimestart timestamp without time zone, datetimeend timestamp without time zone,
			datetimeoriginalstart timestamp without time zone, datetimelastrun timestamp without time zone,
			taskprocessedids character varying
        )`
    },
    blockversion: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, chatblockversionid as zyxmechatblockversionid,
        communicationchannelid, chatblockid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        title, defaultgroupid, defaultblockid, firstblockid, aiblockid, blockgroup, variablecustom,
        color, icontype, tag
        FROM blockversion
        WHERE corpid = $corpid
        ORDER BY chatblockversionid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO blockversion (
            zyxmecorpid,
            corpid,
            orgid,
            zyxmechatblockversionid,
            communicationchannelid,
            chatblockid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            title, defaultgroupid, defaultblockid, firstblockid, aiblockid, blockgroup, variablecustom,
            color, icontype, tag
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            dt.zyxmechatblockversionid,
            (
                SELECT string_agg(communicationchannelid::text,',')
                FROM communicationchannel
                WHERE zyxmecorpid = dt.zyxmecorpid AND 
                zyxmecommunicationchannelid IN (SELECT UNNEST(string_to_array(dt.communicationchannelid,',')::BIGINT[]))
            ),
            dt.chatblockid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.title, dt.defaultgroupid, dt.defaultblockid, dt.firstblockid, dt.aiblockid, dt.blockgroup, dt.variablecustom,
            dt.color, dt.icontype, dt.tag
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmechatblockversionid bigint,
			communicationchannelid character varying,
			chatblockid text,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			title text, defaultgroupid text, defaultblockid text, firstblockid text, aiblockid text, blockgroup text, variablecustom text,
			color character varying, icontype character varying, tag text
        )`
    },
    block: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        communicationchannelid, chatblockid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        title, defaultgroupid, defaultblockid, firstblockid, aiblockid, blockgroup, variablecustom,
        color, icontype, tag, chatblockversionid as zyxmechatblockversionid
        FROM block
        WHERE corpid = $corpid
        ORDER BY ctid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO block (
            zyxmecorpid,
            corpid,
            orgid,
            communicationchannelid,
            chatblockid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            title, defaultgroupid, defaultblockid, firstblockid, aiblockid, blockgroup, variablecustom,
            color, icontype, tag,
            chatblockversionid
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            (
                SELECT string_agg(communicationchannelid::text,',')
                FROM communicationchannel
                WHERE zyxmecorpid = dt.zyxmecorpid AND 
                zyxmecommunicationchannelid IN (SELECT UNNEST(string_to_array(dt.communicationchannelid,',')::BIGINT[]))
            ),
            dt.chatblockid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.title, dt.defaultgroupid, dt.defaultblockid, dt.firstblockid, dt.aiblockid, dt.blockgroup, dt.variablecustom,
            dt.color, dt.icontype, dt.tag,
            (SELECT chatblockversionid FROM blockversion WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmechatblockversionid = dt.zyxmechatblockversionid LIMIT 1)
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			communicationchannelid character varying,
			chatblockid text,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			title text, defaultgroupid text, defaultblockid text, firstblockid text, aiblockid text, blockgroup text, variablecustom text,
			color character varying, icontype character varying, tag text, zyxmechatblockversionid bigint
        )`
    },
    tablevariableconfiguration: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        chatblockid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        variable, fontcolor, fontbold, priority, visible
        FROM tablevariableconfiguration
        WHERE corpid = $corpid
        ORDER BY tablevariableconfigurationid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO tablevariableconfiguration (
            zyxmecorpid,
            corpid,
            orgid,
            chatblockid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            variable, fontcolor, fontbold, priority, visible
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            dt.chatblockid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.variable, dt.fontcolor, dt.fontbold, dt.priority, dt.visible
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			chatblockid text,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			variable character varying, fontcolor character varying, fontbold boolean, priority bigint, visible boolean
		)`
    },
    intelligentmodels: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        endpoint, modelid, apikey, provider
        FROM intelligentmodels
        WHERE corpid = $corpid
        ORDER BY intelligentmodelsid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO intelligentmodels (
            zyxmecorpid,
            corpid,
            orgid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            endpoint, modelid, apikey, provider
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.endpoint, dt.modelid, dt.apikey, dt.provider
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			endpoint text, modelid text, apikey character varying, provider character varying
        )`
    },
    intelligentmodelsconfiguration: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, communicationchannelid as zyxmecommunicationchannelid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        parameters, channels, color, icontype
        FROM intelligentmodelsconfiguration
        WHERE corpid = $corpid
        ORDER BY intelligentmodelsconfigurationid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO intelligentmodelsconfiguration (
            zyxmecorpid,
            corpid,
            orgid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            parameters, channels, color, icontype
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            (SELECT jsonb_agg(
                        jsonb_set(
                            jsonb_set(
                                jo.jv,
                                '{intelligentmodelsid}',
                                to_jsonb(jo.zyxmeintelligentmodelsid),
                                false
                            ),
                            '{type_of_service}',
                            to_jsonb(jo.servicetype),
                            true
                    )
                    )
                    FROM (
                        SELECT
                        ja.value as jv,
                        (SELECT intelligentmodelsid FROM intelligentmodels WHERE zyxmecorpid = dt.zyxmecorpid AND intelligentmodelsid = (ja.value->>'intelligentmodelsid')::BIGINT) as zyxmeintelligentmodelsid,
                        CASE ja.value->>'service'
                        WHEN 'WATSON ASSISTANT' THEN 'ASSISTANT'
                        WHEN 'RASA' THEN 'ASSISTANT'
                        WHEN 'NATURAL LANGUAGE CLASSIFIER' THEN 'CLASSIFIER'
                        WHEN 'NATURAL LANGUAGE UNDERSTANDING' THEN 'NATURAL LANGUAGE UNDERSTANDING'
                        WHEN 'TONE ANALYZER' THEN 'TONE ANALYZER'
                        END as servicetype
                        FROM jsonb_array_elements(dt.parameters::JSONB) ja	 
                    )  jo
            ),
            (
                SELECT string_agg(communicationchannelid::text,',')
                FROM communicationchannel
                WHERE zyxmecorpid = dt.zyxmecorpid AND 
                zyxmecommunicationchannelid IN (SELECT UNNEST(string_to_array(dt.channels,',')::BIGINT[]))
            ),
            dt.color, dt.icontype
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmecommunicationchannelid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			parameters text, channels character varying, color character varying, icontype character varying
        )`
    },
}

const queryExtras = {
    blacklist: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, blacklistid as zyxmeblacklistid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        phone
        FROM blacklist
        WHERE corpid = $corpid
        ORDER BY blacklistid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO blacklist (
            zyxmecorpid,
            corpid,
            orgid,
            zyxmeblacklistid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            phone
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            dt.zyxmeblacklistid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.phone
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmeblacklistid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			phone character varying
        )`
    },
    hsmhistory: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        config, success, message, groupname, transactionid, externalid
        FROM hsmhistory
        WHERE corpid = $corpid
        ORDER BY hsmhistoryid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO hsmhistory (
            zyxmecorpid,
            corpid,
            orgid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            config,
            success, message, groupname, transactionid, externalid
        )
        SELECT 
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            COALESCE(jsonb_set(
                dt.config::JSONB,
                '{CommunicationChannelId}',
                to_jsonb((SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmecommunicationchannelid = (dt.config::JSONB->>'CommunicationChannelId')::BIGINT LIMIT 1)),
                false
            ), dt.config::JSONB)::TEXT,
            dt.success, dt.message, dt.groupname, dt.transactionid, dt.externalid
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			config text, success boolean, message text, groupname character varying, transactionid character varying, externalid character varying
        )`
    },
    inappropriatewords: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        description, status, type, createdate, createby, changedate, changeby, edit
        FROM inappropriatewords
        WHERE corpid = $corpid
        ORDER BY inappropriatewordsid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO inappropriatewords (
            zyxmecorpid,
            corpid,
            orgid,
            description, status, type, createdate, createby, changedate, changeby, edit
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean
        )`
    },
    label: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        color, intent, tags
        FROM label
        WHERE corpid = $corpid
        ORDER BY labelid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO label (
            zyxmecorpid,
            corpid,
            orgid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            color, intent, tags
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.color, dt.intent, dt.tags
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			color character varying, intent text, tags text
        )`
    },
    location: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        name, address, district, city, country, schedule, phone, alternativephone, email, alternativeemail,
        latitude, longitude, googleurl
        FROM location
        WHERE corpid = $corpid
        ORDER BY locationid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO location (
            zyxmecorpid,
            corpid,
            orgid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            name, address, district, city, country, schedule, phone, alternativephone, email, alternativeemail,
            latitude, longitude, googleurl
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.name, dt.address, dt.district, dt.city, dt.country, dt.schedule, dt.phone, dt.alternativephone, dt.email, dt.alternativeemail,
            dt.latitude, dt.longitude, dt.googleurl
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			name character varying, address character varying, district character varying, city character varying, country character varying,
			schedule character varying, phone character varying, alternativephone character varying, email character varying, alternativeemail character varying,
			latitude double precision, longitude double precision, googleurl character varying
        )`
    },
    payment: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        conversationid as zyxmeconversationid, personid as zyxmepersonid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        pocketbook, tokenid, title, amount, currency, email, capture,
        tokenjson, chargejson, refundjson, customerjson, cardjson, planjson, subscriptionjson,
        saleorderid, paymentdate, totaldiscount, obs
        FROM payment
        WHERE corpid = $corpid
        ORDER BY paymentid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO payment (
            zyxmecorpid,
            corpid,
            orgid,
            conversationid,
            personid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            pocketbook, tokenid, title, amount, currency, email, capture,
            tokenjson, chargejson, refundjson, customerjson, cardjson, planjson, subscriptionjson,
            saleorderid, paymentdate, totaldiscount, obs
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            dt.zyxmeconversationid,
            COALESCE(
                dt.zyxmepersonid,
                (SELECT personid FROM person WHERE zyxmecorpid = dt.zyxmecorpid AND orgid = (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1) LIMIT 1)
            ),
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.pocketbook, dt.tokenid, dt.title, dt.amount, dt.currency, dt.email, dt.capture,
            dt.tokenjson, dt.chargejson, dt.refundjson, dt.customerjson, dt.cardjson, dt.planjson, dt.subscriptionjson,
            dt.saleorderid, dt.paymentdate, dt.totaldiscount, dt.obs
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmeconversationid bigint,
			zyxmepersonid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			pocketbook text, tokenid text, title text, amount numeric, currency text, email text, capture boolean,
			tokenjson text, chargejson text, refundjson text, customerjson text, cardjson text, planjson text, subscriptionjson text,
			saleorderid bigint, paymentdate date, totaldiscount numeric, obs text
        )`
    },
    productivity: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, userid as zyxmeuserid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        fullname, communicationchannel, communicationchanneldesc,
        datestr, hours, hoursrange,
        worktime::text, busytimewithinwork::text, freetimewithinwork::text, busytimeoutsidework::text,
        onlinetime::text, idletime::text, qtytickets, qtyconnection, qtydisconnection
        FROM productivity
        WHERE corpid = $corpid
        ORDER BY productivityid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO productivity (
            zyxmecorpid,
            corpid,
            orgid,
            userid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            fullname, communicationchannel, communicationchanneldesc,
            datestr, hours, hoursrange,
            worktime, busytimewithinwork, freetimewithinwork, busytimeoutsidework,
            onlinetime, idletime, qtytickets, qtyconnection, qtydisconnection
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            (SELECT userid FROM usr WHERE zyxmeuserid = dt.zyxmeuserid LIMIT 1),
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.fullname,
            (
                SELECT string_agg(communicationchannelid::text,',')
                FROM communicationchannel
                WHERE zyxmecorpid = dt.zyxmecorpid AND 
                zyxmecommunicationchannelid IN (SELECT UNNEST(string_to_array(dt.communicationchannel,',')::BIGINT[]))
            ),
            dt.communicationchanneldesc,
            dt.datestr, dt.hours, dt.hoursrange,
            dt.worktime, dt.busytimewithinwork, dt.freetimewithinwork, dt.busytimeoutsidework,
            dt.onlinetime, dt.idletime, dt.qtytickets, dt.qtyconnection, dt.qtydisconnection
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			zyxmeuserid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			fullname text,
			communicationchannel character varying,
			communicationchanneldesc text,
			datestr text, hours text, hoursrange text,
			worktime interval, busytimewithinwork interval, freetimewithinwork interval, busytimeoutsidework interval,
			onlinetime interval, idletime interval, qtytickets bigint, qtyconnection bigint, qtydisconnection bigint
        )`
    },
    reporttemplate: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        communicationchannelid, columnjson, filterjson
        FROM reporttemplate
        WHERE corpid = $corpid
        ORDER BY reporttemplateid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO reporttemplate (
            zyxmecorpid,
            corpid,
            orgid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            communicationchannelid, columnjson, filterjson
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            (
                SELECT string_agg(communicationchannelid::text,',')
                FROM communicationchannel
                WHERE zyxmecorpid = dt.zyxmecorpid AND 
                zyxmecommunicationchannelid IN (SELECT UNNEST(string_to_array(dt.communicationchannelid,',')::BIGINT[]))
            ),
            dt.columnjson, dt.filterjson
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			communicationchannelid text,
			columnjson text, filterjson text
        )`
    },
    sla: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        company, communicationchannelid, usergroup,
        totaltmo::text, totaltmopercentmax, totaltmopercentmin,
        usertmo::text, usertmopercentmax, usertmopercentmin,
        tme::text, tmepercentmax, tmepercentmin,
        usertme::text, usertmepercentmax, usertmepercentmin,
        productivitybyhour, totaltmomin::text, usertmomin::text, tmemin::text, usertmemin::text, tmoclosedby, tmeclosedby
        FROM sla
        WHERE corpid = $corpid
        ORDER BY slaid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO sla (
            zyxmecorpid,
            corpid,
            orgid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            company, communicationchannelid, usergroup,
            totaltmo, totaltmopercentmax, totaltmopercentmin,
            usertmo, usertmopercentmax, usertmopercentmin,
            tme, tmepercentmax, tmepercentmin,
            usertme, usertmepercentmax, usertmepercentmin,
            productivitybyhour, totaltmomin, usertmomin, tmemin, usertmemin, tmoclosedby, tmeclosedby
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.company,
            (
                SELECT string_agg(communicationchannelid::text,',')
                FROM communicationchannel
                WHERE zyxmecorpid = dt.zyxmecorpid AND 
                zyxmecommunicationchannelid IN (SELECT UNNEST(string_to_array(dt.communicationchannelid,',')::BIGINT[]))
            ),
            dt.usergroup,
            dt.totaltmo, dt.totaltmopercentmax, dt.totaltmopercentmin,
            dt.usertmo, dt.usertmopercentmax, dt.usertmopercentmin,
            dt.tme, dt.tmepercentmax, dt.tmepercentmin,
            dt.usertme, dt.usertmepercentmax, dt.usertmepercentmin,
            dt.productivitybyhour, dt.totaltmomin, dt.usertmomin, dt.tmemin, dt.usertmemin, dt.tmoclosedby, dt.tmeclosedby
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			company character varying,
			communicationchannelid character varying,
			usergroup character varying,
			totaltmo interval, totaltmopercentmax numeric, totaltmopercentmin numeric,
			usertmo interval, usertmopercentmax numeric, usertmopercentmin numeric,
			tme interval, tmepercentmax numeric, tmepercentmin numeric,
			usertme interval, usertmepercentmax numeric, usertmepercentmin numeric,
			productivitybyhour numeric, totaltmomin interval, usertmomin interval, tmemin interval, usertmemin interval, tmoclosedby text, tmeclosedby text
        )`
    },
    whitelist: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        phone, asesorname, documenttype, documentnumber, usergroup
        FROM whitelist
        WHERE corpid = $corpid
        ORDER BY whitelistid
        LIMIT $limit
        OFFSET $offset`,
        insert: `INSERT INTO whitelist (
            zyxmecorpid,
            corpid,
            orgid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            phone, asesorname, documenttype, documentnumber, usergroup
        )
        SELECT
            dt.zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = dt.zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = dt.zyxmecorpid AND zyxmeorgid = dt.zyxmeorgid LIMIT 1),
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.phone, dt.asesorname, dt.documenttype, dt.documentnumber, dt.usergroup
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint, zyxmeorgid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			phone character varying, asesorname character varying, documenttype character varying, documentnumber character varying, usergroup character varying
        )`
    }
}

const queryCorpSel = `SELECT corpid, description FROM corp WHERE status = 'ACTIVO'`;

exports.listCorp = async (req, res) => {
    let result = await zyxmeQuery(queryCorpSel);
    if (result instanceof Array) {
        return res.json({ error: false, success: true, data: result });
    }
    else
        return res.status(result.rescode).json(result);
}

exports.executeMigration = async (req, res) => {
    let { corpid, modules, clean = false, movewebhook = false } = req.body;
    if (!!corpid && !!modules) {
        const corpidBind = { corpid: corpid }
        let queryResult = {core: {}, subcore: {}, extras: {}};
        try {
            if (modules.includes('core')) {
                if (clean === true) {
                    await laraigoQuery('SELECT FROM ufn_migration_core_delete($corpid)', bind = corpidBind);
                    clean = false;
                }
                queryResult.core = await migrationExecute(corpidBind, queryCore, movewebhook);
            }
            if (modules.includes('subcore')) {
                if (clean === true) {
                    await laraigoQuery('SELECT FROM ufn_migration_subcore_delete($corpid)', bind = corpidBind);
                }
                queryResult.subcore.classification = await migrationExecute(corpidBind, querySubcoreClassification);
                queryResult.subcore.person = await migrationExecute(corpidBind, querySubcorePerson);
                queryResult.subcore.conversation = await migrationExecute(corpidBind, querySubcoreConversation);
                queryResult.subcore.campaign = await migrationExecute(corpidBind, querySubcoreCampaign);
                queryResult.subcore.others = await migrationExecute(corpidBind, querySubcoreOthers);
            }
            if (modules.includes('extras')) {
                if (clean === true) {
                    await laraigoQuery('SELECT FROM ufn_migration_extras_delete($corpid)', bind = corpidBind);
                }
                queryResult.extras.blacklist = await migrationExecute(corpidBind, {blacklist: queryExtras.blacklist});
                queryResult.extras.hsmhistory = await migrationExecute(corpidBind, {hsmhistory: queryExtras.hsmhistory});
                queryResult.extras.inappropriatewords = await migrationExecute(corpidBind, {inappropriatewords: queryExtras.inappropriatewords});
                queryResult.extras.label = await migrationExecute(corpidBind, {label: queryExtras.label});
                queryResult.extras.location = await migrationExecute(corpidBind, {location: queryExtras.location});
                queryResult.extras.payment = await migrationExecute(corpidBind, {payment: queryExtras.payment});
                queryResult.extras.productivity = await migrationExecute(corpidBind, {productivity: queryExtras.productivity});
                queryResult.extras.reporttemplate = await migrationExecute(corpidBind, {reporttemplate: queryExtras.reporttemplate});
                queryResult.extras.sla = await migrationExecute(corpidBind, {sla: queryExtras.sla});
                queryResult.extras.whitelist = await migrationExecute(corpidBind, {whitelist: queryExtras.whitelist});
            }
            if (!modules.includes('extras') && modules.includes('extras.blacklist')) {
                if (clean === true) {
                    await laraigoQuery('DELETE FROM "blacklist" WHERE zyxmecorpid = $corpid', bind = corpidBind);
                }
                queryResult.extras.blacklist = await migrationExecute(corpidBind, {blacklist: queryExtras.blacklist});
            }
            if (!modules.includes('extras') && modules.includes('extras.hsmhistory')) {
                if (clean === true) {
                    await laraigoQuery('DELETE FROM "hsmhistory" WHERE zyxmecorpid = $corpid', bind = corpidBind);
                }
                queryResult.extras.hsmhistory = await migrationExecute(corpidBind, {hsmhistory: queryExtras.hsmhistory});
            }
            if (!modules.includes('extras') && modules.includes('extras.inappropriatewords')) {
                if (clean === true) {
                    await laraigoQuery('DELETE FROM "inappropriatewords" WHERE zyxmecorpid = $corpid', bind = corpidBind);
                }
                queryResult.extras.inappropriatewords = await migrationExecute(corpidBind, {inappropriatewords: queryExtras.inappropriatewords});
            }
            if (!modules.includes('extras') && modules.includes('extras.label')) {
                if (clean === true) {
                    await laraigoQuery('DELETE FROM "label" WHERE zyxmecorpid = $corpid', bind = corpidBind);
                }
                queryResult.extras.label = await migrationExecute(corpidBind, {label: queryExtras.label});
            }
            if (!modules.includes('extras') && modules.includes('extras.location')) {
                if (clean === true) {
                    await laraigoQuery('DELETE FROM "location" WHERE zyxmecorpid = $corpid', bind = corpidBind);
                }
                queryResult.extras.location = await migrationExecute(corpidBind, {location: queryExtras.location});
            }
            if (!modules.includes('extras') && modules.includes('extras.payment')) {
                if (clean === true) {
                    await laraigoQuery('DELETE FROM "payment" WHERE zyxmecorpid = $corpid', bind = corpidBind);
                }
                queryResult.extras.payment = await migrationExecute(corpidBind, {payment: queryExtras.payment});
            }
            if (!modules.includes('extras') && modules.includes('extras.productivity')) {
                if (clean === true) {
                    await laraigoQuery('DELETE FROM "productivity" WHERE zyxmecorpid = $corpid', bind = corpidBind);
                }
                queryResult.extras.productivity = await migrationExecute(corpidBind, {productivity: queryExtras.productivity});
            }
            if (!modules.includes('extras') && modules.includes('extras.reporttemplate')) {
                if (clean === true) {
                    await laraigoQuery('DELETE FROM "reporttemplate" WHERE zyxmecorpid = $corpid', bind = corpidBind);
                }
                queryResult.extras.reporttemplate = await migrationExecute(corpidBind, {reporttemplate: queryExtras.reporttemplate});
            }
            if (!modules.includes('extras') && modules.includes('extras.sla')) {
                if (clean === true) {
                    await laraigoQuery('DELETE FROM "sla" WHERE zyxmecorpid = $corpid', bind = corpidBind);
                }
                queryResult.extras.sla = await migrationExecute(corpidBind, {sla: queryExtras.sla});
            }
            if (!modules.includes('extras') && modules.includes('extras.whitelist')) {
                if (clean === true) {
                    await laraigoQuery('DELETE FROM "whitelist" WHERE zyxmecorpid = $corpid', bind = corpidBind);
                }
                queryResult.extras.whitelist = await migrationExecute(corpidBind, {whitelist: queryExtras.whitelist});
            }
            logger.debug(queryResult, { meta: { function: 'executeMigration' }} );
            return res.status(200).json({ error: false, success: true, data: queryResult });
        }
        catch (error) {
            logger.error(error, { meta: { function: 'executeMigration' }} );
            return res.status(500).json({ error: true, success: false, data: queryResult, msg: error.message });
        }
    }
    else {
        return res.status(400).json({ error: true, success: false, data: 'Invalid JSON' });
    }
}