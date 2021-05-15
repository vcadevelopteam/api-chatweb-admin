const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/uploadController");
const auth = require('../middleware/auth');
var multer = require('multer');
var upload = multer();

router.post("/",
    auth,
    upload.single('file'), 
    uploadController.upload
);

router.post("/file",
    upload.single('file'), 
    uploadController.upload
);

module.exports = router;