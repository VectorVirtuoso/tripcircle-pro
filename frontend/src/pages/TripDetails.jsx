import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Receipt, ArrowRight, Activity, Sun, Moon, ListTodo, CheckSquare, Square, UserPlus, X, ImagePlus, UploadCloud, Loader2, FileDown } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import AddExpenseModal from "../components/AddExpenseModal";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { io } from "socket.io-client";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext"; 

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const TripDetails = () => {
  const { id } = useParams(); 
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth(); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trip, setTrip] = useState(null);
  
  // NEW: Pagination State for Expenses
  const [expenses, setExpenses] = useState([]);
  const [expensePage, setExpensePage] = useState(1);
  const [hasMoreExpenses, setHasMoreExpenses] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [balances, setBalances] = useState({});
  const [settlements, setSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  
  const [newItem, setNewItem] = useState("");

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");

  const [isUploadingVault, setIsUploadingVault] = useState(false);
  const vaultInputRef = useRef(null);

  const [isDownloading, setIsDownloading] = useState(false);

  const [totalSpend, setTotalSpend] = useState(0); // NEW

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  const fetchTripData = async () => {
    try {
      const tripRes = await fetch("http://localhost:5000/api/trips");
      const tripsData = await tripRes.json();
      const currentTrip = tripsData.find(t => t._id === id) || tripsData[tripsData.length - 1]; 
      
      if (currentTrip) {
        setTrip(currentTrip);

        // UPDATED: Fetch Page 1 of expenses
        const expenseRes = await fetch(`http://localhost:5000/api/expenses/${currentTrip._id}?page=1&limit=10`);
        const expenseData = await expenseRes.json();
        
        // We now extract the array from the new paginated object!
        setExpenses(expenseData.expenses || []);
        setHasMoreExpenses(expenseData.hasMore);
        setExpensePage(1);
        setTotalSpend(expenseData.totalSpend || 0);

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

  // NEW: Infinite Scroll Fetch Function
  const loadMoreExpenses = async () => {
    if (isLoadingMore || !hasMoreExpenses) return;
    setIsLoadingMore(true);
    
    try {
      const nextPage = expensePage + 1;
      const res = await fetch(`http://localhost:5000/api/expenses/${trip._id}?page=${nextPage}&limit=10`);
      const data = await res.json();
      
      // Append the new 10 items to the existing array
      setExpenses(prev => [...prev, ...(data.expenses || [])]);
      setHasMoreExpenses(data.hasMore);
      setExpensePage(nextPage);
    } catch (error) {
      console.error("Failed to load more expenses:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchTripData();

    if (socket && trip) {
      socket.emit("join_trip", trip._id);
      socket.on("update_trip_data", () => {
        fetchTripData(); 
      });
    }

    return () => {
      if (socket) socket.off("update_trip_data");
    };
  }, [socket, trip?._id, id]);

  const isAdmin = trip && user && (
    (trip.admin && trip.admin === user._id) || 
    (!trip.admin && trip.members.length > 0 && trip.members[0]._id === user._id)
  );

  const handleInviteMember = async (e) => {
    e.preventDefault();
    setInviteError("");
    try {
      const res = await fetch(`http://localhost:5000/api/trips/${trip._id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: user._id, newMemberEmail: inviteEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to invite member");
      setInviteEmail("");
      setIsInviteModalOpen(false);
      fetchTripData(); 
      if (socket) socket.emit("expense_added", trip._id); 
    } catch (error) {
      setInviteError(error.message);
    }
  };

  const handleAddPackingItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    try {
      const res = await fetch(`http://localhost:5000/api/trips/${trip._id}/packing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: newItem })
      });
      if (res.ok) {
        setNewItem("");
        fetchTripData();
        if (socket) socket.emit("expense_added", trip._id); 
      }
    } catch (error) {
      console.error("Failed to add item:", error);
    }
  };

  const handleTogglePackingItem = async (itemId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/trips/${trip._id}/packing/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id }) 
      });
      if (res.ok) {
        fetchTripData();
        if (socket) socket.emit("expense_added", trip._id); 
      }
    } catch (error) {
      console.error("Failed to toggle item:", error);
    }
  };

  const handleVaultUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingVault(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", user._id);
    try {
      const res = await fetch(`http://localhost:5000/api/trips/${trip._id}/vault`, { method: "POST", body: formData });
      if (res.ok) {
        fetchTripData(); 
        if (socket) socket.emit("expense_added", trip._id); 
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Vault Upload Error:", error);
      alert("Failed to upload memory.");
    } finally {
      setIsUploadingVault(false);
      e.target.value = null; 
    }
  };

  const handleDownloadReport = async () => {
    try {
      setIsDownloading(true);
      const res = await fetch(`http://localhost:5000/api/trips/${trip._id}/download`);
      if (!res.ok) throw new Error("Failed to generate report");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${trip.name.replace(/\s+/g, '_')}_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download the report.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-white flex items-center justify-center">Loading Data...</div>;
  if (!trip) return <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-white flex items-center justify-center">No trip found!</div>;

  const getUserName = (id) => trip.members.find(m => m._id === id)?.name || 'Unknown';

  const chartData = {
    labels: trip.members.map(m => m.name),
    datasets: [{
      data: trip.members.map(m => balances[m._id] || 0),
      backgroundColor: trip.members.map(m => (balances[m._id] || 0) >= 0 ? '#10b981' : '#f43f5e'),
      borderRadius: 8, borderSkipped: false,
    }]
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    scales: { y: { display: false }, x: { grid: { display: false }, ticks: { color: theme === 'dark' ? '#94a3b8' : '#64748b', font: { family: 'Plus Jakarta Sans', size: 14 } } } },
    plugins: { tooltip: { callbacks: { label: (context) => ` ₹${Math.abs(context.raw)} ${context.raw >= 0 ? 'Owed' : 'Owes'}` } } }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-white p-8 transition-colors duration-300 relative">
      <header className="mb-8 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-6">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 bg-white dark:bg-[#1e293b] rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-gray-200 dark:border-transparent shadow-sm dark:shadow-none">
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{trip.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {trip.members.map(m => m.name).join(", ")} • {trip.members.length} Members
              </p>
              {isAdmin && (
                <button onClick={() => setIsInviteModalOpen(true)} className="flex items-center gap-1 bg-[#0ea5e9]/10 text-[#0ea5e9] hover:bg-[#0ea5e9]/20 hover:text-[#0284c7] px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer">
                  <UserPlus size={14} /> Invite
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 text-gray-500 hover:text-[#10b981] dark:text-gray-400 dark:hover:text-[#10b981] bg-white dark:bg-[#1e293b] rounded-full transition-colors cursor-pointer border border-gray-200 dark:border-transparent shadow-sm dark:shadow-none" title="Toggle Theme">
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <button onClick={handleDownloadReport} disabled={isDownloading} className="flex items-center gap-2 bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 rounded-full border border-gray-200 dark:border-gray-700 hover:border-[#8b5cf6] hover:text-[#8b5cf6] dark:hover:border-[#8b5cf6] dark:hover:text-[#8b5cf6] transition-all duration-300 cursor-pointer shadow-sm dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed">
            {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
            <span className="hidden sm:inline">{isDownloading ? "Generating..." : "Export PDF"}</span>
          </button>

          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-[#10b981] text-white dark:text-gray-900 font-semibold py-2 px-5 rounded-full hover:bg-[#0ea5e9] hover:text-white transition-all duration-300 cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            <Plus size={18} />
            <span className="hidden sm:inline">Add Expense</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Column 1: Settle Up */}
        <div>
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 dark:border-gray-800 pb-2 flex items-center justify-between text-gray-900 dark:text-white">
            <span>How to Settle Up</span>
            <span className="text-xs bg-[#10b981]/10 dark:bg-[#10b981]/20 text-[#10b981] px-3 py-1 rounded-full border border-[#10b981]/30">Min-Cash Flow Active</span>
          </h2>
          {settlements.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-500 bg-white dark:bg-[#1e293b]/30 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 shadow-sm dark:shadow-none">
              Everyone is settled up!
            </div>
          ) : (
            <div className="space-y-3">
              {settlements.map((tx, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-gray-50 dark:bg-gradient-to-r dark:from-[#1e293b] dark:to-[#0f172a] p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex justify-between items-center shadow-sm dark:shadow-lg">
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

        {/* Column 2: Recent Expenses with INFINITE SCROLL */}
        <div>
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 dark:border-gray-800 pb-2 text-gray-900 dark:text-white">Recent Expenses</h2>
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-500 bg-white dark:bg-[#1e293b]/30 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 shadow-sm dark:shadow-none">
              <Receipt size={40} className="mb-3 opacity-50 text-gray-400" />
              <p>No expenses yet.</p>
            </div>
          ) : (
            <div 
              className="space-y-3 h-80 overflow-y-auto pr-2 custom-scrollbar"
              onScroll={(e) => {
                const { scrollTop, clientHeight, scrollHeight } = e.target;
                // If user scrolls to the bottom (within 10 pixels), trigger loadMore!
                if (scrollHeight - scrollTop <= clientHeight + 10) {
                  loadMoreExpenses();
                }
              }}
            >
              {expenses.map((expense) => (
                <div key={expense._id} className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex justify-between items-center shadow-sm dark:shadow-none">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-200">{expense.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Paid by <span className="text-[#10b981] font-medium">{expense.paidBy?.name}</span></p>
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white">₹{expense.amount.toLocaleString()}</div>
                </div>
              ))}
              
              {/* Spinner shows up at the bottom while loading more */}
              {isLoadingMore && (
                <div className="flex justify-center py-4">
                  <Loader2 className="animate-spin text-[#10b981]" size={24} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Column 3: Live Packing List */}
        <div>
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 dark:border-gray-800 pb-2 flex items-center gap-2 text-gray-900 dark:text-white">
            <ListTodo size={20} className="text-[#0ea5e9]" />
            <span>Group Packing List</span>
          </h2>
          <div className="bg-white dark:bg-[#1e293b] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none h-80 flex flex-col">
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 mb-4">
              {(!trip.packingList || trip.packingList.length === 0) ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                  <p className="text-sm">Nothing added yet.</p>
                  <p className="text-xs mt-1">Don't forget the sunscreen!</p>
                </div>
              ) : (
                trip.packingList.map(item => (
                  <div key={item._id} onClick={() => handleTogglePackingItem(item._id)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#0f172a] transition-colors cursor-pointer group border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                    {item.isPacked ? <CheckSquare className="text-[#10b981] shrink-0" size={20} /> : <Square className="text-gray-400 group-hover:text-gray-500 shrink-0" size={20} />}
                    <span className={`text-sm flex-1 transition-all ${item.isPacked ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-200'}`}>{item.item}</span>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleAddPackingItem} className="relative mt-auto shrink-0">
              <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Add an item..." className="w-full bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl pl-4 pr-10 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#0ea5e9] transition-colors" />
              <button type="submit" disabled={!newItem.trim()} className="absolute right-2 top-2 text-white bg-[#0ea5e9] hover:bg-[#0284c7] disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 transition-colors p-1.5 rounded-lg cursor-pointer disabled:cursor-not-allowed">
                <Plus size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* THE TRIP VAULT GALLERY */}
      <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <ImagePlus className="text-[#8b5cf6]" size={28} />
            Trip Vault
          </h2>

          <input type="file" accept="image/*,application/pdf" ref={vaultInputRef} className="hidden" onChange={handleVaultUpload} />
          <button onClick={() => vaultInputRef.current.click()} disabled={isUploadingVault} className="flex items-center gap-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-semibold py-2 px-5 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed">
            {isUploadingVault ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />}
            <span>{isUploadingVault ? 'Uploading...' : 'Upload Memory'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {(!trip.vault || trip.vault.length === 0) ? (
            <div className="col-span-full py-16 text-center bg-white dark:bg-[#1e293b]/30 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800">
              <ImagePlus size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">No memories uploaded yet.</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Upload photos, receipts, or tickets!</p>
            </div>
          ) : (
            trip.vault.map((file, idx) => (
              <a key={idx} href={file.imageUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 group">
                {file.imageUrl.endsWith('.pdf') ? (
                  <div className="w-full h-40 flex flex-col items-center justify-center text-gray-500 hover:text-[#8b5cf6] transition-colors">
                    <Receipt size={40} className="mb-2" />
                    <span className="text-xs font-semibold">View PDF Document</span>
                  </div>
                ) : (
                  <img src={file.imageUrl} alt="Trip memory" className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500" />
                )}
              </a>
            ))
          )}
        </div>
      </div>

      <AddExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} trip={trip} onExpenseAdded={fetchTripData} socket={socket} />

      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><UserPlus size={20} className="text-[#0ea5e9]" /> Invite Friend</h2>
                <button onClick={() => {setIsInviteModalOpen(false); setInviteError("");}} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer bg-gray-100 dark:bg-gray-800 p-1.5 rounded-full"><X size={18} /></button>
              </div>
              <form onSubmit={handleInviteMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Friend's Email Address</label>
                  <input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="e.g., friend@example.com" className="w-full bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#0ea5e9] transition-colors" />
                </div>
                {inviteError && <p className="text-sm text-[#f43f5e] font-medium">{inviteError}</p>}
                <button type="submit" className="w-full flex justify-center items-center gap-2 bg-[#0ea5e9] text-white font-bold py-3 rounded-xl hover:bg-[#0284c7] transition-all duration-300 shadow-md cursor-pointer">Send Invite</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TripDetails;