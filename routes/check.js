const auth = require('../middleware/auth');
const express = require("express");
const router = express.Router();
const checkController = require("../controllers/checkController");

router.post('/', checkController.load)

router.get('/auth',
    auth,
    checkController.auth
)

module.exports = router;