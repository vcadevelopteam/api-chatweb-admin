const { executesimpletransaction } = require("../config/triggerfunctions");
const { setSessionParameters, axiosObservable, getErrorCode, errors } = require("../config/helpers");
const logger = require("../config/winston");
const axios = require("axios");
const FormData = require("form-data");
const jszip = require("jszip");
const { response } = require("express");

exports.train = async (req, res) => {
    const { corpid, orgid } = req.user;
    const { model_uuid } = req.body;

    if (!model_uuid || model_uuid == '') 
        return res.status(400).json({ message: "La organizacion no tiene servicio RASA activo", error: true, success: false });

    const model_detail = await executesimpletransaction("UFN_RASA_MODEL_UUID_SEL", { corpid, orgid, model_uuid });
    const model_intent = await executesimpletransaction("UFN_RASA_INTENT_SEL", {
        corpid,
        orgid,
        rasaid: model_detail[0].rasaid,
    });
    const model_synonym = await executesimpletransaction("UFN_RASA_SYNONYM_SEL", {
        corpid,
        orgid,
        rasaid: model_detail[0].rasaid,
    });

    try {
        const config2 = {
            method: "get",
            maxBodyLength: Infinity,
            url: `http://10.240.65.11/rasa-api/status/${model_detail[0].server_port}`,
            headers: {},
        };

        const response = await axios.request(config2);
        if (response.data.data.num_active_training_jobs > 0) {
            return res.status(400).json({ message: "El modelo esta en entrenamiento", error: true, success: false });
        }
    } catch (error) {
        return res.status(500).json({ message: "El modelo esta en entrenamiento", error: true, success: false });
    }

    const nluYaml = await nluYamlBuilder(model_intent, model_synonym);
    const domainYaml = await domainYamlBuilder(model_intent);

    const data = new FormData();
    data.append("port", model_detail[0].server_port);
    data.append("nlu", Buffer.from(nluYaml), {
        filename: "nlu.yml",
        contentType: "application/octet-stream",
    });
    data.append("domain", Buffer.from(domainYaml), {
        filename: "domain.yml",
        contentType: "application/octet-stream",
    });
    data.append("config", Buffer.from(getConfigYaml()), {
        filename: "config.yml",
        contentType: "application/octet-stream",
    });

    const config = {
        method: "post",
        maxBodyLength: Infinity,
        url: "http://10.240.65.11/rasa-api/model/train",
        headers: {
            ...data.getHeaders(),
        },
        data: data,
    };

    try {
        const response = await axios.request(config);
        return res.json({ error: false, success: true });
    } catch (error) {
        return res.status(500).json({ message: "Error al enviar los archivos", data: error.response.data });
    }
};

exports.upload = async (req, res) => {
    const { corpid, orgid, usr } = req.user;
    // const model_uuid = req.params.model_uuid;
    const { model_uuid } = req.body;

    if (!req.file) {
        return res.status(400).json({ error: "No se ha proporcionado ningún archivo." });
    }

    const file = req.file;
    if (file.mimetype !== "text/yaml") {
        return res.status(400).json({ error: "Formato de archivo inválido. Se requiere un archivo YAML." });
    }

    try {
        const model_detail = await executesimpletransaction("UFN_RASA_MODEL_UUID_SEL", { corpid, orgid, model_uuid });

        const fileContent = req.file.buffer.toString("utf-8");
        const jsonOutput = convertYAMLtoJSON(fileContent);

        const insertData = await executesimpletransaction("UFN_RASA_FILE_UPLOAD", {
            corpid,
            orgid,
            usr,
            rasaid: model_detail[0].rasaid,
            intents: JSON.stringify(
                jsonOutput.intents.map((item) => {
                    let entities = item.intent_examples.reduce((acc, example) => {
                        example.entidades.forEach((entity) => {
                            if (!acc.includes(entity.entity)) {
                                acc.push(entity.entity);
                            }
                        });
                        return acc;
                    }, []);

                    let entity_examples = entities.length;

                    let entity_values = item.intent_examples
                        .reduce((acc, example) => {
                            example.entidades.forEach((entity) => {
                                if (!acc.includes(entity.value)) {
                                    acc.push(entity.value);
                                }
                            });
                            return acc;
                        }, [])
                        .join(",");

                    return {
                        intent_name: item.intent_name,
                        intent_description: item.intent_description,
                        entities: entities.join(","),
                        entity_examples: entity_examples,
                        entity_values: entity_values,
                        intent_examples: item.intent_examples,
                    };
                })
            ),
            synonyms: JSON.stringify(
                jsonOutput.synonyms.map((item) => {
                    const values = item.values.map((value) => value.texto);
                    return { description: item.description, values: values.join(","), examples: values.length };
                })
            ),
        });
        if (insertData.error) {
            return res.status(500).json({ error: "Error al insertar el archivo." });
        }
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Error al procesar el archivo." });
    }

    return res.json({ error: false, success: true });
};

exports.download = async (req, res) => {
    const { corpid, orgid, usr } = req.user;
    // const model_uuid = req.params.model_uuid;
    const { model_uuid } = req.body;

    try {
        const model_detail = await executesimpletransaction("UFN_RASA_MODEL_UUID_SEL", { corpid, orgid, model_uuid });
        const model_intent = await executesimpletransaction("UFN_RASA_INTENT_SEL", {
            corpid,
            orgid,
            rasaid: model_detail[0].rasaid,
        });
        const model_synonym = await executesimpletransaction("UFN_RASA_SYNONYM_SEL", {
            corpid,
            orgid,
            rasaid: model_detail[0].rasaid,
        });

        const nluYaml = await nluYamlBuilder(model_intent, model_synonym);
        const domainYaml = await domainYamlBuilder(model_intent);

        const zip = new jszip();
        zip.file("nlu.yml", nluYaml);
        zip.file("domain.yml", domainYaml);
        zip.generateAsync({ type: "nodebuffer" })
            .then(function (buffer) {
                res.set("Content-Type", "application/zip");
                res.set("Content-Disposition", `attachment; filename=${Date.now()}_model_${model_uuid}.zip`);
                res.send(buffer);
            })
            .catch(function (error) {
                console.error("Error al generar el archivo zip:", error);
                res.status(500).send("Error al generar el archivo zip");
            });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Error al procesar el archivo." });
    }
};

exports.list = async (req, res) => {
    const { corpid, orgid, usr } = req.user;
    // const model_uuid = req.params.model_uuid;
    const { model_uuid } = req.body;

    try {
        const model_detail = await executesimpletransaction("UFN_RASA_MODEL_UUID_SEL", {
            corpid,
            orgid,
            model_uuid,
        });

        try {
            const response = await axios.request({
                method: "get",
                maxBodyLength: Infinity,
                url: `http://10.240.65.11/rasa-api/models/${model_detail[0].server_port}`,
                headers: {},
            });

            return res.json({ error: false, success: true, data: response.data.data });
        } catch (error) {
            return res.status(500).json({ message: "Error al consultar el api", error: true, success: false });
        }
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Error al procesar el archivo." });
    }
};

exports.test = async (req, res) => {
    const { corpid, orgid, usr } = req.user;
    const { model_uuid, text } = req.body;

    try {
        const model_detail = await executesimpletransaction("UFN_RASA_MODEL_UUID_SEL", {
            corpid,
            orgid,
            model_uuid,
        });

        const responseservices = await axiosObservable({
            method: "get",
            url: `http://10.240.65.11/rasa-api/status/${model_detail[0].server_port}`,
            data: {},
            _requestid: req._requestid,
        });

        if (!responseservices.data || !(responseservices.data instanceof Object))
            return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));

        if (responseservices.data.data.num_active_training_jobs > 0) {
            return res.status(400).json({ message: "El modelo esta en entrenamiento", error: true, success: false });
        }

        const responseservicetest = await axiosObservable({
            method: "post",
            url: `http://10.240.65.11/rasa-api/model/parse/${model_detail[0].server_port}`,
            data: {
                text,
            },
            _requestid: req._requestid,
        });

        if (!responseservices.data || !(responseservices.data instanceof Object))
            return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));

        return res.json({ error: false, success: true, data: responseservicetest.data });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Error al procesar el archivo." });
    }
};

const nluYamlBuilder = async (intents, synonyms) => {
    let yamlData = "";
    yamlData = `version: "2.0"\n\nnlu:\n`;

    intents.forEach((item) => {
        yamlData += `  - intent: ${item.intent_name}\n`;
        yamlData += `    examples: |\n`;

        item.intent_examples.forEach((example) => {
            yamlData += `      - ${example.texto}`;

            const entities = example.entidades.map((entidad) => `{"entity": "${entidad.entity}", "value": "${entidad.value}"}`).join(' ');

            // example.entidades.forEach((entidad) => {
            //     yamlData += `{"entity": "${entidad.entity}", "value": "${entidad.value}"}`;
            // });
            yamlData += `\n`;
        });
        yamlData += `\n`;
    });

    synonyms.forEach((item) => {
        yamlData += `  - synonym: ${item.description}\n`;
        yamlData += `    examples: |\n`;

        item.values.split(",").forEach((value) => {
            yamlData += `      - ${value}`;
            yamlData += `\n`;
        });
        yamlData += `\n`;
    });

    return yamlData;
};

const domainYamlBuilder = (data) => {
    let yamlData = "";
    yamlData = `version: "2.0"\n\n`;

    yamlData += `intents:\n`;
    data.forEach((item) => {
        yamlData += `  - ${item.intent_name}\n`;
    });
    yamlData += `\n`;

    yamlData += `entities:\n`;
    const uniqueEntities = Array.from(new Set(data.flatMap((item) => item.entities.split(","))));
    uniqueEntities.forEach((item) => {
        yamlData += `  - ${item}\n`;
    });

    return yamlData;
};

const getConfigYaml = () => {
    return `language: es\r\n\r\npolicies:\r\n  - name: TEDPolicy\r\n    max_history: 5\r\n    epochs: 10\r\n\r\npipeline:\r\n  - name: WhitespaceTokenizer\r\n  - name: RegexFeaturizer\r\n  - name: LexicalSyntacticFeaturizer\r\n  - name: CountVectorsFeaturizer\r\n    analyzer: word\r\n  - name: CountVectorsFeaturizer\r\n    analyzer: \"char_wb\"\r\n    min_ngram: 1\r\n    max_ngram: 4\r\n  - name: DIETClassifier\r\n    epochs: 100\r\n    constrain_similarities: true\r\n  - name: DucklingEntityExtractor\r\n    url: http://localhost:8000\r\n    locale: \"es_PE\"\r\n    timezone: \"America/Peru\"\r\n    timeout: 3\r\n  - name: RegexEntityExtractor\r\n  - name: EntitySynonymMapper\r\n`;
};

function convertYAMLtoJSON(yamlContent) {
    const lines = yamlContent.split("\n");
    const intents = [];
    const synonyms = [];

    let currentIntent = null;
    let currentExamples = [];

    let currentSynonym = "";

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith("- intent:")) {
            if (currentIntent) {
                intents.push({
                    intent_name: currentIntent,
                    intent_description: currentIntent,
                    intent_examples: currentExamples,
                });
            }

            currentIntent = line.split(":")[1].trim();
            currentExamples = [];
        } else if (line.startsWith("examples: |") && (currentIntent || currentSynonym)) {
            const examplesStart = i + 1;

            while (i < lines.length && lines[i + 1] && !lines[i + 1].startsWith("  - ")) {
                i++;
            }
            const examplesEnd = i;

            for (let j = examplesStart; j <= examplesEnd; j++) {
                const example = lines[j].trim().substring(2);
                if (example.includes("{")) {
                    const text = example.split("{")[0].trim();
                    const entityString = example.split("{")[1].trim();
                    const entityValue = JSON.parse(`{${entityString}`);

                    currentExamples.push({
                        texto: text,
                        entidades: [entityValue],
                    });
                } else {
                    currentExamples.push({
                        texto: example,
                        entidades: [],
                    });
                }
            }
        } else if (line.startsWith("- synonym:")) {
            if (currentIntent) {
                intents.push({
                    intent_name: currentIntent,
                    intent_description: currentIntent,
                    intent_examples: currentExamples,
                });
            }

            if (currentSynonym) {
                synonyms.push({
                    description: currentSynonym,
                    values: currentExamples,
                });
            }

            currentIntent = null;
            currentSynonym = line.split(":")[1].trim();
            currentExamples = [];
        }
    }

    if (currentIntent) {
        intents.push({
            intent_name: currentIntent,
            intent_description: currentIntent,
            intent_examples: currentExamples,
        });
    }

    if (currentSynonym) {
        synonyms.push({
            description: currentSynonym,
            values: currentExamples,
        });
    }

    return { intents, synonyms };
}

const transformIntents = (data) => {};
