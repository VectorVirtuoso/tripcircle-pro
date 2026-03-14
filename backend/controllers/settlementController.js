const Expense = require('../models/Expense');
const { minimizeCashFlow } = require('../utils/debtCalculator');

// @desc    Calculate optimized settlements for a trip
// @route   GET /api/settlements/:tripId
exports.getOptimizedSettlements = async (req, res) => {
  try {
    const tripId = req.params.tripId;
    
    // 1. Fetch all expenses for this trip
    const expenses = await Expense.find({ tripId }).populate('splitAmong.user');
    
    // 2. Map to store net balances for each user (user._id string -> net balance)
    const netBalances = {};

    // 3. Process every expense
    expenses.forEach(expense => {
      const payerId = expense.paidBy.toString();
      
      // Add the total amount to the payer's positive balance
      if (!netBalances[payerId]) netBalances[payerId] = 0;
      netBalances[payerId] += expense.amount;

      // Subtract the owed amounts from everyone involved
      expense.splitAmong.forEach(split => {
        const debtorId = split.user._id.toString();
        if (!netBalances[debtorId]) netBalances[debtorId] = 0;
        netBalances[debtorId] -= split.amountOwed;
      });
    });

    // 4. Pass the net balances into our algorithm
    const optimizedTransactions = minimizeCashFlow(netBalances);

    res.status(200).json({
      netBalances,
      optimizedTransactions
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};