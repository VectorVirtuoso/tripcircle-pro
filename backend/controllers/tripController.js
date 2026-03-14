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