var ibm = require('ibm-cos-sdk');

var config = {
    endpoint: 's3.us-east.cloud-object-storage.appdomain.cloud',
    ibmAuthEndpoint: 'https://iam.cloud.ibm.com/identity/token',
    apiKeyId: 'LwD1YXNXSp8ZYMGIUWD2D3-wmHkmWRVcFm-5a1Wz_7G1', //'GyvV7NE7QiuAMLkWLXRiDJKJ0esS-R5a6gc8VEnFo0r5',
    serviceInstanceId: '0268699b-7d23-4e1d-9d17-e950b6804633' //'9720d58a-1b9b-42ed-a246-f2e9d7409b18',
};

var s3 = new ibm.S3(config);
const COS_BUCKET_NAME = "staticfileszyxme"

exports.upload = async (req, res) => {
    try {
        if (req.file.size > 9999999) {
            return res.status(500).json({ success: false, msg: 'Archivo demasiado grande.' });
        }
        const params = {
            ACL: 'public-read',
            Key: new Date().getTime() + req.file.originalname,
            Body: req.file.buffer,
            Bucket: COS_BUCKET_NAME,
            ContentType: req.file.mimetype,
        }
    
        s3.upload(params, (err, data) => {
            if (err) {
                return res.json({ success: false, msg: 'Hubo un error#1 en la carga de archivo.', err })
            }
            
            return res.json({ success: true, url: data.Location })
        })   
    } 
    catch (error) {
        return res.json({ success: false, msg: 'Hubo un error#2 en la carga de archivo.', err })
    }
}