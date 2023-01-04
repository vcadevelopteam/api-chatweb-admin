const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth');
const catalogController = require("../controllers/catalogControllers")

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


module.exports = router;