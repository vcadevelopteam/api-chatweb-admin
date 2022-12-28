const express = require("express");
const router = express.Router();
const mainMobileController = require("../../controllers/mobile/mainController");
const auth = require('../../middleware/auth');

router.post("/",
    auth,
    mainMobileController.GetCollection
)

router.post("/getCollectionPag",
    auth,
    mainMobileController.getCollectionPagination
)
router.post("/export",
    auth,
    mainMobileController.export
)
router.post("/multi",
    auth,
    mainMobileController.multiTransaction
)

/*
router.post("/getclient",
    mainMobileController.GetCient
)
router.post("/concatenar",
    mainMobileController.ConcatenarPedido
)
router.post("/seleccionarpedido",
    mainMobileController.SeleccionarPedido
)
router.post("/guardarpedido",
    mainMobileController.GuardarPedido
)
router.post("/managesplit",
    mainMobileController.SplitFirst
)
*/


// router.post("/fix",
//     mainController.fix
// )

module.exports = router;