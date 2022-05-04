const express = require("express");
const router = express.Router();
const voximplantController = require("../controllers/voximplantController");
const auth = require('../middleware/auth');

router.post("/addAccount",
    // auth,
    voximplantController.addAccount
)
router.post("/getChildrenAccounts",
    // auth,
    voximplantController.getChildrenAccounts
)
router.post("/getApplications",
    // auth,    
    voximplantController.getApplications
)
router.post("/getUsers",
    // auth,    
    voximplantController.getUsers
)
router.post("/addUser",
    // auth,    
    voximplantController.addUser
)
router.post("/getQueues",
    // auth,
    voximplantController.getQueues
)
router.post("/bindUserToQueue",
    // auth,    
    voximplantController.bindUserToQueue
)
router.post("/getPhoneNumberCategories",
    // auth,    
    voximplantController.getPhoneNumberCategories
)
router.post("/getPhoneNumberCountryStates",
    // auth,    
    voximplantController.getPhoneNumberCountryStates
)
router.post("/getPhoneNumberRegions",
    // auth,    
    voximplantController.getPhoneNumberRegions
)
router.post("/attachPhoneNumber",
    // auth,    
    voximplantController.attachPhoneNumber
)
router.post("/getPhoneNumbers",
    // auth,    
    voximplantController.getPhoneNumbers
)
router.post("/bindPhoneNumberToApplication",
    // auth,    
    voximplantController.bindPhoneNumberToApplication
)

module.exports = router;