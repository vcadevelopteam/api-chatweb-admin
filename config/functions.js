module.exports = {
    
    
    QUERY_AUTHENTICATED: "select org.description orgdesc, corp.description corpdesc, ous.corpid, ous.orgid, us.userid, us.usr, us.pwd, us.firstname, us.lastname, us.email, us.status, us.lastuserstatus, ous.redirect, role.description roledesc from usr us inner join orguser ous on ous.userid = us.userid inner join org org on org.orgid = ous.orgid inner join corp corp on corp.corpid = ous.corpid inner join role role on role.roleid = ous.roleid where us.usr = $usr and ous.bydefault limit 1",
    UFN_CORP_ORG_SEL: "SELECT * FROM ufn_corp_org_sel($corpid, $id, $username, $all)",
    UFN_CORSEL: "SELECT * FROM ufn_corsel($corpid, $orgid, $id, $username, $all)",
    UFN_USER_SEL: "SELECT * FROM ufn_user_sel($corpid, $orgid, $id, $username, $all)",
    UFN_APPLICATION_SEL: "SELECT * FROM ufn_application_sel($corpid, $orgid, $userid)",
    UFN_ORGUSER_SEL: "SELECT * FROM ufn_orguser_sel($corpid, $orgid, $userid, $username, $all)",
    UFN_ORGUSER_INS: "SELECT * FROM ufn_orguser_ins($corpid, $orgid, $p_userid, $roleid, $usersupervisor, $bydefault, $labels, $groups, $channels, $status,$type, $defaultsort, $username, $operation, $redirect)",
    UFN_USER_INS: "SELECT * FROM ufn_user_ins($id, $usr, $doctype, $docnum, $password, $firstname, $lastname, $email, $pwdchangefirstlogin, $type, $status,$description, $username, $operation, $company, $twofactorauthentication, $registercode, $billinggroup)",
    UFN_COMMUNICATIONCHANNEL_LST: "SELECT * FROM ufn_communicationchannel_lst($corpid, $orgid)",
    UFN_PROPERTY_SEL: "SELECT * FROM ufn_property_sel($corpid,$orgid,$id,$username,$all, $offset)" ,
    UFN_USER_SUPERVISOR_LST: "SELECT * FROM ufn_user_supervisor_lst($corpid, $orgid, $userid)",
    UFN_APPS_DATA_SEL: "SELECT * FROM UFN_APPS_DATA_SEL($roleid)",
    UFN_ROLE_LST: "SELECT * FROM ufn_role_lst($corpid, $orgid)",
    UFN_PROPERTY_INS: "SELECT * FROM ufn_property_ins($corpid,$orgid,$communicationchannelid,$id,$propertyname,$propertyvalue, $description, $status,$type,$username,$operation)",
    UFN_CONVERSATION_QUEUE_USERGROUSEL: "SELECT * FROM ufn_conversation_queue_usergrousel($corpid, $orgid)",
    UFN_GROUPCONFIGURATION_SEL: "SELECT * FROM ufn_groupconfiguration_sel($corpid, $orgid, $id, $username, $all)",
    UFN_GROUPCONFIGURATION_INS: "SELECT * FROM ufn_groupconfiguration_ins($corpid, $orgid, $id, $operation, $domainid, $description, $type, $status, $username, $quantity, $validationtext)",
    UFN_WHITELIST_SEL: "SELECT * FROM ufn_whitelist_sel($corpid, $orgid, $username, $id, $all)",
    UFN_WHITELIST_INS: "SELECT * FROM ufn_whitelist_ins($corpid,$orgid,$id,$operation,$documenttype,$documentnumber,$usergroup,$type,$status,$asesorname,$username)",
    UFN_INAPPROPRIATEWORDS_SEL: "SELECT * FROM ufn_inappropriatewords_sel($corpid, $orgid,$id, $username)",
    UFN_INAPPROPRIATEWORDS_INS: "SELECT * FROM ufn_inappropriatewords_ins($id,$corpid, $orgid, $description,$status,$type,$username,$operation)",
    UFN_PERSON_TOTALRECORDS: "SELECT * FROM ufn_person_totalrecords($corpid, $orgid, $where, $startdate, $enddate, $offset)",
    UFN_PERSON_SEL: "SELECT  * FROM ufn_person_sel($corpid, $orgid, $username, $where, $order, $take, $skip, $startdate, $enddate, $offset)",
    UFN_INTELLIGENTMODELS_SEL: "SELECT * FROM ufn_intelligentmodels_sel($corpid,$orgid,$username,$id,$all)",    
    UFN_INTELLIGENTMODELS_INS: "SELECT * FROM ufn_intelligentmodels_ins($corpid,$orgid,$id,$operation,$description,$endpoint ,$modelid ,$provider ,$apikey ,$type ,$status ,$username) ",
    UFN_SLA_SEL: "SELECT * FROM ufn_sla_sel($corpid ,$orgid ,$id ,$username ,$all)",    
    UFN_SLA_INS: "SELECT * FROM ufn_sla_ins( $corpid, $orgid, $id, $description, $type, $company, $communicationchannelid, $usergroup, $status, $totaltmo, $totaltmomin, $totaltmopercentmax, $totaltmopercentmin, $usertmo, $usertmomin, $usertmopercentmax, $usertmopercentmin, $tme, $tmemin, $tmepercentmax, $tmepercentmin, $usertme, $usertmemin, $usertmepercentmax, $usertmepercentmin, $productivitybyhour, $username, $operation)",
    UFN_DOMAIN_SEL: "SELECT * FROM ufn_domain_sel($corpid ,$orgid ,$domainname  ,$username ,$all)",    
    UFN_DOMAIN_VALUES_SEL: "SELECT * FROM ufn_domain_values_sel($corpid ,$orgid ,$domainname  ,$username ,$all)",    
    UFN_DOMAIN_INS: "SELECT * FROM ufn_domain_ins($id ,$corpid ,$orgid ,$domainname  ,$username ,$operation )",
    UFN_DOMAIN_VALUES_INS: "SELECT * FROM ufn_domain_value_ins($id ,$corpid ,$orgid ,$domainname  ,$description ,$domainvalue ,$domaindesc,$system,$status,$type ,$bydefault,$username,$operation)",
    UFN_CLASSIFICATION_SEL: "SELECT * FROM ufn_classification_sel($corpid ,$orgid ,$id  ,$username ,$all)",    
    UFN_CLASSIFICATION_INS: "SELECT * FROM ufn_classification_ins($id,$corpid,$orgid,$description,$parent,$communicationchannel,$status,$type,$username,$operation,$jobplan,$usergroup,$schedule)",    
    UFN_QUICKREPLY_SEL: "SELECT * FROM ufn_quickreply_sel($corpid ,$orgid ,$id  ,$username ,$all)",    
    UFN_QUICKREPLY_INS: "SELECT * FROM ufn_quickreply_ins($corpid,$orgid,$id,$classificationid,$description,$quickreply,$status,$type,$username,$operation)",    
    // UFN_PERSON_SEL: "SELECT * FROM ufn_person_sel($corpid ,$orgid ,$id  ,$username ,$all)",    
    UFN_PERSON_INS: "SELECT * FROM ufn_quickreply_ins($id,$corpid,$orgid,$groups,$status,$type,$persontype,$personstatus,$phone,$email,$birthday,$alternativephone,$alternativeemail,$documenttype,$documentnumber,$firstname,$lastname,$sex,$gender,$civilstatus,$occupation,$educationlevel,$referringpersonid,$username,$operation)",    

    UFN_CORPBYUSER_LST: "SELECT * FROM ufn_corpbyuser_lst($userid)",
    UFN_ORGBYCORLST: "SELECT * FROM ufn_orgbycorlst($corpid)",
    UFN_COMMUNICATIONCHANNELBYORG_LST: "SELECT * FROM ufn_communicationchannelbyorg_lst($orgid)",
    UFN_DOMAIN_LST_VALORES: "SELECT * FROM ufn_domain_lst_valores($corpid,$orgid,$domainname)",
    UFN_USERTOKEN_INS: "select * from ufn_usertoken_ins($userid, $token, $origin)",
    UFN_USERSTATUS_UPDATE: "select * from ufn_userstatus_update($userid, $orgid, $type, $username, $status, $motive, $description)",
    UFN_USERTOKEN_SEL: "SELECT * FROM ufn_usertoken_sel($corpid,$orgid,$userid, $token)",
}