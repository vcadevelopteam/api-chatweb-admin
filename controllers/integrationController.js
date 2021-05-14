const tf = require('../config/triggerfunctions');;
const axios = require('axios')

const URLBROKER = "https://goo.zyxmeapp.com/api/";

const triggerGenerateApikey = async (data) => {
    const responseCreateApikey = await axios({
        url: `${URLBROKER}plugins/save`,
        method: 'post',
        data: {
            name: data.name,
            integration: data.integration,
            status: 'ACTIVO'
        }
    });
    const { apiKey: apikey, id: apikeyid } = responseCreateApikey.data;
    
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

    const rr = await tf.executesimpletransaction("UFN_CHATWEBAPIKEY_INS", datatobd);
    if (!rr.success) 
        throw 'Error al insertar'
    console.log(rr);
}
const triggerSaveWebhook = async (data, x) => {
    const dataInsWebhook = {
        name: "webhook" + data.integrationid,
        description: "webhook" + data.integrationid,
        integration: data.integration,
        webUrl: x.target,
        status: x.status
    }
    const rBroker =  await axios({
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
    const rr = await tf.executesimpletransaction("UFN_CHATWEBHOOK_INS", datapostgres)

    console.log(datapostgres);

    return rr;
}

exports.Save = async (req, res) => {
    try {
        const { data = {}, method, webhooks } = req.body;
        // let integration;
        if (!data.orgid)
            data.orgid = req.usuario.orgid ? req.usuario.orgid : 1;
        if (!data.username)
            data.username = req.usuario.usr;
        if (!data.userid)
            data.userid = req.usuario.userid;

        const result = await tf.executesimpletransaction(method, data);

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
                    data.integration = responseCreateIntegration.data.id;
                    
                    //Actualizar la integración con el idintegration de mongo, y generar el apikey
                    await Promise.all([
                        tf.executesimpletransaction("UFN_INTEGRATION_KEY_UPD", { integrationid, integration: data.integration }),
                        triggerGenerateApikey(data)
                    ]);
                } catch (error) { }
            } else {
                data.integration = data.integrationkey;
                try {
                    console.log(datatosend);
                    await axios({
                        url: `${URLBROKER}integrations/update/${data.integration}`,
                        method: 'put',
                        data: datatosend
                    });
                } catch (error) { }
            }

            if (webhooks.length > 0) {
                const InsertBrokerWebhooks = webhooks.map(x => triggerSaveWebhook(data, x));
                
                const resultwebhooks = await Promise.all(InsertBrokerWebhooks);

                console.log(resultwebhooks);
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
exports.GenerateApikey = async (req, res) => {

}
