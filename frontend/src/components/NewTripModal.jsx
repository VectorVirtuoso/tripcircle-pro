import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, MapPin } from "lucide-react";

// NEW: We now accept the entire currentUser object to get their _id
const NewTripModal = ({ isOpen, onClose, currentUser, onTripCreated }) => {
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [friends, setFriends] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const friendEmails = friends.split(',').map(email => email.trim()).filter(e => e);
    const allMemberEmails = [currentUser.email, ...friendEmails];

    try {
      const response = await fetch("https://tripcircle-backend.onrender.com/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          destination,
          memberEmails: allMemberEmails,
          // NEW: We send the user's ID to the backend so they become the Admin!
          adminId: currentUser._id 
        })
      });

      if (response.ok) {
        setName("");
        setDestination("");
        setFriends("");
        onTripCreated(); 
        onClose();
      } else {
        const errorData = await response.json();
        console.error("Server Error:", errorData);
        alert(errorData.message || "Failed to create trip.");
      }
    } catch (error) {
      console.error("Failed to create trip:", error);
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
          className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin className="text-[#10b981]" size={24} />
              Plan a New Trip
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer bg-gray-100 dark:bg-gray-800 p-1.5 rounded-full">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trip Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Weekend in Lonavala" 
                className="w-full bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#10b981] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destination</label>
              <input 
                type="text" 
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g., Lonavala, Maharashtra" 
                className="w-full bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#10b981] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invite Friends (Emails)</label>
              <input 
                type="text" 
                value={friends}
                onChange={(e) => setFriends(e.target.value)}
                placeholder="friend1@email.com, friend2@email.com" 
                className="w-full bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#10b981] transition-colors"
              />
              <p className="text-xs text-gray-500 mt-2 font-medium">Separate multiple emails with commas. They must have an account first!</p>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full mt-6 flex justify-center items-center gap-2 bg-[#10b981] text-white dark:text-gray-900 font-bold py-3.5 rounded-xl hover:bg-[#0ea5e9] hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Create Trip"}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NewTripModal;