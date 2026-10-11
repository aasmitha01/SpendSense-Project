
import { Routes, Route } from "react-router-dom";

import AppLayout from "../components/AppLayout";

import Profile from "../pages/Profile";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Transactions from "../pages/Transactions";
import Goals from "../pages/Goals";
import Budgets from "../pages/Budgets";
import Bills from "../pages/Bills";
import Analytics from "../pages/Analytics";
import Intelligence from "../pages/Intelligence";
import Challenges from "../pages/Challenges";
import FutureBalance from "../pages/FutureBalance";
import ReceiptScannerPage from "../pages/ReceiptScannerPage";

function AppRoutes() {
  return (
    <Routes>
      {/* Authentication pages without the dashboard layout */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Shared layout for the application */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/future-balance" element={<FutureBalance />} />
        <Route path="/receipt-scanner" element={<ReceiptScannerPage />} />
        <Route path="/intelligence" element={<Intelligence />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
