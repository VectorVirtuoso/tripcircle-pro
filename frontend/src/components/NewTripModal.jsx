import { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";

const NewTripModal = ({ isOpen, onClose, currentUserEmail, onTripCreated }) => {
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [friends, setFriends] = useState(""); // Comma separated emails
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Format the emails: current user + any friends they typed in
    const friendEmails = friends.split(',').map(email => email.trim()).filter(e => e);
    const allMemberEmails = [currentUserEmail, ...friendEmails];

    try {
      const response = await fetch("http://localhost:5000/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          destination,
          memberEmails: allMemberEmails
        })
      });

      if (response.ok) {
        setName("");
        setDestination("");
        setFriends("");
        onTripCreated(); // Tell Dashboard to refresh the list!
        onClose();
      }
    } catch (error) {
      console.error("Failed to create trip:", error);
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
        className="bg-[#1e293b] border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Plan a New Trip</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Trip Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Weekend in Lonavala" 
              className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#10b981] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Destination</label>
            <input 
              type="text" 
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g., Lonavala, Maharashtra" 
              className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#10b981] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Invite Friends (Emails)</label>
            <input 
              type="text" 
              value={friends}
              onChange={(e) => setFriends(e.target.value)}
              placeholder="friend1@email.com, friend2@email.com" 
              className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#10b981] transition-colors"
            />
            <p className="text-xs text-gray-500 mt-2">Separate multiple emails with commas. They must have an account first!</p>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full mt-6 flex justify-center items-center gap-2 bg-[#10b981] text-gray-900 font-bold py-3 rounded-xl hover:bg-[#0ea5e9] hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Create Trip"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default NewTripModal;