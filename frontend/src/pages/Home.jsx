import { motion } from "framer-motion";
import { Wallet, Map } from "lucide-react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-[#1e293b] p-10 rounded-3xl shadow-2xl border border-gray-800 max-w-md w-full text-center"
      >
        <div className="flex justify-center gap-4 mb-6 text-[#10b981]">
          <Map size={40} />
          <Wallet size={40} />
        </div>
        
        <h1 className="text-4xl font-bold mb-4 text-white">
          TripCircle <span className="text-[#10b981]">Pro</span>
        </h1>
        
        <p className="text-gray-400 mb-8 leading-relaxed">
          Intelligent group trip planning. <br/> Zero expense confusion.
        </p>
        
        <Link to="/login">
          <button className="bg-[#10b981] text-gray-900 font-semibold py-3 px-8 rounded-full hover:bg-[#0ea5e9] hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer">
            Get Started
          </button>
        </Link>
      </motion.div>
    </div>
  );
};

export default Home;