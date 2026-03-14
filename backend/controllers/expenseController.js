const Expense = require('../models/Expense');

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

// @desc    Get expenses for a specific trip
// @route   GET /api/expenses/:tripId
exports.getTripExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ tripId: req.params.tripId })
      .populate('paidBy', 'name email')
      .populate('splitAmong.user', 'name email');
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};