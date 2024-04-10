const express = require('express');
const router = express.Router();
const llamaController = require('../controllers/llamaController');
const auth = require('../middleware/auth');

router.post('/create_collection',
    auth,
    llamaController.createCollection
)

router.post('/delete_collection',
    auth,
    llamaController.deleteCollection
)

router.post('/edit_collection',
    auth,
    llamaController.editCollection
)

router.post('/add_file',
    auth,
    llamaController.addFile
)

router.post('/delete_file',
    auth,
    llamaController.deleteFile
)

router.post('/query',
    auth,
    llamaController.query
)

module.exports = router;