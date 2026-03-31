import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Plane, LogOut, Map as MapIcon, Sun, Moon, Sparkles, MapPin } from "lucide-react"; 
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import NewTripModal from "../components/NewTripModal";

// NEW: Mapbox Imports!
import MapGL, { Marker, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // NEW: State to track which map pin was clicked
  const [selectedTripLocation, setSelectedTripLocation] = useState(null);

  const fetchMyTrips = async () => {
    if (user?.email) {
      try {
        const res = await fetch(`https://tripcircle-backend.onrender.com/api/trips/user/${user.email}`);
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
      <header className="flex justify-between items-center mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
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
        <div className="text-gray-500 dark:text-gray-400 flex justify-center py-20">Loading your trips...</div>
      ) : trips.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400 bg-white dark:bg-[#1e293b]/30 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 shadow-sm dark:shadow-none"
        >
          <MapIcon size={64} className="mb-6 text-gray-400 dark:text-gray-600" />
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
        <>
          {/* THE NEW MAPBOX GLOBE FEATURE */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="w-full h-[400px] mb-8 rounded-3xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800 relative z-0"
          >
            <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 pointer-events-none shadow-sm flex items-center gap-2">
              🌍 Global Footprint
            </div>

            <MapGL
              mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
              initialViewState={{ longitude: 78.9629, latitude: 20.5937, zoom: 2 }} // Starts centered roughly over India
              mapStyle={theme === "dark" ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/light-v11"}
              projection="globe" // Renders as a 3D globe!
            >
              {/* Loop through trips and drop pins! */}
              {trips.map((trip) => {
                if (trip.coordinates?.lat && trip.coordinates?.lng) {
                  return (
                    <Marker
                      key={`marker-${trip._id}`}
                      longitude={trip.coordinates.lng}
                      latitude={trip.coordinates.lat}
                      anchor="bottom"
                      onClick={(e) => {
                        e.originalEvent.stopPropagation(); // Prevents map from panning wildly
                        setSelectedTripLocation(trip);
                      }}
                    >
                      <motion.div initial={{ scale: 0, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 300 }}>
                        <MapPin className="text-[#10b981] drop-shadow-xl cursor-pointer hover:text-[#0ea5e9] transition-colors" size={32} />
                      </motion.div>
                    </Marker>
                  );
                }
                return null;
              })}

              {/* Show Popup when a pin is clicked */}
              {selectedTripLocation && (
                <Popup
                  anchor="top"
                  longitude={selectedTripLocation.coordinates.lng}
                  latitude={selectedTripLocation.coordinates.lat}
                  onClose={() => setSelectedTripLocation(null)}
                  className="rounded-2xl"
                  maxWidth="250px"
                >
                  <div className="p-1 text-center text-gray-900">
                    <h3 className="font-bold text-sm mb-1">{selectedTripLocation.name}</h3>
                    <p className="text-xs text-gray-500 mb-3">{selectedTripLocation.destination}</p>
                    <Link to={`/trip/${selectedTripLocation._id}`} className="bg-[#10b981] text-white text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-[#0ea5e9] transition-colors inline-block">
                      View Trip
                    </Link>
                  </div>
                </Popup>
              )}
            </MapGL>
          </motion.div>

          {/* THE TRIP GRID */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {trips.map((trip) => (
              <Link to={`/trip/${trip._id}`} key={trip._id} className="block group">
                <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-[#10b981] dark:hover:border-[#10b981] transition-all duration-300 cursor-pointer h-full shadow-sm hover:shadow-md dark:shadow-none">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl group-hover:bg-[#10b981] transition-colors">
                      <Plane size={24} className="text-gray-500 dark:text-gray-300 group-hover:text-white dark:group-hover:text-gray-900" />
                    </div>
                    <span className="text-xs font-medium bg-[#10b981]/10 text-[#10b981] px-3 py-1 rounded-full border border-[#10b981]/20">
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
        </>
      )}

      <NewTripModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        currentUser={user}
        onTripCreated={fetchMyTrips}
      />
    </div>
  );
};

export default Dashboard;