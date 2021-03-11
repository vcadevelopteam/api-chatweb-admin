const triggerfunctions = require('../config/triggerfunctions');;
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
        const { data, method } = req.body;

        if (!data.corporation)
            data.corporation = req.usuario.corporation;
        if (!data.corpid)
            data.corpid = req.usuario.corpid ? req.usuario.corpid : 1;
        if (!data.orgid)
            data.orgid = req.usuario.orgid ? req.usuario.orgid : 1;
        if (!data.username)
            data.username = req.usuario.usr;
        if (!data.userid)
            data.userid = req.usuario.userid;
        const result = await triggerfunctions.executesimpletransaction(method, data);
        if (result instanceof Array)
            return res.json(result);
        else
            return res.status(500).json(result);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}

exports.getCollectionPagination = async (req, res) => {
    try {
        const { data, methodcollection, methodcount } = req.body;

        if (!data.corporation)
            data.corporation = req.usuario.corporation;
        if (!data.corpid)
            data.corpid = req.usuario.corpid;
        if (!data.orgid)
            data.orgid = req.usuario.orgid;

        const result = await triggerfunctions.getCollectionPagination(methodcollection, methodcount, data);
        res.json(result);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}
exports.exportexcel = async (req, res) => {
    try {
        const { data, method } = req.body;

        if (!data.corporation)
            data.corporation = req.usuario.corporation;
        if (!data.corpid)
            data.corpid = req.usuario.corpid ? req.usuario.corpid : 1;
        if (!data.orgid)
            data.orgid = req.usuario.orgid ? req.usuario.orgid : 1;
        if (!data.username)
            data.username = req.usuario.usr;

        console.time(`exe-${method}`);
        const result = await triggerfunctions.executesimpletransaction(method, data);
        console.timeEnd(`exe-${method}`);

        const titlefile = (data.titlefile ? data.titlefile : "report") + new Date().toISOString() + ".csv";

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
                    console.log(err);
                    return res.json({ success: false, msg: 'Hubo un error#1 en la carga de archivo.', err })
                }
                console.log(data);
                console.timeEnd(`uploadcos`);
                return res.json({ success: true, url: data.Location })
            });
        } else {
            return res.status(500).json({
                msg: "Sin información para exportar"
            });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}

exports.export = async (req, res) => {
    try {
        const { data, method } = req.body;

        if (!data.corporation)
            data.corporation = req.usuario.corporation;
        if (!data.corpid)
            data.corpid = req.usuario.corpid ? req.usuario.corpid : 1;
        if (!data.orgid)
            data.orgid = req.usuario.orgid ? req.usuario.orgid : 1;
        if (!data.username)
            data.username = req.usuario.usr;

        const result = await triggerfunctions.export(method, data);
        res.json(result);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}
