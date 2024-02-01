const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth');
const authController = require("../controllers/authController")
const authMobileController = require("../controllers/mobile/authMobileController")

router.post("/",
    authController.authenticate
)

router.post("/logout",
    auth,
    authController.logout
)

router.post("/connect",
    auth,
    authController.connect
)

router.post("/changeorganization",
    auth,
    authController.changeOrganization
)

router.post("/incremental/insert/token",
    authController.IncrementalInsertToken
)

router.get("/incremental/invoke/token",
    auth,
    authController.IncrementalInvokeToken
)

router.get("/",
    auth,
    authController.getUser
)

module.exports = router;