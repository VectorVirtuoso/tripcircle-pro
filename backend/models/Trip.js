const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  destination: { 
    type: String 
  },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  packingList: [{
    item: { type: String, required: true },
    isPacked: { type: Boolean, default: false },
    packedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Tracks who packed it
  }],
  vault: [{
    imageUrl: { type: String, required: true }, // The secure Cloudinary link
    publicId: { type: String, required: true }, // Needed if we ever want to delete the image
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);