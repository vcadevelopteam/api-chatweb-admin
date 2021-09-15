const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");
const auth = require('../middleware/auth');

router.post("/reply",
    auth,
    ticketController.reply
)
router.post("/reasign",
    auth,
    ticketController.reasign
)
router.post("/close",
    auth,
    ticketController.close
)

module.exports = router;