const express = require("express");
const router = express.Router();
const auth = require('../../middleware/auth');
const authMobileController = require("../../controllers/mobile/authMobileController")

//mobile
router.post("/",
    authMobileController.authenticateMobile
)

router.post("/connect",
    auth,
    authMobileController.connectMobile
)
router.get("/", 
    auth,
    authMobileController.getUser
)
router.post("/changeorganization", 
    auth,
    authMobileController.changeOrganization
)
router.post("/changePassword", 
    auth,
    authMobileController.changePassword
)

module.exports = router;