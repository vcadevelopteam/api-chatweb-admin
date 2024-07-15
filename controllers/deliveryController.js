const { errors, getErrorCode, axiosObservable, setSessionParameters } = require('../config/helpers');
const { executesimpletransaction } = require('../config/triggerfunctions');
const https = require('https');

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
            if (ordersSorted.length > 2) {
                let k = 1;
                let foundNext = false;
                while (true) {
                    k++;
                    if (k === ordersSorted.length) {
                        break;
                    }

                    const posibleamount = [...result[positionResult], ordersSorted[k]].reduce((acc, item) => acc + item.amount, 0);
                    if (posibleamount <= config.insuredamount) {
                        foundNext = true;
                        break;
                    }
                }
                if (foundNext) {
                    ordersSorted.splice(1, 0, ordersSorted.splice(k, 1)[0]);
                    result[positionResult] = [...result[positionResult], ordersSorted[1]];
                    return recursiveCoordinated(false, ordersSorted.slice(1), config, result, positionResult);
                }
                return recursiveCoordinated(false, ordersSorted.slice(1), config, result, positionResult + 1);
            } else {
                return recursiveCoordinated(false, ordersSorted.slice(1), config, result, positionResult + 1);
            }
        }
    }
    else if (listPoint.length === 1 && !result[positionResult]) {
        result[positionResult] = [listPoint[0]]
    }
    return result;
}

exports.routing = async (req, res) => {
    const { parameters } = req.body;

    try {
        setSessionParameters(parameters, req.user, req._requestid);

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

            const res = await executesimpletransaction("UFN_DELIVERYROUTECODE_INS_ARRAY", { ...parameters, orders: JSON.stringify(ordersGrouped) })

            return ordersGrouped;
        }))

        return res.json({ groupedOrders })
    } catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}

exports.imaco = async (req, res) => {
    const data = JSON.stringify({
        CompanyDB: "SBODEMOUS",
        Password: "1234",
        UserName: "manager"
    });

    const options = {
        hostname: '190.12.86.123',
        port: 50000,
        path: '/b1s/v1/Login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'ROUTEID=.node3',
          'Content-Length': data.length
        },
        rejectUnauthorized: false, // Ignorar errores de certificado SSL
        // Forzar el uso de TLS 1.0; solo para diagnóstico o entornos controlados
        secureProtocol: 'TLSv1_method',
      };

    try {
        const request = https.request(options, (response) => {
            let responseBody = '';
    
            response.on('data', (chunk) => {
                responseBody += chunk;
            });
    
            response.on('end', () => {
                // Aquí puedes procesar la respuesta recibida
                console.log(responseBody);
                // Responder al cliente HTTP original con el resultado
                res.status(response.statusCode).json(JSON.parse(responseBody));
            });
        });
    
        request.on('error', (error) => {
            console.error(error);
            res.status(500).json({error});
        });
    
        request.write(data);
        request.end();
        
    } catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
};