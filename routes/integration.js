const express = require("express");
const router = express.Router();
const integrationController = require("../controllers/integrationController");
const auth = require('../middleware/auth');

router.post("/",
    auth,
    integrationController.Save
)


module.exports = router