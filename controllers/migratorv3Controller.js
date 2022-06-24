const sequelize = require('../config/database');
const zyxmeSequelize = require("../config/databasezyxme");
const { getErrorSeq } = require('../config/helpers');
const { QueryTypes } = require('sequelize');
const axios = require('axios');
const bcryptjs = require("bcryptjs");

/* ESTE MIGRADOR SOLO ES PARA AÑADIR DATA DE ZYXME A LARAIGO */

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
"corp"
|"org"
||"domain"
||"inputvalidation"
||"appintegration"
||"botconfiguration"
|||"communicationchannel"
||||"communicationchannelstatus"
||||"property"
"usr"
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
                        data: data.map(d => ({ userid: d.zyxmeuserid, pwd: d.pwd, secret: "VCAPERU2022LARAIGO#!" })),
                        method: 'post',
                        url: `${apiServiceEndpoint}decryption`,
                    });
                    const salt = await bcryptjs.genSalt(10);
                    for (let i = 0; i < data.length; i++) {
                        try {
                            data[i].pwd = await bcryptjs.hash(response.data.find(r => r.userid === data[i].zyxmeuserid).pwd, salt);
                        }
                        catch (error) {
                            console.log(error);
                        }
                    }
                } catch (error) {
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
                for (let i = 0; i < data.length; i++) {
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
                                break;
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
                    } catch (error) {
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
                for (let i = 0; i < data.length; i++) {
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
                                break;
                            default:
                                break;
                        }
                    } catch (error) {
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
                        d.variablecontext = d.variablecontext.replace(new RegExp(`"id":"${oldname}_custom"`, "g"), `"id":"${newname}_custom"`);
                        d.variablecontext = d.variablecontext.replace(new RegExp(`"Name":"${oldname}"`, "g"), `"Name":"${newname}"`);
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
                    d.description = d.description.replace(`${oldname}`, `${newname}`);
                }
                return d;
            });
            break;
        case 'tablevariableconfiguration':
            data = data.map(d => {
                for (const [oldname, newname] of variableRenameList) {
                    d.variable = d.variable.replace(`${oldname}`, `${newname}`);
                }
                return d;
            });
            break;
        case 'block': case 'blockversion':
            data = data.map(d => {
                for (const [oldname, newname] of variableRenameList) {
                    d.blockgroup = d.blockgroup.replace(new RegExp(`"title":"${oldname}","caption"`, "g"), `"title":"${newname}","caption"`);
                    d.blockgroup = d.blockgroup.replace(new RegExp(`"variablename":"${oldname}"`, "g"), `"variablename":"${newname}"`);
                    d.blockgroup = d.blockgroup.replace(new RegExp(`"variablecontext":"${oldname}"`, "g"), `"variablecontext":"${newname}"`);
                    d.blockgroup = d.blockgroup.replace(new RegExp(`"conditionvariable":"${oldname}"`, "g"), `"conditionvariable":"${newname}"`);
                    d.blockgroup = d.blockgroup.replace(new RegExp(`"latitude":"${oldname}"`, "g"), `"latitude":"${newname}"`);
                    d.blockgroup = d.blockgroup.replace(new RegExp(`"longitude":"${oldname}"`, "g"), `"longitude":"${newname}"`);
                    d.blockgroup = d.blockgroup.replace(new RegExp(`{{${oldname}}}`, "g"), `{{${newname}}}`);
                    d.variablecustom = d.variablecustom.replace(new RegExp(`"id":"${oldname}_custom"`, "g"), `"id":"${newname}_custom"`);
                    d.variablecustom = d.variablecustom.replace(new RegExp(`"name":"${oldname}"`, "g"), `"name":"${newname}"`);
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
    for (const [k, q] of Object.entries(queries)) {
        executeResult[k] = { success: true, errors: [] };
        try {
            let migrationstatus = await zyxmeQuery(`SELECT run FROM migration WHERE corpid = $corpid`, corpidBind);
            let running = migrationstatus.length > 0 ? migrationstatus[0].run : false;
            if (!running) {
                break;
            }

            lastloopid = 0;
            corpidBind['maxid'] = 0;
            let limit = 10000; // PRUEBAS 100
            let counter = 0;
            const perChunk = 1000;
            // Último registro en laraigo
            // Setear inc por si se ha insertado data adicional antes del merge de info
            if (q.id) {
                let laraigoid = q.newid ? q.newid : q.id;
                max = await laraigoQuery(`SELECT MAX(${laraigoid}) FROM ${k}`);
                corpidBind['maxid'] = max?.[0]?.max || 0;
                if (!!corpidBind[`max${laraigoid}`]) {
                    corpidBind[`inc${laraigoid}`] = corpidBind['maxid'] - corpidBind[`max${laraigoid}`];
                }
                else {
                    corpidBind[`inc${laraigoid}`] = 0;
                }
            }

            while (true) {
                // Último registro en laraigo
                if (q.id) {
                    let laraigoid = q.newid ? q.newid : q.id;
                    max = await laraigoQuery(`SELECT MAX(${laraigoid}) FROM ${k}`);
                    corpidBind['maxid'] = max?.[0]?.max || 0;
                }
                
                // Revisión del estado de la migración
                migrationstatus = running === true ? await zyxmeQuery(`SELECT run FROM migration WHERE corpid = $corpid`, corpidBind) : migrationstatus;
                running = migrationstatus.length > 0 ? migrationstatus[0].run : false;
                if (!running) {
                    break;
                }

                // Select a la BD de ZyxMe
                let selectStartTime = process.hrtime();
                let selectResult = await zyxmeQuery(`${q.select} ${q.select_insert_where}`.replace('\n', ' '), { ...corpidBind, offset: counter * limit, limit });
                let selectElapsedSeconds = parseHrtimeToSeconds(process.hrtime(selectStartTime));
                if (selectResult instanceof Array) {
                    if (selectResult.length === 0 || lastloopid === selectResult[0][`zyxme${q.id}`]) {
                        break;
                    }
                    selectResult = await recryptPwd(k, selectResult);
                    // selectResult = await reconfigWebhook(k, selectResult, movewebhook);
                    selectResult = renameVariable(k, selectResult);
                    selectResult = restructureVariable(k, selectResult);
                    let chunkArray = selectResult.reduce((chunk, item, index) => {
                        const chunkIndex = Math.floor(index / perChunk)
                        if (!chunk[chunkIndex]) {
                            chunk[chunkIndex] = []
                        }
                        chunk[chunkIndex].push(item)
                        return chunk
                    }, []);

                    for (const chunk of chunkArray) {
                        // Insert a la BD de Laraigo
                        if (q.insert) {
                            let startTime = process.hrtime();
                            try {
                                let insertResult = await laraigoQuery(q.insert.replace('###DT###', q.dt).replace('\n', ' '), { datatable: JSON.stringify(chunk) });
                                let elapsedSeconds = parseHrtimeToSeconds(process.hrtime(startTime));
                                if (insertResult instanceof Array) {
                                }
                                else {
                                    console.log(insertResult);
                                    executeResult[k].success = false;
                                    executeResult[k].errors.push({ script: insertResult });
                                }
                            } catch (error) {
                                let elapsedSeconds = parseHrtimeToSeconds(process.hrtime(startTime));
                                console.log(error);
                                executeResult[k].errors.push({ script: error });
                            }
                        }
                    }
                    // Counter para queries offset limit
                    counter += 1;
                    // Lastloopid para queries > id limit
                    if (q.id) {
                        lastloopid = selectResult[0][`zyxme${q.id}`];
                    }
                    // PRUEBAS Break solo para pruebas de 1 loop
                    // break;
                }
                else {
                    console.log(selectResult);
                    executeResult[k].success = false;
                    executeResult[k].errors.push({ script: selectResult });
                    break;
                }
            }

            // Revisión del estado de la migración
            migrationstatus = running === true ? await zyxmeQuery(`SELECT run FROM migration WHERE corpid = $corpid`, corpidBind) : migrationstatus;
            running = migrationstatus.length > 0 ? migrationstatus[0].run : false;
            if (!running) {
                break;
            }

            // Acciones post insert
            if (q.post_1) {
                let startTime = process.hrtime();
                try {
                    let updateResult = await laraigoQuery(q.post_1.replace('\n', ' '), corpidBind);
                    let elapsedSeconds = parseHrtimeToSeconds(process.hrtime(startTime));
                    if (updateResult instanceof Array) {
                    }
                    else {
                        console.log(updateResult);
                        executeResult[k].success = false;
                        executeResult[k].errors.push({ script: updateResult });
                    }
                } catch (error) {
                    let elapsedSeconds = parseHrtimeToSeconds(process.hrtime(startTime));
                    console.log(error);
                    executeResult[k].errors.push({ script: error });
                }
            }

            // Revisión del estado de la migración
            migrationstatus = running === true ? await zyxmeQuery(`SELECT run FROM migration WHERE corpid = $corpid`, corpidBind) : migrationstatus;
            running = migrationstatus.length > 0 ? migrationstatus[0].run : false;
            if (!running) {
                break;
            }

            if (q.id) {
                // Actualizar secuencia
                let laraigoid = q.newid ? q.newid : q.id;
                max = await laraigoQuery(`SELECT MAX(${laraigoid}) FROM ${k}`);
                if (max?.[0]?.max) {
                    corpidBind['maxid'] = max?.[0]?.max;
                    await laraigoQuery(`ALTER SEQUENCE ${q.sequence} START ${parseInt(max[0].max) + 1}`);
                    await laraigoQuery(`ALTER SEQUENCE ${q.sequence} RESTART`);
                    corpidBind['idsjson'][laraigoid] = max?.[0]?.max;
                    await laraigoQuery(`UPDATE migrationhelper SET idsjson = $idsjson`, { idsjson: JSON.stringify(corpidBind['idsjson']) })
                }
            }
            console.log(`Done ${k} maxid: ${corpidBind['maxid']}`)
        } catch (error) {
            console.log(error);
            executeResult[k].success = false;
            executeResult[k].errors.push({ script: error });
        }
    };
    return executeResult;
}

const maxids =
{
    "domainid": 5124,
    "inputvalidationid": 40,
    "appintegrationid": 0,
    "botconfigurationid": 10,
    "communicationchannelid": 65,
    "communicationchannelstatusid": 0,
    "propertyid": 1948,
    "userid": 1991,
    "usertokenid": 232761,
    "userstatusid": 2135,
    "userhistoryid": 1218721,
    "usrnotificationid": 501,
    "classificationid": 1173,
    "quickreplyid": 90,
    "personid": 7637830,
    "personaddinfoid": 13728,
    "postid": 25889,
    "pccstatusid": 9752861,
    "conversationid": 10425530,
    "conversationnoteid": 71,
    "conversationpauseid": 546720,
    "conversationstatusid": 21314656,
    "interactionid": 205480198,
    "surveyansweredid": 0,
    "messagetemplateid": 157,
    "campaignid": 46386,
    "campaignmemberid": 5587971,
    "campaignhistoryid": 5047008,
    "taskschedulerid": 46032,
    "chatblockversionid": 89,
    "tablevariableconfigurationid": 2853,
    "intelligentmodelsid": 0,
    "intelligentmodelsconfigurationid": 0,
    "paymentid": 0,
    "productivityid": 5092128,
    "blacklistid": 0,
    "hsmhistoryid": 371432,
    "inappropriatewordsid": 2,
    "labelid": 4,
    "locationid": 13772,
    "reporttemplateid": 21,
    "slaid": 0,
    "whitelistid": 5122
}

const queryCore = {
    domain: {
        id: 'domainid',
        sequence: 'domainseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        domainid + CASE WHEN domainid > $maxdomainid THEN $incdomainid ELSE 0 END as zyxmedomainid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        domainname, domainvalue, domaindesc, bydefault, "system", priorityorder
        FROM domain
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND (
            orgid IN (0)
            OR
            orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        )
        AND domainid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND (
            orgid IN (0)
            OR
            orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        )
        AND domainid > $maxid
        ORDER BY domainid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO domain (
            corpid,
            orgid,
            domainid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            domainname, domainvalue, domaindesc, bydefault, "system", priorityorder
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmedomainid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.domainname, dt.domainvalue, dt.domaindesc, dt.bydefault, dt.system, dt.priorityorder
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			zyxmedomainid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			domainname character varying, domainvalue character varying, domaindesc character varying,
			bydefault boolean, system boolean, priorityorder bigint
        )
        `
    },
    inputvalidation: {
        id: 'inputvalidationid',
        sequence: 'inputvalidationseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        inputvalidationid + CASE WHEN inputvalidationid > $maxinputvalidationid THEN $incinputvalidationid ELSE 0 END as zyxmeinputvalidationid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        inputvalue
        FROM inputvalidation
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND inputvalidationid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND inputvalidationid > $maxid
        ORDER BY inputvalidationid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO inputvalidation (
            corpid,
            inputvalidationid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            inputvalue
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeinputvalidationid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.inputvalue
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeinputvalidationid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			inputvalue character varying
        )
        `
    },
    /* appintegrationid is required for communicationchannel but no values seen */
    appintegration: {
        id: 'appintegrationid',
        sequence: 'appintegrationseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        appintegrationid + CASE WHEN appintegrationid > $maxappintegrationid THEN $incappintegrationid ELSE 0 END as zyxmeappintegrationid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        appid, externalsource, environment, keyparameters, integrationid
        FROM appintegration
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND appintegrationid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND appintegrationid > $maxid
        ORDER BY appintegrationid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO appintegration (
            corpid,
            orgid,
            appintegrationid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            appid, externalsource, environment, keyparameters, integrationid
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmeappintegrationid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.appid, dt.externalsource, dt.environment, dt.keyparameters, dt.integrationid
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			zyxmeappintegrationid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			appid character varying, externalsource character varying, environment character varying,
			keyparameters text, integrationid character varying
        )
        `
    },
    /* botconfiguration is required for communicationchannel */
    botconfiguration: {
        id: 'botconfigurationid',
        sequence: 'botconfigurationseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        botconfigurationid + CASE WHEN botconfigurationid > $maxbotconfigurationid THEN $incbotconfigurationid ELSE 0 END as zyxmebotconfigurationid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        bottype, parameterjson
        FROM botconfiguration
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND botconfigurationid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND botconfigurationid > $maxid
        ORDER BY botconfigurationid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO botconfiguration (
            corpid,
            orgid,
            botconfigurationid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            bottype, parameterjson
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmebotconfigurationid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.bottype, dt.parameterjson
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
			zyxmecorpid bigint,
            zyxmeorgid bigint,
			zyxmebotconfigurationid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			bottype character varying, parameterjson text
        )
        `
    },
    communicationchannel: {
        id: 'communicationchannelid',
        sequence: 'communicationchannelseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        communicationchannelid + CASE WHEN communicationchannelid > $maxcommunicationchannelid THEN $inccommunicationchannelid ELSE 0 END as zyxmecommunicationchannelid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        communicationchannelsite, communicationchannelowner, communicationchannelcontact, communicationchanneltoken,
        botenabled, customicon, coloricon,
        botconfigurationid + CASE WHEN botconfigurationid > $maxbotconfigurationid THEN $incbotconfigurationid ELSE 0 END as zyxmebotconfigurationid,
        relatedid, schedule, chatflowenabled,
        integrationid,
        appintegrationid + CASE WHEN appintegrationid > $maxappintegrationid THEN $incappintegrationid ELSE 0 END as zyxmeappintegrationid,
        country, channelparameters, channelactive, resolvelithium,
        color, icons, other, form, apikey
        FROM communicationchannel
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND communicationchannelid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND communicationchannelid > $maxid
        ORDER BY communicationchannelid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO communicationchannel (
            corpid,
            orgid,
            communicationchannelid,
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
            dt.zyxmeorgid,
            dt.zyxmecommunicationchannelid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            COALESCE(dt.communicationchannelsite, ''), COALESCE(dt.communicationchannelowner, ''), COALESCE(dt.communicationchannelcontact, ''), dt.communicationchanneltoken,
            dt.botenabled, dt.customicon, dt.coloricon,
            dt.zyxmebotconfigurationid,
            dt.relatedid, dt.schedule, dt.chatflowenabled,
            dt.integrationid,
            dt.zyxmeappintegrationid,
            dt.country, dt.channelparameters, dt.channelactive, dt.resolvelithium,
            dt.color, dt.icons, dt.other, dt.form, dt.apikey,
            dt.servicecredentials
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
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
        )
        `
    },
    communicationchannelstatus: {
        id: 'communicationchannelstatusid',
        sequence: 'communicationchannelstatusseq',
        select: `
        SELECT
        ccs.corpid as zyxmecorpid,
        ccs.orgid as zyxmeorgid,
        ccs.communicationchannelid + CASE WHEN ccs.communicationchannelid > $maxcommunicationchannelid THEN $inccommunicationchannelid ELSE 0 END as zyxmecommunicationchannelid,
        ccs.communicationchannelstatusid + CASE WHEN ccs.communicationchannelstatusid > $maxcommunicationchannelstatusid THEN $inccommunicationchannelstatusid ELSE 0 END as zyxmecommunicationchannelstatusid,
        ccs.description, ccs.status, ccs.type, ccs.createdate, ccs.createby, ccs.changedate, ccs.changeby, ccs.edit
        FROM communicationchannelstatus ccs
        `,
        select_update_where: `
        WHERE ccs.corpid = $corpid
        AND ccs.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND ccs.communicationchannelstatusid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE ccs.corpid = $corpid
        AND ccs.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND ccs.communicationchannelstatusid > $maxid
        ORDER BY ccs.communicationchannelstatusid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO communicationchannelstatus (
            corpid,
            orgid,
            communicationchannelid,
            communicationchannelstatusid,
            description, status, type, createdate, createby, changedate, changeby, edit
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmecommunicationchannelid,
            dt.zyxmecommunicationchannelstatusid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			zyxmecommunicationchannelid bigint, zyxmecommunicationchannelstatusid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean
        )
        `
    },
    property: {
        id: 'propertyid',
        sequence: 'propertyseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        communicationchannelid + CASE WHEN communicationchannelid > $maxcommunicationchannelid THEN $inccommunicationchannelid ELSE 0 END as zyxmecommunicationchannelid,
        propertyid + CASE WHEN propertyid > $maxpropertyid THEN $incpropertyid ELSE 0 END as zyxmepropertyid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        propertyname, propertyvalue
        FROM property
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND (
            orgid IN (0)
            OR
            orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        )
        AND propertyid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND (
            orgid IN (0)
            OR
            orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        )
        AND propertyid > $maxid
        ORDER BY propertyid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO property (
            corpid,
            orgid,
            communicationchannelid,
            propertyid,
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
            dt.zyxmeorgid,
            dt.zyxmecommunicationchannelid,
            dt.zyxmepropertyid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.propertyname::CHARACTER VARYING, dt.propertyvalue,
            (SELECT inputtype FROM property WHERE propertyname = dt.propertyname LIMIT 1),
            (SELECT domainname FROM property WHERE propertyname = dt.propertyname LIMIT 1),
            (SELECT category FROM property WHERE propertyname = dt.propertyname LIMIT 1),
            (SELECT "group" FROM property WHERE propertyname = dt.propertyname LIMIT 1),
            (SELECT level FROM property WHERE propertyname = dt.propertyname LIMIT 1)
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			zyxmecommunicationchannelid bigint,
			zyxmepropertyid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			propertyname character varying, propertyvalue character varying,
			inputtype character varying, domainname character varying,
			category character varying, "group" character varying, level character varying
        )
        `
    },
    usr: {
        id: 'userid',
        sequence: 'userseq',
        select: `
        SELECT DISTINCT ON(usr.userid) 
        ous.corpid as zyxmecorpid,
        usr.userid + CASE WHEN usr.userid > $maxuserid THEN $incuserid ELSE 0 END as zyxmeuserid,
        usr.description, usr.status, usr.type, usr.createdate, usr.createby, usr.changedate, usr.changeby, usr.edit,
        usr.usr as username, usr.doctype, usr.docnum, usr.pwd, usr.firstname, usr.lastname, usr.email,
        usr.pwdchangefirstlogin, usr.facebookid, usr.googleid, usr.company,
        usr.twofactorauthentication, usr.usersupport, usr.billinggroup, usr.registro as registercode, usr.usercall,
        usr.passwordchangedate, usr.lastlogin, usr.lastlogout, usr.lasttokenorigin, usr.lasttokenstatus,
        usr.lasthistorystatus, usr.lasthistorytype, usr.lastmotivetype, usr.lastmotivedescription,
        usr.attemptslogin, usr.lastuserstatus,
        usr.area, usr.location, usr.management, usr.phone
        FROM usr
        JOIN orguser ous ON ous.corpid = $corpid AND ous.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid) AND ous.userid = usr.userid
        `,
        select_update_where: `
        WHERE usr.type <> 'SYSTEM'
        AND usr.userid <= $maxid
        AND usr.changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE usr.type <> 'SYSTEM'
        AND usr.userid > $maxid
        ORDER BY usr.userid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO usr (
            userid,
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
            dt.zyxmeuserid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.username::CHARACTER VARYING, dt.doctype, dt.docnum, dt.pwd, dt.firstname, dt.lastname, dt.username::CHARACTER VARYING,
            dt.pwdchangefirstlogin, dt.facebookid, dt.googleid, dt.company,
            dt.twofactorauthentication, dt.usersupport,
            dt.billinggroup,
            dt.registercode, dt.usercall,
            dt.passwordchangedate, dt.lastlogin, dt.lastlogout, dt.lasttokenorigin, dt.lasttokenstatus,
            dt.lasthistorystatus, dt.lasthistorytype, dt.lastmotivetype, dt.lastmotivedescription,
            dt.attemptslogin, dt.lastuserstatus,
            dt.area, dt.location, dt.management, dt.phone
        ###DT###
        `,
        dt: `
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
        )
        `
    },
    usertoken: {
        id: 'usertokenid',
        sequence: 'usertokenseq',
        select: `
        SELECT
        ut.usertokenid + CASE WHEN ut.usertokenid > $maxusertokenid THEN $incusertokenid ELSE 0 END as zyxmeusertokenid,
        (SELECT ous.corpid FROM orguser ous WHERE ous.corpid = $corpid AND ous.userid = ut.userid LIMIT 1) as zyxmecorpid,
        CASE WHEN ut.userid = 42 THEN 2
        WHEN ut.userid = 51 THEN 3
        ELSE ut.userid + CASE WHEN ut.userid > $maxuserid THEN $incuserid ELSE 0 END
        END as zyxmeuserid,
        ut.description, ut.status, ut.type, ut.createdate, ut.createby, ut.changedate, ut.changeby, ut.edit,
        ut.token, ut.expirationproperty, ut.origin
        FROM usertoken ut
        `,
        select_update_where: `
        WHERE EXISTS (SELECT 1 FROM orguser ous WHERE ous.corpid = $corpid AND ous.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid) AND ous.userid = ut.userid)
        AND ut.usertokenid <= $maxid
        AND ut.changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE EXISTS (SELECT 1 FROM orguser ous WHERE ous.corpid = $corpid AND ous.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid) AND ous.userid = ut.userid)
        AND ut.usertokenid > $maxid
        ORDER BY ut.usertokenid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO usertoken (
            usertokenid,
            userid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            token, expirationproperty, origin
        )
        SELECT
            dt.zyxmeusertokenid, 
            dt.zyxmeuserid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.token, dt.expirationproperty, dt.origin
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmeusertokenid bigint,
            zyxmecorpid bigint,
			zyxmeuserid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			token text, expirationproperty character varying, origin character varying
        )
        `
    },
    userstatus: {
        id: 'userstatusid',
        sequence: 'userstatusseq',
        select: `
        SELECT
        us.userstatusid + CASE WHEN us.userstatusid > $maxuserstatusid THEN $incuserstatusid ELSE 0 END as zyxmeuserstatusid,
        (SELECT ous.corpid FROM orguser ous WHERE ous.corpid = $corpid AND ous.userid = us.userid LIMIT 1) as zyxmecorpid,
        CASE WHEN us.userid = 42 THEN 2
        WHEN us.userid = 51 THEN 3
        ELSE us.userid + CASE WHEN us.userid > $maxuserid THEN $incuserid ELSE 0 END
        END as zyxmeuserid,
        us.description, us.status, us.type, us.createdate, us.createby, us.changedate, us.changeby, us.edit
        FROM userstatus us
        `,
        select_update_where: `
        WHERE EXISTS (SELECT 1 FROM orguser ous WHERE ous.corpid = $corpid AND ous.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid) AND ous.userid = us.userid)
        AND us.userstatusid <= $maxid
        AND us.changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE EXISTS (SELECT 1 FROM orguser ous WHERE ous.corpid = $corpid AND ous.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid) AND ous.userid = us.userid)
        AND us.userstatusid > $maxid
        ORDER BY us.userstatusid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO userstatus (
            userid,
            userstatusid,
            description, status, type, createdate, createby, changedate, changeby, edit
        )
        SELECT
            dt.zyxmeuserid,
            dt.zyxmeuserstatusid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmeuserstatusid bigint,
            zyxmecorpid bigint,
			zyxmeuserid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean
        )
        `
    },
    userhistory: {
        id: 'userhistoryid',
        sequence: 'userhistoryseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        userhistoryid + CASE WHEN userhistoryid > $maxuserhistoryid THEN $incuserhistoryid ELSE 0 END as zyxmeuserhistoryid,
        CASE WHEN userid = 42 THEN 2
        WHEN userid = 51 THEN 3
        ELSE userid + CASE WHEN userid > $maxuserid THEN $incuserid ELSE 0 END
        END as zyxmeuserid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        motivetype, motivedescription, desconectedtime::text
        FROM userhistory
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND userhistoryid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND userhistoryid > $maxid
        ORDER BY userhistoryid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO userhistory (
            corpid,
            orgid,
            userid,
            userhistoryid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            motivetype, motivedescription, desconectedtime
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmeuserid,
            dt.zyxmeuserhistoryid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.motivetype, dt.motivedescription, dt.desconectedtime
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			zyxmeuserid bigint,
            zyxmeuserhistoryid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			motivetype character varying, motivedescription character varying, desconectedtime interval
        )
        `
    },
    usrnotification: {
        id: 'usrnotificationid',
        sequence: 'usrnotificationid_seq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        usrnotificationid + CASE WHEN usrnotificationid > $maxusrnotificationid THEN $incusrnotificationid ELSE 0 END as zyxmeusrnotificationid,
        usridfrom + CASE WHEN usridfrom > $maxuserid THEN $incuserid ELSE 0 END as zyxmeusridfrom,
        usrid + CASE WHEN usrid > $maxuserid THEN $incuserid ELSE 0 END as zyxmeusrid,
        description, status, type, createdate, createby, changedate, changeby, edit
        FROM usrnotification
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND usrnotificationid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND usrnotificationid > $maxid
        ORDER BY usrnotificationid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO usrnotification (
            corpid,
            orgid,
            usrnotificationid,
            usridfrom,
            usrid,
            description, status, type, createdate, createby, changedate, changeby, edit
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmeusrnotificationid,
            dt.zyxmeusridfrom,
            dt.zyxmeusrid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
            zyxmeusrnotificationid bigint,
			zyxmeusridfrom bigint, zyxmeusrid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean
        )
        `
    },
    orguser: {
        select: `
        SELECT
        ous.corpid as zyxmecorpid,
        ous.orgid as zyxmeorgid,
        CASE WHEN ous.type = 'BOT' THEN 2
        WHEN ous.type = 'HOLDING' THEN 3
        ELSE ous.userid + CASE WHEN ous.userid > $maxuserid THEN $incuserid ELSE 0 END
        END as zyxmeuserid,
        ous.roleid,
        ous.supervisor + CASE WHEN ous.supervisor > $maxuserid THEN $incuserid ELSE 0 END as supervisor,
        ous.description, ous.status, ous.type, ous.createdate, ous.createby, ous.changedate, ous.changeby, ous.edit,
        ous.bydefault, ous.labels, ous.groups, ous.channels, ous.defaultsort, ous.redirect,
        r.code as rolecode
        FROM orguser ous
        JOIN role r ON r.roleid = ous.roleid AND r.corpid = 1 AND r.orgid = 1
        `,
        select_update_where: `
        WHERE ous.corpid = $corpid
        AND ous.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND ous.createdate <= $lastdate::TIMESTAMP
        AND ous.changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE ous.corpid = $corpid
        AND ous.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        ORDER BY ous.corpid, ous.orgid, ous.userid
        LIMIT $limit
        OFFSET $offset
        `,
        insert: `
        INSERT INTO orguser (
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
            dt.zyxmeorgid,
            dt.zyxmeuserid,
            dt.roleid,
            dt.supervisor,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.bydefault, dt.labels, dt.groups,
            dt.channels,
            dt.defaultsort, dt.redirect
        ###DT###
        WHERE NOT EXISTS (SELECT 1 FROM orguser x WHERE x.corpid = dt.zyxmecorpid AND x.orgid = dt.zyxmeorgid AND x.userid = dt.zyxmeuserid)
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			zyxmeuserid bigint,
            roleid bigint, supervisor bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			bydefault boolean, labels character varying, groups character varying,
			channels character varying, defaultsort bigint, redirect character varying,
            rolecode text
        )
        `,
        post_1: `
        UPDATE orguser ous
        SET redirect = CASE
        WHEN r.code = 'ASESOR' THEN '/message_inbox'
        WHEN r.code = 'SUPERVISOR' THEN '/supervisor'
        ELSE '/usersettings' END
		FROM role r
		WHERE r.corpid = 1 AND r.orgid = 1 AND r.roleid = ous.roleid
        AND ous.corpid = $corpid`,
    }
}

const querySubcoreClassification = {
    classification: {
        id: 'classificationid',
        sequence: 'classificationseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        classificationid + CASE WHEN classificationid > $maxclassificationid THEN $incclassificationid ELSE 0 END as zyxmeclassificationid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        parent, communicationchannel, path, jobplan, usergroup, schedule
        FROM classification
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND classificationid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND classificationid > $maxid
        ORDER BY classificationid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO classification (
            corpid,
            orgid,
            classificationid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            title, parent, communicationchannel, path, jobplan,
            usergroup,
            schedule
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmeclassificationid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.description,
            dt.parent,
            dt.communicationchannel, dt.path, dt.jobplan,
            dt.usergroup,
            dt.schedule
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			zyxmeclassificationid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			classificationid bigint,
			parent bigint,
			communicationchannel character varying, path character varying, jobplan text,
			usergroup bigint, schedule text, tags character varying
        )
        `
    },
    quickreply: {
        id: 'quickreplyid',
        sequence: 'quickreplyseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        classificationid + CASE WHEN classificationid > $maxclassificationid THEN $incclassificationid ELSE 0 END as zyxmeclassificationid,
        quickreplyid + CASE WHEN quickreplyid > $maxquickreplyid THEN $incquickreplyid ELSE 0 END as zyxmequickreplyid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        quickreply
        FROM quickreply
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND quickreplyid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND quickreplyid > $maxid
        ORDER BY quickreplyid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO quickreply (
            corpid,
            orgid,
            classificationid,
            quickreplyid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            quickreply
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmeclassificationid,
            dt.zyxmequickreplyid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.quickreply
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			zyxmeclassificationid bigint,
            zyxmequickreplyid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			quickreply text
        )
        `
    },
}

const querySubcorePerson = {
    person: {
        id: 'personid',
        sequence: 'personseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        personid + CASE WHEN personid > $maxpersonid THEN $incpersonid ELSE 0 END as zyxmepersonid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        groups, name, referringperson, NULLIF(referringpersonid, 0), persontype, personstatus,
        phone, email, alternativephone, alternativeemail,
        firstcontact, lastcontact,
        lastcommunicationchannelid + CASE WHEN lastcommunicationchannelid > $maxcommunicationchannelid THEN $inccommunicationchannelid ELSE 0 END as lastcommunicationchannelid,
        documenttype, documentnumber,
        firstname, lastname, imageurldef, sex, gender, birthday, civilstatus, occupation, educationlevel,
        termsandconditions, installments, feeamount, approvedamount, evaluationstatus,
        lastdateevaluation, lastdatestatus, daysfornextevaluation,
        address, addressreference, clientnumber, mailflag, ecommerceaccounts, salary,
        country, region, district, latitude, longitude, province, contact, usercall, geographicalarea, age
        FROM person
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND personid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND personid > $maxid
        ORDER BY personid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO person (
            corpid,
            orgid,
            personid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            groups, name, referringperson,
            referringpersonid,
            persontype, personstatus,
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
            dt.zyxmeorgid,
            dt.zyxmepersonid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.groups, dt.name, dt.referringperson,
            dt.referringpersonid,
            dt.persontype, dt.personstatus,
            dt.phone, dt.email, dt.alternativephone, dt.alternativeemail,
            dt.firstcontact, dt.lastcontact,
            dt.lastcommunicationchannelid,
            dt.documenttype, dt.documentnumber,
            dt.firstname, dt.lastname, dt.imageurldef, dt.sex, dt.gender, dt.birthday, dt.civilstatus, dt.occupation, dt.educationlevel,
            dt.termsandconditions, dt.installments, dt.feeamount, dt.approvedamount, dt.evaluationstatus,
            dt.lastdateevaluation, dt.lastdatestatus, dt.daysfornextevaluation,
            dt.address, dt.addressreference, dt.clientnumber, dt.mailflag, dt.ecommerceaccounts, dt.salary,
            dt.country, dt.region, dt.district, dt.latitude, dt.longitude, dt.province, dt.contact, dt.usercall, dt.geographicalarea, dt.age
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
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
        )
        `
    },
    personaddinfo: {
        id: 'personaddinfoid',
        sequence: 'personaddinfoseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        personid + CASE WHEN personid > $maxpersonid THEN $incpersonid ELSE 0 END as zyxmepersonid,
        personaddinfoid + CASE WHEN personaddinfoid > $maxpersonaddinfoid THEN $incpersonaddinfoid ELSE 0 END as zyxmepersonaddinfoid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        addinfo
        FROM personaddinfo
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND personaddinfoid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND personaddinfoid > $maxid
        ORDER BY personaddinfoid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO personaddinfo (
            corpid,
            orgid,
            personid,
            personaddinfoid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            addinfo
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmepersonid,
            dt.zyxmepersonaddinfoid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.addinfo
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			zyxmepersonid bigint,
            zyxmepersonaddinfoid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			addinfo text
        )
        `
    },
    personcommunicationchannel: {
        select: `
        SELECT
        pcc.corpid as zyxmecorpid,
        pcc.orgid as zyxmeorgid,
        pcc.personid + CASE WHEN pcc.personid > $maxpersonid THEN $incpersonid ELSE 0 END as zyxmepersonid,
        pcc.personcommunicationchannel,
        pcc.description, pcc.status, pcc.type, pcc.createdate, pcc.createby, pcc.changedate, pcc.changeby, pcc.edit,
        pcc.imageurl, pcc.personcommunicationchannelowner, pcc.displayname, pcc.pendingsurvey, pcc.surveycontext, pcc.locked, pcc.lastusergroup
        FROM personcommunicationchannel pcc
        JOIN person pe ON pe.corpid = pcc.corpid AND pe.orgid = pcc.orgid AND pe.personid = pcc.personid
        `,
        select_update_where: `
        WHERE pcc.corpid = $corpid
        AND pe.corpid = $corpid
        AND pcc.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND pe.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND pcc.createdate <= $lastdate::TIMESTAMP
        AND pcc.changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE pcc.corpid = $corpid
        AND pe.corpid = $corpid
        AND pcc.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND pe.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND pcc.createdate >= $backupdate::TIMESTAMP
        ORDER BY pcc.personid
        LIMIT $limit
        OFFSET $offset
        `,
        insert: `
        INSERT INTO personcommunicationchannel (
            corpid,
            orgid,
            personid,
            personcommunicationchannel,
            description, status, type, createdate, createby, changedate, changeby, edit,
            imageurl, personcommunicationchannelowner, displayname, pendingsurvey, surveycontext, "locked", lastusergroup
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmepersonid,
            dt.personcommunicationchannel,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.imageurl, dt.personcommunicationchannelowner, dt.displayname, dt.pendingsurvey, dt.surveycontext, dt.locked, dt.lastusergroup
        ###DT###
        WHERE NOT EXISTS (SELECT 1 FROM personcommunicationchannel x WHERE x.corpid = dt.zyxmecorpid AND x.orgid = dt.zyxmeorgid AND x.personid = dt.zyxmepersonid AND x.personcommunicationchannel = dt.personcommunicationchannel)
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			zyxmepersonid bigint,
			personcommunicationchannel character varying,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			imageurl character varying, personcommunicationchannelowner character varying, displayname character varying,
			pendingsurvey boolean, surveycontext text, locked boolean, lastusergroup character varying
        )
        `
    },
}

const querySubcoreConversation = {
    post: {
        id: 'postid',
        sequence: 'postseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        communicationchannelid + CASE WHEN communicationchannelid > $maxcommunicationchannelid THEN $inccommunicationchannelid ELSE 0 END as zyxmecommunicationchannelid,
        personid + CASE WHEN personid > $maxpersonid THEN $incpersonid ELSE 0 END as zyxmepersonid,
        postid + CASE WHEN postid > $maxpostid THEN $incpostid ELSE 0 END as zyxmepostid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        postexternalid, message, content, postexternalparentid, commentexternalid
        FROM post
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND postid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND postid > $maxid
        ORDER BY postid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO post (
            corpid,
            orgid,
            communicationchannelid,
            personid,
            postid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            postexternalid, message, content, postexternalparentid, commentexternalid
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmecommunicationchannelid,
            dt.zyxmepersonid,
            dt.zyxmepostid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.postexternalid, dt.message, dt.content, dt.postexternalparentid, dt.commentexternalid
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			zyxmecommunicationchannelid bigint,
			zyxmepersonid bigint,
            zyxmepostid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			postexternalid character varying, message text, content text,
			postexternalparentid character varying, commentexternalid character varying
        )
        `
    },
    pccstatus: {
        id: 'pccstatusid',
        sequence: 'pccstatusseq',
        select: `
        SELECT
        pcc.corpid as zyxmecorpid,
        pcc.orgid as zyxmeorgid,
        pcc.communicationchannelid + CASE WHEN pcc.communicationchannelid > $maxcommunicationchannelid THEN $inccommunicationchannelid ELSE 0 END as zyxmecommunicationchannelid,
        pcc.personcommunicationchannel,
        pcc.pccstatusid + CASE WHEN pcc.pccstatusid > $maxpccstatusid THEN $incpccstatusid ELSE 0 END as zyxmepccstatusid,
        pcc.description, pcc.status, pcc.type, pcc.createdate, pcc.createby, pcc.changedate, pcc.changeby, pcc.edit
        FROM pccstatus pcc
        `,
        select_update_where: `
        WHERE pcc.corpid = $corpid
        AND pcc.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND pcc.pccstatusid <= $maxid
        AND pcc.changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE pcc.corpid = $corpid
        AND pcc.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND pcc.pccstatusid > $maxid
        ORDER BY pcc.pccstatusid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO pccstatus (
            corpid,
            orgid,
            communicationchannelid,
            personcommunicationchannel,
            pccstatusid,
            description, status, type, createdate, createby, changedate, changeby, edit
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmecommunicationchannelid,
            dt.personcommunicationchannel,
            dt.zyxmepccstatusid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			zyxmecommunicationchannelid bigint,
			personcommunicationchannel character varying,
            zyxmepccstatusid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean
        )
        `
    },
    conversation: {
        id: 'conversationid',
        sequence: 'conversationseq',
        select: `
        SELECT
        co.corpid as zyxmecorpid,
        co.orgid as zyxmeorgid,
        co.personid + CASE WHEN co.personid > $maxpersonid THEN $incpersonid ELSE 0 END as zyxmepersonid,
        co.personcommunicationchannel,
        co.communicationchannelid + CASE WHEN co.communicationchannelid > $maxcommunicationchannelid THEN $inccommunicationchannelid ELSE 0 END as zyxmecommunicationchannelid,
        co.conversationid + CASE WHEN co.conversationid > $maxconversationid THEN $incconversationid ELSE 0 END as zyxmeconversationid,
        co.description, co.status, co.type, co.createdate, co.createby, co.changedate, co.changeby, co.edit,
        co.firstconversationdate, co.lastconversationdate,
        CASE WHEN co.firstuserid = 42 THEN 2
        WHEN co.firstuserid = 51 THEN 3
        ELSE co.firstuserid + CASE WHEN co.firstuserid > $maxuserid THEN $incuserid ELSE 0 END
        END firstuserid,
        CASE WHEN co.lastuserid = 42 THEN 2
        WHEN co.lastuserid = 51 THEN 3
        ELSE co.lastuserid + CASE WHEN co.lastuserid > $maxuserid THEN $incuserid ELSE 0 END
        END lastuserid,
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
        `,
        select_update_where: `
        WHERE co.corpid = $corpid
        AND co.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND co.conversationid <= $maxid
        AND co.finishdate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE co.corpid = $corpid
        AND co.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND co.conversationid > $maxid
        ORDER BY co.conversationid ASC
        LIMIT $limit
        `,
        insert: `
        INSERT INTO conversation (
            corpid,
            orgid,
            personid,
            personcommunicationchannel,
            communicationchannelid,
            conversationid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            firstconversationdate, lastconversationdate,
            firstuserid, lastuserid,
            firstreplytime, averagereplytime, userfirstreplytime, useraveragereplytime,
            ticketnum,
            startdate, finishdate, totalduration, realduration, totalpauseduration, personaveragereplytime,
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
            dt.zyxmeorgid,
            COALESCE(dt.zyxmepersonid, 0),
            dt.personcommunicationchannel,
            dt.zyxmecommunicationchannelid,
            dt.zyxmeconversationid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.firstconversationdate, dt.lastconversationdate,
            dt.firstuserid,
            dt.lastuserid,
            dt.firstreplytime, dt.averagereplytime, dt.userfirstreplytime, dt.useraveragereplytime,
            LPAD(nextval(CONCAT('ticketnum',dt.zyxmeorgid,'seq'))::text,7,'0'),
            dt.startdate, dt.finishdate, dt.totalduration, dt.realduration, dt.totalpauseduration, dt.personaveragereplytime,
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
            0, 0, 0, 0,
            0, 0, 0, 0,
            dt.handoffafteransweruser, dt.lastseendate, dt.closecomment
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
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
        post_1: `SELECT ufn_ticketnum_ins(orgid)
        FROM org
        WHERE zyxmecorpid = $corpid
        AND zyxmeorgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)`
    },
    conversationclassification: {
        select: `
        SELECT
        co.corpid as zyxmecorpid,
        co.orgid as zyxmeorgid,
        co.personid + CASE WHEN co.personid > $maxpersonid THEN $incpersonid ELSE 0 END as zyxmepersonid,
        co.personcommunicationchannel,
        co.conversationid + CASE WHEN co.conversationid > $maxconversationid THEN $incconversationid ELSE 0 END as zyxmeconversationid,
        co.communicationchannelid + CASE WHEN co.communicationchannelid > $maxcommunicationchannelid THEN $inccommunicationchannelid ELSE 0 END as zyxmecommunicationchannelid,
        co.classificationid + CASE WHEN co.classificationid > $maxclassificationid THEN $incclassificationid ELSE 0 END as zyxmeclassificationid,
        co.status, co.createdate, co.createby, co.changedate, co.changeby, co.edit,
        co.jobplan
        FROM conversationclassification co
        `,
        select_insert_where: `
        WHERE co.corpid = $corpid
        AND co.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        ORDER BY co.conversationid
        LIMIT $limit
        OFFSET $offset
        `,
        insert: `
        INSERT INTO conversationclassification (
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
            dt.zyxmeorgid,
            COALESCE(dt.zyxmepersonid, 0),
            dt.personcommunicationchannel,
            COALESCE(dt.zyxmeconversationid,0),
            dt.zyxmecommunicationchannelid,
            dt.zyxmeclassificationid,
            dt.status, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.jobplan
        ###DT###
        WHERE NOT EXISTS (SELECT 1 FROM conversationclassification x WHERE x.corpid = dt.zyxmecorpid AND x.orgid = dt.zyxmeorgid AND x.conversationid = dt.zyxmeconversationid AND x.classificationid = dt.zyxmeclassificationid)
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
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
        )
        `
    },
    conversationnote: {
        id: 'conversationnoteid',
        sequence: 'conversationnoteseq',
        select: `
        SELECT
        co.corpid as zyxmecorpid,
        co.orgid as zyxmeorgid,
        co.personid + CASE WHEN co.personid > $maxpersonid THEN $incpersonid ELSE 0 END as zyxmepersonid,
        co.personcommunicationchannel,
        co.communicationchannelid + CASE WHEN co.communicationchannelid > $maxcommunicationchannelid THEN $inccommunicationchannelid ELSE 0 END as zyxmecommunicationchannelid,
        co.conversationid + CASE WHEN co.conversationid > $maxconversationid THEN $incconversationid ELSE 0 END as zyxmeconversationid,
        co.conversationnoteid + CASE WHEN co.conversationnoteid > $maxconversationnoteid THEN $incconversationnoteid ELSE 0 END as zyxmeconversationnoteid,
        co.description, co.status, co.type, co.createdate, co.createby, co.changedate, co.changeby, co.edit,
        co.addpersonnote, co.note
        FROM conversationnote co
        `,
        select_update_where: `
        WHERE co.corpid = $corpid
        AND co.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND co.conversationnoteid <= $maxid
        AND co.changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE co.corpid = $corpid
        AND co.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND co.conversationnoteid > $maxid
        ORDER BY co.conversationnoteid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO conversationnote (
            corpid,
            orgid,
            personid,
            personcommunicationchannel,
            communicationchannelid,
            conversationid,
            conversationnoteid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            addpersonnote, note
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            COALESCE(dt.zyxmepersonid, 0),
            dt.personcommunicationchannel,
            dt.zyxmecommunicationchannelid,
            COALESCE(dt.zyxmeconversationid, 0),
            dt.zyxmeconversationnoteid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.addpersonnote, dt.note
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			zyxmepersonid bigint,
			personcommunicationchannel character varying,
			zyxmecommunicationchannelid bigint,
			zyxmeconversationid bigint,
            zyxmeconversationnoteid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			addpersonnote boolean, note text
        )
        `
    },
    conversationpause: {
        id: 'conversationpauseid',
        sequence: 'conversationpauseseq',
        select: `
        SELECT
        co.corpid as zyxmecorpid,
        co.orgid as zyxmeorgid,
        co.personid + CASE WHEN co.personid > $maxpersonid THEN $incpersonid ELSE 0 END as zyxmepersonid,
        co.personcommunicationchannel,
        co.communicationchannelid + CASE WHEN co.communicationchannelid > $maxcommunicationchannelid THEN $inccommunicationchannelid ELSE 0 END as zyxmecommunicationchannelid,
        co.conversationid + CASE WHEN co.conversationid > $maxconversationid THEN $incconversationid ELSE 0 END as zyxmeconversationid,
        co.conversationpauseid + CASE WHEN co.conversationpauseid > $maxconversationpauseid THEN $incconversationpauseid ELSE 0 END as zyxmeconversationpauseid,
        co.description, co.status, co.type, co.createdate, co.createby, co.changedate, co.changeby, co.edit,
        co.startpause, co.stoppause
        FROM conversationpause co
        `,
        select_update_where: `
        WHERE co.corpid = $corpid
        AND co.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND co.conversationpauseid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE co.corpid = $corpid
        AND co.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND co.conversationpauseid > $maxid
        ORDER BY co.conversationpauseid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO conversationpause (
            corpid,
            orgid,
            personid,
            personcommunicationchannel,
            communicationchannelid,
            conversationid,
            conversationpauseid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            startpause, stoppause
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            COALESCE(dt.zyxmepersonid, 0),
            dt.personcommunicationchannel,
            dt.zyxmecommunicationchannelid,
            COALESCE(dt.zyxmeconversationid, 0),
            dt.zyxmeconversationpauseid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.startpause, dt.stoppause
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			zyxmepersonid bigint,
			personcommunicationchannel character varying,
			zyxmecommunicationchannelid bigint,
			zyxmeconversationid bigint,
            zyxmeconversationpauseid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			startpause timestamp without time zone, stoppause timestamp without time zone
        )
        `
    },
    conversationpending: {
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        personcommunicationchannel,
        CASE WHEN userid = 42 THEN 2
        WHEN userid = 51 THEN 3
        ELSE userid + CASE WHEN userid > $maxuserid THEN $incuserid ELSE 0 END
        END as zyxmeuserid,
        conversationid + CASE WHEN conversationid > $maxconversationid THEN $incconversationid ELSE 0 END as zyxmeconversationid,
        status, communicationchannelsite, interactiontext
        FROM conversationpending
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        ORDER BY conversationid
        LIMIT $limit
        OFFSET $offset
        `,
        insert: `
        INSERT INTO conversationpending (
            corpid,
            orgid,
            personcommunicationchannel,
            userid,
            conversationid,
            status, communicationchannelsite, interactiontext
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.personcommunicationchannel,
            dt.zyxmeuserid,
            dt.zyxmeconversationid,
            dt.status, dt.communicationchannelsite, dt.interactiontext
        ###DT###
        WHERE NOT EXISTS (SELECT 1 FROM conversationpending x WHERE x.corpid = dt.zyxmecorpid AND x.orgid = dt.zyxmeorgid AND x.conversationid = dt.zyxmeconversationid)
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			personcommunicationchannel character varying,
			zyxmeuserid bigint,
            zyxmeconversationid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			communicationchannelsite character varying, interactiontext text
        )
        `
    },
    conversationstatus: {
        id: 'conversationstatusid',
        sequence: 'conversationstatusseq',
        select: `
        SELECT
        co.corpid as zyxmecorpid,
        co.orgid as zyxmeorgid,
        co.personid + CASE WHEN co.personid > $maxpersonid THEN $incpersonid ELSE 0 END as zyxmepersonid,
        co.personcommunicationchannel,
        co.communicationchannelid + CASE WHEN co.communicationchannelid > $maxcommunicationchannelid THEN $inccommunicationchannelid ELSE 0 END as zyxmecommunicationchannelid,
        co.conversationid + CASE WHEN co.conversationid > $maxconversationid THEN $incconversationid ELSE 0 END as zyxmeconversationid,
        co.conversationstatusid + CASE WHEN co.conversationstatusid > $maxconversationstatusid THEN $incconversationstatusid ELSE 0 END as zyxmeconversationstatusid,
        co.description, co.status, co.type, co.createdate, co.createby, co.changedate, co.changeby, co.edit
        FROM conversationstatus co
        `,
        select_update_where: `
        WHERE co.corpid = $corpid
        AND co.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND co.conversationstatusid <= $maxid
        AND co.changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE co.corpid = $corpid
        AND co.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND co.conversationstatusid > $maxid
        ORDER BY co.conversationstatusid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO conversationstatus (
            corpid,
            orgid,
            personid,
            personcommunicationchannel,
            communicationchannelid,
            conversationid,
            conversationstatusid,
            description, status, type, createdate, createby, changedate, changeby, edit
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            COALESCE(dt.zyxmepersonid, 0),
            dt.personcommunicationchannel,
            dt.zyxmecommunicationchannelid,
            COALESCE(dt.zyxmeconversationid, 0),
            dt.zyxmeconversationstatusid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			zyxmepersonid bigint,
			personcommunicationchannel character varying,
			zyxmecommunicationchannelid bigint,
			zyxmeconversationid bigint,
            zyxmeconversationstatusid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean
        )
        `
    },
    interaction: {
        id: 'interactionid',
        sequence: 'interactionseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        personid + CASE WHEN personid > $maxpersonid THEN $incpersonid ELSE 0 END as zyxmepersonid,
        personcommunicationchannel,
        communicationchannelid + CASE WHEN communicationchannelid > $maxcommunicationchannelid THEN $inccommunicationchannelid ELSE 0 END as zyxmecommunicationchannelid,
        conversationid + CASE WHEN conversationid > $maxconversationid THEN $incconversationid ELSE 0 END as zyxmeconversationid,
        interactionid + CASE WHEN interactionid > $maxinteractionid THEN $incinteractionid ELSE 0 END as zyxmeinteractionid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        interactiontext,
        CASE WHEN userid = 42 THEN 2
        WHEN userid = 51 THEN 3
        ELSE userid + CASE WHEN userid > $maxuserid THEN $incuserid ELSE 0 END
        END as zyxmeuserid,
        intent, intentexample, entityname, entityvalue,
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
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND interactionid > $maxid
        ORDER BY interactionid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO interaction (
            corpid,
            orgid,
            personid,
            personcommunicationchannel,
            communicationchannelid,
            conversationid,
            interactionid,
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
            dt.zyxmeorgid,
            dt.zyxmepersonid,
            dt.personcommunicationchannel,
            dt.zyxmecommunicationchannelid,
            dt.zyxmeconversationid,
            dt.zyxmeinteractionid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.interactiontext,
            dt.zyxmeuserid,
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
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			zyxmepersonid bigint,
			personcommunicationchannel character varying,
			zyxmecommunicationchannelid bigint,
			zyxmeconversationid bigint,
            zyxmeinteractionid bigint,
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
        )
        `
    },
    surveyanswered: {
        id: 'surveyansweredid',
        sequence: 'surveyansweredseq',
        select: `
        SELECT
        sa.corpid as zyxmecorpid,
        sa.orgid as zyxmeorgid,
        sa.conversationid + CASE WHEN sa.conversationid > $maxconversationid THEN $incconversationid ELSE 0 END as zyxmeconversationid,
        sa.surveyansweredid + CASE WHEN sa.surveyansweredid > $maxsurveyansweredid THEN $incsurveyansweredid ELSE 0 END as zyxmesurveyansweredid,
        sa.description, sa.status, COALESCE(split_part(pr.propertyname, 'NUMEROPREGUNTA', 1), CONCAT('QUESTION', sq.questionnumber::text)) as type, sa.createdate, sa.createby, sa.changedate, sa.changeby, sa.edit,
        sa.answer, CASE WHEN sa.answer ~ '^[0-9]+$' AND sa.answervalue = 0 THEN sa.answer::integer ELSE sa.answervalue END as answervalue, sa.comment,
        sq.question, (SELECT GREATEST(COUNT(q.a)::text, MAX(q.a[1])) FROM (SELECT regexp_matches(sq.question,'[\\d𝟏𝟐𝟑𝟒𝟓]+','g') a) q)::BIGINT scale
        FROM surveyanswered sa
        LEFT JOIN surveyquestion sq ON sq.corpid = sa.corpid AND sq.orgid = sa.orgid AND sq.surveyquestionid = sa.surveyquestionid
        LEFT JOIN property pr ON pr.corpid = sa.corpid AND pr.orgid = sa.orgid AND pr.status = 'ACTIVO'
        AND pr.propertyname ILIKE '%NUMEROPREGUNTA' AND pr.propertyname NOT IN ('FCRNUMEROPREGUNTA') AND pr.propertyvalue = sq.questionnumber::text
        `,
        select_update_where: `
        WHERE sa.corpid = $corpid
        AND sa.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND sa.surveyansweredid <= $maxid
        AND sa.changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE sa.corpid = $corpid
        AND sa.orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND sa.surveyansweredid > $maxid
        ORDER BY sa.surveyansweredid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO surveyanswered (
            corpid,
            orgid,
            conversationid,
            surveyansweredid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            answer, answervalue, comment,
            question, scale, high, medium, low, fcr
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmeconversationid,
            dt.zyxmesurveyansweredid,
            dt.description, dt.status, dt.type::CHARACTER VARYING, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.answer, dt.answervalue, dt.comment,
            dt.question, dt.scale::BIGINT,
            CASE WHEN dt.type IN ('FCR','FIX') OR dt.scale IN (2) THEN '1'
            WHEN dt.type NOT IN ('FCR','FIX') AND dt.scale IN (9,10) THEN '9,10'
            WHEN dt.type NOT IN ('FCR','FIX') AND dt.scale IN (5) THEN '4,5'
            END,
            CASE WHEN dt.scale IN (9,10) THEN '7,8'
            WHEN dt.type <> 'FCR' AND dt.scale IN (5) THEN '3'
            END,
            CASE WHEN dt.type IN ('FCR','FIX') OR dt.scale IN (2) THEN '0,2'
            WHEN dt.type NOT IN ('FCR','FIX') AND dt.scale IN (9,10) THEN '1,2,3,4,5,6'
            WHEN dt.type NOT IN ('FCR','FIX') AND dt.scale IN (5) THEN '1,2'
            END,
            CASE WHEN dt.type IN ('FCR','FIX') THEN true END
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			zyxmeconversationid bigint,
            zyxmesurveyansweredid bigint,
			description character varying, status character varying, type text,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			answer text, answervalue integer, comment text, question text, scale bigint
        )`,
        post_1: `
        UPDATE surveyanswered
        SET rank = CASE WHEN answervalue = ANY(string_to_array(low,',')::BIGINT[]) THEN 'LOW'
        WHEN answervalue = ANY(string_to_array(medium,',')::BIGINT[]) THEN 'MEDIUM'
        WHEN answervalue = ANY(string_to_array(high,',')::BIGINT[]) THEN 'HIGH'
        END
        WHERE corpid = $corpid AND rank is null`
    },
}

const querySubcoreCampaign = {
    messagetemplate: {
        oldtable: 'hsmtemplate',
        id: 'hsmtemplateid',
        newid: 'messagetemplateid',
        sequence: 'messagetemplateseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        hsmtemplateid + CASE WHEN hsmtemplateid > $maxmessagetemplateid THEN $incmessagetemplateid ELSE 0 END as zyxmemessagetemplateid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        hsmid as name, namespace, category, language,
        message as body, header, buttons
        FROM hsmtemplate
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND hsmtemplateid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND hsmtemplateid > $maxid
        ORDER BY hsmtemplateid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO messagetemplate (
            corpid,
            orgid,
            messagetemplateid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            name, namespace, category, language,
            templatetype, headerenabled, headertype, header, body,
            footerenabled, footer, buttonsenabled, buttons
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
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
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			zyxmemessagetemplateid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			name character varying, namespace character varying, category character varying, language character varying,
			header character varying, body character varying, buttons character varying
        )
        `
    },
    campaign: {
        id: 'campaignid',
        sequence: 'campaignseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        campaignid + CASE WHEN campaignid > $maxcampaignid THEN $inccampaignid ELSE 0 END as zyxmecampaignid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        title, members, startdate, enddate, repeatable, frecuency,
        message, communicationchannelid as zyxmecommunicationchannelid, hsmid as messagetemplatename, hsmnamespace as messagetemplatenamespace,
        counter, lastrundate, usergroup, subject,
        hsmtemplateid + CASE WHEN hsmtemplateid > $maxmessagetemplateid THEN $incmessagetemplateid ELSE 0 END as zyxmemessagetemplateid,
        REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(NULLIF(hsmheader,''), '\\\\+\\"', '"', 'g'),'^\\"+\\{','{','g'),'\\}\\"+$','}','g') as messagetemplateheader,
        REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(NULLIF(hsmbuttons,''), '\\\\+\\"', '"', 'g'),'^\\"+\\[','[','g'),'\\]\\"+$',']','g') as messagetemplatebuttons,
        executiontype, batchjson, taskid as zyxmetaskid, fields
        FROM campaign
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND campaignid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND campaignid > $maxid
        ORDER BY campaignid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO campaign (
            corpid,
            orgid,
            campaignid,
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
            dt.zyxmeorgid,
            dt.zyxmecampaignid,
            dt.description, dt.status, REPLACE(dt.type, 'HSMID', 'HSM'), dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.title, dt.members, dt.startdate::DATE, dt.enddate::DATE, dt.repeatable, dt.frecuency,
            dt.message,
            dt.zyxmecommunicationchannelid,
            dt.messagetemplatename, dt.messagetemplatenamespace,
            dt.counter, dt.lastrundate, dt.usergroup, dt.subject,
            dt.zyxmemessagetemplateid,
            NULLIF(dt.messagetemplateheader,'""null""')::JSONB,
            REPLACE(REPLACE(NULLIF(NULLIF(NULLIF(dt.messagetemplatebuttons,'""null""'), '[]'),''),'"value":','"payload":'),'"text":','"title":')::JSONB,
            dt.executiontype,
            NULLIF(dt.batchjson,'""null""')::JSONB,
            dt.zyxmetaskid,
            NULLIF(dt.fields,'""null""')::JSONB
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
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
        )
        `
    },
    campaignmember: {
        id: 'campaignmemberid',
        sequence: 'campaignmemberseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        campaignid + CASE WHEN campaignid > $maxcampaignid THEN $inccampaignid ELSE 0 END as zyxmecampaignid,
        personid + CASE WHEN personid > $maxpersonid THEN $incpersonid ELSE 0 END as zyxmepersonid,
        campaignmemberid + CASE WHEN campaignmemberid > $maxcampaignmemberid THEN $inccampaignmemberid ELSE 0 END as zyxmecampaignmemberid,
        status, personcommunicationchannel, type, displayname, personcommunicationchannelowner,
        field1, field2, field3, field4, field5, field6, field7, field8, field9,
        field10, field11, field12, field13, field14, field15,
        resultfromsend, batchindex
        FROM campaignmember
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND campaignmemberid > $maxid
        ORDER BY campaignmemberid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO campaignmember (
            corpid,
            orgid,
            campaignid,
            personid,
            campaignmemberid,
            status, personcommunicationchannel, type, displayname, personcommunicationchannelowner,
            field1, field2, field3, field4, field5, field6, field7, field8, field9,
            field10, field11, field12, field13, field14, field15,
            resultfromsend, batchindex
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmecampaignid,
            dt.zyxmepersonid,
            dt.zyxmecampaignmemberid,
            dt.status, dt.personcommunicationchannel, dt.type, dt.displayname, dt.personcommunicationchannelowner,
            dt.field1, dt.field2, dt.field3, dt.field4, dt.field5, dt.field6, dt.field7, dt.field8, dt.field9,
            dt.field10, dt.field11, dt.field12, dt.field13, dt.field14, dt.field15,
            dt.resultfromsend, dt.batchindex
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
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
        )
        `
    },
    campaignhistory: {
        id: 'campaignhistoryid',
        sequence: 'campaignhistoryseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        campaignid + CASE WHEN campaignid > $maxcampaignid THEN $inccampaignid ELSE 0 END as zyxmecampaignid,
        personid + CASE WHEN personid > $maxpersonid THEN $incpersonid ELSE 0 END as zyxmepersonid,
        campaignmemberid + CASE WHEN campaignmemberid > $maxcampaignmemberid THEN $inccampaignmemberid ELSE 0 END as zyxmecampaignmemberid,
        campaignhistoryid + CASE WHEN campaignhistoryid > $maxcampaignhistoryid THEN $inccampaignhistoryid ELSE 0 END as zyxmecampaignhistoryid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        success, message, rundate,
        conversationid + CASE WHEN conversationid > $maxconversationid THEN $incconversationid ELSE 0 END as zyxmeconversationid,
        attended
        FROM campaignhistory
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND campaignhistoryid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND campaignhistoryid > $maxid
        ORDER BY campaignhistoryid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO campaignhistory (
            corpid,
            orgid,
            campaignid,
            personid,
            campaignmemberid,
            campaignhistoryid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            success, message, rundate,
            conversationid,
            attended
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmecampaignid,
            COALESCE(dt.zyxmepersonid, 0),
            COALESCE(dt.zyxmecampaignmemberid, 0),
            dt.zyxmecampaignhistoryid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.success, dt.message, dt.rundate,
            COALESCE(dt.zyxmeconversationid, 0),
            dt.attended
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			zyxmecampaignid bigint,
			zyxmepersonid bigint,
			zyxmecampaignmemberid bigint,
            zyxmecampaignhistoryid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			success boolean, message text, rundate timestamp without time zone,
			zyxmeconversationid bigint,
			attended boolean
        )
        `
    },
}

const querySubcoreOthers = {
    taskscheduler: {
        id: 'taskschedulerid',
        sequence: 'taskscheduler_taskschedulerid_seq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        taskschedulerid + CASE WHEN taskschedulerid > $maxtaskschedulerid THEN $inctaskschedulerid ELSE 0 END as zyxmetaskschedulerid,
        tasktype, taskbody, repeatflag, repeatmode, repeatinterval, completed,
        datetimestart, datetimeend, datetimeoriginalstart, datetimelastrun, taskprocessedids
        FROM taskscheduler
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND taskschedulerid > $maxid
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
        `,
        insert: `
        INSERT INTO taskscheduler (
            corpid,
            orgid,
            taskschedulerid,
            tasktype,
            taskbody,
            repeatflag, repeatmode, repeatinterval, completed,
            datetimestart, datetimeend, datetimeoriginalstart, datetimelastrun, taskprocessedids
        )
        OVERRIDING SYSTEM VALUE
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmetaskschedulerid,
            dt.tasktype::TEXT,
            dt.taskbody,
            dt.repeatflag, dt.repeatmode, dt.repeatinterval, dt.completed,
            dt.datetimestart, dt.datetimeend, dt.datetimeoriginalstart, dt.datetimelastrun, dt.taskprocessedids
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
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
        )
        `
    },
    blockversion: {
        id: 'chatblockversionid',
        sequence: 'blockversionseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        chatblockversionid + CASE WHEN chatblockversionid > $maxchatblockversionid THEN $incchatblockversionid ELSE 0 END as zyxmechatblockversionid,
        communicationchannelid,
        chatblockid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        title, defaultgroupid, defaultblockid, firstblockid, aiblockid, blockgroup, variablecustom,
        color, icontype, tag
        FROM blockversion
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND chatblockversionid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND chatblockversionid > $maxid
        ORDER BY chatblockversionid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO blockversion (
            corpid,
            orgid,
            chatblockversionid,
            communicationchannelid,
            chatblockid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            title, defaultgroupid, defaultblockid, firstblockid, aiblockid, blockgroup, variablecustom,
            color, icontype, tag
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmechatblockversionid,
            dt.communicationchannelid,
            dt.chatblockid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.title, dt.defaultgroupid, dt.defaultblockid, dt.firstblockid, dt.aiblockid, dt.blockgroup, dt.variablecustom,
            dt.color, dt.icontype, dt.tag
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			zyxmechatblockversionid bigint,
			communicationchannelid character varying,
			chatblockid text,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			title text, defaultgroupid text, defaultblockid text, firstblockid text, aiblockid text, blockgroup text, variablecustom text,
			color character varying, icontype character varying, tag text
        )
        `
    },
    block: {
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        communicationchannelid,
        chatblockid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        title, defaultgroupid, defaultblockid, firstblockid, aiblockid, blockgroup, variablecustom,
        color, icontype, tag, chatblockversionid as zyxmechatblockversionid
        FROM block
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND createdate <= $lastdate::TIMESTAMP
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        ORDER BY ctid
        LIMIT $limit
        OFFSET $offset
        `,
        insert: `
        INSERT INTO block (
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
            dt.zyxmeorgid,
            dt.communicationchannelid,
            dt.chatblockid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.title, dt.defaultgroupid, dt.defaultblockid, dt.firstblockid, dt.aiblockid, dt.blockgroup, dt.variablecustom,
            dt.color, dt.icontype, dt.tag,
            dt.zyxmechatblockversionid
        ###DT###
        WHERE NOT EXISTS (SELECT 1 FROM block x WHERE x.corpid = dt.zyxmecorpid AND x.orgid = dt.zyxmeorgid AND x.chatblockid = dt.chatblockid)
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			communicationchannelid character varying,
			chatblockid text,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			title text, defaultgroupid text, defaultblockid text, firstblockid text, aiblockid text, blockgroup text, variablecustom text,
			color character varying, icontype character varying, tag text, zyxmechatblockversionid bigint
        )
        `
    },
    tablevariableconfiguration: {
        id: 'tablevariableconfigurationid',
        sequence: 'tablevariableconfigurationseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        tablevariableconfigurationid + CASE WHEN tablevariableconfigurationid > $maxtablevariableconfigurationid THEN $inctablevariableconfigurationid ELSE 0 END as zyxmetablevariableconfigurationid,
        chatblockid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        variable, fontcolor, fontbold, priority, visible
        FROM tablevariableconfiguration
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND tablevariableconfigurationid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND tablevariableconfigurationid > $maxid
        ORDER BY tablevariableconfigurationid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO tablevariableconfiguration (
            corpid,
            orgid,
            tablevariableconfigurationid,
            chatblockid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            variable, fontcolor, fontbold, priority, visible
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmetablevariableconfigurationid,
            dt.chatblockid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.variable, dt.fontcolor, dt.fontbold, dt.priority, dt.visible
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
            zyxmetablevariableconfigurationid bigint,
			chatblockid text,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			variable character varying, fontcolor character varying, fontbold boolean, priority bigint, visible boolean
		)
        `
    },
    intelligentmodels: {
        id: 'intelligentmodelsid',
        sequence: 'inteligentseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        intelligentmodelsid + CASE WHEN intelligentmodelsid > $maxintelligentmodelsid THEN $incintelligentmodelsid ELSE 0 END as zyxmeintelligentmodelsid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        endpoint, modelid, apikey, provider
        FROM intelligentmodels
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND intelligentmodelsid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND intelligentmodelsid > $maxid
        ORDER BY intelligentmodelsid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO intelligentmodels (
            corpid,
            orgid,
            intelligentmodelsid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            endpoint, modelid, apikey, provider
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmeintelligentmodelsid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.endpoint, dt.modelid, dt.apikey, dt.provider
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
            zyxmeintelligentmodelsid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			endpoint text, modelid text, apikey character varying, provider character varying
        )
        `
    },
    intelligentmodelsconfiguration: {
        id: 'intelligentmodelsconfigurationid',
        sequence: 'intelligentmodelsconfigurationseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        communicationchannelid as zyxmecommunicationchannelid,
        intelligentmodelsconfigurationid + CASE WHEN intelligentmodelsconfigurationid > $maxintelligentmodelsconfigurationid THEN $incintelligentmodelsconfigurationid ELSE 0 END as zyxmeintelligentmodelsconfigurationid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        parameters, channels, color, icontype
        FROM intelligentmodelsconfiguration
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND intelligentmodelsconfigurationid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND intelligentmodelsconfigurationid > $maxid
        ORDER BY intelligentmodelsconfigurationid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO intelligentmodelsconfiguration (
            corpid,
            orgid,
            intelligentmodelsconfigurationid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            parameters, channels, color, icontype
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmeintelligentmodelsconfigurationid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.parameters,
            dt.channels,
            dt.color, dt.icontype
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			zyxmecommunicationchannelid bigint,
            zyxmeintelligentmodelsconfigurationid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			parameters text, channels character varying, color character varying, icontype character varying
        )
        `
    },
    payment: {
        id: 'paymentid',
        sequence: 'paymentseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        conversationid + CASE WHEN conversationid > $maxconversationid THEN $incconversationid ELSE 0 END as zyxmeconversationid,
        personid + CASE WHEN personid > $maxpersonid THEN $incpersonid ELSE 0 END as zyxmepersonid,
        paymentid + CASE WHEN paymentid > $maxpaymentid THEN $incpaymentid ELSE 0 END as zyxmepaymentid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        pocketbook, tokenid, title, amount, currency, email, capture,
        tokenjson, chargejson, refundjson, customerjson, cardjson, planjson, subscriptionjson
        FROM payment
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND paymentid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND paymentid > $maxid
        ORDER BY paymentid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO payment (
            corpid,
            orgid,
            conversationid,
            personid,
            paymentid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            pocketbook, tokenid, title, amount, currency, email, capture,
            tokenjson, chargejson, refundjson, customerjson, cardjson, planjson, subscriptionjson
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmeconversationid,
            dt.zyxmepersonid,
            dt.zyxmepaymentid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.pocketbook, dt.tokenid, dt.title, dt.amount, dt.currency, dt.email, dt.capture,
            dt.tokenjson, dt.chargejson, dt.refundjson, dt.customerjson, dt.cardjson, dt.planjson, dt.subscriptionjson
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			zyxmeconversationid bigint,
			zyxmepersonid bigint,
            zyxmepaymentid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			pocketbook text, tokenid text, title text, amount numeric, currency text, email text, capture boolean,
			tokenjson text, chargejson text, refundjson text, customerjson text, cardjson text, planjson text, subscriptionjson text
        )
        `
    },
    productivity: {
        id: 'productivityid',
        sequence: 'productivityseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        CASE WHEN userid = 42 THEN 2
        WHEN userid = 51 THEN 3
        ELSE userid + CASE WHEN userid > $maxuserid THEN $incuserid ELSE 0 END
        END as zyxmeuserid,
        productivityid + CASE WHEN productivityid > $maxproductivityid THEN $incproductivityid ELSE 0 END as zyxmeproductivityid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        fullname, communicationchannel, communicationchanneldesc,
        datestr, hours, hoursrange,
        worktime::text, busytimewithinwork::text, freetimewithinwork::text, busytimeoutsidework::text,
        onlinetime::text, idletime::text, qtytickets, qtyconnection, qtydisconnection
        FROM productivity
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND productivityid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND productivityid > $maxid
        ORDER BY productivityid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO productivity (
            corpid,
            orgid,
            userid,
            productivityid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            fullname, communicationchannel, communicationchanneldesc,
            datestr, hours, hoursrange,
            worktime, busytimewithinwork, freetimewithinwork, busytimeoutsidework,
            onlinetime, idletime, qtytickets, qtyconnection, qtydisconnection
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmeuserid,
            dt.zyxmeproductivityid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.fullname,
            dt.communicationchannel,
            dt.communicationchanneldesc,
            dt.datestr::DATE, dt.hours, dt.hoursrange,
            dt.worktime, dt.busytimewithinwork, dt.freetimewithinwork, dt.busytimeoutsidework,
            dt.onlinetime, dt.idletime, dt.qtytickets, dt.qtyconnection, dt.qtydisconnection
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			zyxmeuserid bigint,
            zyxmeproductivityid bigint,
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
        )
        `
    },
}

const queryExtras = {
    blacklist: {
        id: 'blacklistid',
        sequence: 'blacklistseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        blacklistid + CASE WHEN blacklistid > $maxblacklistid THEN $incblacklistid ELSE 0 END as zyxmeblacklistid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        phone
        FROM blacklist
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND blacklistid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND blacklistid > $maxid
        ORDER BY blacklistid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO blacklist (
            corpid,
            orgid,
            blacklistid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            phone
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmeblacklistid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.phone
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
			zyxmeblacklistid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			phone character varying
        )
        `
    },
    hsmhistory: {
        id: 'hsmhistoryid',
        sequence: 'hsmhistoryseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        hsmhistoryid + CASE WHEN hsmhistoryid > $maxhsmhistoryid THEN $inchsmhistoryid ELSE 0 END as zyxmehsmhistoryid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        config, success, message, groupname, transactionid, externalid
        FROM hsmhistory
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND hsmhistoryid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND hsmhistoryid > $maxid
        ORDER BY hsmhistoryid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO hsmhistory (
            corpid,
            orgid,
            hsmhistoryid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            config,
            success, message, groupname, transactionid, externalid
        )
        SELECT 
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmehsmhistoryid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.config,
            dt.success, dt.message, dt.groupname, dt.transactionid, dt.externalid
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
            zyxmehsmhistoryid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			config text, success boolean, message text, groupname character varying, transactionid character varying, externalid character varying
        )
        `
    },
    inappropriatewords: {
        id: 'inappropriatewordsid',
        sequence: 'inappropriatewords_inappropriatewordsid_seq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        inappropriatewordsid + CASE WHEN inappropriatewordsid > $maxinappropriatewordsid THEN $incinappropriatewordsid ELSE 0 END as zyxmeinappropriatewordsid,
        description, status, type, createdate, createby, changedate, changeby, edit
        FROM inappropriatewords
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND inappropriatewordsid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND inappropriatewordsid > $maxid
        ORDER BY inappropriatewordsid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO inappropriatewords (
            corpid,
            orgid,
            inappropriatewordsid,
            description, status, type, createdate, createby, changedate, changeby, edit
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmeinappropriatewordsid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
            zyxmeinappropriatewordsid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean
        )
        `
    },
    label: {
        id: 'labelid',
        sequence: 'labelseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        labelid + CASE WHEN labelid > $maxlabelid THEN $inclabelid ELSE 0 END as zyxmelabelid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        color, intent, tags
        FROM label
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND labelid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND labelid > $maxid
        ORDER BY labelid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO label (
            corpid,
            orgid,
            labelid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            color, intent, tags
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmelabelid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.color, dt.intent, dt.tags
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
            zyxmelabelid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			color character varying, intent text, tags text
        )
        `
    },
    location: {
        id: 'locationid',
        sequence: 'locationseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        locationid + CASE WHEN locationid > $maxlocationid THEN $inclocationid ELSE 0 END as zyxmelocationid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        name, address, district, city, country, schedule, phone, alternativephone, email, alternativeemail,
        latitude, longitude, googleurl
        FROM location
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND locationid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND locationid > $maxid
        ORDER BY locationid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO location (
            corpid,
            orgid,
            locationid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            name, address, district, city, country, schedule, phone, alternativephone, email, alternativeemail,
            latitude, longitude, googleurl
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmelocationid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.name, dt.address, dt.district, dt.city, dt.country, dt.schedule, dt.phone, dt.alternativephone, dt.email, dt.alternativeemail,
            dt.latitude, dt.longitude, dt.googleurl
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
            zyxmelocationid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			name character varying, address character varying, district character varying, city character varying, country character varying,
			schedule character varying, phone character varying, alternativephone character varying, email character varying, alternativeemail character varying,
			latitude double precision, longitude double precision, googleurl character varying
        )
        `
    },
    reporttemplate: {
        id: 'reporttemplateid',
        sequence: 'reporttemplateseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        reporttemplateid + CASE WHEN reporttemplateid > $maxreporttemplateid THEN $increporttemplateid ELSE 0 END as zyxmereporttemplateid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        communicationchannelid, columnjson, filterjson
        FROM reporttemplate
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND reporttemplateid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND reporttemplateid > $maxid
        ORDER BY reporttemplateid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO reporttemplate (
            corpid,
            orgid,
            reporttemplateid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            communicationchannelid, columnjson, filterjson
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmereporttemplateid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.communicationchannelid,
            dt.columnjson, dt.filterjson
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
            zyxmereporttemplateid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			communicationchannelid text,
			columnjson text, filterjson text
        )
        `
    },
    sla: {
        id: 'slaid',
        sequence: 'slaseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        slaid + CASE WHEN slaid > $maxslaid THEN $incslaid ELSE 0 END as zyxmeslaid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        company, communicationchannelid, usergroup,
        totaltmo::text, totaltmopercentmax, totaltmopercentmin,
        usertmo::text, usertmopercentmax, usertmopercentmin,
        tme::text, tmepercentmax, tmepercentmin,
        usertme::text, usertmepercentmax, usertmepercentmin,
        productivitybyhour, totaltmomin::text, usertmomin::text, tmemin::text, usertmemin::text, tmoclosedby, tmeclosedby
        FROM sla
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND slaid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND slaid > $maxid
        ORDER BY slaid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO sla (
            corpid,
            orgid,
            slaid,
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
            dt.zyxmeorgid,
            dt.zyxmeslaid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.company,
            dt.communicationchannelid,
            dt.usergroup,
            dt.totaltmo, dt.totaltmopercentmax, dt.totaltmopercentmin,
            dt.usertmo, dt.usertmopercentmax, dt.usertmopercentmin,
            dt.tme, dt.tmepercentmax, dt.tmepercentmin,
            dt.usertme, dt.usertmepercentmax, dt.usertmepercentmin,
            dt.productivitybyhour, dt.totaltmomin, dt.usertmomin, dt.tmemin, dt.usertmemin, dt.tmoclosedby, dt.tmeclosedby
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
            zyxmeslaid bigint,
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
        )
        `
    },
    whitelist: {
        id: 'whitelistid',
        sequence: 'whitelistseq',
        select: `
        SELECT
        corpid as zyxmecorpid,
        orgid as zyxmeorgid,
        whitelistid + CASE WHEN whitelistid > $maxwhitelistid THEN $incwhitelistid ELSE 0 END as zyxmewhitelistid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        phone, asesorname, documenttype, documentnumber, usergroup
        FROM whitelist
        `,
        select_update_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND whitelistid <= $maxid
        AND changedate > $lastdate::TIMESTAMP
        `,
        select_insert_where: `
        WHERE corpid = $corpid
        AND orgid IN (SELECT org.orgid FROM org WHERE org.corpid = $corpid)
        AND whitelistid > $maxid
        ORDER BY whitelistid
        LIMIT $limit
        `,
        insert: `
        INSERT INTO whitelist (
            corpid,
            orgid,
            whitelistid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            phone, asesorname, documenttype, documentnumber, usergroup
        )
        SELECT
            dt.zyxmecorpid,
            dt.zyxmeorgid,
            dt.zyxmewhitelistid,
            dt.description, dt.status, dt.type, dt.createdate, dt.createby, dt.changedate, dt.changeby, dt.edit,
            dt.phone, dt.asesorname, dt.documenttype, dt.documentnumber, dt.usergroup
        ###DT###
        `,
        dt: `
        FROM json_populate_recordset(null::record, $datatable)
        AS dt (
            zyxmecorpid bigint,
            zyxmeorgid bigint,
            zyxmewhitelistid bigint,
			description character varying, status character varying, type character varying,
			createdate timestamp without time zone, createby character varying,
			changedate timestamp without time zone, changeby character varying,
			edit boolean,
			phone character varying, asesorname character varying, documenttype character varying, documentnumber character varying, usergroup character varying
        )
        `
    }
}

const queryCorpSel = `SELECT corpid, description FROM corp WHERE status = 'ACTIVO'`;

exports.executeMigration = async (req, res) => {
    let { corpid, modules, backupdate } = req.body;
    if (!!corpid && !!modules) {
        const corpidBind = {
            corpid: corpid,
            backupdate: backupdate
        }
        try {
            idsResult = await laraigoQuery(`SELECT idsjson FROM migrationhelper`);
            if (idsResult instanceof Array && idsResult.length > 0) {
                let idsJson = idsResult?.[0]?.idsjson;
                corpidBind['idsjson'] = idsJson;
                for (const kid of Object.keys(idsJson)) {
                    corpidBind[`max${kid}`] = idsJson[kid];
                    corpidBind[`inc${kid}`] = 0;
                }
            }
        } catch (error) {
            console.log(error);
        }
        let queryResult = { core: {}, subcore: {}, extras: {} };
        await zyxmeQuery(`CREATE TABLE IF NOT EXISTS migration (corpid bigint, run boolean, params jsonb, result jsonb, startdate timestamp without time zone, enddate timestamp without time zone)`);
        let migrationstatus = await zyxmeQuery(`SELECT corpid FROM migration WHERE corpid = $corpid`, bind = { corpid: corpid });
        if (migrationstatus.length > 0) {
            await zyxmeQuery(`UPDATE migration SET run = $run, params = $params, startdate = NOW() WHERE corpid = $corpid`, bind = {
                corpid: corpid,
                run: true,
                params: {
                    ...req.body,
                    corpidBind: corpidBind
                }
            });
        }
        else {
            await zyxmeQuery(`INSERT INTO migration (corpid, run, params, startdate) SELECT $corpid, $run, $params, NOW()`, bind = {
                corpid: corpid,
                run: true,
                params: {
                    ...req.body,
                    corpidBind: corpidBind
                }
            });
        }
        try {
            if (modules.includes('core')) {
                queryResult.core = await migrationExecute(corpidBind, queryCore);
            }
            if (modules.includes('subcore')) {
                queryResult.subcore.classification = await migrationExecute(corpidBind, querySubcoreClassification);
                queryResult.subcore.person = await migrationExecute(corpidBind, querySubcorePerson);
                queryResult.subcore.conversation = await migrationExecute(corpidBind, querySubcoreConversation);
                queryResult.subcore.campaign = await migrationExecute(corpidBind, querySubcoreCampaign);
                queryResult.subcore.others = await migrationExecute(corpidBind, querySubcoreOthers);
            }
            if (!modules.includes('subcore') && modules.includes('subcore.classification')) {
                queryResult.subcore.classification = await migrationExecute(corpidBind, querySubcoreClassification);
            }
            if (!modules.includes('subcore') && modules.includes('subcore.person')) {
                queryResult.subcore.person = await migrationExecute(corpidBind, querySubcorePerson);
            }
            if (!modules.includes('subcore') && modules.includes('subcore.conversation')) {
                queryResult.subcore.conversation = await migrationExecute(corpidBind, querySubcoreConversation);
            }
            if (!modules.includes('subcore') && !modules.includes('subcore.conversation') && modules.includes('subcore.surveyanswered')) {
                queryResult.subcore.surveyanswered = await migrationExecute(corpidBind, { surveyanswered: querySubcoreConversation.surveyanswered });
            }
            if (!modules.includes('subcore') && modules.includes('subcore.campaign')) {
                queryResult.subcore.campaign = await migrationExecute(corpidBind, querySubcoreCampaign);
            }
            if (!modules.includes('subcore') && modules.includes('subcore.others')) {
                queryResult.subcore.others = await migrationExecute(corpidBind, querySubcoreOthers);
            }
            if (modules.includes('extras')) {
                queryResult.extras.blacklist = await migrationExecute(corpidBind, { blacklist: queryExtras.blacklist });
                queryResult.extras.hsmhistory = await migrationExecute(corpidBind, { hsmhistory: queryExtras.hsmhistory });
                queryResult.extras.inappropriatewords = await migrationExecute(corpidBind, { inappropriatewords: queryExtras.inappropriatewords });
                queryResult.extras.label = await migrationExecute(corpidBind, { label: queryExtras.label });
                queryResult.extras.location = await migrationExecute(corpidBind, { location: queryExtras.location });
                queryResult.extras.reporttemplate = await migrationExecute(corpidBind, { reporttemplate: queryExtras.reporttemplate });
                queryResult.extras.sla = await migrationExecute(corpidBind, { sla: queryExtras.sla });
                queryResult.extras.whitelist = await migrationExecute(corpidBind, { whitelist: queryExtras.whitelist });
            }
            if (!modules.includes('extras') && modules.includes('extras.blacklist')) {
                queryResult.extras.blacklist = await migrationExecute(corpidBind, { blacklist: queryExtras.blacklist });
            }
            if (!modules.includes('extras') && modules.includes('extras.hsmhistory')) {
                queryResult.extras.hsmhistory = await migrationExecute(corpidBind, { hsmhistory: queryExtras.hsmhistory });
            }
            if (!modules.includes('extras') && modules.includes('extras.inappropriatewords')) {
                queryResult.extras.inappropriatewords = await migrationExecute(corpidBind, { inappropriatewords: queryExtras.inappropriatewords });
            }
            if (!modules.includes('extras') && modules.includes('extras.label')) {
                queryResult.extras.label = await migrationExecute(corpidBind, { label: queryExtras.label });
            }
            if (!modules.includes('extras') && modules.includes('extras.location')) {
                queryResult.extras.location = await migrationExecute(corpidBind, { location: queryExtras.location });
            }
            if (!modules.includes('extras') && modules.includes('extras.reporttemplate')) {
                queryResult.extras.reporttemplate = await migrationExecute(corpidBind, { reporttemplate: queryExtras.reporttemplate });
            }
            if (!modules.includes('extras') && modules.includes('extras.sla')) {
                queryResult.extras.sla = await migrationExecute(corpidBind, { sla: queryExtras.sla });
            }
            if (!modules.includes('extras') && modules.includes('extras.whitelist')) {
                queryResult.extras.whitelist = await migrationExecute(corpidBind, { whitelist: queryExtras.whitelist });
            }
            await zyxmeQuery(`UPDATE migration SET run = $run, result = $result, enddate = NOW() WHERE corpid = $corpid`, bind = {
                corpid: corpid,
                run: false,
                result: queryResult
            });
            return res.status(200).json({ error: false, success: true, data: queryResult });
        }
        catch (error) {
            return res.status(500).json({ error: true, success: false, data: queryResult, msg: error.message });
        }
    }
    else {
        return res.status(400).json({ error: true, success: false, data: 'Invalid JSON' });
    }
}