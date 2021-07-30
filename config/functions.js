module.exports = {
    
    
    QUERY_AUTHENTICATED: "select ous.corpid, ous.orgid, us.userid, us.usr, us.pwd, us.firstname, us.lastname, us.email, us.status from usr us inner join orguser ous on ous.userid = us.userid where us.usr = $usr limit 1",
    UFN_CORP_ORG_SEL: "SELECT * FROM ufn_corp_org_sel($corpid, $id, $username, $all)",
    UFN_CORP_SEL: "SELECT * FROM ufn_corp_sel($corpid, $orgid, $id, $username, $all)",
    UFN_USER_SEL: "SELECT * FROM ufn_user_sel($corpid, $orgid, $id, $username, $all)",
    UFN_ORGUSER_SEL: "SELECT * FROM ufn_orguser_sel($corpid, $orgid, $userid, $username, $all)",
    UFN_ORGUSER_INS: "SELECT * FROM ufn_orguser_ins($corpid, $orgid, $userid, $roleid, $usersupervisor, $bydefault, $labels, $groups, $channels, $status,$type, $defaultsort, $username, $operation, $redirect)",
    UFN_USER_INS: "SELECT * FROM ufn_user_ins($id, $usr, $doctype, $docnum, $pwd, $firstname, $lastname, $email, $pwdchangefirstlogin, $type, $status,$description, $username, $operation, $redirect, $company, $twofactorauthentication)"

}