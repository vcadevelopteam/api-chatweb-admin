const logger = require("../config/winston");
const genericfunctions = require("../config/genericfunctions");
const { executesimpletransaction } = require("../config/triggerfunctions");
const AssistantV1 = require("ibm-watson/assistant/v1");
const { IamAuthenticator } = require("ibm-watson/auth");
const crypto = require("crypto");

exports.getConnectorConfiguration = async (requestid, params) => {
    let responsedata = genericfunctions.generateResponseData(requestid);
    try {
        const connectorData = await executesimpletransaction("QUERY_INTELLIGENTMODELSCONFIGURATION_SEL", {
            ...params,
            id: params.intelligentmodelsconfigurationid,
        });
        if (!connectorData instanceof Array || !connectorData.length)
            return genericfunctions.changeResponseData(responsedata, undefined, undefined, "CONFIGURATION_NOT_FOUND.");

        return genericfunctions.changeResponseData(
            responsedata,
            undefined,
            connectorData[0],
            "Skill retrieved successfully.",
            200,
            true
        );
    } catch (error) {
        logger.child({ _requestid: requestid }).error(error);
        return genericfunctions.changeResponseData(
            responsedata,
            undefined,
            undefined,
            "Error retrieving the skill information."
        );
    }
};

exports.getWorkspaceInformation = async (requestid, assistant, params) => {
    let responsedata = genericfunctions.generateResponseData(requestid);
    try {
        const skill = await assistant.getWorkspace({
            workspaceId: params.modelid,
            _export: true,
        });

        if (![200, 201].includes(skill.status))
            throw new Error(skill.result || "Error retrieving workspace information form source.");

        return genericfunctions.changeResponseData(
            responsedata,
            undefined,
            skill.result,
            "Workspace retrieved successfully.",
            200,
            true
        );
    } catch (error) {
        logger.child({ _requestid: requestid, ctx: params }).error(error);
        return genericfunctions.changeResponseData(
            responsedata,
            undefined,
            undefined,
            "Error retrieving workspace information."
        );
    }
};

// exports.getSkillInformation = async (requestid, configData) => {
//     let responsedata = genericfunctions.generateResponseData(requestid);
//     try {
//         const assistant = new AssistantV1({
//             version: "2021-06-14",
//             authenticator: new IamAuthenticator({
//                 apikey: configData.apikey,
//             }),
//             serviceUrl: configData.endpoint,
//         });

//         const assistantList = await assistant.listWorkspaces();

//         const skill = await assistant.getWorkspace({
//             workspaceId: configData.modelid,
//             _export: true,
//         });
//         console.log("🚀 ~ exports.getSkillInformation= ~ skill:", skill);

//         if (skill.status != 200 && skill.result.status !== "Available") {
//             return genericfunctions.changeResponseData(responsedata, undefined, undefined, "SKILL_NOT_FOUND.");
//         }

//         return genericfunctions.changeResponseData(
//             responsedata,
//             undefined,
//             [assistant, skill.result],
//             "Skill retrieved successfully.",
//             200,
//             true
//         );
//     } catch (error) {
//         logger.child({ _requestid: requestid }).error(error);
//         return genericfunctions.changeResponseData(
//             responsedata,
//             undefined,
//             [null, null],
//             "Error retrieving the skill information."
//         );
//     }
// };

// exports.getSkillConfiguration = async (requestid, assistant, skillData) => {
//     let responsedata = genericfunctions.generateResponseData(requestid);
//     try {
//         const intents = await getSkillIntents(requestid, assistant, skillData.workspace_id);
//         const entities = await getSkillEntities(requestid, assistant, skillData.workspace_id);

//         return genericfunctions.changeResponseData(
//             responsedata,
//             undefined,
//             { intents, entities },
//             "Skill data retrieved successfully.",
//             200,
//             true
//         );
//     } catch (error) {
//         logger.child({ _requestid: requestid }).error(error);
//         return genericfunctions.changeResponseData(
//             responsedata,
//             undefined,
//             undefined,
//             "Error retrieving the skill data."
//         );
//     }
// };

// const getSkillIntents = async (requestid, assistant, workspace_id) => {
//     try {
//         const skillIntents = await assistant.listIntents({
//             workspaceId: workspace_id,
//             _export: true,
//         });

//         return skillIntents.result.intents;
//     } catch (error) {
//         logger.child({ _requestid: requestid }).error(error);
//     }
//     return null;
// };

// const getSkillEntities = async (requestid, assistant, workspace_id) => {
//     try {
//         const skillEntities = await assistant.listEntities({
//             workspaceId: workspace_id,
//             _export: true,
//         });

//         return skillEntities.result.entities;
//     } catch (error) {
//         logger.child({ _requestid: requestid }).error(error);
//     }
//     return null;
// };

exports.insertSkill = async (requestid, params, skillInfo, connectorData) => {
    let responsedata = genericfunctions.generateResponseData(requestid);
    try {
        const insertSkillData = await executesimpletransaction("UFN_WATSON_INSERT_IBM_DATA", {
            ...params,
            intelligentmodelsid: connectorData.intelligentmodelsid,
            watson_description: skillInfo.name,
            watson_language: skillInfo.language,
            watson_intents_count: skillInfo.intents.length,
            watson_entities_count: skillInfo.entities.length,
            intents_json: JSON.stringify({ intents: skillInfo.intents }),
            entities_json: JSON.stringify({ entities: skillInfo.entities }),
            hash: crypto.createHash("sha256").update(JSON.stringify(skillInfo)).digest("hex"),
        });
        if (!insertSkillData instanceof Array || !insertSkillData.length)
            return genericfunctions.changeResponseData(
                responsedata,
                undefined,
                undefined,
                insertSkillData.code || "UNEXPECTED_ERROR"
            );

        return genericfunctions.changeResponseData(
            responsedata,
            undefined,
            undefined,
            "Skill register successfully.",
            200,
            true
        );
    } catch (error) {
        logger.child({ _requestid: requestid }).error(error);
        return genericfunctions.changeResponseData(
            responsedata,
            undefined,
            undefined,
            "Error inserting the skill data."
        );
    }
};

exports.getAssistantConfiguration = async (requestid, configData) => {
    let responsedata = genericfunctions.generateResponseData(requestid);
    try {
        const assistant = new AssistantV1({
            version: "2021-06-14",
            authenticator: new IamAuthenticator({
                apikey: configData.apikey,
            }),
            serviceUrl: configData.endpoint,
        });

        return genericfunctions.changeResponseData(responsedata, undefined, assistant, "Success", 200, true);
    } catch (error) {
        logger.child({ _requestid: requestid, ctx: configData }).error(error);
        return genericfunctions.changeResponseData(
            responsedata,
            undefined,
            undefined,
            "Error retrieving the assistant configuration."
        );
    }
};

exports.compareWatsonData = async (requestid, parameters, assistant, connector, externalSkillInfo) => {
    let responsedata = genericfunctions.generateResponseData(requestid);
    let needUpdate = true;
    try {
        const watsonData = await executesimpletransaction("UFN_WATSON_GET_ITEM_DETAILS", {
            ...parameters,
            watsonid: connector.watsonid,
        });
        if (!watsonData instanceof Array || !watsonData.length) throw new Error("CONFIGURATION_NOT_FOUND");

        const externalData = {
            intents: externalSkillInfo.intents,
            entities: externalSkillInfo.entities,
        };

        const data = {
            intents: watsonData
                .filter((item) => item.item_type === "intention")
                .map((item) => ({
                    intent: item.item_name,
                    description: item.description || undefined,
                    examples:
                        item.item_details[0] &&
                        item.item_details.map((detail) => ({
                            text: detail.value,
                        })),
                })),
            entities: watsonData
                .filter((item) => item.item_type === "entity")
                .map((item) => ({
                    entity: item.item_name,
                    values: item.item_details.map((detail) => ({
                        synonyms: JSON.parse(detail.synonyms) || [],
                        value: detail.value,
                        type: "synonyms",
                    })),
                })),
        };

        const sortOutEntities = JSON.stringify(sortEntities(externalData.entities));
        const sortLocalEntities = JSON.stringify(sortEntities(data.entities));

        const sortOutIntents = JSON.stringify(sortIntents(externalData.intents));
        const sortLocalIntents = JSON.stringify(sortIntents(data.intents));

        console.log("=====", sortOutEntities);
        console.log("=====", sortLocalEntities);
        console.log("=====");
        console.log("=====", sortOutIntents);
        console.log("=====", sortLocalIntents);
        console.log("=====");

        if (sortOutEntities === sortLocalEntities && sortOutIntents === sortLocalIntents) {
            console.log("son igualessss");
            needUpdate = false;
        }

        return genericfunctions.changeResponseData(
            responsedata,
            undefined,
            needUpdate,
            "Watson retrieved successfully.",
            200,
            true
        );
    } catch (error) {
        console.log("🚀 ~ exports.compareWatsonData= ~ error:", error);
        logger.child({ _requestid: requestid }).error(error);
        return genericfunctions.changeResponseData(
            responsedata,
            undefined,
            undefined,
            "Error retrieving the Watson information."
        );
    }
};

exports.getWatsonConfiguration = async (requestid, watsonid) => {
    let responsedata = genericfunctions.generateResponseData(requestid);
    try {
        //TODO: buscar por orgid tambien aca
        const connectorData = await executesimpletransaction("QUERY_WATSONMODELCONFIGURATION_SEL", {
            watsonid,
        });
        if (!connectorData instanceof Array || !connectorData.length) throw new Error("CONFIGURATION_NOT_FOUND");

        return genericfunctions.changeResponseData(
            responsedata,
            undefined,
            connectorData[0],
            "Skill retrieved successfully.",
            200,
            true
        );
    } catch (error) {
        logger.child({ _requestid: requestid }).error(error);
        return genericfunctions.changeResponseData(
            responsedata,
            undefined,
            undefined,
            "Error retrieving the skill information."
        );
    }
};

exports.tryitModel = async (requestid, connectorData, assistant, text) => {
    let responsedata = genericfunctions.generateResponseData(requestid);
    try {
        const response = await assistant.message({
            input: { text },
            workspaceId: connectorData.modelid,
        });

        return genericfunctions.changeResponseData(responsedata, undefined, response.result, "Success", 200, true);
    } catch (error) {
        logger.child({ _requestid: requestid }).error(error);
        return genericfunctions.changeResponseData(
            responsedata,
            undefined,
            undefined,
            "Error retrieving the assistant configuration."
        );
    }
};

exports.insertIntentionItem = async (requestid, params, type) => {
    let responsedata = genericfunctions.generateResponseData(requestid);
    try {
        const funName = type == "intention" ? "UFN_WATSON_ITEM_INTENT_INS" : "UFN_WATSON_ITEM_ENTITY_INS";

        const insertItem = await executesimpletransaction(funName, {
            ...params,
            description: params.description || "",
            type,
            detail_json: JSON.stringify(params.detail || []),
        });
        if (!insertItem instanceof Array || !insertItem.length)
            return genericfunctions.changeResponseData(
                responsedata,
                undefined,
                undefined,
                insertItem.code || "UNEXPECTED_ERROR"
            );

        return genericfunctions.changeResponseData(
            responsedata,
            undefined,
            insertItem[0],
            "Intention item inserted successfully.",
            200,
            true
        );
    } catch (error) {
        logger.child({ _requestid: requestid, ctx: params }).error(error);
        return genericfunctions.changeResponseData(
            responsedata,
            undefined,
            undefined,
            "Error inserting the intention item."
        );
    }
};

exports.syncIntentionItem = async (requestid, assistant, connector, params) => {
    let responsedata = genericfunctions.generateResponseData(requestid);
    let newIntent = null;
    try {
        const data = {
            workspaceId: connector.modelid,
            intent: params.item_name,
            ...(params.operation === "INSERT" && {
                description: params.description,
                examples:
                    params.detail &&
                    params.detail
                        .filter((item) => item.status === "ACTIVO")
                        .map((item) => ({ text: item.value, mentions: item.mentions })),
            }),
            ...(params.operation === "UPDATE" && {
                newDescription: params.description,
                newExamples:
                    params.detail &&
                    params.detail
                        .filter((item) => item.status === "ACTIVO")
                        .map((item) => ({ text: item.value, mentions: item.mentions })),
            }),
        };

        switch (params.operation) {
            case "UPDATE":
                newIntent = await assistant.updateIntent(data);
                break;
            case "INSERT":
                newIntent = await assistant.createIntent(data);
                break;
            case "DELETE":
                newIntent = await assistant.deleteIntent(data);
                break;
            default:
                break;
        }

        if (![200, 201].includes(newIntent.status)) throw new Error(newIntent.result || "Error creating the intent.");

        return genericfunctions.changeResponseData(
            responsedata,
            undefined,
            newIntent.result,
            "Intention item inserted successfully.",
            200,
            true
        );
    } catch (error) {
        logger.child({ _requestid: requestid, ctx: params }).error(error);
        return genericfunctions.changeResponseData(
            responsedata,
            undefined,
            undefined,
            "Error inserting the intention item."
        );
    }
};

exports.syncEntityItem = async (requestid, assistant, connector, params) => {
    let responsedata = genericfunctions.generateResponseData(requestid);
    let newEntity = null;
    try {
        const data = {
            workspaceId: connector.modelid,
            entity: params.item_name,
            ...(params.operation === "INSERT" && {
                description: params.description,
                values:
                    params.detail &&
                    params.detail
                        .filter((item) => item.status === "ACTIVO")
                        .map((item) => ({ value: item.value, synonyms: item.synonyms })),
            }),
            ...(params.operation === "UPDATE" && {
                newDescription: params.description,
                newValues:
                    params.detail &&
                    params.detail
                        .filter((item) => item.status === "ACTIVO")
                        .map((item) => ({ value: item.value, synonyms: item.synonyms })),
            }),
        };

        switch (params.operation) {
            case "UPDATE":
                newEntity = await assistant.updateEntity(data);
                break;
            case "INSERT":
                newEntity = await assistant.createEntity(data);
                break;
            case "DELETE":
                newEntity = await assistant.deleteEntity(data);
                break;
            default:
                break;
        }

        if (![200, 201].includes(newEntity.status)) throw new Error(newEntity.result || "Error creating the entity.");

        return genericfunctions.changeResponseData(
            responsedata,
            undefined,
            newEntity.result,
            "Entity item inserted successfully.",
            200,
            true
        );
    } catch (error) {
        logger.child({ _requestid: requestid, ctx: params }).error(error);
        return genericfunctions.changeResponseData(
            responsedata,
            undefined,
            undefined,
            "Error inserting the entity item."
        );
    }
};

exports.deleteItems = async (requestid, params, type) => {
    let responsedata = genericfunctions.generateResponseData(requestid);
    try {
        const deletedItems = await executesimpletransaction("UFN_WATSON_ITEM_DEL", params);
        if (!deletedItems instanceof Array || !deletedItems.length)
            return genericfunctions.changeResponseData(
                responsedata,
                undefined,
                undefined,
                deletedItems.code || "UNEXPECTED_ERROR"
            );

        return genericfunctions.changeResponseData(
            responsedata,
            undefined,
            deletedItems,
            "Items deleted successfully.",
            200,
            true
        );
    } catch (error) {
        logger.child({ _requestid: requestid, ctx: params }).error(error);
        return genericfunctions.changeResponseData(responsedata, undefined, undefined, "Error deleting items.");
    }
};

exports.syncDeletedItem = async (requestid, assistant, connector, params) => {
    let responsedata = genericfunctions.generateResponseData(requestid);
    try {
        for (const item of params) {
            if (item.type === "intention") {
                const data = {
                    workspaceId: connector.modelid,
                    intent: item.item_name,
                };

                const delIntent = await assistant.deleteIntent(data);
                if (![200, 201].includes(delIntent.status))
                    throw new Error(delIntent.result || "Error deleting the intent.");
            }

            if (item.type === "entity") {
                const data = {
                    workspaceId: connector.modelid,
                    entity: item.item_name,
                };

                const delEntity = await assistant.deleteEntity(data);
                if (![200, 201].includes(delEntity.status))
                    throw new Error(delEntity.result || "Error deleting the entity.");
            }
        }

        return genericfunctions.changeResponseData(
            responsedata,
            undefined,
            undefined,
            "items deleted successfully.",
            200,
            true
        );
    } catch (error) {
        logger.child({ _requestid: requestid, ctx: params }).error(error);
        return genericfunctions.changeResponseData(
            responsedata,
            undefined,
            undefined,
            "Error inserting the entity item."
        );
    }
};

exports.newMentionIns = async (requestid, params) => {
    let responsedata = genericfunctions.generateResponseData(requestid);
    try {
        const newMention = await executesimpletransaction("UFN_WATSON_MENTION_INS", params);
        if (!newMention instanceof Array || !newMention.length)
            return genericfunctions.changeResponseData(
                responsedata,
                undefined,
                undefined,
                newMention.code || "UNEXPECTED_ERROR"
            );

        if (newMention[0].create || newMention[0].update) {
            responsedata.data = {
                item_name: params.entity,
                operation: newMention[0].create ? "INSERT" : "UPDATE",
                detail: newMention.map((item) => ({
                    value: item.value,
                    synonyms: JSON.parse(item.synonyms),
                    status: item.status,
                })),
            };
        }

        return genericfunctions.changeResponseData(
            responsedata,
            undefined,
            responsedata.data,
            "Mention created successfully.",
            200,
            true
        );
    } catch (error) {
        logger.child({ _requestid: requestid, ctx: params }).error(error);
        return genericfunctions.changeResponseData(responsedata, undefined, undefined, "Error creating mention.");
    }
};

function sortEntities(arr) {
    arr.sort((a, b) => a.entity.localeCompare(b.entity));
    arr.forEach((obj, index) => {
        obj.values.sort((a, b) => a.value.localeCompare(b.value));
        obj.values = obj.values.map((valueObj) => {
            return {
                value: valueObj.value,
                type: valueObj.type,
                synonyms: valueObj.synonyms,
            };
        });
        arr[index] = {
            entity: obj.entity,
            values: obj.values,
        };
    });
    return arr;
}

function sortIntents(arr) {
    arr.sort((a, b) => a.intent.localeCompare(b.intent));
    arr.forEach((obj, index) => {
        if (obj.examples) {
            obj.examples.sort((a, b) => a.text.localeCompare(b.text));
            obj.examples = obj.examples.map((valueObj) => {
                return {
                    text: valueObj.text,
                };
            });
        }
        arr[index] = {
            intent: obj.intent,
            description: obj.description,
            examples: obj.examples || [],
        };
    });
    return arr;
}

exports.insertBulkloadIntent = async (requestid, params) => {
    let responsedata = genericfunctions.generateResponseData(requestid);
    try {
        const groupData = params.type === "intention" ? groupByIntent(params.data) : groupByEntity(params.data);

        const insertData = await executesimpletransaction("UFN_WATSON_BULKLOAD_ITEM_INS", {
            ...params,
            data: JSON.stringify(groupData),
        });
        if (!insertData instanceof Array || !insertData.length) throw new Error(insertData.code || "UNEXPECTED_ERROR");

        console.log("🚀 ~ insertData ~ insertData:", insertData);
        return genericfunctions.changeResponseData(
            responsedata,
            undefined,
            groupData,
            "Bulkload inserted successfully.",
            200,
            true
        );
    } catch (error) {
        logger.child({ _requestid: requestid, ctx: params }).error(error);
        return genericfunctions.changeResponseData(responsedata, undefined, undefined, "Error bulkload insert.");
    }
};

exports.syncAllSkill = async (requestid, assistant, connector, params) => {
    let responsedata = genericfunctions.generateResponseData(requestid);
    try {
        const watsonData = await executesimpletransaction("UFN_WATSON_GET_ITEM_DETAILS", {
            ...params,
            watsonid: connector.watsonid,
        });
        if (!watsonData instanceof Array || !watsonData.length) throw new Error("CONFIGURATION_NOT_FOUND");

        const data = {
            intents: watsonData
                .filter((item) => item.item_type === "intention")
                .map((item) => ({
                    intent: item.item_name,
                    description: item.description || undefined,
                    examples:
                        item.item_details[0] &&
                        item.item_details.map((detail) => ({
                            text: detail.value,
                        })),
                })),
            entities: watsonData
                .filter((item) => item.item_type === "entity")
                .map((item) => ({
                    entity: item.item_name,
                    values: item.item_details.map((detail) => ({
                        synonyms: JSON.parse(detail.synonyms) || [],
                        value: detail.value,
                        type: "synonyms",
                    })),
                })),
        };

        updateSkill = await assistant.updateWorkspace({
            workspaceId: connector.modelid,
            intents: data.intents,
            entities: data.entities,
        });

        if (![200, 201].includes(updateSkill.status))
            throw new Error(updateSkill.result || "Error creating the intent.");

        console.log("🚀 ~ exports.syncAllSkill= ~ data:", JSON.stringify(data));
        return genericfunctions.changeResponseData(
            responsedata,
            undefined,
            updateSkill.result,
            "Bulkload sync successfully.",
            200,
            true
        );
    } catch (error) {
        logger.child({ _requestid: requestid, ctx: params }).error(error);
        return genericfunctions.changeResponseData(responsedata, undefined, undefined, "Error bulkload sync.");
    }
};

function groupByIntent(data) {
    return data.reduce((acc, item) => {
        if (!acc[item.intent]) {
            acc[item.intent] = [];
        }
        acc[item.intent].push({ example: item.example });
        return acc;
    }, {});
}

function groupByEntity(data) {
    return data.reduce((acc, item) => {
        if (!acc[item.entity]) {
            acc[item.entity] = [];
        }
        acc[item.entity].push({ value: item.value, synonyms: item.synonyms });
        return acc;
    }, {});
}
