import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home'; // <-- Restored your landing page!
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard'; // Make sure the capital "B" matches your actual file name if it is DashBoard.jsx
import TripDetails from './pages/TripDetails';
import TripPlanner from './pages/TripPlanner';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/trip/:id" element={<TripDetails />} />
      <Route path="/planner" element={<TripPlanner />} />
    </Routes>
  );
}

export default App;