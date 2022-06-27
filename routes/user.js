const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require('../middleware/auth');
const ip = require('../middleware/ip');

router.post("/update/info",
    ip,
    auth,
    userController.updateInformation
)
router.post("/sendmail/password",
    ip,
    auth,
    userController.sendMailPassword
)
router.post("/delete",
    ip,
    auth,
    userController.delete
)

module.exports = router;