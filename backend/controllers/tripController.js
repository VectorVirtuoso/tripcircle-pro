const Trip = require('../models/Trip');
const User = require('../models/User');

// @desc    Create a new trip
// @route   POST /api/trips
// @desc    Create a new trip (with Mapbox Geocoding)
// @route   POST /api/trips
// @desc    Create a new trip (with Mapbox Geocoding & Invites)
// @route   POST /api/trips
exports.createTrip = async (req, res) => {
  try {
    // 1. We now grab memberEmails from the incoming request!
    const { name, destination, adminId, memberEmails } = req.body;

    // 2. Fetch the exact GPS coordinates from Mapbox
    let tripCoordinates = { lat: 0, lng: 0 };
    if (destination && process.env.MAPBOX_ACCESS_TOKEN) {
      try {
        const geoResponse = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(destination)}.json?access_token=${process.env.MAPBOX_ACCESS_TOKEN}&limit=1`
        );
        const geoData = await geoResponse.json();

        if (geoData.features && geoData.features.length > 0) {
          const [lng, lat] = geoData.features[0].center;
          tripCoordinates = { lat, lng };
        }
      } catch (geoError) {
        console.error("Geocoding Error:", geoError);
      }
    }

    // 3. NEW: Convert the array of emails into an array of real User IDs
    let memberIds = [adminId]; // Always default to at least the admin
    if (memberEmails && memberEmails.length > 0) {
      // Ask MongoDB to find every user whose email is in our list
      const foundUsers = await User.find({ email: { $in: memberEmails } });
      
      // Extract just their _id properties
      memberIds = foundUsers.map(user => user._id);
      
      // Safety check: ensure the admin is definitely in this list
      if (!memberIds.some(id => id.toString() === adminId.toString())) {
        memberIds.push(adminId);
      }
    }

    // 4. Save the trip with the fully populated members list!
    const newTrip = new Trip({
      name,
      destination,
      admin: adminId, 
      members: memberIds, // <-- We use our newly built array here!
      coordinates: tripCoordinates
    });

    await newTrip.save();
    res.status(201).json(newTrip);
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

// @desc    Add a new member to an existing trip
// @route   POST /api/trips/:id/members
exports.addMemberToTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId, newMemberEmail } = req.body;

    const trip = await Trip.findById(id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    // 1. THE BOUNCER: Check if the requester is the Admin (or the first member for old trips)
    const actualAdminId = trip.admin ? trip.admin.toString() : trip.members[0].toString();
    if (actualAdminId !== adminId) {
      return res.status(403).json({ message: 'Only the Trip Admin can invite new members.' });
    }

    // 2. Find the user they want to invite by email
    const newUser = await User.findOne({ email: newMemberEmail });
    if (!newUser) {
      return res.status(404).json({ message: 'No user found with that email address.' });
    }

    // 3. Make sure they aren't already in the trip
    if (trip.members.includes(newUser._id)) {
      return res.status(400).json({ message: 'User is already in this trip.' });
    }

    // 4. Add them to the array and save!
    trip.members.push(newUser._id);
    await trip.save();

    res.status(200).json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload an image/document to the Trip Vault
// @route   POST /api/trips/:id/vault
exports.uploadToVault = async (req, res) => {
  try {
    // Multer intercepted the file and attached it to req.file
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    // Grab the secure URL that Cloudinary generated for us
    const newFile = {
      imageUrl: req.file.path, 
      publicId: req.file.filename,
      uploadedBy: req.body.userId // We'll send this from the frontend
    };

    trip.vault.push(newFile);
    await trip.save();

    res.status(200).json(trip.vault);
  } catch (error) {
    console.error("Vault Upload Error:", error);
    res.status(500).json({ message: error.message });
  }
};