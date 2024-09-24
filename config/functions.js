module.exports = {
    QUERY_AUTHENTICATED: {
        query: `
        SELECT us.company, us.languagesettings, us.pwdchangefirstlogin, org.description orgdesc, corp.description corpdesc, corp.domainname, corp.iconurl, corp.logourl, corp.startlogourl, corp.ispoweredbylaraigo, ous.corpid, ous.orgid, us.userid, us.usr, us.pwd, us.image, us.firstname, us.lastname, us.email, us.status, ous.groups, ous.redirect,pp.plan, string_agg(role.description,',') roledesc, COALESCE(cur.symbol, 'S/') currencysymbol, COALESCE(org.country, 'PE') countrycode, corp.paymentmethod, cc.communicationchannelsite sitevoxi, cc.communicationchannelowner ownervoxi, cc.communicationchannelid ccidvoxi, cc.voximplantcallsupervision, corp.partnerid
        FROM usr us
        INNER JOIN orguser ous ON ous.userid = us.userid
        INNER JOIN org org ON org.orgid = ous.orgid
        LEFT JOIN currency cur ON cur.code = org.currency
        INNER JOIN corp corp ON corp.corpid = ous.corpid
        LEFT JOIN paymentplan pp ON pp.paymentplanid = corp.paymentplanid
        INNER JOIN role role ON role.corpid = 1 and role.orgid = 1 and role.roleid = any(string_to_array(ous.rolegroups, ',')::bigint[])
        LEFT JOIN communicationchannel cc ON cc.corpid = ous.corpid AND cc.communicationchannelid = ANY(string_to_array(ous.channels,',')::BIGINT[]) AND cc.orgid = ous.orgid AND cc.type = 'VOXI' AND cc.status = 'ACTIVO'
        WHERE us.usr = $usr AND ous.bydefault
        AND ous.status <> 'ELIMINADO'
        AND (role.code = 'SUPERADMIN' OR (org.status = 'ACTIVO' AND corp.status = 'ACTIVO'))
        GROUP BY us.company, us.languagesettings, us.pwdchangefirstlogin, org.description, corp.description, corp.domainname, corp.iconurl, corp.logourl, corp.startlogourl, corp.ispoweredbylaraigo, ous.corpid, ous.orgid, us.userid, us.usr, us.pwd, us.image, us.firstname, us.lastname, us.email, us.status, ous.groups, ous.redirect,pp.plan, COALESCE(cur.symbol, 'S/'), COALESCE(org.country, 'PE'), corp.paymentmethod, cc.communicationchannelsite, cc.communicationchannelowner, cc.communicationchannelid, cc.voximplantcallsupervision, corp.partnerid
        LIMIT 1`,
        module: "",
        protected: false
    },
    QUERY_GET_PWD_BY_USERID: {
        query: "select pwd from usr where userid = $userid",
        module: "",
        protected: false
    },
    QUERY_AUTHENTICATED_BY_FACEBOOKID: {
        query: `
        SELECT us.company, us.languagesettings, us.languagesettings, us.pwdchangefirstlogin, org.description orgdesc, corp.description corpdesc, corp.domainname, corp.iconurl, corp.logourl, corp.startlogourl, corp.ispoweredbylaraigo, ous.corpid, ous.orgid, us.userid,
		us.usr, us.pwd, us.firstname, us.image, us.lastname, us.email, us.status, ous.groups, ous.redirect, pp.plan,
		string_agg(role.description,',') roledesc, COALESCE(cur.symbol, 'S/') currencysymbol, COALESCE(org.country, 'PE') countrycode, corp.paymentmethod, cc.communicationchannelsite sitevoxi,
		cc.communicationchannelowner ownervoxi, cc.communicationchannelid ccidvoxi, cc.voximplantcallsupervision, corp.partnerid
        from usr us
        INNER JOIN orguser ous on ous.userid = us.userid
        INNER JOIN org org on org.orgid = ous.orgid
        LEFT JOIN currency cur on cur.code = org.currency
        INNER JOIN corp corp on corp.corpid = ous.corpid
        LEFT JOIN paymentplan pp ON pp.paymentplanid = corp.paymentplanid
        INNER JOIN role role ON role.corpid = 1 and role.orgid = 1 and role.roleid = any(string_to_array(ous.rolegroups, ',')::bigint[])
        LEFT JOIN communicationchannel cc ON cc.corpid = ous.corpid AND cc.orgid = ous.orgid AND cc.type = 'VOXI' AND us.status = 'ACTIVO'
        WHERE us.facebookid = $facebookid
        AND ous.bydefault
        AND ous.status <> 'ELIMINADO'
        AND (role.code = 'SUPERADMIN' OR (org.status = 'ACTIVO' AND corp.status = 'ACTIVO'))
        GROUP BY us.company, us.languagesettings, us.pwdchangefirstlogin, org.description, corp.description, corp.domainname, corp.iconurl, corp.logourl, corp.startlogourl, corp.ispoweredbylaraigo, ous.corpid, ous.orgid, us.userid, us.usr, us.pwd, us.image, us.firstname, us.lastname, us.email, us.status, ous.groups, ous.redirect,pp.plan, COALESCE(cur.symbol, 'S/'), COALESCE(org.country, 'PE'), corp.paymentmethod, cc.communicationchannelsite, cc.communicationchannelowner, cc.communicationchannelid, cc.voximplantcallsupervision, corp.partnerid
        LIMIT 1`,
        module: "",
        protected: false
    },
    QUERY_AUTHENTICATED_BY_GOOGLEID: {
        query: `
        SELECT us.company, us.languagesettings, us.languagesettings, us.pwdchangefirstlogin, org.description orgdesc, corp.description corpdesc, corp.domainname, corp.iconurl, corp.logourl, corp.startlogourl, corp.ispoweredbylaraigo, ous.corpid,
        ous.orgid, us.userid, us.usr, us.pwd,
        us.firstname, us.image, us.lastname, us.email, us.status,
        ous.groups, ous.redirect, pp.plan, COALESCE(cur.symbol, 'S/') currencysymbol,
        COALESCE(org.country, 'PE') countrycode, corp.paymentmethod, cc.communicationchannelsite sitevoxi,
        cc.communicationchannelowner ownervoxi, cc.communicationchannelid ccidvoxi, cc.voximplantcallsupervision,
        string_agg(role.description,',') roledesc, corp.partnerid
        from usr us
        INNER JOIN orguser ous on ous.userid = us.userid
        INNER JOIN org org on org.orgid = ous.orgid left join currency cur on cur.code = org.currency
        INNER JOIN corp corp on corp.corpid = ous.corpid LEFT JOIN paymentplan pp ON pp.paymentplanid = corp.paymentplanid
        INNER JOIN role role ON role.corpid = 1 and role.orgid = 1 and role.roleid = any(string_to_array(ous.rolegroups, ',')::bigint[])
        LEFT JOIN communicationchannel cc ON cc.corpid = ous.corpid AND cc.orgid = ous.orgid AND cc.type = 'VOXI' AND cc.status = 'ACTIVO'
        WHERE us.googleid = $googleid
        AND ous.bydefault
        AND ous.status <> 'ELIMINADO'
        AND (role.code = 'SUPERADMIN' OR (org.status = 'ACTIVO' AND corp.status = 'ACTIVO'))
        GROUP BY us.company, us.languagesettings, us.pwdchangefirstlogin, org.description, corp.description, corp.domainname, corp.iconurl, corp.logourl, corp.startlogourl, corp.ispoweredbylaraigo, ous.corpid, ous.orgid, us.userid, us.usr, us.pwd, us.image, us.firstname, us.lastname, us.email, us.status, ous.groups, ous.redirect,pp.plan, COALESCE(cur.symbol, 'S/'), COALESCE(org.country, 'PE'), corp.paymentmethod, cc.communicationchannelsite, cc.communicationchannelowner, cc.communicationchannelid, cc.voximplantcallsupervision, corp.partnerid
        LIMIT 1`,
        module: "",
        protected: false
    },
    QUERY_VALIDATE_CUR: {
        query: `
        SELECT * from deliveryroutecode drc
        WHERE drc.userid = $userid and drc.status = 'ACTIVO' and drc.code = $cur
        LIMIT 10
        `,
        module: "/extras/users",
        protected: "SELECT"
    },
    QUERY_NEW_GETCHANNELS: {
        query: "SELECT cc.communicationchannelid, cc.description FROM communicationchannel cc WHERE cc.corpid = $corpid AND cc.orgid = $orgid AND cc.type NOT IN ('FORM', 'VOXI', 'FBWA', 'INST') AND cc.status = 'INACTIVO'",
        module: "/extras/users",
        protected: "SELECT"
    },
    UFN_CORP_ORG_SEL: {
        query: "SELECT * FROM ufn_corp_org_sel($corpid, $id, $username, $all, $userid)",
        module: ["/extras/emojis", "/extras/users"],
        protected: "SELECT"
    },
    GET_CONTRACT: {
        query: 'SELECT * FROM paymentplan where "code" = $code AND status = \'ACTIVO\';',
        module: "",
        protected: "SELECT"
    },
    QUERY_GET_CONVERSATION: {
        query: `SELECT postexternalid as call_session_history_id, corpid, orgid 
        from conversation 
        where conversationid = $conversationid
        and corpid = $corpid
        and orgid = $orgid`,
        module: "/api",
        protected: "SELECT"
    },
    UFN_USER_SEL: {
        query: "SELECT * FROM ufn_user_sel($corpid, $orgid, $id, $username, $all, $userid)",
        module: ["/extras/users", "/tickets"],
        protected: "SELECT"
    },
    UFN_USER_LST: {
        query: "SELECT * FROM ufn_user_lst($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_APPLICATION_SEL: {
        query: "SELECT * FROM ufn_application_sel($corpid, $orgid, $userid)",
        module: "",
        protected: ""
    },
    UFN_ORGUSER_SEL: {
        query: "SELECT * FROM ufn_orguser_sel($corpid, $orgid, $userid, $username, $all)",
        module: ["/extras/users"],
        protected: "SELECT"
    },
    UFN_LIST_PERSONS_BY_ORG_SEL: {
        query: "SELECT * FROM ufn_list_persons_by_org_sel($corpid, $orgid)",
        module: "/extras/users",
        protected: "SELECT"
    },
    UFN_ORGUSER_INS: {
        query: "SELECT * FROM ufn_orguser_ins($corpid, $orgid, $p_userid, $rolegroups, $usersupervisor, $bydefault, $labels, $groups, $channels, $status,$type, $defaultsort, $username, $operation, $redirect, $storeid, $warehouseid, $showbots)",
        module: "/extras/users",
        protected: "INSERT"
    },
    UFN_STORE_INS: {
        query: "SELECT * FROM ufn_store_ins($corpid, $orgid, $id, $description, $phone, $address, $warehouseid, $coveragearea , $warehouseinstore, $type , $status, $username, $operation)",
        module: "/extras/users",
        protected: "INSERT"
    },
    UFN_STORE_SEL: {
        query: "SELECT * FROM ufn_store_sel($id, $all)",
        module: "/extras/users",
        protected: "SELECT"
    },
    QUERY_UPDATE_APIKEY: {
        query: `UPDATE orguser SET
            apikey = $apikey
            WHERE corpid = $corpid
            AND orgid = $orgid
            AND userid = $userid
            `,
        module: "/extras/users",
        protected: "INSERT"
    },
    QUERY_GET_DATA_FROM_APIKEY: {
        query: `SELECT userid, corpid, orgid FROM orguser WHERE apikey = $apikey`,
        module: "/extras/users",
        protected: "INSERT"
    },
    QUERY_GET_DATA_FROM_REPORT: {
        query: `SELECT rp.reporttemplateid, rp.columnjson, rp.filterjson, rp.summaryjson
		FROM reporttemplate rp 
		WHERE rp.corpid = $corpid
		AND rp.orgid = $orgid
        AND nameapi = $reportname
		AND rp.status <> 'ELIMINADO'`,
        module: "/extras/users",
        protected: "INSERT"
    },
    QUERY_GET_DATA_FROM_DESIGNER: {
        query: `SELECT rp.columnjson, rp.filterjson, rp.summaryjson, rp.description
		FROM reporttemplate rp 
		WHERE rp.corpid = $corpid
		AND rp.orgid = $orgid
        AND rp.reporttemplateid = $reporttemplateid
		AND rp.status <> 'ELIMINADO'`,
        module: "",
        protected: "INSERT"
    },
    QUERY_WHITELIST: {
        query: `select ipstart from ipwhitelist
        where corpid = $corpid
        and orgid = $orgid
        and status = 'ACTIVO'`,
        module: "/extras/users",
        protected: "INSERT"
    },
    UFN_AUDIT_SEL: {
        query: "SELECT * FROM ufn_audit_sel($corpid, $orgid, $startdate, $enddate, $offset)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_AUDIT_INS: {
        query: "SELECT * FROM ufn_audit_ins($corpid, $orgid, $description, 0, $type, $status, $origin, $parameters, $userid, $username)",
        module: [],
        protected: "INSERT"
    },
    UFN_USER_INS: {
        query: "SELECT * FROM ufn_user_ins($corpid, $orgid, $id, $usr, $doctype, $docnum, $password, $firstname, $lastname, $email, $pwdchangefirstlogin, $type, $status, $description, $username, $operation, $company, $twofactorauthentication, $registercode, $billinggroup, $image, '', $variablecontext)",
        module: ["/extras/users"],
        protected: "INSERT"
    },
    UFN_COMMUNICATIONCHANNEL_LST: {
        query: "SELECT * FROM ufn_communicationchannel_lst($corpid, $orgid)",
        module: [
            "/supervisor",
            "/tickets",
            "/automatizationrules",
            "/extras/sla",
            "/reports",
            "/message_inbox",
            "/crm",
            "/dashboard",
            "/postcreator",
            "/servicedesk",
            "/calendar",
            "/extras/campaign",
            "/extras/users",
            "/person"
        ],
        protected: "SELECT"
    },
    UFN_PROPERTY_SEL: {
        query: "SELECT * FROM ufn_property_sel($corpid, $propertyname, $description, $category, $level, $id, $username, $all, $offset)",
        module: [
            "/organizations",
            "/supervisor",
            "/tickets",
            "/extras/properties",
            "/message_inbox",
            "/extras/campaign",
            "/message_inbox",
            "/supervisor"
        ],
        protected: "SELECT"
    },
    UFN_PROPERTY_SETTINGS_SEL: {
        query: "SELECT * FROM ufn_property_settings_sel($corpid, $orgid)",
        module: "/extras/properties",
        protected: "SELECT"
    },
    UFN_PROPERTY_SETTINGS_UPD: {
        query: "SELECT * FROM ufn_property_settings_upd($corpid, $orgid, $id, $propertyvalue, $username )",
        module: "/extras/properties",
        protected: "SELECT"
    },
    UFN_DISTINCT_PROPERTY_SEL: {
        query: "SELECT * FROM ufn_distinct_property_sel($corpid, $category, $level)",
        module: ["/extras/properties"],
        protected: "SELECT"
    },
    UFN_USER_SUPERVISOR_LST: {
        query: "SELECT * FROM ufn_user_supervisor_lst($corpid, $orgid, $userid)",
        module: ["/extras/users", "/dashboard"],
        protected: "SELECT"
    },
    UFN_APPS_DATA_SEL: {
        query: "SELECT * FROM UFN_APPS_DATA_SEL($roleid)",
        module: "",
        protected: "SELECT"
    },
    UFN_ROLE_LST: {
        query: "SELECT * FROM ufn_role_lst($corpid, $orgid, $userid)",
        module: ["/extras/users", "/person", "/crm", "/servicedesk"],
        protected: "SELECT"
    },
    UFN_PROPERTY_INS: {
        query: "SELECT * FROM ufn_property_ins($corpid, $orgid, $communicationchannelid, $id, $propertyname, $propertyvalue, $description, $status, $type, $category, $domainname, $group, $level, $username, $operation, $config)",
        module: ["/extras/properties"],
        protected: "SELECT"
    },
    UFN_CONVERSATION_QUEUE_USERGROUSEL: {
        query: "SELECT * FROM ufn_conversation_queue_usergrousel($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_GROUPCONFIGURATION_SEL: {
        query: "SELECT * FROM ufn_groupconfiguration_sel($corpid, $orgid, $id, $username, $all)",
        module: ["/extras/groupconfig"],
        protected: "SELECT"
    },
    UFN_GROUPCONFIGURATION_INS: {
        query: "SELECT * FROM ufn_groupconfiguration_ins($corpid, $orgid, $id, $operation, $domainid, $description, $type, $status, $username, $quantity, $validationtext)",
        module: ["/extras/groupconfig"],
        protected: "INSERT"
    },
    UFN_WHITELIST_SEL: {
        query: "SELECT * FROM ufn_whitelist_sel($corpid, $orgid, $username, $id, $all)",
        module: ["/extras/whitelist"],
        protected: "SELECT"
    },
    UFN_WHITELIST_INS: {
        query: "SELECT * FROM ufn_whitelist_ins($corpid, $orgid, $id, $operation, $phone, $documenttype, $documentnumber, $usergroup, $type, $status, $asesorname, $username)",
        module: ["/extras/whitelist"],
        protected: "INSERT"
    },
    UFN_INAPPROPRIATEWORDS_LST: {
        query: "SELECT * FROM ufn_inappropriatewords_lst($corpid, $orgid)",
        module: ["/supervisor", "/message_inbox"],
        protected: "SELECT"
    },
    UFN_INAPPROPRIATEWORDS_SEL: {
        query: "SELECT * FROM ufn_inappropriatewords_sel($corpid, $orgid, $id, $username)",
        module: ["/extras/inappropriatewords"],
        protected: "SELECT"
    },
    UFN_INAPPROPRIATEWORDS_INS: {
        query: "SELECT * FROM ufn_inappropriatewords_ins($id, $corpid, $orgid, $description, $status, $type, $username, $classification, $defaultanswer, $operation)",
        module: ["/extras/inappropriatewords"],
        protected: "INSERT"
    },
    UFN_INAPPROPRIATEWORDS_INS_ARRAY: {
        query: "SELECT * FROM ufn_inappropriatewords_ins_array($corpid, $orgid, $username, $table)",
        module: ["/extras/inappropriatewords"],
        protected: "INSERT"
    },
    UFN_PERSON_TOTALRECORDS: {
        query: "SELECT * FROM ufn_person_totalrecords($corpid, $orgid, $where, $startdate, $enddate, $offset, $userids, $channeltypes)",
        module: ["/person", "/crm", "/servicedesk", "/message_inbox", "/supervisor"],
        protected: "SELECT"
    },
    UFN_PERSON_SEL: {
        query: "SELECT  * FROM ufn_person_sel($corpid, $orgid, $username, $where, $order, $take, $skip, $startdate, $enddate, $offset, $userids, $channeltypes)",
        module: ["/person", "/crm", "/servicedesk", "/message_inbox", "/supervisor"],
        protected: "SELECT"
    },
    UFN_PERSON_EXPORT: {
        query: "SELECT * FROM ufn_person_export($corpid, $orgid, $where, $order, $startdate, $enddate, $offset, $userids, $personcommunicationchannels )",
        module: ["/person"],
        protected: "SELECT"
    },
    UFN_CONVERSATION_SEL_PERSON: {
        query: "select * from ufn_conversation_sel_person($personid, $take, $skip, $where, $order, $offset)",
        module: ["/person"],
        protected: "SELECT"
    },
    UFN_PERSONCOMMUNICATIONCHANNEL_INS: {
        query: "SELECT * FROM ufn_personcommunicationchannel_ins($corpid, $orgid, $personid, $personcommunicationchannel, $personcommunicationchannelowner, $displayname, $type, $username, $operation, $status)",
        module: "/person",
        protected: "INSERT"
    },
    UFN_PERSONCOMMUNICATIONCHANNEL_SEL: {
        query: "SELECT * FROM ufn_personcommunicationchannel_sel($corpid, $orgid, $personid,  $personcommunicationchannel, $username, $all)",
        module: ["/person"],
        protected: "SELECT"
    },
    UFN_PERSONCOMMUNICATIONCHANNEL_UPDATE_LOCKED: {
        query: "SELECT * FROM ufn_personcommunicationchannel_update_locked($corpid, $orgid, $personid, $personcommunicationchannel, $username, $locked)",
        module: ["/person"],
        protected: "INSERT"
    },
    UFN_PERSONCOMMUNICATIONCHANNEL_UPDATE_LOCKED_ARRAY: {
        query: "SELECT * FROM ufn_personcommunicationchannel_update_locked_array($corpid, $orgid, $username, $table)",
        module: ["/person"],
        protected: "INSERT"
    },
    UFN_PERSONREFERRER_SEL: {
        query: "SELECT * FROM ufn_personreferrer_sel($personid)",
        module: ["/person"],
        protected: "SELECT"
    },
    UFN_PERSONADDINFO_SEL: {
        query: "SELECT * FROM ufn_personaddinfo_sel($personid)",
        module: "/person",
        protected: "SELECT"
    },
    UFN_INTELLIGENTMODELS_SEL: {
        query: "SELECT * FROM ufn_intelligentmodels_sel($corpid, $orgid, $username, $id, $all)",
        module: ["/iaconectors"],
        protected: "SELECT"
    },
    UFN_INTELLIGENTMODELS_INS: {
        query: "SELECT * FROM ufn_intelligentmodels_ins($corpid, $orgid, $id, $operation, $description, $endpoint, $modelid, $provider, $name, $apikey, $type, $status, $username) ",
        module: ["/iaconectors"],
        protected: "INSERT"
    },
    UFN_SLA_SEL: {
        query: "SELECT * FROM ufn_sla_sel($corpid , $orgid , $id , $username , $all)",
        module: ["/extras/sla", "/servicedesk"],
        protected: "SELECT"
    },
    UFN_SLA_INS: {
        query: "SELECT * FROM ufn_sla_ins( $corpid, $orgid, $id, $description, $type, $company, $communicationchannelid, $usergroup, $status, $totaltmo, $totaltmomin, $totaltmopercentmax, $totaltmopercentmin, $usertmo, $usertmomin, $usertmopercentmax, $usertmopercentmin, $tme, $tmemin, $tmepercentmax, $tmepercentmin, $usertme, $usertmemin, $usertmepercentmax, $usertmepercentmin, $productivitybyhour, $username, $operation, $criticality, $service_times )",
        module: ["/extras/sla"],
        protected: "INSERT"
    },
    UFN_REPORT_SEL: {
        query: "SELECT * FROM ufn_report_sel($corpid , $orgid , $reportname  , $username , $all)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_COLUMN_SEL: {
        query: "SELECT * FROM ufn_report_column_sel($function, $all)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_HOURS_SEL: {
        query: "SELECT * FROM ufn_report_hours_sel($all)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_INPUTRETRY_SEL: {
        query: "SELECT * FROM ufn_report_inputretry_sel($corpid , $orgid, $take, $skip, $where, $order, $userid, $startdate, $enddate, $maxx, $maxy, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_INPUTRETRY_TOTALRECORDS: {
        query: "SELECT * FROM ufn_report_inputretry_totalrecords($corpid , $orgid, $where, $userid, $startdate, $enddate, $maxx, $maxy, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_INPUTRETRY_EXPORT: {
        query: "SELECT * FROM ufn_report_inputretry_export($corpid , $orgid, $where, $order, $userid, $startdate, $enddate, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_INPUTRETRY_GRAPHIC: {
        query: "SELECT * FROM ufn_report_inputretry_graphic($corpid , $orgid, $where, $order, $userid, $startdate, $enddate, $column, $summarization, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_INTERACTION_CHATFLOWCARDID: {
        query: "SELECT * FROM ufn_interaction_chatflowcardid($corpid , $orgid, $startdate, $enddate, $chatflowcardid, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_TIPIFICATION_SEL: {
        query: "SELECT * FROM ufn_report_tipification_sel($corpid , $orgid, $take, $skip, $where, $order, $channel, $userid, $startdate, $enddate, $offset, $distinct)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_TIPIFICATION_TOTALRECORDS: {
        query: "SELECT * FROM ufn_report_tipification_totalrecords($corpid , $orgid, $where, $channel, $userid, $startdate, $enddate, $offset, $distinct)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_TIPIFICATION_EXPORT: {
        query: "SELECT * FROM ufn_report_tipification_export($corpid , $orgid, $where, $order, $channel, $userid, $startdate, $enddate, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_TIPIFICATION_GRAPHIC: {
        query: "SELECT * FROM ufn_report_tipification_graphic($corpid , $orgid, $where, $order, $userid, $startdate, $enddate, $column, $summarization, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_INTERACTION_SEL: {
        query: "SELECT * FROM ufn_report_interaction_sel($corpid , $orgid, $take, $skip, $where, $order, $channel, $userid, $startdate, $enddate, $offset, $distinct)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_INTERACTION_TOTALRECORDS: {
        query: "SELECT * FROM ufn_report_interaction_totalrecords($corpid , $orgid, $where, $channel, $userid, $startdate, $enddate, $offset,$distinct)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_INTERACTION_EXPORT: {
        query: "SELECT * FROM ufn_report_interaction_export($corpid , $orgid, $where, $order, $channel, $userid, $startdate, $enddate, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_INTERACTION_GRAPHIC: {
        query: "SELECT * FROM ufn_report_interaction_graphic($corpid , $orgid, $where, $order, $userid, $startdate, $enddate, $column, $summarization, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_PRODUCTIVITY_SEL: {
        query: "SELECT * FROM ufn_report_productivity_sel($corpid, $orgid, $take, $skip, $where, $order, $channel, $userid, $startdate, $enddate, $offset, $distinct)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_PRODUCTIVITY_TOTALRECORDS: {
        query: "SELECT * FROM ufn_report_productivity_totalrecords($corpid , $orgid, $where, $channel, $userid, $startdate, $enddate, $offset, $distinct)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_PRODUCTIVITY_EXPORT: {
        query: "SELECT * FROM ufn_report_productivity_export($corpid , $orgid, $where, $order, $channel, $userid, $startdate, $enddate, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_PRODUCTIVITY_GRAPHIC: {
        query: "SELECT * FROM ufn_report_productivity_graphic($corpid , $orgid, $where, $order, $userid, $startdate, $enddate, $column, $summarization, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_USERPRODUCTIVITYHOURS_SEL: {
        query: "SELECT * FROM ufn_report_userproductivityhours_sel($corpid , $orgid, $startdate, $enddate, $channel, $hours, $asesorid, $take, $skip, $where, $order, $userid, $offset,$distinct)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_USERPRODUCTIVITYHOURS_TOTALRECORDS: {
        query: "SELECT * FROM ufn_report_userproductivityhours_totalrecords($corpid , $orgid, $startdate, $enddate, $channel, $hours, $asesorid, $where, $userid, $offset,$distinct)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_USERPRODUCTIVITYHOURS_EXPORT: {
        query: "SELECT * FROM ufn_report_userproductivityhours_export($corpid , $orgid, $startdate, $enddate, $channel, $hours, $asesorid, $where, $order, $userid, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_USERPRODUCTIVITYHOURS_GRAPHIC: {
        query: "SELECT * FROM ufn_report_userproductivityhours_graphic($corpid , $orgid, $startdate, $enddate, $channel, $hours, $asesorid, $where, $order, $userid, $column, $summarization, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_USER_ASESORBYORGID_LST: {
        query: "SELECT * FROM ufn_user_asesorbyorgid_lst($corpid , $orgid, $userid)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_USRNOTIFICATION_USRID_SEL: {
        query: "SELECT * FROM ufn_usrnotification_usrid_sel($corpid , $orgid, $userid, $usrnotificationid, $all, $username)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_LOGINHISTORY_SEL: {
        query: "SELECT * FROM ufn_loginhistory_sel($corpid , $orgid, $take, $skip, $where, $order, $startdate, $enddate, $offset, $userid, $distinct)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_LOGINHISTORY_TOTALRECORDS: {
        query: "SELECT * FROM ufn_loginhistory_totalrecords($corpid , $orgid, $where, $startdate, $enddate, $offset, $userid, $distinct)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_LOGINHISTORY_EXPORT: {
        query: "SELECT * FROM ufn_loginhistory_export($corpid , $orgid, $where, $order, $startdate, $enddate, $offset, $userid)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_LOGINHISTORY_GRAPHIC: {
        query: "SELECT * FROM ufn_loginhistory_graphic($corpid , $orgid, $where, $order, $startdate, $enddate, $column, $summarization, $offset, $userid)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_USERPRODUCTIVITY_SEL: {
        query: "SELECT * FROM ufn_report_userproductivity_sel($corpid , $orgid, $channel, $startdate, $enddate, $userstatus, $usergroup, $bot, $userid, $offset)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_USERPRODUCTIVITY_GRAPHIC: {
        query: "SELECT * FROM ufn_report_userproductivity_graphic($corpid , $orgid, $channel, $startdate, $enddate, $userstatus, $usergroup, $bot, $userid, $column, $summarization, $offset)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_EMOJI_ALL_SEL: {
        query: "select * from ufn_emoji_all_sel($corpid , $orgid , $userid , $all);",
        module: ["/extras/emojis", "/supervisor", "/message_inbox"],
        protected: "SELECT"
    },
    UFN_EMOJI_SEL: {
        query: "select orgid, favoritechannels, restrictedchannels from emoji where corpid = $corpid and emojidec = $emojidec and status <> 'ELIMINADO';",
        module: "/extras/emojis",
        protected: "SELECT"
    },
    UFN_EMOJI_INS: {
        query: "select * from ufn_emoji_ins($corpid, $orgid, $description, $emojichar, $emojidec, $emojihex, $categorydesc, $categoryorder, $communicationchannel, $favoritechannels, $restrictedchannels, $favorite, $restricted, $username);",
        module: ["/extras/emojis"],
        protected: "SELECT"
    },
    UFN_CONVERSATIONGRID_SEL: {
        query: "SELECT * FROM ufn_conversationgrid_sel($corpid, $orgid, $take, $skip, $where, $order, $userid, $startdate, $enddate, $channel, $usergroup, $lastuserid, $campaignid, $offset)",
        module: ["/tickets"],
        protected: "SELECT"
    },
    UFN_CONVERSATIONGRID_TOTALRECORDS: {
        query: "SELECT * FROM ufn_conversationgrid_totalrecords($corpid, $orgid, $where, $userid, $startdate, $enddate, $channel, $usergroup, $lastuserid, $campaignid, $offset)",
        module: ["/tickets"],
        protected: "SELECT"
    },
    UFN_CONVERSATIONGRID_EXPORT: {
        query: "SELECT * FROM ufn_conversationgrid_export($corpid, $orgid, $where, $order, $userid, $startdate, $enddate, $channel, $usergroup, $lastuserid, $campaignid, $offset)",
        module: ["/tickets"],
        protected: "SELECT"
    },
    UFN_COMMUNICATIONCHANNELID_LST_USRDELEGATE: {
        query: "SELECT * FROM ufn_communicationchannelid_lst_usrdelegate($corpid, $orgid, $userid, $communicationchannelid)",
        module: ["/tickets"],
        protected: "SELECT"
    },
    UFN_CONVERSATIONCLASSIFICATION_INS_MASSIVE: {
        query: "SELECT * FROM ufn_conversationclassification_ins_massive($conversationid, $classificationid, $username)",
        module: ["/tickets"],
        protected: "SELECT"
    },
    UFN_DOMAIN_SEL: {
        query: "SELECT * FROM ufn_domain_sel($corpid , $orgid , $domainname  , $username , $all)",
        module: ["/extras/domains"],
        protected: "SELECT"
    },
    UFN_DOMAIN_VALUES_SEL: {
        query: "SELECT * FROM ufn_domain_values_sel($corpid , $orgid , $domainname  , $username , $all)",
        module: ["/extras/domains", "/reportscheduler"],
        protected: "SELECT"
    },
    UFN_DOMAIN_INS: {
        query: "SELECT * FROM ufn_domain_ins($id , $corpid , $orgid , $domainname, $description, $type, $status  , $username , $operation )",
        module: ["/extras/domains"],
        protected: "INSERT"
    },
    UFN_DOMAIN_VALUES_INS: {
        query: "SELECT * FROM ufn_domain_value_ins($id , $corpid , $orgid , $domainname  , $description , $domainvalue , $domaindesc, $system, $status, $type , $bydefault, $username, $operation)",
        module: ["/extras/domains"],
        protected: "INSERT"
    },
    UFN_CLASSIFICATION_SEL: {
        query: "SELECT * FROM ufn_classification_sel($corpid, $orgid, $id, $username, $all)",
        module: ["/extras/tipifications"],
        protected: "SELECT"
    },
    UFN_QUICKREPLY_SEL: {
        query: "SELECT * FROM ufn_quickreply_sel($corpid , $orgid , $id  , $username , $all)",
        module: ["/extras/quickreplies"],
        protected: "SELECT"
    },
    UFN_CORP_SEL: {
        query: "SELECT * FROM ufn_corp_sel($corpid, $orgid, $id, $username, $all)",
        module: ["/organizations", "/corporations", "/invoice", "/extras/properties", "/billing_setups"],
        protected: "SELECT"
    },
    QUERY_ORDER_DETAIL_CARD: {
        query: `select o2.name, o2.email, o2.phone, o2.orderid, o2.createdate, ol.title producttitle, o2.amount orderamount, o2.currency, ol.quantity, ol.unitprice, ol.productmetaid productid, ol.amount detailamount, o2.address
        from (
            select o.corpid, o.orgid, p.name, p.email, p.phone, o.orderid, o.createdate, o.amount, o.currency, c.variablecontextsimple->>'address' address
            from "order" o
            join person p on p.corpid = o.corpid and p.orgid = o.orgid and p.personid = o.personid
            join conversation c on c.corpid = o.corpid and c.orgid = o.orgid and c.conversationid = o.conversationid
            where o.corpid = $corpid and o.orgid = $orgid and o.personid = $personid and o.status = 'ACTIVO'
            order by orderid desc
            limit $limit
        ) o2
        join orderline ol on ol.corpid = o2.corpid and ol.orgid = o2.orgid and ol.orderid = o2.orderid
        order by o2.orderid desc
        `,
        module: "",
        protected: "SELECT"
    },
    UFN_CORP_INS: {
        query: "SELECT * FROM ufn_corp_ins($id, $description, $status, $type, $username, $operation, $logo, $logotype, $companysize, $paymentplanid, $doctype, $docnum, $businessname, $fiscaladdress, $sunatcountry, $contactemail, $contact, $autosendinvoice, $billbyorg, $credittype, $paymentmethod, $automaticpayment, $automaticperiod, $automaticinvoice, $partner, $appsettingid, $citybillingid, $domainname, $iconurl, $logourl, $startlogourl, $ispoweredbylaraigo)",
        module: ["/corporations"],
        protected: "INSERT"
    },
    QUERY_GET_INFO_DOMAIN: {
        query: "select domainname, iconurl, logourl, startlogourl, ispoweredbylaraigo, description as corpdesc from corp where LOWER(domainname) = LOWER($subdomain)",
        module: ["/corporations"],
        protected: "INSERT"
    },
    QUERY_GET_UPDATE_DOMAIN: {
        query: "select domainname from corp where corpid = $corpid",
        module: ["/corporations"],
        protected: "INSERT"
    },
    UFN_ORG_SEL: {
        query: "SELECT * FROM ufn_org_sel($corpid , $orgid , $all)",
        module: ["/organizations", "/timesheet", "/invoice", "/extras/properties", "/extras/botdesigner", "/billing_setups"],
        protected: "SELECT"
    },
    UFN_BUSINESSDOCTYPE_SEL: {
        query: "SELECT * FROM ufn_businessdoctype_sel()",
        module: "",
        protected: "SELECT"
    },
    UFN_ORG_INS: {
        query: "SELECT * FROM ufn_org_ins($corpid, $id, $description, $status, $type, $username, $operation, $email, $password, $port, $host, $default_credentials, $ssl, $private_mail, $currency, $country, $timezoneoffset, $timezone, $doctype, $docnum, $businessname, $fiscaladdress, $sunatcountry, $contactemail, $contact, $autosendinvoice, $iconbot, $iconadvisor, $iconclient, $credittype, $automaticpayment, $automaticperiod, $automaticinvoice, $voximplantautomaticrecharge, $voximplantrechargerange, $voximplantrechargepercentage, $voximplantrechargefixed, $voximplantadditionalperchannel, $appsettingid, $citybillingid, $variablecontext, $paymentplanid)",
        module: ["/organizations", "/extras/users"],
        protected: "INSERT"
    },
    UFN_QUICKREPLY_INS: {
        query: "SELECT * FROM ufn_quickreply_ins($corpid, $orgid, $id, $classificationid, $description, $quickreply, $status, $type, $username, $operation, $favorite, $body, $bodyobject, $quickreply_type, $quickreply_priority, $attachment)",
        module: ["/extras/quickreplies"],
        protected: "INSERT"
    },
    UFN_CORPBYUSER_LST: {
        query: "SELECT * FROM ufn_corpbyuser_lst($userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_ORGBYCORLST: {
        query: "SELECT * FROM ufn_orgbycorlst($corpid)",
        module: "",
        protected: "SELECT"
    },
    UFN_COMMUNICATIONCHANNELBYORG_LST: {
        query: "SELECT * FROM ufn_communicationchannelbyorg_lst($orgid)",
        module: ["/extras/users", "/iaconfigurations", "/postcreator"],
        protected: "SELECT"
    },
    UFN_DOMAIN_LST_VALORES: {
        query: "SELECT * FROM ufn_domain_lst_valores($corpid, $orgid, $domainname, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_DOMAIN_LST_VALUES_ONLY_DATA: {
        query: "SELECT * FROM ufn_domain_lst_values_only_data($corpid, $orgid, $domainname, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_USERTOKEN_INS: {
        query: "select * from ufn_usertoken_ins($userid, $token, $origin)",
        module: "",
        protected: "SELECT"
    },
    UFN_USERSTATUS_UPDATE: {
        query: "select * from ufn_userstatus_update($userid, $orgid, $type, $username, $status, $motive, $description)",
        module: "",
        protected: "SELECT"
    },
    UFN_CLASSIFICATION_QUICKREPLYTREE_SEL: {
        query: "select * from ufn_classification_quickreplytree_sel($corpid, $orgid, $type)",
        module: ["/extras/quickreplies", "/extras/tipifications"],
        protected: "SELECT"
    },
    UFN_USERTOKEN_SEL: {
        query: "SELECT * FROM ufn_usertoken_sel($corpid, $orgid, $userid, $token)",
        module: "",
        protected: "SELECT"
    },
    UFN_CLASSIFICATION_TREE_SEL: {
        query: "SELECT * FROM ufn_classification_tree_sel($corpid, $orgid, $classificationid, $type)",
        module: "",
        protected: "SELECT"
    },
    UFN_MESSAGETEMPLATE_SEL: {
        query: "SELECT * FROM ufn_messagetemplate_sel($corpid, $orgid, $take, $skip, $where, $order)",
        module: ["/extras/messagetemplate", "/advancedtemplatescampaigns"],
        protected: "SELECT"
    },
    UFN_MESSAGETEMPLATE_SEL1: {
        query: "SELECT * FROM ufn_messagetemplate_sel($corpid, $orgid, $take, $skip, $where, $order, true, 0, $communicationchannelids)",
        module: ["/extras/messagetemplate"],
        protected: "SELECT"
    },
    UFN_MESSAGETEMPLATE_SEL_OLD: {
        query: "SELECT * FROM ufn_messagetemplate_sel($corpid, $orgid, $take, $skip, $where, $order, $newversion, $communicationchannelid)",
        module: ["/extras/messagetemplate"],
        protected: "SELECT"
    },
    UFN_MESSAGETEMPLATE_TOTALRECORDS: {
        query: "SELECT * FROM ufn_messagetemplate_totalrecords($corpid, $orgid, $where)",
        module: ["/extras/messagetemplate", "/advancedtemplatescampaigns"],
        protected: "SELECT"
    },
    UFN_MESSAGETEMPLATE_TOTALRECORDS1: {
        query: "SELECT * FROM ufn_messagetemplate_totalrecords($corpid, $orgid, $where, true, $communicationchannelids)",
        module: ["/extras/messagetemplate"],
        protected: "SELECT"
    },
    UFN_MESSAGETEMPLATE_TOTALRECORDS_OLD: {
        query: "SELECT * FROM ufn_messagetemplate_totalrecords($corpid, $orgid, $where, $newversion)",
        module: ["/extras/messagetemplate"],
        protected: "SELECT"
    },
    UFN_MANUFACTURER_PAG: {
        query: "SELECT * FROM inventario.ufn_manufacturer_pag($corpid, $orgid, $manufacturerid, $username, $where, $order, $take, $skip, $startdate, $enddate, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_MANUFACTURER_TOTALRECORDS: {
        query: "SELECT * FROM inventario.ufn_manufacturer_totalrecords($corpid, $orgid, $where, $startdate, $enddate, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_INVENTORYCONSUMPTION_PROCESS: {
        query: "SELECT * FROM inventario.ufn_inventoryconsumption_process($corpid, $orgid, $inventoryconsumptionid, $status, $comment, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_ALL_INVENTORYCONSUMPTIONSTATUS_INVENTORYCONSUMPTION_SEL: {
        query: "SELECT * FROM inventario.ufn_all_inventoryconsumptionstatus_inventoryconsumption_sel($corpid, $orgid, $inventoryconsumptionid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_GUIAREMISIONDETAIL_SEL: {
        query: "SELECT * FROM inventario.ufn_guiaremision_detail_sel($corpid, $orgid, $inventoryconsumptionid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_GUIAREMISION_SEL: {
        query: "SELECT * FROM inventario.ufn_guiaremision_sel($corpid, $orgid, $inventoryconsumptionid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_INVENTORYCONSUMPTION_PAG: {
        query: "SELECT * FROM inventario.ufn_inventoryconsumption_pag($corpid, $orgid, $inventoryconsumptionid, $username, $where, $order, $take, $skip, $startdate, $enddate, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_INVENTORYCONSUMPTION_TOTALRECORDS: {
        query: "SELECT * FROM inventario.ufn_inventoryconsumption_totalrecords($corpid, $orgid, $where, $startdate, $enddate, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_INVENTORYCONSUMPTION_INS: {
        query: "SELECT * FROM inventario.ufn_inventoryconsumption_ins($corpid, $orgid, $inventoryconsumptionid, $description, $ordernumber, $transactiontype, $warehouseid, $status, $type, $comment, $inventorybookingid, $operation, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_INVENTORYCONSUMPTIONDETAIL_INS: {
        query: "SELECT * FROM inventario.ufn_inventoryconsumptiondetail_ins($corpid, $orgid, $inventoryconsumptiondetailid, $p_tableid, $line, $productid, $description, $quantity, $onlinecost, $fromshelf, $fromlote, $unitcost, $ticketnumber, $dispatchto, $realdate, $comment, $status, $type, $operation, $username, $transactiontype, $warehouseto, $rackcodeto, $lotecodeto)",
        module: "",
        protected: "INSERT"
    },
    UFN_INVENTORYCONSUMPTION_DETAILSELECT: {
        query: "SELECT * FROM inventario.ufn_all_inventoryconsumptiondetail_inventoryconsumption_sel($corpid, $orgid, $inventoryconsumptionid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_ALL_WAREHOUSE_INVENTORYCONSUMPTION_SEL: {
        query: "SELECT * FROM inventario.ufn_all_warehouse_inventoryconsumption_sel($corpid, $orgid, $warehouseid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_DOCUMENTLIBRARY_SEL: {
        query: "SELECT * FROM ufn_documentlibrary_sel($corpid, $orgid, $id, $all)",
        module: "",
        protected: "SELECT"
    },
    QUERY_DOCUMENTLIBRARY_BY_USER: {
        query: `WITH w1 AS (
            SELECT DISTINCT unnest(string_to_array(groups,',')) AS groups
            FROM orguser ous
            WHERE ous.corpid = $corpid
            AND ous.orgid = $orgid
            AND ous.userid = $userid
        )
        SELECT dl.link, dl.title, dl.category, dl.documentlibraryid, dl.favorite FROM documentlibrary  dl
        WHERE dl.corpid = $corpid
        AND dl.orgid = $orgid
        AND dl.status = 'ACTIVO'
        AND CASE WHEN COALESCE(dl.groups, '') <> '' AND (SELECT(array_length(array_agg(groups), 1)) FROM w1) IS NOT NULL 
            THEN (string_to_array(dl.groups, ',') && (SELECT array_agg(groups) FROM w1))
        ELSE true
        END`,
        module: "",
        protected: "SELECT"
    },
    UFN_DOCUMENTLIBRARY_INS: {
        query: "SELECT * FROM ufn_documentlibrary_ins($corpid, $orgid, $id, $title, $description, $category, $groups, $link, $favorite, $status, $type, $username, $operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_DOCUMENTLIBRARY_INS_ARRAY: {
        query: "SELECT * FROM ufn_documentlibrary_ins_array($corpid, $orgid, $username, $table)",
        module: "",
        protected: "INSERT"
    },

    UFN_PRODUCT_DUP: {
        query: "SELECT * FROM inventario.ufn_product_dup($corpid, $orgid, $productid, $operation, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_MANUFACTURER_EXPORT: {
        query: "SELECT * FROM inventario.ufn_manufacturer_export($startdate, $enddate, $corpid, $orgid, $where, $order, $username, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_MANUFACTURER_INS: {
        query: "SELECT * FROM inventario.ufn_manufacturer_ins($corpid, $orgid, $manufacturerid, $description,  $status, $type, $descriptionlarge, $clientenumbers, $beginpage, $currencyid, $taxeid, $ispaymentdelivery, $typemanufacterid, $manufacturercode, $operation, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_MANUFACTURER_MAS: {
        query: "SELECT * FROM inventario.ufn_manufacturer_mas($json, $corpid, $orgid, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_PRODUCT_PAG: {
        query: "SELECT * FROM inventario.ufn_product_pag($corpid, $orgid, $productid, $username, $where, $order, $take, $skip, $startdate, $enddate, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_PRODUCT_TOTALRECORDS: {
        query: "SELECT * FROM inventario.ufn_product_totalrecords($corpid, $orgid, $where, $startdate, $enddate, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_WAREHOUSE_PAG: {
        query: "SELECT * FROM inventario.ufn_warehouse_pag($corpid, $orgid, $warehouseid, $username, $where, $order, $take, $skip, $startdate, $enddate, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_WAREHOUSE_TOTALRECORDS: {
        query: "SELECT * FROM inventario.ufn_warehouse_totalrecords($corpid, $orgid, $where, $startdate, $enddate, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_ALL_INVENTORY_INVENTORYCOST_SEL: {
        query: "SELECT * FROM inventario.ufn_all_inventory_inventorycost_sel($corpid, $orgid, $inventoryid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_INVENTORBOOKING_INS: {
        query: "SELECT * FROM inventario.ufn_inventorybooking_ins($corpid, $orgid, $inventorybookingid, $inventoryid, $warehouseid, $ticketid, $bookingtype, $bookingquantity, $status, $type, $applicationdate, $operation, $username)",
        module: "",
        protected: "INSERT"
    },

    UFN_INVENTORY_PAG: {
        query: "SELECT * FROM inventario.ufn_inventory_pag($corpid, $orgid, $inventoryid, $userid, $where, $order, $take, $skip, $startdate, $enddate, $offset)",
        module: "",
        protected: "SELECT"
    },

    UFN_INVENTORY_TOTALRECORDS: {
        query: "SELECT * FROM inventario.ufn_inventory_totalrecords($corpid, $orgid, $where, $startdate, $enddate, $offset)",
        module: "",
        protected: "SELECT"
    },

    UFN_INVENTORY_INS: {
        query: "SELECT * FROM inventario.ufn_inventory_ins($corpid, $orgid, $inventoryid, $productid, $warehousid, $iswharehousedefault, $rackdefault, $typecostdispatch, $familyid, $subfamilyid, $status, $type, $currentbalance, $operation, $username)",
        module: "",
        protected: "INSERT"
    },

    UFN_WAREHOUSE_INS: {
        query: "SELECT * FROM inventario.ufn_warehouse_ins($corpid, $orgid, $warehouseid, $description, $address, $latitude, $longitude, $phone, $status, $type, $name, $descriptionlarge, $operation, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_ALL_PRODUCT_WAREHOUSE_SEL: {
        query: "SELECT * FROM inventario.ufn_all_product_warehouse_sel($corpid, $orgid, $warehouseid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_ALL_PRODUCT_PRODUCT_SEL: {
        query: "SELECT * FROM inventario.ufn_all_product_product_sel($corpid, $orgid, $productid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_PRODUCTALTERNATIVE_INS: {
        query: "SELECT * FROM inventario.ufn_productalternative_ins($corpid, $orgid, $productalternativeid, $productid, $productaltid, $status, $type, $operation, $username)",
        module: "",
        protected: "INSERT"
    },

    UFN_ALL_ATTRIBUTE_PRODUCT_SEL: {
        query: "SELECT * FROM inventario.ufn_all_attribute_product_sel($corpid, $orgid, $productid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_PRODUCTATTRIBUTE_INS: {
        query: "SELECT * FROM inventario.ufn_productattribute_ins($corpid, $orgid, $productattributeid, $p_tableid, $attributeid, $value, $unitmeasureid, $status, $type, $operation, $username)",
        module: "",
        protected: "INSERT"
    },

    UFN_STATUSPRODUCT_INS: {
        query: "SELECT * FROM inventario.ufn_statusproduct_ins($corpid, $orgid, $statusid, $comment, $status, $type, $productid, $ismoveinventory, $operation, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_STATUSPRODUCT_MAS: {
        query: "SELECT * FROM inventario.ufn_statusproduct_upd_mas($json, $corpid, $orgid, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_PRODUCT_INS: {
        query: "SELECT * FROM inventario.ufn_product_ins($corpid, $orgid, $productid, $description, $descriptionlarge, $producttype, $familyid, $unitbuyid, $unitdispatchid, $imagereference, $status, $type, $attachments, $productcode, $loteid, $subfamilyid, $operation, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_PRODUCT_EXPORT: {
        query: "SELECT * FROM inventario.ufn_product_export($startdate, $enddate,$corpid, $orgid, $where, $order, $username, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_INVENTORYCONSUMPTION_EXPORT: {
        query: "SELECT * FROM inventario.ufn_inventoryconsumption_export($startdate, $enddate,$corpid, $orgid, $where, $order, $username, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_PRODUCT_SEL: {
        query: "SELECT * FROM inventario.ufn_product_sel($corpid, $orgid, $productid, $username)",
        module: "",
        protected: "SELECT"
    },

    UFN_ALL_WAREHOUSE_PRODUCT_SEL: {
        query: "SELECT * FROM inventario.ufn_all_warehouse_product_sel($corpid, $orgid, $productid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_PRODUCTWAREHOUSE_INS: {
        query: "SELECT * FROM inventario.ufn_productwarehouse_ins($corpid,$orgid,$productwarehouseid,$productid,$warehouseid,$priceunit,$ispredeterminate,$typecostdispatch,$unitdispatchid,$unitbuyid,$lotecode,$rackcode,$status,$type,$currentbalance,$operation,$username)",
        module: "",
        protected: "INSERT"
    },
    UFN_WAREHOUSE_EXPORT: {
        query: "SELECT * FROM inventario.ufn_warehouse_export($startdate, $enddate,$corpid, $orgid, $where, $order, $username, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_WAREHOUSE_SEL: {
        query: "SELECT * FROM inventario.ufn_warehouse_sel($corpid, $orgid, $warehouseid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_ALL_STATUSPRODUCT_PRODUCT_SEL: {
        query: "SELECT * FROM inventario.ufn_all_statusproduct_product_sel($corpid,$orgid,$id,$username)",
        module: "",
        protected: "SELECT"
    },
    UFN_PRODUCT_MAS: {
        query: "SELECT * FROM inventario.ufn_product_mas($json, $corpid,$orgid,$username)",
        module: "",
        protected: "INSERT"
    },
    UFN_PRODUCTMANUFACTURER_MAS: {
        query: "SELECT * FROM inventario.ufn_productmanufacturer_mas($json, $corpid,$orgid,$username)",
        module: "",
        protected: "INSERT"
    },
    UFN_PRODUCTWAREHOUSE_MAS: {
        query: "SELECT * FROM inventario.ufn_productwarehouse_mas($json, $corpid,$orgid,$username)",
        module: "",
        protected: "INSERT"
    },
    UFN_BOOKINGWAREHOUSE_SEL: {
        query: "SELECT * FROM inventario.ufn_all_inventorybooking_warehouse_sel($corpid,$orgid,$warehouseid, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_GENERATE_LABEL_SEL: {
        query: "SELECT * FROM inventario.ufn_generate_label_sel($corpid,$orgid,$inventoryconsumptionid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_PRODUCTATTRIBUTE_MAS: {
        query: "SELECT * FROM inventario.ufn_productattribute_mas($json, $corpid,$orgid,$username)",
        module: "",
        protected: "INSERT"
    },
    UFN_WAREHOUSE_MAS: {
        query: "SELECT * FROM inventario.ufn_warehouse_mas($json, $corpid,$orgid,$username)",
        module: "",
        protected: "INSERT"
    },
    UFN_PRODUCTMANUFACTURER_INS: {
        query: "SELECT * FROM inventario.ufn_productmanufacturer_ins($corpid, $orgid, $productcompanyid, $p_tableid, $manufacturerid, $model, $catalognumber, $webpage, $taxeid, $isstockistdefault, $averagedeliverytime, $lastprice, $lastorderdate, $unitbuy, $status, $type, $distributorid, $operation, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_ALL_MANUFACTURER_PRODUCT_SEL: {
        query: "SELECT * FROM inventario.ufn_all_manufacturer_product_sel($corpid, $orgid, $productid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_MANUFACTURER_SEL: {
        query: "SELECT * FROM inventario.ufn_manufacturer_sel($corpid, $orgid, $manufacturerid, $username )",
        module: "",
        protected: "SELECT"
    },
    UFN_INVENTORY_EXPORT: {
        query: "SELECT * FROM inventario.ufn_inventory_export($startdate, $enddate,$corpid, $orgid, $where, $order, $username, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_INVENTORYBALANCE_SEL: {
        query: "SELECT * FROM inventario.ufn_all_inventory_inventorybalance_sel($corpid, $orgid, $inventorybalanceid, $username )",
        module: "",
        protected: "SELECT"
    },
    UFN_INVENTORYRECOUNT_SEL: {
        query: "SELECT * FROM inventario.ufn_all_inventory_inventoryrecount_sel($corpid, $orgid, $inventoryid, $username )",
        module: "",
        protected: "SELECT"
    },
    UFN_INVENTORYWAREHOUSE_SEL: {
        query: "SELECT * FROM inventario.ufn_all_inventory_inventorywarehouse_sel($corpid, $orgid, $inventoryid, $username )",
        module: "",
        protected: "SELECT"
    },
    UFN_INVENTORYLOTE_SEL: {
        query: "SELECT * FROM inventario.ufn_all_inventory_inventorylote_sel($corpid, $orgid, $inventoryid, $username )",
        module: "",
        protected: "SELECT"
    },
    UFN_INVENTORYBOOKING_SEL: {
        query: "SELECT * FROM inventario.ufn_all_inventory_inventorybooking_sel($corpid, $orgid, $inventoryid, $username )",
        module: "",
        protected: "SELECT"
    },
    UFN_INVENTORYBALANCE_INS: {
        query: "SELECT * FROM inventario.ufn_inventorybalance_ins($corpid, $orgid, $inventorybalanceid, $inventoryid, $shelf, $lotecode, $currentbalance, $recountphysical, $recountphysicaldate, $isreconciled, $shelflifedays, $duedate, $status, $type, $operation, $username )",
        module: "",
        protected: "INSERT"
    },
    UFN_MESSAGETEMPLATE_INS: {
        query: "SELECT * FROM ufn_messagetemplate_ins($corpid, $orgid, $id, $description, $type, $status, $name, $namespace, $category, $language, $templatetype, $headerenabled, $headertype, $header, $body, $footerenabled, $footer, $buttonsenabled, $priority, $attachment, $communicationchannelid, $communicationchanneltype, $authenticationdata, $bodyvariables, $buttonsgeneric, $buttonsquickreply, $carouseldata, $headervariables, $provideraccountid, $providerexternalid, $providerid, $providermessagelimit, $providerpartnerid, $providerquality, $providerstatus, $username, $operation, false, $buttons, $bodyobject, $categorychange, $firstbuttons)",
        module: ["/extras/messagetemplate"],
        protected: "INSERT"
    },
    UFN_MESSAGETEMPLATE_INS_OLD: {
        query: "SELECT * FROM ufn_messagetemplate_ins($corpid, $orgid, $id, $description, $type, $status, $name, $namespace, $category, $language, $templatetype, $headerenabled, $headertype, $header, $body, $footerenabled, $footer, $buttonsenabled, $priority, $attachment, $communicationchannelid, $communicationchanneltype, $authenticationdata, $bodyvariables, $buttonsgeneric, $buttonsquickreply, $carouseldata, $headervariables, $provideraccountid, $providerexternalid, $providerid, $providermessagelimit, $providerpartnerid, $providerquality, $providerstatus, $username, $operation, $newversion, $buttons, $bodyobject, $categorychange, $firstbuttons)",
        module: ["/extras/messagetemplate"],
        protected: "INSERT"
    },
    UFN_MESSAGETEMPLATE_EXPORT: {
        query: "SELECT * FROM ufn_messagetemplate_export($corpid, $orgid, $where, $order, $translation, $offset)",
        module: ["/extras/messagetemplate"],
        protected: "SELECT"
    },
    UFN_CLASSIFICATION_INS: {
        query: "SELECT * FROM ufn_classification_ins( $id, $corpid, $orgid, $description, $parent, $communicationchannel, $status, $type, $username, $operation, $tags, $title, $jobplan, $usergroup, $schedule, $order, $metacatalogid)",
        module: ["/extras/tipifications"],
        protected: "INSERT"
    },
    UFN_CLASSIFICATION_LST_PARENT: {
        query: "SELECT * FROM ufn_classification_lst_parent($corpid, $orgid, $classificationid)",
        module: ["/extras/quickreplies", "/extras/tipifications"],
        protected: "SELECT"
    },
    UFN_COMMUNICATIONCHANNEL_SEL: {
        query: "SELECT * FROM ufn_communicationchannel_sel($corpid, $orgid, $communicationchannelid, $personcommunicationchannel, $username, $all)",
        module: ["/extras/properties", "/channels"],
        protected: "SELECT"
    },
    UFN_USERBYSUPERVISOR_SEL: {
        query: "SELECT * FROM ufn_userbysupervisor_sel($corpid, $orgid, $userid)",
        module: "", //supervisor and inbox
        protected: "SELECT"
    },
    UFN_CONVERSATION_SEL_TICKETSBYUSER: {
        query: "SELECT * FROM ufn_conversation_sel_ticketsbyuser($corpid, $orgid, $agentid, $userid)",
        module: ["/message_inbox", "/supervisor"], //messag einbox y supervisor admitir arrays
        protected: "SELECT"
    },
    UFN_CONVERSATION_SEL_TICKETSBYUSER_CLOSED: {
        query: "SELECT * FROM ufn_conversation_sel_ticketsbyuser_closed($corpid, $orgid, $agentid, $userid)",
        module: ["/message_inbox", "/supervisor"], //messag einbox y supervisor admitir arrays
        protected: "SELECT"
    },
    UFN_CONVERSATION_SEL_INTENT: {
        query: "SELECT * FROM ufn_conversation_sel_intent($conversationid)",
        module: "", //supervisor and inbox
        protected: "SELECT"
    },
    UFN_CONVERSATION_SEL_INTERACTION: {
        query: "SELECT * FROM ufn_conversation_sel_interaction($conversationid, $lock, $conversationold, $userid)",
        module: "", //supervisor and inbox
        protected: "SELECT"
    },
    UFN_QUICKREPLY_LIST_SEL: {
        query: "SELECT * FROM ufn_quickreply_list_sel($corpid, $orgid, $classificationid, $all)",
        module: ["/supervisor", "/message_inbox"], //supervisor and inbox
        protected: "SELECT"
    },
    UFN_CONVERSATION_PERSON_SEL: {
        query: "SELECT * FROM ufn_conversation_person_sel($corpid, $orgid, $personid, $conversationid, $userid)",
        module: "", //supervisor and inbox
        protected: "SELECT"
    },
    UFN_CONVERSATION_SEL_TICKETSBYPERSON: {
        query: "SELECT * FROM ufn_conversation_sel_ticketsbyperson($corpid, $orgid, $personid, $conversationid)",
        module: ["/supervisor", "/message_inbox"], //supervisor and inbox
        protected: "SELECT"
    },
    UFN_CONVERSATIONCLASSIFICATION_INS: {
        query: "SELECT * FROM ufn_conversationclassification_ins($conversationid, $classificationid, $username, $operation, $jobplan)",
        module: "", //supervisor and inbox
        protected: "INSERT"
    },
    UFN_CONVERSATIONCLASSIFICATION_SEL2: {
        query: "SELECT * FROM ufn_conversationclassification_sel2($corpid, $orgid, $conversationid)",
        module: ["/message_inbox", "/supervisor"], //supervisor and inbox
        protected: "SELECT"
    },
    UFN_CONVERSATION_REASSIGNTICKET: {
        query: "SELECT * FROM ufn_conversation_reassignticket($conversationid, $newuserid, $userid, $username, $usergroup, $comment, $isanswered)",
        module: ["/supervisor", "/tickets", "/message_inbox"], //supervisor and inbox
        protected: "INSERT"
    },
    UFN_CONVERSATION_REASSIGNTICKET_HSM: {
        query: "SELECT * FROM ufn_conversation_reassignticket_hsm($corpid, $orgid, $conversationid, $userid)",
        module: "", //supervisor and inbox
        protected: "INSERT"
    },
    UFN_INTEGRATIONMANAGER_SEL: {
        query: "SELECT * FROM ufn_integrationmanager_sel($corpid, $orgid, $id, $username, $all)",
        module: ["/extras/integrationmanager"],
        protected: "SELECT"
    },
    QUERY_INTEGRATIONMANAGER_SYNC_SEL: {
        query: "SELECT corpid, orgid, integrationmanagerid, datasource_config, status FROM integrationmanager where corpid = $corpid and orgid = $orgid and integrationmanagerid = $id;",
        module: ["/extras/integrationmanager"],
        protected: "SELECT"
    },
    UFN_INTEGRATIONMANAGER_INS: {
        query: "SELECT * FROM ufn_integrationmanager_ins($corpid, $orgid, $id, $description, $type, $status, $name, $method, $url, $authorization, $headers, $bodytype, $body, $parameters, $variables, $level, $fields, $apikey, $username, $operation, $url_params, $results, $code_table, $person_table)",
        module: ["/extras/integrationmanager"],
        protected: "INSERT"
    },
    UFN_INTEGRATIONMANAGER_BULKLOAD_INS: {
        query: "SELECT * FROM ufn_integrationmanager_bulkload_ins($corpid, $orgid, $integrationmanagerid, $table, $type, $username)",
        module: ["/extras/integrationmanager"],
        protected: "INSERT"
    },
    UFN_INTEGRATIONMANAGER_IMPORT: {
        query: "SELECT * FROM ufn_integrationmanager_importdata($corpid, $orgid, $id, $table)",
        module: ["/extras/integrationmanager"],
        protected: "INSERT"
    },
    QUERY_INTEGRATIONMANAGER_SYNC_UPDATE: {
        query: "UPDATE integrationmanager set datasource_syncinfo = $info where integrationmanagerid = $id and corpid = $corpid and orgid = $orgid;",
        module: [""],
        protected: "INSERT"
    },
    UFN_INTEGRATION_MANAGER_DATASOURCE_INS: {
        query: "SELECT * FROM ufn_integration_manager_datasource_ins($corpid, $orgid, $id, $datasource, $config, $username)",
        module: ["/extras/integrationmanager"],
        protected: "INSERT"
    },
    UFN_INTEGRATIONMANAGER_EXPORT: {
        query: "SELECT * FROM ufn_integrationmanager_exportdata($corpid, $orgid, $id)",
        module: ["/extras/integrationmanager"],
        protected: "INSERT"
    },
    UFN_INTEGRATIONMANAGER_CODE_PERSON_SEL: {
        query: "SELECT * FROM ufn_integrationmanager_code_person_sel($corpid, $orgid, $integrationmanagerid, $type)",
        module: ["/extras/integrationmanager"],
        protected: "INSERT"
    },
    UFN_INTEGRATIONMANAGER_CODE_PERSON_DELETE: {
        query: "SELECT * FROM ufn_integrationmanager_code_person_delete($corpid, $orgid, $integrationmanagerid, $type, $ids, $username)",
        module: ["/extras/integrationmanager"],
        protected: "INSERT"
    },
    UFN_INTEGRATIONMANAGER_DELETEDATA: {
        query: "SELECT * FROM ufn_integrationmanager_deletedata($corpid, $orgid, $id)",
        module: ["/extras/integrationmanager"],
        protected: "INSERT"
    },
    UFN_INTEGRATIONMANAGER_LST: {
        query: "SELECT * FROM ufn_integrationmanager_lst($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_REASSIGNTICKET_MASSIVE: {
        query: "SELECT * FROM ufn_conversation_reassignticket_massive($conversationid, $newuserid, $username, $newusergroup, $comment)",
        module: ["/tickets"], //tickets
        protected: "SELECT"
    },
    UFN_COMMUNICATIONCHANNEL_INS: {
        query: "SELECT * FROM ufn_communicationchannel_ins($corpid, $orgid, $id, $description, $type, $communicationchannelsite, $communicationchannelowner, $communicationchannelcontact, $communicationchanneltoken, $customicon, $coloricon, $status, $username, $operation, $botenabled, $botconfigurationid, $chatflowenabled, $schedule, $integrationid, $appintegrationid, $country, $channelparameters, $updintegration, $resolvelithium, $color, $icons, $other, $form, $apikey, $servicecredentials, $motive, $phone, $voximplantrecording, $voximplantwelcometone, $voximplantholdtone, $voximplantcallsupervision)",
        module: "",
        protected: "INSERT"
    },
    UFN_COMMUNICATIONCHANNELSITE_SEL: {
        query: "SELECT * FROM ufn_communicationchannelsite_sel($communicationchannelsite, $type)",
        module: "",
        protected: "SELECT"
    },
    UFN_COMMUNICATIONCHANNELSITE_SMOOCH_SEL: {
        query: "SELECT * FROM ufn_communicationchannelsite_smooch_sel($communicationchannelsite)",
        module: "",
        protected: "SELECT"
    },
    UFN_CHATFLOW_COMMUNICATIONCHANNEL_LST: {
        query: "SELECT * FROM ufn_chatflow_communicationchannel_lst($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CHATFLOW_BLOCK_LST_BYTYPE: {
        query: "SELECT * FROM ufn_chatflow_block_lst_bytype($corpid, $orgid, $userid, $type)",
        module: "",
        protected: "SELECT"
    },
    UFN_CHATFLOW_BLOCK_TEMPLATES_SEL: {
        query: "SELECT * FROM ufn_chatflow_block_templates_sel()",
        module: "",
        protected: "SELECT"
    },
    UFN_CHATFLOW_BLOCK_TEMPLATE_CLONE: {
        query: "SELECT * FROM ufn_chatflow_block_template_clone($corpid, $orgid, $chatblockid, $communicationchannelid, $username, $prop_value)",
        module: "",
        protected: "SELECT"
    },
    UFN_CHATFLOW_BLOCK_LST: {
        query: "SELECT * FROM ufn_chatflow_block_lst($corpid, $orgid, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CHATFLOW_BLOCK_ACTIVE_SEL: {
        query: "SELECT * FROM ufn_chatflow_block_active_sel($corpid, $orgid, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CHATFLOW_BLOCK_SEL: {
        query: "SELECT * FROM ufn_chatflow_block_sel($corpid, $orgid, $chatblockid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CHATFLOW_BLOCK_INS: {
        query: "SELECT * FROM ufn_chatflow_block_ins($corpid, $orgid, $communicationchannelid, $username, $chatblockid, $title, $description, $defaultgroupid, $defaultblockid, $firstblockid, $aiblockid, $blockgroup, $variablecustom, $status, $color, $icontype, $tag, $chatblockversionid, $template_body)",
        module: "",
        protected: "INSERT"
    },
    UFN_CHATFLOW_BLOCK_DUP: {
        query: "SELECT * FROM ufn_chatflow_block_dup($corpid, $orgid, $chatblockidold, $chatblockidnew, $defaultgroupid, $defaultblockid, $firstblockid, $blockgroup, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_CHATFLOW_BLOCKVERSION_LST: {
        query: "SELECT * FROM ufn_chatflow_blockversion_lst($corpid, $chatblockid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CHATFLOW_BLOCKVERSION_SEL: {
        query: "SELECT * FROM ufn_chatflow_blockversion_sel($corpid, $chatblockid, $chatblockversionid)",
        module: "",
        protected: "SELECT"
    },
    UFN_TABLE_VARIABLE_LST: {
        query: "SELECT * FROM ufn_tablevariable_sel($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CUSTOM_VARIABLE_APPLICATION_SEL: {
        query: "SELECT * FROM public.ufn_custom_variable_application_sel($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CUSTOM_VARIABLE_SEL: {
        query: "SELECT * FROM public.ufn_custom_variable_sel($corpid, $orgid, $customvariableapplicationid, $tablename)",
        module: "",
        protected: "SELECT"
    },
    UFN_CUSTOM_VARIABLE_INS: {
        query: "SELECT * FROM public.ufn_custom_variable_ins($id, $corpid, $orgid, $customvariableapplicationid, $variablename, $description, $variabletype, $status, $operation, $username, $domainname)",
        module: "",
        protected: "SELECT"
    },
    UFN_DOMAIN_VALUE_SEL_BY_LIST: {
        query: "SELECT * FROM public.ufn_domain_value_sel_by_list($corpid, $orgid, $domainnamelist)",
        module: "",
        protected: "SELECT"
    },
    UFN_DOMAIN_LST: {
        query: "SELECT * FROM ufn_domain_lst($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_INPUTVALIDATION_LST: {
        query: "SELECT * FROM ufn_inputvalidation_lst($corpid)",
        module: "",
        protected: "SELECT"
    },
    UFN_LOCATION_LST: {
        query: "SELECT * FROM ufn_location_lst($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_PROPERTYFAMILY_SEL: {
        query: "SELECT * FROM ufn_propertyfamily_sel($corpid, $orgid, $propertyname)",
        module: "",
        protected: "SELECT"
    },
    UFN_CHATFLOW_SURVEY_INS: {
        query: "SELECT * FROM ufn_chatflow_survey_ins($corpid, $orgid, $communicationchannelid, $surveycode, $description, $status, $type, $username, $surveyid)",
        module: "",
        protected: "INSERT"
    },
    UFN_CHATFLOW_SURVEYQUESTION_INS: {
        query: "SELECT * FROM ufn_chatflow_surveyquestion_ins($corpid, $orgid, $surveyid, $description, $questionnumber, $question, $status, $type, $username, $jsonformat)",
        module: "",
        protected: "INSERT"
    },
    UFN_CHATFLOW_SURVEYANSWER_INS: {
        query: "SELECT * FROM ufn_chatflow_surveyanswer_ins($corpid, $orgid, $surveyid, $surveyquestionid, $description, $answer, $value, $answerorder, $hascomment, $status, $type, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_DOMAIN_VALUES_IMPORT: {
        query: "SELECT * FROM ufn_domain_value_import($corpid, $orgid, $domainname, $description, $domainvalue, $domaindesc, $system, $status, $type, $bydefault, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_INPUTVALIDATION_IMPORT: {
        query: "SELECT * FROM ufn_inputvalidation_import($corpid, $description, $inputvalue, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_CONVERSATION_LST_USRDELEGATE2: {
        query: "SELECT * FROM ufn_conversation_lst_usrdelegate2($corpid, $orgid, $userid)",
        module: ["/supervisor", "/tickets", "/message_inbox"],
        protected: "SELECT"
    },

    UFN_CONVERSATIONCLASSIFICATIONLIST_LEVEL1_SEL: {
        query: "SELECT * FROM ufn_conversationclassificationlist_level1_sel($corpid, $orgid, $type)",
        module: ["/supervisor", "/tickets", "/message_inbox"],
        protected: "SELECT"
    },
    UFN_CONVERSATIONCLASSIFICATIONLIST_LEVEL2_SEL: {
        query: "SELECT * FROM ufn_conversationclassificationlist_level2_sel($corpid, $orgid, $type, $classificationid)",
        module: "",
        protected: "SELECT"
    },
    UFN_VARIABLECONFIGURATION_LST: {
        query: "SELECT * FROM ufn_tablevariableconfiguration_lst($corpid, $orgid, $userid)",
        module: ["/extras/variableconfiguration"],
        protected: "SELECT"
    },
    UFN_VARIABLECONFIGURATION_SEL: {
        query: "SELECT * FROM ufn_tablevariableconfiguration_sel($corpid, $orgid, $chatblockid, $userid)",
        module: ["/extras/variableconfiguration"],
        protected: "SELECT"
    },
    UFN_VARIABLECONFIGURATION_INS: {
        query: "SELECT * FROM ufn_tablevariableconfiguration_ins($corpid, $orgid, $chatblockid, $variable, $description, $fontcolor, $fontbold, $priority, $visible, $userid)",
        module: "",
        protected: "INSERT"
    },
    UFN_VARIABLECONFIGURATION_INS_ARRAY: {
        query: "SELECT * FROM ufn_tablevariableconfiguration_ins_array($corpid, $orgid, $username, $table)",
        module: ["/extras/variableconfiguration"],
        protected: "INSERT"
    },
    UFN_TABLEVARIABLECONFIGURATIONBYCHANNEL_SEL: {
        query: "select * from ufn_tablevariableconfigurationbychannel_sel($corpid, $orgid, $communicationchannelid, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CAMPAIGN_PERSON_TOTALRECORDS: {
        query: "SELECT * FROM ufn_campaign_person_totalrecords($corpid, $orgid, $startdate, $enddate, $where, $username, $offset)",
        module: ["/extras/campaign", "/advancedtemplatescampaigns"],
        protected: "SELECT"
    },
    UFN_CAMPAIGN_PERSON_SEL: {
        query: "SELECT  * FROM ufn_campaign_person_sel($corpid, $orgid, $startdate, $enddate, $where, $order, $take, $skip, $username, $offset)",
        module: ["/extras/campaign", "/advancedtemplatescampaigns"],
        protected: "SELECT"
    },
    UFN_CAMPAIGN_LEAD_PERSON_TOTALRECORDS: {
        query: "SELECT * FROM ufn_campaign_lead_person_totalrecords($corpid, $orgid, $startdate, $enddate, $where, $username, $offset)",
        module: ["/extras/campaign", "/advancedtemplatescampaigns"],
        protected: "SELECT"
    },
    UFN_CAMPAIGN_LEAD_PERSON_SEL: {
        query: "SELECT  * FROM ufn_campaign_lead_person_sel($corpid, $orgid, $startdate, $enddate, $where, $order, $take, $skip, $username, $offset)",
        module: ["/extras/campaign", "/advancedtemplatescampaigns"],
        protected: "SELECT"
    },
    UFN_CAMPAIGN_LST: {
        query: "SELECT * FROM ufn_campaign_lst($corpid, $orgid, $username, $startdate, $enddate, $offset)",
        module: ["/tickets", "/crm", "/extras/campaign"],
        protected: "SELECT"
    },
    UFN_CAMPAIGN_LST_OLD: {
        query: "SELECT * FROM ufn_campaign_lst($corpid, $orgid, $username, $startdate, $enddate, $offset, $newversion)",
        module: ["/tickets", "/crm", "/extras/campaign"],
        protected: "SELECT"
    },
    UFN_CAMPAIGN_SEL: {
        query: "SELECT * FROM ufn_campaign_sel($corpid, $orgid, $id, $username)",
        module: ["/extras/campaign", "/advancedtemplatescampaigns"],
        protected: "SELECT"
    },
    QUERY_CAMPAIGN_SEL: {
        query: `
        SELECT ca.campaignid, ca.title, ca.description,
        ca.status, ca.type, ca.message,
        ca.communicationchannelid, cc.type as communicationchanneltype,
        ca.usergroup, ca.executiontype, ca.batchjson, ca.taskid
        FROM campaign ca
        LEFT JOIN communicationchannel cc ON cc.corpid = ca.corpid AND cc.orgid = ca.orgid AND cc.communicationchannelid = ca.communicationchannelid
        WHERE ca.corpid = $corpid
        AND ca.orgid = $orgid
        AND ca.campaignid = $campaignid`,
        module: "",
        protected: "SELECT"
    },
    UFN_CAMPAIGN_INS: {
        query: "SELECT * FROM ufn_campaign_ins($corpid, $orgid, $id, $communicationchannelid, $usergroup, $type, $status, $title, $description, $subject, $message, $startdate, $enddate, $repeatable, $frecuency, $messagetemplateid, $messagetemplatename, $messagetemplatenamespace, $messagetemplateheader, $messagetemplatebuttons, $executiontype, $batchjson, $fields, $messagetemplatefooter, $messagetemplatetype, $messagetemplateattachment, $source, $messagetemplatelanguage, $messagetemplatepriority, $username, $operation, $carouseljson, $variableshidden, $membercount, $offset)",
        module: ["/extras/campaign", "/advancedtemplatescampaigns"],
        protected: "INSERT"
    },
    UFN_CAMPAIGN_INS_OLD: {
        query: "SELECT * FROM ufn_campaign_ins($corpid, $orgid, $id, $communicationchannelid, $usergroup, $type, $status, $title, $description, $subject, $message, $startdate, $enddate, $repeatable, $frecuency, $messagetemplateid, $messagetemplatename, $messagetemplatenamespace, $messagetemplateheader, $messagetemplatebuttons, $executiontype, $batchjson, $fields, $messagetemplatefooter, $messagetemplatetype, $messagetemplateattachment, $source, $messagetemplatelanguage, $messagetemplatepriority, $username, $operation, $carouseljson, $variableshidden, $membercount, $offset, $newversion)",
        module: ["/extras/campaign", "/advancedtemplatescampaigns"],
        protected: "INSERT"
    },
    UFN_CAMPAIGN_DEL: {
        query: "SELECT * FROM ufn_campaign_del($corpid, $orgid, $id, $status, $username, $operation)",
        module: ["/extras/campaign", "/advancedtemplatescampaigns"],
        protected: "INSERT"
    },
    UFN_CAMPAIGN_START: {
        query: "SELECT * FROM ufn_campaign_start($corpid, $orgid, $id, $username, $offset)",
        module: ["/extras/campaign", "/advancedtemplatescampaigns"],
        protected: "SELECT"
    },
    QUERY_CAMPAIGN_START: {
        query: "UPDATE campaign SET status = 'EJECUTANDO', lastrundate = NOW(), taskid = $taskid WHERE corpid = $corpid AND orgid = $orgid AND campaignid = $campaignid AND status = 'ACTIVO' RETURNING campaignid",
        module: "",
        protected: "SELECT"
    },
    UFN_CAMPAIGN_STATUS: {
        query: "SELECT * FROM ufn_campaign_status($corpid, $orgid, $id)",
        module: ["/extras/campaign", "/advancedtemplatescampaigns"],
        protected: "SELECT"
    },
    UFN_CAMPAIGN_STOP: {
        query: "SELECT * FROM ufn_campaign_stop($corpid, $orgid, $campaignid)",
        module: ["/extras/campaign", "/advancedtemplatescampaigns"],
        protected: "SELECT"
    },
    QUERY_CAMPAIGN_STOP: {
        query: "UPDATE campaign SET status = 'ACTIVO', taskid = null WHERE corpid = $corpid AND orgid = $orgid AND campaignid = $campaignid AND status = 'EJECUTANDO' RETURNING campaignid",
        module: "",
        protected: "SELECT"
    },
    UFN_USER_GROUPS_SEL: {
        query: "SELECT * FROM ufn_user_groups_sel($corpid, $orgid, $userid)",
        module: ["/dashboard", "/servicedesk", "/extras/campaign", "/reports"],
        protected: "SELECT"
    },
    UFN_CAMPAIGNMEMBER_SEL: {
        query: "SELECT * FROM ufn_campaignmember_sel($corpid, $orgid, $campaignid)",
        module: ["/extras/campaign", "/advancedtemplatescampaigns"],
        protected: "SELECT"
    },
    QUERY_CAMPAIGNMEMBER_SEL: {
        query: `
        SELECT cm.campaignid, cm.campaignmemberid,
        cm.personcommunicationchannelowner, cm.countrycode,
        cm.field1, cm.field2, cm.field3, cm.field4, cm.field5,
        cm.field6, cm.field7, cm.field8, cm.field9, cm.field10,
        cm.field11, cm.field12, cm.field13, cm.field14, cm.field15,
        cm.batchindex
        FROM campaignmember cm
        WHERE cm.corpid = $corpid
        AND cm.orgid = $orgid
        AND cm.campaignid = $campaignid
        AND cm.status = 'ACTIVO'`,
        module: "",
        protected: "SELECT"
    },
    UFN_CAMPAIGNMEMBER_INS: {
        query: "SELECT * FROM ufn_campaignmember_ins($corpid, $orgid, $id, $personid, $personcommunicationchannel, $personcommunicationchannelowner, $type, $displayname, $status, $operation, $campaignid, $field1, $field2, $field3, $field4, $field5, $field6, $field7, $field8, $field9, $field10, $field11, $field12, $field13, $field14, $field15, $batchindex)",
        module: ["/extras/campaign", "/advancedtemplatescampaigns"],
        protected: "INSERT"
    },
    UFN_CAMPAIGNMEMBER_STATUS: {
        query: "SELECT * FROM ufn_campaignmember_status($corpid, $orgid, $campaignid, $campaignmemberid, $status)",
        module: ["/extras/campaign", "/advancedtemplatescampaigns"],
        protected: "SELECT"
    },
    UFN_BLACKLIST_INS: {
        query: "SELECT * FROM ufn_blacklist_ins($corpid, $orgid, $id, $description, $type, $status, $phone, $username, $operation)",
        module: ["/extras/campaign", "/advancedtemplatescampaigns"],
        protected: "INSERT"
    },
    UFN_BLACKLIST_INS_ARRAY: {
        query: "SELECT * FROM ufn_blacklist_ins_array($corpid, $orgid, $username, $table)",
        module: ["/extras/campaign", "/advancedtemplatescampaigns"],
        protected: "INSERT"
    },
    UFN_BLACKLIST_SEL: {
        query: "SELECT * FROM ufn_blacklist_sel($corpid, $orgid, $where, $order, $take, $skip, $offset)",
        module: ["/extras/campaign", "/advancedtemplatescampaigns"],
        protected: "SELECT"
    },
    UFN_BLACKLIST_TOTALRECORDS: {
        query: "SELECT * FROM ufn_blacklist_totalrecords($corpid, $orgid, $where, $offset)",
        module: ["/extras/campaign", "/advancedtemplatescampaigns"],
        protected: "SELECT"
    },
    UFN_BLACKLIST_EXPORT: {
        query: "SELECT * FROM ufn_blacklist_export($corpid, $orgid, $where, $offset)",
        module: ["/extras/campaign", "/advancedtemplatescampaigns"],
        protected: "SELECT"
    },
    UFN_REPORTTEMPLATE_SEL: {
        query: "SELECT * FROM ufn_reporttemplate_sel($corpid, $orgid, $reporttemplateid, $username, $all, $userid)",
        module: ["/reports", "/dashboard"],
        protected: "SELECT"
    },
    UFN_REPORTTEMPLATE_INS: {
        query: "select * from ufn_reporttemplate_ins($id, $corpid, $orgid, $description, $status, $type, $dataorigin, $columnjson, $filterjson, $summaryjson, $communicationchannelid, $nameapi, $username, $operation)",
        module: ["/reports", "/dashboard"],
        protected: "SELECT"
    },
    UFN_CREATEZYXMEACCOUNT_INS: {
        query: "SELECT * FROM ufn_createzyxmeaccount_ins($firstname, $lastname, $username, $password, $email, $doctype, $docnumber, $phone, $facebookid, $googleid, $join_reason, $rolecompany, $companysize, $organizationname, $paymentplanid, $currency, $country, $businessname, $fiscaladdress, $sunatcountry, $contactemail, $contact, $autosendinvoice, $timezoneoffset, $timezone)",
        module: "",
        protected: "INSERT"
    },
    UFN_CAMPAIGNREPORT_SEL: {
        query: "SELECT * FROM ufn_campaign_report_sel($corpid, $orgid, $startdate, $enddate, $channeltype, $where, $order, $skip, $take, $userid, $offset,$distinct)",
        module: ["/reports", "/extras/campaign"],
        protected: "SELECT"
    },
    UFN_CAMPAIGNREPORT_TOTALRECORDS: {
        query: "SELECT * FROM ufn_campaign_report_totalrecords($corpid, $orgid, $startdate, $enddate, $channeltype, $where, $userid, $offset,$distinct)",
        module: ["/reports", "/extras/campaign"],
        protected: "SELECT"
    },
    UFN_CAMPAIGNREPORT_EXPORT: {
        query: "SELECT * FROM ufn_campaign_report_export($corpid, $orgid, $table, $username, $offset, $userid)",
        module: ["/reports", "/extras/campaign"],
        protected: "SELECT"
    },
    UFN_CAMPAIGNREPORT_PROACTIVE_EXPORT: {
        query: "SELECT * FROM ufn_campaign_report_proactive_export($corpid, $orgid, $table, $username, $offset, $userid)",
        module: ["/reports", "/extras/campaign"],
        protected: "SELECT"
    },
    UFN_CHATFLOW_TAG_SEL: {
        query: "select * from UFN_CHATFLOW_TAG_SEL($corpid, $orgid)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_USERIDBYUSER: {
        query: "select * from ufn_useridbyuser($usr, $facebookid, $googleid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CHATFLOW_ISSELFBLOCK_SEL: {
        query: "select * from ufn_chatflow_isselfblock_sel($corpid, $orgid, $communicationchannelid)",
        module: "",
        protected: "SELECT"
    },
    UFN_INTELLIGENTMODELSCONFIGURATION_LST: {
        query: "select * from ufn_intelligentmodelsconfiguration_lst($corpid, $orgid, $userid)",
        module: ["/iaconfigurations"],
        protected: "SELECT"
    },
    UFN_INTELLIGENTMODELS_LST: {
        query: "select * from ufn_intelligentmodels_lst($corpid, $orgid)",
        module: ["/iaconfigurations", "/iaconectors"],
        protected: "SELECT"
    },
    UFN_INTELLIGENTMODELSCONFIGURATION_INS: {
        query: "SELECT * FROM ufn_intelligentmodelsconfiguration_ins($corpid, $orgid, $communicationchannelid, $username, $intelligentmodelsconfigurationid, $operation, $description, $type, $status, $color, $icontype, $parameters)",
        module: ["/iaconfigurations"],
        protected: "INSERT"
    },
    UFN_CONVERSATION_SEL_PERSON_TOTALRECORDS: {
        query: "SELECT * FROM ufn_conversation_sel_person_totalrecords($personid, $where)",
        module: ["/person"],
        protected: "SELECT"
    },
    UFN_ORGANIZATION_CHANGEORG_SEL: {
        query: "SELECT * FROM ufn_organization_changeorg_sel($userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_USERSTATUS_UPDATE_ORG: {
        query: "SELECT * FROM ufn_userstatus_update_org($userid, $orgid, $neworgid, $usr)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATIONWHATSAPP_REPORT: {
        query: `SELECT * FROM ufn_conversationwhatsapp_report($corpid, $orgid, $startdate, $enddate, $offset)`,
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_SUMMARY_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_summary_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $userid, $offset )",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_SUMMARY_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_summary_data_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $userid, $offset )",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_TMO_GENERAL_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_tmo_general_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $level, $closedby, $min, $max, $target, $skipdown, $skipup, $bd, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_TMO_GENERAL_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_tmo_general_data_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $level, $closedby, $min, $max, $target, $skipdown, $skipup, $bd, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_TME_GENERAL_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_tme_general_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $level, $closedby, $min, $max, $target, $skipdown, $skipup, $bd, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_TME_GENERAL_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_tme_general_data_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $level, $closedby, $min, $max, $target, $skipdown, $skipup, $bd, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_ENCUESTA_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_encuesta_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $closedby , $userid, $offset )",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_ENCUESTA3_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_encuesta3_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $question, $closedby, $target, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_ENCUESTA3_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_encuesta3_data_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $question, $closedby, $target, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_ENCUESTA2_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_encuesta2_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $question, $closedby, $target, $userid, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_ENCUESTA2_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_encuesta2_data_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $question, $closedby, $target, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_ASESORESCONECTADOSBAR_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_asesoresconectadosbar_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company , $userid, $offset )",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_ASESORESCONECTADOSBAR_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_asesoresconectadosbar_data_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company , $userid, $offset )",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_CONVERSATION_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_conversation_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company , $userid, $offset )",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_CONVERSATION_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_conversation_data_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company , $userid, $offset )",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_INTERACTION_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_interaction_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company , $userid, $offset )",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_INTERACTION_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_interaction_data_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company , $userid, $offset )",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_ETIQUETAS_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_etiquetas_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $limit , $userid, $offset )",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_ETIQUETAS_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_etiquetas_data_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $limit , $userid, $offset )",
        module: ["/dashboard"],
        protected: "SELECT"
    },

    UFN_DASHBOARD_OPERATIVO_SUMMARY_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_summary_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $skipdowntmo, $skipuptmo, $skipdowntme, $skipuptme, $supervisorid, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_TMO_GENERAL_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_tmo_general_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $level, $closedby, $min, $max, $target, $skipdown, $skipup, $bd, $supervisorid, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_TMO_GENERAL_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_tmo_general_data_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $level, $closedby, $min, $max, $target, $skipdown, $skipup, $bd, $supervisorid, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_TME_GENERAL_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_tme_general_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $level, $closedby, $min, $max, $target, $skipdown, $skipup, $bd, $supervisorid, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_TME_GENERAL_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_tme_general_data_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $level, $closedby, $min, $max, $target, $skipdown, $skipup, $bd, $supervisorid, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_PRODXHORA_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_prodxhora_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $level, $supervisorid, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_TMODIST_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_tmodist_data_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $skipdowntmo, $skipuptmo, $skipdowntme, $skipuptme, $supervisorid, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_TMEDIST_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_tmedist_data_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $skipdowntmo, $skipuptmo, $skipdowntme, $skipuptme, $supervisorid, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_PRODXHORADIST_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_prodxhoradist_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $supervisorid, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_PRODXHORADIST_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_prodxhoradist_data_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $supervisorid, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_ENCUESTA_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_encuesta_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $closedby, $supervisorid, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_ENCUESTA3_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_encuesta3_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $question, $closedby, $target, $supervisorid, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_ENCUESTA3_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_encuesta3_data_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $question, $closedby, $target, $supervisorid, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_ENCUESTA2_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_encuesta2_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $question, $closedby, $target, $supervisorid, $userid, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_ENCUESTA2_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_encuesta2_data_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $question, $closedby, $target, $supervisorid, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },

    UFN_COUNT_CONFIGURATION: {
        query: "SELECT * FROM ufn_count_configuration($corpid, $orgid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_PROPERTY_SELBYNAME: {
        query: "SELECT * FROM ufn_property_selbyname($corpid, $orgid, $propertyname)",
        module: ["/organizations", "/supervisor", "/tickets", "/message_inbox", "/extras/campaign"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_PUSH_HSMCATEGORYRANK_SEL: {
        query: "SELECT * FROM ufn_dashboard_push_hsmcategoryrank_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $category, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_PUSH_HSMCATEGORYRANK_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_push_hsmcategoryrank_data_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $category, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_PUSH_SUMMARY_SEL: {
        query: "SELECT * FROM ufn_dashboard_push_summary_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $category, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_PUSH_SUMMARY_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_push_summary_data_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $category, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_PUSH_HSMRANK_SEL: {
        query: "SELECT * FROM ufn_dashboard_push_hsmrank_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $category, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_PUSH_HSMRANK_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_push_hsmrank_data_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $category, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_PUSH_MENSAJEXDIA_SEL: {
        query: "SELECT * FROM ufn_dashboard_push_mensajexdia_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $category, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_PUSH_MENSAJEXDIA_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_push_mensajexdia_data_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $category, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_PUSH_APPLICATION_SEL: {
        query: "SELECT * FROM ufn_dashboard_push_application_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $category, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_PUSH_APPLICATION_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_push_application_data_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $category, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_CHANNEL_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_channel_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_TAG_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_tag_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_TAG_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_tag_data_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_USER_SUPERVISORBYORGID_LST: {
        query: "SELECT * FROM ufn_user_supervisorbyorgid_lst($corpid, $orgid)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_LABEL_LST: {
        query: "SELECT * FROM ufn_label_lst($corpid, $orgid)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_GET_TOKEN_LOGGED_MOVIL: {
        query: "SELECT * FROM ufn_get_token_logged_movil($userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_USER_UPDATE: {
        query: "SELECT * FROM ufn_user_update($userid, $firstname, $lastname, $password, $image, $languagesettings)",
        module: "",
        protected: "INSERT"
    },
    UFN_USER_VALIDATE: {
        query: "SELECT * FROM ufn_user_validate($userid, $password)",
        module: "",
        protected: "INSERT"
    },
    UFN_ORGUSER_CHANNELS_UPDATE: {
        query: "SELECT * FROM ufn_orguser_channels_update($corpid, $orgid, $userid, $channels)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_SEL_TICKETSBYUSER_FILTER: {
        query: "SELECT * FROM ufn_conversation_sel_ticketsbyuser_filter($corpid, $orgid, $userid, $start_createticket, $end_createticket, $channels, $conversationstatus, $displayname, $phone, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_PERSON_INS: {
        query: "select * from ufn_person_ins( $id, $corpid, $orgid, $groups, $status, $type, $persontype, $personstatus, $phone, $email, $birthday, $alternativephone, $alternativeemail, $documenttype, $documentnumber, $firstname, $lastname, $sex, $gender, $civilstatus, $occupation, $educationlevel, $referringpersonid, $observation, $address, $healthprofessional, $referralchannel, $district, $username, $operation)",
        module: ["/message_inbox", "/supervisor"],
        protected: "SELECT"
    },
    UFN_PERSON_PCC_INS: {
        query: "select * from ufn_person_pcc_ins( $id, $corpid, $orgid, $groups, $status, $type, $persontype, $personstatus, $phone, $email, $birthday, $alternativephone, $alternativeemail, $documenttype, $documentnumber, $firstname, $lastname, $sex, $gender, $civilstatus, $occupation, $educationlevel, $referringpersonid, $observation, $address, $healthprofessional, $referralchannel, $district, $username, $operation, $variablecontext)",
        module: ["/person"],
        protected: "SELECT"
    },
    UFN_LEAD_INS: {
        query: "select * from ufn_lead_ins($corpid, $orgid, $leadid, $description, $type, $status, $expected_revenue, $date_deadline, $tags, $personcommunicationchannel, $priority, $conversationid, $columnid, $column_uuid, $username, $index, $phone, $email, $userid, $phase, $campaignid, $leadproduct, $operation, $personid, $persontype, $estimatedimplementationdate, $estimatedbillingdate, $variablecontext)",
        module: ["/crm", "/message_inbox", "/supervisor"],
        protected: "INSERT"
    },
    UFN_LEADGRID_TRACKING_SEL: {
        query: "select * from ufn_leadgrid_tracking_sel($corpid, $orgid, $take, $skip, $where, $order, $startdate, $enddate, $offset)",
        module: "",
        protected: "INSERT"
    },
    UFN_LEADGRID_TRACKING_TOTALRECORDS: {
        query: "select * from ufn_leadgrid_tracking_totalrecords($corpid, $orgid, $take, $skip, $where, $order, $startdate, $enddate, $offset)",
        module: "",
        protected: "INSERT"
    },
    UFN_LEADGRID_TRACKING_EXPORT: {
        query: "select * from ufn_leadgrid_tracking_export($corpid, $orgid, $take, $skip, $where, $order, $startdate, $enddate, $offset)",
        module: "",
        protected: "INSERT"
    },
    UFN_LEAD_SD_INS: {
        query: "select * from ufn_lead_sd_ins($corpid, $orgid, $id, $description, $ticketnum, $type, $personid, $company, $email, $phone, $urgency, $impact, $priority, $tags, $leadgroups, $userid, $columnid, $index, $status, $column_uuid, $operation, $username)",
        module: ["/servicedesk"],
        protected: "INSERT"
    },
    UFN_LEAD_PERSON_TOTALRECORDS: {
        query: "SELECT * FROM ufn_lead_person_totalrecords($corpid, $orgid, $where, $username, $offset)",
        module: ["/crm", "/servicedesk"],
        protected: "SELECT"
    },
    UFN_LEAD_PERSON_SEL: {
        query: "SELECT  * FROM ufn_lead_person_sel($corpid, $orgid, $where, $order, $take, $skip, $username, $offset)",
        module: ["/crm", "/servicedesk"],
        protected: "SELECT"
    },
    UFN_LEAD_PERSON_INS: {
        query: "select * from ufn_lead_person_ins($corpid, $orgid, $id, $description, $type, $status, $expected_revenue, $date_deadline, $tags, $personcommunicationchannel, $priority, $conversationid, $columnid, $username, $index, $firstname, $lastname, $email, $phone, $personid, $userid, $persontype, $products)",
        module: ["/message_inbox", "/supervisor"],
        protected: "SELECT"
    },
    UFN_LEADBYPERSONCOMMUNICATIONCHANNEL_SEL: {
        query: "select * from ufn_leadbypersoncommunicationchannel_sel($corpid, $orgid, $personid)",
        module: "",
        protected: "SELECT"
    },
    UFN_COLUMN_SEL: {
        query: "select * from ufn_column_sel($corpid, $orgid, $id, $lost, $all)",
        module: ["/automatizationrules", "/person", "/crm"],
        protected: "SELECT"
    },
    UFN_LEAD_SEL: {
        query: "select * from ufn_lead_sel($corpid, $orgid,  $id, $fullname, $leadproduct, $campaignid, $tags, $userid, $supervisorid, $persontype, $ordertype, $orderby, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_COLUMN_SD_SEL: {
        query: "select * from ufn_column_sd_sel($corpid, $orgid, $id, $lost, $all)",
        module: ["/servicedesk"],
        protected: "SELECT"
    },
    UFN_LEAD_SD_SEL: {
        query: "select * from ufn_lead_sd_sel($corpid, $orgid,  $id, $fullname, $leadproduct, $tags, $supervisorid, $all, $company, $groups, $startdate, $enddate, $offset, $companyuser)",
        module: ["/servicedesk"],
        protected: "SELECT"
    },
    UFN_COLUMN_INS: {
        query: "select * from ufn_column_ins($corpid, $orgid, $id, $description, $type, $status, $edit, $username, $index, $operation, $delete_all)",
        module: ["/crm"],
        protected: "INSERT"
    },
    UFN_UPDATE_LEADS: {
        query: "select * from ufn_update_leads($corpid, $orgid, $cards_startingcolumn, $cards_finalcolumn, $startingcolumn_uuid, $finalcolumn_uuid, $leadid, $username)",
        module: ["/crm"],
        protected: "INSERT"
    },
    UFN_UPDATE_COLUMNS: {
        query: "select * from ufn_update_columns($corpid, $orgid, $cards_uuid)",
        module: ["/crm"],
        protected: "INSERT"
    },
    UFN_REPORTSCHEDULER_SEL: {
        query: "select * from ufn_reportscheduler_sel($corpid, $orgid, $id, $username, $all)",
        module: ["/reportscheduler"],
        protected: "SELECT"
    },
    UFN_REPORTSCHEDULER_INS: {
        query: "select * from ufn_reportscheduler_ins($corpid, $orgid, $id, $title, $description, $status, $type, $origin, $origintype, $reportid, $reportname, $filterjson, $frecuency, $schedule, $datarange, $mailto, $mailcc, $mailsubject, $mailbody, $mailbodyobject, $username, $operation)",
        module: ["/reportscheduler"],
        protected: "SELECT"
    },
    UFN_LEADNOTES_SEL: {
        query: "select * from ufn_leadnotes_sel($corpid, $orgid, $leadid, $leadnotesid, $all)",
        module: ["/crm", "/servicedesk"],
        protected: "SELECT"
    },
    UFN_USER_ACTIVATE: {
        query: "select * from ufn_user_activate($corpid, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_PERSONWITHOUTDATE_SEL: {
        query: "select * from ufn_personwithoutdate_sel($corpid, $orgid, $username, $where, $order, $take, $skip, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_CHANGESTATUS: {
        query: "select * from ufn_conversation_changestatus($corpid, $orgid, $conversationid, $status, $obs, $type, $userid, $username)",
        module: ["/message_inbox", "/supervisor"],
        protected: "SELECT"
    },
    UFN_ADVISERS_SEL: {
        query: "select * from ufn_advisers_sel($corpid, $orgid)",
        module: ["/crm", "/servicedesk", "/person", "/extras/botdesigner", "/extras/users"],
        protected: "SELECT"
    },
    UFN_USER_SD_SEL: {
        query: "select * from ufn_user_sd_sel($corpid, $orgid)",
        module: ["/servicedesk", "/extras/botdesigner"],
        protected: "SELECT"
    },
    UFN_PERSONWITHOUTDATE_TOTALRECORDS: {
        query: "select * from ufn_personwithoutdate_totalrecords($corpid, $orgid, $where)",
        module: "",
        protected: "SELECT"
    },
    UFN_COMMUNICATIONCHANNEL_PAYMENTPLAN_CHECK: {
        query: "SELECT * FROM ufn_communicationchannel_paymentplan_check($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_USER_PAYMENTPLAN_CHECK: {
        query: "SELECT * FROM ufn_user_paymentplan_check($corpid, $orgid)",
        module: ["/extras/users"],
        protected: "SELECT"
    },
    UFN_COUNTRY_SEL: {
        query: "SELECT code, description, currencycode FROM country",
        module: "",
        protected: "SELECT"
    },
    UFN_LEADACTIVITY_SEL: {
        query: "select * from ufn_leadactivity_sel($corpid, $orgid, $leadid, $leadactivityid, $all)",
        module: ["/crm", "/servicedesk"],
        protected: "SELECT"
    },
    UFN_PERSON_LINK_SEL: {
        query: "select * from ufn_person_link_sel($corpid, $orgid, $originpersonid, $where, $order, $take, $skip, $username, $offset)",
        module: ["/person", "/message_inbox", "/supervisor"],
        protected: "SELECT"
    },
    UFN_PERSON_LINK_TOTALRECORDS: {
        query: "select * from ufn_person_link_totalrecords($corpid, $orgid, $originpersonid, $where, $username, $offset)",
        module: ["/person", "/message_inbox", "/supervisor"],
        protected: "SELECT"
    },
    UFN_LEADACTIVITY_INS: {
        query: "select * from ufn_leadactivity_ins($corpid, $orgid, $leadid, $leadactivityid, $description, $duedate, $assigneduser, $assignto, $type, $status, $username, $operation, $feedback, $detailjson, $calendar, $sendhsm, $communicationchannelid, $hsmtemplateid, $calendarbookingid)",
        module: ["/crm", "/servicedesk"],
        protected: "INSERT"
    },
    UFN_LEADACTIVITYHISTORY_SEL: {
        query: "select * from ufn_leadactivityhistory_sel($corpid, $orgid, $leadid, $offset)",
        module: ["/crm", "/servicedesk"],
        protected: "SELECT"
    },
    UFN_HISTORYLEAD_INS: {
        query: "select * from ufn_historylead_ins($corpid, $orgid, $leadid, $historyleadid, $description, $type, $status, $username, $operation)",
        module: ["/crm", "/servicedesk"],
        protected: "INSERT"
    },
    UFN_UPDATE_LEAD_TAGS: {
        query: "select * from ufn_update_lead_tags($corpid, $orgid, $leadid, $tags, $history_description, $history_type, $history_status, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_LEADNOTES_INS: {
        query: "select * from ufn_leadnotes_ins($corpid, $orgid, $leadid, $leadnotesid, $description, $type, $status, $username, $media, $operation)",
        module: ["/crm", "/servicedesk"],
        protected: "INSERT"
    },
    UFN_LEADGRID_SEL: {
        query: "SELECT * FROM ufn_leadgrid_sel($corpid, $orgid, $take, $skip, $where, $order, $startdate, $enddate, $asesorid, $channel, $contact, $persontype, $offset)",
        module: ["/crm"],
        protected: "SELECT"
    },
    UFN_LEADGRID_TOTALRECORDS: {
        query: "SELECT * FROM ufn_leadgrid_totalrecords($corpid, $orgid, $where, $startdate, $enddate, $asesorid, $channel, $contact, $persontype, $offset)",
        module: ["/crm"],
        protected: "SELECT"
    },
    UFN_LEADGRID_SD_SEL: {
        query: "SELECT * FROM ufn_leadgrid_sd_sel($corpid, $orgid, $take, $skip, $where, $order, $startdate, $enddate, $fullname, $leadproduct, $tags, $description, $supervisorid, $company, $groups, $offset, $phase, $companyuser)",
        module: ["/servicedesk"],
        protected: "SELECT"
    },
    UFN_LEADGRID_SD_TOTALRECORDS: {
        query: "SELECT * FROM ufn_leadgrid_sd_totalrecords($corpid, $orgid, $take, $skip, $where, $order, $startdate, $enddate, $fullname, $leadproduct,  $tags, $description, $supervisorid, $company, $groups, $offset, $phase, $companyuser)",
        module: ["/servicedesk"],
        protected: "SELECT"
    },
    UFN_LEADGRID_EXPORT: {
        query: "SELECT * FROM ufn_leadgrid_export($corpid, $orgid, $where, $order, $startdate, $enddate, $asesorid, $channel, $contact, $persontype, $offset)",
        module: ["/crm", "/servicedesk"],
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_PAGE1_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_page1_sel($corpid, $orgid, $communicationchannel, $startdate, $enddate, $closedby, $userid, $offset)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_PAGE1_DATE_DETAIL_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_page1_date_detail_sel($corpid, $orgid, $communicationchannel, $startdate, $enddate, $closedby, $horanum, $option, $userid, $offset)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_DATE_DETAIL_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_date_detail_sel($corpid, $orgid, $communicationchannel, $startdate, $enddate, $closedby, $horanum, $userid, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_PAGE2_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_page2_sel($corpid, $orgid, $communicationchannel, $startdate, $enddate, $closedby, $company, $group, $userid, $offset)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_PAGE2_1_AGENT_DETAIL_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_page2_1_agent_detail_sel($corpid, $orgid, $communicationchannel, $startdate, $enddate, $closedby, $company, $group, $agentid, $option, $userid, $offset)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_PAGE2_2_AGENT_DETAIL_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_page2_2_agent_detail_sel($corpid, $orgid, $communicationchannel, $startdate, $enddate, $closedby, $company, $group, $agentid, $option, $userid, $offset)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_ATENCIONESXFECHA_TOTAL_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_atencionesxfecha_total_sel($corpid, $orgid, $communicationchannel, $startdate, $enddate, $closedby, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_USER_REPORT_HEATMAP_ASESOR_LST: {
        query: "SELECT * FROM ufn_report_heatmap_asesor_lst($corpid, $orgid, $communicationchannel, $bot)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_PAGE3_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_page3_sel($corpid, $orgid, $communicationchannel, $startdate, $enddate, $closedby, $company, $userid, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_ASESORESCONECTADOS_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_asesoresconectados_sel($corpid, $orgid, $communicationchannel, $startdate, $enddate, $offset)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_ASESORESCONECTADOS_DETAIL_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_asesoresconectados_detail_sel($corpid, $orgid, $communicationchannel, $startdate, $enddate, $horanum, $userid, $offset)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_RESUMEN_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_resumen_sel($corpid, $orgid, $communicationchannel, $startdate, $enddate, $closedby, $userid, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_TIPIFICACION_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_tipificacion_sel($corpid, $orgid, $communicationchannel, $startdate, $enddate, $closedby, $userid, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_USERPASSWORD_UPDATE: {
        query: "SELECT * FROM ufn_userpassword_update($userid, $password)",
        module: "",
        protected: "INSERT"
    },
    UFN_LEADACTIVITY_DUEDATE_SEL: {
        query: "SELECT * FROM ufn_leadactivity_duedate_sel($corpid, $orgid, $userid, $roledesc);",
        module: "",
        protected: "INSERT"
    },
    QUERY_GET_VOXIMPLANT_ORG: {
        query: "SELECT org.voximplantaccountid, org.voximplantapikey, org.voximplantapplicationid, org.voximplantcampaignruleid FROM org WHERE org.corpid = $corpid AND org.orgid = $orgid;",
        module: "",
        protected: "SELECT"
    },
    QUERY_GET_NUMBER_FROM_COMMUNICATIONCHANNEL: {
        query: "SELECT communicationchannelsite, configsip FROM communicationchannel WHERE corpid = $corpid AND orgid = $orgid AND communicationchannelid = $communicationchannelid;",
        module: "",
        protected: "SELECT"
    },

    QUERY_UPDATE_FLOW_COMMUNICATIONCHANNEL: {
        query: "update communicationchannel set flow = $flow::json WHERE corpid = $corpid AND orgid = $orgid AND communicationchannelid = $communicationchannelid;",
        module: "",
        protected: "SELECT"
    },

    QUERY_GET_VOXIMPLANT_VALIDATION: {
        query: "SELECT cc.corpid, cc.orgid, cc.communicationchannelsite, cc.communicationchannelowner FROM communicationchannel cc JOIN org ON org.corpid = cc.corpid AND org.orgid = cc.orgid WHERE cc.corpid = $corpid AND cc.orgid = $orgid AND cc.communicationchannelid = ANY(string_to_array($channels,',')::BIGINT[]) AND cc.type = 'VOXI';",
        module: "",
        protected: "SELECT"
    },
    QUERY_GET_SMS_DEFAULT_BY_ORG: {
        query: "SELECT type, communicationchannelid FROM communicationchannel where corpid = $corpid and orgid = $orgid and description = 'SMSINTERNAL' and type = 'SMSI';",
        module: "",
        protected: "INSERT"
    },
    QUERY_GET_CONFIG_MAIL: {
        query: "select email, pass, port, host, ssl, default_credentials  from org where corpid = $corpid and orgid = $orgid and private_mail = true;",
        module: "",
        protected: "INSERT"
    },
    QUERY_INSERT_TASK_SCHEDULER: {
        query: "INSERT INTO taskscheduler (corpid, orgid, tasktype, taskbody, repeatflag, repeatmode, repeatinterval, completed, datetimestart, datetimeend) values ($corpid, $orgid, $tasktype, $taskbody, $repeatflag, $repeatmode, $repeatinterval, $completed, NOW(), NOW() + INTERVAL '10 year')",
        module: "",
        protected: "INSERT"
    },
    QUERY_INSERT_REMINDER_TASK_SCHEDULER: {
        query: "INSERT INTO taskscheduler (corpid, orgid, tasktype, taskbody, repeatflag, repeatmode, repeatinterval, completed, datetimestart, datetimeend) values ($corpid, $orgid, $tasktype, $taskbody, $repeatflag, $repeatmode, $repeatinterval, $completed, TO_TIMESTAMP($monthdate,'YYYY-MM-DD') + $hourstart::INTERVAL - $remindertime::INTERVAL - $offset * INTERVAL '1 hours', NOW() + INTERVAL '10 year') RETURNING taskschedulerid",
        module: "",
        protected: "INSERT"
    },
    QUERY_UPDATE_CALENDARBOOKING_TASKID: {
        query: "UPDATE calendarbooking SET taskid = $taskid WHERE corpid = $corpid AND orgid = $orgid AND calendareventid = $calendareventid AND calendarbookingid = $calendarbookingid",
        module: "",
        protected: "INSERT"
    },
    QUERY_GET_MESSAGETEMPLATE: {
        query: "select messagetemplateid, header, name, body, priority, attachment from messagetemplate where corpid = $corpid and orgid = $orgid and messagetemplateid = $hsmtemplateid",
        module: "",
        protected: "INSERT"
    },
    QUERY_GET_MESSAGETEMPLATE_EMAIL_CAL: {
        query: "select messagetemplateid, header, body, priority, attachment from messagetemplate where corpid = $corpid and orgid = $orgid and messagetemplateid = $messagetemplateidemail",
        module: "",
        protected: "INSERT"
    },
    QUERY_GET_MESSAGETEMPLATE_BYNAMESPACE: {
        query: "select messagetemplateid, header, body, priority, attachment from messagetemplate where corpid = $corpid and orgid = $orgid and namespace = $namespace",
        module: "",
        protected: "INSERT"
    },
    UFN_BILLINGSUPPORT_INS: {
        query: "SELECT * FROM ufn_billingsupport_ins($year, $month, $plan, $id, $basicfee, $starttime, $finishtime, $plancurrency, $description, $status, $type, $username, $operation)",
        module: ["/billing_setups"],
        protected: "INSERT"
    },
    UFN_BILLINGSUPPORT_SEL: {
        query: "SELECT * FROM ufn_billingsupport_sel($year, $month, $plan)",
        module: ["/billing_setups"],
        protected: "SELECT"
    },
    UFN_SUPPORTPLAN_SEL: {
        query: "SELECT * FROM ufn_supportplan_sel()",
        module: ["/invoice", "/billing_setups"],
        protected: "SELECT"
    },
    UFN_PAYMENTPLAN_SEL: {
        query: "SELECT * FROM ufn_paymentplan_sel($code, $all)",
        module: ["/corporations", "/invoice", "/billing_setups"],
        protected: "SELECT"
    },
    UFN_BILLINGCONFIGURATION_INS: {
        query: "SELECT * FROM ufn_billingconfiguration_ins($year, $month, $plan, $id, $basicfee, $userfreequantity, $useradditionalfee, $channelfreequantity, $channelwhatsappfee, $channelotherfee, $clientfreequantity, $clientadditionalfee, $allowhsm, $hsmfee, $description, $status, $whatsappconversationfreequantity, $freewhatsappchannel, $usercreateoverride, $channelcreateoverride, $vcacomissionperhsm, $vcacomissionpervoicechannel, $plancurrency, $vcacomission, $basicanualfee, $type, $username, $operation)",
        module: ["/billing_setups"],
        protected: "INSERT"
    },
    UFN_BILLINGCONFIGURATION_SEL: {
        query: "SELECT * FROM ufn_billingconfiguration_sel($year, $month, $plan)",
        module: ["/billing_setups"],
        protected: "SELECT"
    },
    UFN_BILLINGCONVERSATION_INS: {
        query: "SELECT * FROM ufn_billingconversation_ins($id, $year, $month, $countrycode, $vcacomission, $description, $status, $type, $plancurrency, $businessutilityfee, $businessauthenticationfee, $businessmarketingfee, $usergeneralfee, $freequantity, $username, $operation)",
        module: ["/billing_setups"],
        protected: "INSERT"
    },
    UFN_BILLINGCONVERSATION_SEL: {
        query: "SELECT * FROM ufn_billingconversation_sel($year, $month, $countrycode)",
        module: ["/billing_setups"],
        protected: "SELECT"
    },
    UFN_BILLINGPERIOD_SEL: {
        query: "SELECT * FROM ufn_billingperiod_sel($corpid, $orgid, $year, $month, $billingplan, $supportplan, $userid)",
        module: ["/channels"],
        protected: "SELECT"
    },
    UFN_BILLINGPERIOD_NEWMONTH: {
        query: "SELECT * FROM ufn_billingperiod_newmonth($corpid, $orgid, $year, $month)",
        module: "",
        protected: "INSERT"
    },
    UFN_BILLINGPERIOD_UPD: {
        query: "SELECT * FROM ufn_billingperiod_upd($corpid, $orgid, $year, $month, $billingplan, $billingsupportplan, $billinginvoicecurrency, $billingplancurrency, $billingstartdate, $billingmode, $billingplanfee, $billingsupportfee, $billinginfrastructurefee, $billingexchangerate, $agentcontractedquantity, $agentplancurrency, $agentadditionalfee, $agenttotalfee, $agentaddlimit, $agentmode, $channelothercontractedquantity, $channelotheradditionalfee, $channelwhatsappcontractedquantity, $channelwhatsappadditionalfee, $channelotherquantity, $channelwhatsappquantity, $channeltotalfee, $channelwhatsappfreequantity, $channeladdlimit, $conversationuserplancurrency, $conversationuserserviceadditionalfee, $conversationuserservicevcafee, $conversationusermetacurrency, $conversationuserservicefee, $conversationuserservicetotalfee, $conversationbusinessplancurrency, $conversationbusinessutilityadditionalfee, $conversationbusinessauthenticationadditionalfee, $conversationbusinessmarketingadditionalfee, $conversationbusinessutilityvcafee, $conversationbusinessauthenticationvcafee, $conversationbusinessmarketingvcafee, $conversationbusinessmetacurrency, $conversationbusinessutilitymetafee, $conversationbusinessauthenticationmetafee, $conversationbusinessmarketingmetafee, $conversationbusinessutilitytotalfee, $conversationbusinessauthenticationtotalfee, $conversationbusinessmarketingtotalfee, $conversationplancurrency, $contactcalculatemode, $contactcountmode, $contactuniquelimit, $contactuniquequantity, $contactplancurrency, $contactuniqueadditionalfee, $contactuniquefee, $contactwhatsappquantity, $contactotherquantity, $contactotheradditionalfee, $contactwhatsappadditionalfee, $contactotherfee, $contactwhatsappfee, $contactfee, $messagingplancurrency, $messagingsmsadditionalfee, $messagingsmsvcafee, $messagingsmsquantity, $messagingsmsquantitylimit, $messagingsmstotalfee, $messagingmailadditionalfee, $messagingmailvcafee, $messagingmailquantity, $messagingmailquantitylimit, $messagingmailtotalfee, $voicevcacomission, $consultingplancurrency, $consultinghourtotal, $consultinghourquantity, $consultingcontractedfee, $consultingextrafee, $consultingtotalfee, $consultingprofile, $consultingadditionalfee, $additionalservice01, $additionalservice01fee, $additionalservice02, $additionalservice02fee, $additionalservice03, $additionalservice03fee, $invoiceid, $status, $force)",
        module: ["/invoice"],
        protected: "INSERT"
    },
    UFN_BILLINGPERIOD_CALC: {
        query: "SELECT * FROM ufn_billingperiod_calc($corpid, $orgid, $year, $month, $force)",
        module: ["/invoice"],
        protected: "INSERT"
    },
    UFN_ORG_LIST: {
        query: "SELECT * FROM ufn_org_lst($corpid, $userid)",
        module: ["/timesheet", "/invoice", "/billing_setups"],
        protected: "SELECT"
    },
    UFN_CONVERSATION_OUTBOUND_INS: {
        query: `select * from ufn_conversation_outbound_ins($personid, $personcommunicationchannel, $communicationchannelid, $corpid, $orgid, $userid, $closetype, $status, $finishdate, $handoff, $usergroup, $extradata, $lastreplydate, $personlastreplydate, $origin, $firstname, $lastname, $communicationchanneltype, $personcommunicationchannelowner, $interactiontype, $interactiontext, $phone)`,
        module: "",
        protected: "INSERT"
    },
    UFN_CONVERSATION_OUTBOUND_VALIDATE: {
        query: `select * from ufn_conversation_outbound_validate($corpid, $orgid, $communicationchannelid, $personcommunicationchannel)`,
        module: "",
        protected: "INSERT"
    },
    UFN_CONVERSATION_SUPERVISIONSTATUS: {
        query: `select * from ufn_conversation_supervisionstatus($corpid, $orgid, $conversationid, $status, $type, $userid, $username)`,
        module: ["/message_inbox", "/supervisor"],
        protected: "INSERT"
    },
    UFN_CONVERSATION_TRANSFERSTATUS: {
        query: `select * from ufn_conversation_transferstatus($corpid, $orgid, $conversationid, $status, $type, $userid, $username)`,
        module: "",
        protected: "INSERT"
    },
    UFN_BILLINGPERIOD_SUMMARYORG: {
        query: "SELECT * FROM ufn_billingperiod_summaryorg($corpid, $orgid, $year, $month, $userid)",
        module: ["/invoice"],
        protected: "SELECT"
    },
    UFN_BILLINGPERIOD_SUMMARYCORP: {
        query: "SELECT * FROM ufn_billingperiod_summarycorp($corpid, $year, $month, $userid)",
        module: ["/invoice"],
        protected: "SELECT"
    },
    UFN_BILLING_REPORT_PERSON: {
        query: "SELECT * FROM ufn_billing_report_person($corpid, $orgid, $year, $month)",
        module: ["/invoice"],
        protected: "SELECT"
    },
    UFN_BILLING_REPORT_USER: {
        query: "SELECT * FROM ufn_billing_report_user($corpid, $orgid, $year, $month)",
        module: ["/invoice"],
        protected: "SELECT"
    },
    QUERY_SEL_PROPERTY_ON_LOGIN: {
        query: "SELECT propertyname, propertyvalue, communicationchannelid FROM property p WHERE p.corpid = :corpid AND p.orgid = :orgid AND p.propertyname IN (:propertynames) and p.status = 'ACTIVO';",
        module: "",
        protected: "SELECT"
    },
    QUERY_SEL_PROPERTY_ENV_ON_LOGIN: {
        query: "SELECT propertyname, propertyvalue FROM property p WHERE p.corpid = $corpid AND p.propertyname = 'AMBIENTE' and p.status = 'ACTIVO';",
        module: "",
        protected: "SELECT"
    },
    QUERY_SEL_PROPERTY_INTEGRATION: {
        query: `SELECT im.corpid, im.orgid, p.propertyname, p.propertyvalue FROM integrationmanager im
        INNER JOIN property p ON p.corpid = im.corpid AND p.orgid = im.orgid AND p.propertyname = 'MAXIMAPI'
        WHERE split_part(url, '/', array_length(string_to_array(url, '/'), 1)) = $table_name;`,
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARDTEMPLATE_SEL: {
        query: "SELECT * FROM ufn_dashboardtemplate_sel($corpid, $orgid, $id, $all);",
        module: ["/dashboard"],
        protected: "INSERT"
    },
    UFN_DASHBOARDTEMPLATE_INS: {
        query: "SELECT * FROM ufn_dashboardtemplate_ins($id, $corpid, $orgid, $description, $status, $type, $detailjson, $layoutjson, $username, $operation);",
        module: ["/dashboard"],
        protected: "INSERT"
    },
    QUERY_INSERT_HSM_HISTORY: {
        query: "insert into hsmhistory (corpid, orgid, description, status, type, createdate, createby, changedate, changeby, config, success, message, shippingreason, messagetemplateid) values ($corpid, $orgid, '', $status, $type, NOW(), 'admin', NOW(), 'admin', $config, $success, $message, $shippingreason, $messatemplateid) returning hsmhistoryid",
        module: "",
        protected: "SELECT"
    },
    UFN_HSMHISTORY_LST: {
        query: "SELECT * FROM ufn_hsmhistory_lst($corpid, $orgid, $startdate, $enddate, $offset, $userid);",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_HSMHISTORY_REPORT: {
        query: "SELECT * FROM ufn_hsmhistory_report($corpid, $orgid, $campaignname, $date, $offset, $userid);",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_HSMHISTORY_REPORT_EXPORT: {
        query: "SELECT * FROM ufn_hsmhistory_report_export($corpid, $orgid, $table, $offset, $userid);",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_SENTMESSAGES_LST: {
        query: "SELECT * FROM ufn_report_sentmessages_lst($corpid, $orgid, $startdate, $enddate, $offset, $userid);",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_SENTMESSAGES_REPORT: {
        query: "SELECT * FROM ufn_report_sentmessages_sel($corpid, $orgid, $date, $name, $from, $offset, $userid, $campaignname);",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_SENTMESSAGES_GRAPHIC: {
        query: "SELECT * FROM ufn_report_sentmessages_graphic($corpid, $orgid, $startdate, $enddate, $column, $summarization, $offset, $userid);",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_INPUTVALIDATION_SEL: {
        query: "SELECT * FROM ufn_inputvalidation_sel($corpid, $id, $username);",
        module: ["/extras/inputvalidation", "/channels"],
        protected: "SELECT"
    },
    UFN_INPUTVALIDATION_INS: {
        query: "SELECT * FROM ufn_inputvalidation_ins($corpid, $id, $operation, $description, $inputvalue, $type, $status, $username);",
        module: ["/extras/inputvalidation"],
        protected: "INSERT"
    },
    QUERY_GET_DASHBOARDTEMPLATE: {
        query: "select detailjson, description from dashboardtemplate where corpid = $corpid and orgid = $orgid and dashboardtemplateid = $dashboardtemplateid",
        module: "",
        protected: "INSERT"
    },
    QUERY_GET_REPORTTEMPLATE: {
        query: "select columnjson, filterjson, description, dataorigin from reporttemplate where corpid = $corpid and orgid = $orgid and reporttemplateid = $reporttemplateid and status = 'ACTIVO'",
        module: "",
        protected: "INSERT"
    },
    QUERY_GET_KPI: {
        query: "select target, cautionat, alertat, currentvalue from kpi where corpid = $corpid and orgid = $orgid and kpiid = $kpiid",
        module: "",
        protected: "INSERT"
    },
    UFN_INTERACTION_INS_MASSIVE: {
        query: "select * from ufn_interaction_ins_massive($corpid, $orgid, $personid, $personcommunicationchannel, $conversationid, $communicationchannelid, $json)",
        module: "",
        protected: "INSERT"
    },
    UFN_INVOICE_SEL: {
        query: "SELECT * FROM ufn_invoice_sel($corpid, $orgid, $invoiceid, $userid, $year, $month, $currency, $paymentstatus)",
        module: ["/invoice", "/reports"],
        protected: "SELECT"
    },
    UFN_INVOICE_SELCLIENT: {
        query: "SELECT * FROM ufn_invoice_selclient($corpid, $orgid, $invoiceid, $userid, $year, $month, $currency, $paymentstatus)",
        module: ["/invoice"],
        protected: "SELECT"
    },
    UFN_INVOICE_SELBYID: {
        query: "SELECT * FROM ufn_invoice_selbyid($corpid, $orgid, $invoiceid, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_INVOICE_INS: {
        query: "SELECT * FROM ufn_invoice_ins($corpid, $orgid, $invoiceid, $description, $status, $type, $issuerruc, $issuerbusinessname, $issuertradename, $issuerfiscaladdress, $issuerubigeo, $emittertype, $annexcode, $printingformat, $xmlversion, $ublversion, $receiverdoctype, $receiverdocnum, $receiverbusinessname, $receiverfiscaladdress, $receivercountry, $receivermail, $invoicetype, $sunatopecode, $serie, $correlative, $concept, $invoicedate, $expirationdate, $subtotal, $taxes, $totalamount, $currency, $exchangerate, $invoicestatus, $filenumber, $purchaseorder, $executingunitcode, $selectionprocessnumber, $contractnumber, $comments, $credittype, $creditnotetype, $creditnotemotive, $creditnotediscount, $invoicereferencefile, $invoicepaymentnote, $username, $referenceinvoiceid, $netamount, $paymentstatus, $hasreport, $year, $month, $paymentmethod)",
        module: "",
        protected: "INSERT"
    },
    UFN_INVOICE_REGENERATE: {
        query: "SELECT * FROM ufn_invoice_regenerate($corpid, $orgid, $invoiceid, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_INVOICE_ORDER: {
        query: "SELECT * FROM ufn_invoice_order($corpid, $orgid, $invoiceid, $orderid, $orderjson)",
        module: "",
        protected: "INSERT"
    },
    UFN_INVOICE_PAYMENT: {
        query: "SELECT * FROM ufn_invoice_payment($corpid, $orgid, $invoiceid, $paidby, $email, $tokenid, $capture, $tokenjson, $chargeid, $chargetoken, $chargejson, $culqiamount, $location, $paymentprovider)",
        module: "",
        protected: "INSERT"
    },
    UFN_INVOICE_CHANGEPAYMENTSTATUS: {
        query: "SELECT * FROM ufn_invoice_changepaymentstatus($corpid, $orgid, $invoiceid, $status, $paymentnote, $paymentfile, $paymentcommentary, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_INVOICE_REFUND: {
        query: "SELECT * FROM ufn_invoice_refund($corpid, $orgid, $invoiceid, $refundtoken, $refundjson, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_CHARGE_SEL: {
        query: "SELECT * FROM ufn_charge_sel($corpid, $orgid, $userid, $chargeid)",
        module: "",
        protected: "INSERT"
    },
    UFN_CHARGE_INS: {
        query: "SELECT * FROM ufn_charge_ins($corpid, $orgid, $id, $invoiceid, $description, $type, $status, $amount, $currency, $paidby, $orderid, $orderjson, $email, $tokenid, $capture, $tokenjson, $chargetoken, $chargejson, $operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_CHARGE_REFUND: {
        query: "SELECT * FROM ufn_charge_refund($corpid, $orgid, $chargeid, $refundtoken, $refundjson, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_MESSAGETEMPLATE_LST: {
        query: "SELECT * FROM ufn_messagetemplate_lst($corpid, $orgid, $type, $username)",
        module: ["/supervisor", "/message_inbox", "/calendar", "/extras/campaign", "/crm", "/servicedesk", "/automatizationrules", "/person", "/extras/botdesigner", "/extras/users",],
        protected: "INSERT"
    },

    UFN_MESSAGETEMPLATE_LST_OLD: {
        query: "SELECT * FROM ufn_messagetemplate_lst($corpid, $orgid, $type, $username, $newversion)",
        module: ["/supervisor", "/message_inbox", "/calendar", "/extras/campaign", "/crm", "/servicedesk", "/automatizationrules", "/person", "/extras/botdesigner", "/extras/users",],
        protected: "INSERT"
    },
    QUERY_UPDATE_PERSON_BY_HSM: {
        query: "UPDATE person pe SET firstcontact = CASE WHEN pe.firstcontact IS NULL THEN NOW() else pe.firstcontact END, lastcontact = NOW() where pe.personid IN (:personids) and pe.corpid = :corpid and pe.orgid = :orgid;",
        module: "",
        protected: "INSERT"
    },
    QUERY_SEL_INOVICE_BY_ID: {
        query: "select * from invoice where corpid = $corpid and invoiceid = $invoiceid",
        module: "",
        protected: "SELECT"
    },
    QUERY_SEL_INOVICEDETAIL_BY_ID: {
        query: "select * from invoicedetail where corpid = $corpid and invoiceid = $invoiceid",
        module: "",
        protected: "SELECT"
    },
    UFN_INVOICE_CORRELATIVE: {
        query: "select * from ufn_invoice_correlative($corpid, $orgid, $invoiceid)",
        module: "",
        protected: "SELECT"
    },
    UFN_LEAD_TAGSDISTINCT_SEL: {
        query: "select * from ufn_lead_tagsdistinct_sel($corpid, $orgid)",
        module: ["/crm", "/servicedesk"],
        protected: "SELECT"
    },
    UFN_INVOICE_SUNAT: {
        query: "SELECT * FROM ufn_invoice_sunat($corpid, $orgid, $invoiceid, $status, $error, $qrcode, $hashcode, $urlcdr, $urlpdf, $urlxml, $serie, $issuerruc, $issuerbusinessname, $issuertradename, $issuerfiscaladdress, $issuerubigeo, $emittertype, $annexcode, $printingformat, $sendtosunat, $returnpdf, $returnxmlsunat, $returnxml, $token, $sunaturl, $sunatusername, $xmlversion, $ublversion, $receiverdoctype, $receiverdocnum, $receiverbusinessname, $receiverfiscaladdress, $receivercountry, $receivermail, $invoicetype, $sunatopecode, $expirationdate, $purchaseorder, $comments, $credittype, $detractioncode, $detraction, $detractionaccount, $invoicedate, $location, $invoiceprovider, $correlative)",
        module: "",
        protected: "INSERT"
    },
    UFN_DASHBOARD_GERENCIAL_CONVERSATIONXHOUR_SEL: {
        query: "select * from ufn_dashboard_gerencial_conversationxhour_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $skipdown, $skipup, $userid, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_CONVERSATIONSTATUS_SEL: {
        query: "select * from ufn_conversationstatus_sel($corpid, $orgid, $personid, $conversationid, $communicationchannelid)",
        module: ["/tickets"],
        protected: "SELECT"
    },
    UFN_APPSETTING_INVOICE_SEL: {
        query: "select * from public.ufn_appsetting_invoice_sel()",
        module: ["/invoice", "/billing_setups"],
        protected: "SELECT"
    },
    UFN_APPSETTING_INVOICE_UPDATE: {
        query: "select * from public.ufn_appsetting_invoice_update($id, $ruc, $businessname, $tradename, $fiscaladdress, $ubigeo, $country, $emittertype, $currency, $invoiceserie, $invoicecorrelative, $annexcode, $igv, $printingformat, $xmlversion, $ublversion, $returnpdf, $returnxmlsunat, $returnxml, $invoiceprovider, $sunaturl, $token, $sunatusername, $paymentprovider, $publickey, $privatekey, $ticketserie, $ticketcorrelative, $invoicecreditserie, $invoicecreditcorrelative, $ticketcreditserie, $ticketcreditcorrelative, $detraction, $detractioncode, $detractionaccount, $operationcodeperu, $operationcodeother, $culqiurl, $detractionminimum, $culqiurlcardcreate, $culqiurlclient, $culqiurltoken, $culqiurlcharge, $culqiurlcardget, $culqiurlcarddelete, $location, $documenttype, $description, $status, $type, $username, $operation)",
        module: ["/billing_setups"],
        protected: "UPDATE"
    },
    UFN_APPSETTING_INVOICE_SEL_COMBO: {
        query: "select * from public.ufn_appsetting_invoice_sel_combo()",
        module: "",
        protected: "SELECT"
    },
    UFN_KPI_SEL: {
        query: "SELECT * FROM ufn_kpi_sel($corpid, $orgid, $kpiid)",
        module: ["/kpimanager"],
        protected: "SELECT"
    },
    UFN_KPI_LST: {
        query: "SELECT * FROM ufn_kpi_lst($corpid, $orgid)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_KPI_INS: {
        query: "SELECT * FROM ufn_kpi_ins($corpid, $orgid, $id, $kpiname, $description, $status, $type, $sqlselect, $sqlwhere, $target, $cautionat, $alertat, $taskperiod, $taskinterval, $taskstartdate, $username, $operation, $offset)",
        module: ["/kpimanager"],
        protected: "INSERT"
    },
    UFN_KPI_DUPLICATE: {
        query: "SELECT * FROM ufn_kpi_duplicate($corpid, $orgid, $kpiid, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_KPI_CALC: {
        query: "SELECT * FROM ufn_kpi_calc($corpid, $orgid, $kpiid, $username, $task)",
        module: ["/kpimanager"],
        protected: "INSERT"
    },
    UFN_KPIHISTORY_SEL: {
        query: "SELECT * FROM ufn_kpihistory_sel($corpid, $orgid, $kpiid, $startdate, $enddate, $offset)",
        module: ["/kpimanager"],
        protected: "SELECT"
    },
    UFN_BILLINGPERIOD_CALC_REFRESHALL: {
        query: "SELECT * FROM ufn_billingperiod_calc_refreshall((SELECT EXTRACT (YEAR from (select now() at time zone 'utc'))::bigint), (SELECT EXTRACT (MONTH from (select now() at time zone 'utc'))::bigint), $corpid, $orgid)",
        module: ["/invoice"],
        protected: "INSERT"
    },
    UFN_INVOICEDETAIL_SELBYINVOICEID: {
        query: "SELECT * FROM ufn_invoicedetail_selbyinvoiceid($corpid, $orgid, $invoiceid, $userid)",
        module: ["/invoice"],
        protected: "SELECT"
    },
    UFN_BILLINGMESSAGING_INS: {
        query: "SELECT * FROM ufn_billingmessaging_ins($year, $month, $id, $pricepersms, $vcacomissionpersms, $pricepermail, $vcacomissionpermail, $description, $status, $type, $username, $operation)",
        module: ["/billing_setups"],
        protected: "INSERT"
    },
    UFN_BILLINGMESSAGING_SEL: {
        query: "SELECT * FROM ufn_billingmessaging_sel($year, $month)",
        module: ["/billing_setups"],
    },
    UFN_REPORT_PERSONALIZED_ORIGIN_SEL: {
        query: "SELECT * FROM ufn_report_personalized_origin_sel()",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_PERSONALIZED_VARIABLE_SEL: {
        query: "SELECT * FROM ufn_report_personalized_variable_sel($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_PERSONALIZED_COLUMNS_SEL: {
        query: "SELECT * FROM ufn_report_personalized_columns_sel($corpid, $orgid, $tablename)",
        module: ["/reports", "/dashboard"],
        protected: "SELECT"
    },
    UFN_INVOICE_TICKETCORRELATIVE: {
        query: "select * from ufn_invoice_ticketcorrelative($corpid, $orgid, $invoiceid)",
        module: "",
        protected: "SELECT"
    },
    UFN_INVOICE_REFRESH: {
        query: "select * from ufn_invoice_refresh($corpid, $orgid, $invoiceid, $year, $month)",
        module: ["/invoice"],
        protected: "SELECT"
    },
    UFN_ADVISERSBYUSERID_SEL: {
        query: "select * from ufn_advisersbyuserid_sel($corpid, $orgid, $userid)",
        module: ["/crm", "/servicedesk"],
        protected: "SELECT"
    },
    UFN_INVOICE_CORRELATIVEERROR: {
        query: "select * from ufn_invoice_correlativeerror($corpid, $orgid, $invoiceid)",
        module: "",
        protected: "SELECT"
    },
    UFN_BALANCE_OUTPUT: {
        query: "select * from ufn_balance_output($corpid, $orgid, $communicationchannelid, $hsmtemplateid, '', 'ACTIVO', $type, $shippingreason, $receiver, $fee, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_BALANCE_CHECK: {
        query: "select * from ufn_balance_check($corpid, $orgid, $communicationchannelid, $messagetemplateid, $type, $receiver, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_INVOICE_TICKETCORRELATIVEERROR: {
        query: "select * from ufn_invoice_ticketcorrelativeerror($corpid, $orgid, $invoiceid)",
        module: "",
        protected: "SELECT"
    },
    UFN_MEASUREUNIT_SEL: {
        query: "SELECT code, description, status FROM measureunit",
        module: ["/invoice"],
        protected: "SELECT"
    },
    UFN_INVOICEDETAIL_INS: {
        query: "SELECT * FROM ufn_invoicedetail_ins($corpid, $orgid, $invoiceid, $description, $status, $type, $quantity, $productcode, $hasigv, $saletype, $igvtribute, $measureunit, $totaligv, $totalamount, $igvrate, $productprice, $productdescription, $productnetprice, $productnetworth, $netamount, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_CORP_PAYMENTPLAN_UPD: {
        query: "SELECT * from ufn_corp_paymentplan_upd($corpid, $paymentplancode, $username)",
        module: ["/usersettings"],
        protected: "SELECT"
    },
    UFN_CORP_PAYMENTPLAN_CANCEL: {
        query: "SELECT * from ufn_corp_paymentplan_cancel($corpid, $username, $offset)",
        module: ["/usersettings"],
        protected: "SELECT"
    },
    UFN_INVOICECREDIT_CORRELATIVE: {
        query: "select * from ufn_invoicecredit_correlative($corpid, $orgid, $invoiceid)",
        module: "",
        protected: "SELECT"
    },
    UFN_INVOICECREDIT_CORRELATIVEERROR: {
        query: "select * from ufn_invoicecredit_correlativeerror($corpid, $orgid, $invoiceid)",
        module: "",
        protected: "SELECT"
    },
    UFN_INVOICECREDIT_TICKETCREDITCORRELATIVE: {
        query: "select * from ufn_invoicecredit_ticketcreditcorrelative($corpid, $orgid, $invoiceid)",
        module: "",
        protected: "SELECT"
    },
    UFN_INVOICECREDIT_TICKETCREDITCORRELATIVEERROR: {
        query: "select * from ufn_invoicecredit_ticketcreditcorrelativeerror($corpid, $orgid, $invoiceid)",
        module: "",
        protected: "SELECT"
    },
    UFN_INVOICE_DELETE: {
        query: "SELECT * FROM ufn_invoice_delete($corpid, $orgid, $invoiceid, $username)",
        module: ["/invoice"],
        protected: "DELETE"
    },
    UFN_INVOICEDETAIL_DELETE: {
        query: "SELECT * FROM ufn_invoicedetail_delete($corpid, $orgid, $invoiceid)",
        module: "",
        protected: "DELETE"
    },
    UFN_BALANCE_SEL: {
        query: "select * from ufn_balance_sel($corpid, $orgid, $balanceid, $type, $operationtype, $all)",
        module: ["/invoice"],
        protected: "SELECT"
    },
    UFN_BALANCE_INS_PAYMENT: {
        query: "select * from ufn_balance_ins_payment($corpid, $orgid, $communicationchannelid, $description, $status, $type, $module, $receiver, $amount, $balance, $documenttype, $documentnumber, $paymentstatus, $transactiondate, $transactionuser, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_INVOICE_CHANGEINVOICESTATUS: {
        query: "SELECT * FROM ufn_invoice_changeinvoicestatus($corpid, $orgid, $invoiceid, $status, $username)",
        module: "",
        protected: "UPDATE"
    },
    UFN_BILLINGMESSAGING_CURRENT: {
        query: "SELECT * FROM ufn_billingmessaging_current($year, $month, $country)",
        module: ["/invoice"],
        protected: "SELECT"
    },
    UFN_BALANCE_CHANGEINVOICE: {
        query: "SELECT * FROM ufn_balance_changeinvoice($corpid, $orgid, $balanceid, $invoiceid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_BALANCE_SEL_SENT: {
        query: "SELECT * FROM ufn_balance_sel_sent($corpid, $orgid, $date, $type, $module, $messagetemplateid)",
        module: ["/invoice"],
        protected: "SELECT"
    },
    UFN_BILLING_REPORT_CONVERSATIONWHATSAPP: {
        query: "SELECT * FROM ufn_billing_report_conversationwhatsapp($corpid, $orgid, $year, $month)",
        module: ["/invoice"],
        protected: "SELECT"
    },
    UFN_MIGRATION_CONVERSATIONWHATSAPP_SEL: {
        query: "SELECT * FROM ufn_migration_conversationwhatsapp_sel($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_MIGRATION_CONVERSATIONWHATSAPP_INS: {
        query: "SELECT * FROM ufn_migration_conversationwhatsapp_ins($corpid, $orgid, $table)",
        module: "",
        protected: "SELECT"
    },
    UFN_TIMEZONE_SEL: {
        query: "SELECT * FROM ufn_timezone_sel()",
        module: ["/organizations"],
        protected: "SELECT"
    },
    UFN_USERBYUSER: {
        query: "SELECT * FROM ufn_userbyuser($username)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORTSCHEDULER_REPORTSEL: {
        query: "SELECT * FROM ufn_reportscheduler_reportsel($corpid, $orgid)",
        module: ["/reportscheduler"],
        protected: "SELECT"
    },
    UFN_REPORTSCHEDULER_FILTER_SEL: {
        query: "SELECT * FROM ufn_reportscheduler_filter_sel()",
        module: "",
        protected: "SELECT"
    },
    UFN_PRODUCTCATALOG_INS: {
        query: "SELECT * FROM ufn_productcatalog_ins($corpid, $orgid, $metacatalogid, $id, $productid, $retailerid, $title, $description, $descriptionshort, $availability, $category, $condition, $currency, $price, $saleprice, $link, $imagelink, $additionalimagelink, $brand, $color, $gender, $material, $pattern, $size, $datestart, $datelaunch, $dateexpiration, $labels, $numbers, $customlabel0, $customlabel1, $customlabel2, $customlabel3, $customlabel4, $customnumber0, $customnumber1, $customnumber2, $customnumber3, $customnumber4, $standardfeatures0, $reviewstatus, $reviewdescription, $status, $type, $username, $operation, $unitmeasurement, $quantity)",
        module: "",
        protected: "INSERT"
    },
    UFN_PRODUCTCATALOG_SEL: {
        query: "SELECT * FROM ufn_productcatalog_sel($corpid, $orgid, $metacatalogid, $take, $skip, $where, $order)",
        module: ["/productcatalog"],
        protected: "SELECT"
    },
    UFN_PRODUCTCATALOG_TOTALRECORDS: {
        query: "SELECT * FROM ufn_productcatalog_totalrecords($corpid, $orgid, $metacatalogid, $where)",
        module: ["/productcatalog"],
        protected: "SELECT"
    },
    UFN_PRODUCTCATALOG_SEL_NORMAL: {
        query: "SELECT * FROM ufn_productcatalog_sel_normal($corpid, $orgid, $id, $category, $username, $all)",
        module: ["/automatizationrules", "/message_inbox", "/supervisor", "/crm"],
        protected: "SELECT"
    },
    UFN_PRODUCTCATALOG_SEL_EXPORT: {
        query: "SELECT * FROM ufn_productcatalog_sel_export($corpid, $orgid, $metacatalogid)",
        module: "",
        protected: "SELECT"
    },
    UFN_PRODUCTCATALOG_LST: {
        query: "SELECT * FROM ufn_productcatalog_lst($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CHATFLOW_METACATALOG_LST: {
        query: "SELECT * FROM ufn_chatflow_metacatalog_lst($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CHATFLOW_PRODUCTCATALOG_LST: {
        query: "SELECT * FROM ufn_chatflow_productcatalog_lst($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_PAYMENTCARD_INS: {
        query: "SELECT * FROM ufn_paymentcard_ins($corpid, $orgid, $id, $cardnumber, $cardcode, $firstname, $lastname, $mail, $favorite, $clientcode, $status, $type, $phone, $username, $operation)",
        module: ["/invoice"],
        protected: "INSERT"
    },
    UFN_PAYMENTCARD_LST: {
        query: "SELECT * FROM ufn_paymentcard_lst($corpid, $orgid, $id)",
        module: ["/invoice"],
        protected: "SELECT"
    },
    UFN_LEADAUTOMATIZATIONRULES_SEL: {
        query: "SELECT * FROM ufn_leadautomatizationrules_sel($corpid, $orgid, $id, $communicationchannelid, $username, $all)",
        module: ["/automatizationrules"],
        protected: "SELECT"
    },
    UFN_LEADAUTOMATIZATIONRULES_INS: {
        query: "SELECT * FROM ufn_leadautomatizationrules_ins($corpid, $orgid, $id, $description, $status, $type, $order, $orderstatus , $columnid, $communicationchannelid, $communicationchannelorigin, $messagetemplateid, $messagetemplateparameters, $shippingtype, $xdays, $schedule, $tags, $products, $username, $operation)",
        module: ["/automatizationrules"],
        protected: "INSERT"
    },
    UFN_CALENDAREVENT_INS: {
        query: "SELECT * FROM ufn_calendarevent_ins($corpid, $orgid, $id, $description, $descriptionobject, $type, $status, $code, $name, $locationtype, $location, $eventlink, $color, $notificationtype, $communicationchannelid, $messagetemplateid, $notificationmessage, $daterange, $daysduration, $daystype, $startdate, $enddate, $timeduration, $timeunit, $availability, $timebeforeeventduration, $timebeforeeventunit, $timeaftereventduration, $timeaftereventunit, $increments, $reminderenable, $remindertype, $reminderhsmtemplateid, $reminderhsmcommunicationchannelid , $reminderhsmmessage, $remindermailtemplateid, $remindermailmessage, $reminderperiod, $reminderfrecuency, $username, $operation, $maximumcapacity, $notificationmessageemail, $messagetemplateidemail, $canceltype, $canceltemplateidemail, $cancelnotificationemail, $canceltemplateidhsm, $cancelnotificationhsm, $cancelcommunicationchannelid, $rescheduletype, $rescheduletemplateidemail, $reschedulenotificationemail, $rescheduletemplateidhsm, $reschedulenotificationhsm, $reschedulecommunicationchannelid, $sendeventtype)",
        module: ["/calendar"],
        protected: "INSERT"
    },
    UFN_CALENDAREVENT_SEL: {
        query: "SELECT * FROM ufn_calendarevent_sel($corpid, $orgid, $id, $username, $all)",
        module: ["/calendar"],
        protected: "SELECT"
    },
    UFN_CALENDAREVENT_LST: {
        query: "SELECT * FROM ufn_calendarevent_lst($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    QUERY_EVENT_BY_CODE: {
        query: `SELECT
        ce.corpid, ce.orgid, ce.calendareventid,
        ce.description, ce.status, ce.type,
        ce.name, ce.locationtype, ce.location, ce.eventlink,
        ce.color, ce.notificationtype, ce.messagetemplateid,
        ce.daterange, ce.daysduration, ce.daystype, ce.startdate, ce.enddate, ce.timeduration, ce.timeunit, ce.timezone,
        ce.availability, ce.timebeforeeventduration, ce.timebeforeeventunit, ce.timeaftereventduration, ce.timeaftereventunit, ce.increments,
        p.name personname, p.phone, p.email
        FROM calendarevent ce
        left JOIN person p on p.corpid = ce.corpid and p.orgid = ce.orgid and p.personid = $personid
        WHERE ce.orgid = $orgid
        and ce.code = $code
        and ce.status = 'ACTIVO'`,
        module: "",
        protected: "SELECT"
    },
    QUERY_EVENT_BY_CODE_WITH_BOOKINGUUID: {
        query: `SELECT ce.corpid, ce.orgid, ce.calendareventid, ce.description, ce.status, ce.type, ce.name, ce.locationtype, ce.location, ce.eventlink, ce.color, ce.notificationtype, ce.messagetemplateid, ce.daterange, ce.daysduration, ce.daystype, ce.startdate, ce.enddate, ce.timeduration, ce.timeunit, ce.timezone, ce.availability, ce.timebeforeeventduration, ce.timebeforeeventunit, ce.timeaftereventduration, ce.timeaftereventunit, ce.increments, cb.personname personname, cb.personcontact phone, cb.personmail email, cb.calendarbookingid,
        cb.datestart::text bookingdate
        FROM calendarevent ce 
        LEFT JOIN person p on p.corpid = ce.corpid and p.orgid = ce.orgid and p.personid = $personid 
        INNER JOIN calendarbooking cb ON cb.corpid = ce.corpid AND cb.orgid = ce.orgid AND cb.calendareventid = ce.calendareventid AND cb.calendarbookinguuid = $calendarbookinguuid AND cb.status = 'ACTIVO'
        WHERE ce.orgid = $orgid
        and ce.code = $code
        and ce.status = 'ACTIVO'`,
        module: "",
        protected: "SELECT"
    },
    /*QUERY_EVENT_BY_CODE_WITH_BOOKINGUUID: {
        query: `SELECT ce.corpid, ce.orgid, ce.calendareventid, ce.description, ce.status, ce.type, ce.name, ce.locationtype, ce.location, ce.eventlink, ce.color, ce.notificationtype, ce.messagetemplateid, ce.daterange, ce.daysduration, ce.daystype, ce.startdate, ce.enddate, ce.timeduration, ce.timeunit, ce.timezone, ce.availability, ce.timebeforeeventduration, ce.timebeforeeventunit, ce.timeaftereventduration, ce.timeaftereventunit, ce.increments, p.name personname, p.phone, p.email, cb.calendarbookingid
        FROM calendarevent ce 
        LEFT JOIN person p on p.corpid = ce.corpid and p.orgid = ce.orgid and p.personid = $personid 
        LEFT JOIN calendarbooking cb ON cb.corpid = ce.corpid AND cb.orgid = ce.orgid AND cb.calendareventid = ce.calendareventid AND cb.calendarbookinguuid = $calendarbookinguuid
        WHERE ce.orgid = $orgid and ce.code = $code and ce.status = 'ACTIVO'`,
        module: "",
        protected: "SELECT"
    },*/
    QUERY_GET_PERSON_FROM_BOOKING: {
        query: "select p.name, p.phone, p.email from person p where p.corpid = $corpid and p.orgid = $orgid and p.personid = $personid",
        module: "",
        protected: "SELECT"
    },
    QUERY_EVENT_BY_CALENDAR_EVENT_ID: {
        query: `SELECT
        ce.canceltemplateidemail,
        ce.cancelnotificationemail,
        mt1.name messagetemplatename,
        cc1.type communicationchanneltype,
        ce.messagetemplateid,
        ce.communicationchannelid,
        ce.notificationtype,
        ce.notificationmessage,
        ce.reminderhsmcommunicationchannelid,
        cc2.type reminderhsmcommunicationchanneltype,
        ce.reminderperiod,
        ce.reminderfrecuency,
        ce.remindermailmessage,
        ce.remindermailtemplateid,
        ce.reminderhsmmessage,
        ce.reminderhsmtemplateid,
        mt2.name reminderhsmtemplatename,
        ce.remindertype,
        ce.notificationmessageemail, 
        ce.messagetemplateidemail,
        ce.canceltemplateidhsm,
        ce.cancelnotificationhsm,
        ce.cancelcommunicationchannelid,
        ce.rescheduletemplateidhsm,
        ce.reschedulenotificationhsm,
        ce.reschedulecommunicationchannelid,
        ce.rescheduletemplateidemail,
        ce.reschedulenotificationemail,
        ce.rescheduletype,
        ce.description,
        ce.timeduration,
        ce.location,
        ce.timezone
        from calendarevent ce 
        left join communicationchannel cc1 on cc1.corpid = ce.corpid and cc1.orgid = ce.orgid and cc1.communicationchannelid = ce.communicationchannelid
        left join communicationchannel cc2 on cc2.corpid = ce.corpid and cc2.orgid = ce.orgid and cc2.communicationchannelid = ce.reminderhsmcommunicationchannelid
        left join messagetemplate mt1 on mt1.corpid = ce.corpid and mt1.orgid = ce.orgid and mt1.messagetemplateid = ce.messagetemplateid 
        left join messagetemplate mt2 on mt2.corpid = ce.corpid and mt2.orgid = ce.orgid and mt2.messagetemplateid = ce.reminderhsmtemplateid 
        where ce.corpid = $corpid and ce.orgid = $orgid and ce.calendareventid = $calendareventid`,
        module: "",
        protected: "SELECT"
    },
    QUERY_GET_EVENTS_PER_PERSON: {
        query: `SELECT  cb.calendareventid,cb.calendarbookingid, cb.description, cb.status, cb.datestart,
                        cb.monthdate, cb.monthday, cb.weekday, cb.hourstart::text, cb.hourend::text, cb.timeduration,
                        cb.personname, cb.personcontact, cb.calendarbookinguuid,cb.corpid,cb.orgid, ce.code
            FROM calendarbooking cb
            JOIN calendarevent ce ON ce.corpid = cb.corpid AND ce.orgid = cb.orgid AND ce.calendareventid = cb.calendareventid
            WHERE (cb.personcontact=$phone or cb.personmail=$email)
                AND ce.code=$code
                AND cb.datestart > NOW() + cb.timezone * INTERVAL '1HOUR'
                AND cb.status='ACTIVO'`,
        module: "",
        protected: "SELECT"
    },
    QUERY_GET_EVENT_BY_BOOKINGID: {
        query: `SELECT cb.personname,ce.name , (cb.datestart - cb.timezone * INTERVAL '1HOUR' + $offset * INTERVAL '1HOUR')::date as monthdate,
                        (cb.hourstart - cb.timezone * INTERVAL '1HOUR' + $offset * INTERVAL '1HOUR')::text as hourstart, (cb.hourend - cb.timezone * INTERVAL '1HOUR' + $offset * INTERVAL '1HOUR')::text as hourend,
                        cb.cancelcomment
            FROM calendarevent ce
            JOIN calendarbooking cb ON ce.corpid = cb.corpid and ce.orgid = cb.orgid and ce.calendareventid = cb.calendareventid
            WHERE ce.calendareventid = cb.calendareventid
                AND ce.corpid = $corpid
                AND cb.corpid=$corpid
                AND cb.orgid=$orgid
                AND cb.calendarbookingid=$calendarbookingid                
                AND cb.status='ACTIVO'`,
        module: "",
        protected: "SELECT"
    },
    QUERY_CANCEL_EVENT_BY_CALENDARBOOKINGID: {
        query: `UPDATE calendarbooking 
                SET status='CANCELADO', cancelcomment=$cancelcomment
                WHERE status='ACTIVO'
                AND corpid=$corpid
                AND orgid=$orgid
                AND calendarbookinguuid=$calendarbookinguuid;`,
        module: "",
        protected: "SELECT"
    },
    QUERY_CANCEL_TASK_BY_CALENDARBOOKINGUUID: {
        query: `UPDATE taskscheduler ts
                SET
                completed = true
                WHERE ts.taskschedulerid IN (
                    SELECT unnest(string_to_array(cb.taskid, ',')::BIGINT[])
                    FROM calendarbooking cb
                    WHERE cb.corpid = $corpid
                    AND cb.orgid = $orgid
                    AND cb.calendareventid = $calendareventid
                    AND cb.calendarbookingid = $calendarbookingid
                );`,
        module: "",
        protected: "SELECT"
    },
    QUERY_CANCEL_EVENT_BY_CALENDARBOOKINGUUID: {
        query: `UPDATE calendarbooking 
                SET status='CANCELADO', cancelcomment=$cancelcomment
                WHERE status='ACTIVO'
                AND corpid=$corpid
                AND orgid=$orgid
                AND calendarbookingid=$calendarbookingid;`,
        module: "",
        protected: "SELECT"
    },
    QUERY_CANCEL_INTEGRATION_EVENT_BY_CALENDARBOOKINGUUID: {
        query: `DELETE from calendarintegrationbooking
                WHERE id = $calendarbookingid::varchar`,
        module: "",
        protected: "SELECT"
    },
    QUERY_INTEGRATIONEVENT_SEL_BY_CALENDARBOOKINGID: {
        query: `select * from calendarintegrationbooking c
                where c.calendarbookingid = $calendarbookingid
                    and c.status = 'ACTIVO'`,
        module: "",
        protected: "SELECT"
    },
    QUERY_CALENDARINTEGRATION_INFO_SEL: {
        query: `select * from calendarintegration c where c.calendarintegrationid = $calendarintegrationid and c.status = 'ACTIVO'`,
        module: "",
        protected: "SELECT"
    },
    QUERY_GET_EVENT_REMINDER: {
        query: `SELECT * 
                FROM calendarevent
                WHERE status='ACTIVO'
                AND corpid=$corpid
                AND orgid=$orgid
                AND calendareventid=$calendareventid;`,
        module: "",
        protected: "SELECT"
    },
    UFN_CALENDARYBOOKING_INS: {
        query: "SELECT * FROM ufn_calendarbooking_ins($corpid, $orgid, $calendareventid, $id, $description, $type, $status, $monthdate, $hourstart, $notes, $conversationid, $personname, $personcontact, $personmail, $persontimezone, $username, $operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_CALENDARINTEGRATION_INS: {
        query: "SELECT * FROM ufn_calendarintegration_ins($corpid, $orgid, $calendarintegrationid, $eventid, $email, $status, $type, $createdate, $changedate, $summary, $description, $timezone, $startdate, $enddate, $timeduration, $calendarbookingid)",
        module: "",
        protected: "INSERT"
    },
    UFN_CALENDARYBOOKING_UPD: {
        query: "SELECT * FROM ufn_calendarbooking_upd($corpid, $orgid, $calendareventid, $uuid, $description, $type, $status, $monthdate, $hourstart, $notes, $personname, $personcontact, $persontimezone, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_CALENDARYBOOKING_COMMENT: {
        query: "SELECT * FROM ufn_calendarbooking_comment($corpid, $orgid, $calendareventid, $id, $comment, $username)",
        module: ["/calendar"],
        protected: "INSERT"
    },
    UFN_TOTAL_PERSONS_BY_CATEGORY_BRAND_SEL: {
        query: "SELECT * FROM ufn_total_persons_by_category_brand_sel($corpid, $orgid, $brand, $frequent, $category)",
        module: "",
        protected: "INSERT"
    },
    UFN_CALENDARYBOOKING_SEL_DATETIME: {
        query: "SELECT * FROM ufn_calendarbooking_sel_datetime($corpid, $orgid, $calendareventid, $startdate, $enddate, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_CALENDARBOOKING_REPORT: {
        query: "SELECT * FROM ufn_calendarbooking_report($corpid, $orgid, $calendareventid, $startdate, $enddate, $offset)",
        module: ["/calendar"],
        protected: "SELECT"
    },
    UFN_CALENDAREVENT_INTEGRATION_SEL: {
        query: "SELECT * FROM ufn_calendarevent_integration_sel($corpid, $orgid, $calendareventid)",
        module: ["/calendar"],
        protected: "SELECT"
    },
    UFN_CALENDARBOOKING_CANCEL: {
        query: "SELECT * FROM ufn_calendarbooking_cancel($corpid, $orgid, $calendareventid, $id, $cancelcomment, $username, $canceltype)",
        module: "",
        protected: "SELECT"
    },
    UFN_CALENDARBOOKING_EDIT: {
        query: "SELECT * FROM ufn_calendarbooking_edit($corpid, $orgid, $calendarbookingid, $personmail, $personname, $notes, $comments)",
        module: "",
        protected: "SELECT"
    },
    UFN_PERSONS_BY_CATEGORY_SEL: {
        query: "SELECT * FROM ufn_persons_by_category_sel($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_LIST_PERSONS_BY_CATEGORY_SEL: {
        query: "SELECT * FROM ufn_list_persons_by_category_sel($corpid, $orgid, $category)",
        module: "",
        protected: "SELECT"
    },
    UFN_PERSONS_FREQUENT_SEL: {
        query: "SELECT * FROM ufn_persons_frequent_sel($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_LIST_PERSONS_FREQUENT_SEL: {
        query: "SELECT * FROM ufn_list_persons_frequent_sel($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_PERSONS_BY_BRAND_SEL: {
        query: "SELECT * FROM ufn_persons_by_brand_sel($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_LIST_PERSONS_BY_BRAND_SEL: {
        query: "SELECT * FROM ufn_list_persons_by_brand_sel($corpid, $orgid, $brand)",
        module: "",
        protected: "SELECT"
    },
    UFN_INVOICE_IMPORT: {
        query: "SELECT * FROM ufn_invoice_import($corpid, $orgid, $year, $month, $description, $status, $receiverdoctype, $receiverdocnum, $receiverbusinessname, $receiverfiscaladdress, $receivercountry, $receivermail, $invoicetype, $serie, $correlative, $invoicedate, $expirationdate, $invoicestatus, $paymentstatus, $paymentdate, $paidby, $paymenttype, $totalamount, $exchangerate, $currency, $urlcdr, $urlpdf, $urlxml, $purchaseorder, $comments, $credittype, $username)",
        module: ["/invoice", "/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_INVOICE_SUMMARY_SEL: {
        query: "SELECT * FROM ufn_report_invoice_summary_sel($year, $currency, $location)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_INVOICE_DETAIL_SEL: {
        query: "SELECT * FROM ufn_report_invoice_detail_sel($corpid, $year, $month, $currency)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_APPSETTING_VOXIMPLANT_SEL: {
        query: "SELECT * FROM ufn_appsetting_voximplant_sel($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_ORG_VOXIMPLANT_UPD: {
        query: "SELECT * FROM ufn_org_voximplant_upd($corpid, $orgid, $operation, $voximplantuser, $voximplantmail, $voximplantpassword, $voximplantaccountid, $voximplantapikey, $voximplantapplicationid, $voximplantruleid, $voximplantscenarioid, $voximplantuserid, $voximplantapplicationname, $voximplantruleoutid, $voximplantscenariooutid);",
        module: "",
        protected: "UPDATE"
    },
    UFN_CONVERSATION_SEL_VOXI: {
        query: "SELECT * FROM ufn_conversation_sel_voxi($corpid, $orgid, $userid, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_PERSONCOMMUNICATIONCHANNEL_SEL_VOXI: {
        query: "SELECT * FROM ufn_personcommunicationchannel_sel_voxi($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_USER_CHANNEL_SEL: {
        query: "SELECT * FROM ufn_user_channel_sel($corpid, $orgid, $userid)",
        module: ["/supervisor", "/message_inbox"],
        protected: "SELECT"
    },
    QUERY_ORG_BOT_SEL: {
        query: `
        SELECT ous.userid, TRIM(CONCAT(usr.firstname, ' ', usr.lastname)) as fullname
        FROM orguser ous
		JOIN usr ON usr.userid = ous.userid
        WHERE ous.corpid = $corpid
        AND ous.orgid = $orgid
        AND ous.type = 'BOT'
        LIMIT 1
        `,
        module: "",
        protected: false
    },
    QUERY_TICKETIMPORT_CHANNELS_SEL: {
        query: `
        SELECT cc.communicationchannelid, cc.type as channeltype, cc.communicationchannelsite
        FROM communicationchannel cc
        WHERE cc.corpid = $corpid
        AND cc.orgid = $orgid
        AND cc.communicationchannelsite = ANY(string_to_array($channels,','))
        AND cc.status = 'ACTIVO'
        `,
        module: "",
        protected: false
    },
    QUERY_TICKETIMPORT_PCC_SEL: {
        query: `
        SELECT pcc.personid, pcc.personcommunicationchannel, pcc.personcommunicationchannelowner
        FROM personcommunicationchannel pcc
        WHERE pcc.corpid = $corpid
        AND pcc.orgid = $orgid
        AND (
            pcc.personcommunicationchannel = ANY(string_to_array($personcommunicationchannel,','))
            OR
            pcc.personcommunicationchannelowner = ANY(string_to_array($personcommunicationchannelowner,','))
        )
        `,
        module: "",
        protected: false
    },
    QUERY_TICKETIMPORT_PERSON_INS: {
        query: `
        INSERT INTO person (
            corpid, orgid, auxpcc,
            status, type,
            createdate, createby, changedate, changeby,
            firstname, lastname, name, phone,
            lastcommunicationchannelid
        )
        SELECT
            $corpid, $orgid, pt.personcommunicationchannel,
            'ACTIVO','NINGUNO',
            NOW(), $botname, NOW(), 'admin',
            pt.personname, '', pt.personname, pt.personphone,
            pt.communicationchannelid
        FROM json_populate_recordset(null::udtt_ticket_import, $datatable) pt
        RETURNING person.personid, person.auxpcc as personcommunicationchannel
        `,
        module: "",
        protected: false
    },
    QUERY_TICKETIMPORT_PCC_INS: {
        query: `
        INSERT INTO personcommunicationchannel (
            corpid, orgid,
            personid, personcommunicationchannel,
            status, type,
            createdate, createby, changedate, changeby,
            personcommunicationchannelowner,
            displayname
        )
        SELECT
            $corpid, $orgid,
            pt.personid, pt.personcommunicationchannel,
            'ACTIVO', pt.channeltype,
            NOW(), 'admin', NOW(), 'admin',
            pt.personphone,
            pt.personname
        FROM json_populate_recordset(null::udtt_ticket_import, $datatable) pt
        `,
        module: "",
        protected: false
    },
    QUERY_TICKETIMPORT_CONVERSATION_INS: {
        query: `
        INSERT INTO conversation (
            corpid, orgid, personid, personcommunicationchannel, communicationchannelid, auxid,
            status, type, createdate, createby, changedate, changeby, edit,
            ticketnum,
            firstconversationdate, lastconversationdate, startdate, finishdate,
            firstuserid, lastuserid,
            firstreplytime, averagereplytime, userfirstreplytime, useraveragereplytime, totalduration, realduration, totalpauseduration,
            closetype,     
            postexternalid, commentexternalid, replyexternalid,
            usergroup, firstusergroup,
            personaveragereplytime, handoffdate,
            extradata, lastreplydate, personlastreplydate, enquiries, classification, origin,
            tdatime,
            tags
        )
        SELECT
            $corpid, $orgid::bigint, pt.personid, pt.personcommunicationchannel, pt.communicationchannelid, pt.auxid,
            'CERRADO', 'NINGUNO', NOW(), 'admin', NOW() + INTERVAL '1MINUTE', 'admin', false,
            (LPAD(nextval(concat('ticketnum', $orgid::text,'seq')::regclass)::text, 7, '0')),
            NOW(), NOW() + INTERVAL '1MINUTE', NOW(), NOW() + INTERVAL '1MINUTE',
            $botid, $botid,
            '00:00:00.00', '00:00:00.00', '00:00:00.00', '00:00:00.00', '00:00:00.00', '00:00:00.00', '00:00:00.00',
            'Resuelto',
            null, null, null,
            '', '',
            '00:00:00.00', null,
            '', null, null, '', '', 'UPLOAD',
            '00:00:00.00',
            'Carga inicial'
        FROM json_populate_recordset(null::udtt_ticket_import, $datatable) pt
        RETURNING conversation.conversationid, conversation.auxid as auxid
        `,
        module: "",
        protected: false
    },
    UFN_TICKETNUM_FIX: {
        query: "SELECT * FROM ufn_ticketnum_fix($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    QUERY_TICKETIMPORT_INTERACTION_INS: {
        query: `
        INSERT INTO interaction (
            corpid, orgid,
            personid, personcommunicationchannel, communicationchannelid,
            conversationid,
            status, type,
            createdate, createby, changedate, changeby,
            interactiontext, userid, interactiontype
        )
        SELECT
            $corpid, $orgid,
            pt.personid, pt.personcommunicationchannel, pt.communicationchannelid,
            pt.conversationid,
            'ACTIVO', 'NINGUNO',
            NOW(), 'admin', NOW(), 'admin',
            pt.interactiontext, pt.interactionuserid, 'text'
        FROM json_populate_recordset(null::udtt_ticket_import, $datatable) pt
        `,
        module: "",
        protected: false
    },
    UFN_VOXITRANSFERHISTORY_INS: {
        query: "SELECT * FROM ufn_voxitransferhistory_ins($corpid, $orgid, $description, $status, $type, $parentaccountid, $parentaccountapikey, $childaccountid, $transferamount, $motive, $username);",
        module: "",
        protected: "INSERT"
    },
    UFN_VOXITRANSFERHISTORY_SEL: {
        query: "SELECT * FROM ufn_voxitransferhistory_sel($corpid, $orgid, $motive, $startdate, $enddate, $offset);",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_CLOSE_UPD: {
        query: "SELECT * FROM ufn_conversation_close_upd($corpid, $orgid, $communicationchannelid, $personid, $personcommunicationchannel, $conversationid, $motive, $obs );",
        module: "",
        protected: "SELECT"
    },
    UFN_BILLINGPERIOD_UPD_VOXIMPLANT: {
        query: "SELECT * FROM ufn_billingperiod_upd_voximplant($corpid, $orgid, $year, $month, $voximplantcallphonecost, $voximplantcallpubliccost, $voximplantcallvoipcost, $voximplantcallrecordingcost, $voximplantcallothercost, $force);",
        module: "",
        protected: "SELECT"
    },
    UFN_COMMUNICATIONCHANNEL_SEL_VOXIMPLANT: {
        query: "SELECT * FROM ufn_communicationchannel_sel_voximplant($corpid, $orgid, $year, $month, $timezoneoffset);",
        module: "",
        protected: "SELECT"
    },
    UFN_BILLING_REPORT_HSMHISTORY: {
        query: "SELECT * FROM ufn_billing_report_hsmhistory($corpid, $orgid, $year, $month, $type)",
        module: ["/invoice"],
        protected: "SELECT"
    },
    UFN_VOXIMPLANTLANDING_COUNTRY_SEL: {
        query: "SELECT * FROM ufn_voximplantlanding_country_sel()",
        module: "",
        protected: "SELECT"
    },
    UFN_VOXIMPLANTLANDING_INBOUND_SEL: {
        query: "SELECT * FROM ufn_voximplantlanding_inbound_sel($countrycode)",
        module: "",
        protected: "SELECT"
    },
    UFN_VOXIMPLANTLANDING_NUMBER_SEL: {
        query: "SELECT * FROM ufn_voximplantlanding_number_sel($countrycode)",
        module: "",
        protected: "SELECT"
    },
    UFN_VOXIMPLANTLANDING_OUTBOUND_SEL: {
        query: "SELECT * FROM ufn_voximplantlanding_outbound_sel($countrycode)",
        module: "",
        protected: "SELECT"
    },
    UFN_BILLINGPERIOD_SEL_PHONETAX: {
        query: "SELECT * FROM ufn_billingperiod_sel_phonetax($corpid, $orgid)",
        module: ["/channels"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_DICONNECTIONTIMES_SEL: {
        query: "SELECT * FROM ufn_dashboard_disconnectiontimes_sel2($corpid, $orgid, $startdate, $enddate, $asesorid, $supervisorid, $groups, $offset)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_REPORT_ASESOR_VS_TICKET_EXPORT: {
        query: "SELECT * FROM ufn_report_asesor_vs_ticket_export($corpid, $orgid, $where, $order, $startdate, $enddate, $userid, $offset, $channel)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_ASESOR_VS_TICKET_SEL: {
        query: "SELECT * FROM ufn_report_asesor_vs_ticket_sel($corpid, $orgid, $take, $skip, $where, $order, $startdate, $enddate, $userid, $channel, $offset, $distinct)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_ASESOR_VS_TICKET_TOTALRECORDS: {
        query: "SELECT * FROM ufn_report_asesor_vs_ticket_totalrecords($corpid, $orgid, $where, $startdate, $enddate, $userid, $channel, $offset, $distinct)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_REQUESTSD_SEL: {
        query: "SELECT * FROM ufn_report_requestsd_sel($corpid, $orgid, $take, $skip, $where, $order, $startdate, $enddate, $channeltype, $company, $offset, $distinct)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_REQUESTSD_TOTALRECORDS: {
        query: "SELECT * FROM ufn_report_requestsd_totalrecords($corpid, $orgid, $where, $startdate, $enddate, $channeltype, $company, $offset, $distinct)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_REQUESTSD_EXPORT: {
        query: "SELECT * FROM ufn_report_requestsd_export($corpid, $orgid, $where, $order, $startdate, $enddate, $channeltype, $company, $offset)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_COMPLIANCESLA_EXPORT: {
        query: "SELECT * FROM ufn_report_compliancesla_export($corpid, $orgid, $where, $order, $startdate, $enddate, $company, $offset)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_COMPLIANCESLA_SEL: {
        query: "SELECT * FROM ufn_report_compliancesla_sel($corpid, $orgid, $take, $skip, $where, $order, $startdate, $enddate, $company, $offset)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_COMPLIANCESLA_TOTALRECORDS: {
        query: "SELECT * FROM ufn_report_compliancesla_totalrecords($corpid, $orgid, $where, $startdate, $enddate, $company, $offset)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_USERBYSUPERVISOR_LST: {
        query: "SELECT * FROM ufn_userbysupervisor_lst($corpid, $orgid, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_PROPERTY_SEL_BY_INCLUDE_NAME: {
        query: "SELECT * FROM ufn_property_sel_by_include_name($corpid, $orgid, $propertyname)",
        module: ["/message_inbox"],
        protected: "SELECT"
    },
    UFN_PROFILE_SEL: {
        query: "SELECT firstname, lastname, email, phone, country, doctype, docnum FROM usr WHERE userid = $userid;",
        module: "",
        protected: "SELECT"
    },
    UFN_SERVICESUBSCRIPTION_UPD: {
        query: "SELECT * FROM ufn_servicesubscription_upd($account, $node, $extradata, $type, $status, $usr, $webhook, $interval);",
        module: "",
        protected: "SELECT"
    },
    UFN_SERVICETOKEN_UPD: {
        query: "SELECT * FROM ufn_servicetoken_upd($account, $accesstoken, $refreshtoken, $extradata, $type, $status, $usr, $interval);",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_SURVEY_SEL: {
        query: "SELECT * FROM ufn_report_survey_sel($corpid, $orgid, $startdate, $enddate, $take, $skip, $where, $order, $userid, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_SURVEY_TOTALRECORDS: {
        query: "SELECT * FROM ufn_report_survey_totalrecords($corpid, $orgid, $startdate, $enddate, $where, $userid, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_SURVEY_EXPORT: {
        query: "SELECT * FROM ufn_report_survey_export($corpid, $orgid, $startdate, $enddate, $where, $order, $userid, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_SURVEY_GRAPHIC: {
        query: "SELECT * FROM ufn_report_survey_graphic($corpid, $orgid, $startdate, $enddate, $where, $order, $userid, $column, $summarization, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_CLASSIFICATION_DEL: {
        query: "select * from ufn_classification_del($corpid, $orgid, $id)",
        module: ["/extras/quickreplies"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_DISCONNECTIONTIMES_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_disconnectiontimes_data_sel($corpid, $orgid, $startdate, $enddate, $asesorid, $supervisorid, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_TEST: {
        query: "select 1",
        module: ["/message_inbox", "/supervisor"],
        protected: "SELECT"
    },
    UFN_COMMUNICATIONCHANNEL_SEL_WHATSAPP: {
        query: "SELECT * FROM ufn_communicationchannel_sel_whatsapp($corpid, $orgid)",
        module: ["/extras/messagetemplate"],
        protected: "SELECT"
    },
    UFN_COMMUNICATIONCHANNEL_SEL_WHATSAPP_PROVIDER: {
        query: "SELECT * FROM ufn_communicationchannel_sel_whatsapp_provider($corpid, $orgid, $communicationchannelid, $status)",
        module: "",
        protected: "SELECT"
    },
    UFN_COMMUNICATIONCHANNEL_SEL_VOICE: {
        query: "SELECT * FROM ufn_communicationchannel_sel_voice($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_MESSAGETEMPLATE_UPD: {
        query: "SELECT * FROM ufn_messagetemplate_upd($corpid, $orgid, $description, $type, $status, $name, $namespace, $category, $language, $templatetype, $headerenabled, $headertype, $header, $body, $footerenabled, $footer, $buttonsenabled, $buttons, $priority, $attachment, $communicationchannelid, $communicationchanneltype, $authenticationdata, $bodyvariables, $buttonsgeneric, $buttonsquickreply, $carouseldata, $headervariables, $provideraccountid, $providerexternalid, $providerid, $providermessagelimit, $providerpartnerid, $providerquality, $providerstatus, $categorychange, $firstbuttons, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_MESSAGETEMPLATE_RESET: {
        query: "UPDATE messagetemplate SET status = 'ELIMINADO', changeby = $username, changedate = NOW() WHERE corpid = $corpid AND orgid = $orgid AND type = 'HSM' AND status = 'ACTIVO' AND ($communicationchannelid = ANY(string_to_array(communicationchannelid, ',')::bigint[]) OR namespace = $namespace);",
        module: "",
        protected: "UPDATE"
    },
    UFN_REPORT_VOICECALL_SEL: {
        query: "SELECT * FROM ufn_report_voicecall_sel($corpid, $orgid, $startdate, $enddate, $take, $skip, $where, $order, $userid, $offset, $distinct)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_VOICECALL_TOTALRECORDS: {
        query: "SELECT * FROM ufn_report_voicecall_totalrecords($corpid, $orgid, $startdate, $enddate, $where, $userid, $offset, $distinct)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_VOICECALL_EXPORT: {
        query: "SELECT * FROM ufn_report_voicecall_export($corpid, $orgid, $startdate, $enddate, $where, $order, $userid, $offset)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_VOICECALL_GRAPHIC: {
        query: "SELECT * FROM ufn_report_voicecall_graphic($corpid, $orgid, $startdate, $enddate, $where, $order, $userid, $column, $summarization, $offset)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_CONVERSATION_CALLHOLD: {
        query: "SELECT * FROM ufn_conversation_callhold($corpid, $orgid, $conversationid, $holdtime)",
        module: ["/message_inbox", "/supervisor"],
        protected: "SELECT"
    },
    UFN_INVOICECOMMENT_SEL: {
        query: "SELECT * FROM ufn_invoicecomment_sel($corpid, $orgid, $invoiceid, $invoicecommentid)",
        module: ["/invoice", "/reports"],
        protected: "SELECT"
    },
    UFN_INVOICECOMMENT_INS: {
        query: "SELECT * FROM ufn_invoicecomment_ins($corpid, $orgid, $invoiceid, $invoicecommentid, $description, $status, $type, $username, $commentcontent, $commenttype, $commentcaption)",
        module: ["/invoice", "/reports"],
        protected: "INSERT"
    },
    UFN_LOCATION_TOTALRECORDS: {
        query: "SELECT * FROM ufn_location_totalrecords($corpid, $orgid, $where)",
        module: ["/extras/location"],
        protected: "SELECT"
    },
    UFN_LOCATION_SEL: {
        query: "SELECT  * FROM ufn_location_sel($corpid, $orgid, $locationid, $where, $order, $take, $skip)",
        module: ["/extras/location"],
        protected: "SELECT"
    },
    UFN_LOCATION_INS: {
        query: "SELECT * FROM ufn_location_ins($corpid, $orgid, $id, $operation, $name, $address, $district, $city, $country, $schedule, $phone, $alternativephone, $email, $alternativeemail, $latitude, $longitude, $googleurl, $description, $status, $type, $username)",
        module: ["/extras/location"],
        protected: "INSERT"
    },
    UFN_LOCATION_EXPORT: {
        query: "SELECT * FROM ufn_location_export($corpid, $orgid, $where, $order)",
        module: ["/extras/location"],
        protected: "SELECT"
    },
    UFN_REPORT_KPI_OPERATIVO_SEL: {
        query: "SELECT * FROM ufn_report_kpi_operativo_sel($corpid, $orgid, $date, $usergroup, $userid, $offset)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_CONVERSATION_LINKEDPERSON_EXECUTE: {
        query: "SELECT * FROM ufn_conversation_linkedperson_execute($corpid, $orgid, $personidfrom, $personidto, $imageurl, $name, $firstname, $lastname, $documenttype, $documentnumber, $persontype, $birthday, $gender, $phone, $alternativephone, $email, $alternativeemail, $civilstatus, $occupation, $educationlevel, $observation, $groups, $address, $healthprofessional, $referralchannel)",
        module: ["/person", "/message_inbox", "/supervisor"],
        protected: "SELECT"
    },
    UFN_CONVERSATION_UNLINKPERSON_EXECUTE: {
        query: "SELECT * FROM ufn_conversation_unlinkperson_execute($corpid, $orgid, $personid, $personcommunicationchannel, $username)",
        module: ["/person"],
        protected: "INSERT"
    },
    UFN_REPORT_UNIQUECONTACTS_SEL: {
        query: "SELECT * FROM ufn_report_uniquecontacts_sel($year, $channeltype, $offset, $userid)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_DOMAIN_CHANNELTYPE_LST: {
        query: "SELECT * FROM ufn_domain_channeltype_lst($corpid, $orgid, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_WITAI_INTENT_SEL: {
        query: "SELECT * FROM ufn_witai_intent_sel($corpid, $orgid)",
        module: ["/iatraining"],
        protected: "SELECT"
    },
    UFN_WITAI_UTTERANCE_SEL: {
        query: "SELECT * FROM ufn_witai_utterance_sel($corpid, $orgid, $intent)",
        module: ["/iatraining"],
        protected: "SELECT"
    },
    UFN_WITAI_ENTITY_SEL: {
        query: "SELECT * FROM ufn_witai_entity_sel($corpid, $orgid)",
        module: ["/iatraining"],
        protected: "SELECT"
    },
    UFN_WITAI_INTENT_UTTERANCE_INS: {
        query: "SELECT * FROM ufn_witai_intent_utterance_ins($corpid, $orgid, $name, $description, $datajson, $utterance_datajson, $operation, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_WITAI_ENTITY_INS: {
        query: "SELECT * FROM ufn_witai_entity_ins($corpid, $orgid, $name, $datajson, $operation, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_WITAI_ENTITY_DEL: {
        query: "SELECT * FROM ufn_witai_entity_del($corpid, $orgid, $table, $model)",
        module: "",
        protected: "SELECT"
    },
    UFN_WITUFN_WITAI_INTENT_UTTERANCE_DEL: {
        query: "SELECT * FROM ufn_witai_intent_utterance_del($corpid, $orgid, $table, $model)",
        module: "",
        protected: "SELECT"
    },
    UFN_WITAI_INTENT_EXPORT: {
        query: "SELECT * FROM ufn_witai_intent_export($corpid, $orgid, $name_json)",
        module: ["/iatraining"],
        protected: "SELECT"
    },
    UFN_PERSON_INS_VALIDATION: {
        query: "SELECT * FROM ufn_person_ins_validation($id, $corpid, $orgid, $phone, $email, $alternativephone, $alternativeemail, $username, $operation)",
        module: ["/person"],
        protected: "SELECT"
    },
    UFN_WITAI_APP_CRON: {
        query: "SELECT * FROM ufn_witai_app_cron()",
        module: "",
        protected: "SELECT"
    },
    UFN_WITAI_APP_CONFIG: {
        query: "SELECT * FROM ufn_witai_app_config($corpid, $orgid, $id, $appid, $token)",
        module: "",
        protected: "SELECT"
    },
    UFN_WITAI_APP_GET: {
        query: "SELECT * FROM ufn_witai_app_get($corpid, $orgid, $model)",
        module: "",
        protected: "SELECT"
    },
    UFN_WITAI_TRAIN_INS: {
        query: "SELECT * FROM ufn_witai_train_ins($corpid, $orgid, $type, $name, $datajson, $operation, $username, $model)",
        module: "",
        protected: "SELECT"
    },
    UFN_WITAI_WORKER_TRAIN_SEL: {
        query: "SELECT * FROM ufn_witai_worker_train_sel()",
        module: "",
        protected: "SELECT"
    },
    UFN_WITAI_WORKER_TRAIN_MODEL_SEL: {
        query: "SELECT * FROM ufn_witai_worker_train_model_sel($corpid, $orgid, $worker, $model)",
        module: "",
        protected: "SELECT"
    },
    UFN_WITAI_TRAIN_SEL: {
        query: "SELECT * FROM ufn_witai_train_sel($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_WITAI_TRAIN_UPD: {
        query: "SELECT * FROM ufn_witai_train_upd($corpid, $orgid, $type, $name, $todelete, $w1, $w2, $model)",
        module: "",
        protected: "SELECT"
    },
    UFN_WITAI_WORKER_INTASK: {
        query: "SELECT * FROM ufn_witai_worker_intask($corpid, $orgid, $id, $intask, $witaistatus)",
        module: "",
        protected: "SELECT"
    },
    UFN_WITAI_WORKER_UPDATED: {
        query: "SELECT * FROM ufn_witai_worker_updated($corpid, $orgid, $id, $witaistatus)",
        module: "",
        protected: "SELECT"
    },
    UFN_WITAI_WORKER_SCHEDULED_SEL: {
        query: "SELECT * FROM ufn_witai_worker_scheduled_sel()",
        module: "",
        protected: "SELECT"
    },
    UFN_WITAI_MODEL_WORKER_SCHEDULED_SEL: {
        query: "SELECT * FROM ufn_witai_model_worker_scheduled_sel($corpid, $orgid, $model)",
        module: "",
        protected: "SELECT"
    },
    UFN_WITAI_MODEL_STATUS_SEL: {
        query: "SELECT * FROM ufn_witai_model_status_sel($corpid, $orgid, $worker, $model)",
        module: "",
        protected: "SELECT"
    },
    UFN_WITAI_WORKER_STATUS_UPD: {
        query: "SELECT * FROM ufn_witai_worker_status_upd($corpid, $orgid, $id, $witaistatus)",
        module: "",
        protected: "SELECT"
    },
    UFN_WITAI_WORKER_USAGE_UPD: {
        query: "SELECT * FROM ufn_witai_worker_usage_upd($corpid, $orgid, $id)",
        module: "",
        protected: "SELECT"
    },
    UFN_WITAI_ENTITY_IMPORT: {
        query: "SELECT * FROM ufn_witai_entity_import($corpid, $orgid, $datajson, $username, $model)",
        module: "",
        protected: "SELECT"
    },
    UFN_WITAI_INTENT_UTTERANCE_IMPORT: {
        query: "SELECT * FROM ufn_witai_intent_utterance_import($corpid, $orgid, $datajson, $utterance_datajson, $username, $model)",
        module: "",
        protected: "SELECT"
    },

    UFN_PERSON_IMPORT_VALIDATION: {
        query: "SELECT * FROM ufn_person_import_validation($corpid, $orgid, $table, $username)",
        module: ["/person"],
        protected: "SELECT"
    },
    UFN_CHATFLOW_VARIABLE_SEL: {
        query: "SELECT * FROM ufn_chatflow_variable_sel($corpid, $orgid)",
        module: ["/extras/quickreplies"],
        protected: "SELECT"
    },
    UDTT_PERSON_PCC_IMPORT: {
        query: "SELECT * FROM udtt_person_pcc_import($corpid, $orgid, $table, $username)",
        module: ["/person"],
        protected: "SELECT"
    },
    UFN_SECURITYRULES_SEL: {
        query: "SELECT * FROM ufn_securityrules_sel($corpid, $orgid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_SECURITYRULES_UPD: {
        query: "SELECT * FROM ufn_securityrules_upd($corpid, $orgid, $id, $mincharacterspwd, $maxcharacterspwd, $specialcharacterspwd, $numericalcharacterspwd, $uppercaseletterspwd, $lowercaseletterspwd, $allowsconsecutivenumbers, $numequalconsecutivecharacterspwd, $periodvaliditypwd, $maxattemptsbeforeblocked, $pwddifferentchangelogin, $username)",
        module: ["/extras/securityrules"],
        protected: "SELECT"
    },
    QUERY_SELECT_ATTACHMENT: {
        query: `select intt.interactionid, intt.interactiontext, intt.interactiontype, CONCAT(u.firstname, ' ', u.lastname) "user", intt.userid, intt.createdate from interaction intt
        left join usr u on u.userid = intt.userid
        where intt.personid = $personid
        and intt.corpid = $corpid
        and intt.orgid = $orgid
        and intt.interactiontype IN ('file', 'video', 'audio') order by intt.createdate desc`,
        module: ["/message_inbox", "/supervisor"],
        protected: "SELECT"
    },
    QUERY_SELECT_LEADS_BY_USER_PERSON: {
        query: `select
        l.leadid,
        l.description "lead",
        l.expected_revenue,
        l.priority,
        (select c.description from "column" c where c.columnid = l.columnid and c.status = 'ACTIVO' limit 1) "column",
        (select string_agg(pc.title,',') from productcatalog pc where pc.corpid = l.corpid and pc.orgid = l.orgid and pc.productcatalogid::text = ANY(string_to_array(l.leadproduct,',')::text[])) products
        from "lead" l
        where l.personid = $personid
        and l.userid = $userid
        and l.corpid = $corpid
        and l.orgid = $orgid
        and l.status = 'ACTIVO'`,
        module: ["/message_inbox", "/supervisor"],
        protected: "SELECT"
    },
    UFN_BILLINGCONFIGURATION_NEWMONTH: {
        query: "SELECT * FROM ufn_billingconfiguration_newmonth($year, $month)",
        module: "",
        protected: "SELECT"
    },
    UFN_ARTIFICIALINTELLIGENCEPLAN_INS: {
        query: "SELECT * FROM ufn_artificialintelligenceplan_ins($freeinteractions, $basicfee, $additionalfee, $description, $operation)",
        module: "",
        protected: "SELECT"
    },
    UFN_ARTIFICIALINTELLIGENCEPLAN_SEL: {
        query: "SELECT * FROM ufn_artificialintelligenceplan_sel($description)",
        module: ["/billing_setups"],
        protected: "SELECT"
    },
    UFN_ARTIFICIALINTELLIGENCESERVICE_INS: {
        query: "SELECT * FROM ufn_artificialintelligenceservice_ins($provider, $service, $type, $description, $measureunit, $charlimit, $operation)",
        module: "",
        protected: "SELECT"
    },
    UFN_BILLINGARTIFICIALINTELLIGENCE_SEL: {
        query: "SELECT * FROM ufn_billingartificialintelligence_sel($year, $month, $provider, $type, $plan)",
        module: ["/invoice", "/billing_setups"],
        protected: "SELECT"
    },
    UFN_BILLINGARTIFICIALINTELLIGENCE_INS: {
        query: "SELECT * FROM ufn_billingartificialintelligence_ins($year, $month, $id, $provider, $measureunit, $charlimit, $plan, $freeinteractions, $basicfee, $additionalfee, $description, $status, $type, $username, $operation)",
        module: ["/billing_setups"],
        protected: "SELECT"
    },
    UFN_ARTIFICIALINTELLIGENCESERVICE_SEL: {
        query: "SELECT * FROM ufn_artificialintelligenceservice_sel($provider, $service)",
        module: ["/billing_setups"],
        protected: "SELECT"
    },
    UFN_BILLINGPERIODARTIFICIALINTELLIGENCE_SEL: {
        query: "SELECT * FROM ufn_billingperiodartificialintelligence_sel($corpid, $orgid, $year, $month, $provider, $type, $plan, $userid)",
        module: ["/invoice"],
        protected: "SELECT"
    },
    UFN_BILLINGPERIODARTIFICIALINTELLIGENCE_INS_ARRAY: {
        query: "SELECT * FROM ufn_billingperiodartificialintelligence_ins_array($corpid, $orgid, $username, $table)",
        module: ["/invoice"],
        protected: "SELECT"
    },
    UFN_PRODUCTCATALOG_INS_ARRAY: {
        query: "SELECT * FROM ufn_productcatalog_ins_array($corpid, $orgid, $metacatalogid, $username, $table)",
        module: "",
        protected: "INSERT"
    },
    UFN_PRODUCTCATALOG_UPD_ARRAY: {
        query: "SELECT * FROM ufn_productcatalog_upd_array($corpid, $orgid, $username, $table)",
        module: "",
        protected: "INSERT"
    },
    UFN_POSTHISTORY_PUBLISH: {
        query: "SELECT * FROM ufn_posthistory_publish($corpid, $orgid, $communicationchannelid, $posthistoryid, $status, $externaldata, $published, $publishstatus, $publishmessage)",
        module: "",
        protected: "SELECT"
    },
    UFN_POSTHISTORY_INSIGHT: {
        query: "SELECT * FROM ufn_posthistory_insight($corpid, $orgid, $communicationchannelid, $posthistoryid, $reach, $interactions, $reactions)",
        module: "",
        protected: "SELECT"
    },
    UFN_POSTHISTORY_SEL: {
        query: "SELECT * FROM ufn_posthistory_sel($corpid, $orgid, $communicationchannelid, $status, $type, $publishtatus, $datestart, $dateend)",
        module: ["/postcreator"],
        protected: "INSERT"
    },
    UFN_ORG_LST_SIMPLE: {
        query: "SELECT * FROM ufn_org_lst_simple($corpid, $userid)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_UNIQUECONTACTS_PCC_EXPORT: {
        query: "SELECT * FROM ufn_report_uniquecontacts_pcc_export($corpid, $orgid, $year, $month, $channeltype, $where, $order, $offset)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_UNIQUECONTACTS_PCC_SEL: {
        query: "SELECT * FROM ufn_report_uniquecontacts_pcc_sel($corpid, $orgid, $year, $month, $channeltype, $where, $order, $take, $skip, $offset)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_UNIQUECONTACTS_PCC_TOTALRECORDS: {
        query: "SELECT * FROM ufn_report_uniquecontacts_pcc_totalrecords($corpid, $orgid, $year, $month, $channeltype, $where, $offset)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_UNIQUECONTACTS_CONVERSATION_EXPORT: {
        query: "SELECT * FROM ufn_report_uniquecontacts_conversation_export($corpid, $orgid, $year, $month, $channeltype, $where, $order, $offset)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_UNIQUECONTACTS_CONVERSATION_SEL: {
        query: "SELECT * FROM ufn_report_uniquecontacts_conversation_sel($corpid, $orgid, $year, $month, $channeltype, $where, $order, $take, $skip, $offset)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_REPORT_UNIQUECONTACTS_CONVERSATION_TOTALRECORDS: {
        query: "SELECT * FROM ufn_report_uniquecontacts_conversation_totalrecords($corpid, $orgid, $year, $month, $channeltype, $where, $offset)",
        module: ["/reports"],
        protected: "SELECT"
    },
    UFN_CALENDARBOOKING_SEL_ONE: {
        query: "SELECT * FROM ufn_calendarbooking_sel_one($corpid, $orgid, $calendareventid, $id, $offset)",
        module: "",
        protected: false
    },
    UFN_CALENDAR_INTEGRATION_CREDENTIALS: {
        query: "SELECT * FROM ufn_calendarintegration_credentials($corpid, $orgid, $id, $email, $type, $credentials, $timezone)",
        module: "",
        protected: "INSERT"
    },
    UFN_CALENDAR_INTEGRATION_CREDENTIALS_DISCONNECT: {
        query: "SELECT * FROM ufn_calendarintegration_credentials_disconnect($corpid, $orgid, $calendareventid, $calendarintegrationid)",
        module: "",
        protected: "INSERT"
    },
    UFN_CALENDAR_INTEGRATION_TO_CREATE_SEL: {
        query: "SELECT * FROM ufn_calendar_integration_to_create_sel($calendarintegrationid, $calendareventid)",
        module: "",
        protected: "INSERT"
    },
    UFN_CALENDAR_INTEGRATION_CREDENTIALS_CLEAN: {
        query: "SELECT * FROM ufn_calendarintegration_credentials_clean($id, $email)",
        module: "",
        protected: "INSERT"
    },
    UFN_CALENDAR_INTEGRATION_CREDENTIALS_SEL: {
        query: "SELECT * FROM ufn_calendarintegration_credentials_sel($id)",
        module: "",
        protected: "SELECT"
    },
    UFN_CALENDAREVENT_INTEGRATION_CREDENTIALS_SEL: {
        query: "SELECT * FROM ufn_calendareventintegration_credentials_sel($corpid, $orgid, $id)",
        module: "",
        protected: "SELECT"
    },
    UFN_CALENDAR_INTEGRATION_SYNC: {
        query: "SELECT * FROM ufn_calendarintegration_sync($id, $email, $timezone, $updated, $nextsynctoken, $table)",
        module: "",
        protected: "INSERT"
    },
    UFN_CALENDAR_INTEGRATION_WATCH: {
        query: "SELECT * FROM ufn_calendarintegration_watch($id, $email, $watchid, $resourceid, $watchexpiredate)",
        module: "",
        protected: "INSERT"
    },
    UFN_POSTHISTORY_INS: {
        query: "SELECT * FROM ufn_posthistory_ins($corpid, $orgid, $communicationchannelid, $communicationchanneltype, $posthistoryid, $status, $type, $publishdate, $texttitle, $textbody, $hashtag, $sentiment, $activity, $mediatype, $medialink, $username, $operation)",
        module: ["/postcreator"],
        protected: "INSERT"
    },
    UFN_CRON_POSTHISTORY_SEL: {
        query: "SELECT * FROM ufn_cron_posthistory_sel()",
        module: "",
        protected: "SELECT"
    },
    UFN_CRON_POSTHISTORY_INSIGHT_SEL: {
        query: "SELECT * FROM ufn_cron_posthistory_insight_sel()",
        module: "",
        protected: "SELECT"
    },
    UFN_PAYMENTORDER_SEL: {
        query: "SELECT * FROM ufn_paymentorder_sel($corpid, $orgid, $conversationid, $personid, $paymentorderid, $ordercode)",
        module: "",
        protected: "SELECT"
    },
    UFN_PAYMENTORDER_PAYMENT: {
        query: "SELECT * FROM ufn_paymentorder_payment($corpid, $orgid, $paymentorderid, $paymentby, $culqiamount, $chargeid, $chargetoken, $chargejson, $tokenid, $tokenjson)",
        module: "",
        protected: "SELECT"
    },
    UFN_PAYMENTORDER_ERROR: {
        query: "SELECT * FROM ufn_paymentorder_error($corpid, $orgid, $paymentorderid, $paymentby, $lastprovider, $laststatus, $lastdata)",
        module: "",
        protected: "SELECT"
    },
    UFN_CHARGE_PAYMENTORDER_INS: {
        query: "SELECT * FROM ufn_charge_paymentorder_ins($corpid, $orgid, $id, $paymentorderid, $description, $type, $status, $amount, $currency, $paidby, $orderid, $orderjson, $email, $tokenid, $capture, $tokenjson, $chargetoken, $chargejson, $operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_PERSON_SEL_ONE: {
        query: "SELECT * FROM ufn_person_sel_one($corpid, $orgid, $personid)",
        module: ["/person"],
        protected: "INSERT"
    },
    //mobile
    UFN_FACEBOOKPOST_SEL_MOVIL: {
        query: "select * from ufn_facebookpost_sel($take, $skip, $where, $order, $corporation);",
        module: "",
        protected: "SELECT"
    },
    UFN_FACEBOOKPOST_TOTALRECORDS_MOVIL: {
        query: "select * from ufn_facebookpost_totalrecords($where, $corporation);",
        module: "",
        protected: "SELECT"
    },
    UFN_FACEBOOKPOST_EXPORT_MOVIL: {
        query: "select * from ufn_facebookpost_export($where, $order, $corporation);",
        module: "",
        protected: "SELECT"
    },
    QUERY_AUTH_MOVIL: {
        query: "select us.doctype, us.docnumber, ous.roleid, org.description orgdesc, corp.description corpdesc, ous.corpid, ous.orgid, us.userid, us.usr, us.pwd, us.firstname, us.lastname, us.email, us.status, ous.redirect, role.description roledesc from usr us inner join orguser ous on ous.userid = us.userid inner join org org on org.orgid = ous.orgid inner join corp corp on corp.corpid = ous.corpid inner join role role on role.roleid = ous.roleid where us.usr = $usr and ous.bydefault limit 1",
        module: "",
        protected: "SELECT"
    },
    USN_USER_INS_MOVIL: {
        query: "SELECT * FROM ufn_user_ins($id, $usr, $doctype, $docnum, $pwd, $firstname, $lastname, $email, $pwdchangefirstlogin, $type, $status, $username, $operation, $redirect, $company)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_SEL_TICKETSBYCAMPAIGN: {
        query: "SELECT * FROM ufn_conversation_sel_ticketsbycampaign($corpid, $orgid, $userid, $campaignid)",
        module: "",
        protected: "SELECT"
    },
    UFN_USERS_SEL_MOVIL: {
        query: "select * from ufn_users_sel($classification, $startdate, $enddate, $corporation);",
        module: "",
        protected: "SELECT"
    },
    UFN_USER_SEL_MOVIL: {
        query: "select * from ufn_user_sel($facebookuserid);",
        module: "",
        protected: "SELECT"
    },
    UFN_FACEBOOKPOST_USERID_SEL_MOVIL: {
        query: "select * from ufn_facebookpost_userid_sel($userid);",
        module: "",
        protected: "SELECT"
    },
    UFN_UPDATE_ANSWER_FBPOST_MOVIL: {
        query: "update facebookpost set answered = $answered where facebookpostid = $facebookpostid",
        module: "",
        protected: "SELECT"
    },
    QUERY_AUTHENTICATED_MOVIL: {
        query: "select us.userid, us.usr, us.doctype, us.docnum, us.pwd, us.firstname, us.lastname, us.email, us.status, ou.corpid, ou.orgid, org.description orgdesc, corp.description corpname from usr us left join orguser ou on ou.userid = us.userid left join org org on org.orgid = ou.orgid left join corp corp on corp.corpid = ou.corpid where us.usr = $usr and ou.bydefault = true",
        module: "",
        protected: "SELECT"
    },
    UFN_USERZYX_SEL_MOVIL: {
        query: "select * from ufn_user_sel($corpid, $orgid, $id, $username, $applicationid, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_CORP_ORG_SEL_MOVIL: {
        query: "SELECT * FROM ufn_corp_org_sel($corpid, $id, $username, $applicationid, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_ROLE_LST_MOVIL: {
        query: "SELECT * FROM ufn_role_lst($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_COMMUNICATIONCHANNEL_LST_MOVIL: {
        query: "SELECT * FROM ufn_communicationchannel_lst($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_USER_SUPERVISOR_LST_MOVIL: {
        query: "SELECT * FROM ufn_user_supervisor_lst($corpid, $orgid, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_APPS_DATA_SEL_MOVIL: {
        query: "SELECT * FROM UFN_APPS_DATA_SEL($roleid)",
        module: ["/extras/users"],
        protected: "SELECT"
    },
    UFN_ORGUSER_SEL_MOVIL: {
        query: "SELECT * FROM ufn_orguser_sel($corpid, $orgid, $userid, $username, $applicationid, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_SEL_TICKETSBYUSER_MOVIL: {
        query: "SELECT * FROM ufn_conversation_sel_ticketsbyuser_movil($corpid, $orgid, $userid, true, $origin, $status)",
        module: "",
        protected: "SELECT"
    },
    UFN_USERTOKEN_SEL_MOVIL: {
        query: "SELECT * FROM ufn_usertoken_sel($corpid, $orgid, $userid, $token)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_SEL_INTERACTION_MOVIL: {
        query: "SELECT * FROM ufn_conversation_sel_interaction_movil($conversationid, $lock, $conversationold, true, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_USERSTATUS_UPDATE_MOVIL: {
        query: "SELECT * FROM ufn_userstatus_update($userid, $orgid, $type, $username, $status, $motive, $description)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_INFORMATION_SEL_MOVIL: {
        query: "SELECT * FROM ufn_conversation_information_sel_movil($conversationid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_PERSON_SEL_MOVIL: {
        query: "SELECT * FROM ufn_conversation_person_sel_movil($personid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_PERSON_SEL_MOVIL2: {
        query: "SELECT * FROM ufn_conversation_person_sel_movil2($personid, $conversationid)",
        module: "",
        protected: "SELECT"
    },
    UFN_PERSONADDINFO_SEL_MOVIL: {
        query: "SELECT * FROM ufn_personaddinfo_sel($personid)",
        module: "",
        protected: "SELECT"
    },
    UFN_DOMAIN_LST_VALORES_MOVIL: {
        query: "SELECT * FROM ufn_domain_lst_valores($corpid, $orgid, $domainname)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_CHANGESTATUS_MOVIL: {
        query: "SELECT * FROM ufn_conversation_changestatus($corpid, $orgid, $conversationid, $status, $obs, $motivo, $userid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_LST_USRDELEGATE_MOVIL: {
        query: "SELECT * FROM ufn_conversation_lst_usrdelegate2($corpid, $orgid, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_REASSIGNTICKET_MOVIL: {
        query: "SELECT * FROM ufn_conversation_reassignticket($conversationid, $newuserid, $userid, $username, $usergroup)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATIONCLASSIFICATIONLIST_LEVEL1_SEL_MOVIL: {
        query: "SELECT * FROM ufn_conversationclassificationlist_level1_sel($corpid, $orgid, $type)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATIONCLASSIFICATIONLIST_LEVEL2_SEL_MOVIL: {
        query: "SELECT * FROM ufn_conversationclassificationlist_level2_sel($corpid, $orgid, $type, $classificationid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATIONCLASSIFICATION_INS_MOVIL: {
        query: "SELECT * FROM ufn_conversationclassification_ins($conversationid, $classificationid, $username, $operation)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATIONID_SEL_TICKETSBYUSER_MOVIL: {
        query: "SELECT * FROM ufn_conversationid_sel_ticketsbyuser_movil($conversationid, $corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_USERSTATUS_UPDATE_ORG_MOVIL: {
        query: "SELECT * FROM ufn_userstatus_update_org($userid, $orgidold, $orgidnew, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_ORGANIZATION_CHANGEORG_SEL_MOVIL: {
        query: "SELECT * FROM ufn_organization_changeorg_sel($userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_SEL_PREVIOUSTICKET_MOVIL: {
        query: "SELECT * FROM ufn_conversation_sel_previousticket_movil($conversationid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_NOTES_INS_MOVIL: {
        query: "SELECT * FROM ufn_conversation_notes_ins($id, $conversationid, $note, $status, $username, $operation)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_NOTES_SEL_MOVIL: {
        query: "SELECT * FROM ufn_conversation_notes_sel($conversationid)",
        module: "",
        protected: "SELECT"
    },
    UFN_PROPERTY_SELBYNAME_MOVIL: {
        query: "SELECT * FROM ufn_property_selbyname($corpid, $orgid, $propertyname)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_CLASSIFICATION_SEL_MOVIL: {
        query: "SELECT * FROM ufn_conversationclassification_sel($conversationid)",
        module: "",
        protected: "SELECT"
    },
    UFN_INAPPROPRIATE_WORDS_LST_MOVIL: {
        query: "SELECT * FROM ufn_inappropriate_words_lst($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_QUICKREPLY_SEL_MOVIL: {
        query: "SELECT * FROM ufn_quickreply_sel($corpid, $orgid,0, $username, $applicationid, true)",
        module: "",
        protected: "SELECT"
    },
    UFN_SECURITYRULES_ACTIVE_MOVIL: {
        query: "SELECT * FROM ufn_securityrules_active($corpid)",
        module: "",
        protected: "SELECT"
    },
    UFN_USR_UPDATEPWD_MOVIL: {
        query: "SELECT * FROM ufn_usr_updatepwd($userid , $pwd, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_CHATFLOW_ISSELFBLOCK_SEL_MOVIL: {
        query: "SELECT * FROM ufn_chatflow_isselfblock_sel($corpid, $orgid, $communicationchannelid)",
        module: "",
        protected: "SELECT"
    },
    UFN_QUICKREPLY_LIST_SEL_MOVIL: {
        query: "SELECT * FROM ufn_quickreply_list_sel($corpid, $orgid, $classificationid, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_PERSONADDINFO_INS_MOVIL: {
        query: "select * from ufn_personaddinfo_ins($corpid, $orgid, $personid, $id, $addinfo, $status, $type, $username, $operation)",
        module: "",
        protected: "SELECT"
    },
    UFN_PERSON_INS_MOVIL: {
        query: "SELECT * from  ufn_person_ins($personid, $corpid, $orgid, $groups, $status, $type, $persontype, $personstatus, $phone, $email, $birthday, $alternativephone, $alternativeemail, $documenttype, $documentnumber, $firstname, $lastname, $sex, $gender, $civilstatus, $occupation, $educationlevel, $referringpersonid, null, $username, $operation)",
        module: "",
        protected: "SELECT"
    },
    UFN_PERSON_INS2_MOVIL: {
        query: "SELECT * from  ufn_person_ins($personid, $corpid, $orgid, $groups, $status, $type, $persontype, $personstatus, $phone, $email, $birthday, $alternativephone, $alternativeemail, $documenttype, $documentnumber, $firstname, $lastname, $sex, $gender, $civilstatus, $occupation, $educationlevel, $referringpersonid, $observation, $username, $operation)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_STRUCTUREDMESSAGE_SEL_MOVIL: {
        query: "SELECT * FROM ufn_conversation_structuredmessage_sel($corpid, $orgid, $communicationchannelid, $type)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_SEL_TICKETSBYPERSON_MOVIL: {
        query: "SELECT * FROM ufn_conversation_sel_ticketsbyperson_movil($corpid, $orgid, $personid, $conversationid)",
        module: "",
        protected: "SELECT"
    },
    QUERY_EMOJICONVERSATION_SEL_NOT_CC_MOVIL: {
        query: "select string_agg(emojichar, ',') from emoji where communicationchannel not like concat('%', $communicationchanneltype, '%')",
        module: "",
        protected: "SELECT"
    },
    UFN_USERHANDOFF_SEL_MOVIL: {
        query: "SELECT * FROM ufn_userhandoff_sel($corpid, $orgid, $communicationchannelid, $usergroup)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_SEL_INTERACTION_BYINTERACTIONID_MOVIL: {
        query: "SELECT * FROM ufn_conversation_sel_interaction_byinteractionid_movil($conversationid, $interactionid, $order)",
        module: "",
        protected: "SELECT"
    },
    UFN_TABLEVARIABLECONFIGURATIONBYCHANNEL_SEL_MOVIL: {
        query: "select * from ufn_tablevariableconfigurationbychannel_sel($corpid, $orgid, $communicationchannelid, $userid)",
        module: "",
        protected: "SELECT"
    },
    QUERY_GET_CLIENT_BY_PHONE_MOVIL: {
        query: "select * from clientetmp where telefono = $phone order by clientetmpid desc",
        module: "",
        protected: "SELECT"
    },
    QUERY_GET_CLIENT_BY_ADDRESS_MOVIL: {
        query: "select * from clientetmp where direccion = $address order by clientetmpid desc",
        module: "",
        protected: "SELECT"
    },
    QUERY_GUARDAR_PEDIDO_MOVIL: {
        query: "update clientetmp set detalleultimopedido = $detalleultimopedido where codigocliente = $codigocliente",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_SEL_TICKETSBYUSER_FILTER_MOVIL: {
        query: "SELECT * FROM ufn_conversation_sel_ticketsbyuser_filter_movil($corpid, $orgid, $start_createticket, $end_createticket, $channels, $conversationstatus, $displayname, $phone, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_MESSAGETEMPLATE_LST_MOVIL: {
        query: "SELECT * FROM ufn_messagetemplate_lst($corpid, $orgid, $type, $username)",
        module: "",
        protected: "SELECT"
    },
    QUERY_SEL_TABLESETTING_BACKUP: {
        query: `select tablename, columnpk, tableorder, selectwhere, update, batchsize, insertwhere, updatewhere from tablesettingbackup where status = 'ACTIVO' order by tableorder asc`,
        module: "",
        protected: "SELECT"
    },
    UFN_LOGBACKUP_SEL: {
        query: `select * FROM ufn_logbackup_sel()`,
        module: "",
        protected: "SELECT"
    },
    UFN_LOGBACKUP_UPD: {
        query: `select * FROM ufn_logbackup_upd($logbackupid, $error, $tables_update, $status)`,
        module: "",
        protected: "SELECT"
    },
    UFN_LEAD_PERSON_INS_MOVIL: {
        query: "SELECT * FROM ufn_lead_person_ins($corpid, $orgid, $id, $description, $type, $status, $expected_revenue, $date_deadline, $tags, $personcommunicationchannel, $priority, $conversationid, $columnid, $username, $index, $firstname, $lastname, $email, $phone, $personid, $userid, $persontype, $leadproduct)",
        module: "",
        protected: "SELECT"
    },
    UFN_USERTOKEN_INS_MOVIL: {
        query: "select * from ufn_usertoken_ins($userid, $token, $origin)",
        module: "",
        protected: "SELECT"
    },
    UFN_GET_TOKEN_LOGGED_MOVIL_MOVIL: {
        query: "select * from ufn_get_token_logged_movil($userid)",
        module: "",
        protected: "SELECT"
    },
    QUERY_UPDATE_PERSON_BY_HSM_MOVIL: {
        query: "UPDATE person pe SET firstcontact = CASE WHEN pe.firstcontact IS NULL THEN NOW() else pe.firstcontact END, lastcontact = NOW() where pe.personid = $personid and pe.corpid = $corpid and pe.orgid = $orgid;",
        module: "",
        protected: "SELECT"
    },
    UFN_PRODUCTCATALOG_SEL_MOVIL: {
        query: "select * from ufn_productcatalog_sel_normal($corpid, $orgid, $id, $category, $username, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_METACATALOG_INS: {
        query: "SELECT * FROM ufn_metacatalog_ins($corpid, $orgid, $metabusinessid, $id, $catalogid, $catalogname, $catalogdescription, $catalogtype, $description, $status, $type, $haslink, $username, $operation)",
        module: "",
        protected: "SELECT"
    },
    UFN_METACATALOG_SEL: {
        query: "SELECT * FROM ufn_metacatalog_sel($corpid, $orgid, $metabusinessid, $id)",
        module: ["/extras/tipifications"],
        protected: "SELECT"
    },
    UFN_METABUSINESS_INS: {
        query: "SELECT * FROM ufn_metabusiness_ins($corpid, $orgid, $id, $businessid, $businessname, $accesstoken, $userid, $userfullname, $graphdomain, $description, $status, $type, $username, $operation)",
        module: "",
        protected: "SELECT"
    },
    UFN_METABUSINESS_SEL: {
        query: "SELECT * FROM ufn_metabusiness_sel($corpid, $orgid, $id)",
        module: ["/catalogmaster"],
        protected: "SELECT"
    },
    UFN_ORDER_SEL: {
        query: "SELECT * FROM ufn_order_sel($corpid, $orgid, $product, $category, $type)",
        module: ["/orders"],
        protected: "SELECT"
    },
    UFN_ORDER_BY_CARRIER: {
        query: "SELECT * FROM ufn_order_by_carrier($corpid, $orgid, $orderstatus, $code)",
        module: "",
        protected: "SELECT"
    },
    UFN_ORDERLINE_BY_CARRIER: {
        query: "SELECT * FROM ufn_orderline_by_carrier($corpid, $orgid, $orderid)",
        module: "",
        protected: "SELECT"
    },
    UFN_ORDERS_BY_CONFIGURATION_SEL: {
        query: "SELECT * FROM ufn_orders_by_configuration_sel($corpid, $orgid, $listorderid)",
        module: "",
        protected: "SELECT"
    },
    UFN_DELIVERYROUTECODE_INS_ARRAY: {
        query: "SELECT * FROM ufn_deliveryroutecode_ins_array($corpid, $orgid, $orders, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_DELIVERYCONFIG_PHOTOS_SEL: {
        query: "SELECT * FROM ufn_deliveryconfig_photos_sel($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_DELIVERYPHOTO_INS: {
        query: "SELECT * FROM ufn_deliveryphoto_ins($corpid, $orgid, $id, $orderid, $status, $type, $description, $url, $username, $operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_DELIVERYPHOTO_SEL: {
        query: "SELECT * FROM ufn_deliveryphoto_sel($corpid, $orgid, $orderid)",
        module: "",
        protected: "SELECT"
    },
    UFN_ORDERLINE_SEL: {
        query: "SELECT * FROM ufn_orderline_sel($corpid, $orgid, $orderid)",
        module: ["/orders"],
        protected: "SELECT"
    },
    UFN_ORDERHISTORY_SEL: {
        query: "SELECT * FROM ufn_orderhistory_sel($corpid, $orgid, $orderid, $offset)",
        module: ["/orders"],
        protected: "SELECT"
    },
    UFN_ORDER_UPDATE: {
        query: "SELECT * FROM ufn_update_order_movil($corpid, $orgid, $orderid, $subreasonnondeliveryid, $orderstatus, $latitude, $longitude, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_METACATALOG_CLEAN: {
        query: "SELECT * FROM ufn_metacatalog_clean($corpid, $orgid, $metabusinessid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_PAYMENT_SEL: {
        query: "SELECT * FROM ufn_payment_sel($corpid, $orgid, $conversationid, $paymentid)",
        module: "",
        protected: "INSERT"
    },
    UFN_PAYMENT_CHARGE: {
        query: "SELECT * FROM ufn_payment_charge($corpid, $orgid, $paymentid, $tokenid, $tokenjson, $chargejson, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_DASHBOARD_KPI_SUMMARY_SEL: {
        query: "SELECT * FROM ufn_dashboard_kpi_summary_sel($corpid, $orgid, $date, $origin, $usergroup, $supervisorid, $offset, $userid)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_KPI_SUMMARY_GRAPH_SEL: {
        query: "SELECT * FROM ufn_dashboard_kpi_graph_sel($corpid, $orgid, $date, $origin, $usergroup, $supervisorid, $offset, $userid)",
        module: ["/dashboard"],
        protected: "SELECT"
    },
    UFN_RASA_INTENT_SEL: {
        query: "SELECT * FROM ufn_rasa_intent_sel($corpid, $orgid, $rasaid)",
        module: ["/iatraining"],
        protected: "SELECT"
    },
    UFN_ORDERLINE_PRODUCT_LST: {
        query: "SELECT * FROM ufn_orderline_product_lst ($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CHANGE_ORDERSTATUS: {
        query: "SELECT * FROM ufn_change_orderstatus($corpid, $orgid, $orderid, $orderstatus, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_RASA_INTENT_INS: {
        query: "SELECT * FROM ufn_rasa_intent_ins($id, $corpid, $orgid, $rasaid, $intent_name, $intent_description, $intent_examples, $entities, $entity_examples, $entity_values, $status, $username, $operation)",
        module: ["/iatraining"],
        protected: "SELECT"
    },
    UFN_TIME_WAITING_SEL: {
        query: "select * from ufn_time_waiting_sel($corpid, $orgid, $userid, $useridselected)",
        module: "",
        protected: "SELECT"
    },
    UFN_RASA_SYNONYM_SEL: {
        query: "SELECT * FROM ufn_rasa_synonym_sel($corpid, $orgid, $rasaid)",
        module: ["/iatraining"],
        protected: "SELECT"
    },
    UFN_RASA_SYNONYM_INS: {
        query: "SELECT * FROM ufn_rasa_synonym_ins($id, $corpid, $orgid, $rasaid, $description, $examples, $values, $status, $username, $operation)",
        module: ["/iatraining"],
        protected: "SELECT"
    },
    UFN_RASA_MODEL_UUID_SEL: {
        query: "SELECT * FROM ufn_rasa_model_uuid_sel($corpid, $orgid, $model_uuid)",
        module: "",
        protected: "SELECT"
    },
    UFN_RASA_FILE_UPLOAD: {
        query: "SELECT * FROM ufn_rasa_file_upload($corpid, $orgid, $rasaid, $intents, $synonyms, $usr)",
        protected: "SELECT"
    },
    UFN_RASA_MODEL_SEL: {
        query: "SELECT * FROM ufn_rasa_model_sel($corpid, $orgid)",
        module: ["/iatraining"],
        protected: "SELECT"
    },
    UFN_DASHBOARD_KPI_SUMMARY_BY_MONTH: {
        query: "SELECT * FROM ufn_dashboard_kpi_summary_by_month($corpid, $orgid, $date, $origin, $usergroup, $supervisorid, $offset, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_KPI_SUMMARY_GRAPH_BY_MONTH: {
        query: "SELECT * FROM ufn_dashboard_kpi_graph_by_month($corpid, $orgid, $startdate, $enddate, $origin, $usergroup, $supervisorid, $offset, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_COLUMN_ORDER_SEL: {
        query: "SELECT * FROM ufn_column_order_sel($corpid, $orgid, $id, $all)",
        module: "",
    },
    UFN_RASA_MODEL_INS: {
        query: "SELECT * FROM ufn_rasa_model_ins($corpid, $orgid, $rasaid, $usr)",
        protected: "SELECT"
    },
    UFN_CONVERSATION_SEL_ANALYTICS_V2: {
        query: "SELECT * FROM ufn_conversation_sel_analytics_v2($conversationid)",
        module: "",
        protected: "SELECT"
    },
    UFN_TIMESHEET_INS: {
        query: "SELECT * FROM ufn_timesheet_ins($corpid, $orgid, $id, $description, $type, $status, $username, $operation, $startdate, $startuserid, $registerdate, $registeruserid, $registerprofile, $registerdetail, $timeduration);",
        module: "",
        protected: "INSERT"
    },
    UFN_TIMESHEET_SEL: {
        query: "SELECT * FROM ufn_timesheet_sel($corpid, $orgid, $timesheetid, $startdate, $all);",
        module: "",
        protected: "SELECT"
    },
    UFN_TIMESHEET_USER_SEL: {
        query: "SELECT * FROM ufn_timesheet_user_sel($corpid, $orgid);",
        module: "",
        protected: "SELECT"
    },
    UFN_TIMESHEET_PROFILE_SEL: {
        query: "SELECT * FROM ufn_timesheet_profile_sel($corpid, $orgid, $startdate);",
        module: "",
        protected: "SELECT"
    },
    UFN_CURRENCY_SEL: {
        query: "SELECT * FROM ufn_currency_sel();",
        module: "",
        protected: "SELECT"
    },
    UFN_TIMESHEET_PERIOD_SEL: {
        query: "SELECT * FROM ufn_timesheet_period_sel($corpid, $orgid, $year, $month);",
        module: "",
        protected: "SELECT"
    },
    UFN_BILLING_REPORT_CONSULTING: {
        query: "SELECT * FROM ufn_billing_report_consulting($corpid, $orgid, $year, $month)",
        module: "",
        protected: "SELECT"
    },

    UFN_WAREHOUSE_SEL2: {
        query: "SELECT * FROM ufn_warehouse_lst($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },

    UFN_PARTNER_SEL: {
        query: "SELECT * FROM ufn_partner_sel($id, $all, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_PARTNER_INS: {
        query: "SELECT * FROM ufn_partner_ins($id, $country, $billingcurrency, $documenttype, $documentnumber, $company, $address, $billingcontact, $email, $signaturedate, $enterprisepartner, $billingplan, $typecalculation, $numbercontactsbag, $puadditionalcontacts, $priceperbag, $automaticgenerationdrafts, $automaticperiodgeneration, $montlyplancost, $numberplancontacts, $username, $status, $type, $operation);",
        module: "",
        protected: "INSERT"
    },
    UFN_CUSTOMER_BY_PARTNER_SEL: {
        query: "SELECT * FROM ufn_customer_by_partner_sel($partnerid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CUSTOMER_BY_PARTNER_INS: {
        query: "SELECT * FROM ufn_customer_by_partner_ins($id, $corpid, $orgid, $partnerid, $typepartner, $billingplan, $comissionpercentage, $status, $username, $operation);",
        module: "",
        protected: "INSERT"
    },
    UFN_CUSTOMERPARTNER_BY_USER_SEL: {
        query: "SELECT * FROM ufn_customerpartner_by_user_sel($username)",
        module: "",
        protected: "SELECT"
    },

    UFN_BILLINGPERIODPARTNER_ENTERPRISE: {
        query: "SELECT * FROM ufn_billingperiodpartner_enterprise($partnerid, $corpid, $orgid, $year, $month, $reporttype, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_API_PRODUCTCATALOG_INS: {
        query: "SELECT * FROM ufn_api_productcatalog_ins($corpid, $orgid, $metacatalogid, $title, $description, $descriptionshort, $category, $saleprice, $imagelink, $status, $type, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_API_PRODUCTCATALOG_SEL: {
        query: "SELECT * FROM ufn_api_productcatalog_sel($corpid, $orgid, $productid)",
        module: "",
        protected: "SELECT"
    },
    UFN_API_ORDER_INS: {
        query: "SELECT * FROM ufn_api_order_ins($corpid, $orgid, $conversationid, $personid, $personcommunicationchannel, $status, $currency, $amount, $paymentstatus, $paymentref, $deliverytype, $deliveryaddress, $username, $description, $paymentmethod)",
        module: "",
        protected: "SELECT"
    },
    UFN_API_ORDERLINE_INS: {
        query: "SELECT * FROM ufn_api_orderline_ins($corpid, $orgid, $orderid, $conversationid, $personid, $personcommunicationchannel, $description, $productid, $type, $title, $imagelink, $quantity, $currency, $unitprice, $amount, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_API_MESSAGETEMPLATE_SEL: {
        query: "SELECT * FROM ufn_api_messagetemplate_sel($corpid, $orgid, $id)",
        module: "",
        protected: "SELECT"
    },
    UFN_API_CAMPAIGN_UPDATE: {
        query: "SELECT * FROM ufn_api_campaign_update($corpid, $orgid, $id, $productid, $delivery_type, $delivery_coverage, $delivery_cost, $stock)",
        module: "",
        protected: "SELECT"
    },
    UFN_API_CONVERSATION_CHECK: {
        query: "SELECT * FROM ufn_api_conversation_check($corpid, $orgid, $conversationid, $personcommunicationchannel)",
        module: "",
        protected: "SELECT"
    },
    UFN_API_CAMPAIGN_PENDING_SEL: {
        query: "SELECT * FROM ufn_api_campaign_pending_sel($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_API_CAMPAIGN_MANAGEMENT: {
        query: "SELECT * FROM ufn_api_campaign_management($corpid, $orgid, $campaignid, $operation, $value)",
        module: "",
        protected: "SELECT"
    },
    UFN_API_ORDER_SEL: {
        query: "SELECT * FROM ufn_api_order_sel($corpid, $orgid, $id)",
        module: "",
        protected: "SELECT"
    },
    UFN_ALL_INVENTORY_INVENTORYMOVEMENT_SEL: {
        query: "SELECT * FROM inventario.ufn_all_inventory_inventorymovement_sel($corpid, $orgid, $inventoryid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_ALL_PRODUCT_ORDER_SEL: {
        query: "SELECT * FROM inventario.ufn_all_product_order_sel($corpid, $orgid, $productid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_ORDER_INS: {
        query: "SELECT * FROM inventario.ufn_inventoryorder_ins($corpid, $orgid, $inventoryorderid, $inventoryid, $isneworder, $replenishmentpoint, $deliverytimedays, $securitystock, $economicorderquantity, $unitbuyid, $status, $type, $distributorid, $manufacturerid, $model, $catalognumber, $operation, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_INVENTORYBALANCE_UPD: {
        query: "SELECT * FROM inventario.ufn_inventorybalance_upd_mas($json, $corpid, $orgid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_INVENTORYRECOUNT_UPD: {
        query: "SELECT * FROM inventario.ufn_inventoryrecount_upd_mas($json, $corpid, $orgid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_INVENTORYCOST_UPD: {
        query: "SELECT * FROM inventario.ufn_inventorycost_upd_mas($json, $corpid, $orgid, $username)",
        module: "",
        protected: "SELECT"
    },
    QUERY_AISERVICE_PAYMENTPLAN_CHECK: {
        query: "select * from ufn_aiservice_paymentplan_check($corpid, $orgid, 'GEODIR', 'LOCATION')",
        module: "",
        protected: "SELECT"
    },
    UFN_INVENTORY_INVENTORYBALANCE_UPD: {
        query: "SELECT * FROM inventario.ufn_inventory_inventorybalance_update($corpid, $orgid, $inventoryid, $username)",
        module: "",
        protected: "SELECT"
    },

    UFN_WAREHOUSE_SEL: {
        query: "SELECT * FROM ufn_warehouse_lst($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_ASSISTANTAI_INS: {
        query: "SELECT * FROM ufn_assistantai_ins($corpid, $orgid, $id, $code, $name, $description, $basemodel, $language, $organizationname, $intelligentmodelsid, $querywithoutanswer, $response, $prompt, $negativeprompt, $generalprompt, $temperature, $max_tokens, $top_p, $apikey, $retrieval, $codeinterpreter, $type, $status, $decoding_method, $username, $operation);",
        module: "",
        protected: "INSERT"
    },
    UFN_ASSISTANTAI_SEL: {
        query: "SELECT * FROM ufn_assistantai_sel($corpid, $orgid, $username, $id, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_ASSISTANTAIDOCUMENT_SEL: {
        query: "SELECT * FROM ufn_assistantaidocument_sel($corpid, $orgid, $assistantaiid, $username, $id, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_ASSISTANTAIDOCUMENT_INS: {
        query: "SELECT * FROM ufn_assistantaidocument_ins($corpid, $orgid, $assistantaiid, $id, $description, $url, $fileid, $type, $status, $username, $operation);",
        module: "",
        protected: "INSERT"
    },
    UFN_THREAD_SEL: {
        query: "SELECT * FROM ufn_thread_sel($corpid, $orgid, $assistantaiid, $username, $id, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_THREAD_INS: {
        query: "SELECT * FROM ufn_thread_ins($corpid, $orgid, $assistantaiid, $id, $code, $description, $type, $status, $username, $operation);",
        module: "",
        protected: "INSERT"
    },
    UFN_MESSAGEAI_SEL: {
        query: "SELECT * FROM ufn_messageai_sel($corpid, $orgid, $assistantaiid, $threadid)",
        module: "",
        protected: "SELECT"
    },
    UFN_MESSAGEAI_INS: {
        query: "SELECT * FROM ufn_messageai_ins($corpid, $orgid, $assistantaiid, $threadid, $assistantaidocumentid, $id, $messagetext, $infosource, $type, $status, $username, $operation);",
        module: "",
        protected: "INSERT"
    },
    UFN_ASSISTANTAIDOCUMENT_TRAINING_UPD: {
        query: "SELECT * FROM ufn_assistantaidocument_training_upd($corpid, $orgid, $assistantaiid, $documentsid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_SUBSCRIPTION_CREATECHANNELS: {
        query: "SELECT * FROM ufn_subscription_createchannels($corpid, $orgid, $userid, $android, $apple, $appstore, $blogger, $business, $chatWeb, $email, $facebook, $instagram, $instagramDM, $linkedin, $messenger, $metalead, $playstore, $sms, $teams, $telegram, $tiktok, $twitter, $twitterDM, $voximplantphone, $webForm, $whatsapp, $workplace, $workplaceDM, $youtube)",
        module: "",
        protected: "SELECT"
    },
    UFN_ORDERCONFIG_INS: {
        query: "SELECT * FROM ufn_orderconfig_ins($corpid, $orgid, $id, $orderconfig, $type, $status, $username, $operation);",
        module: "",
        protected: "INSERT"
    },
    UFN_ORDERCONFIG_SEL: {
        query: "SELECT * FROM ufn_orderconfig_sel($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_LEAD_CONFIG_INS: {
        query: "SELECT * FROM ufn_lead_config_ins($id, $maxgreen, $maxyellow);",
        module: "",
        protected: "INSERT"
    },
    UFN_POLYGONS_INS_ARRAY: {
        query: "SELECT * FROM ufn_polygons_ins_array($corpid, $orgid, $username, $table)",
        module: "",
        protected: "SELECT"
    },
    SEARCH_POINT_ON_AREAS: {
        query: "SELECT * FROM search_point_on_areas($corpid, $orgid, $latitude , $longitude)",
        module: "",
        protected: "SELECT"
    },
    UFN_API_ORDER_UPDATE_INFO: {
        query: "SELECT * FROM ufn_api_order_update_info($corpid, $orgid, $order_id, $delivery_type, $delivery_date, $delivery_address, $delivery_address_reference, $paymentmethod, $payment_receipt, $payment_document_type, $payment_document_number, $payment_businessname, $payment_fiscal_address, $payment_date, $payment_amount, $payment_attachment)",
        module: "",
        protected: 'SELECT'
    },
    UFN_APPSETTING_INVOICE_SEL_SINGLE: {
        query: "SELECT * FROM ufn_appsetting_invoice_sel_single($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_APPSETTING_INVOICE_SEL_EXCHANGERATE: {
        query: "SELECT * FROM ufn_appsetting_invoice_sel_exchangerate($code)",
        module: "",
        protected: "SELECT"
    },
    UFN_CITYBILLING_SEL: {
        query: "SELECT * FROM ufn_citybilling_sel();",
        module: "",
        protected: "SELECT"
    },
    UFN_BILLINGPERIODPARTNER_CALC: {
        query: "SELECT * FROM ufn_billingperiodpartner_calc($partnerid, $year, $month)",
        module: ["/invoice"],
        protected: "INSERT"
    },
    UFN_DELIVERYCONFIGURATION_SEL: {
        query: "SELECT * FROM ufn_deliveryconfiguration_sel($corpid, $orgid, $username, $id, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_DELIVERYCONFIGURATION_INS: {
        query: "SELECT * FROM ufn_deliveryconfiguration_ins($corpid, $orgid, $id, $config, $status, $type, $username, $operation);",
        module: "",
        protected: "INSERT"
    },
    UFN_DELIVERYVEHICLE_SEL: {
        query: "SELECT * FROM ufn_deliveryvehicle_sel($corpid, $orgid, $username, $id, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_DELIVERYVEHICLE_INS: {
        query: "SELECT * FROM ufn_deliveryvehicle_ins($corpid, $orgid, $id, $status, $type, $brand, $model, $vehicleplate, $capacity, $insuredamount, $averagespeed, $userid, $license, $username, $operation);",
        module: "",
        protected: "INSERT"
    },
    UFN_USERS_APP_DELIVERY_SEL: {
        query: "SELECT * FROM ufn_users_app_delivery_sel($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_COMMUNICATIONCHANNEL_LST_TYPEDESC: {
        query: "SELECT * FROM ufn_communicationchannel_lst_typedesc($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_LISTORDER_SEL: {
        query: "SELECT * FROM ufn_listorder_sel($corpid, $orgid, $ordersinattention)",
        module: "",
        protected: "SELECT"
    },
    UFN_REASONNONDELIVERY_SEL: {
        query: "SELECT * FROM ufn_reasonnondelivery_sel($corpid, $orgid, $id, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_REASONNONDELIVERY_INS: {
        query: "SELECT * FROM ufn_reasonnondelivery_ins($corpid, $orgid, $id, $status, $type, $description, $username, $operation);",
        module: "",
        protected: "INSERT"
    },
    UFN_SUBREASONNONDELIVERY_SEL: {
        query: "SELECT * FROM ufn_subreasonnondelivery_sel($corpid, $orgid, $reasonnondeliveryid)",
        module: "",
        protected: "SELECT"
    },
    UFN_SUBREASONNONDELIVERY_INS: {
        query: "SELECT * FROM ufn_subreasonnondelivery_ins($corpid, $orgid, $id, $reasonnondeliveryid, $status, $type, $description, $statustypified, $viewappmovil, $username, $operation);",
        module: "",
        protected: "INSERT"
    },
    UFN_REPORT_CONFIGURATION_INS: {
        query: "SELECT * FROM ufn_report_configuration_ins($corpid, $orgid, $reportname, $configuration, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_REPORT_CONFIGURATION_SEL: {
        query: "SELECT * FROM ufn_report_configuration_sel($corpid, $orgid, $reportname)",
        module: "",
        protected: "SELECT"
    },
    UFN_ASSIGNMENTRULE_SEl: {
        query: "SELECT * FROM ufn_assignmentrule_sel($corpid, $orgid, $id, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_ASSIGNMENTRULE_INS: {
        query: "SELECT * FROM ufn_assignmentrule_ins($corpid, $orgid, $id, $description, $group, $assignedgroup, $type, $status, $username, $operation)",
        module: "",
        protected: "SELECT"
    },
    UFN_ASSIGNMENTRULE_INS: {
        query: "SELECT * FROM ufn_assignmentrule_ins($corpid, $orgid, $id, $description, $group, $assignedgroup, $type, $status, $username, $operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_ASSIGNMENTRULE_MASSIVE_DEL: {
        query: "SELECT * FROM ufn_assignmentrule_massive_del($corpid, $orgid, $groupslistassignmentruleid, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_ASSIGNMENTRULE_BY_GROUP_SEL: {
        query: "SELECT * FROM ufn_assignmentrule_by_group_sel($corpid, $orgid, $group, $usergroups)",
        module: "",
        protected: "SELECT"
    },
    UFN_DOMAIN_BY_DOMAINNAME: {
        query: "SELECT * FROM ufn_domain_by_domainname($corpid, $orgid, $domainname)",
        module: "",
        protected: "SELECT"
    },
    UFN_UPDATE_ORDERSCHEDULE: {
        query: "select * from ufn_update_order_schedule($corpid, $orgid, $listorderid, $deliveryshift, $scheduledeliverydate, $orderstatus, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_UPDATE_ORDERSTATUS: {
        query: "select * from ufn_update_order_onlystatus($corpid, $orgid, $listorderid, $orderstatus, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_UPDATE_ORDERNONDELIVERY: {
        query: "select * from ufn_update_order_nondelivery($corpid, $orgid, $listorderid, $subreasonnondeliveryid, $orderstatus, $latitudecarrier, $longitudecarrier, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_UPDATE_ORDERCANCELED: {
        query: "select * from ufn_update_order_canceled($corpid, $orgid, $listorderid, $descriptionreason, $orderstatus, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_ORDERSINATTENTION_SEL: {
        query: "SELECT * FROM ufn_ordersinattention_sel($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_ORDERSINSTORE_SEL: {
        query: "SELECT * FROM ufn_ordersinstore_sel($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_UPDATE_ORDERDISPATCHED: {
        query: "select * from ufn_update_order_dispatch($corpid, $orgid, $code, $orderstatus, $userid, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_ASSIGNMENTRULE_SEl: {
        query: "SELECT * FROM ufn_assignmentrule_sel($corpid, $orgid, $id, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_ASSIGNMENTRULE_INS: {
        query: "SELECT * FROM ufn_assignmentrule_ins($corpid, $orgid, $id, $description, $group, $assignedgroup, $type, $status, $username, $operation)",
        module: "",
        protected: "SELECT"
    },
    UFN_ASSIGNMENTRULE_INS: {
        query: "SELECT * FROM ufn_assignmentrule_ins($corpid, $orgid, $id, $description, $group, $assignedgroup, $type, $status, $username, $operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_ASSIGNMENTRULE_MASSIVE_DEL: {
        query: "SELECT * FROM ufn_assignmentrule_massive_del($corpid, $orgid, $groupslistassignmentruleid, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_ASSIGNMENTRULE_BY_GROUP_SEL: {
        query: "SELECT * FROM ufn_assignmentrule_by_group_sel($corpid, $orgid, $group, $usergroups)",
        module: "",
        protected: "SELECT"
    },
    UFN_DOMAIN_BY_DOMAINNAME: {
        query: "SELECT * FROM ufn_domain_by_domainname($corpid, $orgid, $domainname)",
        module: "",
        protected: "SELECT"
    },
    UFN_USER_MESSAGE_OUTBOUND: {
        query: "SELECT * FROM ufn_user_message_outbound($corpid,$orgid,$startdate,$enddate,$offset,$communicationchannelid,$userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_SENTMESSAGES_BY_TEMPLATE: {
        query: "SELECT * FROM ufn_report_sentmessages_by_template($corpid,$orgid,$startdate,$enddate,$offset,$communicationchannelid, $userSid,$userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_DETAIL_SENTMESSAGES_BY_TEMPLATE: {
        query: "SELECT * FROM ufn_detail_sentmessages_by_template($corpid,$orgid,$startdate,$enddate,$offset,$messagetemplateid,$communicationchannelid,$usersid,$userid)",
        module: "",
        protected: "SELECT"
    },
    UPDATE_PINNED_MESSAGE: {
        query: "SELECT * FROM update_pinned_message($corpid, $orgid, $conversationid, $interactionid, $interactiontext, $operation)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_SEL_ATTACHMENT_HISTORY: {
        query: "SELECT * FROM ufn_conversation_sel_attachment_history($corpid, $orgid, $personid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_SEL_CLASSIFICATION_HISTORY: {
        query: "SELECT * FROM ufn_conversation_sel_classification_history($corpid, $orgid, $personid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_SEL_ORDER_HISTORY: {
        query: "SELECT * FROM ufn_conversation_sel_order_history($corpid, $orgid, $personid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_SEL_OPPORTUNITY_HISTORY: {
        query: "SELECT * FROM ufn_conversation_sel_opportunity_history($corpid, $orgid, $personid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_SEL_SS_HISTORY: {
        query: "SELECT * FROM ufn_conversation_sel_ss_history($corpid, $orgid, $personid)",
        module: "",
        protected: "SELECT"
    },
}