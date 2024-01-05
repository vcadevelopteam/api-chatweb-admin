const { getErrorCode } = require("../config/helpers");
const { executesimpletransaction } = require("../config/triggerfunctions");
const logger = require("../config/winston");

exports.updateInfo = async (req, res) => {
  const {
    order_id,
    delivery_type,
    delivery_date,
    delivery_address,
    delivery_address_reference,
    paymentmethod,
    payment_receipt,
    payment_document_type,
    payment_document_number,
    payment_businessname,
    payment_fiscal_address,
    payment_date,
    payment_amount,
    payment_attachment,
  } = req.body;

  try {
    if (Object.keys(req.body).length === 0) {
      throw new Error("Body is empty");
    }

    updateData = await executesimpletransaction("UFN_API_ORDER_UPDATE_INFO", {
      order_id,
      delivery_type,
      delivery_date,
      delivery_address,
      delivery_address_reference,
      paymentmethod,
      payment_receipt,
      payment_document_type,
      payment_document_number,
      payment_businessname,
      payment_fiscal_address,
      payment_date,
      payment_amount,
      payment_attachment,
    });

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
