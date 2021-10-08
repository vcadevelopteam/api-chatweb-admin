const auth = require('../middleware/auth');
const integrationController = require("../controllers/integrationController");
const router = require("express").Router();

router.post("/",
    auth,
    integrationController.Save
)

router.post("/addtodatabase",
    integrationController.AddToDatabase
)

router.post("/generateapikey",
    auth,
    integrationController.GenerateApikey
)

router.post("/integrationzyxme",
    integrationController.IntegrationZyxme
)

module.exports = router