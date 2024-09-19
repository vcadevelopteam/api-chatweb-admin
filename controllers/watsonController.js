const logger = require("../config/winston");
const { setSessionParameters } = require("../config/helpers");
const {
    getConnectorConfiguration,
    insertSkill,
    getAssistantConfiguration,
    getWatsonConfiguration,
    tryitModel,
    insertIntentionItem,
    syncIntentionItem,
    syncEntityItem,
    deleteItems,
    syncDeletedItem,
    newMentionIns,
    compareWatsonData,
    getWorkspaceInformation,
    insertBulkloadIntent,
    syncAllSkill,
} = require("../services/watsonService");
const { get } = require("../routes/watson");

exports.sync = async (req, res) => {
    try {
        const parameters = req.params;
        setSessionParameters(parameters, req.user, req._requestid);

        const connector = await getConnectorConfiguration(req._requestid, parameters);
        if (connector.error) return res.status(connector.status).json(connector);

        const assistant = await getAssistantConfiguration(req._requestid, connector.data);
        if (assistant.error) return res.status(assistant.status).json(assistant);

        const workspace = await getWorkspaceInformation(req._requestid, assistant.data, connector.data);
        if (workspace.error) return res.status(workspace.status).json(workspace);

        const compare = await compareWatsonData(req._requestid, parameters, assistant, connector.data, workspace.data);
        if (compare.error) return res.status(compare.status).json(compare);

        if (compare.data) {
            const insert = await insertSkill(req._requestid, parameters, workspace.data, connector.data);
            if (insert.error) return res.status(insert.status).json(insert);
        }

        return res
            .status(200)
            .json({ success: true, error: false, id: req._requestid, message: "Skill sync correctly." });
    } catch (error) {
        logger.child({ _requestid: requestid, ctx: parameters }).error(error);
        return res.status(500).json({
            success: false,
            error: true,
            id: req._requestid,
            message: "Error in sync information from source.",
        });
    }
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

        insertData = await insertIntentionItem(parameters._requestid, parameters, "intention");
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

        insertData = await insertIntentionItem(parameters._requestid, parameters, "entity");
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

exports.deleteItem = async (req, res) => {
    try {
        const parameters = req.body;
        setSessionParameters(parameters, req.user, req._requestid);

        let connector = await getWatsonConfiguration(parameters._requestid, parameters.watsonid);
        if (connector.error) return res.status(connector.status).json(connector);

        deleteData = await deleteItems(parameters._requestid, parameters, "entity");
        if (deleteData.error) return res.status(deleteData.status).json(deleteData);

        const assistant = await getAssistantConfiguration(req._requestid, connector.data);
        if (assistant.error) return res.status(assistant.status).json(assistant);

        const syncData = await syncDeletedItem(req._requestid, assistant.data, connector.data, deleteData.data);
        if (syncData.error) return res.status(syncData.status).json(syncData);

        return res.status(200).json(syncData);
    } catch (error) {
        logger.child({ _requestid: requestid, ctx: parameters }).error(error);
        return res
            .status(500)
            .json({ success: false, error: true, id: req._requestid, message: "Error deleting the item." });
    }
};

exports.createMention = async (req, res) => {
    try {
        const parameters = req.body;
        setSessionParameters(parameters, req.user, req._requestid);

        let connector = await getWatsonConfiguration(parameters._requestid, parameters.watsonid);
        if (connector.error) return res.status(connector.status).json(connector);

        newEntity = await newMentionIns(parameters._requestid, parameters);
        if (newEntity.error) return res.status(newEntity.status).json(newEntity);

        if (newEntity.data) {
            const assistant = await getAssistantConfiguration(req._requestid, connector.data);
            if (assistant.error) return res.status(assistant.status).json(assistant);

            const syncData = await syncEntityItem(req._requestid, assistant.data, connector.data, newEntity.data);
            if (syncData.error) return res.status(syncData.status).json(syncData);
        }

        return res
            .status(200)
            .json({ success: true, error: false, id: req._requestid, message: "Mention created succesfully." });
    } catch (error) {
        logger.child({ _requestid: requestid, ctx: parameters }).error(error);
        return res
            .status(500)
            .json({ success: false, error: true, id: req._requestid, message: "Error deleting the item." });
    }
};

exports.bulkloadInsert = async (req, res) => {
    try {
        const parameters = req.body;
        setSessionParameters(parameters, req.user, req._requestid);

        let connector = await getWatsonConfiguration(parameters._requestid, parameters.watsonid);
        if (connector.error) return res.status(connector.status).json(connector);

        const insert = await insertBulkloadIntent(parameters._requestid, parameters);
        if (insert.error) return res.status(insert.status).json(insert);

        const assistant = await getAssistantConfiguration(req._requestid, connector.data);
        if (assistant.error) return res.status(assistant.status).json(assistant);

        const syncData = await syncAllSkill(req._requestid, assistant.data, connector.data, parameters);
        if (syncData.error) return res.status(syncData.status).json(syncData);

        return res
            .status(200)
            .json({ success: true, error: false, id: req._requestid, message: "Bulkload inserted succesfully." });
    } catch (error) {
        logger.child({ _requestid: requestid, ctx: parameters }).error(error);
        return res
            .status(500)
            .json({ success: false, error: true, id: req._requestid, message: "Error bulkloadInsert." });
    }
};
