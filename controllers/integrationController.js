const axios = require('axios');
const triggerFunctions = require('../config/triggerfunctions');

const URLBROKER = "https://goo.zyxmeapp.com/api/";

const triggerGenerateApikey = async (data) => {
    const responseCreateApikey = await axios({
        url: `${URLBROKER}plugins/save`,
        method: 'post',
        data: {
            name: data.name,
            integration: data.integrationkey,
            status: 'ACTIVO'
        }
    });
    const { apiKey: apikey, id: apikeyid } = responseCreateApikey.data;
    console.log("plugoin", responseCreateApikey.data);

    const datatobd = {
        chatwebintegrationid: data.integrationid,
        id: 0,
        name: data.name,
        key: apikey,
        operation: "INSERT",
        description: "",
        type: "NINGUNO",
        status: "ACTIVO",
        username: data.username,
        idmongo: apikeyid
    }

    const rr = await triggerFunctions.executesimpletransaction("UFN_CHATWEBAPIKEY_INS", datatobd);
    if (!rr instanceof Array) {
        console.log(rr);
        throw 'Error al insertar'
    }
    return { apikey, apikeyid };
}

const triggerSaveWebhook = async (data, x) => {
    const dataInsWebhook = {
        name: "webhook" + data.integrationid,
        description: "webhook" + data.integrationid,
        integration: data.integrationkey,
        webUrl: x.target,
        status: x.status
    }
    const rBroker = await axios({
        url: x.operation === "INSERT" ? `${URLBROKER}webhooks/save` : `${URLBROKER}webhooks/update/${x.trigger}`,
        method: x.operation === "INSERT" ? "post" : "put",
        data: dataInsWebhook
    });
    const datapostgres = {
        ...x,
        username: data.username,
        chatwebintegrationid: data.integrationid,
        trigger: rBroker.data.id
    }
    const rr = await triggerFunctions.executesimpletransaction("UFN_CHATWEBHOOK_INS", datapostgres)

    return datapostgres;
}

exports.Save = async (req, res) => {
    try {
        const { data = {}, method, webhooks } = req.body;
        if (!data.orgid)
            data.orgid = req.usuario.orgid ? req.usuario.orgid : 1;
        if (!data.username)
            data.username = req.usuario.usr;
        if (!data.userid)
            data.userid = req.usuario.userid;

        const result = await triggerFunctions.executesimpletransaction(method, data);

        if (result instanceof Array) {
            const integrationid = result[0].p_chatwebintegrationid;
            data.integrationid = integrationid;
            const icons = data.icons ? JSON.parse(data.icons) : {};

            const datatosend = {
                name: data.name,
                type: data.type,
                status: data.status,
                metadata: {
                    integrationid,
                    applicationid: data.chatwebapplicationid,
                    color: data.color ? JSON.parse(data.color) : {},
                    form: data.form ? JSON.parse(data.form) : [],
                    extra: data.other ? JSON.parse(data.other) : [],
                    icons: {
                        chatHeaderImage: icons.chatHeaderImage,
                        chatBotImage: icons.chatBotImage,
                        chatOpenImage: icons.chatOpenImage
                    },
                    personalization: {
                        headerTitle: icons.headerTitle,
                        headerSubTitle: icons.headerSubTitle
                    }
                },
                applicationId: "" + data.chatwebapplicationid
            }
            if (data.id === 0) {
                try {
                    const responseCreateIntegration = await axios({
                        url: `${URLBROKER}integrations/save`,
                        method: 'post',
                        data: datatosend
                    });
                    data.integrationkey = responseCreateIntegration.data.id;
                    console.log(data);
                    //Actualizar la integración con el idintegration de mongo, y generar el apikey
                    await Promise.all([
                        triggerFunctions.executesimpletransaction("UFN_INTEGRATION_KEY_UPD", data),
                        triggerGenerateApikey(data)
                    ]);
                } catch (error) { }
            } else {
                try {
                    await axios({
                        url: `${URLBROKER}integrations/update/${data.integrationkey}`,
                        method: 'put',
                        data: datatosend
                    });
                } catch (error) { }
            }

            if (webhooks.length > 0) {
                const InsertBrokerWebhooks = webhooks.map(x => triggerSaveWebhook(data, x));

                const resultwebhooks = await Promise.all(InsertBrokerWebhooks);
            }
            return res.json(result);
        }
        else
            return res.status(500).json(result);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}

exports.IntegrationZyxme = async (req, res) => {
    try {
        const data = req.body;
        data.description = "";
        data.type = "NINGUNO";
        data.username = "zyxmeadmin";
        data.userid = 1;
        data.id = 0;

        let apikey = "";
        //required applicationname, integrationkey, webhook
        const resultApplication = await triggerFunctions.executesimpletransaction("QUERY_SEARCH_APPLICATION", data);
        console.log(resultApplication);
        if (!resultApplication instanceof Array || resultApplication.length === 0) {
            return res.json({
                success: false,
                msg: "No existe la aplicación."
            });
        }

        data.chatwebapplicationid = resultApplication[0].chatwebapplicationid;

        if (data.integrationkey) {
            const resultIntegration = await triggerFunctions.executesimpletransaction("QUERY_INTEGRATION_BY_KEY", data);
            if (!resultIntegration instanceof Array || resultIntegration.length === 0) {
                return res.json({
                    success: false,
                    msg: "No existe esa integrationkey."
                });
            }
            data.id = resultIntegration[0].chatwebintegrationid;
        }

        const result = await triggerFunctions.executesimpletransaction("UFN_INTEGRATION_INS", data);

        if (result instanceof Array) {
            const integrationid = result[0].p_chatwebintegrationid;
            data.integrationid = integrationid;
            const icons = data.icons ? JSON.parse(data.icons) : {};

            const datatosend = {
                name: data.name,
                type: data.type,
                status: data.status,
                metadata: {
                    integrationid,
                    applicationid: data.chatwebapplicationid,
                    color: data.color ? JSON.parse(data.color) : {},
                    form: data.form ? JSON.parse(data.form) : [],
                    extra: data.other ? JSON.parse(data.other) : [],
                    icons: {
                        chatHeaderImage: icons.chatHeaderImage,
                        chatBotImage: icons.chatBotImage,
                        chatOpenImage: icons.chatOpenImage
                    },
                    personalization: {
                        headerTitle: icons.headerTitle,
                        headerSubTitle: icons.headerSubTitle
                    }
                },
                applicationId: "" + data.chatwebapplicationid
            }
            let pluginapikey = ""
            let pluginid = ""
            if (data.id === 0) {
                try {
                    const responseCreateIntegration = await axios({
                        url: `${URLBROKER}integrations/save`,
                        method: 'post',
                        data: datatosend
                    });
                    data.integrationkey = responseCreateIntegration.data.id;

                    //Actualizar la integración con el idintegration de mongo, y generar el apikey
                    await Promise.all([
                        triggerFunctions.executesimpletransaction("UFN_INTEGRATION_KEY_UPD", { integrationid, integrationkey: data.integrationkey }),
                        triggerGenerateApikey(data)
                    ]).then(resx => {
                        pluginapikey = resx[1].apikey
                        apikey = resx[1].apikey
                        pluginid = resx[1].apikeyid
                    });
                } catch (error) { }
            } else {
                try {
                    await axios({
                        url: `${URLBROKER}integrations/update/${data.integrationkey}`,
                        method: 'put',
                        data: datatosend
                    });
                } catch (error) { }
            }
            let webhookid = ''
            if (data.id === 0) {
                const r1 = await triggerSaveWebhook(data, { target: data.webhook, status: 'ACTIVO', operation: 'INSERT', chatwebhookid: 0, name: '', type: 'NINGUNO', description: '', username: data.username });
                webhookid = r1.trigger;
            }
            return res.json({ success: true, integrationkey: data.integrationkey, apikey, webhookid, pluginapikey, pluginid });
        }
        else
            return res.status(500).json(result);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}

exports.GenerateApikey = async (req, res) => {

}

exports.AddToDatabase = async (request, result) => {
    try {
        const webChatParameters = request.body;

        webChatParameters.applicationname = 'LARAIGO';

        const transactionGetApplication = await triggerFunctions.executesimpletransaction("QUERY_SEARCH_APPLICATION", webChatParameters);

        if (!transactionGetApplication instanceof Array || transactionGetApplication.length === 0) {
            return transactionInsertApplication.json({
                msg: "Application not found",
                success: false
            });
        }

        var webChatMetadata = JSON.parse(webChatParameters.channelparameters);

        webChatData = {
            chatwebapplicationid: transactionGetApplication[0].chatwebapplicationid,
            color: JSON.stringify(webChatMetadata.metadata.color),
            description: webChatParameters.description,
            form: JSON.stringify(webChatMetadata.metadata.form),
            id: 0,
            icons: JSON.stringify(webChatMetadata.metadata.icons),
            name: webChatParameters.description,
            other: JSON.stringify(webChatMetadata.metadata.extra),
            status: webChatParameters.status,
            type: webChatParameters.type,
            username: webChatParameters.username
        };

        const transactionInsertApplication = await triggerFunctions.executesimpletransaction("UFN_INTEGRATION_INS", webChatData);

        if (transactionInsertApplication instanceof Array) {
            return transactionInsertApplication.json({
                apikey: webChatParameters.apikey,
                integrationkey: webChatParameters.integrationid,
                pluginapikey: webChatParameters.apikey,
                pluginid: webChatParameters.communicationchannelcontact,
                success: true,
                webhookid:webChatParameters.communicationchannelowner
            });
        }
        else {
            return transactionInsertApplication.status(400).json(transactionInsertApplication);
        }
    }
    catch (exception) {
        return result.status(500).json({
            msg: exception.message,
            success: false
        });
    }
}