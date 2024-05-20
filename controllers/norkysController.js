const { executesimpletransaction, executeTransaction } = require("../config/triggerfunctions");
const { getErrorCode, errors, axiosObservable } = require("../config/helpers");


exports.SendInfo = async (req, res) => {
    try {
        const { shopping_order_id, IdTipoPedido, phone, firstname, lastname, address, referencia, IdTipoEmision, TipoEmision, documentnumber, factura_razonsocial, factura_direccionfiscal, factura_ruc, factura_email, observacion, shopping_cart_products, IdTipoPago, Metodo, MontoTotalPagar, MontoPagar, MontoVuelto, Numero, IdTarjeta, Tipo, idlocal, NombreLocal, Coordenada } = req.body;

        const newData = {
            "CodigoOrden": shopping_order_id,
            "Usuario": "",
            "TipoPedido": IdTipoPedido,
            "Cliente": {
                "Telefono": phone,
                "Nombres": firstname,
                "Apellidos": lastname,
                "Direccion": address,
                "Referencia": referencia,
                "Coordenada": Coordenada
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
            "Details": [...shopping_cart_products].map(({ Title, CustomLabel1, Quantity, Item_price }) => ({
                "Producto": {
                    "Name": Title,
                    "CodigoProducto": CustomLabel1
                },
                "Cantidad": parseInt(Quantity),
                "PrecioUnitario": parseFloat(Item_price),
                "Total": Quantity * Item_price
            })),
            "Pago": {
                "IdTipoPago": IdTipoPago,
                "Metodo": Metodo,
                "TotalOrden": parseFloat(MontoTotalPagar),
                "TotalPago": `${Metodo}`.toLocaleLowerCase() === "efectivo" ? parseFloat(MontoPagar) : parseFloat(MontoTotalPagar),
                "Vuelto": `${Metodo}`.toLocaleLowerCase() === "efectivo" ? parseFloat(MontoVuelto) : 0,
                "Tarjeta": {
                    "IdTarjeta": `${Metodo}`.toLocaleLowerCase() === "efectivo" ? "" : IdTarjeta,
                    "Tipo": `${Metodo}`.toLocaleLowerCase() === "efectivo" ? "" : Tipo,
                    "Numero": `${Metodo}`.toLocaleLowerCase() === "online" ? Numero : ""
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
    } catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
};



exports.RockysSendInfo = async (req, res) => {
    try {
        const { username, password, channel, store_id, account_id, total_paid, shopping_cart_products, payment_method, address_name, address_coord, customer_name, customer_phone, customer_lastname, customer_telephone, customer_document_type, customer_document_number, shipping_amount, shipping_method, last_four_digits, terms_conditions, customer_group_id, customer_is_guest, total_qty_ordered, external_code_store, external_order_code, card_mask, number_auth } = req.body;
        const shipping_method1 = shipping_method === "Recojo en tienda" ? "recojo_en_tienda" : "delivery";
        const newData = {
            "origin": "",
            "status": "",
            "weight": 0,
            "channel": channel,//validar
            "coupons": [],
            "user_id": null,
            "store_id": store_id,
            "order_ruc": "",
            "pos_store": "",
            "pre_order": false,
            "account_id": account_id,
            "cluster_id": 1, //validar
            "email_sent": false,
            "order_type": 0,
            "pos_status": "",
            "tax_amount": 0,
            "total_paid": Number(total_paid),
            "coupon_code": "",
            "customer_id": null,
            "grand_total": 0,
            "number_auth": "",
            "wallet_name": "",
            "increment_id": "",
            "total_change": 0,
            "notifications": true,
            "order_comment": "",
            "order_details": shopping_cart_products.map(({ Title, Item_price, Quantity, Description, CustomLabel0, ProductcatalogId, Product_retailer_id }) => ({
                "id": 0,
                "sku": "",
                "name": Title,
                "price": parseFloat(Item_price),
                "weight": 0,
                "comment": "",
                "product": null,
                "childrens": [],
                "parent_id": null,
                "row_total": parseFloat(Item_price),
                "opt_change": "",
                "row_weight": 0,
                "coupon_type": "",
                "description": Description,
                "qty_ordered": Number(Quantity),
                "modify_price": false,
                "product_type": CustomLabel0,
                "title_option": "",
                "coupon_brands": 0,
                "coupon_stores": "",
                "original_price": parseFloat(Item_price),
                "sales_order_id": null,
                "coupon_date_end": "",
                "coupon_date_ini": "",
                "discount_amount": 0,
                "product_options": "[]",
                "coupon_qty_apply": 0,
                "discount_percent": 0,
                "coupon_product_id": 0,
                "product_as_coupon": false,
                "catalog_product_id": ProductcatalogId,
                "product_id_external": Product_retailer_id,
                "coupon_life_days_apply": ""
            })),
            "tracking_code": "",
            "customer_email": "",
            "external_store": "",
            "payment_method": payment_method,
            "renueve_center": 0,
            "tax_percentage": 18,
            "billing_address": {
                "address_name": address_name,
                "address_type": "",
                "address_coord": address_coord,
                "address_place": "",
                "customer_name": customer_name,
                "address_number": "",
                "customer_email": "",
                "customer_phone": customer_phone,
                "address_reference": "",
                "customer_lastname": customer_lastname,
                "customer_telephone": customer_telephone,
                "customer_document_type": customer_document_type,
                "customer_document_number": customer_document_number
            },
            "discount_amount": 0,
            "discount_coupon": 0,
            "shipping_amount": Number(shipping_amount || "0"),
            "shipping_method": shipping_method1,
            "last_four_digits": last_four_digits,
            "shipping_address": {
                "address_name": address_name,
                "address_type": "",
                "address_coord": address_coord,
                "address_place": "",
                "customer_name": customer_name,
                "address_number": "",
                "customer_email": "",
                "customer_phone": customer_phone,
                "address_reference": "",
                "customer_lastname": customer_lastname,
                "customer_telephone": customer_phone,
                "customer_document_type": customer_document_type,
                "customer_document_number": customer_document_number
            },
            "terms_conditions": terms_conditions,//validar
            "customer_group_id": customer_group_id,//validar
            "customer_is_guest": customer_is_guest,
            "customer_lastname": customer_lastname,
            "delivery_date_max": null,
            "delivery_date_min": null,
            "total_qty_ordered": Number(total_qty_ordered),
            "customer_firstname": customer_name,
            "order_razon_social": "",
            "external_code_store": external_code_store,//validar
            "external_order_code": external_order_code,
            "order_currency_code": "",
            "discount_description": "",
            "pedidos_ya_discounts": null,
            "sales_order_payments": [
                {
                    "amount": Number(total_paid),
                    "card_mask": card_mask,
                    "four_digits": last_four_digits,
                    "number_auth": number_auth,
                    "external_code": "",
                    "payment_method": payment_method,//validar
                    sales_order_id: 0,
                    id: 0
                }
            ],
            "shipping_is_delivery": shipping_method1 === "delivery",
            "is_order_with_invoice": false,
            "shipping_address_name": "",
            "customer_document_type": "dni",
            "shipping_address_coord": "",
            "shipping_address_place": "",
            "user_commission_amount": 0,
            "shipping_address_number": "",
            "store_commission_amount": 0,
            "customer_document_number": customer_document_number,
            "shipping_discount_amount": 0,
            "shipping_address_reference": ""
        }

        const BASEURL = "https://xbwwogv5hb.execute-api.us-east-1.amazonaws.com/devel/api";
        const path = "/public/2/orders-cms";

        // Codificar en Base64 las credenciales
        const token = Buffer.from(`${username || '1xju2o6eay81vuylorpa'}:${password || 'xt8p8agzmee22sa4ab11'}`, 'utf8').toString('base64');

        const response = await axiosObservable({
            method: "post",
            url: `${BASEURL}${path}`,
            headers: {
                'Authorization': `Basic ${token}`,
                'x-api-key': `lWioGDBjDv9ANDrtSEWyw85IMP4bcfUY8Eo1E4d8`,
            },
            data: newData,
            _requestid: req._requestid,
            responseError: true
        });

        if (!response.data)
            return res.status(400).json(getErrorCode(errors.REQUEST_SERVICES));

        return res.json({ success: true, data: newData, result: response.data });
    } catch (exception) {
        getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid)
        return res.status(500).json(exception.response.data);
    }
};