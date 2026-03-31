import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckSquare, Square, Camera, Sparkles } from "lucide-react";

const AddExpenseModal = ({ isOpen, onClose, trip, onExpenseAdded, socket }) => {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false); // NEW: Track AI scanning state
  const [selectedSplitters, setSelectedSplitters] = useState([]);
  
  const fileInputRef = useRef(null); // NEW: Reference to the hidden file input

  useEffect(() => {
    if (isOpen && trip) {
      setTitle("");
      setAmount("");
      setPayerId(trip.members[0]._id);
      setSelectedSplitters(trip.members.map(m => m._id));
    }
  }, [isOpen, trip]);

  if (!isOpen || !trip) return null;

  const toggleSplitter = (memberId) => {
    setSelectedSplitters(prev => prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]);
  };

  const toggleAll = () => {
    if (selectedSplitters.length === trip.members.length) {
      setSelectedSplitters([]);
    } else {
      setSelectedSplitters(trip.members.map(m => m._id));
    }
  };

  // NEW: Handle the image upload and AI scanning
  const handleScanReceipt = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);

    // Convert image to Base64 string
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      // Remove the "data:image/jpeg;base64," prefix for the backend
      const base64String = reader.result.split(',')[1];
      const mimeType = file.type;

      try {
        const response = await fetch("https://tripcircle-backend.onrender.com/api/ai/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64String, mimeType })
        });

        if (!response.ok) throw new Error("Failed to scan");

        const data = await response.json();
        
        // AUTO-FILL THE FORM!
        if (data.title) setTitle(data.title);
        if (data.amount) setAmount(data.amount.toString());
        
      } catch (error) {
        console.error("Scan failed:", error);
        alert("Gemini couldn't read the receipt clearly. Try another photo!");
      } finally {
        setIsScanning(false);
        e.target.value = null; // Reset file input so you can scan the same file again if needed
      }
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedSplitters.length === 0) {
      alert("Please select at least one person to split the cost with!");
      return;
    }

    setIsSubmitting(true);
    const amountNum = parseFloat(amount);
    const splitAmount = amountNum / selectedSplitters.length; 

    const expensePayload = {
      tripId: trip._id,
      title: title,
      amount: amountNum,
      paidBy: payerId || trip.members[0]._id,
      splitAmong: selectedSplitters.map(userId => ({
        user: userId,
        amountOwed: splitAmount
      }))
    };

    try {
      const response = await fetch("https://tripcircle-backend.onrender.com/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expensePayload)
      });

      if (response.ok) {
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
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col"
        >
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Expense</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
              <X size={20} />
            </button>
          </div>

          {/* NEW: AI Scan Button */}
          <div className="mb-4 shrink-0">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleScanReceipt} 
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current.click()}
              disabled={isScanning}
              className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-md cursor-pointer disabled:opacity-70"
            >
              {isScanning ? (
                <><Loader2 className="animate-spin" size={20} /> Analyzing Receipt...</>
              ) : (
                <><Camera size={20} /> <Sparkles size={16} /> Auto-fill with AI Scanner</>
              )}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto pr-2 custom-scrollbar flex-1">
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

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="bg-gray-50 dark:bg-[#0f172a] p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Split among</label>
                <button 
                  type="button" 
                  onClick={toggleAll}
                  className="text-xs font-semibold text-[#0ea5e9] hover:text-[#0284c7] transition-colors cursor-pointer"
                >
                  {selectedSplitters.length === trip.members.length ? "Deselect All" : "Select All"}
                </button>
              </div>
              
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                {trip.members.map(member => {
                  const isSelected = selectedSplitters.includes(member._id);
                  return (
                    <div 
                      key={member._id} 
                      onClick={() => toggleSplitter(member._id)}
                      className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors border ${isSelected ? 'bg-[#10b981]/10 border-[#10b981]/30' : 'bg-white dark:bg-[#1e293b] border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                    >
                      {isSelected ? (
                        <CheckSquare className="text-[#10b981]" size={20} />
                      ) : (
                        <Square className="text-gray-400" size={20} />
                      )}
                      <span className={`text-sm font-medium ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                        {member.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full shrink-0 mt-2 flex justify-center items-center gap-2 bg-[#10b981] text-white dark:text-gray-900 font-bold py-3.5 rounded-xl hover:bg-[#0ea5e9] transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Save Expense"}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddExpenseModal;