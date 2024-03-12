const { errors, getErrorCode, axiosObservable, setSessionParameters } = require('../config/helpers');
const { executesimpletransaction } = require('../config/triggerfunctions');

// ufn_orders_by_configuration_sel(
// 	p_corpid bigint,
// 	p_orgid bigint,
// 	p_listorderid text)
//     RETURNS TABLE (orderid bigint, latitude numeric, longitude numeric, amount double precision,
// 				   storeid bigint, coveragearea jsonb, deliveryconfiguration json)

function getDistanceBetweenPoints(point1, point2) {
    var radLat1 = Math.PI * point1.latitude / 180;
    var radLat2 = Math.PI * point2.latitude / 180;
    var theta = point1.longitude - point2.longitude;
    var radTheta = Math.PI * theta / 180;

    var a = Math.sin(radLat1) * Math.sin(radLat2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.cos(radTheta);
    if (a > 1) a = 1;
    var d = Math.acos(a);

    d = d * 180 / Math.PI;
    d = d * 60 * 1.1515;            // Millas
    d = d * 1.609344;               // Kilómetros

    return d;
}

// const recursiveCoordinated = (listPoint, maxItems, limitGroup, result, positionResult = 0) => {
//     if (listPoint.length > 1 && limitGroup >= result.length) {
//         const ordersSorted = listPoint.map(x => ({ ...x, distance: getDistanceBetweenPoints(listPoint[0], x) })).sort((a, b) => a.distance - b.distance);
//         const resultGroupTmp = [...(result[positionResult] || [ordersSorted[0]]), ordersSorted[1]];

//         if (resultGroupTmp.length <= maxItems) {
//             result[positionResult] = resultGroupTmp;
//             return recursiveCoordinated(ordersSorted.slice(1), maxItems, limitGroup, result, positionResult);
//         } else {
//             if (result.length <= limitGroup) {
//                 return recursiveCoordinated(ordersSorted.slice(1), maxItems, limitGroup, result, positionResult + 1);
//             }
//         }
//     }
//     return result;
// }
const recursiveCoordinated = (init, listPoint, config, result, positionResult = 0) => {
    if (listPoint.length > 1) {
        const ordersSorted = listPoint.map(x => ({ ...x, distance: getDistanceBetweenPoints(listPoint[0], x) })).sort((a, b) => a.distance - b.distance);

        let resultGroupTmp = [];

        if (!result[positionResult]) {
            if (ordersSorted[0].amount <= config.insuredamount) {
                result[positionResult] = [ordersSorted[0]];
            } else {
                return recursiveCoordinated(false, ordersSorted.slice(1), config, result, positionResult + 1);
            }
        }

        resultGroupTmp = [...result[positionResult], ordersSorted[1]];
        const totalamount = resultGroupTmp.reduce((acc, item) => acc + item.amount, 0);
        if (totalamount <= config.insuredamount) {
            result[positionResult] = resultGroupTmp;
            return recursiveCoordinated(false, ordersSorted.slice(1), config, result, positionResult);
        } else {
            return recursiveCoordinated(false, ordersSorted.slice(1), config, result, positionResult + 1);
        }
    }
    else if (listPoint.length === 1 && init) {
        result[positionResult] = [...(result[positionResult] || []), listPoint[0]]
    }
    return result;
}

exports.routing = async (req, res) => {
    const { parameters } = req.body;

    try {
        setSessionParameters(parameters, req.user, req._requestid);

        parameters.corpid = 1407;
        parameters.orgid = 1678;

        const orders = (await executesimpletransaction("UFN_ORDERS_BY_CONFIGURATION_SEL", parameters)).map(element => {
            element.latitude = parseFloat(element.latitude);
            element.longitude = parseFloat(element.longitude);
            delete element.coveragearea;
            // delete element.deliveryconfiguration;
            return element
        });
        console.log("orders.length", orders.length)
        const stores = orders.reduce((acc, ordd) => ({
            ...acc,
            [`${ordd.storeid}`]: [...(acc[`${ordd.storeid}`] || []), ordd]
        }), {});

        const groupedOrders = await Promise.all(Object.values(stores).map(async (store, index) => {
            const config = store[0].deliveryconfiguration[0];
            config.insuredamount = parseFloat(config.insuredamount);
            config.capacity = parseFloat(config.capacity);
            const groupedOrders = recursiveCoordinated(true, store, config, [], 0)
            const ordersGrouped = groupedOrders.filter(x => x).map(group => group.map(order => order.orderid))
            console.log("ordersGrouped", ordersGrouped)
            // return ordersGrouped;
            const res = await executesimpletransaction("UFN_DELIVERYROUTECODE_INS_ARRAY", { ...parameters, orders: JSON.stringify(ordersGrouped) })
        }))

        return res.json({ groupedOrders })
    } catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}

