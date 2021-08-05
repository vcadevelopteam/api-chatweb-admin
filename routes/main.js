const express = require("express");
const router = express.Router();
const mainController = require("../controllers/mainController");
const auth = require('../middleware/auth');

router.post("/",
    auth,
    mainController.GetCollection
)
router.post("/multi",
    auth,
    mainController.multiTransaction
)

router.post("/getCollectionPag",
    auth,
    mainController.getCollectionPagination
)
router.post("/export",
    auth,
    mainController.export
)
router.post("/exportexcel",
    auth,
    mainController.exportexcel
)


module.exports = router;