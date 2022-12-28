const { executesimpletransaction, exportMobile } = require('../../config/mobile/triggerMobileFunction');
const { setSessionParameters } = require('../../config/helpers');
const fs = require('fs');

exports.GetCollection = async (req, res) => {
    try {
        const { parameters = {}, method } = req.body;
        console.log("method executed", method);
        setSessionParameters(parameters, req.user, req._requestid);

        const result = await executesimpletransaction(method, parameters, req.user.menu || {});
        if (result instanceof Array)
            return res.json(result);
        else
            return res.status(400).json(result);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}
exports.SeleccionarPedido = async (req, res) => {
    let { cantidad_producto_01, cantidad_producto_02, cantidad_producto_03, cantidad_producto_04, detalle_producto_01, detalle_producto_02, detalle_producto_03, detalle_producto_04, codigo_producto_01, codigo_producto_02, codigo_producto_03, codigo_producto_04, index_producto } = req.body;

    let i = 1;
    let concatenado = [];

    if (parseInt(cantidad_producto_01)) {
        concatenado.push(codigo_producto_01)
        i++;
    }
    if (parseInt(cantidad_producto_02)) {
        concatenado.push(codigo_producto_02)
        i++;
    }
    if (parseInt(cantidad_producto_03)) {
        concatenado.push(codigo_producto_03)
        i++;
    }
    if (parseInt(cantidad_producto_04)) {
        concatenado.push(codigo_producto_04)
        i++;
    }
    console.log(concatenado);
    const ff = concatenado[parseInt(index_producto) - 1]
    return res.json({
        success: true,
        result: {
            codigo_producto: ff
        }
    });
}
exports.GuardarPedido = async (req, res) => {
    let { codigocliente, cantidad_producto_01, cantidad_producto_02, cantidad_producto_03, cantidad_producto_04, detalle_producto_01, detalle_producto_02, detalle_producto_03, detalle_producto_04, codigo_producto_01, codigo_producto_02, codigo_producto_03, codigo_producto_04 } = req.body;

    const detallepedido = JSON.stringify({
        cantidad_producto_01, cantidad_producto_02, cantidad_producto_03, cantidad_producto_04, detalle_producto_01, detalle_producto_02, detalle_producto_03, detalle_producto_04, codigo_producto_01, codigo_producto_02, codigo_producto_03, codigo_producto_04
    })

    result = await executesimpletransaction("QUERY_GUARDAR_PEDIDO", { detalleultimopedido: detallepedido, codigocliente });

    return res.json({
        success: true,
    });
}
exports.ConcatenarPedido = async (req, res) => {
    let { cantidad_producto_01, cantidad_producto_02, cantidad_producto_03, cantidad_producto_04, detalle_producto_01, detalle_producto_02, detalle_producto_03, detalle_producto_04, codigo_producto_01, codigo_producto_02, codigo_producto_03, codigo_producto_04 } = req.body;

    let i = 1;
    let concatenado = "";

    if (parseInt(cantidad_producto_01)) {
        concatenado += `*${i}*. ${detalle_producto_01} (${codigo_producto_01})  - ${cantidad_producto_01} unidades\n`
        i++;
    }
    if (parseInt(cantidad_producto_02)) {
        concatenado += `*${i}*. ${detalle_producto_02} (${codigo_producto_02})  - ${cantidad_producto_02} unidades\n`
        i++;
    }
    if (parseInt(cantidad_producto_03)) {
        concatenado += `*${i}*. ${detalle_producto_03} (${codigo_producto_03})  - ${cantidad_producto_03} unidades\n`
        i++;
    }
    if (parseInt(cantidad_producto_04)) {
        concatenado += `*${i}*. ${detalle_producto_04} (${codigo_producto_04})  - ${cantidad_producto_04} unidades\n`
        i++;
    }

    return res.json({
        success: true,
        result: {
            concatenado
        }
    });
}
exports.SplitFirst = async (req, res) => {
    const { text, split, index } = req.body;
    try {
        return res.json({
            success: true,
            result: text.split(split)[index]
        });
    } catch (error) {
        return res.json({
            success: false,
            result: text.split(split)[index]
        });
    }
}

exports.GetCient = async (req, res) => {
    try {
        let result;
        const { phone, address } = req.body;

        if (address) {
            result = await executesimpletransaction("QUERY_GET_CLIENT_BY_ADDRESS", { address });
        } else {
            result = await executesimpletransaction("QUERY_GET_CLIENT_BY_PHONE", { phone });
        }

        if (result instanceof Array && result.length > 0) {
            const clienttmp = result[0];
            if (clienttmp.detalleultimopedido) {
                const detalle = JSON.parse(clienttmp.detalleultimopedido);

                let { cantidad_producto_01, cantidad_producto_02, cantidad_producto_03, cantidad_producto_04, detalle_producto_01, detalle_producto_02, detalle_producto_03, detalle_producto_04, codigo_producto_01, codigo_producto_02, codigo_producto_03, codigo_producto_04 } = detalle;

                cantidad_producto_01 = parseInt(cantidad_producto_01);
                cantidad_producto_02 = parseInt(cantidad_producto_02);
                cantidad_producto_03 = parseInt(cantidad_producto_03);
                cantidad_producto_04 = parseInt(cantidad_producto_04);
                let concatenado = "";
                if (cantidad_producto_01) {
                    concatenado += `- ${detalle_producto_01} (${codigo_producto_01})  - ${cantidad_producto_01} unidades\n`
                }
                if (cantidad_producto_02) {
                    concatenado += `- ${detalle_producto_02} (${codigo_producto_02})  - ${cantidad_producto_02} unidades\n`
                }
                if (cantidad_producto_03) {
                    concatenado += `- ${detalle_producto_03} (${codigo_producto_03})  - ${cantidad_producto_03} unidades\n`
                }
                if (cantidad_producto_04) {
                    concatenado += `- ${detalle_producto_04} (${codigo_producto_04})  - ${cantidad_producto_04} unidades\n`
                }
                delete clienttmp.detalleultimopedido
                return res.json({
                    success: true,
                    result: {
                        ...clienttmp,
                        detalle,
                        concatenado
                    }
                });
            } else {
                delete clienttmp.detalleultimopedido
                return res.json({
                    success: true,
                    result: {
                        ...clienttmp
                    }
                });
            }


        }
        else {
            return res.json({
                success: false,
                msg: "No existe el cliente"
            });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}

exports.multiTransaction = async (req, res) => {
    try {
        const data = req.body.map(x => {
            if (!x.data.corpid)
                x.data.corpid = req.user.corpid ? req.user.corpid : 1;
            if (!x.data.orgid)
                x.data.orgid = req.user.orgid ? req.user.orgid : 1;
            if (!x.data.username)
                x.data.username = req.user.usr;
            if (!x.data.userid)
                x.data.userid = req.user.userid;
            return x;
        })

        const result = await executeMultiTransactions(data);

        return res.json(result);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}

exports.getCollectionPagination = async (req, res) => {
    try {
        const { data, methodcollection, methodcount, consultcount } = req.body;

        if (!data.corpid)
            data.corpid = req.user.corpid;
        if (!data.orgid)
            data.orgid = req.user.orgid;
        if (!data.username)
            data.username = req.user.usr;
        if (!data.userid)
            data.userid = req.user.userid;

        const result = await getCollectionPagination(methodcollection, methodcount, data, consultcount);
        res.json(result);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}
exports.export = async (req, res) => {
    try {
        const { data, method } = req.body;

        if (!data.corpid)
            data.corpid = req.user.corpid ? req.user.corpid : 1;
        if (!data.orgid)
            data.orgid = req.user.orgid ? req.user.orgid : 1;
        if (!data.username)
            data.username = req.user.usr;

        const result = await exportMobile(method, data);
        res.json(result);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}
