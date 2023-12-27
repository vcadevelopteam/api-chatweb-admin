
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
  
function formatearCoordenada(coordinate) {
    const [longitude, latitude] = coordinate.split(',').map(String);
    if (!isNaN(latitude) && !isNaN(longitude)) {
        const cleanLongitude = longitude.trim();
        const cleanLatitude = latitude.trim();
        return { latitude: cleanLatitude, longitude: cleanLongitude };
    } else {
        console.error(`Coordenadas no válidas: Latitude ${latitude}, Longitude ${longitude}`);
        return null;
    }
}
  
function transformarKMLtoJSON(kmlObject) {
    const nuevos_features = [];
  
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
              const coordenadas = coordinates.split(' ').map(formatearCoordenada).filter(coord => coord !== null);  
  
              const horario = encontrarHorario(nombre);
  
              const nuevo_json = {
                id: 0, 
                name: nombre,
                schedule: horario,
                polygons: coordenadas,
                operation: 'INSERT'
              };
  
              nuevos_features.push(nuevo_json);
            }
          });
        }
      });
    }
  
    console.log('Nuevo JSON:', nuevos_features);
    return nuevos_features;
}
  
function quitarTildes(str) {
    if (!str) {
        return str; 
    }
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
  
function encontrarHorario(nombre) {
    const horarios = {      
      "SANTA ANITA 2": {
        monday: "12:00-21:30",
        tuesday: "12:00-21:30",
        wednesday: "12:00-21:30",
        thursday: "12:00-21:30",
        friday: "12:00-21:30",
        saturday: "12:00-21:30",
        sunday: "12:00-21:30"
      },
      "PANAMA": {
        monday: "12:00-22:30",
        tuesday: "12:00-22:30",
        wednesday: "12:00-22:30",
        thursday: "12:00-22:30",
        friday: "12:00-22:30",
        saturday: "12:00-22:30",
        sunday: "12:00-22:30"
      }
    };
  
    const nombreEnMinusculas = quitarTildes(nombre.toLowerCase());
  
    let mejorSimilitud = 0;
    let mejorHorario = null;
  
    for (const nombreHorario in horarios) {
      const palabrasClave = nombreHorario.split(" ");
      const similitud = palabrasClave.reduce((total, palabra) => {
        if (nombreEnMinusculas.includes(palabra.toLowerCase())) {
          return total + 1;
        }
        return total;
      }, 0);
  
      if (similitud > mejorSimilitud) {
        mejorSimilitud = similitud;
        mejorHorario = horarios[nombreHorario];
      }
    }  
  return mejorHorario || {};
}  

exports.polygonsinsertmassive = async (req, res) => {
    try {       
        const {corpid, orgid, username} = req.body;

        const buffer = req.file.buffer;
        const kmlContent = buffer.toString();

        const kmlObject = await parseKMLtoObject(kmlContent);

        const json_transformado = transformarKMLtoJSON(kmlObject);
        const formattedJson = JSON.stringify(json_transformado, null, 2);

        console.log("cantidad", json_transformado.length);

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
      
      if (currentDateTime.isBetween(startMoment, endMoment)) {
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

      if (modifiedName.includes('ZONA ROJA - ')) {
        modifiedName = modifiedName.replace('ZONA ROJA - ', 'Reparto ');
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