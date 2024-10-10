const express = require('express');
const router = express.Router();
const llama3Controller = require('../controllers/llama3Controller');
const auth = require('../middleware/auth');

router.post('/create_collection',
    auth,
    llama3Controller.createCollection
)

router.post('/create_collection_documents',
    auth,
    llama3Controller.createCollectionDocuments
)

router.post('/massive_delete',
    auth,
    llama3Controller.massiveDeleteCollection
)

router.post('/edit_collection',
    auth,
    llama3Controller.editCollection
)

router.post('/add_files',
    auth,
    llama3Controller.addFiles
)

router.post('/delete_file',
    auth,
    llama3Controller.deleteFile
)

router.post('/delete_thread',
    auth,
    llama3Controller.deleteThread
)

router.post('/llama3_query',
    auth,
    llama3Controller.query
)

module.exports = router;