const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require('../middleware/auth');

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

module.exports = router;