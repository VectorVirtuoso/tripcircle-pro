const express = require('express');
const router = express.Router();
const { createExpense, getTripExpenses } = require('../controllers/expenseController');

// Route to create a new expense
router.route('/').post(createExpense);

// Route to get all expenses for a specific trip URL
router.route('/:tripId').get(getTripExpenses);

module.exports = router;