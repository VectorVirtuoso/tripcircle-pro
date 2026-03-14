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
  }]
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);