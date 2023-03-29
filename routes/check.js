const auth = require('../middleware/auth');
const express = require("express");
const router = express.Router();
const checkController = require("../controllers/checkController");
const ip = require('../middleware/ip');

router.post('/',
    ip,
    checkController.load)

router.get('/auth',
    ip,
    auth,
    checkController.auth
)

router.get('/version',
    checkController.version
)

router.get('/recaptcha',
    checkController.recaptcha
)

module.exports = router;