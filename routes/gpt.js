const express = require('express');
const router = express.Router();
const gptController = require('../controllers/gptController');
const auth = require('../middleware/auth');

router.post('/threads',
    auth,
    gptController.createThreads
)

router.post('/threads/delete',
    auth,
    gptController.deleteThreads
)

router.post('/assistants/new',
    auth,
    gptController.createAssistant
)

router.post('/assistants/update',
    auth,
    gptController.updateAssistant
)

router.post('/assistants/delete',
    auth,
    gptController.deleteAssistant
)

router.post('/assistants/messages',
    auth,
    gptController.messages
)

router.post('/files',
    auth,
    gptController.addFile
)

router.post('/assistants/files',
    auth,
    gptController.assignFile
)

router.post('/assistants/files/list',
    auth,
    gptController.verifyFile
)

router.post('/files/delete',
    auth,
    gptController.deleteFile
)

router.post('/assistants/massivedelete',
    auth,
    gptController.massiveDelete
)

module.exports = router;