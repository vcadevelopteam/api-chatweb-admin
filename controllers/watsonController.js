const logger = require("../config/winston");
const {
    getConnectorConfiguration,
    getSkillInformation,
    getSkillConfiguration,
    insertSkill,
    getAssistantConfiguration,
    getWatsonConfiguration,
    tryitModel,
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
