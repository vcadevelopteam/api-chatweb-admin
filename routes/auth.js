const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth');
const authController = require("../controllers/authController")

router.post("/", 
    authController.authenticate
)
router.get("/", 
    auth,
    authController.getUser
)
module.exports = router;