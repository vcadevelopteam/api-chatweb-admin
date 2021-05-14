const express = require("express");
const router = express.Router();
const integrationController = require("../controllers/integrationController");
const auth = require('../middleware/auth');

router.post("/",
    auth,
    integrationController.Save
)
router.post("/generateapikey",
    auth,
    integrationController.GenerateApikey
)


module.exports = router