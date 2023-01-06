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
    catalogController.synchrocatalog
)

router.post("/managecatalog",
    ip,
    auth,
    catalogController.managecatalog
)

module.exports = router;