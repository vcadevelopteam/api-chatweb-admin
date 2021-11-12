const sequelize = require('../config/database');
const zyxmeSequelize = require("../config/databasezyxme");
const { getErrorSeq } = require('../config/helpers');
const { QueryTypes } = require('sequelize');
const axios = require('axios');
const bcryptjs = require("bcryptjs");

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
                    console.log(error);
                }
            }
            break;
        }
    return data;
}

const apiZyxmeHookEndpoint = process.env.ZYXMEHOOK;
const apiLaraigoHookEndpoint = process.env.HOOK;
const reconfigWebhook = async (table, data) => {
    switch (table) {
        case 'communicationchannel':
            data.servicecredentials = null;
            if (apiZyxmeHookEndpoint) {
                try {
                    const response = await axios({
                        data: {
                            communicationchannelsite: data.communicationchannelsite,
                            communicationchannelowner: data.communicationchannelowner,
                            type: data.type,
                            url: apiLaraigoHookEndpoint
                        },
                        method: 'post',
                        url: `${apiZyxmeHookEndpoint}reconfig`
                    });
                    if (response.data && response.data.success) {
                        data.servicecredentials = JSON.stringify(response.data.result)
                    }
                } catch (error) {
                    console.log(error);
                }
            }
        break;
    }
    return data;
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

const renameVariable = (table, data) => {
    switch (table) {
        case 'conversation':
            for (const [oldname, newname] of variableRenameList) {
                data.variablecontext = data.variablecontext.replace(new RegExp(`"id":"${oldname}_custom"`, "g"),`"id":"${newname}_custom"`);
                data.variablecontext = data.variablecontext.replace(new RegExp(`"Name":"${oldname}"`, "g"),`"Name":"${newname}"`);
            }
            break;
        case 'tablevariable':
            for (const [oldname, newname] of variableRenameList) {
                data.description = data.description.replace(`${oldname}`,`${newname}`);
            }
            break;
        case 'tablevariableconfiguration':
            for (const [oldname, newname] of variableRenameList) {
                data.variable = data.variable.replace(`${oldname}`,`${newname}`);
            }
            break;
        case 'block': case 'blockversion':
            for (const [oldname, newname] of variableRenameList) {
                data.blockgroup = data.blockgroup.replace(new RegExp(`"title":"${oldname}","caption"`, "g"),`"title":"${newname}","caption"`);
                data.blockgroup = data.blockgroup.replace(new RegExp(`"variablename":"${oldname}"`, "g"),`"variablename":"${newname}"`);
                data.blockgroup = data.blockgroup.replace(new RegExp(`"variablecontext":"${oldname}"`, "g"),`"variablecontext":"${newname}"`);
                data.blockgroup = data.blockgroup.replace(new RegExp(`"conditionvariable":"${oldname}"`, "g"),`"conditionvariable":"${newname}"`);
                data.blockgroup = data.blockgroup.replace(new RegExp(`"latitude":"${oldname}"`, "g"),`"latitude":"${newname}"`);
                data.blockgroup = data.blockgroup.replace(new RegExp(`"longitude":"${oldname}"`, "g"),`"longitude":"${newname}"`);
                data.blockgroup = data.blockgroup.replace(new RegExp(`{{${oldname}}}`, "g"),`{{${newname}}}`);
                data.variablecustom = data.variablecustom.replace(new RegExp(`"id":"${oldname}_custom"`, "g"),`"id":"${newname}_custom"`);
                data.variablecustom = data.variablecustom.replace(new RegExp(`"name":"${oldname}"`, "g"),`"name":"${newname}"`);
            }
            break;
    }
    return data;
}

const restructureVariable = (table, data) => {
    switch (table) {
        case 'conversation':
            if (data.variablecontext) {
                let variablecontext = JSON.parse(data.variablecontext);
                if (Array.isArray(variablecontext)) {
                    data.variablecontext = JSON.stringify(variablecontext.reduce((avc, vc) => ({
                        ...avc,
                        [vc.Name]: vc
                    }), {}));
                }
            }
        break;
    }
    return data;
}

const migrationExecute = async (corpidBind, queries, limit) => {
    let executeResult = {};
    for (const [k,q] of Object.entries(queries)) {
        executeResult[k] = {success: true, errors: [], count: {success: 0, failed: 0, total: 0}};
        let selectResult = await zyxmeQuery(q.select.replace('\n',' ') + (!!limit ? ` LIMIT ${limit}` : ''), corpidBind);
        if (selectResult instanceof Array) {
            executeResult[k].count.total = selectResult.length;
            selectResult = await recryptPwd(k, selectResult);
            if (q.alter) {
                let alterResult = await laraigoQuery(q.alter.replace('\n',' '));
                if (!(alterResult instanceof Array)) {
                    executeResult[k].success = false;
                    executeResult[k].errors.push({script: alterResult});
                }
            }
            for (selRes of selectResult) {
                let bind = selRes;
                bind = reconfigWebhook(k, bind);
                bind = renameVariable(k, bind);
                bind = restructureVariable(k, bind);
                if (q.preprocess) {
                    let preprocessResult = await laraigoQuery(q.preprocess.replace('\n',' '), bind);
                    if (!(preprocessResult instanceof Array)) {
                        executeResult[k].success = false;
                        executeResult[k].errors.push({script: preprocessResult, bind: Object.fromEntries(Object.entries(bind).filter(b => b[0].startsWith('zyxme')))});
                    }
                }
                if (q.insert) {
                    let insertResult = await laraigoQuery(q.insert.replace('\n',' '), bind);
                    if (insertResult instanceof Array) {
                        executeResult[k].count.success += 1;
                    }
                    else {
                        executeResult[k].count.failed += 1;
                        executeResult[k].success = false;
                        executeResult[k].errors.push({script: insertResult, bind: Object.fromEntries(Object.entries(bind).filter(b => b[0].startsWith('zyxme')))});
                    }
                }
                if (q.postprocess) {
                    let postprocessResult = await laraigoQuery(q.postprocess.replace('\n',' '), bind);
                    if (!(postprocessResult instanceof Array)) {
                        executeResult[k].success = false;
                        executeResult[k].errors.push({script: postprocessResult, bind: Object.fromEntries(Object.entries(bind).filter(b => b[0].startsWith('zyxme')))});
                    }
                }
            }
            if (q.update) {
                let updateResult = await laraigoQuery(q.update.replace('\n',' '), corpidBind);
                if (!(updateResult instanceof Array)) {
                    executeResult[k].success = false;
                    executeResult[k].errors.push({script: updateResult, bind: corpidBind});
                }
            }
        }
        else {
            executeResult[k].success = false;
            executeResult[k].errors.push({script: selectResult, bind: corpidBind});
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
        ORDER BY corpid`,
        alter: `ALTER TABLE corp ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO corp (
            zyxmecorpid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            logo, logotype, paymentplanid
        )
        VALUES (
            $zyxmecorpid,
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $logo, $logotype, 2
        )`
    },
    org: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        description, status, type, createdate, createby, changedate, changeby, edit
        FROM org
        WHERE corpid = $corpid
        ORDER BY orgid`,
        alter: `ALTER TABLE org ADD COLUMN IF NOT EXISTS zyxmeorgid BIGINT,
        ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO org (
            zyxmecorpid,
            corpid,
            zyxmeorgid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            timezoneoffset, timezone, currency, country
        )
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            $zyxmeorgid,
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            -5, 'America/Lima', 'PEN', 'PE'
        ) RETURNING orgid`,
    },
    domain: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, domainid as zyxmedomainid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        domainname, domainvalue, domaindesc, bydefault, "system", priorityorder
        FROM domain
        WHERE corpid = $corpid
        ORDER BY domainid`,
        alter: `ALTER TABLE domain ADD COLUMN IF NOT EXISTS zyxmedomainid BIGINT,
        ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO domain (
            zyxmecorpid,
            corpid,
            orgid,
            zyxmedomainid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            domainname, domainvalue, domaindesc, bydefault, "system", priorityorder
        )
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            CASE WHEN COALESCE($zyxmeorgid, 0) = 0 THEN 0
            ELSE (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1)
            END,
            $zyxmedomainid,
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $domainname, $domainvalue, $domaindesc, $bydefault, $system, $priorityorder
        )`
    },
    inputvalidation: {
        select: `SELECT corpid as zyxmecorpid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        inputvalue
        FROM inputvalidation
        WHERE corpid = $corpid
        ORDER BY inputvalidationid`,
        alter: `ALTER TABLE inputvalidation ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO inputvalidation (
            zyxmecorpid,
            corpid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            inputvalue
        )
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $inputvalue
        )`
    },
    /* appintegrationid is required for communicationchannel but no values seen */
    appintegration: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, appintegrationid as zyxmeappintegrationid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        appid, externalsource, environment, keyparameters, integrationid
        FROM appintegration
        WHERE corpid = $corpid
        ORDER BY appintegrationid`,
        alter: `ALTER TABLE appintegration ADD COLUMN IF NOT EXISTS zyxmeappintegrationid BIGINT,
        ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO appintegration (
            zyxmecorpid,
            corpid,
            orgid,
            zyxmeappintegrationid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            appid, externalsource, environment, keyparameters, integrationid
        )
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            $zyxmeappintegrationid,
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $appid, $externalsource, $environment, $keyparameters, $integrationid
        )`
    },
    /* botconfiguration is required for communicationchannel */
    botconfiguration: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, botconfigurationid as zyxmebotconfigurationid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        bottype, parameterjson
        FROM botconfiguration
        WHERE corpid = $corpid
        ORDER BY botconfigurationid`,
        alter: `ALTER TABLE botconfiguration ADD COLUMN IF NOT EXISTS zyxmebotconfigurationid BIGINT,
        ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO botconfiguration (
            zyxmecorpid,
            corpid,
            orgid,
            zyxmebotconfigurationid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            bottype, parameterjson
        )
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            $zyxmebotconfigurationid,
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $bottype, $parameterjson
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
        ORDER BY communicationchannelid`,
        alter: `ALTER TABLE communicationchannel ADD COLUMN IF NOT EXISTS zyxmecommunicationchannelid BIGINT,
        ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
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
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            $zyxmecommunicationchannelid,
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $communicationchannelsite, $communicationchannelowner, $communicationchannelcontact, $communicationchanneltoken,
            $botenabled, $customicon, $coloricon,
            (SELECT botconfigurationid FROM botconfiguration WHERE zyxmecorpid = $zyxmecorpid AND zyxmebotconfigurationid = $zyxmebotconfigurationid LIMIT 1),
            $relatedid, $schedule, $chatflowenabled,
            $integrationid,
            CASE WHEN COALESCE($zyxmeappintegrationid, 0) = 0 THEN 0
            ELSE (SELECT appintegrationid FROM appintegration WHERE zyxmecorpid = $zyxmecorpid AND zyxmeappintegrationid = $zyxmeappintegrationid LIMIT 1)
            END,
            $country, $channelparameters, $channelactive, $resolvelithium,
            $color, $icons, $other, $form, $apikey,
            $servicecredentials
        )`
    },
    communicationchannelstatus: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, communicationchannelid as zyxmecommunicationchannelid,
        description, status, type, createdate, createby, changedate, changeby, edit
        FROM communicationchannelstatus
        WHERE corpid = $corpid
        ORDER BY communicationchannelstatusid`,
        alter: `ALTER TABLE communicationchannelstatus ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO communicationchannelstatus (
            zyxmecorpid,
            corpid,
            orgid,
            communicationchannelid,
            description, status, type, createdate, createby, changedate, changeby, edit
        )
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            (SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = $zyxmecorpid AND zyxmecommunicationchannelid = $zyxmecommunicationchannelid LIMIT 1),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit
        )`
    },
    property: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, communicationchannelid as zyxmecommunicationchannelid,
        propertyid as zyxmepropertyid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        propertyname, propertyvalue
        FROM property
        WHERE corpid = $corpid
        ORDER BY propertyid`,
        alter: `ALTER TABLE property ADD COLUMN IF NOT EXISTS zyxmepropertyid BIGINT,
        ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
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
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            CASE WHEN COALESCE($zyxmeorgid, 0) = 0 THEN 0
            ELSE (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1)
            END,
            CASE WHEN COALESCE($zyxmecommunicationchannelid, 0) = 0 THEN 0
            ELSE (SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = $zyxmecorpid AND zyxmecommunicationchannelid = $zyxmecommunicationchannelid LIMIT 1)
            END,
            $zyxmepropertyid,
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $propertyname::CHARACTER VARYING, $propertyvalue,
            (SELECT inputtype FROM property WHERE propertyname = $propertyname LIMIT 1),
            (SELECT domainname FROM property WHERE propertyname = $propertyname LIMIT 1),
            (SELECT category FROM property WHERE propertyname = $propertyname LIMIT 1),
            (SELECT "group" FROM property WHERE propertyname = $propertyname LIMIT 1),
            (SELECT level FROM property WHERE propertyname = $propertyname LIMIT 1)
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
        ORDER BY usr.userid`,
        alter: `ALTER TABLE usr ADD COLUMN IF NOT EXISTS zyxmeuserid BIGINT,
        ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        preprocess: `UPDATE usr
        SET zyxmecorpid = $zyxmecorpid,
        zyxmeuserid = $zyxmeuserid,
        pwd = $pwd
        WHERE usr = $username::CHARACTER VARYING`,
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
            $zyxmecorpid,
            $zyxmeuserid,
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $username::CHARACTER VARYING, $doctype, $docnum, $pwd, $firstname, $lastname, $email,
            $pwdchangefirstlogin, $facebookid, $googleid, $company,
            $twofactorauthentication, $usersupport,
            (SELECT propertyid FROM property WHERE zyxmecorpid = $zyxmecorpid AND zyxmepropertyid = $billinggroup LIMIT 1),
            $registercode, $usercall,
            $passwordchangedate, $lastlogin, $lastlogout, $lasttokenorigin, $lasttokenstatus,
            $lasthistorystatus, $lasthistorytype, $lastmotivetype, $lastmotivedescription,
            $attemptslogin, $lastuserstatus,
            $area, $location, $management, $phone
        FROM usr
        WHERE NOT EXISTS(SELECT usr.usr FROM usr WHERE usr.usr = $username)
        LIMIT 1`,
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
        ORDER BY ut.usertokenid`,
        alter: `ALTER TABLE usertoken ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO usertoken (
            zyxmecorpid,
            userid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            token, expirationproperty, origin
        )
        VALUES (
            $zyxmecorpid,
            (SELECT userid FROM usr WHERE zyxmeuserid = $zyxmeuserid LIMIT 1),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $token, $expirationproperty, $origin
        )`
    },
    userstatus: {
        select: `SELECT ous.corpid as zyxmecorpid, us.userid as zyxmeuserid,
        us.description, us.status, us.type, us.createdate, us.createby, us.changedate, us.changeby, us.edit
        FROM userstatus us
        JOIN orguser ous ON ous.corpid = $corpid AND ous.userid = us.userid
        ORDER BY us.userstatusid`,
        alter: `ALTER TABLE userstatus ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO userstatus (
            zyxmecorpid,
            userid,
            description, status, type, createdate, createby, changedate, changeby, edit
        )
        VALUES (
            $zyxmecorpid,
            (SELECT userid FROM usr WHERE zyxmeuserid = $zyxmeuserid LIMIT 1),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit
        )`
    },
    userhistory: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, userid as zyxmeuserid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        motivetype, motivedescription, desconectedtime
        FROM userhistory
        WHERE corpid = $corpid
        ORDER BY userhistoryid`,
        alter: `ALTER TABLE userhistory ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO userhistory (
            zyxmecorpid,
            corpid,
            orgid,
            userid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            motivetype, motivedescription, desconectedtime
        )
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            (SELECT userid FROM usr WHERE zyxmeuserid = $zyxmeuserid LIMIT 1),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $motivetype, $motivedescription, $desconectedtime
        )`
    },
    usrnotification: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, usridfrom as zyxmeusridfrom, usrid as zyxmeusrid,
        description, status, type, createdate, createby, changedate, changeby, edit
        FROM usrnotification
        WHERE corpid = $corpid
        ORDER BY usrnotificationid`,
        alter: `ALTER TABLE usrnotification ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO usrnotification (
            zyxmecorpid,
            corpid,
            orgid,
            usridfrom,
            usrid,
            description, status, type, createdate, createby, changedate, changeby, edit
        )
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            (SELECT userid FROM usr WHERE zyxmeuserid = $zyxmeusridfrom LIMIT 1),
            (SELECT userid FROM usr WHERE zyxmeuserid = $zyxmeusrid LIMIT 1),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit
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
        WHERE ous.corpid = $corpid`,
        alter: `ALTER TABLE orguser ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
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
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            (SELECT userid FROM usr WHERE zyxmeuserid = $zyxmeuserid LIMIT 1),
            (SELECT roleid FROM role WHERE corpid = 1 AND orgid = 1 AND code = $rolecode LIMIT 1),
            (SELECT userid FROM usr WHERE zyxmeuserid = $supervisor),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $bydefault, $labels, $groups,
            (
                SELECT string_agg(communicationchannelid::text,',')
                FROM communicationchannel
                WHERE zyxmecorpid = $zyxmecorpid AND 
                zyxmecommunicationchannelid IN (SELECT UNNEST(string_to_array($channels,',')::BIGINT[]))
            ),
            $defaultsort, $redirect
        )`
    }
}

const querySubcoreClassification = {
    classification: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, classificationid as zyxmeclassificationid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        parent, communicationchannel, path, jobplan, usergroup, schedule
        FROM classification
        WHERE corpid = $corpid
        ORDER BY classificationid`,
        alter: `ALTER TABLE classification ADD COLUMN IF NOT EXISTS zyxmeclassificationid BIGINT,
        ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
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
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            $zyxmeclassificationid,
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $description,
            (SELECT classificationid FROM classification WHERE zyxmecorpid = $zyxmecorpid AND zyxmeclassificationid = $parent LIMIT 1),
            $communicationchannel, $path, $jobplan,
            (SELECT propertyid FROM property WHERE zyxmecorpid = $zyxmecorpid AND zyxmepropertyid = $usergroup LIMIT 1),
            $schedule
        )`
    },
    quickreply: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, classificationid as zyxmeclassificationid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        quickreply
        FROM quickreply
        WHERE corpid = $corpid
        ORDER BY quickreplyid`,
        alter: `ALTER TABLE quickreply ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO quickreply (
            zyxmecorpid,
            corpid,
            orgid,
            classificationid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            quickreply
        )
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            (SELECT classificationid FROM classification WHERE zyxmecorpid = $zyxmecorpid AND zyxmeclassificationid = $zyxmeclassificationid LIMIT 1),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $quickreply
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
        ORDER BY personid`,
        alter: `ALTER TABLE person ADD COLUMN IF NOT EXISTS zyxmepersonid BIGINT,
        ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
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
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            $zyxmepersonid,
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $groups, $name, $referringperson,
            (SELECT personid FROM person WHERE zyxmecorpid = $zyxmecorpid AND zyxmepersonid = $referringpersonid LIMIT 1),
            $persontype, $personstatus,
            $phone, $email, $alternativephone, $alternativeemail,
            $firstcontact, $lastcontact,
            (SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = $zyxmecorpid AND zyxmecommunicationchannelid = $lastcommunicationchannelid LIMIT 1),
            $documenttype, $documentnumber,
            $firstname, $lastname, $imageurldef, $sex, $gender, $birthday, $civilstatus, $occupation, $educationlevel,
            $termsandconditions, $installments, $feeamount, $approvedamount, $evaluationstatus,
            $lastdateevaluation, $lastdatestatus, $daysfornextevaluation,
            $address, $addressreference, $clientnumber, $mailflag, $ecommerceaccounts, $salary,
            $country, $region, $district, $latitude, $longitude, $province, $contact, $usercall, $geographicalarea, $age
        )`
    },
    personaddinfo: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, personid as zyxmepersonid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        addinfo
        FROM personaddinfo
        WHERE corpid = $corpid
        ORDER BY personaddinfoid`,
        alter: `ALTER TABLE personaddinfo ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO personaddinfo (
            zyxmecorpid,
            corpid,
            orgid,
            personid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            addinfo
        )
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            (SELECT personid FROM person WHERE zyxmecorpid = $zyxmecorpid AND zyxmepersonid = $zyxmepersonid LIMIT 1),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $addinfo
        )`
    },
    personcommunicationchannel: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, personid as zyxmepersonid,
        personcommunicationchannel,
        description, status, type, createdate, createby, changedate, changeby, edit,
        imageurl, personcommunicationchannelowner, displayname, pendingsurvey, surveycontext, "locked", lastusergroup
        FROM personcommunicationchannel
        WHERE corpid = $corpid`,
        alter: `ALTER TABLE personcommunicationchannel ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO personcommunicationchannel (
            zyxmecorpid,
            corpid,
            orgid,
            personid,
            personcommunicationchannel,
            description, status, type, createdate, createby, changedate, changeby, edit,
            imageurl, personcommunicationchannelowner, displayname, pendingsurvey, surveycontext, "locked", lastusergroup
        )
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            (SELECT personid FROM person WHERE zyxmecorpid = $zyxmecorpid AND zyxmepersonid = $zyxmepersonid LIMIT 1),
            $personcommunicationchannel,
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $imageurl, $personcommunicationchannelowner, $displayname, $pendingsurvey, $surveycontext, $locked, $lastusergroup
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
        ORDER BY postid`,
        alter: `ALTER TABLE post ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO post (
            zyxmecorpid,
            corpid,
            orgid,
            communicationchannelid,
            personid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            postexternalid, message, content, postexternalparentid, commentexternalid
        )
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            (SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = $zyxmecorpid AND zyxmecommunicationchannelid = $zyxmecommunicationchannelid LIMIT 1),
            (SELECT personid FROM person WHERE zyxmecorpid = $zyxmecorpid AND zyxmepersonid = $zyxmepersonid LIMIT 1),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $postexternalid, $message, $content, $postexternalparentid, $commentexternalid
        )`
    },
    pccstatus: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        communicationchannelid as zyxmecommunicationchannelid,
        personcommunicationchannel,
        description, status, type, createdate, createby, changedate, changeby, edit
        FROM pccstatus
        WHERE corpid = $corpid`,
        alter: `ALTER TABLE pccstatus ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO pccstatus (
            zyxmecorpid,
            corpid,
            orgid,
            communicationchannelid,
            personcommunicationchannel,
            description, status, type, createdate, createby, changedate, changeby, edit
        )
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            (SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = $zyxmecorpid AND zyxmecommunicationchannelid = $zyxmecommunicationchannelid LIMIT 1),
            $personcommunicationchannel,
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit
        )`
    },
    conversation: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, personid as zyxmepersonid,
        personcommunicationchannel, communicationchannelid as zyxmecommunicationchannelid,
        conversationid as zyxmeconversationid,
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
        FROM conversation
        WHERE corpid = $corpid
        AND variablecontext IS NOT NULL
        ORDER BY conversationid DESC`,
        alter: `ALTER TABLE conversation ADD COLUMN IF NOT EXISTS zyxmeconversationid BIGINT,
        ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
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
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            (SELECT personid FROM person WHERE zyxmecorpid = $zyxmecorpid AND zyxmepersonid = $zyxmepersonid LIMIT 1),
            $personcommunicationchannel,
            (SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = $zyxmecorpid AND zyxmecommunicationchannelid = $zyxmecommunicationchannelid LIMIT 1),
            $zyxmeconversationid,
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $firstconversationdate, $lastconversationdate,
            (SELECT userid FROM usr WHERE zyxmeuserid = $firstuserid LIMIT 1),
            (SELECT userid FROM usr WHERE zyxmeuserid = $lastuserid LIMIT 1),
            $firstreplytime, $averagereplytime, $userfirstreplytime, $useraveragereplytime,
            $ticketnum, $startdate, $finishdate, $totalduration, $realduration, $totalpauseduration, $personaveragereplytime,
            $closetype, $context, $postexternalid, $commentexternalid, $replyexternalid,
            $botduration, $autoclosetime, $handoffdate, $pausedauto,
            $chatflowcontext, $variablecontext, $usergroup, $mailflag,
            $sentiment, $sadness, $joy, $fear, $disgust, $anger,
            $usersentiment, $usersadness, $userjoy, $userfear, $userdisgust, $useranger,
            $personsentiment, $personsadness, $personjoy, $personfear, $persondisgust, $personanger,
            $balancetimes, $firstassignedtime, $extradata, $holdingwaitingtime, $closetabdate, $abandoned,
            $lastreplydate, $personlastreplydate, $tags,
            $wnlucategories, $wnluconcepts, $wnluentities, $wnlukeywords, $wnlumetadata, $wnlurelations, $wnlusemanticroles,
            $wnlcclass,
            $wtaanger, $wtafear, $wtajoy, $wtasadness, $wtaanalytical, $wtaconfident, $wtatentative,
            $wtaexcited, $wtafrustrated, $wtaimpolite, $wtapolite, $wtasad, $wtasatisfied, $wtasympathetic,
            $wtauseranger, $wtauserfear, $wtauserjoy, $wtausersadness, $wtauseranalytical, $wtauserconfident, $wtausertentative,
            $wtauserexcited, $wtauserfrustrated, $wtauserimpolite, $wtauserpolite, $wtausersad, $wtausersatisfied, $wtausersympathetic,
            $wtapersonanger, $wtapersonfear, $wtapersonjoy, $wtapersonsadness, $wtapersonanalytical, $wtapersonconfident, $wtapersontentative,
            $wtapersonexcited, $wtapersonfrustrated, $wtapersonimpolite, $wtapersonpolite, $wtapersonsad, $wtapersonsatisfied, $wtapersonsympathetic,
            $wnlusyntax, $wnlusentiment, $wnlusadness, $wnlujoy, $wnlufear, $wnludisgust, $wnluanger,
            $wnluusersentiment, $wnluusersadness, $wnluuserjoy, $wnluuserfear, $wnluuserdisgust, $wnluuseranger,
            $wnlupersonsentiment, $wnlupersonsadness, $wnlupersonjoy, $wnlupersonfear, $wnlupersondisgust, $wnlupersonanger,
            $enquiries, $classification, $firstusergroup, $emailalertsent, $tdatime,
            $interactionquantity, $interactionpersonquantity, $interactionbotquantity, $interactionasesorquantity,
            $interactionaiquantity, $interactionaipersonquantity, $interactionaibotquantity, $interactionaiasesorquantity,
            $handoffafteransweruser, $lastseendate, $closecomment
        )`,
        update: `SELECT ufn_ticketnum_ins(orgid)
        FROM org
        WHERE zyxmecorpid = $corpid`
    },
    conversationclassification: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, personid as zyxmepersonid,
        personcommunicationchannel, conversationid as zyxmeconversationid,
        communicationchannelid as zyxmecommunicationchannelid,
        classificationid as zyxmeclassificationid,
        status, createdate, createby, changedate, changeby, edit,
        jobplan
        FROM conversationclassification
        WHERE corpid = $corpid`,
        alter: `ALTER TABLE conversationclassification ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
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
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            (SELECT personid FROM person WHERE zyxmecorpid = $zyxmecorpid AND zyxmepersonid = $zyxmepersonid LIMIT 1),
            $personcommunicationchannel,
            (SELECT conversationid FROM conversation WHERE zyxmecorpid = $zyxmecorpid AND zyxmeconversationid = $zyxmeconversationid LIMIT 1),
            (SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = $zyxmecorpid AND zyxmecommunicationchannelid = $zyxmecommunicationchannelid LIMIT 1),
            (SELECT classificationid FROM classification WHERE zyxmecorpid = $zyxmecorpid AND zyxmeclassificationid = $zyxmeclassificationid LIMIT 1),
            $status, $createdate, $createby, $changedate, $changeby, $edit,
            $jobplan
        )`
    },
    conversationnote: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, personid as zyxmepersonid,
        personcommunicationchannel, communicationchannelid as zyxmecommunicationchannelid,
        conversationid as zyxmeconversationid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        addpersonnote, note
        FROM conversationnote
        WHERE corpid = $corpid
        ORDER BY conversationnoteid`,
        alter: `ALTER TABLE conversationnote ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
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
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            (SELECT personid FROM person WHERE zyxmecorpid = $zyxmecorpid AND zyxmepersonid = $zyxmepersonid LIMIT 1),
            $personcommunicationchannel,
            (SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = $zyxmecorpid AND zyxmecommunicationchannelid = $zyxmecommunicationchannelid LIMIT 1),
            (SELECT conversationid FROM conversation WHERE zyxmecorpid = $zyxmecorpid AND zyxmeconversationid = $zyxmeconversationid LIMIT 1),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $addpersonnote, $note
        )`
    },
    conversationpause: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, personid as zyxmepersonid,
        personcommunicationchannel, communicationchannelid as zyxmecommunicationchannelid,
        conversationid as zyxmeconversationid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        startpause, stoppause
        FROM conversationpause
        WHERE corpid = $corpid
        ORDER BY conversationpauseid`,
        alter: `ALTER TABLE conversationpause ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
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
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            (SELECT personid FROM person WHERE zyxmepersonid = $zyxmepersonid LIMIT 1),
            $personcommunicationchannel,
            (SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = $zyxmecorpid AND zyxmecommunicationchannelid = $zyxmecommunicationchannelid LIMIT 1),
            (SELECT conversationid FROM conversation WHERE zyxmecorpid = $zyxmecorpid AND zyxmeconversationid = $zyxmeconversationid LIMIT 1),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $startpause, $stoppause
        )`
    },
    conversationpending: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        personcommunicationchannel,
        userid as zyxmeuserid,
        conversationid as zyxmeconversationid,
        status, communicationchannelsite, interactiontext
        FROM conversationpending
        WHERE corpid = $corpid`,
        alter: `ALTER TABLE conversationpending ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO conversationpending (
            zyxmecorpid,
            corpid,
            orgid,
            personcommunicationchannel,
            userid,
            conversationid,
            status, communicationchannelsite, interactiontext
        )
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            $personcommunicationchannel,
            (SELECT userid FROM usr WHERE zyxmeuserid = $zyxmeuserid LIMIT 1),
            (SELECT conversationid FROM conversation WHERE zyxmecorpid = $zyxmecorpid AND zyxmeconversationid = $zyxmeconversationid LIMIT 1),
            $status, $communicationchannelsite, $interactiontext
        )`
    },
    conversationstatus: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, personid as zyxmepersonid,
        personcommunicationchannel, communicationchannelid as zyxmecommunicationchannelid,
        conversationid as zyxmeconversationid,
        description, status, type, createdate, createby, changedate, changeby, edit
        FROM conversationstatus
        WHERE corpid = $corpid
        ORDER BY conversationstatusid`,
        alter: `ALTER TABLE conversationstatus ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
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
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            (SELECT personid FROM person WHERE zyxmecorpid = $zyxmecorpid AND zyxmepersonid = $zyxmepersonid LIMIT 1),
            $personcommunicationchannel,
            (SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = $zyxmecorpid AND zyxmecommunicationchannelid = $zyxmecommunicationchannelid LIMIT 1),
            (SELECT conversationid FROM conversation WHERE zyxmecorpid = $zyxmecorpid AND zyxmeconversationid = $zyxmeconversationid LIMIT 1),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit
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
        ORDER BY interactionid`,
        alter: `ALTER TABLE interaction ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
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
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            (SELECT personid FROM person WHERE zyxmecorpid = $zyxmecorpid AND zyxmepersonid = $zyxmepersonid LIMIT 1),
            $personcommunicationchannel,
            (SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = $zyxmecorpid AND zyxmecommunicationchannelid = $zyxmecommunicationchannelid LIMIT 1),
            (SELECT conversationid FROM conversation WHERE zyxmecorpid = $zyxmecorpid AND zyxmeconversationid = $zyxmeconversationid LIMIT 1),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $interactiontext,
            (SELECT userid FROM usr WHERE zyxmeuserid = $zyxmeuserid LIMIT 1),
            $intent, $intentexample, $entityname, $entityvalue,
            $dialognode, $dialogcondition, $urlattachment, $htmlattachment,
            $interactiontype, $highlight, $labels, $postexternalid,
            $sentiment, $sadness, $joy, $fear, $disgust, $anger,
            $nluresult, $likewall, $hiddenwall,
            $chatflowpluginid, $chatflowcardid, $carduuid, $validinput, $inputquestion, $attempt,
            $wnlucategories, $wnluconcepts, $wnluentities, $wnlukeywords, $wnlumetadata, $wnlurelations, $wnlusemanticroles,
            $wnlcclass1, $wnlcclass2, $wnlcresult,
            $wtaanger, $wtafear, $wtajoy, $wtasadness, $wtaanalytical, $wtaconfident, $wtatentative, $wtaexcited,
            $wtafrustrated, $wtaimpolite, $wtapolite, $wtasad, $wtasatisfied, $wtasympathetic, $wtaresult,
            $wnlusyntax, $wnlusentiment, $wnlusadness, $wnlujoy, $wnlufear, $wnludisgust, $wnluanger, $wnluresult,
            $waintent, $waentityname, $waentityvalue, $waresult
        )`
    },
    surveyanswered: {
        select: `SELECT sa.corpid as zyxmecorpid, sa.orgid as zyxmeorgid, sa.conversationid as zyxmeconversationid,
        sa.description, sa.status, split_part(pr.propertyname, 'NUMEROPREGUNTA', 1) as type, sa.createdate, sa.createby, sa.changedate, sa.changeby, sa.edit,
        sa.answer, sa.answervalue, sa.comment,
        sq.question, (SELECT GREATEST(COUNT(q.a)::text, MAX(q.a[1])) FROM (SELECT regexp_matches(sq.question,'[\\d𝟏𝟐𝟑𝟒𝟓]+','g') a) q)::BIGINT scale
        FROM surveyanswered sa
        JOIN surveyquestion sq ON sq.corpid = sa.corpid AND sq.orgid = sa.orgid AND sq.surveyquestionid = sa.surveyquestionid
        JOIN property pr ON pr.corpid = sa.corpid AND pr.orgid = sa.orgid AND pr.status = 'ACTIVO'
        AND pr.propertyname ILIKE '%NUMEROPREGUNTA' AND pr.propertyvalue = sq.questionnumber::text
        WHERE sa.corpid = $corpid
        ORDER BY surveyansweredid`,
        alter: `ALTER TABLE surveyanswered ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO surveyanswered (
            zyxmecorpid,
            corpid,
            orgid,
            conversationid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            answer, answervalue, comment,
            question, scale, high, medium, low, fcr
        )
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            (SELECT conversationid FROM conversation WHERE zyxmecorpid = $zyxmecorpid AND zyxmeconversationid = $zyxmeconversationid LIMIT 1),
            $description, $status, $type::CHARACTER VARYING, $createdate, $createby, $changedate, $changeby, $edit,
            $answer, $answervalue, $comment,
            $question, $scale::BIGINT,
            CASE WHEN $type IN ('FCR','FIX') THEN '1'
            WHEN $type NOT IN ('FCR','FIX') AND $scale IN (9,10) THEN '9,10'
            WHEN $type NOT IN ('FCR','FIX') AND $scale IN (5) THEN '4,5'
            END,
            CASE WHEN $scale IN (9,10) THEN '7,8'
            WHEN $type <> 'FCR' AND $scale IN (5) THEN '3'
            END,
            CASE WHEN $type IN ('FCR','FIX') THEN '0,2'
            WHEN $type NOT IN ('FCR','FIX') AND $scale IN (9,10) THEN '1,2,3,4,5,6'
            WHEN $type NOT IN ('FCR','FIX') AND $scale IN (5) THEN '1,2'
            END,
            CASE WHEN $type IN ('FCR','FIX') THEN true END
        )`,
        postprocess: `
        UPDATE surveyanswered
        SET rank = CASE WHEN answervalue = ANY(string_to_array(low,',')::BIGINT[]) THEN 'LOW'
        WHEN answervalue = ANY(string_to_array(medium,',')::BIGINT[]) THEN 'MEDIUM'
        WHEN answervalue = ANY(string_to_array(high,',')::BIGINT[]) THEN 'HIGH'
        END
        WHERE zyxmecorpid = $zyxmecorpid AND rank is null`
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
        ORDER BY hsmtemplateid`,
        alter: `ALTER TABLE messagetemplate ADD COLUMN IF NOT EXISTS zyxmemessagetemplateid BIGINT,
        ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
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
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            $zyxmemessagetemplateid,
            $description, $status, $type::CHARACTER VARYING, $createdate, $createby, $changedate, $changeby, $edit,
            $name, $namespace, $category, $language,
            CASE WHEN $type = 'HSM' THEN 'MULTIMEDIA' ELSE 'STANDARD' END,
            NULLIF($header, '')::JSON->>'type' <> '',
            NULLIF($header, '')::JSON->>'type',
            NULLIF($header, '')::JSON->>'value',
            $body,
            false, '',
            NULLIF(NULLIF($buttons, '[]'),'')::JSON IS NOT NULL,
            REPLACE(REPLACE(NULLIF(NULLIF($buttons, '[]'),''),'"value":','"payload":'),'"text":','"title":')::JSON
        )`
    },
    campaign: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, campaignid as zyxmecampaignid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        title, members, startdate, enddate, repeatable, frecuency,
        message, communicationchannelid as zyxmecommunicationchannelid, hsmid as messagetemplatename, hsmnamespace as messagetemplatenamespace,
        counter, lastrundate, usergroup, subject,
        hsmtemplateid as zyxmemessagetemplateid,
        REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(NULLIF(hsmheader,''), '\\\\+\\"', '"', 'g'),'^\\"+\\{','{','g'),'\\}\\"+$','}','g') as messagetemplateheader,
        REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(NULLIF(hsmbuttons,''), '\\\\+\\"', '"', 'g'),'^\\"+\\[','[','g'),'\\]\\"+$',']','g') as messagetemplatebuttons,
        executiontype, batchjson, taskid as zyxmetaskid, fields
        FROM campaign
        WHERE corpid = $corpid
        ORDER BY campaignid`,
        alter: `ALTER TABLE campaign ADD COLUMN IF NOT EXISTS zyxmecampaignid BIGINT,
        ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
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
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            $zyxmecampaignid,
            $description, $status, REPLACE($type, 'HSMID', 'HSM'), $createdate, $createby, $changedate, $changeby, $edit,
            $title, $members, $startdate::DATE, $enddate::DATE, $repeatable, $frecuency,
            $message,
            (SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = $zyxmecorpid AND zyxmecommunicationchannelid = $zyxmecommunicationchannelid LIMIT 1),
            $messagetemplatename, $messagetemplatenamespace,
            $counter, $lastrundate, $usergroup, $subject,
            (SELECT messagetemplateid FROM messagetemplate WHERE zyxmecorpid = $zyxmecorpid AND zyxmemessagetemplateid = $zyxmemessagetemplateid LIMIT 1),
            $messagetemplateheader,
            REPLACE(REPLACE(NULLIF(NULLIF($messagetemplatebuttons, '[]'),''),'"value":','"payload":'),'"text":','"title":')::JSON,
            $executiontype, $batchjson,
            (
                SELECT string_agg(taskschedulerid::text,',')
                FROM taskscheduler
                WHERE zyxmecorpid = $zyxmecorpid AND 
                zyxmetaskschedulerid IN (SELECT UNNEST(string_to_array($zyxmetaskid,',')::BIGINT[]))
            ),
            $fields
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
        ORDER BY campaignmemberid`,
        alter: `ALTER TABLE campaignmember ADD COLUMN IF NOT EXISTS zyxmecampaignmemberid BIGINT,
        ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
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
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            (SELECT campaignid FROM campaign WHERE zyxmecorpid = $zyxmecorpid AND zyxmecampaignid = $zyxmecampaignid LIMIT 1),
            (SELECT personid FROM person WHERE zyxmecorpid = $zyxmecorpid AND zyxmepersonid = $zyxmepersonid LIMIT 1),
            $zyxmecampaignmemberid,
            $status, $personcommunicationchannel, $type, $displayname, $personcommunicationchannelowner,
            $field1, $field2, $field3, $field4, $field5, $field6, $field7, $field8, $field9,
            $field10, $field11, $field12, $field13, $field14, $field15,
            $resultfromsend, $batchindex
        )`
    },
    campaignhistory: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, campaignid as zyxmecampaignid,
        personid as zyxmepersonid, campaignmemberid as zyxmecampaignmemberid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        success, message, rundate, conversationid as zyxmeconversationid, attended
        FROM campaignhistory
        WHERE corpid = $corpid
        ORDER BY campaignhistoryid`,
        alter: `ALTER TABLE campaignhistory ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
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
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            (SELECT campaignid FROM campaign WHERE zyxmecorpid = $zyxmecorpid AND zyxmecampaignid = $zyxmecampaignid LIMIT 1),
            CASE WHEN COALESCE($zyxmepersonid, 0) = 0 THEN 0
            ELSE (SELECT personid FROM person WHERE zyxmecorpid = $zyxmecorpid AND zyxmepersonid = $zyxmepersonid LIMIT 1)
            END,
            (SELECT campaignmemberid FROM campaignmember WHERE zyxmecorpid = $zyxmecorpid AND zyxmecampaignmemberid = $zyxmecampaignmemberid LIMIT 1),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $success, $message, $rundate,
            CASE WHEN COALESCE($zyxmeconversationid, 0) = 0 THEN 0
            ELSE (SELECT conversationid FROM conversation WHERE zyxmecorpid = $zyxmecorpid AND zyxmeconversationid = $zyxmeconversationid LIMIT 1)
            END,
            $attended
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
        ORDER BY taskschedulerid`,
        alter: `ALTER TABLE taskscheduler ADD COLUMN IF NOT EXISTS zyxmetaskschedulerid BIGINT,
        ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
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
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            $zyxmetaskschedulerid,
            $tasktype::TEXT,
            CASE WHEN $tasktype = 'ExecuteCampaign'
            THEN jsonb_set(
                $taskbody::JSONB,
                '{campaignid}',
                to_jsonb((SELECT campaignid FROM campaign WHERE zyxmecorpid = $zyxmecorpid AND zyxmecampaignid = ($taskbody::JSONB->>'campaignid')::BIGINT LIMIT 1)),
                false
            )::TEXT
            ELSE $taskbody::TEXT
            END,
            $repeatflag, $repeatmode, $repeatinterval, $completed,
            $datetimestart, $datetimeend, $datetimeoriginalstart, $datetimelastrun, $taskprocessedids
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
        ORDER BY chatblockversionid`,
        alter: `ALTER TABLE blockversion ADD COLUMN IF NOT EXISTS zyxmechatblockversionid BIGINT,
        ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
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
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            $zyxmechatblockversionid,
            (
                SELECT string_agg(communicationchannelid::text,',')
                FROM communicationchannel
                WHERE zyxmecorpid = $zyxmecorpid AND 
                zyxmecommunicationchannelid IN (SELECT UNNEST(string_to_array($communicationchannelid,',')::BIGINT[]))
            ),
            $chatblockid,
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $title, $defaultgroupid, $defaultblockid, $firstblockid, $aiblockid, $blockgroup, $variablecustom,
            $color, $icontype, $tag
        )`
    },
    block: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        communicationchannelid, chatblockid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        title, defaultgroupid, defaultblockid, firstblockid, aiblockid, blockgroup, variablecustom,
        color, icontype, tag, chatblockversionid as zyxmechatblockversionid
        FROM block
        WHERE corpid = $corpid`,
        alter: `ALTER TABLE block ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
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
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            (
                SELECT string_agg(communicationchannelid::text,',')
                FROM communicationchannel
                WHERE zyxmecorpid = $zyxmecorpid AND 
                zyxmecommunicationchannelid IN (SELECT UNNEST(string_to_array($communicationchannelid,',')::BIGINT[]))
            ),
            $chatblockid,
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $title, $defaultgroupid, $defaultblockid, $firstblockid, $aiblockid, $blockgroup, $variablecustom,
            $color, $icontype, $tag,
            (SELECT chatblockversionid FROM blockversion WHERE zyxmecorpid = $zyxmecorpid AND zyxmechatblockversionid = $zyxmechatblockversionid LIMIT 1)
        )`
    },
    tablevariableconfiguration: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        chatblockid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        variable, fontcolor, fontbold, priority, visible
        FROM tablevariableconfiguration
        WHERE corpid = $corpid
        ORDER BY tablevariableconfigurationid`,
        alter: `ALTER TABLE tablevariableconfiguration ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO tablevariableconfiguration (
            zyxmecorpid,
            corpid,
            orgid,
            chatblockid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            variable, fontcolor, fontbold, priority, visible
        )
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            $chatblockid,
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $variable, $fontcolor, $fontbold, $priority, $visible
        )`
    },
    intelligentmodels: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        endpoint, modelid, apikey, provider
        FROM intelligentmodels
        WHERE corpid = $corpid
        ORDER BY intelligentmodelsid`,
        alter: `ALTER TABLE intelligentmodels ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO intelligentmodels (
            zyxmecorpid,
            corpid,
            orgid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            endpoint, modelid, apikey, provider
        )
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $endpoint, $modelid, $apikey, $provider
        )`
    },
    intelligentmodelsconfiguration: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, communicationchannelid as zyxmecommunicationchannelid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        parameters, channels, color, icontype
        FROM intelligentmodelsconfiguration
        WHERE corpid = $corpid
        ORDER BY intelligentmodelsconfigurationid`,
        alter: `ALTER TABLE intelligentmodelsconfiguration ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO intelligentmodelsconfiguration (
            zyxmecorpid,
            corpid,
            orgid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            parameters, channels, color, icontype
        )
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
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
                        (SELECT intelligentmodelsid FROM intelligentmodels WHERE zyxmecorpid = $zyxmecorpid AND intelligentmodelsid = (ja.value->>'intelligentmodelsid')::BIGINT) as zyxmeintelligentmodelsid,
                        CASE ja.value->>'service'
                        WHEN 'WATSON ASSISTANT' THEN 'ASSISTANT'
                        WHEN 'RASA' THEN 'ASSISTANT'
                        WHEN 'NATURAL LANGUAGE CLASSIFIER' THEN 'CLASSIFIER'
                        WHEN 'NATURAL LANGUAGE UNDERSTANDING' THEN 'NATURAL LANGUAGE UNDERSTANDING'
                        WHEN 'TONE ANALYZER' THEN 'TONE ANALYZER'
                        END as servicetype
                        FROM jsonb_array_elements($parameters::JSONB) ja	 
                    )  jo
            ),
            (
                SELECT string_agg(communicationchannelid::text,',')
                FROM communicationchannel
                WHERE zyxmecorpid = $zyxmecorpid AND 
                zyxmecommunicationchannelid IN (SELECT UNNEST(string_to_array($channels,',')::BIGINT[]))
            ),
            $color, $icontype
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
        ORDER BY blacklistid`,
        alter: `ALTER TABLE blacklist ADD COLUMN IF NOT EXISTS zyxmeblacklistid BIGINT,
        ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO blacklist (
            zyxmecorpid,
            corpid,
            orgid,
            zyxmeblacklistid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            phone
        )
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            $zyxmeblacklistid,
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $phone
        )`
    },
    hsmhistory: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        config, success, message, groupname, transactionid, externalid
        FROM hsmhistory
        WHERE corpid = $corpid
        ORDER BY hsmhistoryid`,
        alter: `ALTER TABLE hsmhistory ADD COLUMN IF NOT EXISTS transactionid character varying,
        ADD COLUMN IF NOT EXISTS externalid character varying,
        ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO hsmhistory (
            zyxmecorpid,
            corpid,
            orgid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            config,
            success, message, groupname, transactionid, externalid
        )
        SELECT 
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            COALESCE(jsonb_set(
                $config::JSONB,
                '{CommunicationChannelId}',
                to_jsonb((SELECT communicationchannelid FROM communicationchannel WHERE zyxmecorpid = $zyxmecorpid AND zyxmecommunicationchannelid = ($config::JSONB->>'CommunicationChannelId')::BIGINT LIMIT 1)),
                false
            ), $config::JSONB)::TEXT,
            $success, $message, $groupname, $transactionid, $externalid
        `
    },
    inappropriatewords: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        description, status, type, createdate, createby, changedate, changeby, edit
        FROM inappropriatewords
        WHERE corpid = $corpid
        ORDER BY inappropriatewordsid`,
        alter: `ALTER TABLE inappropriatewords ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO inappropriatewords (
            zyxmecorpid,
            corpid,
            orgid,
            description, status, type, createdate, createby, changedate, changeby, edit
        )
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit
        )`
    },
    label: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        color, intent, tags
        FROM label
        WHERE corpid = $corpid
        ORDER BY labelid`,
        alter: `ALTER TABLE label ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO label (
            zyxmecorpid,
            corpid,
            orgid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            color, intent, tags
        )
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $color, $intent, $tags
        )`
    },
    location: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        name, address, district, city, country, schedule, phone, alternativephone, email, alternativeemail,
        latitude, longitude, googleurl
        FROM location
        WHERE corpid = $corpid
        ORDER BY locationid`,
        alter: `ALTER TABLE location ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO location (
            zyxmecorpid,
            corpid,
            orgid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            name, address, district, city, country, schedule, phone, alternativephone, email, alternativeemail,
            latitude, longitude, googleurl
        )
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $name, $address, $district, $city, $country, $schedule, $phone, $alternativephone, $email, $alternativeemail,
            $latitude, $longitude, $googleurl
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
        ORDER BY paymentid`,
        alter: `ALTER TABLE payment ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
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
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            (SELECT conversationid FROM conversation WHERE zyxmecorpid = $zyxmecorpid AND zyxmeconversationid = $zyxmeconversationid LIMIT 1),
            (SELECT personid FROM person WHERE zyxmecorpid = $zyxmecorpid AND zyxmepersonid = $zyxmepersonid LIMIT 1),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $pocketbook, $tokenid, $title, $amount, $currency, $email, $capture,
            $tokenjson, $chargejson, $refundjson, $customerjson, $cardjson, $planjson, $subscriptionjson,
            $saleorderid, $paymentdate, $totaldiscount, $obs
        )`
    },
    productivity: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid, userid as zyxmeuserid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        fullname, communicationchannel, communicationchanneldesc,
        datestr, hours, hoursrange,
        worktime, busytimewithinwork, freetimewithinwork, busytimeoutsidework,
        onlinetime, idletime, qtytickets, qtyconnection, qtydisconnection
        FROM productivity
        WHERE corpid = $corpid
        ORDER BY productivityid`,
        alter: `ALTER TABLE productivity ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
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
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            (SELECT userid FROM usr WHERE zyxmeuserid = $zyxmeuserid LIMIT 1),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $fullname,
            (
                SELECT string_agg(communicationchannelid::text,',')
                FROM communicationchannel
                WHERE zyxmecorpid = $zyxmecorpid AND 
                zyxmecommunicationchannelid IN (SELECT UNNEST(string_to_array($communicationchannel,',')::BIGINT[]))
            ),
            $communicationchanneldesc,
            $datestr, $hours, $hoursrange,
            $worktime, $busytimewithinwork, $freetimewithinwork, $busytimeoutsidework,
            $onlinetime, $idletime, $qtytickets, $qtyconnection, $qtydisconnection
        )`
    },
    reporttemplate: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        communicationchannelid, columnjson, filterjson
        FROM reporttemplate
        WHERE corpid = $corpid
        ORDER BY reporttemplateid`,
        alter: `ALTER TABLE reporttemplate ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO reporttemplate (
            zyxmecorpid,
            corpid,
            orgid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            communicationchannelid, columnjson, filterjson
        )
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            (
                SELECT string_agg(communicationchannelid::text,',')
                FROM communicationchannel
                WHERE zyxmecorpid = $zyxmecorpid AND 
                zyxmecommunicationchannelid IN (SELECT UNNEST(string_to_array($communicationchannelid,',')::BIGINT[]))
            ),
            $columnjson, $filterjson
        )`
    },
    sla: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        company, communicationchannelid, usergroup,
        totaltmo, totaltmopercentmax, totaltmopercentmin,
        usertmo, usertmopercentmax, usertmopercentmin,
        tme, tmepercentmax, tmepercentmin,
        usertme, usertmepercentmax, usertmepercentmin,
        productivitybyhour, totaltmomin, usertmomin, tmemin, usertmemin, tmoclosedby, tmeclosedby
        FROM sla
        WHERE corpid = $corpid
        ORDER BY slaid`,
        alter: `ALTER TABLE sla ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
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
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $company,
            (
                SELECT string_agg(communicationchannelid::text,',')
                FROM communicationchannel
                WHERE zyxmecorpid = $zyxmecorpid AND 
                zyxmecommunicationchannelid IN (SELECT UNNEST(string_to_array($communicationchannelid,',')::BIGINT[]))
            ),
            $usergroup,
            $totaltmo, $totaltmopercentmax, $totaltmopercentmin,
            $usertmo, $usertmopercentmax, $usertmopercentmin,
            $tme, $tmepercentmax, $tmepercentmin,
            $usertme, $usertmepercentmax, $usertmepercentmin,
            $productivitybyhour, $totaltmomin, $usertmomin, $tmemin, $usertmemin, $tmoclosedby, $tmeclosedby
        )`
    },
    whitelist: {
        select: `SELECT corpid as zyxmecorpid, orgid as zyxmeorgid,
        description, status, type, createdate, createby, changedate, changeby, edit,
        phone, asesorname, documenttype, documentnumber, usergroup
        FROM whitelist
        WHERE corpid = $corpid
        ORDER BY whitelistid`,
        alter: `ALTER TABLE whitelist ADD COLUMN IF NOT EXISTS zyxmecorpid BIGINT`,
        insert: `INSERT INTO whitelist (
            zyxmecorpid,
            corpid,
            orgid,
            description, status, type, createdate, createby, changedate, changeby, edit,
            phone, asesorname, documenttype, documentnumber, usergroup
        )
        VALUES (
            $zyxmecorpid,
            (SELECT corpid FROM corp WHERE zyxmecorpid = $zyxmecorpid LIMIT 1),
            (SELECT orgid FROM org WHERE zyxmecorpid = $zyxmecorpid AND zyxmeorgid = $zyxmeorgid LIMIT 1),
            $description, $status, $type, $createdate, $createby, $changedate, $changeby, $edit,
            $phone, $asesorname, $documenttype, $documentnumber, $usergroup
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
    let { corpid, modules, clean = false, limit } = req.body;
    if (!!corpid && !!modules) {
        const corpidBind = { corpid: corpid }
        let queryResult = {core: {}, subcore: {}, extras: {}};
        try {
            if (modules.includes('core')) {
                if (clean === true) {
                    await laraigoQuery('SELECT FROM ufn_migration_core_delete($corpid)', bind = corpidBind);
                    clean = false;
                }
                queryResult.core = await migrationExecute(corpidBind, queryCore, limit);
            }
            if (modules.includes('subcore')) {
                if (clean === true) {
                    await laraigoQuery('SELECT FROM ufn_migration_subcore_delete($corpid)', bind = corpidBind);
                }
                queryResult.subcore.classification = await migrationExecute(corpidBind, querySubcoreClassification, limit);
                queryResult.subcore.person = await migrationExecute(corpidBind, querySubcorePerson, limit);
                queryResult.subcore.conversation = await migrationExecute(corpidBind, querySubcoreConversation, limit);
                queryResult.subcore.campaign = await migrationExecute(corpidBind, querySubcoreCampaign, limit);
                queryResult.subcore.others = await migrationExecute(corpidBind, querySubcoreOthers, limit);
            }
            if (modules.includes('extras')) {
                if (clean === true) {
                    await laraigoQuery('SELECT FROM ufn_migration_extras_delete($corpid)', bind = corpidBind);
                }
                queryResult.extras.blacklist = await migrationExecute(corpidBind, {blacklist: queryExtras.blacklist}, limit);
                queryResult.extras.hsmhistory = await migrationExecute(corpidBind, {hsmhistory: queryExtras.hsmhistory}, limit);
                queryResult.extras.inappropriatewords = await migrationExecute(corpidBind, {inappropriatewords: queryExtras.inappropriatewords}, limit);
                queryResult.extras.label = await migrationExecute(corpidBind, {label: queryExtras.label}, limit);
                queryResult.extras.location = await migrationExecute(corpidBind, {location: queryExtras.location}, limit);
                queryResult.extras.payment = await migrationExecute(corpidBind, {payment: queryExtras.payment}, limit);
                queryResult.extras.productivity = await migrationExecute(corpidBind, {productivity: queryExtras.productivity}, limit);
                queryResult.extras.reporttemplate = await migrationExecute(corpidBind, {reporttemplate: queryExtras.reporttemplate}, limit);
                queryResult.extras.sla = await migrationExecute(corpidBind, {sla: queryExtras.sla}, limit);
                queryResult.extras.whitelist = await migrationExecute(corpidBind, {whitelist: queryExtras.whitelist}, limit);
            }
            if (!modules.includes('extras') && modules.includes('extras.blacklist')) {
                if (clean === true) {
                    await laraigoQuery('DELETE FROM "blacklist" WHERE zyxmecorpid = $corpid', bind = corpidBind);
                }
                queryResult.extras.blacklist = await migrationExecute(corpidBind, {blacklist: queryExtras.blacklist}, limit);
            }
            if (!modules.includes('extras') && modules.includes('extras.hsmhistory')) {
                if (clean === true) {
                    await laraigoQuery('DELETE FROM "hsmhistory" WHERE zyxmecorpid = $corpid', bind = corpidBind);
                }
                queryResult.extras.hsmhistory = await migrationExecute(corpidBind, {hsmhistory: queryExtras.hsmhistory}, limit);
            }
            if (!modules.includes('extras') && modules.includes('extras.inappropriatewords')) {
                if (clean === true) {
                    await laraigoQuery('DELETE FROM "inappropriatewords" WHERE zyxmecorpid = $corpid', bind = corpidBind);
                }
                queryResult.extras.inappropriatewords = await migrationExecute(corpidBind, {inappropriatewords: queryExtras.inappropriatewords}, limit);
            }
            if (!modules.includes('extras') && modules.includes('extras.label')) {
                if (clean === true) {
                    await laraigoQuery('DELETE FROM "label" WHERE zyxmecorpid = $corpid', bind = corpidBind);
                }
                queryResult.extras.label = await migrationExecute(corpidBind, {label: queryExtras.label}, limit);
            }
            if (!modules.includes('extras') && modules.includes('extras.location')) {
                if (clean === true) {
                    await laraigoQuery('DELETE FROM "location" WHERE zyxmecorpid = $corpid', bind = corpidBind);
                }
                queryResult.extras.location = await migrationExecute(corpidBind, {location: queryExtras.location}, limit);
            }
            if (!modules.includes('extras') && modules.includes('extras.payment')) {
                if (clean === true) {
                    await laraigoQuery('DELETE FROM "payment" WHERE zyxmecorpid = $corpid', bind = corpidBind);
                }
                queryResult.extras.payment = await migrationExecute(corpidBind, {payment: queryExtras.payment}, limit);
            }
            if (!modules.includes('extras') && modules.includes('extras.productivity')) {
                if (clean === true) {
                    await laraigoQuery('DELETE FROM "productivity" WHERE zyxmecorpid = $corpid', bind = corpidBind);
                }
                queryResult.extras.productivity = await migrationExecute(corpidBind, {productivity: queryExtras.productivity}, limit);
            }
            if (!modules.includes('extras') && modules.includes('extras.reporttemplate')) {
                if (clean === true) {
                    await laraigoQuery('DELETE FROM "reporttemplate" WHERE zyxmecorpid = $corpid', bind = corpidBind);
                }
                queryResult.extras.reporttemplate = await migrationExecute(corpidBind, {reporttemplate: queryExtras.reporttemplate}, limit);
            }
            if (!modules.includes('extras') && modules.includes('extras.sla')) {
                if (clean === true) {
                    await laraigoQuery('DELETE FROM "sla" WHERE zyxmecorpid = $corpid', bind = corpidBind);
                }
                queryResult.extras.sla = await migrationExecute(corpidBind, {sla: queryExtras.sla}, limit);
            }
            if (!modules.includes('extras') && modules.includes('extras.whitelist')) {
                if (clean === true) {
                    await laraigoQuery('DELETE FROM "whitelist" WHERE zyxmecorpid = $corpid', bind = corpidBind);
                }
                queryResult.extras.whitelist = await migrationExecute(corpidBind, {whitelist: queryExtras.whitelist}, limit);
            }
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