const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

router.post("/import",
    productController.import
)

module.exports = router;