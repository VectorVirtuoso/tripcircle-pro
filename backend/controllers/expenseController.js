const Expense = require('../models/Expense');
const mongoose = require('mongoose');

// @desc    Create a new expense
// @route   POST /api/expenses
exports.createExpense = async (req, res) => {
  try {
    const { tripId, title, amount, paidBy, splitAmong } = req.body;
    const expense = await Expense.create({ tripId, title, amount, paidBy, splitAmong });
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all expenses for a trip (with Pagination!)
// @route   GET /api/expenses/:tripId
// @desc    Get all expenses for a trip (with Pagination & True Total)
// @route   GET /api/expenses/:tripId
exports.getTripExpenses = async (req, res) => {
  try {
    const { tripId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const expenses = await Expense.find({ tripId })
      .populate('paidBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalExpenses = await Expense.countDocuments({ tripId });

    // NEW: Calculate the TRUE total spend using MongoDB Aggregation
    const mongoose = require('mongoose');
    const totalSpendAgg = await Expense.aggregate([
      { $match: { tripId: new mongoose.Types.ObjectId(tripId) } },
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
    ]);
    
    // If the array has data, grab the total. Otherwise, it's 0.
    const trueTotalSpend = totalSpendAgg.length > 0 ? totalSpendAgg[0].totalAmount : 0;

    res.status(200).json({
      expenses, 
      totalSpend: trueTotalSpend, // Send the true total to React!
      currentPage: page,
      totalPages: Math.ceil(totalExpenses / limit),
      hasMore: page * limit < totalExpenses
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};