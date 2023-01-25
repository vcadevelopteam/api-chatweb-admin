const admin = require("firebase-admin");
const serviceAccount = require("../../zyxmeapp.json");
const { getErrorCode } = require('../../config/helpers');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://zyxmeappmovil.firebaseio.com"
});

const apns = {
    headers: {
        "apns-priority": "5"
    }
};

exports.messagein = async (req, res) => {
    try {
        const { data, notification } = req.body;

        const token = data.token;
        delete data.token;

        for (const [key, value] of Object.entries(data))
            data[key] = value === null ? "" : value.toString();

        data.click_action = "FLUTTER_NOTIFICATION_CLICK";


        await Promise.all[
            admin.messaging().send({
                token,
                notification,
                apns,
                android: {
                    priority: "high"
                },
                data,
            })
                .then(r => {
                    console.log('notification 1 send', r);
                })
                .catch(r => {
                    console.log("error catch 1: ", r);
                }),
            admin.messaging().send({
                token,
                data,
            })
                .then(r => {
                    console.log('notification 2 send', r);
                })
                .catch(r => {
                    console.log("error catch 2: ", r);
                })
        ]

        res.json(result);
    }
    catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}

exports.pushNotification = (datatmp) => {
    try {
        const { data, notification } = datatmp;

        const token = data.token;
        delete data.token;

        for (const [key, value] of Object.entries(data))
            data[key] = value === null ? "" : value + "";

        data.click_action = "FLUTTER_NOTIFICATION_CLICK";

        Promise.all([
            admin.messaging().send({
                token,
                notification,
                apns,
                android: {
                    priority: "high"
                },
                data,
            })
                .then(r => {
                    console.log('notification 11 send', r);
                })
                .catch(r => {
                    console.log("error catch 1: ", r);
                }),
            admin.messaging().send({
                token,
                // notification,
                // apns,
                data
            })
                .then(r => {
                    console.log('notification 22 send', r);
                })
                .catch(r => {
                    console.log("error catch 2: ", r);

                })
        ])
    }
    catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}
