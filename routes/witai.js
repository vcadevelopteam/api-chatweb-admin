const express = require("express");
const ip = require('../middleware/ip');
const auth = require('../middleware/auth');
const router = express.Router();
const witaiController = require("../controllers/witaiController");

router.get("/cron",
    ip,
    //auth,
    witaiController.cron
)

router.post("/entity/train",
    ip,
    //auth,
    witaiController.entity_train
)

module.exports = router;