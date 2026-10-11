
import { NavLink, useNavigate } from "react-router-dom";
import {
  UserRound,
  LayoutDashboard,
  ArrowLeftRight,
  BrainCircuit,
  Target,
  Trophy,
  Wallet,
  TrendingUp,
  Receipt,
  BarChart3,
  LogOut,
  ScanLine,
} from "lucide-react";

import PredictiveAlertBell from "./PredictiveAlertBell";

function Sidebar() {
  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Transactions", path: "/transactions", icon: ArrowLeftRight },
    { name: "Intelligence Center", path: "/intelligence", icon: BrainCircuit },
    { name: "Goals", path: "/goals", icon: Target },
    { name: "Challenges", path: "/challenges", icon: Trophy },
    { name: "Budgets", path: "/budgets", icon: Wallet },
    { name: "Future Balance", path: "/future-balance", icon: TrendingUp },
    { name: "Bills", path: "/bills", icon: Receipt },
    { name: "Receipt Scanner", path: "/receipt-scanner", icon: ScanLine },
    { name: "Analytics", path: "/analytics", icon: BarChart3 },
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <>
      {/* Fixed sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-slate-200 bg-white shadow-sm">
        {/* Logo */}
        <div className="shrink-0 border-b border-slate-100 px-5 py-6">
          <h1 className="text-2xl font-bold tracking-tight text-violet-600">
            SpendSense
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Personal Finance
          </p>
        </div>

        {/* Scrollable navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${
                    isActive
                      ? "bg-violet-100 font-semibold text-violet-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-violet-600"
                  }`
                }
              >
                <Icon size={19} className="shrink-0" />
                <span className="text-sm">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sign out stays at the bottom */}
        <div className="shrink-0 border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-slate-600 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut size={19} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Top bar */}
      <header className="fixed left-56 right-0 top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            SpendSense
          </h2>
          <p className="text-xs text-slate-500">
            Manage your money smarter
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <PredictiveAlertBell />
          </div>

          <button
            type="button"
            onClick={() => navigate("/profile")}
            title="Open Profile"
            aria-label="Open Profile"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
          >
            <UserRound size={21} />
          </button>
        </div>
      </header>
    </>
  );
}

export default Sidebar;
