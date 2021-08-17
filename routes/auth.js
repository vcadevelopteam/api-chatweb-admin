const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth');
const authController = require("../controllers/authController")

router.post("/", 
    authController.authenticate
)
router.post("/logout", 
    auth,
    authController.logout
)
router.get("/", 
    auth,
    authController.getUser
)
module.exports = router;