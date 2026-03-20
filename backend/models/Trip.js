const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  destination: { 
    type: String 
  },
  members: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  packingList: [{
    item: { type: String, required: true },
    isPacked: { type: Boolean, default: false },
    packedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Tracks who packed it
  }]
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);