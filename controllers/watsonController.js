const logger = require("../config/winston");
const { setSessionParameters } = require("../config/helpers");
const {
    getConnectorConfiguration,
    getSkillInformation,
    getSkillConfiguration,
    insertSkill,
    getAssistantConfiguration,
    getWatsonConfiguration,
    tryitModel,
    insertIntentionItem,
    syncIntentionItem,
    syncEntityItem,
} = require("../services/watsonService");

exports.sync = async (req, res) => {
    const { watsonid } = req.params;

    let connector = await getConnectorConfiguration(req._requestid, watsonid);
    if (connector.error) return res.status(connector.status).json(connector);

    let skill = await getSkillInformation(req._requestid, connector.data);
    if (skill.error) return res.status(skill.status).json(skill);

    const [assistant, skillInfo] = skill.data;

    const skillData = await getSkillConfiguration(req._requestid, assistant, skillInfo);
    if (skillData.error) return res.status(skillData.status).json(skillData);

    const insert = await insertSkill(req._requestid, skillInfo, skillData.data, connector.data);
    if (insert.error) return res.status(insert.status).json(insert);

    return res.status(200).json(insert);
};

exports.tryit = async (req, res) => {
    const { watsonid, text } = req.body;

    let connector = await getWatsonConfiguration(req._requestid, watsonid);
    if (connector.error) return res.status(connector.status).json(connector);

    const assistant = await getAssistantConfiguration(req._requestid, connector.data);
    if (assistant.error) return res.status(assistant.status).json(assistant);

    const response = await tryitModel(req._requestid, connector.data, assistant.data, text);
    if (response.error) return res.status(response.status).json(response);

    return res.status(200).json(response);
};

exports.createIntent = async (req, res) => {
    try {
        const parameters = req.body;
        setSessionParameters(parameters, req.user, req._requestid);

        let connector = await getWatsonConfiguration(parameters._requestid, parameters.watsonid);
        if (connector.error) return res.status(connector.status).json(connector);

        insertData = await insertIntentionItem(parameters._requestid, parameters, 'intention');
        if (insertData.error) return res.status(insertData.status).json(insertData);

        const assistant = await getAssistantConfiguration(req._requestid, connector.data);
        if (assistant.error) return res.status(assistant.status).json(assistant);

        const syncData = await syncIntentionItem(req._requestid, assistant.data, connector.data, parameters);
        if (syncData.error) return res.status(syncData.status).json(syncData);

        return res.status(200).json(syncData);
    } catch (error) {
        logger.child({ _requestid: requestid, ctx: parameters }).error(error);
        return res
            .status(500)
            .json({ success: false, error: true, id: req._requestid, message: "Error creating the intent." });
    }
};

exports.createEntity = async (req, res) => {
    try {
        const parameters = req.body;
        setSessionParameters(parameters, req.user, req._requestid);

        let connector = await getWatsonConfiguration(parameters._requestid, parameters.watsonid);
        if (connector.error) return res.status(connector.status).json(connector);

        insertData = await insertIntentionItem(parameters._requestid, parameters, 'entity');
        if (insertData.error) return res.status(insertData.status).json(insertData);

        const assistant = await getAssistantConfiguration(req._requestid, connector.data);
        if (assistant.error) return res.status(assistant.status).json(assistant);

        const syncData = await syncEntityItem(req._requestid, assistant.data, connector.data, parameters);
        if (syncData.error) return res.status(syncData.status).json(syncData);

        return res.status(200).json(syncData);
    } catch (error) {
        logger.child({ _requestid: requestid, ctx: parameters }).error(error);
        return res
            .status(500)
            .json({ success: false, error: true, id: req._requestid, message: "Error creating the entity." });
    }
};
