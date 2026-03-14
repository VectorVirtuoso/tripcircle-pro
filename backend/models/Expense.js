const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  tripId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Trip', 
    required: true 
  },
  title: { 
    type: String, 
    required: true // e.g., "Dinner at Fisherman's Wharf"
  },
  amount: { 
    type: Number, 
    required: true // Total amount paid
  },
  paidBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true // The person who swiped their card
  },
  splitAmong: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    amountOwed: { 
      type: Number // Their specific cut of the bill
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);