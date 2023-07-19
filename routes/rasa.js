const express = require("express");
const ip = require("../middleware/ip");
const auth = require("../middleware/auth");
const router = express.Router();
const rasaController = require("../controllers/rasaController");
var multer = require('multer');
var upload = multer();

router.post("/train", ip, auth, rasaController.train);

router.post("/upload", ip, auth, upload.single("file"), rasaController.upload);

router.post("/download", ip, auth, rasaController.download);

router.post("/list", ip, auth, rasaController.list);

router.post("/test", ip, auth, rasaController.test);

router.post("/download-model", ip, auth, rasaController.download_model);

module.exports = router;
