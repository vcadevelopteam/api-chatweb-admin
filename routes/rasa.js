const express = require("express");
const ip = require("../middleware/ip");
const auth = require("../middleware/auth");
const router = express.Router();
const rasaController = require("../controllers/rasaController");
var multer = require('multer');
var upload = multer();

router.get("/train/:model_uuid", ip, auth, rasaController.train);

router.post("/upload/:model_uuid", ip, auth, upload.single("file"), rasaController.upload);

router.get("/download/:model_uuid", ip, auth, rasaController.download);

router.get("/list/:model_uuid", ip, auth, rasaController.list);

router.post("/test", ip, auth, rasaController.test);

module.exports = router;
