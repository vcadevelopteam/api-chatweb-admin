module.exports = {
    QUERY_AUTHENTICATED: "select us.userid, us.usr, us.doctype, us.docnum, us.pwd, us.firstname, us.lastname, us.email, us.status, us.company from usr us where us.usr = $usr",
    CHATWEBAPPLICATION_SEL: "select * from ufn_chatwebapplication_sel($applicationid)",
    UFN_CHATWEBAPPLICATION_INS: "select * from ufn_chatwebapplication_ins( $id, $userid, $name, $operation, $description, $type, $status, $username, $key)",
    UFN_CHATWEBINTEGRATION_INS: "select * from ufn_chatwebintegration_ins($chatwebapplicationid, $name, $id, $operation, $description, $type, $status, $username)",
    UFN_CHATWEBINTEGRATION_APP_SEL: "select * from ufn_chatwebintegration_app_sel($applicationid)",
    UFN_INTEGRATION_INS: "select * from ufn_integration_ins($chatwebapplicationid, $name, $id, $operation, $description, $type, $status, $username, $color, $form, $icons)"
}