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

router.post("/synchrocatalog",
    ip,
    auth,
    catalogController.synchroCatalog
)

router.post("/managecatalog",
    ip,
    auth,
    catalogController.manageCatalog
)

router.post("/synchroproduct",
    ip,
    auth,
    catalogController.synchroProduct
)

router.post("/importproduct",
    ip,
    auth,
    catalogController.importProduct
)

router.post("/manageproduct",
    ip,
    auth,
    catalogController.manageProduct
)

router.post("/deleteproduct",
    ip,
    auth,
    catalogController.deleteProduct
)

module.exports = router;