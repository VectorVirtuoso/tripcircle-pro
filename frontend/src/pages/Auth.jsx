import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Map, Lock, Mail, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const { login } = useAuth();
  
  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = isLogin ? "/api/users/login" : "/api/users/signup";
      const payload = isLogin ? { email, password } : { name, email, password };

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      login(data);
      navigate("/dashboard");

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] flex items-center justify-center p-6 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#1e293b] p-10 rounded-3xl shadow-xl dark:shadow-2xl border border-gray-200 dark:border-gray-800 max-w-md w-full"
      >
        <div className="flex justify-center gap-4 mb-8 text-[#10b981]">
          <Map size={32} />
          <Wallet size={32} />
        </div>
        
        <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white text-center">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
          {isLogin ? "Enter your credentials to access your trips." : "Join TripCircle Pro to settle debts intelligently."}
        </p>

        {error && (
          <div className="bg-[#f43f5e]/10 border border-[#f43f5e]/50 text-[#f43f5e] px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#10b981] dark:focus:border-[#10b981] transition-colors"
                  placeholder="Shrey"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-4 text-gray-400 dark:text-gray-500" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl pl-11 pr-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#10b981] dark:focus:border-[#10b981] transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 text-gray-400 dark:text-gray-500" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl pl-11 pr-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#10b981] dark:focus:border-[#10b981] transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full mt-6 flex justify-center items-center gap-2 bg-[#10b981] text-white dark:text-gray-900 font-bold py-3 rounded-xl hover:bg-[#0ea5e9] transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? "Sign In" : "Sign Up")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors cursor-pointer"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;