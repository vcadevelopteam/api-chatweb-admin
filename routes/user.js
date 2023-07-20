const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require('../middleware/auth');
const ip = require('../middleware/ip');

router.post("/update/info",
    auth,
    userController.updateInformation
)
router.post("/sendmail/password",
    auth,
    userController.sendMailPassword
)
router.post("/delete",
    auth,
    userController.delete
)

router.get("/generatetoken",
    auth,
    userController.generateToken
)

module.exports = router;