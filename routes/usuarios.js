const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/userControllers");
const auth = require('../middleware/auth');

router.post("/",
    usuarioController.insertUser
)

router.post("/manage",
    auth,
    usuarioController.manage
)

router.get("/", 
    auth,
    usuarioController.getUsers
)

router.get("/changepassword", 
    auth,
    usuarioController.changepassword
)

module.exports = router;