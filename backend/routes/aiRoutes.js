const express = require('express');
const router = express.Router();
const { generateItinerary, scanReceipt } = require('../controllers/aiController');

router.post('/plan', generateItinerary);
router.post('/scan', scanReceipt);

module.exports = router;