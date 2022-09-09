const express = require("express");
const ip = require('../middleware/ip');
const auth = require('../middleware/auth');
const router = express.Router();
const voximplantController = require("../controllers/voximplantController");

// Parent //
router.post("/addAccount",
    ip,
    voximplantController.addAccount
)
router.post("/getAccountInfo",
    ip,
    voximplantController.getAccountInfo
)
router.post("/getAccountInvoices",
    ip,
    voximplantController.getAccountInvoices
)
router.post("/getChildrenAccounts",
    ip,
    voximplantController.getChildrenAccounts
)
router.post("/setChildAccountInfo",
    ip,
    voximplantController.setChildAccountInfo
)
router.post("/transferMoneyToChildAccount",
    ip,
    voximplantController.transferMoneyToChildAccount
)

// Child //
router.post("/addApplication",
    ip,
    voximplantController.addApplication
)
router.post("/getApplications",
    ip,
    voximplantController.getApplications
)
router.post("/getApplication",
    ip,
    voximplantController.getApplication
)
router.post("/getCallHistory",
    ip,
    voximplantController.getCallHistory
)
router.post("/getTransactionHistory",
    ip,
    voximplantController.getTransactionHistory
)
router.post("/getCallRecord",
    ip,
    auth,
    voximplantController.getCallRecord
)
router.post("/getCallTranscription",
    voximplantController.getCallTranscription
)
router.post("/addUser",
    ip,
    voximplantController.addUser
)
router.post("/getUsers",
    ip,
    voximplantController.getUsers
)
router.post("/getUser",
    ip,
    voximplantController.getUser
)
router.post("/delUser",
    ip,
    voximplantController.delUser
)
router.post("/addQueue",
    ip,
    voximplantController.addQueue
)
router.post("/getQueues",
    ip,
    voximplantController.getQueues
)
router.post("/bindUserToQueue",
    ip,
    voximplantController.bindUserToQueue
)
router.post("/getPhoneNumberCategories",
    ip,
    voximplantController.getPhoneNumberCategories
)
router.post("/getPhoneNumberCountryStates",
    ip,
    voximplantController.getPhoneNumberCountryStates
)
router.post("/getPhoneNumberRegions",
    ip,
    voximplantController.getPhoneNumberRegions
)
router.post("/attachPhoneNumber",
    ip,
    voximplantController.attachPhoneNumber
)
router.post("/getPhoneNumbers",
    ip,
    voximplantController.getPhoneNumbers
)
router.post("/bindPhoneNumberToApplication",
    ip,
    voximplantController.bindPhoneNumberToApplication
)
router.post("/addCustomRecordStorage",
    ip,
    voximplantController.addCustomRecordStorage
)
router.post("/getCustomRecordStorages",
    ip,
    voximplantController.getCustomRecordStorages
)
router.post("/setCustomRecordStorageInfo",
    ip,
    voximplantController.setCustomRecordStorageInfo
)
router.post("/getResourcePrice",
    ip,
    voximplantController.getResourcePrice
)

// Organization //
router.post("/updateScenario",
    ip,
    auth,
    voximplantController.updateScenario
)
router.post("/getMaximumConsumption",
    ip,
    auth,
    voximplantController.getMaximumConsumption
)
router.post("/transferAccountBalance",
    ip,
    auth,
    voximplantController.transferAccountBalance
)
router.post("/getAccountBalance",
    ip,
    auth,
    voximplantController.getAccountBalance
)

// Scheduler //
router.post("/directGetMaximumConsumption",
    ip,
    voximplantController.directGetMaximumConsumption
)
router.post("/directTransferAccountBalance",
    ip,
    voximplantController.directTransferAccountBalance
)
router.post("/directGetAccountBalance",
    ip,
    voximplantController.directGetAccountBalance
)
router.post("/updateVoximplantPeriod",
    ip,
    voximplantController.updateVoximplantPeriod
)

// Landing //
router.post("/pricingCountryList",
    ip,
    voximplantController.pricingCountryList
)
router.post("/pricingCountryData",
    ip,
    voximplantController.pricingCountryData
)

// Campaign //
router.post("/createCallList",
    voximplantController.createCallList
)
router.post("/createManualCallList",
    voximplantController.createManualCallList
)
router.post("/startNextCallTask",
    voximplantController.startNextCallTask
)
router.post("/getCallLists",
    voximplantController.getCallLists
)
router.post("/stopCallListProcessing",
    voximplantController.stopCallListProcessing
)

module.exports = router;