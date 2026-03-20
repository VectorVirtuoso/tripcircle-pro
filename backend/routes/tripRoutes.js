const express = require('express');
const router = express.Router();
const { createTrip, getTrips, getUserTrips, addPackingItem, togglePackingItem } = require('../controllers/tripController');

router.route('/').post(createTrip).get(getTrips);
router.route('/user/:email').get(getUserTrips);
router.post('/:id/packing', addPackingItem);
router.put('/:id/packing/:itemId', togglePackingItem);

module.exports = router;