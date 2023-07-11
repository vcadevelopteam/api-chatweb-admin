const admin = require("firebase-admin");
const serviceAccount = require("../zyxmeapp.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://zyxmeappmovil.firebaseio.com"
});

const apns = {
    headers: {
        "apns-priority": "5"
    }
};

exports.loginGroup = async (token, orgid, userid, _requestid) => {
    await admin.messaging().unsubscribeFromTopic(token, null)
        .then(r => r)
        .catch(function (error) {
            logger.child({ _requestid, error: { detail: error.stack || error, message: error.toString() } }).error(`Error to EXIT all group, userid: ${userid}`);
        });
    await admin.messaging().subscribeToTopic(token, `org-${orgid}`)
        .then(r => r)
        .catch(function (error) {
            logger.child({ _requestid, error: { detail: error.stack || error, message: error.toString() } }).error(`Error to JOIN group org-${orgid}, userid: ${userid}`);
        });
}

exports.exitFromAllGroup = async (token, orgid) => {
    await admin.messaging().subscribeToTopic(token, null)
        .then(r => r)
        .catch(function (error) {
            logger.child({ _requestid, error: { detail: error.stack || error, message: error.toString() } }).error(`Error to EXIT all group, userid: ${userid}`);
        });
}