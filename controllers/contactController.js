const { executesimpletransaction, executeTransaction } = require("../config/triggerfunctions");
const { getErrorCode, errors, axiosObservable } = require("../config/helpers");

const method_allowed = [
    "UFN_PERSONS_BY_CATEGORY_SEL",
    "UFN_LIST_PERSONS_BY_CATEGORY_SEL",
    "UFN_PERSONS_FREQUENT_SEL",
    "UFN_LIST_PERSONS_FREQUENT_SEL",
    "UFN_PERSONS_BY_BRAND_SEL",
    "UFN_LIST_PERSONS_BY_BRAND_SEL",
    "UFN_TOTAL_PERSONS_BY_CATEGORY_BRAND_SEL",
    "UFN_LIST_PERSONS_BY_ORG_SEL",
    "QUERY_GET_MESSAGETEMPLATE",
];

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
    } else return res.status(result.rescode).json({ ...result });
};

exports.sendHSMcontactos = async (req, res) => {
    try {
        const { parameters = {} } = req.body;

        const templateData = await executesimpletransaction("UFN_API_MESSAGETEMPLATE_SEL", {
            corpid: parameters.corpid,
            orgid: parameters.orgid,
            id: parameters.HsmTemplateId,
        });

        if (!(templateData instanceof Array)) {
            return res.status(500).json(getErrorCode(insertData.code || "UNEXPECTED_ERROR"));
        }

        const body = templateData[0].body.replace(/\{\{1\}\}/g, "{{field2}}").replace(/\{\{2\}\}/g, "{{field3}}");
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 1);

        const insertData = await executesimpletransaction("UFN_CAMPAIGN_INS", {
            corpid: parameters.corpid,
            orgid: parameters.orgid,
            id: 0,
            communicationchannelid: parameters.CommunicationChannelId,
            usergroup: "",
            type: "HSM",
            status: "ACTIVO",
            title: `campaing_contactos_${new Date().getTime()}`,
            description: "campaing_contactos",
            subject: "",
            message: body,
            startdate: startDate.toISOString().split("T")[0],
            enddate: endDate.toISOString().split("T")[0],
            repeatable: false,
            frecuency: 0,
            messagetemplateid: templateData[0].id,
            messagetemplatename: templateData[0].name,
            messagetemplatenamespace: templateData[0].namespace,
            messagetemplateheader: JSON.stringify({ type: templateData[0].headertype, value: templateData[0].header }),
            messagetemplatebuttons: JSON.stringify(templateData[0].buttons),
            executiontype: "MANUAL",
            batchjson: "[]",
            fields: JSON.stringify({
                primarykey: "phone",
                column: [false, true, true],
                columns: ["title", "price"],
                firstname: "",
                lastname: "",
            }),
            messagetemplatefooter: null,
            messagetemplatetype: templateData[0].templatetype,
            messagetemplateattachment: null,
            source: "EXTERNAL",
            messagetemplatelanguage: templateData[0].language,
            messagetemplatepriority: templateData[0].priority,
            username: "admin",
            operation: "INSERT",
        });

        if (!(insertData instanceof Array)) {
            return res.status(500).json(getErrorCode(insertData.code || "UNEXPECTED_ERROR"));
        }

        const detail = parameters.contacts.map((item) => ({
            method: "UFN_CAMPAIGNMEMBER_INS",
            parameters: {
                corpid: parameters.corpid,
                orgid: parameters.orgid,
                batchindex: 0,
                campaignid: insertData[0].p_campaignid,
                displayname: "",
                field1: item.phone,
                field2: parameters.text,
                field3: parameters.variable1,
                field4: "",
                field5: "",
                field6: "",
                field7: "",
                field8: "",
                field9: "",
                field10: "",
                field11: "",
                field12: "",
                field13: "",
                field14: "",
                field15: "",
                id: 0,
                operation: "INSERT",
                personcommunicationchannel: "",
                personcommunicationchannelowner: item.phone,
                personid: 0,
                status: "ACTIVO",
                type: "EXTERNAL",
            },
        }));

        const result = await executeTransaction(null, detail);
        if (result.error) return res.status(result.rescode).json({ ...result });

        const executeCampaign = await executesimpletransaction("UFN_CAMPAIGN_START", {
            corpid: parameters.corpid,
            orgid: parameters.orgid,
            id: insertData[0].p_campaignid,
            offset: -5,
        });

        if (!(executeCampaign instanceof Array)) {
            return res.status(500).json(getErrorCode(executeCampaign.code || "UNEXPECTED_ERROR"));
        }

        return res.json({ error: false, success: true });
    } catch (e) {
        console.log({ e });
        return res.json({ error: true, success: false });
    }
};

exports.sendHSMcontactosbq = async (req, res) => {
    try {
        const { parameters = {} } = req.body;

        const saa = {
            type: "image",
            text: parameters.url,
        };
        function combineWithoutDuplicates(list1, list2) {
            const combinedList = [...list1];

            list2.forEach((obj2) => {
                if (!combinedList.some((obj1) => isEqual(obj1, obj2))) {
                    combinedList.push(obj2);
                }
            });

            return combinedList;
        }

        // Helper function to check object equality
        function isEqual(obj1, obj2) {
            return JSON.stringify(obj1) === JSON.stringify(obj2);
        }

        let contactos = [];
        if (!!parameters?.contacts?.length) {
            contactos = parameters.contacts;
        } else {
            const resultCategory = await executesimpletransaction("UFN_LIST_PERSONS_BY_CATEGORY_SEL", parameters);
            const resultBrand = await executesimpletransaction("UFN_LIST_PERSONS_BY_BRAND_SEL", parameters);
            contactos = combineWithoutDuplicates(resultCategory, resultBrand);
        }

        const responseservices = await axiosObservable({
            method: "post",
            url: `${process.env.SERVICES}handler/external/sendhsm`,
            data: {
                Corpid: parameters.corpid,
                Orgid: parameters.orgid,
                TransactionId: null,
                CampaignName: null,
                HsmTemplateId: parameters.HsmTemplateId,
                Username: "laraigo.acme@vcaperu.com",
                Origin: "OUTBOUND",
                CommunicationChannelId: parameters.CommunicationChannelId,
                ShippingReason: "INBOX",
                ListMembers: contactos.map((x) => {
                    return {
                        Phone: x.phone,
                        header: saa,
                        Firstname: x.firstname,
                        Lastname: x.lastname,
                        Parameters: [
                            {
                                Type: "text",
                                Text: parameters.text,
                                Name: "1",
                            },
                        ],
                    };
                }),
            },
            //_requestid: req._requestid,
        });
        return res.json({ error: false, success: true });
    } catch (e) {
        return res.json({ error: true, success: false });
    }
};
