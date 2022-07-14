var JSZip = require("jszip");
const { transformCSV, uploadCSV } = require('./triggerfunctions');

const BATCH_SIZE = 100_000;

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
                    const rr = await uploadCSV(_requestid, buffer);
                    resultLink.push(rr.url)
                    alreadysave = true;
                    zip = new JSZip(); //reiniciamos
                }
                if (err) {
                    return resolve({ error: true, err });
                }
                // no more rows, so we're done!
                if (!rows.length) {
                    if (!alreadysave) {
                        const buffer = await zip.generateAsync({ type: "nodebuffer", compression: 'DEFLATE' })
                        const rr = await uploadCSV(_requestid, buffer);
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