const { errors, getErrorCode, axiosObservable } = require('../config/helpers');
const { executesimpletransaction } = require('../config/triggerfunctions');
const { parseString } = require('xml2js');
const moment = require('moment-timezone');

exports.geocode = async (req, res) => {
    const { lat, lng } = req.query;
    const APIKEY = process.env.APIKEY_GMAPS;
    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${APIKEY}`;
        const response = await axiosObservable({
            url: url,
            method: "get",
            _requestid: req._requestid,
        });
        if (response.data && response.data.status === "OK") {
            return res.json(response.data);
        }
        return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
    } catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}

async function parseKMLtoObject(kmlContent) {
    return new Promise((resolve, reject) => {
    parseString(kmlContent, (err, result) => {
        if (err) {
            reject(err);
        } else {
            resolve(result);
        }
    });
    });
}

function formatCoordinate(coordinate) {
    const [longitude, latitude] = coordinate.split(',').map(String);
    if (!isNaN(latitude) && !isNaN(longitude)) {
        const cleanLongitude = longitude.trim();
        const cleanLatitude = latitude.trim();
        return { latitude: cleanLatitude, longitude: cleanLongitude };
    } else {
        console.error(`Invalid Coordinates: Latitude ${latitude}, Longitude ${longitude}`);
        return null;
    }
}

function transformKMLtoJSON(kmlObject) {
    const newFeatures = [];

    if (kmlObject.kml && kmlObject.kml.Document && kmlObject.kml.Document[0] && kmlObject.kml.Document[0].Folder) {
    const folders = kmlObject.kml.Document[0].Folder;

    folders.forEach((folder, folderIndex) => {
        const folderName = folder.name && folder.name[0];
        const placemarks = folder.Placemark;

        if (folderName && placemarks) {
        placemarks.forEach((placemark, index) => {
            const nombre = placemark.name && placemark.name[0];
    
            const coordinates = placemark.Polygon && placemark.Polygon[0].outerBoundaryIs[0].LinearRing[0].coordinates[0];

            console.log('Folder:', folderName);
            console.log('Nombre:', nombre);
            console.log('Coordinates:', coordinates);
            
            if (nombre == 'ZONA ROJA - Santa Anita 2'){
                const x = 2
            }
            if (nombre && coordinates) {
            const coordenadas = coordinates.split(' ').map(formatCoordinate).filter(coord => coord !== null);  

            const horario = findSchedule(nombre);

            const newJSON = {
                id: 0, 
                name: nombre,
                schedule: horario,
                polygons: coordenadas,
                operation: 'INSERT'
            };

            newFeatures.push(newJSON);
            }
        });
        }
    });
    }
    console.log('Nuevo JSON:', newFeatures);
    return newFeatures;
}


function removeAccents(str) {
    if (!str) {
        return str; 
    }
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function findSchedule(nombre) {
    const schedules = {      
        "REPARTO METRO VENEZUELA": {
            monday: "12:00-22:00",
            tuesday: "12:00-22:00",
            wednesday: "12:00-22:00",
            thursday: "12:00-22:00",
            friday: "12:00-22:00",
            saturday: "12:00-22:00",
            sunday: "12:00-22:00"
        },    
 	    "REPARTO FAUCETT": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
        },      
        "ZONA ROJA METRO VENEZUELA": {
            monday: "12:00-17:00",
            tuesday: "12:00-17:00",
            wednesday: "12:00-17:00",
            thursday: "12:00-17:00",
            friday: "12:00-17:00",
            saturday: "12:00-17:00",
            sunday: "12:00-17:00"
        },  
        "ZONA ROJA FAUCETT": {
            monday: "12:00-16:00",
            tuesday: "12:00-16:00",
            wednesday: "12:00-16:00",
            thursday: "12:00-16:00",
            friday: "12:00-16:00",
            saturday: "12:00-16:00",
            sunday: "12:00-16:00"
        },  
	    "REPARTO AVIACIÓN 24": {
            monday: "12:00-22:00",
            tuesday: "12:00-22:00",
            wednesday: "12:00-22:00",
            thursday: "12:00-22:00",
            friday: "12:00-22:00",
            saturday: "12:00-22:00",
            sunday: "12:00-22:00"
        },
        "REPARTO AVIACIÓN 29": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:00"
        },
        "REPARTO SALAVERRY": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
        },
        "REPARTO BELLAVISTA REST": {
            monday: "12:00-22:00",
            tuesday: "12:00-22:00",
            wednesday: "12:00-22:00",
            thursday: "12:00-22:00",
            friday: "12:00-22:00",
            saturday: "12:00-22:00",
            sunday: "12:00-22:00"
        },        
        "REPARTO GARZON": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
        },
        "REPARTO HUANDOY": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
        },
        "REPARTO COLONIAL 2": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
        },
        "REPARTO PRO": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
        },
        "REPARTO MÉXICO 1": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-21:30"
        },
        "REPARTO LINCE": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
        },
        "REPARTO MARINA 17": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
        },
        "REPARTO MARINA 26": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
        },
        "REPARTO MEGA PLAZA 2": {
            monday: "12:00-22:00",
            tuesday: "12:00-22:00",
            wednesday: "12:00-22:00",
            thursday: "12:00-22:00",
            friday: "12:00-22:00",
            saturday: "12:00-22:00",
            sunday: "12:00-22:00"
        },
        "REPARTO MAGDALENA": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
        },
        "REPARTO LA MOLINA": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:00"
        },
 	    "REPARTO OLIVOS": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
        },
        "REPARTO PUENTE PIEDRA 1": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
        },
        "REPARTO VILLA MARIA": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
        },
        "REPARTO SUCRE": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
        },
        "REPARTO SANTA ANITA MALL": {
            monday: "12:00-22:00",
            tuesday: "12:00-22:00",
            wednesday: "12:00-22:00",
            thursday: "12:00-22:00",
            friday: "12:00-22:00",
            saturday: "12:00-22:00",
            sunday: "12:00-22:00"
        },
        "REPARTO GAMARRA 3": {
            monday: "12:00-20:00",
            tuesday: "12:00-20:00",
            wednesday: "12:00-20:00",
            thursday: "12:00-20:00",
            friday: "12:00-20:00",
            saturday: "12:00-20:00",
            sunday: "12:00-17:30"
        },
        "REPARTO PERÚ 2": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
        },
        "REPARTO PLAZA CASTILLA": {
            monday: "12:00-21:00",
            tuesday: "12:00-21:00",
            wednesday: "12:00-21:00",
            thursday: "12:00-21:00",
            friday: "12:00-21:00",
            saturday: "12:00-21:00",
            sunday: "12:00-21:00"
        },
        "REPARTO JESÚS MARÍA": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
        },
        "REPARTO VITARTE 2": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "00:00-22:30",
            sunday: "12:00-22:30"
        },
        "REPARTO ABANCAY 2": {
            monday: "12:00-21:30",
            tuesday: "12:00-21:30",
            wednesday: "12:00-21:30",
            thursday: "12:00-21:30",
            friday: "12:00-21:30",
            saturday: "12:00-21:30",
            sunday: "12:00-20:30"
        },
        "REPARTO ZARATE 1": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
        },
        "REPARTO SANTA ANITA 2": {
            monday: "12:00-21:30",
            tuesday: "12:00-21:30",
            wednesday: "12:00-21:30",
            thursday: "12:00-21:30",
            friday: "12:00-21:30",
            saturday: "12:00-21:30",
            sunday: "12:00-21:30"
        },
        "REPARTO PANAMA": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
        },
        "ZONA ROJA PERU 2": {
            monday: "12:00-17:00",
            tuesday: "12:00-17:00",
            wednesday: "12:00-17:00",
            thursday: "12:00-17:00",
            friday: "12:00-17:00",
            saturday: "12:00-17:00",
            sunday: "12:00-17:00"
        },
  	    "ZONA ROJA COLONIAL 2": {
            monday: "12:00-18:00",
            tuesday: "12:00-18:00",
            wednesday: "12:00-18:00",
            thursday: "12:00-18:00",
            friday: "12:00-18:00",
            saturday: "12:00-18:00",
            sunday: "12:00-18:00"
        },       
        "ZONA ROJA MEXICO 1": {
            monday: "12:00-18:00",
            tuesday: "12:00-18:00",
            wednesday: "12:00-18:00",
            thursday: "12:00-18:00",
            friday: "12:00-18:00",
            saturday: "12:00-18:00",
            sunday: "12:00-18:00"
        },
        "ZONA ROJA ABANCAY 2": {
            monday: "12:00-18:00",
            tuesday: "12:00-18:00",
            wednesday: "12:00-18:00",
            thursday: "12:00-18:00",
            friday: "12:00-18:00",
            saturday: "12:00-18:00",
            sunday: "12:00-18:00"
        },
        "ZONA ROJA SANTA ANITA 2": {
            monday: "12:00-17:00",
            tuesday: "12:00-17:00",
            wednesday: "12:00-17:00",
            thursday: "12:00-17:00",
            friday: "12:00-17:00",
            saturday: "12:00-17:00",
            sunday: "12:00-17:00"
        },
        "ZONA ROJA VITARTE 2": {
            monday: "12:00-18:00",
            tuesday: "12:00-18:00",
            wednesday: "12:00-18:00",
            thursday: "12:00-18:00",
            friday: "12:00-18:00",
            saturday: "12:00-18:00",
            sunday: "12:00-18:00"
        },
        "ZONA ROJA MALL SANTA ANITA": {
            monday: "12:00-18:00",
            tuesday: "12:00-18:00",
            wednesday: "12:00-18:00",
            thursday: "12:00-18:00",
            friday: "12:00-18:00",
            saturday: "12:00-18:00",
            sunday: "12:00-18:00"
        },
        "ZONA ROJA LA MOLINA": {
            monday: "12:00-18:00",
            tuesday: "12:00-18:00",
            wednesday: "12:00-18:00",
            thursday: "12:00-18:00",
            friday: "12:00-18:00",
            saturday: "12:00-18:00",
            sunday: "12:00-18:00"
        },
        "ZONA ROJA PANAMA": {
            monday: "12:00-17:00",
            tuesday: "12:00-17:00",
            wednesday: "12:00-17:00",
            thursday: "12:00-17:00",
            friday: "12:00-17:00",
            saturday: "12:00-17:00",
            sunday: "12:00-17:00"
        },
    };

    const lowerCaseName = removeAccents(nombre.toLowerCase());

    let bestSimilarity = 0;
    let bestSchedule = null;

    for (const scheduleName in schedules) {
        const keyWords = scheduleName.split(" ");
        const similarity = keyWords.reduce((total, word) => {
            if (lowerCaseName.includes(word.toLowerCase())) {
            return total + 1;
            }
            return total;
        }, 0);

        if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
            bestSchedule = schedules[scheduleName];
        }
    }  

    return bestSchedule || {};
}

exports.polygonsinsertmassive = async (req, res) => {
    try {       
        const {corpid, orgid, username} = req.body;

        const buffer = req.file.buffer;
        const kmlContent = buffer.toString();
        const kmlObject = await parseKMLtoObject(kmlContent);
        const transformedJSON = transformKMLtoJSON(kmlObject);
        const formattedJson = JSON.stringify(transformedJSON, null, 2);

        console.log("cantidad", transformedJSON.length);

        await executesimpletransaction("UFN_POLYGONS_INS_ARRAY", { corpid, orgid, username, table: formattedJson });

        return res.json({ corpid, orgid });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
}


function isInsideSchedule(polygons, currentDateTime) {
    moment.tz.setDefault('America/Lima');
    for (const polygon of polygons) {
        const { schedule } = polygon;
        const dayOfWeek = currentDateTime.format('dddd').toLowerCase();
        
        if (schedule[dayOfWeek]) {
        const [startHour, endHour] = schedule[dayOfWeek].split('-');
        const [startHourNum, startMinute] = startHour.split(':');
        const [endHourNum, endMinute] = endHour.split(':');
        
        const startMoment = currentDateTime.clone().set({ hour: startHourNum, minute: startMinute });
        const endMoment = currentDateTime.clone().set({ hour: endHourNum, minute: endMinute });
        
        startMoment.tz('America/Lima');
        endMoment.tz('America/Lima');

        if (currentDateTime.isBetween(startMoment, endMoment, null, '[]')) {
            return true;
        }
        }
    }
    return false;
}

exports.findcoordinateinpolygons = async (req, res) => {
    moment.tz.setDefault('America/Lima');
    try {
        const { corpid, orgid, latitude, longitude, order_datetime } = req.body;
        const currentDateTime = order_datetime
        ? moment(order_datetime).tz('America/Lima')
        : moment().tz('America/Lima');
        const result = await executesimpletransaction("SEARCH_POINT_ON_AREAS", { corpid, orgid, latitude, longitude });
        const modifiedResult = result.map((polygon) => {
            let modifiedName = polygon.name;
            if (modifiedName.toLowerCase().includes('zona roja - ')) {
                modifiedName = modifiedName.replace(/zona roja - /i, 'Reparto ');
            }            
            return {
                polygonsid: polygon.polygonsid,
                name: modifiedName,
                schedule: polygon.schedule,
            };
        });
        const inside_schedule = modifiedResult.length > 0 && isInsideSchedule(modifiedResult, currentDateTime);
        const response = {
            corpid,
            orgid,
            result: modifiedResult,
            inside_schedule,
            order_datetime: currentDateTime.format('YYYY-MM-DD HH:mm:ss'),
        };
        return res.json(response);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};