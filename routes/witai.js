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
    auth,
    witaiController.entity_ins
)

router.post("/intent_utterance",
    ip,
    auth,
    witaiController.intent_utterance_ins
)

router.post("/entity_del",
    ip,
    auth,
    witaiController.entity_del
)

router.post("/intent_del",
    ip,
    auth,
    witaiController.intent_del
)

router.post("/train",
    ip,
    //auth,
    witaiController.train
)

router.post("/train_model",
    ip,
    auth,
    witaiController.train_model
)

router.post("/train_model_prd",
    ip,
    auth,
    witaiController.train_model_prd
)

router.post("/status",
    ip,
    //auth,
    witaiController.status
)

router.post("/status_model",
    ip,
    auth,
    witaiController.status_model
)

router.post("/message",
    ip,
    auth,
    witaiController.message
)

module.exports = router;