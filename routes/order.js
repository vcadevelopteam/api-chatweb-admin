const express = require('express');
const router = express.Router();
const routerController = require('../controllers/orderController');
const auth = require('../middleware/auth');

// Base route
router.get('/', (req, res) => {
    res.send('Welcome to the order API!');
});

router.post('/update', auth, routerController.update);

router.post('/payments', auth, routerController.payments);

module.exports = router;
