const express = require("express");
const router = express.Router();
const gmapsController = require("../controllers/gmapsController");
const ip = require('../middleware/ip');
var multer = require('multer');
var upload = multer();

router.get("/geocode",
    ip,
    gmapsController.geocode
)

router.post("/polygons/insertmassive",
    upload.single('file'),
    gmapsController.polygonsinsertmassive
)

router.post("/polygons/coordinateinpolygons",  
    gmapsController.findcoordinateinpolygons
)

module.exports = router;