const { errors, getErrorCode, axiosObservable } = require('../config/helpers');
const { executesimpletransaction } = require('../config/triggerfunctions');
const { parseString } = require('xml2js');


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
      "AVIACIÓN 24": {
        monday: "12:00-22:00",
        tuesday: "12:00-22:00",
        wednesday: "12:00-22:00",
        thursday: "12:00-22:00",
        friday: "12:00-22:00",
        saturday: "12:00-22:00",
        sunday: "12:00-22:00"
      },
      "AVIACIÓN 29": {
        monday: "12:00-22:30",
        tuesday: "12:00-22:30",
        wednesday: "12:00-22:30",
        thursday: "12:00-22:30",
        friday: "12:00-22:30",
        saturday: "12:00-22:30",
        sunday: "12:00-22:00"
      },
      "SALAVERRY": {
        monday: "12:00-22:30",
        tuesday: "12:00-22:30",
        wednesday: "12:00-22:30",
        thursday: "12:00-22:30",
        friday: "12:00-22:30",
        saturday: "12:00-22:30",
        sunday: "12:00-22:30"
      },
      "BELLAVISTA REST": {
        monday: "12:00-22:00",
        tuesday: "12:00-22:00",
        wednesday: "12:00-22:00",
        thursday: "12:00-22:00",
        friday: "12:00-22:00",
        saturday: "12:00-22:00",
        sunday: "12:00-22:00"
      },
      "FAUCETT": {
        monday: "12:00-22:30",
        tuesday: "12:00-22:30",
        wednesday: "12:00-22:30",
        thursday: "12:00-22:30",
        friday: "12:00-22:30",
        saturday: "12:00-22:30",
        sunday: "12:00-22:30"
      },
      "GARZON": {
        monday: "12:00-22:30",
        tuesday: "12:00-22:30",
        wednesday: "12:00-22:30",
        thursday: "12:00-22:30",
        friday: "12:00-22:30",
        saturday: "12:00-22:30",
        sunday: "12:00-22:30"
      },
      "HUANDOY": {
        monday: "12:00-22:30",
        tuesday: "12:00-22:30",
        wednesday: "12:00-22:30",
        thursday: "12:00-22:30",
        friday: "12:00-22:30",
        saturday: "12:00-22:30",
        sunday: "12:00-22:30"
      },
      "COLONIAL 2": {
        monday: "12:00-22:30",
        tuesday: "12:00-22:30",
        wednesday: "12:00-22:30",
        thursday: "12:00-22:30",
        friday: "12:00-22:30",
        saturday: "12:00-22:30",
        sunday: "12:00-22:30"
      },
      "PRO": {
        monday: "12:00-22:30",
        tuesday: "12:00-22:30",
        wednesday: "12:00-22:30",
        thursday: "12:00-22:30",
        friday: "12:00-22:30",
        saturday: "12:00-22:30",
        sunday: "12:00-22:30"
      },
      "MÉXICO 1": {
        monday: "12:00-22:30",
        tuesday: "12:00-22:30",
        wednesday: "12:00-22:30",
        thursday: "12:00-22:30",
        friday: "12:00-22:30",
        saturday: "12:00-22:30",
        sunday: "12:00-21:30"
      },
      "LINCE": {
        monday: "12:00-22:30",
        tuesday: "12:00-22:30",
        wednesday: "12:00-22:30",
        thursday: "12:00-22:30",
        friday: "12:00-22:30",
        saturday: "12:00-22:30",
        sunday: "12:00-22:30"
      },
      "MARINA 17": {
        monday: "12:00-22:30",
        tuesday: "12:00-22:30",
        wednesday: "12:00-22:30",
        thursday: "12:00-22:30",
        friday: "12:00-22:30",
        saturday: "12:00-22:30",
        sunday: "12:00-22:30"
      },
      "MARINA 26": {
        monday: "12:00-22:30",
        tuesday: "12:00-22:30",
        wednesday: "12:00-22:30",
        thursday: "12:00-22:30",
        friday: "12:00-22:30",
        saturday: "12:00-22:30",
        sunday: "12:00-22:30"
      },
      "MEGA PLAZA 2": {
        monday: "12:00-22:00",
        tuesday: "12:00-22:00",
        wednesday: "12:00-22:00",
        thursday: "12:00-22:00",
        friday: "12:00-22:00",
        saturday: "12:00-22:00",
        sunday: "12:00-22:00"
      },
      "MAGDALENA": {
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
      "METRO VENEZUELA": {
        monday: "12:00-22:00",
        tuesday: "12:00-22:00",
        wednesday: "12:00-22:00",
        thursday: "12:00-22:00",
        friday: "12:00-22:00",
        saturday: "12:00-22:00",
        sunday: "12:00-22:00"
      },
      "OLIVOS": {
        monday: "12:00-22:30",
        tuesday: "12:00-22:30",
        wednesday: "12:00-22:30",
        thursday: "12:00-22:30",
        friday: "12:00-22:30",
        saturday: "12:00-22:30",
        sunday: "12:00-22:30"
      },
      "PUENTE PIEDRA 1": {
        monday: "12:00-22:30",
        tuesday: "12:00-22:30",
        wednesday: "12:00-22:30",
        thursday: "12:00-22:30",
        friday: "12:00-22:30",
        saturday: "12:00-22:30",
        sunday: "12:00-22:30"
      },
      "VILLA MARIA": {
        monday: "12:00-22:30",
        tuesday: "12:00-22:30",
        wednesday: "12:00-22:30",
        thursday: "12:00-22:30",
        friday: "12:00-22:30",
        saturday: "12:00-22:30",
        sunday: "12:00-22:30"
      },
      "SUCRE": {
        monday: "12:00-22:30",
        tuesday: "12:00-22:30",
        wednesday: "12:00-22:30",
        thursday: "12:00-22:30",
        friday: "12:00-22:30",
        saturday: "12:00-22:30",
        sunday: "12:00-22:30"
      },
      "SANTA ANITA MALL": {
        monday: "12:00-22:00",
        tuesday: "12:00-22:00",
        wednesday: "12:00-22:00",
        thursday: "12:00-22:00",
        friday: "12:00-22:00",
        saturday: "12:00-22:00",
        sunday: "12:00-22:00"
      },
      "GAMARRA 3": {
        monday: "12:00-20:00",
        tuesday: "12:00-20:00",
        wednesday: "12:00-20:00",
        thursday: "12:00-20:00",
        friday: "12:00-20:00",
        saturday: "12:00-20:00",
        sunday: "12:00-17:30"
      },
      "PERÚ 2": {
        monday: "12:00-22:30",
        tuesday: "12:00-22:30",
        wednesday: "12:00-22:30",
        thursday: "12:00-22:30",
        friday: "12:00-22:30",
        saturday: "12:00-22:30",
        sunday: "12:00-22:30"
      },
      "PLAZA CASTILLA": {
        monday: "12:00-21:00",
        tuesday: "12:00-21:00",
        wednesday: "12:00-21:00",
        thursday: "12:00-21:00",
        friday: "12:00-21:00",
        saturday: "12:00-21:00",
        sunday: "12:00-21:00"
      },
      "JESÚS MARÍA": {
        monday: "12:00-22:30",
        tuesday: "12:00-22:30",
        wednesday: "12:00-22:30",
        thursday: "12:00-22:30",
        friday: "12:00-22:30",
        saturday: "12:00-22:30",
        sunday: "12:00-22:30"
      },
      "VITARTE 2": {
        monday: "12:00-22:30",
        tuesday: "12:00-22:30",
        wednesday: "12:00-22:30",
        thursday: "12:00-22:30",
        friday: "12:00-22:30",
        saturday: "00:00-22:30",
        sunday: "12:00-22:30"
      },
      "ABANCAY 2": {
        monday: "12:00-21:30",
        tuesday: "12:00-21:30",
        wednesday: "12:00-21:30",
        thursday: "12:00-21:30",
        friday: "12:00-21:30",
        saturday: "12:00-21:30",
        sunday: "12:00-20:30"
      },
      "ZARATE 1": {
        monday: "12:00-22:30",
        tuesday: "12:00-22:30",
        wednesday: "12:00-22:30",
        thursday: "12:00-22:30",
        friday: "12:00-22:30",
        saturday: "12:00-22:30",
        sunday: "12:00-22:30"
      },
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
      "ZONA ROJA METRO VENEZUELA": {
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
      "ZONA ROJA FAUCETT": {
        monday: "12:00-16:00",
        tuesday: "12:00-16:00",
        wednesday: "12:00-16:00",
        thursday: "12:00-16:00",
        friday: "12:00-16:00",
        saturday: "12:00-16:00",
        sunday: "12:00-16:00"
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


exports.findcoordinateinpolygons = async (req, res) => {
  try {      
      const {corpid, orgid, latitude, longitude} = req.body;

      const result = await executesimpletransaction("SEARCH_POINT_ON_AREAS", { corpid, orgid, latitude, longitude });

      return res.json({ corpid, orgid, result });
  } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Error en el servidor' });
  }
}


