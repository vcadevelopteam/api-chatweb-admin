const admin = require("firebase-admin");
const serviceAccount = require("../bodegueros.json");
const logger = require("./winston");
const { axiosObservable } = require("./helpers");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});


const apns = {
    headers: {
        "apns-priority": "5",
    },
};

exports.loginGroup = async (token, orgid, userid, _requestid) => {
    await exitFromAllGroup(token, _requestid);
    await admin
        .messaging()
        .subscribeToTopic(token, `org-${orgid}`)
        .then((r) => {
            console.log("exito2", r);
        })
        .catch(function (error) {
            logger
                .child({ _requestid, error: { detail: error.stack || error, message: error.toString() } })
                .error(`Error to JOIN group org-${orgid}, userid: ${userid}`);
        });
};

const exitFromAllGroup = async (token, _requestid) => {
    try {
        const responseservices = await axiosObservable({
            method: "get",
            url: `https://iid.googleapis.com/iid/info/${token}?details=true`,
            _requestid,
            headers: {
                Authorization: `key = ${process.env.KEY_FIREBASE}`,
            },
        });
        if (responseservices.data.rel?.topics) {
            await Promise.all(
                Object.keys(responseservices.data.rel?.topics).map((x) =>
                    admin.messaging().unsubscribeFromTopic(token, x)
                )
            );
        }
    } catch (error) {}
};

exports.exitFromAllGroup1 = async (token, _requestid) => {
    await exitFromAllGroup(token, _requestid);
};

exports.pushNotification = (datatmp, topic = "") => {
    try {
        const { data, notification } = datatmp;

        // const token = data.token;
        // delete data.token;

        for (const [key, value] of Object.entries(data)) data[key] = value === null ? "" : value + "";

        data.click_action = "FLUTTER_NOTIFICATION_CLICK";

        Promise.all([
            admin
                .messaging()
                .send({
                    topic,
                    apns,
                    android: {
                        priority: "high",
                    },
                    data,
                })
                .then((r) => {
                    console.log("notification 11 send", r);
                })
                .catch((r) => {
                    console.log("error catch 1: ", r);
                }),
            // admin.messaging().send({
            //     token,
            //     // notification,
            //     // apns,
            //     data
            // })
            //     .then(r => {
            //         console.log('notification 22 send', r);
            //     })
            //     .catch(r => {
            //         console.log("error catch 2: ", r);

            //     })
        ]);
    } catch (exception) {
        console.log("🚀 ~ exception:", exception);
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
};
