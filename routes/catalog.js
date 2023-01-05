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

router.post("/",
    catalogController.createCatalog
)

// all catalog
router.get("/",
    catalogController.getAllCatalog
)

router.delete("/",
    catalogController.deleteCatalog
)


router.get("/business",
    catalogController.getAllBusiness
)

router.post("/managment",
    catalogController.managmentCatalog
)



module.exports = router;