const { executesimpletransaction, uploadBufferToCos } = require("../config/triggerfunctions");
const { setSessionParameters, axiosObservable, getErrorCode, errors } = require("../config/helpers");
const logger = require("../config/winston");
const axios = require("axios");
const FormData = require("form-data");
const jszip = require("jszip");
const { response } = require("express");
const path = require("path");

exports.train = async (req, res) => {
    const { corpid, orgid, usr } = req.user;
    const { model_uuid } = req.body;

    if (!model_uuid || model_uuid == "")
        return res
            .status(400)
            .json({ message: "La organizacion no tiene servicio RASA activo", error: true, success: false });

    try {
        const model_detail = await executesimpletransaction("UFN_RASA_MODEL_UUID_SEL", { corpid, orgid, model_uuid });
        if (!model_detail.length)
            return res
                .status(400)
                .json({ message: "La organizacion no tiene servicio RASA activo", error: true, success: false });

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

        if (!model_intent.length || model_intent.length <= 1)
            return res
                .status(400)
                .json({ message: "El modelo no tiene intenciones validas", error: true, success: false });

        const responseservices = await axiosObservable({
            method: "get",
            url: `https://rasa.laraigo.com/rasa-api/status/${model_detail[0].server_port}`,
            data: {},
            _requestid: req._requestid,
        });

        if (!responseservices.data || !(responseservices.data instanceof Object))
            return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));

        if (responseservices.data.data.num_active_training_jobs > 0) {
            return res.status(400).json({ message: "El modelo esta en entrenamiento", error: true, success: false });
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

        const responsetrain = await axiosObservable({
            method: "post",
            url: `https://rasa.laraigo.com/rasa-api/model/train`,
            headers: {
                ...data.getHeaders(),
            },
            data: data,
            _requestid: req._requestid,
        });

        if (!responsetrain.data || !(responsetrain.data instanceof Object))
            return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));

        await executesimpletransaction("UFN_RASA_MODEL_INS", { corpid, orgid, rasaid: model_detail[0].rasaid, usr });

        return res.json({ error: false, success: true });
    } catch (error) {
        return res.status(500).json({ message: "Error al enviar los archivos", error: true, success: false });
    }
};

exports.upload = async (req, res) => {
    const { corpid, orgid, usr } = req.user;
    const { model_uuid, origin = "asdf" } = req.body;

    if (!model_uuid || model_uuid == "")
        return res
            .status(400)
            .json({ message: "La organizacion no tiene servicio RASA activo", error: true, success: false });

    if (!req.file || ["yaml", "yml"].includes(path.extname(req.file.originalname))) {
        return res.status(400).json({ message: "Archivo inválido.", error: true, success: false });
    }

    try {
        const model_detail = await executesimpletransaction("UFN_RASA_MODEL_UUID_SEL", { corpid, orgid, model_uuid });
        if (!model_detail.length)
            return res
                .status(400)
                .json({ message: "La organizacion no tiene servicio RASA activo", error: true, success: false });

        const fileContent = req.file.buffer.toString("utf-8");

        const data = origin === "intent" ? intentYamlToJson(fileContent) : synonymYamlToJson(fileContent);
        if (!data.length)
            return res.status(400).json({
                message: "Archivo inválido, por favor revisa la estructura e intenta de nuevo.",
                error: true,
                success: false,
            });

        const insertData = await executesimpletransaction("UFN_RASA_FILE_UPLOAD", {
            corpid,
            orgid,
            usr,
            rasaid: model_detail[0].rasaid,
            intents: origin === "intent" ? parseIntents(data) : "{}",
            synonyms:
                origin === "synonym"
                    ? JSON.stringify(
                          data.map((item) => {
                              const values = item.values.map((value) => value.texto);
                              return {
                                  description: item.description,
                                  values: values.join(","),
                                  examples: values.length,
                              };
                          })
                      )
                    : "{}",
        });

        if (insertData.error) {
            return res.status(500).json({ message: "Error al insertar el archivo.", error: true, success: false });
        }
    } catch (error) {
        return res.status(500).json({ message: "Error al procesar el archivo.", error: true, success: false });
    }

    return res.json({ error: false, success: true });
};

exports.download = async (req, res) => {
    const { corpid, orgid, usr } = req.user;
    const { model_uuid, origin } = req.body;

    try {
        const model_intent = await executesimpletransaction("UFN_RASA_INTENT_SEL", {
            corpid,
            orgid,
            rasaid: 0,
        });
        const model_synonym = await executesimpletransaction("UFN_RASA_SYNONYM_SEL", {
            corpid,
            orgid,
            rasaid: 0,
        });

        const data = origin === "intent" ? model_intent : model_synonym;
        if (!data.length) return res.status(500).json({ message: "Nada que exportar", error: true, success: false });

        const yaml = await singleYamlBuilder(data, origin);

        const zip = new jszip();
        zip.file(`${origin}.yml`, yaml);

        const buffer = await zip.generateAsync({
            type: "nodebuffer",
            compression: "DEFLATE",
            compressionOptions: {
                level: 1,
            },
        });
        const rr = await uploadBufferToCos(
            req._requestid,
            buffer,
            "application/zip",
            new Date().toISOString() + ".zip"
        );
        return res.json({ error: false, success: true, url: rr.url });
    } catch (error) {
        return res.status(500).json({ message: "Error al procesar el archivo.", error: true, success: false });
    }
};

exports.list = async (req, res) => {
    const { corpid, orgid, usr } = req.user;
    const { model_uuid } = req.body;

    if (!model_uuid || model_uuid == "")
        return res
            .status(400)
            .json({ message: "La organizacion no tiene servicio RASA activo", error: true, success: false });

    try {
        const model_detail = await executesimpletransaction("UFN_RASA_MODEL_UUID_SEL", { corpid, orgid, model_uuid });
        if (!model_detail.length)
            return res
                .status(400)
                .json({ message: "La organizacion no tiene servicio RASA activo", error: true, success: false });

        const response = await axiosObservable({
            method: "get",
            url: `https://rasa.laraigo.com/rasa-api/models/${model_detail[0].server_port}`,
            data: {},
            _requestid: req._requestid,
        });

        if (!response.data || !(response.data instanceof Object))
            return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));

        const models = response.data.data.map((model) => {
            const [name, date, time] = model.split("-");
            const formattedDate = date.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
            const formattedTime = time.split(".")[0].replace(/(\d{2})(\d{2})(\d{2})/, "$1:$2:$3");
            const createdate = `${formattedDate} ${formattedTime}`;

            return { model_name: model, createdate, status: "INACTIVO" };
        });

        models.sort((a, b) => {
            const dateA = new Date(a.createdate);
            const dateB = new Date(b.createdate);
            return dateB - dateA;
        });
        models[0].status = "ACTIVO";

        return res.json({ error: false, success: true, data: models });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ message: "Error al consultar el servicio.", error: true, success: false });
    }
};

exports.test = async (req, res) => {
    const { corpid, orgid, usr } = req.user;
    const { model_uuid, text } = req.body;

    if (!model_uuid || model_uuid == "")
        return res
            .status(400)
            .json({ message: "La organizacion no tiene servicio RASA activo", error: true, success: false });

    try {
        const model_detail = await executesimpletransaction("UFN_RASA_MODEL_UUID_SEL", { corpid, orgid, model_uuid });
        if (!model_detail.length)
            return res
                .status(400)
                .json({ message: "La organizacion no tiene servicio RASA activo", error: true, success: false });

        const responseservices = await axiosObservable({
            method: "get",
            url: `https://rasa.laraigo.com/rasa-api/status/${model_detail[0].server_port}`,
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
            url: `https://rasa.laraigo.com/rasa-api/model/parse/${model_detail[0].server_port}`,
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
        return res.status(500).json({ message: "Error al procesar el request.", error: true, success: false });
    }
};

exports.download_model = async (req, res) => {
    const { corpid, orgid, usr } = req.user;
    const { model_uuid, model_name } = req.body;

    if (!model_uuid || model_uuid == "")
        return res
            .status(400)
            .json({ message: "La organizacion no tiene servicio RASA activo", error: true, success: false });

    try {
        const model_detail = await executesimpletransaction("UFN_RASA_MODEL_UUID_SEL", { corpid, orgid, model_uuid });
        if (!model_detail.length)
            return res
                .status(400)
                .json({ message: "La organizacion no tiene servicio RASA activo", error: true, success: false });

        const responseservices = await axiosObservable({
            method: "post",
            url: `https://rasa.laraigo.com/rasa-api/download-model`,
            data: {
                model_name: model_name,
                port: model_detail[0].server_port,
            },
            _requestid: req._requestid,
        });

        if (!responseservices.data || !(responseservices.data instanceof Object))
            return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));
        if (responseservices.data.error)
            return res.status(400).json({ message: responseservices.data.msg, error: true, success: false });

        return res.json({ error: false, success: true, url: responseservices.data.data.url });
    } catch (error) {
        return res.status(500).json({ message: "Error al procesar el archivo.", error: true, success: false });
    }
};

const nluYamlBuilder = async (intents, synonyms) => {
    let yamlData = "";
    yamlData = `version: "2.0"\n\nnlu:\n`;

    yamlData += await singleYamlBuilder(intents, "intent", synonyms);
    yamlData += await singleYamlBuilder(synonyms, "synonym");

    return yamlData;
};

const singleYamlBuilder = async (data, origin, synonym_data = null) => {
    let yamlData = "";

    if (origin === "intent") {
        data.forEach((item) => {
            yamlData += `  - intent: ${item.intent_name}\n`;
            yamlData += `    examples: |\n`;

            item.intent_examples.forEach((example) => {
                const { texto, entidades } = example;
                const indice = texto.indexOf("]");

                if (indice !== -1) {
                    const entidad = entidades[0];

                    if (synonym_data) {
                        const entityText = texto.match(/\[(.*?)\]/);
                        const entitySynonym = synonym_data.find(
                            (synonym) => synonym.description.toLowerCase() === entityText[1].toLowerCase()
                        );
                        if (entitySynonym) {
                            entitySynonym.values.split(",").forEach((value) => {
                                const newTextIntent = texto.replace(/\[(.*?)\]/g, `[${value}]`);
                                const indice = newTextIntent.indexOf("]");
                                const entidadString = JSON.stringify({
                                    entity: entidad.entity,
                                    value: entitySynonym.description,
                                });
                                const textTransform = `${newTextIntent.slice(
                                    0,
                                    indice + 1
                                )}${entidadString}${newTextIntent.slice(indice + 1)}`;
                                yamlData += `      - ${textTransform}`;
                                yamlData += `\n`;
                            });
                        }
                    }
                    const entidadString = entidad.value
                        ? JSON.stringify({ entity: entidad.entity, value: entidad.value })
                        : `(${entidad.entity})`;
                    const textTransform = `${texto.slice(0, indice + 1)}${entidadString}${texto.slice(indice + 1)}`;
                    yamlData += `      - ${textTransform}`;
                } else {
                    yamlData += `      - ${example.texto}`;
                }
                yamlData += `\n`;
            });
            yamlData += `\n`;
        });
    }

    if (origin === "synonym") {
        data.forEach((item) => {
            yamlData += `  - synonym: ${item.description}\n`;
            yamlData += `    examples: |\n`;

            item.values.split(",").forEach((value) => {
                yamlData += `      - ${value}`;
                yamlData += `\n`;
            });
            yamlData += `\n`;
        });
    }
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

function intentYamlToJson(yamlIntent) {
    const lines = yamlIntent.split("\n");
    const intents = [];

    let currentIntent = null;
    let currentExamples = [];

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
        } else if (line.startsWith("examples: |") && currentIntent) {
            const examplesStart = i + 1;

            while (i < lines.length && lines[i + 1] && !lines[i + 1].startsWith("  - ")) {
                i++;
            }
            const examplesEnd = i - 1;
            for (let j = examplesStart; j <= examplesEnd; j++) {
                const example = lines[j].split("-")[1].trim();
                if (example.includes("[")) {
                    let entidad = null;
                    const text = example.replace(/{[^}]+}/g, "").replace(/\((.*?)\)/g, "");
                    const matches = example.match(/{([^}]+)}/g);
                    const match_wparenthesis = example.match(/\((.*?)\)/g);

                    let entityString = null;
                    if (matches && matches.length > 0) {
                        entityString = matches[0];
                        entidad = JSON.parse(entityString);
                    } else if (match_wparenthesis && match_wparenthesis.length > 0) {
                        entidad = {
                            entity: match_wparenthesis[0].replace(/[()]/g, ""),
                            value: null,
                            description: null,
                        };
                    }

                    currentExamples.push({
                        texto: text,
                        entidades: [entidad],
                    });
                } else {
                    currentExamples.push({
                        texto: example,
                        entidades: [],
                    });
                }
            }
        } else if (line.startsWith("- synonym:")) {
            break;
        }
    }

    if (currentIntent) {
        intents.push({
            intent_name: currentIntent,
            intent_description: currentIntent,
            intent_examples: currentExamples,
        });
    }

    return intents;
}

function synonymYamlToJson(yamlSynonym) {
    const lines = yamlSynonym.split("\n");
    const synonyms = [];

    let currentSynonym = null;
    let currentExamples = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith("- synonym:")) {
            if (currentSynonym) {
                synonyms.push({
                    description: currentSynonym,
                    values: currentExamples,
                });
            }

            currentSynonym = line.split(":")[1].trim();
            currentExamples = [];
        } else if (line.startsWith("examples: |") && currentSynonym) {
            const examplesStart = i + 1;

            while (i < lines.length && lines[i + 1] && !lines[i + 1].startsWith("  - ")) {
                i++;
            }
            const examplesEnd = i - 1;

            for (let j = examplesStart; j <= examplesEnd; j++) {
                const example = lines[j].split("-")[1].trim();
                console.log("example", example);
                if (example.includes("[")) {
                    const text = example.replace(/{[^}]+}/g, "");
                    const matches = example.match(/{([^}]+)}/g);

                    let entityString = null;
                    if (matches && matches.length > 0) {
                        entityString = matches[0];
                    }

                    currentExamples.push({
                        texto: text,
                        entidades: [JSON.parse(entityString)],
                    });
                } else {
                    currentExamples.push({
                        texto: example,
                        entidades: [],
                    });
                }
            }
        } else if (line.startsWith("- intent:") && currentSynonym) {
            break;
        }
    }

    if (currentSynonym) {
        synonyms.push({
            description: currentSynonym,
            values: currentExamples,
        });
    }

    return synonyms;
}

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

const parseIntents = (data) => {
    return JSON.stringify(
        data.map((item) => {
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
    );
};
