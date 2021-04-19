module.exports = {
    QUERY_AUTHENTICATED: "select us.userid, us.usr, us.doctype, us.docnum, us.pwd, us.firstname, us.lastname, us.email, us.status, us.company, ou.orgid, org.description orgname from usr us left join orguser ou on ou.userid = us.userid left join org org on org.orgid = ou.orgid where us.usr = $usr and (ou.bydefault = true or ou.bydefault is null)",
    CHATWEBAPPLICATION_SEL: "select * from ufn_chatwebapplication_sel($orgid,$applicationid)",
    UFN_CHATWEBAPPLICATION_INS: "select * from ufn_chatwebapplication_ins($orgid, $id, $name, $operation, $description, $type, $status, $username, $apikey)",
    UFN_CHATWEBINTEGRATION_INS: "select * from ufn_chatwebintegration_ins($chatwebapplicationid, $name, $id, $operation, $description, $type, $status, $username)",
    UFN_CHATWEBINTEGRATION_APP_SEL: "select * from ufn_chatwebintegration_app_sel($applicationid)",
}