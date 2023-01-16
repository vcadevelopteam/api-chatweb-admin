const express = require("express");
const router = express.Router();
const drawPdfController = require("../controllers/drawPdfController");
const auth = require('../middleware/auth');

router.post("/",
    auth,
    drawPdfController.draw
)

router.post("/drawOrderCard",
    auth,
    drawPdfController.drawCardOrder
)


module.exports = router;