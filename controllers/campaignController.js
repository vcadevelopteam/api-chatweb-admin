const voximplant = require("../config/voximplantfunctions");
const { executesimpletransaction } = require('../config/triggerfunctions');
const { setSessionParameters, getErrorCode, buildcsv } = require('../config/helpers');
const logger = require('../config/winston');

exports.voxiTrigger = async (req, res) => {
    try {
        const { corpid, orgid, data, campaignid, communicationchannelid } = req.body;

        logger.child({ context: { corpid, orgid, communicationchannelid, data, campaignid }, _requestid: req._requestid }).debug(`Request to ${req.originalUrl}`)

        const voxinumber = await executesimpletransaction("QUERY_GET_NUMBER_FROM_COMMUNICATIONCHANNEL", { corpid, orgid, communicationchannelid });

        const csv = buildcsv(data.map((d) => ({
            ...d,
            caller_id: voxinumber[0].communicationchannelsite,
            __start_execution_time: '00:00:00',
            __end_execution_time: '23:59:59',
            __start_at: Math.trunc(new Date().getTime() / 1000)
        })));

        let result = undefined;

        const bodyToSend = {
            name: `${corpid}-${orgid}-${campaignid}-${new Date().toISOString()}`,
            file_content: csv
        };

        // Try to get information of VOXI in org table
        const voxiorgdata = await executesimpletransaction("QUERY_GET_VOXIMPLANT_ORG", { corpid, orgid });
        
        // If exists info of VOXI in org
        if (voxiorgdata instanceof Array && voxiorgdata.length > 0) {
            bodyToSend['account_id'] = voxiorgdata[0].voximplantaccountid;
            bodyToSend['child_apikey'] = voxiorgdata[0].voximplantapikey;
            bodyToSend['application_id'] = voxiorgdata[0].voximplantapplicationid;
            bodyToSend['rule_id'] = voxiorgdata[0].voximplantcampaignruleid;
        }

        let callListResult = await voximplant.createCallList(req.body)
        if (callListResult?.result) {
            bodyToSend['list_id'] = callListResult?.list_id;
            // await executesimpletransaction("QUERY_CAMPAIGN_START", {
            //     corpid: req.body.corpid,
            //     orgid: req.body.orgid,
            //     campaignid: req.body.campaignid,
            //     taskid: callListResult?.list_id
            // });
            result = [callListResult?.list_id];

            return res.json({ error: false, result });
        }

        return res.json({ error: true });
    }
    catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}

exports.start = async (req, res) => {
    let resultData = {
        code: "error_unexpected_error",
        error: true,
        message: "",
        success: false,
    }
    try {
        if (!req.body.campaignid) {
            return res.status(400).json({
                ...resultData,
                message: 'Invalid campaign'
            });
        }

        setSessionParameters(req.body, req.user);

        const campaignData = await executesimpletransaction("QUERY_CAMPAIGN_SEL", {
            corpid: req.body.corpid,
            orgid: req.body.orgid,
            campaignid: req.body.campaignid
        });

        if (!(campaignData instanceof Array && campaignData.length > 0)) {
            return res.status(400).json({
                ...resultData,
                message: 'Invalid campaign'
            });
        }

        let result = undefined;
        const campaign = campaignData[0];

        if (campaign.status === 'ACTIVO') {
            switch (campaign.communicationchanneltype) {
                case 'VOXI':
                    const batchjson = campaign.batchjson.reduce((acd, cd) => ({
                        ...acd,
                        [cd.batchindex]: Math.trunc(new Date(new Date(`${cd.date} ${cd.time} UTC`) - req.body.offset * 60 * 60 * 1000).getTime() / 1000)
                    }), {});

                    // Crear ticket para cada miembro
                    // Crear campaignhistory para cada miembro

                    const campaignmemberData = await executesimpletransaction("QUERY_CAMPAIGNMEMBER_SEL", {
                        corpid: req.body.corpid,
                        orgid: req.body.orgid,
                        campaignid: req.body.campaignid
                    });

                    let data = campaignmemberData.map((d) => {
                        let message = campaign.message;
                        Object.keys(d).forEach(k => {
                            message = message.replace(`{{${k}}}`, d[k])
                        });
                        return {
                            ...d,
                            message,
                            __start_execution_time: '00:00:00',
                            __end_execution_time: '23:59:59',
                            __start_at: campaign.executiontype === 'SCHEDULED' ? batchjson[d.batchindex] : Math.trunc(new Date().getTime() / 1000)
                        }
                    });
                    let csv = buildcsv(data);

                    // Try to get information of VOXI in org table
                    const voxiorgdata = await executesimpletransaction("QUERY_GET_VOXIMPLANT_ORG", {
                        corpid: req.body.corpid,
                        orgid: req.body.orgid,
                    });

                    // If exists info of VOXI in org
                    if (voxiorgdata instanceof Array && voxiorgdata.length > 0) {
                        req.body['account_id'] = voxiorgdata[0].voximplantaccountid;
                        req.body['child_apikey'] = voxiorgdata[0].voximplantapikey;
                        req.body['application_id'] = voxiorgdata[0].voximplantapplicationid;
                        req.body['rule_id'] = voxiorgdata[0].voximplantcampaignruleid;
                    }

                    req.body['name'] = `${req.body.corpid}-${req.body.orgid}-${req.body.campaignid}-${new Date().toISOString()}`;
                    req.body['file_content'] = csv;

                    let callListResult = await voximplant.createCallList(req.body)
                    if (callListResult?.result) {
                        req.body['list_id'] = callListResult?.list_id;
                        await executesimpletransaction("QUERY_CAMPAIGN_START", {
                            corpid: req.body.corpid,
                            orgid: req.body.orgid,
                            campaignid: req.body.campaignid,
                            taskid: callListResult?.list_id
                        });
                        result = [callListResult?.list_id];
                    }
                    break;
                default:
                    result = await executesimpletransaction("UFN_CAMPAIGN_START", {
                        ...req.body,
                        id: req.body.campaignid
                    }, req.user.menu || {})
                    break;
            }
        }
        if (result instanceof Array)
            return res.json({
                code: "",
                error: false,
                data: result,
                message: "",
                success: true
            });
        else
            return res.status(400).json({
                ...resultData
            })
    }
    catch (err) {
        return res.status(500).json({
            ...resultData,
            message: err.message
        })
    }
}

exports.stop = async (req, res) => {
    let resultData = {
        code: "error_unexpected_error",
        error: true,
        message: "",
        success: false,
    }
    try {
        if (!req.body.campaignid) {
            return res.status(400).json({
                ...resultData,
                message: 'Invalid campaign'
            })
        }

        setSessionParameters(req.body, req.user);

        const campaignData = await executesimpletransaction("QUERY_CAMPAIGN_SEL", {
            corpid: req.body.corpid,
            orgid: req.body.orgid,
            campaignid: req.body.campaignid
        });

        if (!(campaignData instanceof Array && campaignData.length > 0)) {
            return res.status(400).json({
                ...resultData,
                message: 'Invalid campaign'
            })
        }

        let result = undefined;

        if (campaignData[0].status === 'EJECUTANDO') {
            switch (campaignData[0].communicationchanneltype) {
                case 'VOXI':
                    req.body['list_id'] = campaignData[0].taskid;

                    // Try to get information of VOXI in org table
                    const voxiorgdata = await executesimpletransaction("QUERY_GET_VOXIMPLANT_ORG", {
                        corpid: req.body.corpid,
                        orgid: req.body.orgid,
                    });

                    // If exists info of VOXI in org
                    if (voxiorgdata instanceof Array && voxiorgdata.length > 0) {
                        req.body['account_id'] = voxiorgdata[0].voximplantaccountid;
                        req.body['child_apikey'] = voxiorgdata[0].voximplantapikey;
                        req.body['application_id'] = voxiorgdata[0].voximplantapplicationid;
                    }

                    let callListResult = await voximplant.stopCallListProcessing(req.body)
                    console.log(callListResult);
                    result = await executesimpletransaction("QUERY_CAMPAIGN_STOP", {
                        corpid: req.body.corpid,
                        orgid: req.body.orgid,
                        campaignid: req.body.campaignid
                    });
                    break;
                default:
                    result = await executesimpletransaction("UFN_CAMPAIGN_STOP", {
                        ...req.body,
                        campaignid: req.body.campaignid
                    }, req.user.menu || {})
                    break;
            }
        }
        if (result instanceof Array)
            return res.json({
                code: "",
                error: false,
                data: result,
                message: "",
                success: true
            });
        else
            return res.status(400).json({
                ...resultData
            })
    }
    catch (err) {
        return res.status(500).json({
            ...resultData,
            message: err.message
        })
    }
}