const genericfunctions = require("../config/genericfunctions");

function initResponse(requestid) {
    let data = genericfunctions.generateResponseData(requestid);
    return Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== null));
}

exports.validateCreateIntentRequest = (req, res, next) => {
    let rd = initResponse(req._requestid);
    const { watsonid, watsonitemid, operation, item_name, description, detail } = req.body;

    if (typeof watsonid !== "number" || isNaN(watsonid)) {
        return res.status(rd.status).json({ ...rd, message: "field 'watsonid' is mandatory and must be numeric." });
    }

    if (typeof watsonitemid !== "number" || isNaN(watsonitemid)) {
        return res.status(rd.status).json({ ...rd, message: "field 'watsonitemid' is mandatory and must be numeric." });
    }

    const validOperations = ["INSERT", "UPDATE", "DELETE"];
    if (!operation || !validOperations.includes(operation)) {
        return res
            .status(rd.status)
            .json({ ...rd, message: "field 'operation' is mandatory and must be one of INSERT, UPDATE, DELETE" });
    }

    if (!item_name || typeof item_name !== "string" || !isValidIntent(item_name)) {
        return res.status(400).json({ ...rd, message: "field 'item_name' is required and must be in a valid format." });
    }

    // Validar detail
    if (detail && !Array.isArray(detail)) {
        return res.status(400).json({ ...rd, message: "field 'detail' should be a valid array." });
    }

    if (detail) {
        const valueStatusSet = new Set();
        for (const item of detail) {
            const { watsonitemdetailid, value, mentions, status } = item;

            if (typeof watsonitemdetailid !== "number" || isNaN(watsonitemdetailid)) {
                return res
                    .status(400)
                    .json({ ...rd, message: "field 'detail.watsonitemdetailid' is mandatory and must be numeric." });
            }

            if (!value || typeof value !== "string" || !isValidText(value)) {
                return res
                    .status(400)
                    .json({ ...rd, message: "field 'detail.value' is required and must be in a valid format." });
            }

            if (!status || typeof status !== "string") {
                return res
                    .status(rd.status)
                    .json({ ...rd, message: "field 'detail.status' is mandatory and must be a valid status." });
            }

            if (status === "ACTIVO") {
                const valueStatusKey = `${value}-${status}`;
                if (valueStatusSet.has(valueStatusKey)) {
                    return res.status(400).json({ ...rd, message: "Unique Violation: The value 'quiero comprar' already exists." });
                }
                valueStatusSet.add(valueStatusKey);
            }

            if (mentions && !Array.isArray(mentions)) {
                return res.status(400).json({ ...rd, message: "field 'detail.mentions' should be a valid array." });
            }

            if (mentions) {
                for (const mention of mentions) {
                    const { entity, location } = mention;

                    if (!entity || typeof entity !== "string" || !isValidIntent(entity)) {
                        return res.status(400).json({
                            ...rd,
                            message: "field 'detail.mentions.entity' is required and must be in a valid format.",
                        });
                    }

                    if (!isValidEntityOffsets(location)) {
                        return res.status(400).json({
                            ...rd,
                            message:
                                "field 'detail.mentions.location' is mandatory and must be an array of numbers (length: 2).",
                        });
                    }
                }
            }
        }
    }

    next();
};

function isValidIntent(intent) {
    if (typeof intent !== "string") return false;
    if (intent.length < 1 || intent.length > 128) return false;

    // Check if it starts with 'sys-' prefix
    if (intent.startsWith("sys-")) return false;

    // Check if intent matches the regex
    const regex = /^[\w.-]+$/;
    return regex.test(intent);
}

function isValidText(text) {
    if (typeof text !== "string") return false;
    if (text.length < 1 || text.length > 1024) return false;

    // Check for forbidden characters (carriage return, newline, tab)
    const forbiddenCharsRegex = /[\r\n\t]/;
    if (forbiddenCharsRegex.test(text)) return false;

    // Check if it consists only of whitespace characters
    const isWhitespaceOnly = /^\s*$/.test(text);
    if (isWhitespaceOnly) return false;

    return true;
}

function isValidEntityOffsets(offsets) {
    // Check if offsets is an array
    if (!Array.isArray(offsets)) return false;

    // Check if the array has exactly two items
    if (offsets.length !== 2) return false;

    // Check if both items are non-negative integers
    for (const offset of offsets) {
        if (!Number.isInteger(offset) || offset < 0) {
            return false;
        }
    }

    // Check if the start offset is less than or equal to the end offset
    if (offsets[0] > offsets[1]) return false;

    return true;
}
