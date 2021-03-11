const tf = require('../config/triggerfunctions');
const http = require('https');
const unrar = require('node-unrar-js');
const papaparse = require('papaparse');
const xlsx = require('xlsx');
const templateController = require("./templateController");
const passwordrar = "Z1P_Pa$$W0rd";

const updateMailattachment = async (successprocess, mailattachmentid, processingcomment) => {
    await tf.executesimpletransaction("QUERY_UPD_MAILATTACHMENT", { successprocess, mailattachmentid, processingcomment });
}
const generateProcessControl = async ({filename, typedata, data}) => {
    const res = await tf.executesimpletransaction("QUERY_INS_PROCESS", { title: filename, typedata });
    const processcontrolid =  res[0].processcontrolid;
    if (data instanceof Array) {
        return data.map(x => ({
            ...x,
            processcontrolid
        }))
    }
}
const cleanArray = (dataToProcess, templateselected, filename) => {
    const listtransaction = [];
    for (let i = 0; i < dataToProcess.length; i++) {
        const r = dataToProcess[i];

        const datarow = {};
        Object.entries(r).forEach(([key, value]) => {
            const dictionarykey = templateselected.find(k => key.replace(/�|á|é|í|ó|ú|Á|É|Í|Ó|Ú|Ñ|ñ/gi, "").toUpperCase() === k.keyexcel.replace(/º|á|é|í|ó|ú|Á|É|Í|Ó|Ú|Ñ|ñ/gi, "").toUpperCase());

            if (dictionarykey) {
                if (dictionarykey.obligatory && !value) {
                    throw `La fila ${i}, columna ${key} está vacia.`;
                }
                const valuetmp = (value + "").trim();

                if (!valuetmp) {
                    datarow[dictionarykey.columnbd] = null;
                } else if (dictionarykey.type.includes("timestamp")) {
                    if (filename.includes(".csv") || filename.includes(".txt")) {
                        value = valuetmp.includes(' ') ? value.split(" ")[0] : value;
                        const daux = value.split("/");

                        datarow[dictionarykey.columnbd] = `${daux[2]}-${daux[1]}-${daux[0]}`;
                        
                        if ((new Date(`${datarow[dictionarykey.columnbd]}`))=="Invalid Date"){
                            throw `La fila ${i + 1}, tiene problemas con el valor "${value}" de la columna ${dictionarykey.columnbd}.`
                        }
                    } else {
                        const posibledate = new Date((value - (25567 + 1)) * 86400 * 1000);
                        if (posibledate == "Invalid Date") {
                            throw `La fila ${i + 1}, tiene problemas con el valor "${value}" de la columna ${dictionarykey.columnbd}.`
                        }
                        const datecleaned = new Date(posibledate.setHours(10))
                        datarow[dictionarykey.columnbd] = datecleaned.toISOString().substring(0, 10);
                    }
                } else if (["character varying", "text"].includes(dictionarykey.type) && value && value.toString().includes("'")) {
                    datarow[dictionarykey.columnbd] = value.replace(/'/, /''/);
                } else {
                    datarow[dictionarykey.columnbd] = value;
                }
            }
        })

        listtransaction.push(datarow);
    }
    return listtransaction;
}

exports.process = async (req, res) => {
    const { url, subject, mailattachmentid, filename } = req.body;
    console.log({ url, subject, mailattachmentid, filename });
    try {
        console.log("working....");
        if (!/.rar|.txt|.xlsx|.xls|.csv|.zip/gi.test(filename)) {
            const errormsg = "Contenido no soportado";
            await updateMailattachment(false, mailattachmentid, errormsg)
            return res.status(500).json({ msg: errormsg });
        }

        const rtemplate = await tf.executequery(`select loadtemplateid, json_detail from loadtemplate where referencefilename ilike '%${subject}%' limit 1`);

        if (rtemplate.length === 0) {
            const errormsg = "Ninguna plantilla relacionada al subject.";
            await updateMailattachment(false, mailattachmentid, errormsg)
            return res.status(500).json({ msg: errormsg });
        }
        let filecontent;
        let filenameaux;
        let datatoprocess;
        const template = rtemplate[0];
        http.get(url, async function (reshttp) {
            if (reshttp.statusCode != 200) {
                const errormsg = "No se pudo descargar el archivo";
                await updateMailattachment(false, mailattachmentid, errormsg)
                return res.status(500).json({ msg: errormsg });
            }
            var data = [], dataLen = 0;

            reshttp.on('data', function (chunk) {
                data.push(chunk);
                dataLen += chunk.length;
            }).on('end', async function () {
                const buf = Buffer.alloc(dataLen);

                for (var i = 0, len = data.length, pos = 0; i < len; i++) {
                    data[i].copy(buf, pos);
                    pos += data[i].length;
                }

                if (filename.includes(".rar") || filename.includes(".zip")) {
                    const extractor = unrar.createExtractorFromData(buf, passwordrar)
                    const extracted = extractor.extractAll();

                    if (extracted[0].state === 'SUCCESS') {
                        if (extracted[1].files.length > 0) {
                            filenameaux = extracted[1].files[0].fileHeader.name;

                            if (!/.txt|.xlsx|.xls|.csv/gi.test(filenameaux)) {
                                const errormsg = "File extraido no soportado: " + filenameaux;
                                await updateMailattachment(false, mailattachmentid, errormsg)
                                return res.status(500).json({ msg: errormsg });
                            }

                            filecontent = extracted[1].files[0].extract[1];
                        } else {
                            const errormsg = "Sin files";
                            await updateMailattachment(false, mailattachmentid, errormsg)
                            return res.status(500).json({ msg: errormsg });
                        }
                    } else {
                        const errormsg = "Error al extraer";
                        await updateMailattachment(false, mailattachmentid, errormsg)
                        return res.status(500).json({ msg: errormsg });
                    }
                } else {
                    filenameaux = filename;
                    filecontent = buf;
                }

                if (/.csv|.txt/.test(filenameaux)) {
                    const resultparse = papaparse.parse(filecontent.toString("latin1"), { header: true });
                    datatoprocess = resultparse.data;
                } else {
                    var arr = new Array();
                    for (var i = 0; i != filecontent.length; ++i) arr[i] = String.fromCharCode(filecontent[i]);
                    filecontent = arr.join("");

                    let workbook = xlsx.read(filecontent, { type: 'binary' });
                    const wsname = workbook.SheetNames[0];
                    datatoprocess = xlsx.utils.sheet_to_row_object_array(workbook.Sheets[wsname]);
                }
                let dataready = null;
                const templatedictionary = JSON.parse(template.json_detail);
                try {
                    dataready = cleanArray(datatoprocess, templatedictionary, filename);
                    console.log(dataready);
                } catch (e) {
                    console.log(e);
                    await updateMailattachment(false, mailattachmentid, e.toString());
                    return res.json({ msg: e.toString() });
                }
                if (dataready) {
                    if (templatedictionary.find(x => x.columnbd === "processcontrolid"))
                        dataready = await generateProcessControl({filename, typedata: template.loadtemplateid + "", data: dataready});
                    await templateController.InsertMassiveLoad({ tmpjson: JSON.stringify(dataready), loadtemplateid: template.loadtemplateid, countrepeated: 0 });
                    await updateMailattachment(true, mailattachmentid, "Carga exitosa")
                    return res.json({ msg: dataready.length, item: dataready[0] });    
                }
            });
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Hubo un problema, intentelo más tarde" });
    }
}
