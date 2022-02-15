const express = require("express");
const router = express.Router();
const mainController = require("../controllers/mainController");
const auth = require('../middleware/auth');

router.post("/",
    ip,
    auth,
    mainController.GetCollection
)
router.post("/public/domainvalues",
    ip,
    mainController.GetCollectionDomainValues
)
router.post("/public/multi/domainvalues",
    ip,
    mainController.GetMultiDomainsValue
)
router.post("/multi",
    ip,
    auth,
    mainController.multiCollection
)
router.post("/executetransaction",
    ip,
    auth,
    mainController.executeTransaction
)

router.post("/paginated",
    ip,
    auth,
    mainController.getCollectionPagination
)

router.post("/graphic",
    ip,
    auth,
    mainController.getGraphic
)

router.post("/export",
    ip,
    auth,
    mainController.export
)+

router.post("/getToken",
    ip,
    mainController.getToken
)

router.post("/validateConversationWhatsapp",
    ip,
    mainController.validateConversationWhatsapp
)

module.exports = router;