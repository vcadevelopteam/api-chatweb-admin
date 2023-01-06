const auth = require('../middleware/auth');
const catalogController = require("../controllers/catalogControllers");
const express = require("express");
const ip = require('../middleware/ip');
const router = express.Router();

router.post("/getbusinesslist",
    ip,
    auth,
    catalogController.getBusinessList
)

router.get("/business",
    catalogController.getAllBusiness
)

router.post("/managecatalog",
    catalogController.managecatalog
)



module.exports = router;