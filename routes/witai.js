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

router.post("/entity",
    ip,
    //auth,
    witaiController.entity
)

router.post("/intent",
    ip,
    //auth,
    witaiController.intent
)

router.post("/utterance",
    ip,
    //auth,
    witaiController.utterance
)

router.post("/train",
    ip,
    //auth,
    witaiController.train
)

router.post("/status",
    ip,
    //auth,
    witaiController.status
)

module.exports = router;