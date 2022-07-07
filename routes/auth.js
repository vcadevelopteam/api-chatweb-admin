const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth');
const authController = require("../controllers/authController")
const ip = require('../middleware/ip');

router.post("/",
    ip,
    authController.authenticate
)

router.post("/logout",
    ip,
    auth,
    authController.logout
)

router.post("/connect",
    ip,
    auth,
    authController.connect
)

router.post("/changeorganization",
    ip,
    auth,
    authController.changeOrganization
)

router.get("/",
    ip,
    auth,
    authController.getUser
)
module.exports = router;