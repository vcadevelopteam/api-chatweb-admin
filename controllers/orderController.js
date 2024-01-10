const { getErrorCode, setSessionParameters } = require("../config/helpers");
const { executesimpletransaction } = require("../config/triggerfunctions");
const logger = require("../config/winston");

exports.updateInfo = async (req, res) => {
  const parameters = req.body || {};

  try {
    if (Object.keys(parameters).length === 0) {
      throw new Error("Body is empty");
    }

    // setSessionParameters(parameters, req.user, req._requestid);
    updateData = await executesimpletransaction("UFN_API_ORDER_UPDATE_INFO", parameters);

    if (!(updateData instanceof Array)) {
      return res
        .status(500)
        .json(getErrorCode(updateData.code || "UNEXPECTED_ERROR"));
    }

    return res.json({
      error: false,
      success: true,
      data: "Actualizado correctamente.",
    });
  } catch (exception) {
    logger
      .child({
        error: { detail: exception.stack, message: exception.toString() },
      })
      .error(`Request to ${req.originalUrl}`);
    return res.status(500).json({
      error: true,
      success: false,
      data: "Error al actualizar.",
    });
  }
};
