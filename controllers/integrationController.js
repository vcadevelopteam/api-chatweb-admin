const triggerfunctions = require('../config/triggerfunctions');;
const axios = require('axios')

const urlBroker = "https://goo.zyxmeapp.com/api/";

exports.Save = async (req, res) => {
    try {
        const { data = {}, method } = req.body;

        if (!data.orgid)
            data.orgid = req.usuario.orgid ? req.usuario.orgid : 1;
        if (!data.username)
            data.username = req.usuario.usr;
        if (!data.userid)
            data.userid = req.usuario.userid;

        const result = await triggerfunctions.executesimpletransaction(method, data);

        if (result instanceof Array) {
            const integrationid = result[0].p_chatwebintegrationid;
            const datatosend = {
                name: data.name,
                type: data.type,
                status: data.status,
                metadata: {
                    integrationid,
                    applicationid: data.chatwebapplicationid,
                    color: data.color ? JSON.parse(data.color) : {},
                    form: data.form ? JSON.parse(data.form) : [],
                    icons: data.icons ? JSON.parse(data.icons) : {}
                },
                applicationId: "" + data.chatwebapplicationid
            }
            if (data.id === 0) {
                try {
                    const response = await axios({
                        url: `${urlBroker}integrations/save`,
                        method: 'post',
                        data: datatosend
                    });
                    const integrationkey = response.data.id;
                    await triggerfunctions.executesimpletransaction("UFN_INTEGRATION_KEY_UPD", { integrationid, integrationkey });
                    console.log(response);
                } catch (error) {
                    console.log(error);
                }
            } else {
                try {
                    await axios({
                        url: `${urlBroker}integrations/update/${data.integrationkey}`,
                        method: 'put',
                        data: datatosend
                    });
                } catch (error) {
                    console.log(error);                    
                }
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