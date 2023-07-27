const auth = require('../middleware/auth');
const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");
const ip = require('../middleware/ip');

router.post('/collection',
    contactController.Collection
)
module.exports = router;