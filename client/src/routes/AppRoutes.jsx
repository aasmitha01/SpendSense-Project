import { Routes, Route } from "react-router-dom";
import Profile from "../pages/Profile";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Transactions from "../pages/Transactions";
import Goals from "../pages/Goals";
import Budgets from "../pages/Budgets";
import Bills from "../pages/Bills";
import Analytics from "../pages/Analytics";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/transactions" element={<Transactions />} />
      <Route path="/goals" element={<Goals />} />
      <Route path="/budgets" element={<Budgets />} />
      <Route path="/bills" element={<Bills />} />
      <Route path="/analytics" element={<Analytics />} />
    </Routes>
  );
}

export default AppRoutes;