const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/uploadController");
const auth = require('../middleware/auth');
var multer = require('multer');
var upload = multer();
const ip = require('../middleware/ip');

router.post("/",
    ip,
    auth,
    upload.single('file'),
    uploadController.upload
);

router.post("/file",
    ip,
    upload.single('file'),
    uploadController.upload
);

router.post("/metadata",
    ip,
    auth,
    upload.single('file'),
    uploadController.uploadMetadata
);

module.exports = router;