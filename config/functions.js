module.exports = {
    
    
    QUERY_AUTHENTICATED: "select ous.corpid, ous.orgid, us.userid, us.usr, us.pwd, us.firstname, us.lastname, us.email, us.status from usr us inner join orguser ous on ous.userid = us.userid where us.usr = $usr limit 1",
    UFN_CORP_ORG_SEL: "SELECT * FROM ufn_corp_org_sel($corpid, $id, $username, $all)",
    UFN_CORP_SEL: "SELECT * FROM ufn_corp_sel($corpid, $orgid, $id, $username, $all)",
    UFN_USER_SEL: "SELECT * FROM ufn_user_sel($corpid, $orgid, $id, $username, $all)",
    UFN_ORGUSER_SEL: "SELECT * FROM ufn_orguser_sel($corpid, $orgid, $userid, $username, $all)",
    UFN_ORGUSER_INS: "SELECT * FROM ufn_orguser_ins($corpid, $orgid, $userid, $roleid, $usersupervisor, $bydefault, $labels, $groups, $channels, $status,$type, $defaultsort, $username, $operation, $redirect)",
    UFN_USER_INS: "SELECT * FROM ufn_user_ins($id, $usr, $doctype, $docnum, $pwd, $firstname, $lastname, $email, $pwdchangefirstlogin, $type, $status,$description, $username, $operation, $redirect, $company, $twofactorauthentication)",
    UFN_PROPERTY_SEL: "SELECT * FROM ufn_property_sel($corpid,$orgid,$id,$username,$all)" ,
    UFN_PROPERTY_INS: "SELECT * FROM ufn_property_ins($corpid,$orgid,$communicationchannelid,$id,$propertyname,$propertyvalue, $description, $status,$type,$username,$operation)",

    UFN_CORPBYUSER_LST: "SELECT * FROM ufn_corpbyuser_lst($userid)",
    UFN_ORGBYCORP_LST: "SELECT * FROM ufn_orgbycorp_lst($corpid)",
    UFN_COMMUNICATIONCHANNELBYORG_LST: "SELECT * FROM ufn_communicationchannelbyorg_lst($orgid)",
    UFN_DOMAIN_LST_VALORES: "SELECT * FROM ufn_domain_lst_valores($corpid,$orgid,$domainname)
}