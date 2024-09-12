const express = require("express");
const ip = require("../middleware/ip");
const auth = require("../middleware/auth");
const router = express.Router();
const witaiController = require("../controllers/watsonController");

//TODO: agregar el middleware routes
router.get(
    "/sync/:watsonid",
    ip,
    //auth,
    witaiController.sync
);

router.post(
    "/tryit",
    ip,
    //auth,
    witaiController.tryit
);

module.exports = router;
