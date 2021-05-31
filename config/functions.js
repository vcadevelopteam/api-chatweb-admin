module.exports = {
    QUERY_AUTHENTICATED: "select us.userid, us.usr, us.pwd, us.firstname, us.lastname, us.email, us.status from usr us where us.usr = $usr",
    CHATWEBAPPLICATION_SEL: "select * from ufn_chatwebapplication_sel($applicationid, $userid)",
    UFN_CHATWEBAPPLICATION_INS: "select * from ufn_chatwebapplication_ins( $id, $userid, $name, $operation, $description, $type, $status, $username, $key)",
    UFN_CHATWEBINTEGRATION_INS: "select * from ufn_chatwebintegration_ins($chatwebapplicationid, $name, $id, $operation, $description, $type, $status, $username)",
    UFN_CHATWEBINTEGRATION_APP_SEL: "select * from ufn_chatwebintegration_app_sel($applicationid, $userid)",
    UFN_INTEGRATION_INS: "select * from ufn_integration_ins($chatwebapplicationid, $name, $id, $operation, $description, $type, $status, $username, $color, $form, $icons, $other)",
    UFN_CHATWEBINTEGRATION_SEL: "select * from ufn_chatwebintegration_sel($integrationid)",
    UFN_CHATWEBHOOK_SEL: "select * from ufn_chatwebhook_sel($integrationid)",
    UFN_INTEGRATION_KEY_UPD: "update chatwebintegration set integrationkey = $integration where chatwebintegrationid = $integrationid",
    UFN_CHATWEBHOOK_INS: 'select * from ufn_chatwebhook_ins($chatwebintegrationid, $chatwebhookid, $name, $target, $trigger, $operation, $description, $type, $status, $username)',
    UFN_CHATWEBAPIKEY_INS: 'select * from ufn_chatwebapikey_ins($chatwebintegrationid, $id, $name, $key, $operation, $description, $type, $status, $username, $idmongo)',
    UFN_USER_INS: 'select * from ufn_user_ins($pwd, $id, $status, $type, $usr, $firstname, $lastname, $email, $operation, $username)',
    UFN_USER_SEL: 'select * from ufn_user_sel($userid)'
}