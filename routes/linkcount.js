const express = require("express");
const router = express.Router();
const linkCountController = require("../controllers/linkCountController");

router.post("/openlink",
    linkCountController.openLink,
)

module.exports = router;