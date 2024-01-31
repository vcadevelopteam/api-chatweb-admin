const express = require('express');
const router = express.Router();
const llamaController = require('../controllers/llamaController');
const auth = require('../middleware/auth');

router.post('/upload',
    llamaController.uploadFile
)

module.exports = router;