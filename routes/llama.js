const express = require('express');
const router = express.Router();
const llamaController = require('../controllers/llamaController');
const auth = require('../middleware/auth');

router.post('/upload',
    llamaController.uploadFile
)

router.post('/message',
    llamaController.message    
)

module.exports = router;