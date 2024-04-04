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

                    if (nombre == 'ZONA ROJA - Santa Anita 2') {
                        const x = 2
                    }
                    if (nombre && coordinates) {
                        const storeid = findStoreId(nombre);  
                        const coordenadas = coordinates.split(' ').map(formatCoordinate).filter(coord => coord !== null);

                        const horario = findSchedule(nombre);

                        const newJSON = {
                            id: 0,
                            name: nombre,
                            storeid: storeid,  
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
        "REPARTO ABANCAY 2": {
            monday: "12:00-21:30",
            tuesday: "12:00-21:30",
            wednesday: "12:00-21:30",
            thursday: "12:00-21:30",
            friday: "12:00-21:30",
            saturday: "12:00-21:30",
            sunday: "12:00-20:30"
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
        "REPARTO ALFONSO UGARTE": {  
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
        }, 
        "REPARTO AVIACION 24": {
            monday: "12:00-22:00",
            tuesday: "12:00-22:00",
            wednesday: "12:00-22:00",
            thursday: "12:00-22:00",
            friday: "12:00-22:00",
            saturday: "12:00-22:00",
            sunday: "12:00-22:00"
        },
        "REPARTO AVIACION 29": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:00"
        },
        "REPARTO BELLAVISTA RESTAURANTE": {
            monday: "12:00-22:00",
            tuesday: "12:00-22:00",
            wednesday: "12:00-22:00",
            thursday: "12:00-22:00",
            friday: "12:00-22:00",
            saturday: "12:00-22:00",
            sunday: "12:00-22:00"
        },  
        "ZONA ROJA BELLAVISTA RESTAURANTE": {
            monday: "12:00-17:00",
            tuesday: "12:00-17:00",
            wednesday: "12:00-17:00",
            thursday: "12:00-17:00",
            friday: "12:00-17:00",
            saturday: "12:00-17:00",
            sunday: "12:00-17:00"
        },  
        "REPARTO CANADA": {  
            monday: "12:00-22:00",
            tuesday: "12:00-22:00",
            wednesday: "12:00-22:00",
            thursday: "12:00-22:00",
            friday: "12:00-22:00",
            saturday: "12:00-22:00",
            sunday: "12:00-22:00"    
        },  
        "ZONA ROJA CANADA": {  
            monday: "12:00-18:00",
            tuesday: "12:00-18:00",
            wednesday: "12:00-18:00",
            thursday: "12:00-18:00",
            friday: "12:00-18:00",
            saturday: "12:00-18:00",
            sunday: "12:00-18:00"      
        },  
        "REPARTO CANTA CALLAO PATIO": {  
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
        }, 
        "ZONA ROJA CANTA CALLAO PATIO": {  
            monday: "12:00-18:00",
            tuesday: "12:00-18:00",
            wednesday: "12:00-18:00",
            thursday: "12:00-18:00",
            friday: "12:00-18:00",
            saturday: "12:00-18:00",
            sunday: "12:00-18:00"
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
        "ZONA ROJA COLONIAL 2": {
            monday: "12:00-18:00",
            tuesday: "12:00-18:00",
            wednesday: "12:00-18:00",
            thursday: "12:00-18:00",
            friday: "12:00-18:00",
            saturday: "12:00-18:00",
            sunday: "12:00-18:00"
        }, 
        "REPARTO COMAS 2": {  
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"     
        }, 
        "ZONA ROJA COMAS 2": {
            monday: "12:00-17:00",
            tuesday: "12:00-17:00",
            wednesday: "12:00-17:00",
            thursday: "12:00-17:00",
            friday: "12:00-17:00",
            saturday: "12:00-17:00",
            sunday: "12:00-17:00"
        }, 
        "REPARTO COMAS 4 SANTA LUZMILA": {  
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"         
        },
        "ZONA ROJA COMAS 4 SANTA LUZMILA": {  
            monday: "12:00-16:00",
            tuesday: "12:00-16:00",
            wednesday: "12:00-16:00",
            thursday: "12:00-16:00",
            friday: "12:00-16:00",
            saturday: "12:00-16:00",
            sunday: "12:00-16:00"     
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
        "REPARTO GARZON": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
        },
        "REPARTO HABICH": {  
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
        "REPARTO JESUS MARIA": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
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
        "REPARTO MAGDALENA": {
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
        "ZONA ROJA MARINA 26": {
            monday: "12:00-19:00",
            tuesday: "12:00-19:00",
            wednesday: "12:00-19:00",
            thursday: "12:00-19:00",
            friday: "12:00-19:00",
            saturday: "12:00-19:00",
            sunday: "12:00-19:00"
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
        "REPARTO METRO VENEZUELA": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
        },   
        "REPARTO MEXICO 1": { 
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-21:30"
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
        "REPARTO LA MOLINA": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
        },
        "ZONA ROJA LA MOLINA": {
            monday: "12:00-17:00",
            tuesday: "12:00-17:00",
            wednesday: "12:00-17:00",
            thursday: "12:00-17:00",
            friday: "12:00-17:00",
            saturday: "12:00-17:00",
            sunday: "12:00-17:00"
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
        "REPARTO PANAMA": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
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
        "REPARTO PERU 1": {  
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"     
        },
        "REPARTO PERU 2": { 
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
        "REPARTO PRO": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
        },
        "REPARTO PUENTE 1": { 
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
        },
        "REPARTO RIMAC": {  
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"     
        },
        "ZONA ROJA RIMAC": {  
            monday: "12:00-18:00",
            tuesday: "12:00-18:00",
            wednesday: "12:00-18:00",
            thursday: "12:00-18:00",
            friday: "12:00-18:00",
            saturday: "12:00-18:00",
            sunday: "12:00-18:00"      
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
        "REPARTO SANTA ANITA MALL": {
            monday: "12:00-22:00",
            tuesday: "12:00-22:00",
            wednesday: "12:00-22:00",
            thursday: "12:00-22:00",
            friday: "12:00-22:00",
            saturday: "12:00-22:00",
            sunday: "12:00-22:00"
        },
        "ZONA ROJA SANTA ANITA MALL": {
            monday: "12:00-17:00",
            tuesday: "12:00-17:00",
            wednesday: "12:00-17:00",
            thursday: "12:00-17:00",
            friday: "12:00-17:00",
            saturday: "12:00-17:00",
            sunday: "12:00-17:00"
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
        "REPARTO VENEZUELA": {  
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"   
        },
        "REPARTO VENTANILLA": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"    
        },
        "ZONA ROJA VENTANILLA": {
            monday: "12:00-20:00",
            tuesday: "12:00-20:00",
            wednesday: "12:00-20:00",
            thursday: "12:00-20:00",
            friday: "12:00-20:00",
            saturday: "12:00-20:00",
            sunday: "12:00-20:00"   
        },      
        "REPARTO VILLA EL SALVADOR 2": {
            monday: "13:00-22:30",
            tuesday: "13:00-22:30",
            wednesday: "13:00-22:30",
            thursday: "13:00-22:30",
            friday: "13:00-22:30",
            saturday: "13:00-22:30",
            sunday: "13:00-22:30"             
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
        "REPARTO VITARTE 2": {
            monday: "13:00-22:30",
            tuesday: "13:00-22:30",
            wednesday: "13:00-22:30",
            thursday: "13:00-22:30",
            friday: "13:00-22:30",
            saturday: "13:00-22:30",
            sunday: "13:00-22:30"     
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
        "REPARTO ZARATE 1": {
            monday: "12:00-22:30",
            tuesday: "12:00-22:30",
            wednesday: "12:00-22:30",
            thursday: "12:00-22:30",
            friday: "12:00-22:30",
            saturday: "12:00-22:30",
            sunday: "12:00-22:30"
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

function findStoreId(nombre) {
    const storeData = {
        "REPARTO ABANCAY 2": 167,
        "REPARTO ALFONSO UGARTE": 14,    
        "REPARTO AVIACION 24": 1,
        "REPARTO AVIACION 29": 15,
        "REPARTO BELLAVISTA RESTAURANTE": 42,
        "REPARTO CANADA": 150,
        "REPARTO CANTA CALLAO PATIO": 20,
        "REPARTO COLONIAL 2": 64,
        "REPARTO COMAS 2": 26,
        "REPARTO COMAS 4 SANTA LUZMILA": 86,
        "REPARTO GAMARRA 3": 139,
        "REPARTO GARZON": 45,
        "REPARTO HABICH": 51,
        "REPARTO HUANDOY": 56,
        "REPARTO JESUS MARIA": 154,
        "REPARTO LINCE": 89,
        "REPARTO MAGDALENA": 101,
        "REPARTO MARINA 17": 91,
        "REPARTO MARINA 26": 93,
        "REPARTO MEGA PLAZA 2": 99,
        "REPARTO METRO VENEZUELA": 110,
        "REPARTO MEXICO": 80,
        "REPARTO MOLINA": 106,
        "REPARTO OLIVOS": 113,
        "REPARTO PANAMA": 103,
        "REPARTO PERU": 114,
        "REPARTO PERU 2": 143,
        "REPARTO PRO": 78,
        "REPARTO PUENTE PIEDRA": 122,
        "REPARTO RIMAC": 125,
        "REPARTO SALAVERRY": 22,
        "REPARTO SANTA ANITA MALL": 137,
        "REPARTO SUCRE": 129,
        "REPARTO VENEZUELA": 162,
        "REPARTO VENTANILLA": 107,
        "REPARTO VILLA EL SALVADOR 2": 9,
        "REPARTO VILLA MARIA": 126,
        "REPARTO VITARTE 2": 164,
        "REPARTO ZARATE": 169,  
    };
    
    const lowerCaseName = removeAccents(nombre.toLowerCase());
    let bestSimilarity = 0;
    let bestStoreId = null;

    for (const storeName in storeData) {
        const keyWords = storeName.split(" ");
        const similarity = keyWords.reduce((total, word) => {
            if (lowerCaseName.includes(word.toLowerCase())) {
                return total + 1;
            }
            return total;
        }, 0);

        if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
            bestStoreId = storeData[storeName];
        }
    }

    return bestStoreId !== null ? bestStoreId : 0;
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

            const storeid = findStoreId(modifiedName);
            return {
                polygonsid: polygon.polygonsid,
                storeid: storeid,
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