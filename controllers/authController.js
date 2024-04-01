const logger = require('../config/winston');
const { v4: uuidv4 } = require('uuid');
const { executesimpletransaction } = require('../config/triggerfunctions');
const { errors, getErrorCode, cleanPropertyValue, recaptcha, axiosObservable } = require('../config/helpers');
const { addApplication } = require('./voximplantController');

const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { loginGroup, exitFromAllGroup1 } = require('../config/firebase');

//type: int|string|bool
const properties = [
    {
        propertyname: "SONIDOPORTICKETNUEVO",
        key: "alertTicketNew",
        type: 'int'
    },
    {
        propertyname: "SONIDOPORMENSAJEENTRANTE",
        key: "alertMessageIn",
        type: 'int'
    },
    {
        propertyname: "CIERREAUTOMATICOHOLDING",
        key: "auto_close_holding",
        type: 'communicationchannelid',
        subtype: 'int'
    },
    {
        propertyname: "CIERREAUTOMATICO",
        key: "auto_close",
        type: 'communicationchannelid',
        subtype: 'int'
    },
    {
        propertyname: "TIEMPOBALANCEOLLAMADA",
        key: "time_reassign_call",
        type: 'int'
    },
    {
        propertyname: "TIMBRERINGINGBELL",
        key: "ringer_volume",
        type: 'int'
    },
    {
        propertyname: "SEGUNDOSARESPONDERLLAMADA",
        key: "seconds_to_answer_call",
        type: 'int'
    },
    {
        propertyname: "HOLDINGBYSUPERVISOR",
        key: "holding_by_supervisor",
        type: 'text'
    },
    {
        propertyname: "OCULTARLOGCONVERSACION",
        key: "hide_log_conversation",
        type: 'bool',
    },
    {
        propertyname: "BLOQUEOENVIODOCUMENTOS",
        key: "lock_send_file_pc",
        type: 'bool',
    },
    {
        propertyname: "LIMITARREASIGNACIONGRUPO",
        key: "limit_reassign_group",
        type: 'bool',
    },
    {
        propertyname: "WAITINGTIMECUSTOMERMESSAGE",
        key: "waiting_customer_message",
        type: 'text',
    },
    {
        propertyname: "FILTROFECHA",
        key: "range_date_filter",
        type: 'int',
    },
    {
        propertyname: "ETIQUETAORIGEN",
        key: "origin_label",
        type: 'bool',
    },
    {
        propertyname: "HABILITARENVIO_AUDIOS",
        key: "enable_send_audio",
        type: 'bool',
    },
    {
        propertyname: "TIPIFICACION",
        key: "obligatory_tipification_close_ticket",
        type: 'bool',
    },
];

const validateResProperty = (r, type) => {
    let vv;
    if (r instanceof Array && r.length > 0)
        vv = r[0].propertyvalue;
    else
        return null;

    if (type === "bool")
        return vv === "1"
    else if (type === "string")
        return vv
    else if (type === "int")
        return parseInt(vv);
}

exports.authenticate = async (req, res) => {
    const { data: { usr, password, facebookid, googleid, origin = "WEB", token, token_recaptcha } } = req.body;

    logger.child({ _requestid: req._requestid, body: req.body }).info(`authenticate.body`);

    const secret_recaptcha = process.env.SECRET_RECAPTCHA;

    if (origin !== "MOVIL" && secret_recaptcha && token_recaptcha) {
        const result_recaptcha = await recaptcha(secret_recaptcha, token_recaptcha);

        if ((result_recaptcha.error || !result_recaptcha.success)) {
            return res.status(401).json({ code: errors.RECAPTCHA_ERROR, ...result_recaptcha })
        }
    }

    let integration = false;
    const prevdata = { _requestid: req._requestid }
    try {
        let result;
        if (facebookid) {
            result = await executesimpletransaction("QUERY_AUTHENTICATED_BY_FACEBOOKID", { ...prevdata, facebookid });
            integration = true;
        } else if (googleid) {
            result = await executesimpletransaction("QUERY_AUTHENTICATED_BY_GOOGLEID", { ...prevdata, googleid });
            integration = true;
        } else {
            result = await executesimpletransaction("QUERY_AUTHENTICATED", { ...prevdata, usr });
        }

        if (integration && !(result instanceof Array))
            return res.status(401).json({ code: errors.LOGIN_NO_INTEGRATION });

        if (!(result instanceof Array) || result.length === 0) {
            logger.info(`auth fail: ${usr}`);
            return res.status(401).json({ code: errors.LOGIN_USER_INCORRECT });
        }

        const user = result[0];

        if (!integration) {
            const ispasswordmatch = await bcryptjs.compare(password, user.pwd)
            if (!ispasswordmatch)
                return res.status(401).json({ code: errors.LOGIN_USER_INCORRECT })
        }

        const tokenzyx = origin === "MOVIL" ? token : uuidv4();

        user.companyuser = user.company; //para evitar chancar los company enviado desde la web

        const dataSesion = {
            userid: user.userid,
            orgid: user.orgid,
            corpid: user.corpid,
            username: usr,
            status: 'ACTIVO',
            motive: null,
            token: tokenzyx,
            origin,
            type: 'LOGIN',
            description: null,
            _requestid: req._requestid,
        };
        let notifications = [];

        if (user.status === 'ACTIVO') {
            logger.info(`auth success: ${usr}`);

            if (origin === "MOVIL") {
                await exitFromAllGroup1(token)
                const resLastToken = await executesimpletransaction("UFN_GET_TOKEN_LOGGED_MOVIL", { userid: user.userid });
                if (resLastToken.length > 0) {
                    exitFromAllGroup1(resLastToken[0].token)
                }
            }

            const resConnection = await executesimpletransaction("UFN_PROPERTY_SELBYNAME", { ...user, ...prevdata, propertyname: 'CONEXIONAUTOMATICAINBOX' })

            const automaticConnection = validateResProperty(resConnection, 'bool');

            await Promise.all([
                executesimpletransaction("UFN_USERTOKEN_INS", dataSesion),
                executesimpletransaction("UFN_USERSTATUS_UPDATE", dataSesion)
            ]);

            if (automaticConnection) {
                await executesimpletransaction("UFN_USERSTATUS_UPDATE", {
                    ...prevdata,
                    ...user,
                    type: 'INBOX',
                    status: 'ACTIVO',
                    description: null,
                    motive: null,
                    username: user.usr
                })
            }

            user.token = tokenzyx;
            user.origin = origin;
            delete user.pwd;

            if (origin === "MOVIL" && /(supervisor|administrador)/gi.test(user.roledesc)) {
                await loginGroup(token, user.orgid, user.userid, req._requestid);
            }

            jwt.sign({ user }, (process.env.SECRETA ? process.env.SECRETA : "palabrasecreta"), {}, (error, token) => {
                if (error) throw error;
                delete user.corpid;
                delete user.orgid;
                delete user.userid;
                return res.json({ data: { ...user, token, automaticConnection, notifications, redirect: user.redirect || '/tickets' }, success: true });
            })

        } else if (user.status === 'PENDIENTE') {
            return res.status(401).json({ code: errors.LOGIN_USER_PENDING })
        } else if (user.status === 'BLOQUEADO') {
            if (user.lastuserstatus === 'INTENTOSFALLIDOS') {
                return res.status(401).json({ code: errors.LOGIN_LOCKED_BY_ATTEMPTS_FAILED_PASSWORD })
            } else if (user.lastuserstatus === 'INACTIVITY') {
                return res.status(401).json({ code: errors.LOGIN_LOCKED_BY_INACTIVED })
            } else if (user.lastuserstatus === 'PASSEXPIRED') {
                return res.status(401).json({ code: errors.LOGIN_LOCKED_BY_PASSWORD_EXPIRED })
            } else {
                return res.status(401).json({ code: errors.LOGIN_LOCKED })
            }
        } else {
            return res.status(401).json({ code: errors.LOGIN_USER_INACTIVE })
        }
    } catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}

exports.getUser = async (req, res) => {
    let resultProperties = {};
    const prevdata = { _requestid: req._requestid }
    const firstload = req.query.firstload;

    try {
        const resultBD = await Promise.all([
            executesimpletransaction("UFN_APPLICATION_SEL", { ...req.user, ...prevdata }),
            executesimpletransaction("UFN_ORGANIZATION_CHANGEORG_SEL", { userid: req.user.userid, ...prevdata }),
            executesimpletransaction("UFN_LEADACTIVITY_DUEDATE_SEL", { ...req.user, username: req.user.usr, ...prevdata }),
            executesimpletransaction("QUERY_SEL_PROPERTY_ON_LOGIN", undefined, false, {
                propertynames: properties.map(x => x.propertyname),
                corpid: req.user.corpid,
                orgid: req.user.orgid,
                userid: req.user.userid,
                ...prevdata
            }),
            executesimpletransaction("UFN_DOMAIN_LST_VALUES_ONLY_DATA", { ...req.user, domainname: "TIPODESCONEXION", ...prevdata }),
            executesimpletransaction("QUERY_SEL_PROPERTY_ENV_ON_LOGIN", { ...req.user }),
            ...((firstload && req.user.roledesc.split(",").some(x => ["ADMINISTRADOR", "SUPERADMIN"].includes(x))) ? [executesimpletransaction("QUERY_NEW_GETCHANNELS", { ...req.user })] : [])
        ]);
        const resultBDProperties = resultBD[3];
        const propertyEnv = resultBD[5] instanceof Array && resultBD[5].length > 0 ? resultBD[5][0].propertyvalue : "";
        const newChannels = resultBD[6] instanceof Array && resultBD[6].length > 0 ? true : false;

        if (!(resultBD[0] instanceof Array)) {
            return res.status(500).json(getErrorCode());
        }

        if (resultBDProperties instanceof Array && resultBDProperties.length > 0) {
            resultProperties = properties.reduce((acc, item) => ({
                ...acc,
                [item.key]: cleanPropertyValue(resultBDProperties.filter(x => x.propertyname === item.propertyname), item)
            }), { environment: propertyEnv });
        }

        const menu = resultBD[0].reduce((acc, item) => ({
            ...acc, [item.path]:
                [item.view ? 1 : 0,
                item.modify ? 1 : 0,
                item.insert ? 1 : 0,
                item.delete ? 1 : 0,
                item.applicationid_parent,
                item.description_parent,
                item.menuorder,
                ]
        }), {})

        jwt.sign({ user: { ...req.user, environment: propertyEnv, menu: { ...menu, "system-label": undefined, "/": undefined } } }, (process.env.SECRETA || "palabrasecreta"), {}, (error, token) => {
            if (error) throw error;
            delete req.user.token;
            // delete req.user.corpid;
            // delete req.user.orgid;
            // delete req.user.userid;
            return res.json({
                data: {
                    ...req.user,
                    menu,
                    properties: resultProperties,
                    token,
                    redirect: (firstload && req.user.roledesc.split(",").some(x => ["ADMINISTRADOR", "SUPERADMIN"].includes(x))) ? "/channels" : req.user.redirect,
                    newChannels,
                    organizations: resultBD[1],
                    notifications: resultBD[2],
                    domains: {
                        reasons_disconnection: resultBD[4]
                    }
                }
            });
        })
    } catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}

exports.logout = async (req, res) => {
    try {
        if (req.user.origin === "MOVIL") {
            await exitFromAllGroup1(req.user.token, req._requestid);
        }
        executesimpletransaction("UFN_USERSTATUS_UPDATE", { _requestid: req._requestid, ...req.user, type: 'LOGOUT', status: 'DESCONECTADO', description: null, motive: null, username: req.user.usr });
    } catch (exception) {
        logger.child({ error: { detail: exception.stack, message: exception.toString() } }).error(`Request to ${req.originalUrl}`);
    }
    return res.json({ data: null, error: false })
}

exports.connect = async (req, res) => {
    try {
        const { connect, description, motive } = req.body.data;
        executesimpletransaction("UFN_USERSTATUS_UPDATE", {
            ...req.user,
            _requestid: req._requestid,
            type: 'INBOX',
            status: connect ? 'ACTIVO' : 'DESCONECTADO',
            description,
            motive,
            username: req.user.usr
        });
    } catch (exception) {
        logger.child({ _requestid: req._requestid, error: { detail: exception.stack, message: exception.toString() } }).error(`Request to ${req.originalUrl}`);
    }
    return res.json({ data: null, error: false })
}

exports.IncrementalInsertToken = async (req, res) => {
    const result = await executesimpletransaction("UFN_USERTOKEN_INS", req.body);
    if (result instanceof Array)
        return res.json({ error: false, success: true, data: result });
    else
        return res.status(result.rescode).json(result);
}

exports.IncrementalInvokeToken = async (req, res) => {
    try {
        if (process.env.INCREMENTAL_API) {
            const res = await axiosObservable({
                method: "post",
                url: `${process.env.INCREMENTAL_API}auth/incremental/insert/token`,
                data: { 
                    userid: req.user.userid,
                    token: req.user.token,
                    origin: 'WEB',
                },
                _requestid: req._requestid,
            });
        }
        return res.json({ success: true });
    } catch (exception) {
        return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));
    }
}

exports.changeOrganization = async (req, res) => {
    const { parameters } = req.body;
    const resultBD = await executesimpletransaction("UFN_USERSTATUS_UPDATE_ORG", { ...req.user, ...parameters, _requestid: req._requestid, });

    if (!resultBD.error) {
        const newusertoken = {
            ...req.user,
            companyuser: req.user.companyuser,
            orgid: parameters.neworgid,
            corpid: parameters.newcorpid,
            corpdesc: parameters.corpdesc,
            orgdesc: parameters.orgdesc,
            _requestid: req._requestid,
            roledesc: req.user.roledesc.includes("SUPERADMIN") ? "SUPERADMIN" : resultBD[0]?.roledesc,
            redirect: resultBD[0]?.redirect || '/tickets',
            plan: resultBD[0]?.plan || '',
            currencysymbol: resultBD[0]?.currencysymbol || 'S/',
            countrycode: resultBD[0]?.countrycode || 'PE',
            paymentmethod: resultBD[0]?.paymentmethod || 'POSTPAGO',
        };

        const resBDMenu = await executesimpletransaction("UFN_APPLICATION_SEL", newusertoken);

        const menu = resBDMenu.reduce((acc, item) => ({
            ...acc, [item.path]:
                [item.view ? 1 : 0,
                item.modify ? 1 : 0,
                item.insert ? 1 : 0,
                item.delete ? 1 : 0]
        }), {});

        newusertoken.menu = { ...menu, "system-label": undefined, "/": undefined };

        let automaticConnection = false;

        if (!req.user.roledesc.includes("SUPERADMIN")) {
            const resConnection = await executesimpletransaction("UFN_PROPERTY_SELBYNAME", { ...newusertoken, propertyname: 'CONEXIONAUTOMATICAINBOX' })

            automaticConnection = validateResProperty(resConnection, 'bool');

            if (automaticConnection) {
                await executesimpletransaction("UFN_USERSTATUS_UPDATE", {
                    ...newusertoken,
                    type: 'INBOX',
                    status: 'ACTIVO',
                    description: null,
                    motive: null,
                    username: req.user.usr
                })
            }
        }

        if (req.user.origin === "MOVIL") {
            await loginGroup(req.user.token, parameters.neworgid, req.user.userid, req._requestid);
        }

        jwt.sign({ user: newusertoken }, (process.env.SECRETA || "palabrasecreta"), {}, (error, token) => {
            if (error) throw error;
            delete req.user.token;

            return res.json({ data: { token, automaticConnection } });
        })
    } else {
        return res.status(400).json(getErrorCode());
    }
}