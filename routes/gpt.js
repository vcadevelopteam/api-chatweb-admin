const express = require('express');
const router = express.Router();
const gptController = require('../controllers/gptController');
const auth = require('../middleware/auth');

router.post('/threads',
    gptController.createThreads
)

router.post('/threads/delete',
    gptController.deleteThreads
)

router.post('/assistants/new',
    gptController.createAssistant
)

router.post('/assistants/update',
    gptController.updateAssistant
)

router.post('/assistants/delete',
    gptController.deleteAssistant
)

router.post('/assistants/messages',
    gptController.messages
)

router.post('/files',
    gptController.addFile
)

router.post('/assistants/files',
    gptController.assignFile
)

router.post('/assistants/files/list',
    gptController.verifyFile
)

router.post('/files/delete',
    gptController.deleteFile
)

module.exports = router;