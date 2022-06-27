const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");
const auth = require('../middleware/auth');
const ip = require('../middleware/ip');

router.post("/reply",
    ip,
    auth,
    ticketController.reply
)
router.post("/reply/list",
    ip,
    auth,
    ticketController.replyListMessages
)
router.post("/reassign",
    ip,
    auth,
    ticketController.reassign
)
router.post("/close",
    ip,
    auth,
    ticketController.close
)

router.post("/send/hsm",
    ip,
    auth,
    ticketController.sendHSM
)

router.post("/send/hsm/allow",
    ip,
    ticketController.sendHSM
)

router.post("/massiveclose",
    ip,
    auth,
    ticketController.massiveClose
)

router.post("/import",
    ip,
    auth,
    ticketController.import
)

module.exports = router;