const express = require('express');
const router = express.Router();
const { createTrip, getTrips, getUserTrips, addPackingItem, togglePackingItem, addMemberToTrip, uploadToVault, downloadTripReport } = require('../controllers/tripController');
const { upload } = require('../config/cloudinary');

router.route('/').post(createTrip).get(getTrips);
router.route('/user/:email').get(getUserTrips);
router.post('/:id/packing', addPackingItem);
router.put('/:id/packing/:itemId', togglePackingItem);
router.post('/:id/members', addMemberToTrip);
router.post('/:id/vault', upload.single('file'), uploadToVault);
router.get('/:id/download', downloadTripReport);

module.exports = router;