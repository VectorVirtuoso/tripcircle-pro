import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Plane, LogOut, Map, Sun, Moon, Sparkles } from "lucide-react"; // <-- Added Sparkles here
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import NewTripModal from "../components/NewTripModal";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMyTrips = async () => {
    if (user?.email) {
      try {
        const res = await fetch(`http://localhost:5000/api/trips/user/${user.email}`);
        if (res.ok) {
          const data = await res.json();
          setTrips(data);
        }
      } catch (error) {
        console.error("Failed to fetch trips:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTrips();
  }, [user]);

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userName = user?.name || "Traveler";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-white p-8 transition-colors duration-300">
      <header className="flex justify-between items-center mb-12 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Welcome, <span className="text-[#10b981]">{userName}</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Ready to settle up?</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:text-[#10b981] dark:text-gray-400 dark:hover:text-[#10b981] bg-white dark:bg-[#1e293b] rounded-full transition-colors cursor-pointer border border-gray-200 dark:border-transparent shadow-sm dark:shadow-none"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* THE NEW AI PLANNER BUTTON */}
          <Link to="/planner" className="flex items-center gap-2 bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] text-white font-semibold py-2 px-5 rounded-full hover:shadow-lg transition-all duration-300 cursor-pointer border border-transparent">
            <Sparkles size={18} />
            <span className="hidden sm:inline">AI Planner</span>
          </Link>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#10b981] text-white dark:text-gray-900 font-semibold py-2 px-5 rounded-full hover:bg-[#0ea5e9] hover:text-white transition-all duration-300 cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.3)]"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">New Trip</span>
          </button>
          
          <button 
            onClick={handleLogout}
            className="p-2 text-gray-500 hover:text-[#f43f5e] dark:text-gray-400 dark:hover:text-[#f43f5e] bg-white dark:bg-[#1e293b] rounded-full transition-colors cursor-pointer border border-gray-200 dark:border-transparent shadow-sm dark:shadow-none"
            title="Log out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="text-gray-500 dark:text-gray-400">Loading your trips...</div>
      ) : trips.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400 bg-white dark:bg-[#1e293b]/30 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 shadow-sm dark:shadow-none"
        >
          <Map size={64} className="mb-6 text-gray-400 dark:text-gray-600" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">No trips found</h2>
          <p className="mb-6">You aren't a member of any trips yet.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-white dark:bg-[#1e293b] border border-gray-300 dark:border-gray-600 hover:border-[#10b981] dark:hover:border-[#10b981] text-gray-900 dark:text-white py-2 px-6 rounded-full transition-all duration-300 cursor-pointer shadow-sm dark:shadow-none"
          >
            <Plus size={18} className="text-[#10b981]" />
            <span>Create your first trip</span>
          </button>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {trips.map((trip) => (
            <Link to={`/trip/${trip._id}`} key={trip._id} className="block group">
              <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-[#10b981] dark:hover:border-[#10b981] transition-all duration-300 cursor-pointer h-full shadow-sm hover:shadow-md dark:shadow-none">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl group-hover:bg-[#10b981] transition-colors">
                    <Plane size={24} className="text-gray-500 dark:text-gray-300 group-hover:text-white dark:group-hover:text-gray-900" />
                  </div>
                  <span className="text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
                    Active
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{trip.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {trip.destination} • {trip.members.length} members
                </p>
              </div>
            </Link>
          ))}
        </motion.div>
      )}

      <NewTripModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        currentUserEmail={user.email}
        onTripCreated={fetchMyTrips}
      />
    </div>
  );
};

export default Dashboard;