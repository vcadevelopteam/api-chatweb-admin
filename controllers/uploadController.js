
const ibm = require('ibm-cos-sdk');

const { v4: uuidv4 } = require('uuid');
const { getErrorCode, axiosObservable, printException } = require('../config/helpers');

const logger = require('../config/winston');

const hookEndpoint = process.env.HOOK;

const config = {
    endpoint: process.env.COS_ENDPOINT,
    ibmAuthEndpoint: process.env.COS_IBMAUTHENDPOINT,
    apiKeyId: process.env.COS_APIKEYID,
    serviceInstanceId: process.env.COS_SERVICEINSTANCEID,
};

const COS_BUCKET_NAME = process.env.COS_BUCKET;

exports.upload = async (req, res) => {
    try {
        const s3 = new ibm.S3(config);
        
        const params = {
            ACL: 'public-read',
            Key: `${req.user?.orgdesc || "anonymous"}/${!req.body.random ? uuidv4() : "static"}/${req.file.originalname}`,
            Body: req.file.buffer,
            Bucket: COS_BUCKET_NAME,
            ContentType: req.file.mimetype,
        }

        s3.upload(params, (err, data) => {
            if (err) {
                logger.child({ _requestid: req._requestid, error: { detail: err, message: err.toString() } }).error(`Request to ${req.originalUrl}`);
                return res.json({ success: false, msg: 'Hubo un error #1 en la carga de archivo.', err })
            }

            const presignedUrl = s3.getSignedUrl('getObject', {
                Bucket: COS_BUCKET_NAME,
                Key: params.Key,
                Expires: 3600, // X horas en segundos
            });

            return res.json({ success: true, url: data.Location })
        })
    }
    catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}

exports.uploadMetadata = async (req, res) => {
    try {
        const s3 = new ibm.S3(config);
        
        if (req.file.size > 999999999) {
            return res.status(500).json({ success: false, msg: 'Archivo demasiado grande.' });
        }

        const params = {
            ACL: 'public-read',
            Key: `${req.user?.orgdesc || "anonymous"}/${uuidv4()}/${req.file.originalname}`,
            Body: req.file.buffer,
            Bucket: COS_BUCKET_NAME,
            ContentType: req.file.mimetype,
        }

        s3.upload(params, async (err, data) => {
            if (err) {
                logger.child({ _requestid: req._requestid, error: { detail: err, message: err.toString() } }).error(`Request to ${req.originalUrl}`);
                return res.json({ success: false, msg: 'Hubo un error #1 en la carga de archivo.', err })
            }

            var height = 0;
            var name = '';
            var thumbnail = '';
            var width = 0;
            var url = data.Location;

            try {
                const requestMediaMetadata = await axiosObservable({
                    data: {
                        mimeType: req.file.mimetype,
                        url: url,
                    },
                    method: 'post',
                    url: `${hookEndpoint}communication/getmediametadata`,
                    _requestid: req._requestid,
                });

                if (requestMediaMetadata.data.success) {
                    if (requestMediaMetadata.data.metadata) {
                        height = requestMediaMetadata.data.metadata.height;
                        name = requestMediaMetadata.data.metadata.name;
                        thumbnail = requestMediaMetadata.data.metadata.thumbnail;
                        width = requestMediaMetadata.data.metadata.width;
                        url = requestMediaMetadata.data.metadata.url;
                    }
                }
            }
            catch (exception) {
                printException(exception, `${hookEndpoint}communication/getmediametadata`, req._requestid);
            }

            return res.json({ success: true, height: height, name: name, thumbnail: thumbnail, width: width, url: url })
        })
    }
    catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}