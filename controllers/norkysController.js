const { executesimpletransaction, executeTransaction } = require("../config/triggerfunctions");
const { getErrorCode, errors, axiosObservable } = require("../config/helpers");


exports.SendInfo = async (req, res) => {
    try {
        const { shopping_order_id, IdTipoPedido, phone, firstname, lastname, address, referencia, IdTipoEmision, TipoEmision, documentnumber, factura_razonsocial, factura_direccionfiscal, factura_ruc, factura_email, observacion, shopping_cart_products, IdTipoPago, Metodo, MontoTotalPagar, IdTarjeta, Tipo, idlocal, NombreLocal } = req.body;

        const newData = {
            "CodigoOrden": shopping_order_id,
            "Usuario": "",
            "TipoPedido": IdTipoPedido,
            "Cliente": {
                "Telefono": phone,
                "Nombres": firstname,
                "Apellidos": lastname,
                "Direccion": address,
                "Referencia": referencia
            },
            "IdTipoEmision": IdTipoEmision,
            "TipoEmision": TipoEmision,
            "ClienteDocumento": {
                "Empresa": IdTipoEmision === "01" ? factura_razonsocial : `${firstname} ${lastname}`,
                "Direccion": IdTipoEmision === "01" ? factura_direccionfiscal : "",
                "Correo": IdTipoEmision === "01" ? factura_email : "",
                "Ruc": IdTipoEmision === "01" ? factura_ruc : documentnumber
            },
            "Observacion": observacion,
            "Details": [...shopping_cart_products].map(({ title, Code, Quantity, Item_price }) => ({
                "Producto": {
                    "Name": title,
                    "CodigoProducto": Code
                },
                "Cantidad": parseInt(Quantity),
                "PrecioUnitario": parseFloat(Item_price),
                "Total": Quantity * Item_price
            })),
            "Pago": {
                "IdTipoPago": IdTipoPago,
                "Metodo": Metodo,
                "Total": parseFloat(MontoTotalPagar),
                "Tarjeta": {
                    "IdTarjeta": IdTarjeta,
                    "Tipo": Tipo
                }
            },
            "Restaurante": {
                "IdLocal": idlocal ? parseInt(idlocal) : 0,
                "Name": NombreLocal
            },
            "Portal": {
                "Id": 1,
                "Name": "Pedidos WhatsApp"
            }
        }

        console.log("newData", newData)
        const response = await axiosObservable({
            method: "post",
            url: `https://norkysjobs.azurewebsites.net/api/PedidosWhatsApp/order`,
            data: newData,
            _requestid: req._requestid,
        });

        if (!response.data)
            return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));

        return res.json({ success: true, data: newData, result: response.data });
    } catch (error) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
};