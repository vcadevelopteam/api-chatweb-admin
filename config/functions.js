module.exports = {
    QUERY_AUTHENTICATED: {
        query: "select org.description orgdesc, corp.description corpdesc, ous.corpid, ous.orgid, us.userid, us.usr, us.pwd, us.firstname, us.lastname, us.email, us.status, ous.redirect, role.description roledesc from usr us inner join orguser ous on ous.userid = us.userid inner join org org on org.orgid = ous.orgid inner join corp corp on corp.corpid = ous.corpid inner join role role on role.roleid = ous.roleid where us.usr = $usr and ous.bydefault limit 1",
        module: "",
        protected: false
    },
    QUERY_AUTHENTICATED_BY_FACEBOOKID: {
        query: "select org.description orgdesc, corp.description corpdesc, ous.corpid, ous.orgid, us.userid, us.usr, us.pwd, us.firstname, us.lastname, us.email, us.status, ous.redirect, role.description roledesc from usr us inner join orguser ous on ous.userid = us.userid inner join org org on org.orgid = ous.orgid inner join corp corp on corp.corpid = ous.corpid inner join role role on role.roleid = ous.roleid where us.facebookid = $facebookid and ous.bydefault limit 1",
        module: "",
        protected: false
    },
    QUERY_AUTHENTICATED_BY_GOOGLEID: {
        query: "select org.description orgdesc, corp.description corpdesc, ous.corpid, ous.orgid, us.userid, us.usr, us.pwd, us.firstname, us.lastname, us.email, us.status, ous.redirect, role.description roledesc from usr us inner join orguser ous on ous.userid = us.userid inner join org org on org.orgid = ous.orgid inner join corp corp on corp.corpid = ous.corpid inner join role role on role.roleid = ous.roleid where us.googleid = $googleid and ous.bydefault limit 1",
        module: "",
        protected: false
    },
    UFN_CORP_ORG_SEL: {
        query: "SELECT * FROM ufn_corp_org_sel($corpid, $id, $username, $all)",
        module: "/extras/users",
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
        query: "SELECT * FROM ufn_user_ins($id, $usr, $doctype, $docnum, $password, $firstname, $lastname, $email, $pwdchangefirstlogin, $type, $status,$description, $username, $operation, $company, $twofactorauthentication, $registercode, $billinggroup)",
        module: "/extras/users",
        protected: "INSERT"
    },
    UFN_COMMUNICATIONCHANNEL_LST: {
        query: "SELECT * FROM ufn_communicationchannel_lst($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_PROPERTY_SEL: {
        query: "SELECT * FROM ufn_property_sel($corpid,$orgid,$id,$username,$all, $offset)" ,
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
        query: "SELECT * FROM ufn_role_lst($corpid, $orgid)",
        module: "",
        protected: "SELECT"
    },
    UFN_PROPERTY_INS: {
        query: "SELECT * FROM ufn_property_ins($corpid,$orgid,$communicationchannelid,$id,$propertyname,$propertyvalue, $description, $status,$type,$username,$operation)",
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
        query: "SELECT * FROM ufn_inappropriatewords_ins($id,$corpid, $orgid, $description,$status,$type,$username,$operation)",
        module: "/extras/inappropriatewords",
        protected: "INSERT"
    },
    UFN_PERSON_TOTALRECORDS: {
        query: "SELECT * FROM ufn_person_totalrecords($corpid, $orgid, $where, $startdate, $enddate, $offset)",
        module: "",
        protected: "SELECT"
    },
    UFN_PERSON_SEL: {
        query: "SELECT  * FROM ufn_person_sel($corpid, $orgid, $username, $where, $order, $take, $skip, $startdate, $enddate, $offset)",
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
        query: "SELECT * FROM ufn_domain_ins($id ,$corpid ,$orgid ,$domainname  ,$username ,$operation )",
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
    UFN_CLASSIFICATION_INS: {
        query: "SELECT * FROM ufn_classification_ins($id,$corpid,$orgid,$description,$parent,$communicationchannel,$status,$type,$username,$operation,$jobplan,$usergroup,$schedule)",    
        module: "",
        protected: "SELECT"
    },
    UFN_QUICKREPLY_SEL: {
        query: "SELECT * FROM ufn_quickreply_sel($corpid ,$orgid ,$id  ,$username ,$all)",    
        module: "/extras/quickreplies",
        protected: "SELECT"
    },
    UFN_ORG_SEL: {
        query: "SELECT * FROM ufn_org_sel($corpid ,$orgid ,$all)",    
        module: "/extras/quickreplies",
        protected: "SELECT"
    },
    UFN_ORG_INS: {
        query: "SELECT * FROM ufn_org_ins($corpid,$id,$description,$status,$type,$username,$operation)",    
        module: "/extras/quickreplies",
        protected: "INSERT"
    },
    UFN_QUICKREPLY_INS: {
        query: "SELECT * FROM ufn_quickreply_ins($corpid,$orgid,$id,$classificationid,$description,$quickreply,$status,$type,$username,$operation)",    
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
        query: "SELECT * FROM ufn_messagetemplate_ins($corpid,$orgid,$id,$description,$type,$status,$name,$namespace,$category,$language,$templatetype,$headerenabled,$headertype,$header,$body,$footerenabled,$footer,$buttonsenabled,$buttons,$username,$operation)",
        module: "",
        protected: "INSERT"
    },
    UFN_CLASSIFICATION_SEL: {
        query: "SELECT * FROM ufn_classification_sel($corpid,$orgid,$id,$username, $all)",
        module: "",
        protected: "SELECT"
    },
    UFN_CLASSIFICATION_INS: {
        query: "SELECT * FROM ufn_classification_ins( $id, $corpid, $orgid, $description, $parent, $communicationchannel, $status, $type, $username, $operation, $tags, $jobplan, $usergroup, $schedule)",
        module: "",
        protected: "INSERT"
    },
    UFN_CLASSIFICATION_LST_PARENT: {
        query: "SELECT * FROM ufn_classification_lst_parent($corpid,$orgid,$classificationid)",
        module: "",
        protected: "SELECT"
    },
    UFN_COMMUNICATIONCHANNEL_SEL: {
        query: "SELECT * FROM ufn_communicationchannel_sel($corpid,$orgid,$communicationchannelid, $personcommunicationchannel, $username, $all)",
        module: "",
        protected: "SELECT"
    },
    
}