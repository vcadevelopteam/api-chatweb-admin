const sequelize = require('../config/database');
const zyxmeSequelize = require("../config/databasezyxme");
const { QueryTypes } = require('sequelize');
const logger = require('../config/winston');

/* ESTE MIGRADOR SOLO ES PARA AÑADIR DATA DE LARAIGO A LARAIGO, MISMO ESQUEMA*/

const errorSeq = (err, bind) => {
    const messageerror = err.toString().replace("SequelizeDatabaseError: ", "");
    const errorcode = messageerror.includes("Named bind parameter") ? "PARAMETER_IS_MISSING" : err.parent.code;
    logger.child({ _requestid: bind._requestid }).error(`${new Date()}: ${errorcode}-${messageerror}`);
    return {
        code: errorcode,
        msg: messageerror
    };
};

const zyxmeQuery = async (query, bind = {}) => {
    return await zyxmeSequelize.query(query, {
        type: QueryTypes.SELECT,
        bind
    }).catch(err => errorSeq(err, bind));
}

const laraigoQuery = async (query, bind = {}) => {
    return await sequelize.query(query, {
        type: QueryTypes.SELECT,
        bind
    }).catch(err => errorSeq(err, bind));
}

const migrationExecute = async (corpidBind, queries, movewebhook = false) => {
    let executeResult = {};
    for (const [k, q] of Object.entries(queries)) {
        executeResult[k] = { success: true, errors: [] };
        try {
            // let migrationstatus = await zyxmeQuery(`SELECT run FROM migration WHERE corpid = $corpid`, corpidBind);
            // let running = migrationstatus.length > 0 ? migrationstatus[0].run : false;
            // if (!running) {
            //     break;
            // }

            corpidBind['maxid'] = 0;
            let lastloopid = 0;
            let counter = 0;
            const limit = (k === 'conversation') ? 5000 : 10000; // PRUEBAS 100

            // DELETE
            if (q.delete && q.delete === 'all') {
                const deleteResult = await laraigoQuery(`TRUNCATE TABLE ${k}`);
                if (!(deleteResult instanceof Array)) {
                    executeResult[k].errors.push({ delete: deleteResult });
                    logger.child({ _requestid: corpidBind._requestid }).info(deleteResult);
                }
            }
            else if (q.delete && /^\d+$/.test(q.delete)) {
                const deleteResult = await laraigoQuery(`
                DELETE FROM "${k}"
                WHERE createdate >= $backupdate::TIMESTAMP - INTERVAL '${q.delete}DAY'
                `, {
                    ...corpidBind
                });
                if (!(deleteResult instanceof Array)) {
                    executeResult[k].errors.push({ delete: deleteResult });
                    logger.child({ _requestid: corpidBind._requestid }).info(deleteResult);
                }
            }

            // Select de esquema de la bd origen
            const dtResult = await zyxmeQuery(`
            SELECT
            string_agg(c.column_name, ', ') filter (WHERE c.is_identity = 'NO') as columns,
            string_agg(c.fixsel, ', ') as fixsel,
            string_agg(c.cnd, ', ') as cnd
            FROM (
                SELECT
                c.column_name,
                c.is_identity,
                CONCAT('"', c.column_name, '"', '::', CASE WHEN c.data_type IN ('interval') THEN 'text' ELSE c.data_type END) as fixsel,
                CONCAT('"', c.column_name, '"', ' ', c.data_type) as cnd
                FROM information_schema.columns c
                WHERE c.table_schema = 'public'
                AND c.table_name = '${k}'
                ORDER BY c.ordinal_position
            ) c
            `)
            const dt = dtResult?.[0]?.cnd;
            const fixsel = dtResult?.[0]?.fixsel;
            const columns = dtResult?.[0]?.columns;

            // Último registro en la bd destino
            if (q.id) {
                const max = await laraigoQuery(`SELECT MAX(${q.id}) FROM "${k}"`);
                if (!(max instanceof Array)) {
                    executeResult[k].errors.push({ max: max });
                    logger.child({ _requestid: corpidBind._requestid }).info(max);
                }
                corpidBind['maxid'] = max?.[0]?.max || 0;
            }

            // UPDATE
            if (q.update) {
                try {
                    while (true) {
                        if (q.id) {
                            const selectResult = await zyxmeQuery(`
                            SELECT ${fixsel}
                            FROM "${k}"
                            WHERE ${q.id} <= $maxid
                            AND (
                                ${q.update} > $backupdate::TIMESTAMP
                                ${q.where || ''}
                            )
                            ORDER BY ${q.id}
                            LIMIT $limit
                            OFFSET $offset
                            `.replace('\n', ' '), {
                                ...corpidBind,
                                offset: counter * limit,
                                limit
                            });
                            if (selectResult instanceof Array) {
                                if (selectResult.length === 0) {
                                    break;
                                }
                                const updateResult = await laraigoQuery(`
                                UPDATE ${k} xupd
                                SET ${columns.split(', ').map(c => `"${c}" = dt.${c}`).join(', ')}
                                FROM json_populate_recordset(null::record, $datatable)
                                AS dt (${dt})
                                WHERE xupd.${q.id} = dt.${q.id}
                                `.replace('\n', ' '), {
                                    datatable: JSON.stringify(selectResult)
                                });
                                if (!(updateResult instanceof Array)) {
                                    executeResult[k].errors.push({ update: updateResult });
                                    logger.child({ _requestid: corpidBind._requestid }).info(updateResult);
                                }
                                counter += 1;
                            }
                            else {
                                executeResult[k].errors.push({ update: selectResult });
                                logger.child({ _requestid: corpidBind._requestid }).info(selectResult);
                                break;
                            }
                        }
                        else if (q.insert === 'createdate') {
                            const selectResult = await zyxmeQuery(`
                            SELECT ${fixsel}
                            FROM "${k}"
                            WHERE ${q.insert} <= $backupdate::TIMESTAMP
                            AND ${q.update} > $backupdate::TIMESTAMP
                            ORDER BY ctid
                            LIMIT $limit
                            OFFSET $offset
                            `.replace('\n', ' '), {
                                ...corpidBind,
                                offset: counter * limit,
                                limit
                            });
                            if (selectResult instanceof Array) {
                                if (selectResult.length === 0) {
                                    break;
                                }
                                const updateResult = await laraigoQuery(`
                                UPDATE ${k} xupd
                                SET ${columns.split(', ').map(c => `"${c}" = dt.${c}`).join(', ')}
                                FROM json_populate_recordset(null::record, $datatable)
                                AS dt (${dt})
                                WHERE ${q.xupd}
                                `.replace('\n', ' '), {
                                    datatable: JSON.stringify(selectResult)
                                });
                                if (!(updateResult instanceof Array)) {
                                    executeResult[k].errors.push({ update: updateResult });
                                    logger.child({ _requestid: corpidBind._requestid }).info(updateResult);
                                }
                                counter += 1;
                            }
                            else {
                                executeResult[k].errors.push({ update: selectResult });
                                logger.child({ _requestid: corpidBind._requestid }).info(selectResult);
                                break;
                            }
                        }
                        else if (q.update.includes('date')) {
                            const selectResult = await zyxmeQuery(`
                            SELECT ${fixsel}
                            FROM "${k}"
                            WHERE ${q.update} > $backupdate::TIMESTAMP
                            ORDER BY ctid
                            LIMIT $limit
                            OFFSET $offset
                            `.replace('\n', ' '), {
                                ...corpidBind,
                                offset: counter * limit,
                                limit
                            });
                            if (selectResult instanceof Array) {
                                if (selectResult.length === 0) {
                                    break;
                                }
                                const updateResult = await laraigoQuery(`
                                UPDATE ${k} xupd
                                SET ${columns.split(', ').map(c => `"${c}" = dt.${c}`).join(', ')}
                                FROM json_populate_recordset(null::record, $datatable)
                                AS dt (${dt})
                                WHERE ${q.xupd}
                                `.replace('\n', ' '), {
                                    datatable: JSON.stringify(selectResult)
                                });
                                if (!(updateResult instanceof Array)) {
                                    executeResult[k].errors.push({ update: updateResult });
                                    logger.child({ _requestid: corpidBind._requestid }).info(updateResult);
                                }
                                counter += 1;
                            }
                            else {
                                executeResult[k].errors.push({ update: selectResult });
                                logger.child({ _requestid: corpidBind._requestid }).info(selectResult);
                                break;
                            }
                        }
                        else {
                            break;
                        }
                        // PRUEBAS Break solo para pruebas de 1 loop
                        // break;
                    }
                } catch (error) {
                    logger.child({ _requestid: corpidBind._requestid }).error(error);
                }
            }

            // Ide 10 k NSERT
            counter = 0;
            while (true) {
                // Último registro en la bd destino
                if (q.id) {
                    let max = []
                    if (corpidBind['fixdate'] && columns.includes('createdate')) {
                        max = await laraigoQuery(`SELECT MAX(${q.id}) FROM "${k}" WHERE createdate < $fixdate::timestamp`, {
                            fixdate: corpidBind['fixdate']
                        });
                    }
                    else {
                        max = await laraigoQuery(`SELECT MAX(${q.id}) FROM "${k}"`);
                    }
                    if (!(max instanceof Array)) {
                        executeResult[k].errors.push({ max: max });
                        logger.child({ _requestid: corpidBind._requestid }).info(max);
                    }
                    corpidBind['maxid'] = max?.[0]?.max || 0;
                }
                
                // // Revisión del estado de la migración
                // migrationstatus = running === true ? await zyxmeQuery(`SELECT run FROM migration WHERE corpid = $corpid`, corpidBind) : migrationstatus;
                // running = migrationstatus.length > 0 ? migrationstatus[0].run : false;
                // if (!running) {
                //     break;
                // }

                // Select de la bd origen para INSERT
                let selectResult = [];
                if (corpidBind['fixdate'] && q.id) {
                    selectResult = await zyxmeQuery(`
                    SELECT ${fixsel}
                    FROM "${k}"
                    WHERE ${q.id} > $maxid
                    ORDER BY ${q.id}
                    LIMIT $limit
                    OFFSET $offset
                    `, {
                        ...corpidBind,
                        offset: counter * limit,
                        limit
                    });
                }
                else if (q.id) {
                    selectResult = await zyxmeQuery(`
                    SELECT ${fixsel}
                    FROM "${k}"
                    WHERE ${q.id} > $maxid
                    ORDER BY ${q.id}
                    LIMIT $limit
                    `, {
                        ...corpidBind,
                        offset: counter * limit,
                        limit
                    });
                }
                else if (q.insert === 'createdate') {
                    selectResult = await zyxmeQuery(`
                    SELECT ${fixsel}
                    FROM "${k}"
                    WHERE ${q.insert} > $backupdate::TIMESTAMP
                    ORDER BY ctid
                    LIMIT $limit
                    OFFSET $offset
                    `, {
                        ...corpidBind,
                        offset: counter * limit,
                        limit
                    });
                }
                else if (q.insert === 'all') {
                    selectResult = await zyxmeQuery(`
                    SELECT ${fixsel}
                    FROM "${k}"
                    ORDER BY ctid
                    LIMIT $limit
                    OFFSET $offset
                    `, {
                        ...corpidBind,
                        offset: counter * limit,
                        limit
                    });
                }
                
                if (selectResult instanceof Array) {
                    if (selectResult.length === 0 || lastloopid === selectResult?.[0]?.[`${q.id}`]) {
                        break;
                    }
                    
                    // Insert a la bd destino
                    try {
                        let insertResult = [];
                        if (q.insert === 'createdate' && q.where_ins) {
                            insertResult = await laraigoQuery(`
                            INSERT INTO ${k}
                            OVERRIDING SYSTEM VALUE
                            SELECT dt.*
                            FROM json_populate_recordset(null::record, $datatable)
                            AS dt (${dt})
                            WHERE NOT EXISTS(SELECT 1 FROM "${k}" xins WHERE ${q.where_ins})
                            `.replace('\n', ' '),
                            {
                                datatable: JSON.stringify(selectResult)
                            });
                        }
                        else {
                            if (q.id) {
                                insertResult = await laraigoQuery(`
                                INSERT INTO ${k}
                                OVERRIDING SYSTEM VALUE
                                SELECT dt.*
                                FROM json_populate_recordset(null::record, $datatable)
                                AS dt (${dt})
                                WHERE NOT EXISTS(SELECT 1 FROM "${k}" xins WHERE xins.${q.id} = dt.${q.id})
                                `.replace('\n', ' '),
                                {
                                    datatable: JSON.stringify(selectResult)
                                });
                            }
                            else {
                                insertResult = await laraigoQuery(`
                                INSERT INTO ${k}
                                OVERRIDING SYSTEM VALUE
                                SELECT dt.*
                                FROM json_populate_recordset(null::record, $datatable)
                                AS dt (${dt})
                                `.replace('\n', ' '),
                                {
                                    datatable: JSON.stringify(selectResult)
                                });
                            }
                        }
                        
                        if (!(insertResult instanceof Array)) {
                            logger.child({ _requestid: corpidBind._requestid }).info(insertResult);
                            executeResult[k].success = false;
                            executeResult[k].errors.push({ insert: insertResult });
                            for (const elem of selectResult) {
                                let eleminsertResult = []
                                if (q.insert === 'createdate' && q.where_ins) {
                                    eleminsertResult = await laraigoQuery(`
                                    INSERT INTO ${k}
                                    OVERRIDING SYSTEM VALUE
                                    SELECT dt.*
                                    FROM json_populate_recordset(null::record, $datatable)
                                    AS dt (${dt})
                                    WHERE NOT EXISTS(SELECT 1 FROM "${k}" xins WHERE ${q.where_ins})
                                    `.replace('\n', ' '),
                                    {
                                        datatable: JSON.stringify([elem])
                                    });
                                }
                                else {
                                    eleminsertResult = await laraigoQuery(`
                                    INSERT INTO ${k}
                                    OVERRIDING SYSTEM VALUE
                                    SELECT dt.*
                                    FROM json_populate_recordset(null::record, $datatable)
                                    AS dt (${dt})
                                    `.replace('\n', ' '),
                                    {
                                        datatable: JSON.stringify([elem])
                                    });
                                }
                                if (!(eleminsertResult instanceof Array)) {
                                    logger.child({ _requestid: corpidBind._requestid }).error(eleminsertResult);
                                    executeResult[k].errors.push({ insert: eleminsertResult });
                                }
                            }
                        }
                    } catch (error) {
                        logger.child({ _requestid: corpidBind._requestid }).error(error);
                        executeResult[k].errors.push({ insert: error });
                    }

                    // Counter para queries offset limit
                    counter += 1;
                    // Lastloopid para queries > id limit
                    if (q.id) {
                        lastloopid = selectResult[0][`${q.id}`];
                    }
                    // PRUEBAS Break solo para pruebas de 1 loop
                    // break;
                }
                else {
                    logger.child({ _requestid: corpidBind._requestid }).info(selectResult);
                    executeResult[k].success = false;
                    executeResult[k].errors.push({ insert: selectResult });
                    break;
                }
            }

            // // Revisión del estado de la migración
            // migrationstatus = running === true ? await zyxmeQuery(`SELECT run FROM migration WHERE corpid = $corpid`, corpidBind) : migrationstatus;
            // running = migrationstatus.length > 0 ? migrationstatus[0].run : false;
            // if (!running) {
            //     break;
            // }

            // Acciones post insert
            if (q.finally) {
                try {
                    let finallyResult = await laraigoQuery(q.finally.replace('\n', ' '));
                    if (!(finallyResult instanceof Array)) {
                        logger.child({ _requestid: corpidBind._requestid }).info(finallyResult);
                        executeResult[k].success = false;
                        executeResult[k].errors.push({ finally: finallyResult });
                    }
                } catch (error) {
                    logger.child({ _requestid: corpidBind._requestid }).error(error);
                    executeResult[k].errors.push({ finally: error });
                }
            }

            if (q.id && q.sequence) {
                // Actualizar secuencia
                const max = await laraigoQuery(`SELECT MAX(${q.id}) FROM "${k}"`);
                if (!(max instanceof Array)) {
                    executeResult[k].errors.push({ max: max });
                    logger.child({ _requestid: corpidBind._requestid }).info(max);
                }
                if (max?.[0]?.max) {
                    corpidBind['maxid'] = max?.[0]?.max;
                    let alter_seq = await laraigoQuery(`ALTER SEQUENCE ${q.sequence} START ${parseInt(max[0].max) + 1}`);
                    if (!(alter_seq instanceof Array)) {
                        executeResult[k].errors.push({ alter_seq: alter_seq });
                        logger.child({ _requestid: corpidBind._requestid }).info(alter_seq);
                    }
                    alter_seq = await laraigoQuery(`ALTER SEQUENCE ${q.sequence} RESTART`);
                    if (!(alter_seq instanceof Array)) {
                        executeResult[k].errors.push({ alter_seq: alter_seq });
                        logger.child({ _requestid: corpidBind._requestid }).info(alter_seq);
                    }
                }
            }
            logger.child({ _requestid: corpidBind._requestid }).info(`Done ${k} maxid: ${corpidBind['maxid']}`)
        } catch (error) {
            logger.child({ _requestid: corpidBind._requestid }).error(error);
            executeResult[k].success = false;
            executeResult[k].errors.push({ script: error });
        }
    };
    return executeResult;
}

const queryCore = {
    org: {
        id: 'orgid',
        sequence: 'orgseq',
        update: 'changedate',
        insert: 'id',
    },
    domain: {
        id: 'domainid',
        sequence: 'domainseq',
        update: 'changedate',
        insert: 'id',
    },
    inputvalidation: {
        id: 'inputvalidationid',
        sequence: 'inputvalidationseq',
        update: 'changedate',
        insert: 'id',
    },
    /* appintegrationid is required for communicationchannel but no values seen */
    appintegration: {
        id: 'appintegrationid',
        sequence: 'appintegrationseq',
        update: 'changedate',
        insert: 'id',
    },
    /* botconfiguration is required for communicationchannel */
    botconfiguration: {
        id: 'botconfigurationid',
        sequence: 'botconfigurationseq',
        update: 'changedate',
        insert: 'id',
    },
    communicationchannel: {
        id: 'communicationchannelid',
        sequence: 'communicationchannelseq',
        update: 'changedate',
        insert: 'id',
    },
    communicationchannelstatus: {
        id: 'communicationchannelstatusid',
        sequence: 'communicationchannelstatusseq',
        update: 'changedate',
        insert: 'id',
    },
    property: {
        id: 'propertyid',
        sequence: 'propertyseq',
        update: 'changedate',
        insert: 'id',
    },
    usr: {
        id: 'userid',
        sequence: 'userseq',
        update: 'changedate',
        insert: 'id',
    },
    usertoken: {
        id: 'usertokenid',
        sequence: 'usertokenseq',
        update: 'changedate',
        insert: 'id',
    },
    userstatus: {
        id: 'userstatusid',
        sequence: 'userstatusseq',
        update: 'changedate',
        insert: 'id',
    },
    userhistory: {
        id: 'userhistoryid',
        sequence: 'userhistoryseq',
        update: 'changedate',
        insert: 'id',
    },
    usrnotification: {
        id: 'usrnotificationid',
        sequence: 'usrnotificationid_seq',
        update: 'changedate',
        insert: 'id',
    },
    orguser: {
        delete: 'all',
        insert: 'all',
    }
}

const querySubcore = {
    classification: {
        id: 'classificationid',
        sequence: 'classificationseq',
        update: 'changedate',
        insert: 'id',
    },
    quickreply: {
        id: 'quickreplyid',
        sequence: 'quickreplyseq',
        update: 'changedate',
        insert: 'id',
    },
    person: {
        id: 'personid',
        sequence: 'personseq',
        update: 'changedate',
        where: 'OR lastcontact > $backupdate::TIMESTAMP',
        insert: 'id',
    },
    personaddinfo: {
        id: 'personaddinfoid',
        sequence: 'personaddinfoseq',
        update: 'changedate',
        insert: 'id',
    },
    personcommunicationchannel: {
        update: 'changedate',
        xupd: 'xupd.corpid = dt.corpid AND xupd.orgid = dt.orgid AND xupd.personid = dt.personid AND xupd.personcommunicationchannel = dt.personcommunicationchannel',
        insert: 'createdate',
        where_ins: 'xins.corpid = dt.corpid AND xins.orgid = dt.orgid AND xins.personid = dt.personid AND xins.personcommunicationchannel = dt.personcommunicationchannel'
    },
    personextradata: {
        id: 'personextradataid',
        sequence: 'personextradata_personextradataid_seq',
        update: 'changedate',
        insert: 'id',
    },
    post: {
        id: 'postid',
        sequence: 'postseq',
        update: 'changedate',
        insert: 'id',
    },
    pccstatus: {
        delete: 'all',
        insert: 'all',
    },
    conversation: {
        delete: '3',
        id: 'conversationid',
        sequence: 'conversationseq',
        // update: 'finishdate',
        insert: 'id',
        finally: `SELECT ufn_ticketnum_ins(orgid) FROM org`
    },
    conversationclassification: {
        update: 'changedate',
        xupd: 'xupd.corpid = dt.corpid AND xupd.orgid = dt.orgid AND xupd.conversationid = dt.conversationid AND xupd.classificationid = dt.classificationid',
        insert: 'createdate',
        where_ins: 'xins.corpid = dt.corpid AND xins.orgid = dt.orgid AND xins.conversationid = dt.conversationid AND xins.classificationid = dt.classificationid'
    },
    conversationnote: {
        id: 'conversationnoteid',
        sequence: 'conversationnoteseq',
        update: 'changedate',
        insert: 'id',
    },
    conversationpause: {
        id: 'conversationpauseid',
        sequence: 'conversationpauseseq',
        update: 'stoppause',
        insert: 'id',
    },
    conversationpending: {
        delete: 'all',
        insert: 'all',
    },
    conversationstatus: {
        id: 'conversationstatusid',
        sequence: 'conversationstatusseq',
        // update: 'changedate',
        insert: 'id',
    },
    conversationlock: {
        delete: 'all',
        insert: 'all'
    },
    conversationsupervision: {
        id: 'conversationsupervisionid',
        sequence: 'conversationsupervisionseq',
        update: 'changedate',
        insert: 'id'
    },
    conversationwhatsapp: {
        id: 'conversationwhatsappid',
        sequence: 'conversationwhatsappseq',
        update: 'conversationend',
        insert: 'id'
    },
    interaction: {
        // delete: '5',
        id: 'interactionid',
        sequence: 'interactionseq',
        // update: 'changedate',
        insert: 'id',
    },
    interaction_shoppingcart: {
        id: 'interactionid',
        insert: 'id',
    },
    interaction_whatsappcatalog: {
        id: 'interactionid',
        insert: 'id',
    },
    interactionai: {
        id: 'interactionaiid',
        sequence: 'interactionaiseq',
        insert: 'id',
    },
    surveyanswered: {
        id: 'surveyansweredid',
        sequence: 'surveyansweredseq',
        update: 'changedate',
        insert: 'id',
    },
    messagetemplate: {
        id: 'messagetemplateid',
        sequence: 'messagetemplateseq',
        update: 'changedate',
        insert: 'id',
    },
    campaign: {
        id: 'campaignid',
        sequence: 'campaignseq',
        update: 'changedate',
        where: 'OR lastrundate > $backupdate::TIMESTAMP',
        insert: 'id',
    },
    campaignmember: {
        id: 'campaignmemberid',
        sequence: 'campaignmemberseq',
        insert: 'id',
    },
    campaignhistory: {
        id: 'campaignhistoryid',
        sequence: 'campaignhistoryseq',
        update: 'changedate',
        insert: 'id',
    },
    taskscheduler: {
        id: 'taskschedulerid',
        sequence: 'taskscheduler_taskschedulerid_seq',
        update: 'datetimelastrun',
        insert: 'id',
    },
    blockversion: {
        id: 'chatblockversionid',
        sequence: 'blockversionseq',
        update: 'changedate',
        insert: 'id',
    },
    block: {
        update: 'changedate',
        xupd: 'xupd.corpid = dt.corpid AND xupd.orgid = dt.orgid AND xupd.chatblockid = dt.chatblockid',
        insert: 'createdate',
        where_ins: 'xins.corpid = dt.corpid AND xins.orgid = dt.orgid AND xins.chatblockid = dt.chatblockid'
    },
    tablevariableconfiguration: {
        id: 'tablevariableconfigurationid',
        sequence: 'tablevariableconfigurationseq',
        update: 'changedate',
        insert: 'id',
    },
    intelligentmodels: {
        id: 'intelligentmodelsid',
        sequence: 'inteligentseq',
        update: 'changedate',
        insert: 'id',
    },
    intelligentmodelsconfiguration: {
        id: 'intelligentmodelsconfigurationid',
        sequence: 'intelligentmodelsconfigurationseq',
        update: 'changedate',
        insert: 'id',
    },
    payment: {
        id: 'paymentid',
        sequence: 'paymentseq',
        update: 'changedate',
        insert: 'id',
    },
    productivity: {
        id: 'productivityid',
        sequence: 'productivityseq',
        insert: 'id',
    },
}

const queryExtras = {
    blacklist: {
        id: 'blacklistid',
        sequence: 'blacklistseq',
        update: 'changedate',
        insert: 'id',
    },
    hsmhistory: {
        id: 'hsmhistoryid',
        sequence: 'hsmhistoryseq',
        update: 'changedate',
        insert: 'id',
    },
    inappropriatewords: {
        id: 'inappropriatewordsid',
        sequence: 'inappropriatewords_inappropriatewordsid_seq',
        update: 'changedate',
        insert: 'id',
    },
    label: {
        id: 'labelid',
        sequence: 'labelseq',
        update: 'changedate',
        insert: 'id',
    },
    location: {
        id: 'locationid',
        sequence: 'locationseq',
        update: 'changedate',
        insert: 'id',
    },
    reporttemplate: {
        id: 'reporttemplateid',
        sequence: 'reporttemplateseq',
        update: 'changedate',
        insert: 'id',
    },
    sla: {
        id: 'slaid',
        sequence: 'slaseq',
        update: 'changedate',
        insert: 'id',
    },
    whitelist: {
        id: 'whitelistid',
        sequence: 'whitelistseq',
        update: 'changedate',
        insert: 'id',
    },
    appsetting: {
        id: 'appsettingid',
        sequence: 'appsetting_appsettingid_seq',
        update: 'changedate',
        insert: 'id'
    },
    balance: {
        id: 'balanceid',
        sequence: 'balanceseq',
        update: 'changedate',
        insert: 'id'
    },
    calendarbooking: {
        id: 'calendarbookingid',
        sequence: 'calendarbookingseq',
        update: 'changedate',
        insert: 'id'
    },
    calendarevent: {
        id: 'calendareventid',
        sequence: 'calendareventseq',
        update: 'changedate',
        insert: 'id'
    },
    charge: {
        id: 'chargeid',
        sequence: 'chargeseq',
        update: 'changedate',
        insert: 'id'
    },
    column: {
        id: 'columnid',
        sequence: 'columnseq',
        update: 'changedate',
        insert: 'id'
    },
    dashboardtemplate: {
        id: 'dashboardtemplateid',
        sequence: 'dashboardtemplateseq',
        update: 'changedate',
        insert: 'id'
    },
    groupconfiguration: {
        id: 'groupconfigurationid',
        sequence: 'groupconfigurationseq',
        update: 'changedate',
        insert: 'id'
    },
    historylead: {
        id: 'historyleadid',
        sequence: 'historylead_historyleadid_seq',
        update: 'changedate',
        insert: 'id'
    },
    invoice: {
        id: 'invoiceid',
        sequence: 'invoiceseq',
        update: 'changedate',
        insert: 'id'
    },
    invoicecomment: {
        id: 'invoicecommentid',
        sequence: 'invoicecommentseq',
        update: 'changedate',
        insert: 'id'
    },
    invoicedetail: {
        id: 'invoicedetailid',
        sequence: 'invoicedetailseq',
        update: 'changedate',
        insert: 'id'
    },
    kpi: {
        id: 'kpiid',
        sequence: 'kpiseq',
        update: 'tasklastrundate',
        insert: 'id'
    },
    kpihistory: {
        id: 'kpihistoryid',
        sequence: 'kpihistoryseq',
        update: 'changedate',
        insert: 'id'
    },
    lead: {
        id: 'leadid',
        sequence: 'leadseq',
        update: 'changedate',
        insert: 'id'
    },
    leadactivity: {
        id: 'leadactivityid',
        sequence: 'leadactivity_leadactivityid_seq',
        update: 'changedate',
        insert: 'id'
    },
    leadautomatizationrules: {
        id: 'leadautomatizationrulesid',
        sequence: 'leadautomatizationrulesseq',
        update: 'changedate',
        insert: 'id'
    },
    leadnotes: {
        id: 'leadnotesid',
        sequence: 'leadnotes_leadnotesid_seq',
        update: 'changedate',
        insert: 'id'
    },
    leadstatus: {
        id: 'leadstatusid',
        sequence: 'leadstatusseq',
        update: 'changedate',
        insert: 'id'
    },
    newtasks: {
        id: 'id',
        sequence: 'newtasks_id_seq',
        update: 'lastexecutiondate',
        insert: 'id'
    },
    orgchanneltypesummary: {
        delete: 'all',
        insert: 'all',
    },
    paymentcard: {
        id: 'paymentcardid',
        sequence: 'paymentcardseq',
        update: 'changedate',
        insert: 'id'
    },
    paymentorder: {
        id: 'paymentorderid',
        sequence: 'paymentorderseq',
        update: 'changedate',
        insert: 'id'
    },
    paymentpending: {
        id: 'paymentpendingid',
        sequence: 'paymentpendingseq',
        update: 'changedate',
        insert: 'id'
    },
    posthistory: {
        id: 'posthistoryid',
        sequence: 'posthistoryseq',
        update: 'changedate',
        insert: 'id'
    },
    productcatalog: {
        id: 'productcatalogid',
        sequence: 'productcatalogseq',
        update: 'changedate',
        insert: 'id'
    },
    reportscheduler: {
        id: 'reportschedulerid',
        sequence: 'reportschedulerseq',
        update: 'tasklastrundate',
        insert: 'id'
    },
    shoppingcart: {
        id: 'shoppingcartid',
        sequence: 'shoppingcartseq',
        update: 'changedate',
        insert: 'id'
    },
    voxitransferhistory: {
        id: 'voxitransferhistoryid',
        sequence: 'voxitransferhistoryseq',
        update: 'changedate',
        insert: 'id'
    },
}

const queryBilling = {
    billingartificialintelligence: {
        id: 'billingartificialintelligenceid',
        sequence: 'billingartificialintelligenceseq',
        update: 'changedate',
        insert: 'id',
    },
    billingconfiguration: {
        id: 'billingconfigurationid',
        sequence: 'billingconfigurationseq',
        update: 'changedate',
        insert: 'id',
    },
    billingconversation: {
        id: 'billingconversationid',
        sequence: 'billingconversationseq',
        update: 'changedate',
        insert: 'id',
    },
    billingmessaging: {
        id: 'billingmessagingid',
        sequence: 'billingmessagingseq',
        update: 'changedate',
        insert: 'id',
    },
    billingnotification: {
        id: 'billingnotificationid',
        sequence: 'billingnotificationseq',
        update: 'changedate',
        insert: 'id',
    },
    billingperiod: {
        update: 'lastupdate',
        xupd: 'xupd.corpid = dt.corpid AND xupd.orgid = dt.orgid AND xupd.year = dt.year AND xupd.month = dt.month',
    },
    billingperiodartificialintelligence: {
        id: 'billingperiodartificialintelligenceid',
        sequence: 'billingperiodartificialintelligenceseq',
        update: 'changedate',
        insert: 'id',
    },
    billingsupport: {
        id: 'billingsupportid',
        sequence: 'billingsupportseq',
        update: 'changedate',
        insert: 'id',
    },
}

const queryCorpSel = `SELECT corpid, description FROM corp WHERE status = 'ACTIVO'`;

exports.executeMigration = async (req, res) => {
    let { corpid, modules, backupdate, fixdate } = req.body;
    if (!!corpid && !!modules && !!backupdate) {
        const corpidBind = {
            _requestid: req._requestid,
            corpid: corpid,
            backupdate: backupdate,
            fixdate: fixdate,
        }
        let queryResult = { core: {}, subcore: {}, extras: {}, billing: {} };
        try {
            if (modules.includes('core')) {
                for (const [k,q] of Object.entries(queryCore)) {
                    queryResult.core[k] = await migrationExecute(corpidBind, { [k]: q });
                }
            }
            if (!modules.includes('core')) {
                for (const [k,q] of Object.entries(queryCore)) {
                    if (modules.includes(`core.${k}`)) {
                        queryResult.core[k] = await migrationExecute(corpidBind, { [k]: q });
                    }
                } 
            }
            if (modules.includes('subcore')) {
                for (const [k,q] of Object.entries(querySubcore)) {
                    queryResult.subcore[k] = await migrationExecute(corpidBind, { [k]: q });
                }
            }
            if (!modules.includes('subcore')) {
                for (const [k,q] of Object.entries(querySubcore)) {
                    if (modules.includes(`subcore.${k}`)) {
                        queryResult.subcore[k] = await migrationExecute(corpidBind, { [k]: q });
                    }
                } 
            }
            if (modules.includes('extras')) {
                for (const [k,q] of Object.entries(queryExtras)) {
                    queryResult.extras[k] = await migrationExecute(corpidBind, { [k]: q });
                }
            }
            if (!modules.includes('extras')) {
                for (const [k,q] of Object.entries(queryExtras)) {
                    if (modules.includes(`extras.${k}`)) {
                        queryResult.extras[k] = await migrationExecute(corpidBind, { [k]: q });
                    }
                } 
            }
            if (modules.includes('billing')) {
                for (const [k,q] of Object.entries(queryBilling)) {
                    queryResult.billing[k] = await migrationExecute(corpidBind, { [k]: q });
                }
            }
            if (!modules.includes('billing')) {
                for (const [k,q] of Object.entries(queryBilling)) {
                    if (modules.includes(`billing.${k}`)) {
                        queryResult.billing[k] = await migrationExecute(corpidBind, { [k]: q });
                    }
                } 
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