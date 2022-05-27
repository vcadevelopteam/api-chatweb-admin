const express = require("express");
const router = express.Router();
const voximplantController = require("../controllers/voximplantController");
const auth = require('../middleware/auth');

// Parent //
router.post("/addAccount",
    voximplantController.addAccount
)
router.post("/getAccountInfo",
    voximplantController.getAccountInfo
)
router.post("/getAccountInvoices",
    voximplantController.getAccountInvoices
)
router.post("/getChildrenAccounts",
    voximplantController.getChildrenAccounts
)
router.post("/setChildAccountInfo",
    voximplantController.setChildAccountInfo
)
router.post("/transferMoneyToChildAccount",
    voximplantController.transferMoneyToChildAccount
)
// Child //
router.post("/addApplication",
    voximplantController.addApplication
)
router.post("/getApplications",
    voximplantController.getApplications
)
router.post("/getApplication",
    voximplantController.getApplication
)
router.post("/getCallHistory",
    voximplantController.getCallHistory
)
router.post("/addUser",
    voximplantController.addUser
)
router.post("/getUsers",
    voximplantController.getUsers
)
router.post("/getUser",
    voximplantController.getUser
)
router.post("/delUser",
    voximplantController.delUser
)
router.post("/addQueue",
    voximplantController.addQueue
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
router.post("/addCustomRecordStorage",
    voximplantController.addCustomRecordStorage
)
router.post("/getCustomRecordStorages",
    voximplantController.getCustomRecordStorages
)
router.post("/setCustomRecordStorageInfo",
    voximplantController.setCustomRecordStorageInfo
)

module.exports = router;