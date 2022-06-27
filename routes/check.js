const auth = require('../middleware/auth');
const express = require("express");
const router = express.Router();
const checkController = require("../controllers/checkController");
const ip = require('../middleware/ip');

router.post('/',
    ip,
    checkController.load)

router.get('/auth',
    auth,
    ip,
    checkController.auth
)

module.exports = router;