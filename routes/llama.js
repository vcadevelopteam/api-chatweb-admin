const express = require('express');
const router = express.Router();
const llamaController = require('../controllers/llamaController');
const auth = require('../middleware/auth');

router.post('/create_collection',
    auth,
    llamaController.createCollection
)

router.post('/add_file',
    auth,
    llamaController.addFile
)

router.post('/query',
    auth,
    llamaController.query
)

router.delete('/delete_collection',
    auth,
    llamaController.deleteCollection
)

module.exports = router;