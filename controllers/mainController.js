const triggerfunctions = require('../config/triggerfunctions');
const { setSessionParameters } = require('../config/helpers');
var ibm = require('ibm-cos-sdk');

var config = {
    endpoint: 's3.us-east.cloud-object-storage.appdomain.cloud',
    ibmAuthEndpoint: 'https://iam.cloud.ibm.com/identity/token',
    apiKeyId: 'LwD1YXNXSp8ZYMGIUWD2D3-wmHkmWRVcFm-5a1Wz_7G1', //'GyvV7NE7QiuAMLkWLXRiDJKJ0esS-R5a6gc8VEnFo0r5',
    serviceInstanceId: '0268699b-7d23-4e1d-9d17-e950b6804633' //'9720d58a-1b9b-42ed-a246-f2e9d7409b18',
};
const COS_BUCKET_NAME = "staticfileszyxme"

exports.GetCollection = async (req, res) => {
    try {
        const { parameters = {}, method } = req.body;

        setSessionParameters(parameters, req.user);

        const result = await triggerfunctions.executesimpletransaction(method, parameters);

        if (result instanceof Array)
            return res.json({ success: true, data: result });
        else
            return res.status(500).json(result);
    }
    catch (error) {

        return res.status(500).json({
            message: "Hubo un problema, intentelo más tarde"
        });
    }
}

exports.getCollectionPagination = async (req, res) => {
    try {
        const { parameters, methodcollection, methodcount } = req.body;

        setSessionParameters(parameters, req.user);

        const result = await triggerfunctions.getCollectionPagination(methodcollection, methodcount, parameters);

        res.json(result);
    }
    catch (error) {
        return res.status(500).json({
            message: "Hubo un problema, intentelo más tarde"
        });
    }
}
exports.exportexcel = async (req, res) => {
    try {
        const { parameters, method } = req.body;

        setSessionParameters(parameters, req.user);

        console.time(`exe-${method}`);
        const result = await triggerfunctions.executesimpletransaction(method, parameters);
        console.timeEnd(`exe-${method}`);

        const titlefile = (parameters.titlefile ? parameters.titlefile : "report") + new Date().toISOString() + ".csv";

        console.time(`draw-excel`);
        let content = "";

        if (result instanceof Array && result.length > 0) {
            content += Object.keys(result[0]).join() + "\n";

            result.forEach((rowdata) => {
                let rowjoined = Object.values(rowdata).join("##");
                if (rowjoined.includes(",")) {
                    rowjoined = Object.values(rowdata).map(x => (x && typeof x === "string") ? (x.includes(",") ? `"${x}"` : x) : x).join();
                } else {
                    rowjoined = rowjoined.replace(/##/gi, ",");
                }
                content += rowjoined + "\n";
            });

            console.timeEnd(`draw-excel`);

            var s3 = new ibm.S3(config);

            const params = {
                ACL: 'public-read',
                Key: titlefile,
                Body: Buffer.from(content, 'ASCII'),
                Bucket: COS_BUCKET_NAME,
                ContentType: "text/csv",
            }
            console.time(`uploadcos`);
            s3.upload(params, (err, data) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Hubo un error#1 en la carga de archivo.', err })
                }
                console.timeEnd(`uploadcos`);
                return res.json({ success: true, url: data.Location })
            });
        } else {
            return res.status(500).json({
                message: "Sin información para exportar"
            });
        }
    }
    catch (error) {

        return res.status(500).json({
            message: "Hubo un problema, intentelo más tarde"
        });
    }
}

exports.export = async (req, res) => {
    try {
        const { parameters, method } = req.body;

        setSessionParameters(parameters, req.user);

        const result = await triggerfunctions.export(method, parameters);
        res.json(result);
    }
    catch (error) {

        return res.status(500).json({
            message: "Hubo un problema, intentelo más tarde"
        });
    }
}

exports.multiTransaction = async (req, res) => {
    try {
        const datatmp = req.body;
        const data = datatmp.map(x => {
            
            setSessionParameters(x.parameters, req.user);
            return x
        })

        const result = await triggerfunctions.executeMultiTransactions(data);

        return res.json({ success: true, data: result });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}
