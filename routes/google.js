const express = require("express");

const ip = require('../middleware/ip');
const googleController = require("../controllers/googleController");
const router = express.Router();

router.post("/exchangecode",
    ip,
    googleController.exchangeCode,
)

router.post("/listblogger",
    ip,
    googleController.listBlogger,
)

router.post("/listyoutube",
    ip,
    googleController.listYouTube,
)

module.exports = router;