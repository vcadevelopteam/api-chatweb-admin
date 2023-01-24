const express = require("express");
const router = express.Router();
const mainController = require("../controllers/mainController");

const auth = require('../middleware/auth');
const ip = require('../middleware/ip');

router.post("/",
    ip,
    auth,
    mainController.GetCollection
)
router.post("/public/paymentorder",
    ip,
    mainController.GetCollectionPaymentOrder
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
    mainController.exportWithCursor
)

router.post("/exportTrigger",
    ip,
    auth,
    mainController.exportWithCursor
)

router.post("/getToken",
    ip,
    mainController.getToken
)

router.post("/validateConversationWhatsapp",
    ip,
    mainController.validateConversationWhatsapp
)

module.exports = router;