const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");
const auth = require('../middleware/auth');

router.post("/reply",
    auth,
    ticketController.reply
)
router.post("/reply/list",
    auth,
    ticketController.replyListMessages
)
router.post("/reassign",
    auth,
    ticketController.reassign
)
router.post("/close",
    auth,
    ticketController.close
)

router.post("/send/hsm",
    auth,
    ticketController.sendHSM
)

router.post("/massiveclose",
    auth,
    ticketController.massiveClose
)

module.exports = router;