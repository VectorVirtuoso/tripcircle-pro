const Trip = require('../models/Trip');
const User = require('../models/User');

// @desc    Create a new trip
// @route   POST /api/trips
exports.createTrip = async (req, res) => {
  try {
    const { name, destination, memberEmails } = req.body;

    // 1. Find all users in MongoDB that match the provided emails
    const users = await User.find({ email: { $in: memberEmails } });
    
    // 2. Extract their MongoDB _ids
    const memberIds = users.map(user => user._id);

    // 3. Create the trip using the resolved IDs
    const trip = await Trip.create({ name, destination, members: memberIds });
    
    res.status(201).json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all trips
// @route   GET /api/trips
exports.getTrips = async (req, res) => {
  try {
    const trips = await Trip.find().populate('members', 'name email');
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserTrips = async (req, res) => {
  try {
    // 1. Find the user in MongoDB using their Supabase email
    const user = await User.findOne({ email: req.params.email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found in database' });
    }

    // 2. Find only the trips where this user's MongoDB _id is in the members array!
    const trips = await Trip.find({ members: user._id }).populate('members', 'name email');
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add an item to the packing list
// @route   POST /api/trips/:id/packing
exports.addPackingItem = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    trip.packingList.push({
      item: req.body.item,
      isPacked: false
    });

    await trip.save();
    res.status(200).json(trip.packingList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle a packing list item (Packed/Unpacked)
// @route   PUT /api/trips/:id/packing/:itemId
exports.togglePackingItem = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const item = trip.packingList.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Flip the boolean and record who packed it
    item.isPacked = !item.isPacked;
    item.packedBy = item.isPacked ? req.body.userId : null;

    await trip.save();
    res.status(200).json(trip.packingList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};