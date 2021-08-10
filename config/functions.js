module.exports = {
    
    
    QUERY_AUTHENTICATED: "select org.description orgdesc, corp.description corpdesc, ous.corpid, ous.orgid, us.userid, us.usr, us.pwd, us.firstname, us.lastname, us.email, us.status, us.lastuserstatus from usr us inner join orguser ous on ous.userid = us.userid inner join org org on org.orgid = ous.orgid inner join corp corp on corp.corpid = ous.corpid where us.usr = $usr limit 1",
    UFN_CORP_ORG_SEL: "SELECT * FROM ufn_corp_org_sel($corpid, $id, $username, $all)",
    UFN_CORP_SEL: "SELECT * FROM ufn_corp_sel($corpid, $orgid, $id, $username, $all)",
    UFN_USER_SEL: "SELECT * FROM ufn_user_sel($corpid, $orgid, $id, $username, $all)",
    UFN_ORGUSER_SEL: "SELECT * FROM ufn_orguser_sel($corpid, $orgid, $userid, $username, $all)",
    UFN_ORGUSER_INS: "SELECT * FROM ufn_orguser_ins($corpid, $orgid, $userid, $roleid, $usersupervisor, $bydefault, $labels, $groups, $channels, $status,$type, $defaultsort, $username, $operation, $redirect)",
    UFN_USER_INS: "SELECT * FROM ufn_user_ins($id, $usr, $doctype, $docnum, $pwd, $firstname, $lastname, $email, $pwdchangefirstlogin, $type, $status,$description, $username, $operation, $redirect, $company, $twofactorauthentication)",
    UFN_PROPERTY_SEL: "SELECT * FROM ufn_property_sel($corpid,$orgid,$id,$username,$all)" ,
    UFN_PROPERTY_INS: "SELECT * FROM ufn_property_ins($corpid,$orgid,$communicationchannelid,$id,$propertyname,$propertyvalue, $description, $status,$type,$username,$operation)",
    UFN_CONVERSATION_QUEUE_USERGROUP_SEL: "SELECT * FROM ufn_conversation_queue_usergroup_sel($corpid, $orgid)",
    UFN_GROUPCONFIGURATION_SEL: "SELECT * FROM ufn_groupconfiguration_sel($corpid, $orgid, $id, $username, $all)",

    UFN_CORPBYUSER_LST: "SELECT * FROM ufn_corpbyuser_lst($userid)",
    UFN_ORGBYCORP_LST: "SELECT * FROM ufn_orgbycorp_lst($corpid)",
    UFN_COMMUNICATIONCHANNELBYORG_LST: "SELECT * FROM ufn_communicationchannelbyorg_lst($orgid)",
    UFN_DOMAIN_LST_VALORES: "SELECT * FROM ufn_domain_lst_valores($corpid,$orgid,$domainname)",
    UFN_USERTOKEN_INS: "select * from ufn_usertoken_ins($userid, $token, $origin)",
    UFN_USERSTATUS_UPDATE: "select * from ufn_userstatus_update($userid, $orgid, $type, $username, $status, $motive, $description)",
    UFN_USERTOKEN_SEL: "SELECT * FROM ufn_usertoken_sel($corpid,$orgid,$userid, $token)",
}