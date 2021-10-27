const express = require("express");
const router = express.Router();
const mainController = require("../controllers/mainController");
const auth = require('../middleware/auth');

router.post("/",
    auth,
    mainController.GetCollection
)
router.post("/public/domainvalues",
    mainController.GetCollectionDomainValues
)
router.post("/public/multi/domainvalues",
    mainController.GetMultiDomainsValue
)
router.post("/multi",
    auth,
    mainController.multiCollection
)
router.post("/executetransaction",
    auth,
    mainController.executeTransaction
)

router.post("/paginated",
    auth,
    mainController.getCollectionPagination
)

router.post("/export",
    auth,
    mainController.export
)+

router.post("/getToken",
    mainController.getToken
)

module.exports = router;