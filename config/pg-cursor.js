var JSZip = require("jszip");
const logger = require('../config/winston');
const { uploadBufferToCos } = require('./triggerfunctions');

const BATCH_SIZE = 100_000;

const transformCSV = async (data, headerClient, _requestid, indexPart, zip) => {
    const formatToExport = "csv";
    const titlefile = "Part-" + indexPart + (formatToExport !== "csv" ? ".xlsx" : ".csv");

    let keysHeaders;
    const keys = Object.keys(data[0]);
    keysHeaders = keys;

    if (headerClient) {
        keysHeaders = keys.reduce((acc, item) => {
            const keyclientfound = headerClient.find(x => x.key === item);
            if (!keyclientfound)
                return acc;
            else {
                return {
                    ...acc,
                    [item]: keyclientfound.alias
                }
            }
        }, {});
        data.unshift(keysHeaders);
    }

    const profiler = logger.child({ _requestid }).startTimer();

    let content =
        (headerClient ? "" : (Object.keys(data[0]).join("|") + "\n")) +
        data.map(item => Object.values(item).join("|").replace(/(?![\x00-\x7FáéíóúñÁÉÍÓÚÑ]|[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3})./g, '')).join("\n");

    data = null;

    profiler.done({ level: "debug", message: `Drawed csv` });

    zip.file(titlefile, Buffer.from(content, 'ASCII'), { binary: true })
}


exports.processCursor = (cursor, _requestid, headerClient) => {
    let indexPart = 1;
    const resultLink = [];
    let zip = null;

    return new Promise((resolve, reject) => {
        (function read() {
            cursor.read(BATCH_SIZE, async (err, rows) => {
                let alreadysave = false;
                if (indexPart === 1) {
                    zip = new JSZip();
                } else if ((indexPart - 1) % 4 === 0) {
                    const buffer = await zip.generateAsync({
                        type: "nodebuffer",
                        compression: 'DEFLATE',
                        compressionOptions: {
                            level: 1,
                        }
                    })
                    const rr = await uploadBufferToCos(_requestid, buffer, "application/zip", new Date().toISOString() + ".zip");
                    logger.child({ _requestid }).debug(`zip to COS: ${rr.url}`)
                    resultLink.push(rr.url)
                    alreadysave = true;
                    zip = new JSZip(); //reiniciamos
                }
                if (err) {
                    logger.error({ error: err })
                    return resolve({ error: true, err });
                }
                // no more rows, so we're done!
                if (!rows.length) {
                    if (!alreadysave) {
                        const buffer = await zip.generateAsync({ type: "nodebuffer", compression: 'DEFLATE' })
                        const rr = await uploadBufferToCos(_requestid, buffer, "application/zip", new Date().toISOString() + ".zip");
                        logger.child({ _requestid }).debug(`zip to COS: ${rr.url}`)
                        resultLink.push(rr.url)
                    }
                    zip = null;
                    return resolve({ error: false, resultLink });
                }
                await transformCSV(rows, headerClient, _requestid, indexPart, zip);

                indexPart++;

                return read();
            });
        })();
    });
}