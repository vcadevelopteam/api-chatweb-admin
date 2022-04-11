module.exports = {
    QUERY_AUTHENTICATED: {
        query: "select us.pwdchangefirstlogin, org.description orgdesc, corp.description corpdesc, ous.corpid, ous.orgid, us.userid, us.usr, us.pwd, us.image, us.firstname, us.lastname, us.email, us.status, ous.redirect,pp.plan, role.description roledesc, COALESCE(cur.symbol, 'S/') currencysymbol, COALESCE(org.country, 'PE') countrycode, corp.paymentmethod from usr us inner join orguser ous on ous.userid = us.userid inner join org org on org.orgid = ous.orgid left join currency cur on cur.code = org.currency inner join corp corp on corp.corpid = ous.corpid LEFT JOIN paymentplan pp ON pp.paymentplanid = corp.paymentplanid inner join role role on role.roleid = ous.roleid where us.usr = $usr and ous.bydefault and ous.status <> 'ELIMINADO' limit 1",
        module: "",
        protected: false
    },
    QUERY_GET_PWD_BY_USERID: {
        query: "select pwd from usr where userid = $userid",
        module: "",
        protected: false
    },
    QUERY_AUTHENTICATED_BY_FACEBOOKID: {
        query: "select us.pwdchangefirstlogin, org.description orgdesc, corp.description corpdesc, ous.corpid, ous.orgid, us.userid, us.usr, us.pwd, us.firstname, us.image, us.lastname, us.email, us.status, ous.redirect, pp.plan, role.description roledesc, COALESCE(cur.symbol, 'S/') currencysymbol, COALESCE(org.country, 'PE') countrycode, corp.paymentmethod from usr us inner join orguser ous on ous.userid = us.userid inner join org org on org.orgid = ous.orgid left join currency cur on cur.code = org.currency inner join corp corp on corp.corpid = ous.corpid LEFT JOIN paymentplan pp ON pp.paymentplanid = corp.paymentplanid inner join role role on role.roleid = ous.roleid where us.facebookid = $facebookid and ous.bydefault and ous.status <> 'ELIMINADO'limit 1",
        module: "",
        protected: false
    },
    QUERY_AUTHENTICATED_BY_GOOGLEID: {
        query: "select us.pwdchangefirstlogin, org.description orgdesc, corp.description corpdesc, ous.corpid, ous.orgid, us.userid, us.usr, us.pwd, us.firstname, us.image, us.lastname, us.email, us.status, ous.redirect, pp.plan, role.description roledesc, COALESCE(cur.symbol, 'S/') currencysymbol, COALESCE(org.country, 'PE') countrycode, corp.paymentmethod from usr us inner join orguser ous on ous.userid = us.userid inner join org org on org.orgid = ous.orgid left join currency cur on cur.code = org.currency inner join corp corp on corp.corpid = ous.corpid LEFT JOIN paymentplan pp ON pp.paymentplanid = corp.paymentplanid inner join role role on role.roleid = ous.roleid where us.googleid = $googleid and ous.bydefault and ous.status <> 'ELIMINADO' limit 1",
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
        query: "SELECT * FROM ufn_user_ins($corpid, $orgid, $id, $usr, $doctype, $docnum, $password, $firstname, $lastname, $email, $pwdchangefirstlogin, $type, $status,$description, $username, $operation, $company, $twofactorauthentication, $registercode, $billinggroup, $image)",
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
    UFN_INAPPROPRIATEWORDS_LST: {
        query: "SELECT * FROM ufn_inappropriatewords_lst($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_INAPPROPRIATEWORDS_SEL: {
        query: "SELECT * FROM ufn_inappropriatewords_sel($corpid, $orgid,$id, $username)",
        module: "",
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
        query: "SELECT * FROM UFN_PERSON_EXPORT($corpid, $orgid, $where, $order, $startdate, $enddate, $offset, $userids, $personcommunicationchannels )",
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
    UFN_PERSONCOMMUNICATIONCHANNEL_UPDATE_LOCKED_ARRAY: {
        query: "SELECT * FROM ufn_personcommunicationchannel_update_locked_array($corpid, $orgid, $username, $table)",
        module: "",
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
    UFN_REPORT_INPUTRETRY_GRAPHIC: {
        query: "SELECT * FROM ufn_report_inputretry_graphic($corpid ,$orgid, $where, $order, $userid, $startdate, $enddate, $column, $summarization, $offset)",
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
    UFN_REPORT_TIPIFICATION_GRAPHIC: {
        query: "SELECT * FROM ufn_report_tipification_graphic($corpid ,$orgid, $where, $order, $userid, $startdate, $enddate, $column, $summarization, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_INTERACTION_SEL: {
        query: "SELECT * FROM ufn_report_interaction_sel($corpid ,$orgid, $take, $skip, $where, $order, $userid, $startdate, $enddate, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_INTERACTION_TOTALRECORDS: {
        query: "SELECT * FROM ufn_report_interaction_totalrecords($corpid ,$orgid, $where, $userid, $startdate, $enddate, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_INTERACTION_EXPORT: {
        query: "SELECT * FROM ufn_report_interaction_export($corpid ,$orgid, $where, $order, $userid, $startdate, $enddate, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_INTERACTION_GRAPHIC: {
        query: "SELECT * FROM ufn_report_interaction_graphic($corpid ,$orgid, $where, $order, $userid, $startdate, $enddate, $column, $summarization, $offset)",
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
    UFN_REPORT_PRODUCTIVITY_GRAPHIC: {
        query: "SELECT * FROM ufn_report_productivity_graphic($corpid ,$orgid, $where, $order, $userid, $startdate, $enddate, $column, $summarization, $offset)",
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
    UFN_REPORT_USERPRODUCTIVITYHOURS_GRAPHIC: {
        query: "SELECT * FROM ufn_report_userproductivityhours_graphic($corpid ,$orgid, $startdate, $enddate, $channel, $hours, $asesorid, $where, $order, $userid, $column, $summarization, $offset)",
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
    UFN_LOGINHISTORY_GRAPHIC: {
        query: "SELECT * FROM ufn_loginhistory_graphic($corpid ,$orgid, $where, $order, $startdate, $enddate, $column, $summarization, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_USERPRODUCTIVITY_SEL: {
        query: "SELECT * FROM ufn_report_userproductivity_sel($corpid ,$orgid, $channel, $startdate, $enddate, $userstatus, $usergroup, $bot, $userid, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_REPORT_USERPRODUCTIVITY_GRAPHIC: {
        query: "SELECT * FROM ufn_report_userproductivity_graphic($corpid ,$orgid, $channel, $startdate, $enddate, $userstatus, $usergroup, $bot, $userid, $column, $summarization, $offset)",
        module: "/reports",
        protected: "SELECT"
    },
    UFN_EMOJI_ALL_SEL: {
        query: "select * from ufn_emoji_all_sel($corpid ,$orgid ,$userid ,$all);",
        module: "",
        protected: "SELECT"
    },
    UFN_EMOJI_SEL: {
        query: "select orgid, favoritechannels, restrictedchannels from emoji where corpid = $corpid and emojidec = $emojidec and status <> 'ELIMINADO';",
        module: "/extras/emojis",
        protected: "SELECT"
    },
    UFN_EMOJI_INS: {
        query: "select * from ufn_emoji_ins($corpid, $orgid, $description, $emojichar, $emojidec, $emojihex, $categorydesc, $categoryorder, $communicationchannel, $favoritechannels, $restrictedchannels, $favorite, $restricted, $username);",
        module: "/extras/emojis",
        protected: "SELECT"
    },
    UFN_CONVERSATIONGRID_SEL: {
        query: "SELECT * FROM ufn_conversationgrid_sel($corpid, $orgid, $take, $skip, $where, $order, $userid, $startdate, $enddate, $channel, $usergroup, $lastuserid, $campaignid, $offset)",
        module: "/tickets",
        protected: "SELECT"
    },
    UFN_CONVERSATIONGRID_TOTALRECORDS: {
        query: "SELECT * FROM ufn_conversationgrid_totalrecords($corpid, $orgid, $where, $userid, $startdate, $enddate, $channel, $usergroup, $lastuserid, $campaignid, $offset)",
        module: "/tickets",
        protected: "SELECT"
    },
    UFN_CONVERSATIONGRID_EXPORT: {
        query: "SELECT * FROM ufn_conversationgrid_export($corpid, $orgid, $where, $order, $userid, $startdate, $enddate, $channel, $usergroup, $lastuserid, $campaignid, $offset)",
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
        module: "",
        protected: "SELECT"
    },
    UFN_CORP_SEL: {
        query: "SELECT * FROM ufn_corp_sel($corpid, $orgid, $id, $username, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_CORP_INS: {
        query: "SELECT * FROM ufn_corp_ins($id, $description, $status, $type, $username, $operation, $logo, $logotype, $companysize, $paymentplanid, $doctype, $docnum, $businessname, $fiscaladdress, $sunatcountry, $contactemail, $contact, $autosendinvoice, $billbyorg, $credittype, $paymentmethod, $automaticpayment)",
        module: "/corporations",
        protected: "INSERT"
    },
    UFN_ORG_SEL: {
        query: "SELECT * FROM ufn_org_sel($corpid ,$orgid ,$all)",
        module: "",
        protected: "SELECT"
    },
    UFN_BUSINESSDOCTYPE_SEL: {
        query: "SELECT * FROM ufn_businessdoctype_sel()",
        module: "",
        protected: "SELECT"
    },
    UFN_ORG_INS: {
        query: "SELECT * FROM ufn_org_ins($corpid,$id,$description,$status,$type,$username,$operation,$email,$password,$port,$host,$default_credentials,$ssl, $private_mail, $currency,$country, $timezoneoffset, $timezone, $doctype, $docnum, $businessname, $fiscaladdress, $sunatcountry, $contactemail, $contact, $autosendinvoice, $iconbot, $iconadvisor, $iconclient, $credittype, $automaticpayment)",
        module: "",
        protected: "INSERT"
    },
    UFN_QUICKREPLY_INS: {
        query: "SELECT * FROM ufn_quickreply_ins($corpid,$orgid,$id,$classificationid,$description,$quickreply,$status,$type,$username,$operation,$favorite)",
        module: "",
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
    UFN_DOMAIN_LST_VALUES_ONLY_DATA: {
        query: "SELECT * FROM ufn_domain_lst_values_only_data($corpid,$orgid,$domainname)",
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
    UFN_INTEGRATIONMANAGER_EXPORT: {
        query: "SELECT * FROM ufn_integrationmanager_exportdata($corpid,$orgid,$id)",
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
        query: "SELECT * FROM ufn_conversation_reassignticket_massive($conversationid, $newuserid, $username, $newusergroup, $comment)",
        module: "", //tickets
        protected: "SELECT"
    },
    UFN_COMMUNICATIONCHANNEL_INS: {
        query: "SELECT * FROM ufn_communicationchannel_ins($corpid, $orgid, $id, $description, $type, $communicationchannelsite, $communicationchannelowner, $communicationchannelcontact, $communicationchanneltoken, $customicon, $coloricon, $status, $username, $operation, $botenabled, $botconfigurationid, $chatflowenabled, $schedule, $integrationid, $appintegrationid, $country, $channelparameters, $updintegration, $resolvelithium, $color, $icons, $other, $form, $apikey, $servicecredentials, $motive, $phone)",
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
    UFN_CHATFLOW_BLOCK_LST_BYTYPE: {
        query: "SELECT * FROM ufn_chatflow_block_lst_bytype($corpid, $orgid, $userid, $type)",
        module: "",
        protected: "SELECT"
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
        query: "SELECT * FROM ufn_chatflow_block_ins($corpid, $orgid, $communicationchannelid, $username, $chatblockid, $title, $description, $defaultgroupid, $defaultblockid, $firstblockid, $aiblockid, $blockgroup, $variablecustom, $status, $color, $icontype, $tag, $chatblockversionid,$type,$istemplate)",
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
        query: "select * from ufn_reporttemplate_ins($id, $corpid, $orgid, $description, $status, $type, $dataorigin, $columnjson, $filterjson, $summaryjson, $communicationchannelid, $username, $operation)",
        module: "",
        protected: "SELECT"
    },
    UFN_CREATEZYXMEACCOUNT_INS: {
        query: "SELECT * FROM ufn_createzyxmeaccount_ins($firstname, $lastname, $username, $password, $email, $doctype, $docnumber, $phone, $facebookid, $googleid, $join_reason, $rolecompany, $companysize, $organizationname, $paymentplanid, $currency, $country, $businessname, $fiscaladdress, $sunatcountry, $contactemail, $contact, $autosendinvoice, $timezoneoffset, $timezone)",
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
    UFN_CONVERSATIONWHATSAPP_REPORT: {
        query: `SELECT * FROM ufn_conversationwhatsapp_report($corpid, $orgid, $startdate, $enddate, $offset)`,
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_SUMMARY_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_summary_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$userid,$offset )",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_SUMMARY_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_summary_data_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$userid,$offset )",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_TMO_GENERAL_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_tmo_general_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$level,$closedby,$min,$max,$target,$skipdown,$skipup,$bd,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_TMO_GENERAL_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_tmo_general_data_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$level,$closedby,$min,$max,$target,$skipdown,$skipup,$bd,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_TME_GENERAL_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_tme_general_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$level,$closedby,$min,$max,$target,$skipdown,$skipup,$bd,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_TME_GENERAL_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_tme_general_data_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$level,$closedby,$min,$max,$target,$skipdown,$skipup,$bd,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_ENCUESTA_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_encuesta_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$closedby ,$userid,$offset )",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_ENCUESTA3_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_encuesta3_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$question,$closedby,$target,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_ENCUESTA3_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_encuesta3_data_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$question,$closedby,$target,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_ENCUESTA2_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_encuesta2_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$question,$closedby,$target,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_ENCUESTA2_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_encuesta2_data_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$question,$closedby,$target,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_ASESORESCONECTADOSBAR_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_asesoresconectadosbar_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company ,$userid,$offset )",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_ASESORESCONECTADOSBAR_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_asesoresconectadosbar_data_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company ,$userid,$offset )",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_CONVERSATION_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_conversation_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company ,$userid,$offset )",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_CONVERSATION_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_conversation_data_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company ,$userid,$offset )",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_INTERACTION_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_interaction_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company ,$userid,$offset )",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_INTERACTION_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_interaction_data_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company ,$userid,$offset )",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_ETIQUETAS_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_etiquetas_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$limit ,$userid,$offset )",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_ETIQUETAS_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_etiquetas_data_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$limit ,$userid,$offset )",
        module: "",
        protected: "SELECT"
    },

    UFN_DASHBOARD_OPERATIVO_SUMMARY_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_summary_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$skipdowntmo,$skipuptmo,$skipdowntme,$skipuptme,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_TMO_GENERAL_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_tmo_general_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$level,$closedby,$min,$max,$target,$skipdown,$skipup,$bd,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_TMO_GENERAL_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_tmo_general_data_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$level,$closedby,$min,$max,$target,$skipdown,$skipup,$bd,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_TME_GENERAL_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_tme_general_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$level,$closedby,$min,$max,$target,$skipdown,$skipup,$bd,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_TME_GENERAL_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_tme_general_data_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$level,$closedby,$min,$max,$target,$skipdown,$skipup,$bd,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_PRODXHORA_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_prodxhora_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$level,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_TMODIST_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_tmodist_data_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$skipdowntmo,$skipuptmo,$skipdowntme,$skipuptme,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_TMEDIST_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_tmedist_data_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$skipdowntmo,$skipuptmo,$skipdowntme,$skipuptme,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_PRODXHORADIST_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_prodxhoradist_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_PRODXHORADIST_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_prodxhoradist_data_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_ENCUESTA_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_encuesta_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$closedby,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_ENCUESTA3_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_encuesta3_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$question,$closedby,$target,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_ENCUESTA3_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_encuesta3_data_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$question,$closedby,$target,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_ENCUESTA2_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_encuesta2_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$question,$closedby,$target,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_ENCUESTA2_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_operativo_encuesta2_data_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$question,$closedby,$target,$supervisorid,$offset)",
        module: "",
        protected: "SELECT"
    },

    UFN_COUNT_CONFIGURATION: {
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
    UFN_DASHBOARD_PUSH_HSMCATEGORYRANK_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_push_hsmcategoryrank_data_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$category,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_PUSH_SUMMARY_SEL: {
        query: "SELECT * FROM ufn_dashboard_push_summary_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$category,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_PUSH_SUMMARY_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_push_summary_data_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$category,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_PUSH_HSMRANK_SEL: {
        query: "SELECT * FROM ufn_dashboard_push_hsmrank_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$category,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_PUSH_HSMRANK_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_push_hsmrank_data_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$category,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_PUSH_MENSAJEXDIA_SEL: {
        query: "SELECT * FROM ufn_dashboard_push_mensajexdia_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$category,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_PUSH_MENSAJEXDIA_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_push_mensajexdia_data_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$category,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_PUSH_APPLICATION_SEL: {
        query: "SELECT * FROM ufn_dashboard_push_application_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$category,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_PUSH_APPLICATION_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_push_application_data_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$label,$category,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_CHANNEL_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_channel_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_TAG_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_tag_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_GERENCIAL_TAG_DATA_SEL: {
        query: "SELECT * FROM ufn_dashboard_gerencial_tag_data_sel($corpid,$orgid,$startdate,$enddate,$channel,$group,$company,$userid,$offset)",
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
    UFN_GET_TOKEN_LOGGED_MOVIL: {
        query: "SELECT * FROM ufn_get_token_logged_movil($userid)",
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
        query: "SELECT * FROM ufn_conversation_sel_ticketsbyuser_filter($corpid, $orgid, $start_createticket, $end_createticket, $channels, $conversationstatus, $displayname, $phone, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_PERSON_INS: {
        query: "select * from ufn_person_ins( $id, $corpid, $orgid, $groups, $status, $type, $persontype, $personstatus, $phone, $email, $birthday, $alternativephone, $alternativeemail, $documenttype, $documentnumber, $firstname, $lastname, $sex, $gender, $civilstatus, $occupation, $educationlevel, $referringpersonid, $observation, $username, $operation)",
        module: "",
        protected: "SELECT"
    },
    UFN_LEAD_INS: {
        query: "select * from ufn_lead_ins($corpid,$orgid, $leadid, $description, $type, $status, $expected_revenue, $date_deadline, $tags, $personcommunicationchannel, $priority, $conversationid, $columnid, $column_uuid, $username, $index, $phone, $email, $userid, $phase, $campaignid, $leadproduct, $operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_LEAD_PERSON_INS: {
        query: "select * from ufn_lead_person_ins($corpid, $orgid, $id, $description, $type, $status, $expected_revenue, $date_deadline, $tags, $personcommunicationchannel, $priority, $conversationid, $columnid, $username, $index, $firstname, $lastname, $email, $phone, $personid, $userid, $products)",
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
        query: "select * from ufn_lead_sel($corpid, $orgid,  $id, $fullname, $leadproduct, $campaignid, $tags, $userid, $supervisorid, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_COLUMN_INS: {
        query: "select * from ufn_column_ins($corpid, $orgid, $id, $description, $type, $status, $edit, $username, $index, $operation, $delete_all)",
        module: "",
        protected: "INSERT"
    },
    UFN_UPDATE_LEADS: {
        query: "select * from ufn_update_leads($corpid, $orgid, $cards_startingcolumn, $cards_finalcolumn, $startingcolumn_uuid, $finalcolumn_uuid, $leadid, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_UPDATE_COLUMNS: {
        query: "select * from ufn_update_columns($corpid, $orgid, $cards_uuid)",
        module: "",
        protected: "INSERT"
    },
    UFN_REPORTSCHEDULER_SEL: {
        query: "select * from ufn_reportscheduler_sel($corpid, $orgid, $id, $username, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORTSCHEDULER_INS: {
        query: "select * from ufn_reportscheduler_ins($corpid,$orgid,$id,$title,$description,$status,$type,$origin,$origintype,$reportid,$reportname,$filterjson,$frecuency,$schedule,$datarange,$mailto,$mailcc,$mailsubject,$mailbody, $mailbodyobject,$username,$operation)",
        module: "",
        protected: "SELECT"
    },
    UFN_LEADNOTES_SEL: {
        query: "select * from ufn_leadnotes_sel($corpid,$orgid, $leadid, $leadnotesid, $all)",
        module: "",
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
    UFN_COMMUNICATIONCHANNEL_PAYMENTPLAN_CHECK: {
        query: "SELECT * FROM ufn_communicationchannel_paymentplan_check($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_USER_PAYMENTPLAN_CHECK: {
        query: "SELECT * FROM ufn_user_paymentplan_check($corpid, $orgid)",
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
        query: "select * from ufn_leadactivity_ins($corpid,$orgid,$leadid,$leadactivityid,$description,$duedate,$assigneduser,$assignto,$type,$status,$username,$operation, $feedback, $detailjson, $sendhsm, $communicationchannelid, $hsmtemplateid)",
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
        query: "SELECT * FROM ufn_report_heatmap_page1_sel($corpid,$orgid,$communicationchannel,$startdate,$enddate,$closedby,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_PAGE1_DATE_DETAIL_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_page1_date_detail_sel($corpid,$orgid,$communicationchannel,$startdate,$enddate,$closedby,$horanum,$option,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_DATE_DETAIL_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_date_detail_sel($corpid,$orgid,$communicationchannel,$startdate,$enddate,$closedby,$horanum,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_PAGE2_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_page2_sel($corpid,$orgid,$communicationchannel,$startdate,$enddate,$closedby,$company,$group,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_PAGE2_1_AGENT_DETAIL_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_page2_1_agent_detail_sel($corpid,$orgid,$communicationchannel,$startdate,$enddate,$closedby,$company,$group,$agentid,$option,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_PAGE2_2_AGENT_DETAIL_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_page2_2_agent_detail_sel($corpid,$orgid,$communicationchannel,$startdate,$enddate,$closedby,$company,$group,$agentid,$option,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_ATENCIONESXFECHA_TOTAL_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_atencionesxfecha_total_sel($corpid,$orgid,$communicationchannel,$startdate,$enddate,$closedby,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_USER_ASESORBYORGID_LST: {
        query: "SELECT * FROM ufn_user_asesorbyorgid_lst($corpid,$orgid,$userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_USER_REPORT_HEATMAP_ASESOR_LST: {
        query: "SELECT * FROM ufn_report_heatmap_asesor_lst($corpid,$orgid,$bot)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_PAGE3_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_page3_sel($corpid,$orgid,$communicationchannel,$startdate,$enddate,$closedby,$company,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_ASESORESCONECTADOS_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_asesoresconectados_sel($corpid,$orgid,$communicationchannel,$startdate,$enddate,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_ASESORESCONECTADOS_DETAIL_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_asesoresconectados_detail_sel($corpid,$orgid,$communicationchannel,$startdate,$enddate,$horanum,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_RESUMEN_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_resumen_sel($corpid,$orgid,$communicationchannel,$startdate,$enddate,$closedby,$userid,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_HEATMAP_TIPIFICACION_SEL: {
        query: "SELECT * FROM ufn_report_heatmap_tipificacion_sel($corpid,$orgid,$communicationchannel,$startdate,$enddate,$closedby,$userid,$offset)",
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
        query: "SELECT * FROM ufn_leadactivity_duedate_sel($corpid, $orgid, $userid, $roledesc);",
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
    QUERY_GET_MESSAGETEMPLATE_BYNAMESPACE: {
        query: "select messagetemplateid, header, body, priority, attachment from messagetemplate where corpid = $corpid and orgid = $orgid and namespace = $namespace",
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
        query: "SELECT * FROM ufn_billingconfiguration_ins($year,$month,$plan,$id,$basicfee,$userfreequantity,$useradditionalfee,$channelfreequantity,$channelwhatsappfee,$channelotherfee,$clientfreequantity,$clientadditionalfee,$allowhsm,$hsmfee,$description,$status,$whatsappconversationfreequantity,$freewhatsappchannel,$usercreateoverride,$channelcreateoverride,$vcacomissionperhsm,$type,$username,$operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_BILLINGCONFIGURATION_SEL: {
        query: "SELECT * FROM ufn_billingconfiguration_sel($year, $month, $plan)",
        module: "",
        protected: "SELECT"
    },
    UFN_BILLINGCONVERSATION_INS: {
        query: "SELECT * FROM ufn_billingconversation_ins($year, $month, $countrycode, $id, $companystartfee, $clientstartfee, $vcacomission, $freeconversations, $description, $status, $type, $username, $operation)",
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
        query: "SELECT * FROM ufn_billingperiod_upd($corpid, $orgid, $year, $month, $billingplan, $supportplan, $basicfee, $userfreequantity, $useradditionalfee, $channelfreequantity, $channelwhatsappfee, $channelotherfee, $clientfreequantity, $clientadditionalfee, $supportbasicfee, $unitpricepersms, $vcacomissionpersms, $unitepricepermail, $vcacomissionpermail, $additionalservicename1, $additionalservicefee1, $additionalservicename2, $additionalservicefee2, $additionalservicename3, $additionalservicefee3, $freewhatsappchannel, $freewhatsappconversations, $usercreateoverride, $channelcreateoverride, $vcacomissionperconversation, $vcacomissionperhsm, $force)",
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
        query: "SELECT propertyname, propertyvalue, communicationchannelid FROM property p WHERE p.corpid = :corpid AND p.orgid = :orgid AND p.propertyname IN (:propertynames) and p.status = 'ACTIVO';",
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
    QUERY_INSER_HSM_HISTORY: {
        query: "insert into hsmhistory (corpid, orgid, description, status, type, createdate, createby, changedate, changeby, config, success, message, shippingreason, messagetemplateid) values ($corpid, $orgid, '', $status, $type, NOW(), 'admin', NOW(), 'admin', $config, $success, $message, $shippingreason, $messatemplateid)",
        module: "",
        protected: "SELECT"
    },
    UFN_HSMHISTORY_LST: {
        query: "SELECT * FROM ufn_hsmhistory_lst($corpid, $orgid, $startdate, $enddate, $offset);",
        module: "",
        protected: "SELECT"
    },
    UFN_HSMHISTORY_REPORT: {
        query: "SELECT * FROM ufn_hsmhistory_report($corpid, $orgid, $campaignname, $date, $offset);",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_SENTMESSAGES_LST: {
        query: "SELECT * FROM ufn_report_sentmessages_lst($corpid, $orgid, $startdate, $enddate, $offset);",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_SENTMESSAGES_REPORT: {
        query: "SELECT * FROM ufn_report_sentmessages_sel($corpid, $orgid, $date, $name, $from, $offset);",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_SENTMESSAGES_GRAPHIC: {
        query: "SELECT * FROM ufn_report_sentmessages_graphic($corpid, $orgid, $startdate, $enddate, $column, $summarization, $offset);",
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
    QUERY_GET_DASHBOARDTEMPLATE: {
        query: "select detailjson from dashboardtemplate where corpid = $corpid and orgid = $orgid and dashboardtemplateid = $dashboardtemplateid",
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
    UFN_INVOICE_CORP: {
        query: "SELECT * FROM ufn_invoice_corp($corpid, $year, $month, $exchangerate)",
        module: "",
        protected: "INSERT"
    },
    UFN_INVOICE_ORG: {
        query: "SELECT * FROM ufn_invoice_org($corpid,$orgid,$year,$month,$exchangerate)",
        module: "",
        protected: "INSERT"
    },
    UFN_INVOICEDETAIL_AUTOINS: {
        query: "SELECT * FROM ufn_invoicedetail_autoins($corpid, $orgid, $invoiceid, $amount, $national, $year, $month)",
        module: "",
        protected: "INSERT"
    },
    UFN_INVOICE_SEL: {
        query: "SELECT * FROM ufn_invoice_sel($corpid,$orgid,$invoiceid,$userid,$year,$month,$currency,$paymentstatus)",
        module: "",
        protected: "SELECT"
    },
    UFN_INVOICE_SELCLIENT: {
        query: "SELECT * FROM ufn_invoice_selclient($corpid, $orgid, $invoiceid, $userid, $year, $month,$currency,$paymentstatus)",
        module: "",
        protected: "SELECT"
    },
    UFN_INVOICE_SELBYID: {
        query: "SELECT * FROM ufn_invoice_selbyid($corpid,$orgid,$invoiceid,$userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_INVOICE_INS: {
        query: "SELECT * FROM ufn_invoice_ins($corpid, $orgid, $invoiceid, $description, $status, $type, $issuerruc, $issuerbusinessname, $issuertradename, $issuerfiscaladdress, $issuerubigeo, $emittertype, $annexcode, $printingformat, $xmlversion, $ublversion, $receiverdoctype, $receiverdocnum, $receiverbusinessname, $receiverfiscaladdress, $receivercountry, $receivermail, $invoicetype, $sunatopecode, $serie, $correlative, $concept, $invoicedate, $expirationdate, $subtotal, $taxes, $totalamount, $currency, $exchangerate, $invoicestatus, $filenumber, $purchaseorder, $executingunitcode, $selectionprocessnumber, $contractnumber, $comments, $credittype, $creditnotetype, $creditnotemotive, $creditnotediscount, $invoicereferencefile, $invoicepaymentnote, $username, $referenceinvoiceid, $netamount, $paymentstatus, $hasreport, $year, $month)",
        module: "",
        protected: "INSERT"
    },
    UFN_INVOICE_REGENERATE: {
        query: "SELECT * FROM ufn_invoice_regenerate($corpid,$orgid,$invoiceid,$username)",
        module: "",
        protected: "INSERT"
    },
    UFN_INVOICE_ORDER: {
        query: "SELECT * FROM ufn_invoice_order($corpid,$orgid,$invoiceid,$orderid,$orderjson)",
        module: "",
        protected: "INSERT"
    },
    UFN_INVOICE_PAYMENT: {
        query: "SELECT * FROM ufn_invoice_payment($corpid, $orgid, $invoiceid, $paidby, $email, $tokenid, $capture, $tokenjson, $chargeid, $chargetoken, $chargejson, $culqiamount)",
        module: "",
        protected: "INSERT"
    },
    UFN_INVOICE_CHANGEPAYMENTSTATUS: {
        query: "SELECT * FROM ufn_invoice_changepaymentstatus($corpid, $orgid, $invoiceid, $status, $paymentnote, $paymentfile, $paymentcommentary, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_INVOICE_REFUND: {
        query: "SELECT * FROM ufn_invoice_refund($corpid,$orgid,$invoiceid,$refundtoken,$refundjson,$username)",
        module: "",
        protected: "INSERT"
    },
    UFN_CHARGE_SEL: {
        query: "SELECT * FROM ufn_charge_sel($corpid,$orgid,$userid,$chargeid)",
        module: "",
        protected: "INSERT"
    },
    UFN_CHARGE_INS: {
        query: "SELECT * FROM ufn_charge_ins($corpid,$orgid,$id,$invoiceid,$description,$type,$status,$amount,$currency,$paidby,$orderid,$orderjson,$email,$tokenid,$capture,$tokenjson,$chargetoken,$chargejson,$operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_CHARGE_REFUND: {
        query: "SELECT * FROM ufn_charge_refund($corpid,$orgid,$chargeid,$refundtoken,$refundjson,$username)",
        module: "",
        protected: "INSERT"
    },
    UFN_MESSAGETEMPLATE_LST: {
        query: "SELECT * FROM ufn_messagetemplate_lst($corpid,$orgid,$username)",
        module: "",
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
        module: "",
        protected: "SELECT"
    },
    UFN_INVOICE_SUNAT: {
        query: "SELECT * FROM ufn_invoice_sunat($corpid, $orgid, $invoiceid, $status, $error, $qrcode, $hashcode, $urlcdr, $urlpdf, $urlxml, $serie, $issuerruc, $issuerbusinessname, $issuertradename, $issuerfiscaladdress, $issuerubigeo, $emittertype, $annexcode, $printingformat, $sendtosunat, $returnpdf, $returnxmlsunat, $returnxml, $token, $sunaturl, $sunatusername, $xmlversion, $ublversion, $receiverdoctype, $receiverdocnum, $receiverbusinessname, $receiverfiscaladdress, $receivercountry, $receivermail, $invoicetype, $sunatopecode, $expirationdate, $purchaseorder, $comments, $credittype, $detractioncode, $detraction, $detractionaccount, $invoicedate)",
        module: "",
        protected: "INSERT"
    },
    UFN_DASHBOARD_GERENCIAL_CONVERSATIONXHOUR_SEL: {
        query: "select * from ufn_dashboard_gerencial_conversationxhour_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $skipdown, $skipup, $userid, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_DASHBOARD_OPERATIVO_ENCUESTA3_SEL: {
        query: "select * from ufn_dashboard_operativo_encuesta3_sel($corpid, $orgid, $startdate, $enddate, $channel, $group, $company, $label, $question, $closedby, $target, $supervisorid, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_CONVERSATIONSTATUS_SEL: {
        query: "select * from ufn_conversationstatus_sel($corpid, $orgid, $personid, $conversationid, $communicationchannelid)",
        module: "",
        protected: "SELECT"
    },
    UFN_APPSETTING_INVOICE_SEL: {
        query: "select * from public.ufn_appsetting_invoice_sel()",
        module: "",
        protected: "SELECT"
    },
    UFN_APPSETTING_INVOICE_UPDATE: {
        query: "select * from public.ufn_appsetting_invoice_update($ruc, $businessname, $tradename, $fiscaladdress, $ubigeo, $country, $emittertype, $currency, $invoiceserie, $invoicecorrelative, $annexcode, $igv, $printingformat, $xmlversion, $ublversion, $returnpdf, $returnxmlsunat, $returnxml, $invoiceprovider, $sunaturl, $token, $sunatusername, $paymentprovider, $publickey, $privatekey, $ticketserie, $ticketcorrelative, $invoicecreditserie, $invoicecreditcorrelative, $ticketcreditserie, $ticketcreditcorrelative, $detraction, $detractioncode, $detractionaccount, $operationcodeperu, $operationcodeother, $culqiurl, $detractionminimum, $culqiurlcardcreate, $culqiurlclient, $culqiurltoken, $culqiurlcharge, $culqiurlcardget, $culqiurlcarddelete)",
        module: "",
        protected: "UPDATE"
    },
    UFN_KPI_SEL: {
        query: "SELECT * FROM ufn_kpi_sel($corpid,$orgid,$kpiid)",
        module: "",
        protected: "SELECT"
    },
    UFN_KPI_LST: {
        query: "SELECT * FROM ufn_kpi_lst($corpid,$orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_KPI_INS: {
        query: "SELECT * FROM ufn_kpi_ins($corpid,$orgid,$id,$kpiname,$description,$status,$type,$sqlselect,$sqlwhere,$target,$cautionat,$alertat,$taskperiod,$taskinterval,$taskstartdate,$username,$operation,$offset)",
        module: "",
        protected: "INSERT"
    },
    UFN_KPI_DUPLICATE: {
        query: "SELECT * FROM ufn_kpi_duplicate($corpid,$orgid,$kpiid,$username)",
        module: "",
        protected: "INSERT"
    },
    UFN_KPI_CALC: {
        query: "SELECT * FROM ufn_kpi_calc($corpid,$orgid,$kpiid,$username,$task)",
        module: "",
        protected: "INSERT"
    },
    UFN_KPIHISTORY_SEL: {
        query: "SELECT * FROM ufn_kpihistory_sel($corpid,$orgid,$kpiid,$startdate,$enddate,$offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_BILLINGNOTIFICATION_INS: {
        query: "SELECT * FROM ufn_billingnotification_ins($year, $month, $countrycode, $id, $vcacomission, $c250000, $c750000, $c2000000, $c3000000, $c4000000, $c5000000, $c10000000, $c25000000, $description, $status, $type, $username, $operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_BILLINGNOTIFICATION_SEL: {
        query: "SELECT * FROM ufn_billingnotification_sel($year, $month, $countrycode)",
        module: "",
        protected: "SELECT"
    },
    UFN_BILLINGPERIOD_CALC_REFRESHALL: {
        query: "SELECT * FROM ufn_billingperiod_calc_refreshall((SELECT EXTRACT (YEAR from (select now() at time zone 'utc'))::bigint), (SELECT EXTRACT (MONTH from (select now() at time zone 'utc'))::bigint), $corpid, $orgid)",
        module: "",
        protected: "INSERT"
    },
    UFN_INVOICEDETAIL_SELBYINVOICEID: {
        query: "SELECT * FROM ufn_invoicedetail_selbyinvoiceid($corpid,$orgid,$invoiceid,$userid)",
        module: "",
        protected: "SELECT"
    },
    UFN_BILLINGMESSAGING_INS: {
        query: "SELECT * FROM ufn_billingmessaging_ins($year, $month, $id, $pricepersms, $vcacomissionpersms, $pricepermail, $vcacomissionpermail, $description, $status, $type, $username, $operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_BILLINGMESSAGING_SEL: {
        query: "SELECT * FROM ufn_billingmessaging_sel($year, $month)",
    },
    UFN_REPORT_PERSONALIZED_ORIGIN_SEL: {
        query: "SELECT * FROM ufn_report_personalized_origin_sel()",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_PERSONALIZED_VARIABLE_SEL: {
        query: "SELECT * FROM ufn_report_personalized_variable_sel($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORT_PERSONALIZED_COLUMNS_SEL: {
        query: "SELECT * FROM ufn_report_personalized_columns_sel($corpid, $orgid, $tablename)",
        module: "",
        protected: "SELECT"
    },
    UFN_INVOICE_TICKETCORRELATIVE: {
        query: "select * from ufn_invoice_ticketcorrelative($corpid, $orgid, $invoiceid)",
        module: "",
        protected: "SELECT"
    },
    UFN_INVOICE_REFRESH: {
        query: "select * from ufn_invoice_refresh($corpid, $orgid, $invoiceid, $year, $month)",
        module: "",
        protected: "SELECT"
    },
    UFN_ADVISERSBYUSERID_SEL: {
        query: "select * from ufn_advisersbyuserid_sel($corpid, $orgid, $userid)",
        module: "",
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
        query: "select * from ufn_balance_check($corpid, $orgid, $communicationchannelid, $type, $receiver, $username)",
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
        module: "",
        protected: "SELECT"
    },
    UFN_INVOICEDETAIL_INS: {
        query: "SELECT * FROM ufn_invoicedetail_ins($corpid, $orgid, $invoiceid, $description, $status, $type, $quantity, $productcode, $hasigv, $saletype, $igvtribute, $measureunit, $totaligv, $totalamount, $igvrate, $productprice, $productdescription, $productnetprice, $productnetworth, $netamount, $username)",
        module: "",
        protected: "INSERT"
    },
    UFN_CORP_PAYMENTPLAN_UPD: {
        query: "SELECT * from ufn_corp_paymentplan_upd($corpid, $paymentplancode, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_CORP_PAYMENTPLAN_CANCEL: {
        query: "SELECT * from ufn_corp_paymentplan_cancel($corpid, $username, $offset)",
        module: "",
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
        module: "",
        protected: "DELETE"
    },
    UFN_INVOICEDETAIL_DELETE: {
        query: "SELECT * FROM ufn_invoicedetail_delete($corpid, $orgid, $invoiceid)",
        module: "",
        protected: "DELETE"
    },
    UFN_BALANCE_SEL: {
        query: "select * from ufn_balance_sel($corpid, $orgid, $balanceid, $type, $operationtype, $all)",
        module: "",
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
        module: "",
        protected: "SELECT"
    },
    UFN_BALANCE_CHANGEINVOICE: {
        query: "SELECT * FROM ufn_balance_changeinvoice($corpid, $orgid, $balanceid, $invoiceid, $username)",
        module: "",
        protected: "SELECT"
    },
    UFN_BALANCE_SEL_SENT: {
        query: "SELECT * FROM ufn_balance_sel_sent($corpid, $orgid, $date, $type, $module, $messagetemplateid)",
        module: "",
        protected: "SELECT"
    },
    UFN_BILLING_REPORT_CONVERSATIONWHATSAPP: {
        query: "SELECT * FROM ufn_billing_report_conversationwhatsapp($corpid, $orgid, $year, $month)",
        module: "",
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
        module: "",
        protected: "SELECT"
    },
    UFN_USERBYUSER: {
        query: "SELECT * FROM ufn_userbyuser($username)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORTSCHEDULER_REPORTSEL: {
        query: "SELECT * FROM ufn_reportscheduler_reportsel($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_REPORTSCHEDULER_FILTER_SEL: {
        query: "SELECT * FROM ufn_reportscheduler_filter_sel()",
        module: "",
        protected: "SELECT"
    },
    UFN_PRODUCTCATALOG_INS: {
        query: "SELECT * FROM ufn_productcatalog_ins($corpid, $orgid, $id, $code, $description, $descriptiontext, $category, $status, $type, $imagereference, $notes, $unitprice, $username, $operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_PRODUCTCATALOG_SEL: {
        query: "SELECT * FROM ufn_productcatalog_sel($corpid, $orgid, $id, $category, $username, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_PRODUCTCATALOG_LST: {
        query: "SELECT * FROM ufn_productcatalog_lst($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_PAYMENTCARD_INS: {
        query: "SELECT * FROM ufn_paymentcard_ins($corpid, $orgid, $id, $cardnumber, $cardcode, $firstname, $lastname, $mail, $favorite, $clientcode, $status, $type, $username, $operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_PAYMENTCARD_LST: {
        query: "SELECT * FROM ufn_paymentcard_lst($corpid, $orgid, $id)",
        module: "",
        protected: "SELECT"
    },
    UFN_LEADAUTOMATIZATIONRULES_SEL: {
        query: "SELECT * FROM ufn_leadautomatizationrules_sel($corpid, $orgid, $id,$communicationchannelid, $username, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_LEADAUTOMATIZATIONRULES_INS: {
        query: "SELECT * FROM ufn_leadautomatizationrules_ins($corpid,$orgid,$id,$description,$status,$type,$columnid,$communicationchannelid,$messagetemplateid,$messagetemplateparameters,$shippingtype,$xdays,$schedule,$tags,$products,$username,$operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_CALENDAREVENT_INS: {
        query: "SELECT * FROM ufn_calendarevent_ins($corpid, $orgid, $id, $description, $type, $status, $code, $name, $locationtype, $location, $eventlink, $color, $notificationtype, $communicationchannelid, $messagetemplateid, $daterange, $daysduration, $daystype, $startdate, $enddate, $timeduration, $timeunit, $availability, $timebeforeeventduration, $timebeforeeventunit, $timeaftereventduration, $timeaftereventunit, $increments, $username, $operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_CALENDAREVENT_SEL: {
        query: "SELECT * FROM ufn_calendarevent_sel($corpid, $orgid, $id, $username, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_CALENDAREVENT_LST: {
        query: "SELECT * FROM ufn_calendarevent_lst($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    QUERY_EVENT_BY_CODE: {
        query: "SELECT ce.corpid, ce.orgid, ce.calendareventid, ce.description, ce.status, ce.type, ce.name, ce.locationtype, ce.location, ce.eventlink, ce.color, ce.notificationtype, ce.messagetemplateid, ce.daterange, ce.daysduration, ce.daystype, ce.startdate, ce.enddate, ce.timeduration, ce.timeunit, ce.timezone, ce.availability, ce.timebeforeeventduration, ce.timebeforeeventunit, ce.timeaftereventduration, ce.timeaftereventunit, ce.increments, p.name personname, p.phone, p.email FROM calendarevent ce left JOIN person p on p.corpid = ce.corpid and p.orgid = ce.orgid and p.personid = $personid WHERE ce.orgid = $orgid and ce.code = $code",
        module: "",
        protected: "SELECT"
    },
    QUERY_GET_PERSON_FROM_BOOKING: {
        query: "select p.name, p.phone, p.email from person p where p.corpid = $corpid and p.orgid = $orgid and p.personid = $personid",
        module: "",
        protected: "SELECT"
    },
    QUERY_EVENT_BY_CALENDAR_EVENT_ID: {
        query: `SELECT mt.name messagetemplatename, cc.type communicationchanneltype, ce.messagetemplateid, ce.communicationchannelid, ce.notificationtype from calendarevent ce 
        left join communicationchannel cc on cc.corpid = ce.corpid and cc.orgid = ce.orgid and cc.communicationchannelid = ce.communicationchannelid 
        inner join messagetemplate mt on mt.corpid = ce.corpid and mt.orgid = ce.orgid and mt.messagetemplateid = ce.messagetemplateid 
        where ce.corpid = $corpid and ce.orgid = $orgid and ce.calendareventid = $calendareventid`,
        module: "",
        protected: "SELECT"
    },
    UFN_CALENDARYBOOKING_INS: {
        query: "SELECT * FROM ufn_calendarbooking_ins($corpid, $orgid, $calendareventid, $id, $description, $type, $status, $monthdate, $hourstart, $notes, $conversationid, $personname, $personcontact, $persontimezone, $username, $operation)",
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
        module: "",
        protected: "SELECT"
    },
    UFN_INVOICE_IMPORT: {
        query: "SELECT * FROM ufn_invoice_import($corpid, $orgid, $year, $month, $description, $status, $receiverdoctype, $receiverdocnum, $receiverbusinessname, $receiverfiscaladdress, $receivercountry, $receivermail, $invoicetype, $serie, $correlative, $invoicedate, $expirationdate, $invoicestatus, $paymentstatus, $paymentdate, $paidby, $paymenttype, $totalamount, $exchangerate, $currency, $urlcdr, $urlpdf, $urlxml, $purchaseorder, $comments, $credittype, $username)",
        module: "",
        protected: "SELECT"
    },
}