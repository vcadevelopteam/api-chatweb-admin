const { executesimpletransaction } = require('../config/triggerfunctions');
const { getErrorCode, errors, axiosObservable } = require('../config/helpers');

const method_allowed = [
    "UFN_PERSONS_BY_CATEGORY_SEL",
    "UFN_LIST_PERSONS_BY_CATEGORY_SEL",
]

const laraigoEndpoint = process.env.LARAIGO;

exports.Collection = async (req, res) => {
    const { parameters = {}, method } = req.body;

    if (!method_allowed.includes(method)) {
        const resError = getErrorCode(errors.FORBIDDEN);
        return res.status(resError.rescode).json(resError);
    }

    parameters._requestid = req._requestid;

    const result = await executesimpletransaction(method, parameters);
    if (!result.error) {
        return res.json({ error: false, success: true, data: result });
    }
    else
        return res.status(result.rescode).json(({ ...result }));

}

exports.sendHSMcontactos = async (req, res) => {
    const { parameters = {} } = req.body;
    
    const saa = {
        type:"image",
        text: parameters.url
    }
    const result = await executesimpletransaction("UFN_LIST_PERSONS_BY_CATEGORY_SEL", parameters);
    const resultLista = await result.json();
    const contactos = resultLista.data;
    
    const responseservices = await axiosObservable({
        method: "post",
        url: `${process.env.SERVICES}handler/external/sendhsm`,
        data: {
            "Corpid": parameters.corpid,
            "Orgid": parameters.orgid,
            "TransactionId": null,
            "CampaignName": null,
            "HsmTemplateId": parameters.HsmTemplateId,
            "Username": "laraigo.acme@vcaperu.com",
            "Origin": "OUTBOUND",
            "CommunicationChannelId": parameters.CommunicationChannelId,
            "ShippingReason": "INBOX",
            "ListMembers": contactos.map(x=>{return {
                       "Phone": x.phone,
                       "header": saa,
                       "Firstname": x.firstname,
                       "Lastname": x.lastname,
                       "Parameters": [
                           {
                               "Type": "text",
                               "Text": text,
                               "Name": "1"
                           }
                       ],
                   }})
        },
        //_requestid: req._requestid,
    });
    return responseservices.json({ success: true });
}