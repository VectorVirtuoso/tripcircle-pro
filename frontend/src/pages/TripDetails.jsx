import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Receipt, ArrowRight, Activity, Sun, Moon } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import AddExpenseModal from "../components/AddExpenseModal";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { io } from "socket.io-client";
import { useTheme } from "../context/ThemeContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const TripDetails = () => {
  const { id } = useParams(); // Using real ID from the URL now!
  const { theme, toggleTheme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState({});
  const [settlements, setSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  const fetchTripData = async () => {
    try {
      // 1. Get the specific trip details using the ID from the URL
      const tripRes = await fetch("http://localhost:5000/api/trips");
      const tripsData = await tripRes.json();
      const currentTrip = tripsData.find(t => t._id === id) || tripsData[tripsData.length - 1]; // Fallback
      
      if (currentTrip) {
        setTrip(currentTrip);

        const expenseRes = await fetch(`http://localhost:5000/api/expenses/${currentTrip._id}`);
        const expenseData = await expenseRes.json();
        setExpenses(expenseData);

        const settleRes = await fetch(`http://localhost:5000/api/settlements/${currentTrip._id}`);
        const settleData = await settleRes.json();
        setBalances(settleData.netBalances);
        setSettlements(settleData.optimizedTransactions);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTripData();

    if (socket && trip) {
      socket.emit("join_trip", trip._id);
      socket.on("update_trip_data", () => {
        console.log("Live update received! Fetching fresh data...");
        fetchTripData();
      });
    }

    return () => {
      if (socket) socket.off("update_trip_data");
    };
  }, [socket, trip?._id, id]);

  if (isLoading) return <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-white flex items-center justify-center">Loading Data...</div>;
  if (!trip) return <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-white flex items-center justify-center">No trip found!</div>;

  const totalSpend = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const getUserName = (id) => trip.members.find(m => m._id === id)?.name || 'Unknown';

  const chartData = {
    labels: trip.members.map(m => m.name),
    datasets: [
      {
        data: trip.members.map(m => balances[m._id] || 0),
        backgroundColor: trip.members.map(m => 
          (balances[m._id] || 0) >= 0 ? '#10b981' : '#f43f5e'
        ),
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { display: false },
      x: { 
        grid: { display: false }, 
        ticks: { 
          color: theme === 'dark' ? '#94a3b8' : '#64748b', // Dynamic chart text!
          font: { family: 'Plus Jakarta Sans', size: 14 } 
        } 
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => ` ₹${Math.abs(context.raw)} ${context.raw >= 0 ? 'Owed' : 'Owes'}`
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-white p-8 transition-colors duration-300">
      <header className="mb-8 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-6">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 bg-white dark:bg-[#1e293b] rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-gray-200 dark:border-transparent shadow-sm dark:shadow-none">
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{trip.name}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {trip.members.map(m => m.name).join(", ")} • {trip.members.length} Members
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:text-[#10b981] dark:text-gray-400 dark:hover:text-[#10b981] bg-white dark:bg-[#1e293b] rounded-full transition-colors cursor-pointer border border-gray-200 dark:border-transparent shadow-sm dark:shadow-none"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#10b981] text-white dark:text-gray-900 font-semibold py-2 px-5 rounded-full hover:bg-[#0ea5e9] hover:text-white transition-all duration-300 cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.3)]"
          >
            <Plus size={18} />
            <span>Add Expense</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col justify-center shadow-sm dark:shadow-none">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Total Group Spend</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white mb-4">₹{totalSpend.toLocaleString()}</p>
          <div className="flex items-center gap-2 text-sm text-[#10b981]">
            <Activity size={16} />
            <span>Algorithm Synced</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 lg:col-span-2 flex flex-col shadow-sm dark:shadow-none">
          <h2 className="text-gray-500 dark:text-gray-400 text-sm mb-4">Net Balances (Who owes vs. Who is owed)</h2>
          <div className="h-40 w-full relative">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 dark:border-gray-800 pb-2 flex items-center justify-between text-gray-900 dark:text-white">
            <span>How to Settle Up</span>
            <span className="text-xs bg-[#10b981]/10 dark:bg-[#10b981]/20 text-[#10b981] px-3 py-1 rounded-full border border-[#10b981]/30">
              Min-Cash Flow Active
            </span>
          </h2>
          
          {settlements.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-500 bg-white dark:bg-[#1e293b]/30 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 shadow-sm dark:shadow-none">
              Everyone is settled up!
            </div>
          ) : (
            <div className="space-y-3">
              {settlements.map((tx, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-gray-50 dark:bg-gradient-to-r dark:from-[#1e293b] dark:to-[#0f172a] p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex justify-between items-center shadow-sm dark:shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-[#f43f5e]">{getUserName(tx.from)}</span>
                    <ArrowRight className="text-gray-400 dark:text-gray-500" size={18} />
                    <span className="font-semibold text-[#10b981]">{getUserName(tx.to)}</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">₹{tx.amount.toLocaleString()}</div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 dark:border-gray-800 pb-2 text-gray-900 dark:text-white">Recent Expenses</h2>
          
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-500 bg-white dark:bg-[#1e293b]/30 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 shadow-sm dark:shadow-none">
              <Receipt size={40} className="mb-3 opacity-50 text-gray-400" />
              <p>No expenses yet.</p>
            </div>
          ) : (
            <div className="space-y-3 h-80 overflow-y-auto pr-2 custom-scrollbar">
              {expenses.map((expense) => (
                <div key={expense._id} className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex justify-between items-center shadow-sm dark:shadow-none">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-200">{expense.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Paid by <span className="text-[#10b981] font-medium">{expense.paidBy?.name}</span>
                    </p>
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white">₹{expense.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddExpenseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        trip={trip}
        onExpenseAdded={fetchTripData} 
        socket={socket}
      />
    </div>
  );
};

export default TripDetails;