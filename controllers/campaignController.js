const voximplant = require("../config/voximplantfunctions");
const { executesimpletransaction } = require('../config/triggerfunctions');
const { setSessionParameters, buildcsv } = require('../config/helpers');

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

        if (campaignData[0].status === 'ACTIVO') {
            switch (campaignData[0].communicationchanneltype) {
                case 'VOXI':
                    const campaignmemberData = await executesimpletransaction("QUERY_CAMPAIGNMEMBER_SEL", {
                        corpid: req.body.corpid,
                        orgid: req.body.orgid,
                        campaignid: req.body.campaignid
                    });
                    let data = campaignmemberData.map(d => {
                        let message = campaignData[0].message;
                        Object.keys(d).forEach(k => {
                            message = message.replace(`{{${k}}}`, d[k])
                        })
                        return {...d, message}
                    })
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
                    
                    let callListResult = await voximplant.createManualCallList(req.body)
                    if (callListResult?.result) 
                    {
                        req.body['list_id'] = callListResult?.list_id;
                        let callTaskResult = await voximplant.startNextCallTask(req.body)
                        if (callTaskResult?.result) {
                            await executesimpletransaction("QUERY_CAMPAIGN_START", {
                                corpid: req.body.corpid,
                                orgid: req.body.orgid,
                                campaignid: req.body.campaignid,
                                taskid: callTaskResult?.list_id
                            });
                            result = [callTaskResult?.list_id];
                        }
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