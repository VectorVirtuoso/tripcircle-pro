const express = require('express');
const router = express.Router();
const { getOptimizedSettlements } = require('../controllers/settlementController');

router.route('/:tripId').get(getOptimizedSettlements);

module.exports = router;