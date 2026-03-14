/**
 * Minimizes cash flow among a group of people.
 * @param {Object} balances - A dictionary map of userId to their net balance. 
 * Example: { 'userA': 500, 'userB': -200, 'userC': -300 }
 * @returns {Array} - An array of optimized transactions: { from, to, amount }
 */
const minimizeCashFlow = (balances) => {
  // 1. Separate into debtors and creditors
  let debtors = [];
  let creditors = [];

  for (const [user, amount] of Object.entries(balances)) {
    if (amount < 0) debtors.push({ user, amount: Math.abs(amount) });
    if (amount > 0) creditors.push({ user, amount });
  }

  // Sort descending so we settle the largest amounts first (Greedy approach)
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  let transactions = [];
  let i = 0; // Debtors index
  let j = 0; // Creditors index

  // 2. Resolve debts
  while (i < debtors.length && j < creditors.length) {
    let debtor = debtors[i];
    let creditor = creditors[j];

    // The amount to settle is the minimum of what the debtor owes and what the creditor is owed
    let settledAmount = Math.min(debtor.amount, creditor.amount);

    transactions.push({
      from: debtor.user,
      to: creditor.user,
      amount: Math.round(settledAmount * 100) / 100 // Prevent floating point weirdness
    });

    // Update remaining balances
    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    // Move to the next person if their balance is settled
    if (debtor.amount === 0) i++;
    if (creditor.amount === 0) j++;
  }

  return transactions;
};

module.exports = { minimizeCashFlow };