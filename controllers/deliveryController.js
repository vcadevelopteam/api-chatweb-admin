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

const recursiveCoordinated = (listPoint, maxItems, limitGroup, result, positionResult = 0) => {
    if (listPoint.length > 1 && limitGroup >= result.length) {
        const ordersSorted = listPoint.map(x => ({ ...x, distance: getDistanceBetweenPoints(listPoint[0], x) })).sort((a, b) => a.distance - b.distance);
        const resultGroupTmp = [...(result[positionResult] || [ordersSorted[0]]), ordersSorted[1]];

        if (resultGroupTmp.length <= maxItems) {
            result[positionResult] = resultGroupTmp;
            return recursiveCoordinated(ordersSorted.slice(1), maxItems, limitGroup, result, positionResult);
        } else {
            if (result.length <= limitGroup) {
                return recursiveCoordinated(ordersSorted.slice(1), maxItems, limitGroup, result, positionResult + 1);
            }
        }
    }
    return result;
}

const coordenadas = [
    { latitude: -12.0453, longitude: -77.0300, city: "Lima" },
    { latitude: -6.7711, longitude: -79.8563, city: "Chiclayo" },
    { latitude: -7.1617, longitude: -78.5122, city: "Cajamarca" },
    { latitude: -12.0976, longitude: -77.0365, city: "Lima" },
    { latitude: -6.7704, longitude: -79.8375, city: "Chiclayo" },
    { latitude: -7.1500, longitude: -78.5300, city: "Cajamarca" },
    { latitude: -12.046374, longitude: -77.042793, city: "Lima" },
    { latitude: -6.7596, longitude: -79.8323, city: "Chiclayo" },
    { latitude: -7.1800, longitude: -78.5000, city: "Cajamarca" },
    { latitude: -12.0560, longitude: -77.0844, city: "Lima" },
    { latitude: -6.7766, longitude: -79.8443, city: "Chiclayo" },
    { latitude: -7.1690, longitude: -78.4950, city: "Cajamarca" },
    { latitude: -12.0259, longitude: -77.0501, city: "Lima" },
    { latitude: -6.7823, longitude: -79.8445, city: "Chiclayo" },
    { latitude: -7.1580, longitude: -78.4820, city: "Cajamarca" }
];

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
            delete element.deliveryconfiguration;
            return element
        });

        const stores = orders.reduce((acc, ordd) => ({
            ...acc,
            [`${ordd.storeid}`]: [...(acc[`${ordd.storeid}`] || []), ordd]
        }), {})

        const aa = recursiveCoordinated(coordenadas, 5, 9, [], 0)

        // console.log("result", JSON.stringify(orders))
        return res.json({ aa })
    } catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}

