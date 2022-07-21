var ibm = require('ibm-cos-sdk');
const { v4: uuidv4 } = require('uuid');
const unrar = require("node-unrar-js");
const AdmZip = require("adm-zip");

var config = {
    endpoint: 's3.us-east.cloud-object-storage.appdomain.cloud',
    ibmAuthEndpoint: 'https://iam.cloud.ibm.com/identity/token',
    apiKeyId: 'LwD1YXNXSp8ZYMGIUWD2D3-wmHkmWRVcFm-5a1Wz_7G1', //'GyvV7NE7QiuAMLkWLXRiDJKJ0esS-R5a6gc8VEnFo0r5',
    serviceInstanceId: '0268699b-7d23-4e1d-9d17-e950b6804633' //'9720d58a-1b9b-42ed-a246-f2e9d7409b18',
};

var s3 = new ibm.S3(config);
const COS_BUCKET_NAME = "staticfileszyxme"

exports.uploadToCOS = async (file, folder) => {
    try {
        if (file.size > 999999999) {
            return file.originalname
        }
        const params = {
            ACL: 'public-read',
            Key: `${folder}/${uuidv4()}/${file.originalname}`,
            Body: file.buffer,
            Bucket: COS_BUCKET_NAME
        }
        const result = await s3.upload(params).promise();
        return result.Location
    }
    catch (error) {
        return file.originalname
    }
}

exports.unrar = async (file) => {
    try {
        const extractor = await unrar.createExtractorFromData({ data: file.buffer });
        const extracted = extractor.extract();
        return [...extracted.files]
    } catch (error) {
        return null
    }
}

exports.unzip = async (file) => {
    try {
        const zip = new AdmZip(file.buffer);
        zipEntries = zip.getEntries();
        return zip.getEntries().map(entry => ({
            name: entry.entryName,
            size: entry.header.size,
            data: zip.readFile(entry)
        }));
    } catch (error) {
        return null
    }
}