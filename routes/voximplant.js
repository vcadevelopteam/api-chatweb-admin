const express = require("express");
const router = express.Router();
const voximplantController = require("../controllers/voximplantController");
const auth = require('../middleware/auth');

router.post("/addAccount",
    voximplantController.addAccount
)
router.post("/getChildrenAccounts",
    voximplantController.getChildrenAccounts
)
router.post("/getApplications",
    voximplantController.getApplications
)
router.post("/getUsers",
    voximplantController.getUsers
)
router.post("/addUser",
    voximplantController.addUser
)
router.post("/delUser",
    voximplantController.delUser
)
router.post("/getQueues",
    voximplantController.getQueues
)
router.post("/bindUserToQueue",
    voximplantController.bindUserToQueue
)
router.post("/getPhoneNumberCategories",
    voximplantController.getPhoneNumberCategories
)
router.post("/getPhoneNumberCountryStates",
    voximplantController.getPhoneNumberCountryStates
)
router.post("/getPhoneNumberRegions",
    voximplantController.getPhoneNumberRegions
)
router.post("/attachPhoneNumber",
    voximplantController.attachPhoneNumber
)
router.post("/getPhoneNumbers",
    voximplantController.getPhoneNumbers
)
router.post("/bindPhoneNumberToApplication",
    voximplantController.bindPhoneNumberToApplication
)

module.exports = router;