const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

router.post("/import", productController.import);

router.post("/getinfo", productController.getinfo);

router.post("/create", productController.create);

router.post("/createorder", productController.createorder);

router.post("/createorderitem", productController.createorderitem);

router.post("/changeorderstatus", productController.changeorderstatus);

module.exports = router;
