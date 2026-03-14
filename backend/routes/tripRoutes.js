const express = require('express');
const router = express.Router();
const { createTrip, getTrips, getUserTrips } = require('../controllers/tripController');

router.route('/').post(createTrip).get(getTrips);
router.route('/user/:email').get(getUserTrips);

module.exports = router;