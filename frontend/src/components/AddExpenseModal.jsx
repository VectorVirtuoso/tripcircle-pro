import { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";

const AddExpenseModal = ({ isOpen, onClose, trip, onExpenseAdded, socket }) => {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !trip) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const amountNum = parseFloat(amount);
    const splitAmount = amountNum / trip.members.length; 

    const expensePayload = {
      tripId: trip._id,
      title: title,
      amount: amountNum,
      paidBy: payerId || trip.members[0]._id,
      splitAmong: trip.members.map(member => ({
        user: member._id,
        amountOwed: splitAmount
      }))
    };

    try {
      const response = await fetch("http://localhost:5000/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expensePayload)
      });

      if (response.ok) {
        setTitle("");
        setAmount("");
        onExpenseAdded(); 
        if (socket) socket.emit("expense_added", trip._id); 
        onClose(); 
      }
    } catch (error) {
      console.error("Failed to save expense:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Expense</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">What was this for?</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Dinner at the beach" 
              className="w-full bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#10b981] dark:focus:border-[#10b981] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (₹)</label>
            <input 
              type="number" 
              required
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00" 
              className="w-full bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#10b981] dark:focus:border-[#10b981] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Who paid?</label>
            <select 
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#10b981] dark:focus:border-[#10b981] transition-colors appearance-none"
            >
              {trip.members.map(member => (
                <option key={member._id} value={member._id}>{member.name}</option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full mt-6 flex justify-center items-center gap-2 bg-[#10b981] text-white dark:text-gray-900 font-bold py-3 rounded-xl hover:bg-[#0ea5e9] transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Save Expense"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AddExpenseModal;