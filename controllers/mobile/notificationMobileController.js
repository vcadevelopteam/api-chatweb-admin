var admin = require("firebase-admin");
var serviceAccount = require("../../zyxmeapp.json");

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
        console.log("body-notification", { data, notification })

        const token = data.token;
        delete data.token;

        for (const [key, value] of Object.entries(data))
            data[key] = value === null ? "" : value.toString();

        data.click_action = "FLUTTER_NOTIFICATION_CLICK";

        const result = [];

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
                // apns,
                // content_available: true,
                data,
                // android: {
                //     priority: "high"
                // },
                // priority: 10,
            })
                .then(r => {
                    console.log('notification 2 send', r);
                    result.push({ ...r, success: true })
                })
                .catch(r => {
                    console.log("error catch 2: ", r);
                    result.push({ ...r, success: false })
                })
        ]

        res.json(result);
    }
    catch (ee) {
        console.log(ee);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}

exports.pushNotification = (datatmp) => {
    try {
        const { data, notification } = datatmp;
        console.log("body-notification", { data, notification })

        const token = data.token;
        delete data.token;

        for (const [key, value] of Object.entries(data))
            data[key] = value === null ? "" : value + "";

        data.click_action = "FLUTTER_NOTIFICATION_CLICK";

        const result = [];

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
                    result.push({ ...r, success: true })
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
                    result.push({ ...r, success: true })
                })
                .catch(r => {
                    console.log("error catch 2: ", r);
                    result.push({ ...r, success: false })

                })
        ])
    }
    catch (ee) {
        console.log(ee);
    }
}
