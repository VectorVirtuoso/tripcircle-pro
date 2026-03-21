const express = require('express');
const router = express.Router();
const { createTrip, getTrips, getUserTrips, addPackingItem, togglePackingItem, addMemberToTrip, uploadToVault } = require('../controllers/tripController');
const { upload } = require('../config/cloudinary');

router.route('/').post(createTrip).get(getTrips);
router.route('/user/:email').get(getUserTrips);
router.post('/:id/packing', addPackingItem);
router.put('/:id/packing/:itemId', togglePackingItem);
router.post('/:id/members', addMemberToTrip);
router.post('/:id/vault', upload.single('file'), uploadToVault);

module.exports = router;