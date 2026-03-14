import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, Wallet, Sparkles, Download, RefreshCw, ArrowLeft, Sun, Moon, Map } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const TripPlanner = () => {
  const { theme, toggleTheme } = useTheme();
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState("");
  const [budget, setBudget] = useState("Medium");
  
  const [isLoading, setIsLoading] = useState(false);
  const [itineraryData, setItineraryData] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setItineraryData(null);

    try {
      const response = await fetch("http://localhost:5000/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, duration, budget })
      });

      if (!response.ok) throw new Error("Failed to generate itinerary");
      
      const data = await response.json();
      setItineraryData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // THE NATIVE BROWSER PDF FIX
  const downloadPDF = () => {
    const originalTheme = document.documentElement.classList.contains('dark');
    
    // 1. Force light mode so it looks great on paper
    if (originalTheme) document.documentElement.classList.remove('dark');
    
    // 2. Wait a split second for colors to update, then trigger native print
    setTimeout(() => {
      window.print(); 
      // 3. The moment the print dialog closes, instantly restore Dark Mode
      if (originalTheme) document.documentElement.classList.add('dark');
    }, 150);
  };

  return (
    // Added print:bg-white to force a clean background
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-white p-8 transition-colors duration-300 print:p-0 print:bg-white">
      
      {/* Added print:hidden to hide header in PDF */}
      <header className="mb-12 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 bg-white dark:bg-[#1e293b] rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-gray-200 dark:border-transparent shadow-sm dark:shadow-none">
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="text-[#10b981]" size={28} /> AI Trip Planner
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Let Gemini build your perfect itinerary.</p>
          </div>
        </div>
        
        <button 
          onClick={toggleTheme}
          className="p-2 text-gray-500 hover:text-[#10b981] dark:text-gray-400 dark:hover:text-[#10b981] bg-white dark:bg-[#1e293b] rounded-full transition-colors cursor-pointer border border-gray-200 dark:border-transparent shadow-sm dark:shadow-none"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {/* Added print:block to stack layout on paper */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
        
        {/* LEFT COLUMN: THE FORM (Hidden in PDF!) */}
        <div className="lg:col-span-1 print:hidden">
          <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-800 sticky top-8">
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Trip Details</h2>
            <form onSubmit={handleGenerate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destination</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3 text-gray-400" size={18} />
                  <input 
                    type="text" required value={destination} onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g., Goa, India" 
                    className="w-full bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl pl-11 pr-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#10b981] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (Days)</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-3 text-gray-400" size={18} />
                  <input 
                    type="number" required min="1" max="14" value={duration} onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g., 3" 
                    className="w-full bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl pl-11 pr-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#10b981] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Budget Level</label>
                <div className="relative">
                  <Wallet className="absolute left-4 top-3 text-gray-400" size={18} />
                  <select 
                    value={budget} onChange={(e) => setBudget(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl pl-11 pr-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#10b981] transition-colors appearance-none"
                  >
                    <option value="Low">Low (Backpacker)</option>
                    <option value="Medium">Medium (Standard)</option>
                    <option value="High">High (Luxury)</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" disabled={isLoading}
                className="w-full mt-4 flex justify-center items-center gap-2 bg-[#10b981] text-white dark:text-gray-900 font-bold py-3 rounded-xl hover:bg-[#0ea5e9] transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-70 cursor-pointer"
              >
                {isLoading ? (
                  <><RefreshCw className="animate-spin" size={20} /> Generating...</>
                ) : (
                  <><Sparkles size={20} /> Plan My Trip</>
                )}
              </button>
            </form>
            {error && <p className="mt-4 text-sm text-[#f43f5e]">{error}</p>}
          </div>
        </div>

        {/* RIGHT COLUMN: THE RESULT */}
        {/* Added print:w-full so the timeline takes the whole page in the PDF */}
        <div className="lg:col-span-2 print:w-full">
          {!itineraryData && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1e293b]/50 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 print:hidden">
              <Map size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
              <h2 className="text-xl font-semibold text-gray-500 dark:text-gray-400">Ready to explore?</h2>
              <p className="text-gray-400 dark:text-gray-500 mt-2 text-center max-w-sm">Enter your destination and budget on the left, and let our AI craft your perfect daily itinerary.</p>
            </div>
          )}

          {isLoading && (
            <div className="h-full flex flex-col items-center justify-center py-32 print:hidden">
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-t-4 border-[#10b981] border-solid rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-r-4 border-[#0ea5e9] border-solid rounded-full animate-spin direction-reverse"></div>
                <Sparkles className="absolute inset-0 m-auto text-[#10b981] animate-pulse" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Consulting the Locals...</h2>
              <p className="text-gray-500 dark:text-gray-400">Gemini is finding the best spots for your budget.</p>
            </div>
          )}

          {itineraryData && !isLoading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              
              {/* Actions Header (Hidden in PDF!) */}
              <div className="flex justify-end gap-4 print:hidden">
                <button onClick={() => setItineraryData(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer">
                  <RefreshCw size={16} /> Reset
                </button>
                <button onClick={downloadPDF} className="flex items-center gap-2 bg-[#0ea5e9] text-white px-4 py-2 rounded-xl hover:bg-[#0284c7] transition-colors shadow-md cursor-pointer font-medium">
                  <Download size={18} /> Download PDF
                </button>
              </div>

              {/* PDF Container */}
              {/* Added print:shadow-none and print:border-none so it looks clean on paper */}
              <div className="bg-white dark:bg-[#1e293b] p-8 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 print:shadow-none print:border-none print:p-0">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
                  <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
                    {itineraryData.tripDetails.destination}
                  </h1>
                  <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1"><Calendar size={16} className="text-[#10b981]" /> {itineraryData.tripDetails.duration} Days</span>
                    <span className="flex items-center gap-1"><Wallet size={16} className="text-[#0ea5e9]" /> {itineraryData.tripDetails.budget} Budget</span>
                  </div>
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-[#0f172a] rounded-2xl border border-gray-200 dark:border-gray-700 inline-block">
                    <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">Estimated Total Cost</p>
                    <p className="text-2xl font-bold text-[#10b981]">{itineraryData.totalEstimatedCost}</p>
                  </div>
                </div>

                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 dark:before:via-gray-700 before:to-transparent print:before:hidden">
                  {itineraryData.itinerary.map((day, idx) => (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active print:block print:mb-6">
                      
                      {/* Circle Number */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-[#1e293b] bg-[#10b981] text-gray-900 font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 print:hidden">
                        {day.day}
                      </div>
                      
                      {/* Content Card */}
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-gray-50 dark:bg-[#0f172a] p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm print:w-full print:bg-white print:border-gray-300 print:mb-4 print:break-inside-avoid">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white print:text-gray-900">
                            <span className="hidden print:inline mr-2 text-[#10b981]">Day {day.day}:</span>
                            {day.theme}
                          </h3>
                          <span className="text-xs font-bold text-[#0ea5e9] bg-[#0ea5e9]/10 px-2 py-1 rounded-lg shrink-0 ml-2">{day.dailyCost}</span>
                        </div>
                        
                        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 print:text-gray-700">
                          <div><strong className="text-gray-900 dark:text-white print:text-black">Morning:</strong> {day.morning}</div>
                          <div><strong className="text-gray-900 dark:text-white print:text-black">Afternoon:</strong> {day.afternoon}</div>
                          <div><strong className="text-gray-900 dark:text-white print:text-black">Evening:</strong> {day.evening}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripPlanner;