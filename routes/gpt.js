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

module.exports = router;