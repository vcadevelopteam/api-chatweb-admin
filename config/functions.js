module.exports = {
    QUERY_AUTHENTICATED: {
        query: "select us.pwdchangefirstlogin, org.description orgdesc, corp.description corpdesc, ous.corpid, ous.orgid, us.userid, us.usr, us.pwd, us.image, us.firstname, us.lastname, us.email, us.status, ous.redirect, role.description roledesc, COALESCE(cur.symbol, 'S/') currencysymbol, COALESCE(org.country, 'PE') countrycode from usr us inner join orguser ous on ous.userid = us.userid inner join org org on org.orgid = ous.orgid left join currency cur on cur.code = org.currency inner join corp corp on corp.corpid = ous.corpid inner join role role on role.roleid = ous.roleid where us.usr = $usr and ous.bydefault and ous.status <> 'ELIMINADO' limit 1",
        module: "",
        protected: false
    },
    QUERY_GET_PWD_BY_USERID: {
        query: "select pwd from usr where userid = $userid",
        module: "",
        protected: false
    },
    QUERY_AUTHENTICATED_BY_FACEBOOKID: {
        query: "select us.pwdchangefirstlogin, org.description orgdesc, corp.description corpdesc, ous.corpid, ous.orgid, us.userid, us.usr, us.pwd, us.firstname, us.image, us.lastname, us.email, us.status, ous.redirect, role.description roledesc, COALESCE(cur.symbol, 'S/') currencysymbol, COALESCE(org.country, 'PE') countrycode from usr us inner join orguser ous on ous.userid = us.userid inner join org org on org.orgid = ous.orgid left join currency cur on cur.code = org.currency inner join corp corp on corp.corpid = ous.corpid inner join role role on role.roleid = ous.roleid where us.facebookid = $facebookid and ous.bydefault and ous.status <> 'ELIMINADO'limit 1",
        module: "",
        protected: false
    },
    QUERY_AUTHENTICATED_BY_GOOGLEID: {
        query: "select us.pwdchangefirstlogin, org.description orgdesc, corp.description corpdesc, ous.corpid, ous.orgid, us.userid, us.usr, us.pwd, us.firstname, us.image, us.lastname, us.email, us.status, ous.redirect, role.description roledesc, COALESCE(cur.symbol, 'S/') currencysymbol, COALESCE(org.country, 'PE') countrycode from usr us inner join orguser ous on ous.userid = us.userid inner join org org on org.orgid = ous.orgid left join currency cur on cur.code = org.currency inner join corp corp on corp.corpid = ous.corpid inner join role role on role.roleid = ous.roleid where us.googleid = $googleid and ous.bydefault and ous.status <> 'ELIMINADO' limit 1",
        module: "",
        protected: false
    },
    UFN_CORP_ORG_SEL: {
        query: "SELECT * FROM ufn_corp_org_sel($corpid, $id, $username, $all)",
        module: "/extras/users",
        protected: "SELECT"
    },
    GET_CONTRACT: {
        query: 'SELECT * FROM paymentplan where "code" = $code',
        module: "",
        protected: "SELECT"
    },
    UFN_USER_SEL: {
        query: "SELECT * FROM ufn_user_sel($corpid, $orgid, $id, $username, $all)",
        module: "/extras/users",
        protected: "SELECT"
    },
    UFN_APPLICATION_SEL: {
        query: "SELECT * FROM ufn_application_sel($corpid, $orgid, $userid)",
        module: "",
        protected: ""
    },
    UFN_ORGUSER_SEL: {
        query: "SELECT * FROM ufn_orguser_sel($corpid, $orgid, $userid, $username, $all)",
        module: "/extras/users",
        protected: "SELECT"
    },
    UFN_ORGUSER_INS: {
        query: "SELECT * FROM ufn_orguser_ins($corpid, $orgid, $p_userid, $roleid, $usersupervisor, $bydefault, $labels, $groups, $channels, $status,$type, $defaultsort, $username, $operation, $redirect)",
        module: "/extras/users",
        protected: "INSERT"
    },
    UFN_USER_INS: {
        query: "SELECT * FROM ufn_user_ins($id, $usr, $doctype, $docnum, $password, $firstname, $lastname, $email, $pwdchangefirstlogin, $type, $status,$description, $username, $operation, $company, $twofactorauthentication, $registercode, $billinggroup, $image)",
        module: "/extras/users",
        protected: "INSERT"
    },
    UFN_COMMUNICATIONCHANNEL_LST: {
        query: "SELECT * FROM ufn_communicationchannel_lst($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_PROPERTY_SEL: {
        query: "SELECT * FROM ufn_property_sel($corpid, $propertyname, $description, $category, $level, $id, $username, $all, $offset)",
        module: "/extras/properties",
        protected: "SELECT"
    },
    UFN_DISTINCT_PROPERTY_SEL: {
        query: "SELECT * FROM ufn_distinct_property_sel($corpid, $category, $level)",
        module: "/extras/properties",
        protected: "SELECT"
    },
    UFN_USER_SUPERVISOR_LST: {
        query: "SELECT * FROM ufn_user_supervisor_lst($corpid, $orgid, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_APPS_DATA_SEL: {
        query: "SELECT * FROM UFN_APPS_DATA_SEL($roleid)",
        module: "",
        protected: "SELECT"
    },
    UFN_ROLE_LST: {
        query: "SELECT * FROM ufn_role_lst($corpid, $orgid, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_PROPERTY_INS: {
        query: "SELECT * FROM ufn_property_ins($corpid, $orgid, $communicationchannelid, $id, $propertyname, $propertyvalue, $description, $status, $type, $category, $domainname, $group, $level, $username, $operation)",
        module: "/extras/properties",
        protected: "SELECT"
    },
    UFN_CONVERSATION_QUEUE_USERGROUSEL: {
        query: "SELECT * FROM ufn_conversation_queue_usergrousel($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_GROUPCONFIGURATION_SEL: {
        query: "SELECT * FROM ufn_groupconfiguration_sel($corpid, $orgid, $id, $username, $all)",
        module: "/extras/groupconfig",
        protected: "SELECT"
    },
    UFN_GROUPCONFIGURATION_INS: {
        query: "SELECT * FROM ufn_groupconfiguration_ins($corpid, $orgid, $id, $operation, $domainid, $description, $type, $status, $username, $quantity, $validationtext)",
        module: "/extras/groupconfig",
        protected: "INSERT"
    },
    UFN_WHITELIST_SEL: {
        query: "SELECT * FROM ufn_whitelist_sel($corpid, $orgid, $username, $id, $all)",
        module: "/extras/whitelist",
        protected: "SELECT"
    },
    UFN_WHITELIST_INS: {
        query: "SELECT * FROM ufn_whitelist_ins($corpid,$orgid,$id,$operation,$documenttype,$documentnumber,$usergroup,$type,$status,$asesorname,$username)",
        module: "/extras/whitelist",
        protected: "INSERT"
    },
    UFN_INAPPROPRIATEWORDS_SEL: {
        query: "SELECT * FROM ufn_inappropriatewords_sel($corpid, $orgid,$id, $username)",
        module: "/extras/inappropriatewords",
        protected: "SELECT"
    },
    UFN_INAPPROPRIATEWORDS_INS: {
        query: "SELECT * FROM ufn_inappropriatewords_ins($id,$corpid, $orgid, $description,$status,$type,$username,$classification,$defaultanswer,$operation)",
        module: "/extras/inappropriatewords",
        protected: "INSERT"
    },
    UFN_INAPPROPRIATEWORDS_INS_ARRAY: {
        query: "SELECT * FROM ufn_inappropriatewords_ins_array($corpid, $orgid, $username, $table)",
        module: "/extras/inappropriatewords",
        protected: "INSERT"
    },
    UFN_PERSON_TOTALRECORDS: {
        query: "SELECT * FROM ufn_person_totalrecords($corpid, $orgid, $where, $startdate, $enddate, $offset, $userids, $channeltypes)",
        module: "",
        protected: "SELECT"
    },
    UFN_PERSON_SEL: {
        query: "SELECT  * FROM ufn_person_sel($corpid, $orgid, $username, $where, $order, $take, $skip, $startdate, $enddate, $offset, $userids, $channeltypes)",
        module: "/extras/person",
        protected: "SELECT"
    },
    UFN_PERSON_EXPORT: {
        query: "SELECT * FROM UFN_PERSON_EXPORT($corpid, $orgid, $where, $order, $startdate, $enddate, $offset)",
        module: "/extras/person",
        protected: "SELECT"
    },
    UFN_CONVERSATION_SEL_PERSON: {
        query: "select * from ufn_conversation_sel_person($personid, $take, $skip, $where, $order, $offset)",
        module: "/extras/person",
        protected: "SELECT"
    },
    UFN_PERSONCOMMUNICATIONCHANNEL_INS: {
        query: "SELECT * FROM ufn_personcommunicationchannel_ins($corpid, $orgid, $personid, $personcommunicationchannel, $personcommunicationchannelowner, $displayname, $type, $username, $operation, $status)",
        module: "/extras/person",
        protected: "INSERT"
    },
    UFN_PERSONCOMMUNICATIONCHANNEL_SEL: {
        query: "SELECT * FROM ufn_personcommunicationchannel_sel($corpid, $orgid, $personid,  $personcommunicationchannel, $username, $all)",
        module: "/extras/person",
        protected: "SELECT"
    },
    UFN_PERSONCOMMUNICATIONCHANNEL_UPDATE_LOCKED: {
        query: "SELECT * FROM ufn_personcommunicationchannel_update_locked($corpid, $orgid, $personid, $personcommunicationchannel, $username, $locked)",
        module: "/extras/person",
        protected: "INSERT"
    },
    UFN_PERSONREFERRER_SEL: {
        query: "SELECT * FROM ufn_personreferrer_sel($personid)",
        module: "/extras/person",
        protected: "SELECT"
    },
    UFN_PERSONADDINFO_SEL: {
        query: "SELECT * FROM ufn_personaddinfo_sel($personid)",
        module: "/extras/person",
        protected: "SELECT"
    },
    UFN_INTELLIGENTMODELS_SEL: {
        query: "SELECT * FROM ufn_intelligentmodels_sel($corpid,$orgid,$username,$id,$all)",
        module: "/extras/intelligentmodels",
        protected: "SELECT"
    },
    UFN_INTELLIGENTMODELS_INS: {
        query: "SELECT * FROM ufn_intelligentmodels_ins($corpid,$orgid,$id,$operation,$description,$endpoint ,$modelid ,$provider ,$apikey ,$type ,$status ,$username) ",
        module: "/extras/intelligentmodels",
        protected: "INSERT"
    },
    UFN_SLA_SEL: {
        query: "SELECT * FROM ufn_sla_sel($corpid ,$orgid ,$id ,$username ,$all)",
        module: "/extras/sla",
        protected: "SELECT"
    },
    UFN_SLA_INS: {
        query: "SELECT * FROM ufn_sla_ins( $corpid, $orgid, $id, $description, $type, $company, $communicationchannelid, $usergroup, $status, $totaltmo, $totaltmomin, $totaltmopercentmax, $totaltmopercentmin, $usertmo, $usertmomin, $usertmopercentmax, $usertmopercentmin, $tme, $tmemin, $tmepercentmax, $tmepercentmin, $usertme, $usertmemin, $usertmepercentmax, $usertmepercentmin, $productivitybyhour, $username, $operation)",
        module: "/extras/sla",
        protected: "INSERT"
    },
    UFN_REPORT_SEL: {
        query: "SELECT * FROM ufn_report_sel($corpid ,$orgid ,$reportname  ,$username ,$all)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_COLUMN_SEL: {
        query: "SELECT * FROM ufn_report_column_sel($function, $all)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_HOURS_SEL: {
        query: "SELECT * FROM ufn_report_hours_sel($all)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_INPUTRETRY_SEL: {
        query: "SELECT * FROM ufn_report_inputretry_sel($corpid ,$orgid, $take, $skip, $where, $order, $userid, $startdate, $enddate, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_INPUTRETRY_TOTALRECORDS: {
        query: "SELECT * FROM ufn_report_inputretry_totalrecords($corpid ,$orgid, $where, $userid, $startdate, $enddate, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_INPUTRETRY_EXPORT: {
        query: "SELECT * FROM ufn_report_inputretry_export($corpid ,$orgid, $where, $order, $userid, $startdate, $enddate, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_TIPIFICATION_SEL: {
        query: "SELECT * FROM ufn_report_tipification_sel($corpid ,$orgid, $take, $skip, $where, $order, $userid, $startdate, $enddate, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_TIPIFICATION_TOTALRECORDS: {
        query: "SELECT * FROM ufn_report_tipification_totalrecords($corpid ,$orgid, $where, $userid, $startdate, $enddate, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_TIPIFICATION_EXPORT: {
        query: "SELECT * FROM ufn_report_tipification_export($corpid ,$orgid, $where, $order, $userid, $startdate, $enddate, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_INTERACTION_SEL: {
        query: "WITH w1 AS (SELECT DISTINCT unnest(string_to_array(groups,',')) AS groups 		FROM orguser ous 		WHERE ous.corpid = $corpid 		AND ous.orgid = $orgid 		AND ous.userid = $userid 	) 	SELECT 		co.ticketnum numeroticket, 		to_char(co.startdate + $offset * INTERVAL '1hour', 'YYYY')::character varying anioticket, 		to_char(co.startdate + $offset * INTERVAL '1hour', 'MM')::character varying mesticket, 		to_char(co.startdate + $offset * INTERVAL '1hour', 'DD/MM/YYYY')::character varying fechaticket,pe.email email, 		to_char(co.startdate + $offset * INTERVAL '1hour', 'HH24:MI:SS')::character varying horaticket, 		inter.interactionid linea, 		to_char(inter.createdate + $offset * INTERVAL '1hour', 'DD/MM/YYYY')::character varying fechalinea, 		to_char(inter.createdate + $offset * INTERVAL '1hour', 'HH24:MI:SS')::character varying horalinea, 		REGEXP_REPLACE(pe.name, E'[\\n\\r\\t]+',' ','g')::character varying cliente, 		cc.description canal, 		concat(us.firstname,' ',us.lastname)::character varying asesor, 		inter.intent intencion, 		inter.interactiontype tipotexto, 		REGEXP_REPLACE(inter.interactiontext, E'[\\n\\r\\t]+',' ','g') texto, 		co.usergroup, 		pcc.displayname, 		pe.phone 	FROM conversation co 	LEFT JOIN orguser ous ON co.corpid = ous.corpid AND co.orgid = ous.orgid AND co.lastuserid = ous.userid 	LEFT JOIN communicationchannel cc on co.corpid = cc.corpid and co.orgid = cc.orgid and co.communicationchannelid = cc.communicationchannelid 	LEFT JOIN person pe on co.personid = pe.personid 	 	LEFT JOIN personcommunicationchannel pcc on co.corpid = pcc.corpid and co.orgid = pcc.orgid and co.personid = pcc.personid and co.personcommunicationchannel = pcc.personcommunicationchannel 	LEFT JOIN interaction inter ON co.conversationid = inter.conversationid 	LEFT JOIN orguser ous2 ON inter.corpid = ous2.corpid AND inter.orgid = ous2.orgid AND inter.userid = ous2.userid 	LEFT JOIN usr us on ous2.userid = us.userid 	WHERE co.corpid = $corpid 	AND co.orgid = $orgid 	AND CASE WHEN (SELECT(array_length(array_agg(groups), 1)) FROM w1) IS NOT NULL THEN (string_to_array(ous2.groups,',') && (SELECT array_agg(groups) FROM w1)) OR COALESCE(ous2.groups,'') = '' ELSE TRUE END 	AND inter.interactiontype <> 'LOG' ###WHERE### ###ORDER### LIMIT $take 	OFFSET $skip;",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_INTERACTION_TOTALRECORDS: {
        query: "WITH w1 AS (SELECT DISTINCT unnest(string_to_array(groups,',')) AS groups FROM orguser ous         WHERE ous.corpid = $corpid         AND ous.orgid = $orgid         AND ous.userid = $userid     ) SELECT         COUNT(*)  p_totalrecords   FROM conversation co     LEFT JOIN orguser ous ON co.corpid = ous.corpid AND co.orgid = ous.orgid AND co.lastuserid = ous.userid     LEFT JOIN communicationchannel cc on co.corpid = cc.corpid and co.orgid = cc.orgid and co.communicationchannelid = cc.communicationchannelid     LEFT JOIN person pe on co.personid = pe.personid     LEFT JOIN personcommunicationchannel pcc on co.corpid = pcc.corpid and co.orgid = pcc.orgid and co.personid = pcc.personid and co.personcommunicationchannel = pcc.personcommunicationchannel     LEFT JOIN interaction inter ON co.conversationid = inter.conversationid     LEFT JOIN orguser ous2 ON inter.corpid = ous2.corpid AND inter.orgid = ous2.orgid AND inter.userid = ous2.userid     LEFT JOIN usr us on ous2.userid = us.userid     WHERE co.corpid = $corpid     AND co.orgid = $orgid     AND CASE WHEN (SELECT(array_length(array_agg(groups), 1)) FROM w1) IS NOT NULL THEN (string_to_array(ous2.groups,',') && (SELECT array_agg(groups) FROM w1)) OR COALESCE(ous2.groups,'') = '' ELSE TRUE END     AND inter.interactiontype <> 'LOG'     ###WHERE###;",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_INTERACTION_EXPORT: {
        query: "WITH w1 AS ( SELECT DISTINCT unnest(string_to_array(groups,',')) AS groups FROM orguser ous WHERE ous.corpid = $corpid AND ous.orgid = $orgid AND ous.userid = $userid ) SELECT co.ticketnum numeroticket, to_char(co.startdate -5 * INTERVAL '1hour', 'YYYY') anioticket, to_char(co.startdate -5 * INTERVAL '1hour', 'MM') mesticket, to_char(co.startdate -5 * INTERVAL '1hour', 'DD/MM/YYYY') fechaticket, to_char(co.startdate -5 * INTERVAL '1hour', 'HH24:MI:SS') horaticket, inter.interactionid linea, to_char(inter.createdate -5 * INTERVAL '1hour', 'DD/MM/YYYY') fechalinea, to_char(inter.createdate -5 * INTERVAL '1hour', 'HH24:MI:SS') horalinea, pe.name cliente, co.personcommunicationchannel, cc.description canal, concat(us.firstname,' ',us.lastname) asesor, inter.intent intencion, inter.interactiontype tipotexto, inter.interactiontext texto, co.usergroup, pcc.displayname fullname, pe.phone telefono, pe.email FROM conversation co LEFT JOIN orguser ous ON co.corpid = ous.corpid AND co.orgid = ous.orgid AND co.lastuserid = ous.userid LEFT JOIN communicationchannel cc on co.corpid = cc.corpid and co.orgid = cc.orgid and co.communicationchannelid = cc.communicationchannelid LEFT JOIN person pe on co.personid = pe.personid LEFT JOIN personcommunicationchannel pcc on co.corpid = pcc.corpid and co.orgid = pcc.orgid and co.personid = pcc.personid and co. personcommunicationchannel = pcc.personcommunicationchannel LEFT JOIN interaction inter ON co.conversationid = inter.conversationid LEFT JOIN orguser ous2 ON inter.corpid = ous2.corpid AND inter.orgid = ous2.orgid AND inter.userid = ous2.userid LEFT JOIN usr us on ous2.userid = us.userid WHERE co.corpid = $corpid AND co.orgid = $orgid AND CASE WHEN (SELECT(array_length(array_agg(groups), 1)) FROM w1) IS NOT NULL THEN (string_to_array(ous2.groups,',') && (SELECT array_agg(groups) FROM w1)) OR COALESCE(ous2.groups,'') = '' ELSE TRUE END AND inter.interactiontype <> 'LOG' ###WHERE### ",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_PRODUCTIVITY_SEL: {
        query: "SELECT * FROM ufn_report_productivity_sel($corpid ,$orgid, $take, $skip, $where, $order, $userid, $startdate, $enddate, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_PRODUCTIVITY_TOTALRECORDS: {
        query: "SELECT * FROM ufn_report_productivity_totalrecords($corpid ,$orgid, $where, $userid, $startdate, $enddate, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_PRODUCTIVITY_EXPORT: {
        query: "SELECT * FROM ufn_report_productivity_export($corpid ,$orgid, $where, $order, $userid, $startdate, $enddate, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_USERPRODUCTIVITYHOURS_SEL: {
        query: "SELECT * FROM ufn_report_userproductivityhours_sel($corpid ,$orgid, $startdate, $enddate, $channel, $hours, $asesorid, $take, $skip, $where, $order, $userid, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_USERPRODUCTIVITYHOURS_TOTALRECORDS: {
        query: "SELECT * FROM ufn_report_userproductivityhours_totalrecords($corpid ,$orgid, $startdate, $enddate, $channel, $hours, $asesorid, $where, $userid, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_USERPRODUCTIVITYHOURS_EXPORT: {
        query: "SELECT * FROM ufn_report_userproductivityhours_export($corpid ,$orgid, $startdate, $enddate, $channel, $hours, $asesorid, $where, $order, $userid, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_USER_ASESORBYORGID_LST: {
        query: "SELECT * FROM ufn_user_asesorbyorgid_lst($corpid ,$orgid, $userid)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_USRNOTIFICATION_USRID_SEL: {
        query: "SELECT * FROM ufn_usrnotification_usrid_sel($corpid ,$orgid, $userid, $usrnotificationid, $all, $username)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_LOGINHISTORY_SEL: {
        query: "SELECT * FROM ufn_loginhistory_sel($corpid ,$orgid, $take, $skip, $where, $order, $startdate, $enddate, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_LOGINHISTORY_TOTALRECORDS: {
        query: "SELECT * FROM ufn_loginhistory_totalrecords($corpid ,$orgid, $where, $startdate, $enddate, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_LOGINHISTORY_EXPORT: {
        query: "SELECT * FROM ufn_loginhistory_export($corpid ,$orgid, $where, $order, $startdate, $enddate, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_USERPRODUCTIVITY_SEL: {
        query: "SELECT * FROM ufn_report_userproductivity_sel($corpid ,$orgid, $channel, $startdate, $enddate, $userstatus, $usergroup, $bot, $userid, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_EMOJI_ALL_SEL: {
        query: "select * from ufn_emoji_all_sel($corpid ,$orgid ,$userid ,$all);",
        module: "/extras/emojis",
        protected: "SELECT"
    },
    UFN_EMOJI_SEL: {
        query: "select orgid, favoritechannels, restrictedchannels from emoji where corpid = $corpid and emojidec = $emojidec and status <> 'ELIMINADO';",
        module: "/extras/emojis",
        protected: "SELECT"
    },
    UFN_EMOJI_INS: {
        query: "select * from ufn_emoji_ins($corpid, $orgid, $description, $emojichar, $emojidec, $emojihex, $categorydesc, $categoryorder, $communicationchannel, $favoritechannels, $restrictedchannels, $username, $favorite, $allchannels);",
        module: "/extras/emojis",
        protected: "SELECT"
    },
    UFN_CONVERSATIONGRID_SEL: {
        query: "SELECT * FROM ufn_conversationgrid_sel($corpid, $orgid, $take, $skip, $where, $order, $userid, $startdate, $enddate, $channel, $usergroup, $offset)",
        module: "/tickets",
        protected: "SELECT"
    },
    UFN_CONVERSATIONGRID_TOTALRECORDS: {
        query: "SELECT * FROM ufn_conversationgrid_totalrecords($corpid, $orgid, $where, $userid, $startdate, $enddate, $channel, $usergroup, $offset)",
        module: "/tickets",
        protected: "SELECT"
    },
    UFN_CONVERSATIONGRID_EXPORT: {
        query: "SELECT * FROM ufn_conversationgrid_export($corpid, $orgid, $where, $order, $userid, $startdate, $enddate, $channel, $usergroup, $offset)",
        module: "/tickets",
        protected: "SELECT"
    },
    UFN_COMMUNICATIONCHANNELID_LST_USRDELEGATE: {
        query: "SELECT * FROM ufn_communicationchannelid_lst_usrdelegate($corpid, $orgid, $userid, $communicationchannelid)",
        module: "/tickets",
        protected: "SELECT"
    },
    UFN_CONVERSATIONCLASSIFICATION_INS_MASSIVE: {
        query: "SELECT * FROM ufn_conversationclassification_ins_massive($conversationid, $classificationid, $username)",
        module: "/tickets",
        protected: "SELECT"
    },
    UFN_DOMAIN_SEL: {
        query: "SELECT * FROM ufn_domain_sel($corpid ,$orgid ,$domainname  ,$username ,$all)",
        module: "/extras/domains",
        protected: "SELECT"
    },
    UFN_DOMAIN_VALUES_SEL: {
        query: "SELECT * FROM ufn_domain_values_sel($corpid ,$orgid ,$domainname  ,$username ,$all)",
        module: "/extras/domains",
        protected: "SELECT"
    },
    UFN_DOMAIN_INS: {
        query: "SELECT * FROM ufn_domain_ins($id ,$corpid ,$orgid ,$domainname, $description, $type, $status  ,$username ,$operation )",
        module: "/extras/domains",
        protected: "INSERT"
    },
    UFN_DOMAIN_VALUES_INS: {
        query: "SELECT * FROM ufn_domain_value_ins($id ,$corpid ,$orgid ,$domainname  ,$description ,$domainvalue ,$domaindesc,$system,$status,$type ,$bydefault,$username,$operation)",
        module: "/extras/domains",
        protected: "INSERT"
    },
    UFN_CLASSIFICATION_SEL: {
        query: "SELECT * FROM ufn_classification_sel($corpid ,$orgid ,$id  ,$username ,$all)",
        module: "",
        protected: "SELECT"
    },
    UFN_QUICKREPLY_SEL: {
        query: "SELECT * FROM ufn_quickreply_sel($corpid ,$orgid ,$id  ,$username ,$all)",
        module: "/extras/quickreplies",
        protected: "SELECT"
    },
    UFN_CORP_SEL: {
        query: "SELECT * FROM ufn_corp_sel($corpid, $orgid, $id, $username, $all)",
        module: "/corporations",
        protected: "SELECT"
    },
    UFN_CORP_INS: {
        query: "SELECT * FROM ufn_corp_ins($id, $description, $status, $type, $username, $operation, $logo, $logotype)",
        module: "/corporations",
        protected: "INSERT"
    },
    UFN_ORG_SEL: {
        query: "SELECT * FROM ufn_org_sel($corpid ,$orgid ,$all)",
        module: "/extras/quickreplies",
        protected: "SELECT"
    },
    UFN_ORG_INS: {
        query: "SELECT * FROM ufn_org_ins($corpid,$id,$description,$status,$type,$username,$operation,$email,$password,$port,$host,$default_credentials,$ssl, $private_mail, $currency)",
        module: "/extras/quickreplies",
        protected: "INSERT"
    },
    UFN_QUICKREPLY_INS: {
        query: "SELECT * FROM ufn_quickreply_ins($corpid,$orgid,$id,$classificationid,$description,$quickreply,$status,$type,$username,$operation,$favorite)",
        module: "/extras/quickreplies",
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
        module: "",
        protected: "SELECT"
    },
    UFN_DOMAIN_LST_VALORES: {
        query: "SELECT * FROM ufn_domain_lst_valores($corpid,$orgid,$domainname)",
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
        module: "",
        protected: "SELECT"
    },
    UFN_USERTOKEN_SEL: {
        query: "SELECT * FROM ufn_usertoken_sel($corpid,$orgid,$userid, $token)",
        module: "",
        protected: "SELECT"
    },
    UFN_CLASSIFICATION_TREE_SEL: {
        query: "SELECT * FROM ufn_classification_tree_sel($corpid,$orgid,$classificationid,$type)",
        module: "",
        protected: "SELECT"
    },
    UFN_MESSAGETEMPLATE_SEL: {
        query: "SELECT * FROM ufn_messagetemplate_sel($corpid,$orgid,$id,$username, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_MESSAGETEMPLATE_INS: {
        query: "SELECT * FROM ufn_messagetemplate_ins($corpid,$orgid,$id,$description,$type,$status,$name,$namespace,$category,$language,$templatetype,$headerenabled,$headertype,$header,$body,$bodyobject,$footerenabled,$footer,$buttonsenabled,$buttons,$priority,$attachment,$username,$operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_CLASSIFICATION_SEL: {
        query: "SELECT * FROM ufn_classification_sel($corpid,$orgid,$id,$username, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_CLASSIFICATION_INS: {
        query: "SELECT * FROM ufn_classification_ins( $id, $corpid, $orgid, $description, $parent, $communicationchannel, $status, $type, $username, $operation, $tags,$title, $jobplan, $usergroup, $schedule)",
        module: "",
        protected: "INSERT"
    },
    UFN_CLASSIFICATION_LST_PARENT: {
        query: "SELECT * FROM ufn_classification_lst_parent($corpid,$orgid,$classificationid)",
        module: "",
        protected: "SELECT"
    },
    UFN_COMMUNICATIONCHANNEL_SEL: {
        query: "SELECT * FROM ufn_communicationchannel_sel($corpid, $orgid, $communicationchannelid, $personcommunicationchannel, $username, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_USERBYSUPERVISOR_SEL: {
        query: "SELECT * FROM ufn_userbysupervisor_sel($corpid, $orgid, $userid)",
        module: "", //supervisor and inbox
        protected: "SELECT"
    },
    UFN_CONVERSATION_SEL_TICKETSBYUSER: {
        query: "SELECT * FROM ufn_conversation_sel_ticketsbyuser($corpid, $orgid, $userid)",
        module: "", //messag einbox y supervisor admitir arrays
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
        module: "", //supervisor and inbox
        protected: "SELECT"
    },
    UFN_CONVERSATION_PERSON_SEL: {
        query: "SELECT * FROM ufn_conversation_person_sel($corpid, $orgid, $personid, $conversationid)",
        module: "", //supervisor and inbox
        protected: "SELECT"
    },
    UFN_CONVERSATION_SEL_TICKETSBYPERSON: {
        query: "SELECT * FROM ufn_conversation_sel_ticketsbyperson($corpid, $orgid, $personid, $conversationid)",
        module: "", //supervisor and inbox
        protected: "SELECT"
    },
    UFN_CONVERSATIONCLASSIFICATION_INS: {
        query: "SELECT * FROM ufn_conversationclassification_ins($conversationid, $classificationid, $username, $operation, $jobplan)",
        module: "", //supervisor and inbox
        protected: "INSERT"
    },
    UFN_CONVERSATION_REASSIGNTICKET: {
        query: "SELECT * FROM ufn_conversation_reassignticket($conversationid, $newuserid, $userid, $username, $usergroup, $comment, $isanswered)",
        module: "", //supervisor and inbox
        protected: "INSERT"
    },
    UFN_INTEGRATIONMANAGER_SEL: {
        query: "SELECT * FROM ufn_integrationmanager_sel($corpid,$orgid,$id,$username, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_INTEGRATIONMANAGER_INS: {
        query: "SELECT * FROM ufn_integrationmanager_ins($corpid,$orgid,$id,$description,$type,$status,$name,$method,$url,$authorization,$headers,$bodytype,$body,$parameters,$variables,$level,$fields,$apikey,$username,$operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_INTEGRATIONMANAGER_IMPORT: {
        query: "SELECT * FROM ufn_integrationmanager_importdata($corpid,$orgid,$id,$table)",
        module: "",
        protected: "INSERT"
    },
    UFN_INTEGRATIONMANAGER_DELETEDATA: {
        query: "SELECT * FROM ufn_integrationmanager_deletedata($corpid,$orgid,$id)",
        module: "",
        protected: "INSERT"
    },
    UFN_INTEGRATIONMANAGER_LST: {
        query: "SELECT * FROM ufn_integrationmanager_lst($corpid,$orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATION_REASSIGNTICKET_MASSIVE: {
        query: "SELECT * FROM ufn_conversation_reassignticket_massive($conversationid, $newuserid, $username, $comment)",
        module: "", //tickets
        protected: "SELECT"
    },
    UFN_COMMUNICATIONCHANNEL_INS: {
        query: "SELECT * FROM ufn_communicationchannel_ins2($corpid, $orgid, $id, $description, $type, $communicationchannelsite, $communicationchannelowner, $communicationchannelcontact, $communicationchanneltoken, $customicon, $coloricon, $status, $username, $operation, $botenabled, $botconfigurationid, $chatflowenabled, $schedule, $integrationid, $appintegrationid, $country, $channelparameters, $updintegration, $resolvelithium, $color, $icons, $other, $form, $apikey, $servicecredentials, $motive)",
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
    UFN_COMMUNICATIONCHANNELHOOK_INS: {
        query: "SELECT * FROM ufn_communicationchannelhook_ins($type, $servicedata, $site, $operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_COMMUNICATIONCHANNELHOOK_SEL: {
        query: "SELECT * FROM ufn_communicationchannelhook_sel($type, $site)",
        module: "",
        protected: "INSERT"
    },
    UFN_CHATFLOW_BLOCK_LST: {
        query: "SELECT * FROM ufn_chatflow_block_lst($corpid, $orgid, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CHATFLOW_BLOCK_SEL: {
        query: "SELECT * FROM ufn_chatflow_block_sel($corpid, $orgid, $chatblockid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CHATFLOW_BLOCK_INS: {
        query: "SELECT * FROM ufn_chatflow_block_ins($corpid, $orgid, $communicationchannelid, $username, $chatblockid, $title, $description, $defaultgroupid, $defaultblockid, $firstblockid, $aiblockid, $blockgroup, $variablecustom, $status, $color, $icontype, $tag, $chatblockversionid)",
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
        query: "SELECT * FROM ufn_tablevariable_sel()",
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
        query: "SELECT * FROM ufn_domain_value_import($corpid,$orgid,$domainname,$description,$domainvalue,$domaindesc,$system,$status,$type,$bydefault,$username)",
        module: "",
        protected: "INSERT"
    },
    UFN_INPUTVALIDATION_IMPORT: {
        query: "SELECT * FROM ufn_inputvalidation_import($corpid,$description,$inputvalue,$username)",
        module: "",
        protected: "INSERT"
    },
    UFN_CONVERSATION_LST_USRDELEGATE2: {
        query: "SELECT * FROM ufn_conversation_lst_usrdelegate2($corpid, $orgid, $userid)",
        module: "",
        protected: "SELECT"
    },

    UFN_CONVERSATIONCLASSIFICATIONLIST_LEVEL1_SEL: {
        query: "SELECT * FROM ufn_conversationclassificationlist_level1_sel($corpid, $orgid, $type)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATIONCLASSIFICATIONLIST_LEVEL2_SEL: {
        query: "SELECT * FROM ufn_conversationclassificationlist_level2_sel($corpid, $orgid, $type, $classificationid)",
        module: "",
        protected: "SELECT"
    },
    UFN_VARIABLECONFIGURATION_LST: {
        query: "SELECT * FROM ufn_tablevariableconfiguration_lst($corpid, $orgid, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_VARIABLECONFIGURATION_SEL: {
        query: "SELECT * FROM ufn_tablevariableconfiguration_sel($corpid, $orgid, $chatblockid, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_VARIABLECONFIGURATION_INS: {
        query: "SELECT * FROM ufn_tablevariableconfiguration_ins($corpid, $orgid, $chatblockid, $variable, $description, $fontcolor, $fontbold, $priority, $visible, $userid)",
        module: "",
        protected: "INSERT"
    },
    UFN_VARIABLECONFIGURATION_INS_ARRAY: {
        query: "SELECT * FROM ufn_tablevariableconfiguration_ins_array($corpid, $orgid, $username, $table)",
        module: "",
        protected: "INSERT"
    },
    UFN_TABLEVARIABLECONFIGURATIONBYCHANNEL_SEL: {
        query: "select * from ufn_tablevariableconfigurationbychannel_sel($corpid, $orgid, $communicationchannelid, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CAMPAIGN_LST: {
        query: "SELECT * FROM ufn_campaign_lst($corpid, $orgid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_CAMPAIGN_SEL: {
        query: "SELECT * FROM ufn_campaign_sel($corpid, $orgid, $id, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_CAMPAIGN_INS: {
        query: "SELECT * FROM ufn_campaign_ins($corpid, $orgid, $id, $communicationchannelid, $usergroup, $type, $status, $title, $description, $subject, $message, $startdate, $enddate, $repeatable, $frecuency, $messagetemplateid, $messagetemplatename, $messagetemplatenamespace, $messagetemplateheader, $messagetemplatebuttons, $executiontype, $batchjson, $fields, $username, $operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_CAMPAIGN_DEL: {
        query: "SELECT * FROM ufn_campaign_del($corpid, $orgid, $id, $status, $username, $operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_CAMPAIGN_START: {
        query: "SELECT * FROM ufn_campaign_start($corpid, $orgid, $id, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_CAMPAIGN_STATUS: {
        query: "SELECT * FROM ufn_campaign_status($corpid, $orgid, $id)",
        module: "",
        protected: "SELECT"
    },
    UFN_USER_GROUPS_SEL: {
        query: "SELECT * FROM ufn_user_groups_sel($corpid, $orgid, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CAMPAIGNMEMBER_SEL: {
        query: "SELECT * FROM ufn_campaignmember_sel($corpid, $orgid, $campaignid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CAMPAIGNMEMBER_INS: {
        query: "SELECT * FROM ufn_campaignmember_ins($corpid, $orgid, $id, $personid, $personcommunicationchannel, $personcommunicationchannelowner, $type, $displayname, $status, $operation, $campaignid, $field1, $field2, $field3, $field4, $field5, $field6, $field7, $field8, $field9, $field10, $field11, $field12, $field13, $field14, $field15, $batchindex)",
        module: "",
        protected: "INSERT"
    },
    UFN_BLACKLIST_INS: {
        query: "SELECT * FROM ufn_blacklist_ins($corpid, $orgid, $id, $description, $type, $status, $phone, $username, $operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_BLACKLIST_INS_ARRAY: {
        query: "SELECT * FROM ufn_blacklist_ins_array($corpid, $orgid, $username, $table)",
        module: "",
        protected: "INSERT"
    },
    UFN_BLACKLIST_SEL: {
        query: "SELECT * FROM ufn_blacklist_sel($corpid, $orgid, $where, $order, $take, $skip, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_BLACKLIST_TOTALRECORDS: {
        query: "SELECT * FROM ufn_blacklist_totalrecords($corpid, $orgid, $where, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_BLACKLIST_EXPORT: {
        query: "SELECT * FROM ufn_blacklist_export($corpid, $orgid, $where, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORTTEMPLATE_SEL: {
        query: "SELECT * FROM ufn_reporttemplate_sel($corpid, $orgid, $reporttemplateid, $username, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORTTEMPLATE_INS: {
        query: "select * from ufn_reporttemplate_ins($id, $corpid, $orgid, $description, $status, $type, $columnjson, $filterjson, $communicationchannelid, $username, $operation)",
        module: "",
        protected: "SELECT"
    },
    UFN_CREATEZYXMEACCOUNT_INS: {
        query: "SELECT * FROM ufn_createzyxmeaccount_ins($firstname, $lastname, $username, $password, $email, $doctype, $docnumber, $phone, $facebookid, $googleid, $join_reason, $rolecompany, $companysize, $organizationname, $paymentplanid, $currency, $country)",
        module: "",
        protected: "INSERT"
    },
    UFN_CAMPAIGNREPORT_SEL: {
        query: "SELECT * FROM ufn_campaign_report_sel($corpid, $orgid, $where, $order, $skip, $take, $username, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_CAMPAIGNREPORT_TOTALRECORDS: {
        query: "SELECT * FROM ufn_campaign_report_totalrecords($corpid, $orgid, $where, $username, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_CAMPAIGNREPORT_EXPORT: {
        query: "SELECT * FROM ufn_campaign_report_export($corpid, $orgid, $table, $username, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_CAMPAIGNREPORT_PROACTIVE_EXPORT: {
        query: "SELECT * FROM ufn_campaign_report_proactive_export($corpid, $orgid, $table, $username, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_CHATFLOW_TAG_SEL: {
        query: "select * from UFN_CHATFLOW_TAG_SEL($corpid, $orgid)",
        module: "",
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
        module: "",
        protected: "SELECT"
    },
    UFN_INTELLIGENTMODELS_LST: {
        query: "select * from ufn_intelligentmodels_lst($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_COMMUNICATIONCHANNELBYORG_LST: {
        query: "select * from ufn_communicationchannelbyorg_lst($orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_INTELLIGENTMODELSCONFIGURATION_INS: {
        query: "SELECT * FROM ufn_intelligentmodelsconfiguration_ins($corpid, $orgid, $communicationchannelid, $username, $intelligentmodelsconfigurationid, $operation, $description, $type, $status, $color, $icontype, $parameters)",
        module: "",
        protected: "INSERT"
    },
    UFN_CONVERSATION_SEL_PERSON_TOTALRECORDS: {
        query: "SELECT * FROM ufn_conversation_sel_person_totalrecords($personid, $where)",
        module: "",
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
    UFN_DASHBOARD_GERENCIAL_TMO_GENERAL_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_tmo_general_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$level,$closedby,$min,$max,$target,$skipdown,$skipup,$bd,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },

    UFN_DASHBOARD_GERENCIAL_DATA_TMO_GENERAL_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_data_tmo_general_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$level,$closedby,$min,$max,$target,$skipdown,$skipup,$bd,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_TME_GENERAL_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_tme_general_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$level,$closedby,$min,$max,$target,$skipdown,$skipup,$bd,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_SUMMARY_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_summary_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$userid,$offset )",
        module: "",
        protected: "SELECT"
    },
    UFN_DATA_DASHBOARD_GERENCIAL_SUMMARY_SEL: {
        query: "SELECT * FROM ufn_data_dashboard_gerencial_summary_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$userid,$offset )",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_ENCUESTA_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_encuesta_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$closedby ,$userid,$offset )",
        module: "",
        protected: "SELECT"
    },
    UFN_DATA_DASHBOARD_GERENCIAL_ENCUESTA_SEL: {
        query: "SELECT * FROM ufn_data_dashboard_gerencial_encuesta_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$closedby ,$userid,$offset )",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_CONVERSATION_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_conversation_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company ,$userid,$offset )",
        module: "",
        protected: "SELECT"
    },
    UFN_DATA_DASHBOARD_GERENCIAL_CONVERSATION_SEL: {
        query: "SELECT * FROM ufn_data_dashboard_gerencial_conversation_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company ,$userid,$offset )",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_INTERACTION_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_interaction_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company ,$userid,$offset )",
        module: "",
        protected: "SELECT"
    },
    UFN_DATA_DASHBOARD_GERENCIAL_INTERACTION_SEL: {
        query: "SELECT * FROM ufn_data_dashboard_gerencial_interaction_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company ,$userid,$offset )",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_ETIQUETAS_SEL : {
        query: "SELECT * FROM ufn_dashboard_gerencial_etiquetas_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$limit ,$userid,$offset )",
        module: "",
        protected: "SELECT"
    },
    UFN_DATA_DASHBOARD_GERENCIAL_ETIQUETAS_SEL: {
        query: "SELECT * FROM ufn_data_dashboard_gerencial_etiquetas_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$limit ,$userid,$offset )",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_ASESORESCONECTADOSBAR_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_asesoresconectadosbar_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company ,$userid,$offset )",
        module: "",
        protected: "SELECT"
    },
    UFN_DATA_DASHBOARD_GERENCIAL_ASESORESCONECTADOSBAR_SEL  : {
        query: "SELECT * FROM ufn_data_dashboard_gerencial_asesoresconectadosbar_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company ,$userid,$offset )",
        module: "",
        protected: "SELECT"
    },
    UFN_COUNT_CONFIGURATION  : {
        query: "SELECT * FROM ufn_count_configuration($corpid, $orgid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_PROPERTY_SELBYNAME: {
        query: "SELECT * FROM ufn_property_selbyname($corpid, $orgid, $propertyname)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_PUSH_HSMCATEGORYRANK_SEL: {
        query: "SELECT * FROM ufn_dashboard_push_hsmcategoryrank_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$category,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_PUSH_SUMMARY_SEL: {
        query: "SELECT * FROM ufn_dashboard_push_summary_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$category,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_PUSH_HSMRANK_SEL: {
        query: "SELECT * FROM ufn_dashboard_push_hsmrank_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$category,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_PUSH_MENSAJEXDIA_SEL: {
        query: "SELECT * FROM ufn_dashboard_push_mensajexdia_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$category,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_USER_SUPERVISORBYORGID_LST: {
        query: "SELECT * FROM ufn_user_supervisorbyorgid_lst($corpid,$orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_LABEL_LST: {
        query: "SELECT * FROM ufn_label_lst($corpid,$orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_GET_TOKEN_LOGGED_MOVIL  : {
        query: "SELECT * FROM ufn_get_token_logged_movil($userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_SUMMARY_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_summary_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$skipdowntmo,$skipuptmo,$skipdowntme,$skipuptme,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DATA_DASHBOARD_OPERATIVO_SUMMARY_SEL  : {
        query: "SELECT * FROM ufn_data_dashboard_operativo_summary_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$skipdowntmo,$skipuptmo,$skipdowntme,$skipuptme,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_PRODXHORA_SEL  : {
        query: "SELECT * FROM ufn_dashboard_operativo_prodxhora_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$level,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_PRODXHORADIST_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_prodxhoradist_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DATA_DASHBOARD_OPERATIVO_PRODXHORADIST_SEL: {
        query: "SELECT * FROM ufn_data_dashboard_operativo_prodxhoradist_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_TMO_GENERAL_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_tmo_general_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$level,$closedby,$min,$max,$target,$skipdown,$skipup,$bd,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DATA_DASHBOARD_OPERATIVO_TMO_GENERAL_SEL: {
        query: "SELECT * FROM ufn_data_dashboard_operativo_tmo_general_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$level,$closedby,$min,$max,$target,$skipdown,$skipup,$bd,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_TME_GENERAL_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_tme_general_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$level,$closedby,$min,$max,$target,$skipdown,$skipup,$bd,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DATA_DASHBOARD_OPERATIVO_TME_GENERAL_SEL: {
        query: "SELECT * FROM ufn_data_dashboard_operativo_tme_general_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$level,$closedby,$min,$max,$target,$skipdown,$skipup,$bd,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_ENCUESTA_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_encuesta_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$closedby,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DATA_DASHBOARD_OPERATIVO_ENCUESTA_SEL: {
        query: "SELECT * FROM ufn_data_dashboard_operativo_encuesta_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$closedby,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_USER_UPDATE: {
        query: "SELECT * FROM ufn_user_update($userid,$firstname,$lastname,$password,$image)",
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
        query: "SELECT * FROM ufn_conversation_sel_ticketsbyuser_filter($corpid, $orgid, $lastmessage, $start_createticket, $end_createticket, $channels, $conversationstatus, $displayname, $phone)",
        module: "",
        protected: "SELECT"
    },
    UFN_PERSON_INS: {
        query: "select * from ufn_person_ins( $id, $corpid, $orgid, $groups, $status, $type, $persontype, $personstatus, $phone, $email, $birthday, $alternativephone, $alternativeemail, $documenttype, $documentnumber, $firstname, $lastname, $sex, $gender, $civilstatus, $occupation, $educationlevel, $referringpersonid, $username, $operation)",
        module: "",
        protected: "SELECT"
    },
    UFN_LEAD_INS: {
        query: "select * from ufn_lead_ins($corpid,$orgid, $leadid, $description, $type, $status, $expected_revenue, $date_deadline, $tags, $personcommunicationchannel, $priority, $conversationid, $columnid, $column_uuid, $username, $index, $phone, $email, $userid, $phase, $operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_LEAD_PERSON_INS: {
        query: "select * from ufn_lead_person_ins($corpid, $orgid, $id, $description, $type, $status, $expected_revenue, $date_deadline, $tags, $personcommunicationchannel, $priority, $conversationid, $columnid, $username, $index, $firstname, $lastname, $email, $phone, $personid, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_LEADBYPERSONCOMMUNICATIONCHANNEL_SEL: {
        query: "select * from ufn_leadbypersoncommunicationchannel_sel($corpid, $orgid, $personid)",
        module: "",
        protected: "SELECT"
    },
    UFN_COLUMN_SEL: {
        query: "select * from ufn_column_sel($corpid, $orgid, $id, $lost, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_LEAD_SEL: {
        query: "select * from ufn_lead_sel($corpid, $orgid, $id, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_COLUMN_INS: {
        query: "select * from ufn_column_ins($corpid, $orgid, $id, $description, $type, $status, $edit, $username, $index, $operation, $delete_all)",
        module: "",
        protected: "INSERT"
    },
    UFN_UPDATE_LEADS: {
        query: "select * from ufn_update_leads($corpid, $orgid, $cards_startingcolumn, $cards_finalcolumn, $startingcolumn_uuid, $finalcolumn_uuid, $leadid)",
        module: "",
        protected: "INSERT"
    },
    UFN_UPDATE_COLUMNS: {
        query: "select * from ufn_update_columns($corpid, $orgid, $cards_uuid)",
        module: "",
        protected: "INSERT"
    },
    UFN_LEADNOTES_SEL: {
        query: "select * from ufn_leadnotes_sel($corpid,$orgid, $leadid, $leadnotesid, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_UPDATE_ACTIVE_USER_SEL: {
        query: "select * from ufn_update_active_user_sel($usr, $firstname)",
        module: "",
        protected: "SELECT"
    },
    UFN_PERSONWITHOUTDATE_SEL: {
        query: "select * from ufn_personwithoutdate_sel($corpid, $orgid, $username, $where, $order, $take, $skip, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_ADVISERS_SEL: {
        query: "select * from ufn_advisers_sel($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_PERSONWITHOUTDATE_TOTALRECORDS: {
        query: "select * from ufn_personwithoutdate_totalrecords($corpid, $orgid, $where)",
        module: "",
        protected: "SELECT"
    },
    UFN_PAYMENTPLAN_CHECK: {
        query: "SELECT * FROM ufn_paymentplan_check($corpid)",
        module: "",
        protected: "SELECT"
    },
    UFN_CURRENCY_SEL: {
        query: "SELECT code, description FROM currency",
        module: "",
        protected: "SELECT"
    },
    UFN_COUNTRY_SEL: {
        query: "SELECT code, description, currencycode FROM country",
        module: "",
        protected: "SELECT"
    },
    UFN_LEADACTIVITY_SEL: {
        query: "select * from ufn_leadactivity_sel($corpid,$orgid,$leadid,$leadactivityid,$all)",
        module: "",
        protected: "SELECT"
    },
    UFN_LEADACTIVITY_INS: {
        query: "select * from ufn_leadactivity_ins($corpid,$orgid,$leadid,$leadactivityid,$description,$duedate,$assignto,$type,$status,$username,$operation, $feedback)",
        module: "",
        protected: "INSERT"
    },
    UFN_LEADACTIVITYHISTORY_SEL: {
        query: "select * from ufn_leadactivityhistory_sel($corpid, $orgid, $leadid, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_HISTORYLEAD_INS: {
        query: "select * from ufn_historylead_ins($corpid, $orgid, $leadid, $historyleadid, $description, $type, $status, $username, $operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_UPDATE_LEAD_TAGS: {
        query: "select * from ufn_update_lead_tags($corpid, $orgid, $leadid, $tags, $history_description, $history_type, $history_status, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_LEADNOTES_SEL: {
        query: "select * from ufn_leadnotes_sel($corpid,$orgid,$leadid,$leadnotesid,$all)",
        module: "",
        protected: "SELECT"
    },
    UFN_LEADNOTES_INS: {
        query: "select * from ufn_leadnotes_ins($corpid,$orgid,$leadid,$leadnotesid,$description,$type,$status,$username,$media,$operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_LEADGRID_SEL: {
        query: "SELECT * FROM ufn_leadgrid_sel($corpid, $orgid, $take, $skip, $where, $order, $startdate, $enddate, $asesorid, $channel, $contact, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_LEADGRID_TOTALRECORDS: {
        query: "SELECT * FROM ufn_leadgrid_totalrecords($corpid, $orgid, $where, $startdate, $enddate, $asesorid, $channel, $contact, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_LEADGRID_EXPORT: {
        query: "SELECT * FROM ufn_leadgrid_export($corpid, $orgid, $where, $order, $startdate, $enddate, $asesorid, $channel, $contact, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_PAGE1_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_page1_sel($corpid, $orgid, $communicationchannel , $startdate , $enddate ,$closedby,$userid, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_DATE_DETAIL_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_date_detail_sel($corpid, $orgid, $communicationchannel, $startdate, $enddate, $closedby, $horanum,$userid, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_ATENCIONESXFECHA_TOTAL_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_atencionesxfecha_total_sel($corpid, $orgid, $communicationchannel , $startdate , $enddate ,$closedby, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_USER_ASESORBYORGID_LST: {
        query: "SELECT * FROM ufn_user_asesorbyorgid_lst($corpid, $orgid, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_PAGE3_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_page3_sel($corpid, $orgid, $communicationchannel , $startdate , $enddate ,$closedby, $company,$userid, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_ASESORESCONECTADOS_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_asesoresconectados_sel($corpid, $orgid, $communicationchannel , $startdate , $enddate , $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_RESUMEN_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_resumen_sel($corpid, $orgid, $communicationchannel , $startdate , $enddate ,$closedby,$userid, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_TIPIFICACION_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_tipificacion_sel($corpid, $orgid, $communicationchannel , $startdate , $enddate ,$closedby, $userid, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_USER_ASESORBYORGID_LST: {
        query: "SELECT * FROM ufn_user_asesorbyorgid_lst($corpid, $orgid, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_USERPASSWORD_UPDATE: {
        query: "SELECT * FROM ufn_userpassword_update($userid, $password)",
        module: "",
        protected: "INSERT"
    },
    UFN_LEADACTIVITY_DUEDATE_SEL: {
        query: "SELECT * FROM ufn_leadactivity_duedate_sel($corpid, $orgid, $userid);",
        module: "",
        protected: "INSERT"
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
        query: "INSERT INTO taskscheduler (corpid, orgid, tasktype, taskbody, repeatflag, repeatmode, repeatinterval, completed, datetimestart, datetimeend) values ($corpid, $orgid, $tasktype, $taskbody, $repeatflag, $repeatmode, $repeatinterval, $completed, NOW() - INTERVAL '5 hours', NOW())",
        module: "",
        protected: "INSERT"
    },
    QUERY_GET_MESSAGETEMPLATE: {
        query: "select messagetemplateid, header, body, priority, attachment from messagetemplate where corpid = $corpid and orgid = $orgid and messagetemplateid = $hsmtemplateid",
        module: "",
        protected: "INSERT"
    },
    UFN_BILLINGSUPPORT_INS: {
        query: "SELECT * FROM ufn_billingsupport_ins($year,$month,$plan,$id,$basicfee,$starttime,$finishtime,$description,$status,$type,$username,$operation )",
        module: "",
        protected: "INSERT"
    },
    UFN_BILLINGSUPPORT_SEL: {
        query: "SELECT * FROM ufn_billingsupport_sel($year,$month,$plan)",
        module: "",
        protected: "SELECT"
    },
    UFN_SUPPORTPLAN_SEL: {
        query: "SELECT * FROM ufn_supportplan_sel()",
        module: "",
        protected: "SELECT"
    },
    UFN_PAYMENTPLAN_SEL: {
        query: "SELECT * FROM ufn_paymentplan_sel($code,$all)",
        module: "",
        protected: "SELECT"
    },
    UFN_BILLINGCONFIGURATION_INS: {
        query: "SELECT * FROM ufn_billingconfiguration_ins($year,$month,$plan,$id,$basicfee,$userfreequantity,$useradditionalfee,$channelfreequantity,$channelwhatsappfee,$channelotherfee,$clientfreequantity$clientadditionalfee,$allowhsm,$hsmfee,$description,$status,$type,$username,$operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_BILLINGCONFIGURATION_SEL: {
        query: "SELECT * FROM ufn_billingconfiguration_sel($year, $month, $plan)",
        module: "",
        protected: "SELECT"
    },
    UFN_BILLINGCONVERSATION_INS: {
        query: "SELECT * FROM ufn_billingconversation_ins($year,$month,$countrycode,$id,$companystartfee,$clientstartfee,$c250000,$c750000,$c2000000,$c3000000,$c4000000,$c5000000,$c10000000,$c25000000,$description,$status,$type,$username,$operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_BILLINGCONVERSATION_SEL: {
        query: "SELECT * FROM ufn_billingconversation_sel($year, $month, $countrycode)",
        module: "",
        protected: "SELECT"
    },
    UFN_BILLINGPERIOD_SEL: {
        query: "SELECT * FROM ufn_billingperiod_sel($corpid, $orgid, $year, $month, $billingplan, $supportplan, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_BILLINGPERIOD_NEWORG: {
        query: "SELECT * FROM ufn_billingperiod_neworg($corpid, $orgid, $year, $month, $billingplan, $supportplan)",
        module: "",
        protected: "INSERT"
    },
    UFN_BILLINGPERIOD_NEWMONTH: {
        query: "SELECT * FROM ufn_billingperiod_newmonth($corpid, $orgid, $year, $month)",
        module: "",
        protected: "INSERT"
    },
    UFN_BILLINGPERIOD_UPD: {
        query: "SELECT * FROM ufn_billingperiod_upd($corpid, $orgid, $year, $month, $billingplan, $supportplan, $basicfee, $userfreequantity, $useradditionalfee, $channelfreequantity, $channelwhatsappfee, $channelotherfee, $clientfreequantity, $clientadditionalfee, $supportbasicfee, $additionalservicename1, $additionalservicefee1, $additionalservicename2, $additionalservicefee2, $additionalservicename3, $additionalservicefee3, $force)",
        module: "",
        protected: "INSERT"
    },
    UFN_BILLINGPERIOD_CALC: {
        query: "SELECT * FROM ufn_billingperiod_calc($corpid, $orgid, $year, $month, $force)",
        module: "",
        protected: "INSERT"
    },
    UFN_ORG_LIST: {
        query: "SELECT * FROM ufn_org_lst($corpid, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_BILLINGPERIODHSM_SEL: {
        query: "SELECT * FROM ufn_billingperiodhsm_sel($corpid, $orgid, $year, $month, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_BILLINGPERIODHSM_NEWORG: {
        query: "SELECT * FROM ufn_billingperiodhsm_neworg($corpid, $orgid, $year, $month, $billingplan)",
        module: "",
        protected: "INSERT"
    },
    UFN_BILLINGPERIODHSM_NEWMONTH: {
        query: "SELECT * FROM ufn_billingperiodhsm_newmonth($corpid, $orgid, $year, $month)",
        module: "",
        protected: "INSERT"
    },
    UFN_BILLINGPERIODHSM_UPD: {
        query: "SELECT * FROM ufn_billingperiodhsm_upd($corpid, $orgid, $year, $month, $hsmutilityfee, $force)",
        module: "",
        protected: "INSERT"
    },
    UFN_BILLINGPERIODHSM_CALC: {
        query: "SELECT * FROM ufn_billingperiodhsm_calc($corpid, $orgid, $year, $month, $force)",
        module: "",
        protected: "INSERT"
    },
    UFN_BILLINGPERIOD_SUMMARYORG: {
        query: "SELECT * FROM ufn_billingperiod_summaryorg($corpid, $orgid, $year, $month, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_BILLINGPERIOD_SUMMARYCORP: {
        query: "SELECT * FROM ufn_billingperiod_summarycorp($corpid, $year, $month, $userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_BILLING_REPORT_PERSON: {
        query: "SELECT * FROM ufn_billing_report_person($corpid, $orgid, $year, $month)",
        module: "",
        protected: "SELECT"
    },
    UFN_BILLING_REPORT_USER: {
        query: "SELECT * FROM ufn_billing_report_user($corpid, $orgid, $year, $month)",
        module: "",
        protected: "SELECT"
    },
    QUERY_SEL_PROPERTY_ON_LOGIN: {
        query: "SELECT propertyname, propertyvalue FROM property p WHERE p.corpid = :corpid AND p.orgid = :orgid AND p.propertyname IN (:propertynames) and p.status = 'ACTIVO';",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARDTEMPLATE_SEL: {
        query: "SELECT * FROM ufn_dashboardtemplate_sel($corpid, $orgid, $id, $all);",
        module: "",
        protected: "INSERT"
    },
    UFN_DASHBOARDTEMPLATE_INS: {
        query: "SELECT * FROM ufn_dashboardtemplate_ins($id, $corpid, $orgid, $description, $status, $type, $detailjson, $layoutjson, $username, $operation);",
        module: "",
        protected: "INSERT"
    },
    UFN_HSMHISTORY_LST: {
        query: "SELECT * FROM ufn_hsmhistory_lst($corpid, $orgid, $startdate, $enddate, $offset);",
        module: "",
        protected: "INSERT"
    },
    UFN_HSMHISTORY_REPORT: {
        query: "SELECT * FROM ufn_hsmhistory_report($corpid, $orgid, $campaignname, $date, $offset);",
        module: "",
        protected: "SELECT"
    },
    UFN_INPUTVALIDATION_SEL: {
        query: "SELECT * FROM ufn_inputvalidation_sel($corpid, $id, $username);",
        module: "",
        protected: "SELECT"
    },
    UFN_INPUTVALIDATION_INS: {
        query: "SELECT * FROM ufn_inputvalidation_ins($corpid, $id, $operation, $description, $inputvalue, $type, $status, $username);",
        module: "",
        protected: "INSERT"
    },
}