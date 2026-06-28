import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  Wallet,
  Receipt,
  BarChart3,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { User } from "lucide-react";
function Sidebar() {
  const navigate = useNavigate();

const handleLogout = () => {
  localStorage.removeItem("user");
  navigate("/");
};
  
  const menuItems = [
    {
  name: "Profile",
  path: "/profile",
  icon: <User size={18} />,
},
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    {
      name: "Transactions",
      path: "/transactions",
      icon: <ArrowLeftRight size={18} />,
    },
    {
      name: "Goals",
      path: "/goals",
      icon: <Target size={18} />,
    },
    {
      name: "Budgets",
      path: "/budgets",
      icon: <Wallet size={18} />,
    },
    {
      name: "Bills",
      path: "/bills",
      icon: <Receipt size={18} />,
    },
    {
      name: "Analytics",
      path: "/analytics",
      icon: <BarChart3 size={18} />,
    },
  ];

  return (
    <aside className="w-56 bg-white border-r h-screen flex flex-col justify-between">
      <div>
        <div className="p-5 border-b">
          <h1 className="text-2xl font-bold text-purple-600">
            SpendSense
          </h1>
        </div>

        <nav className="p-3">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition ${
                  isActive
                    ? "bg-purple-100 text-purple-600"
                    : "hover:bg-gray-100"
                }`
              }
            >
              {item.icon}
              <span className="text-sm">
                {item.name}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-3 border-t">
        <button
  onClick={handleLogout}
  className="flex items-center gap-3 px-4 py-3 rounded-lg w-full hover:bg-gray-100"
>
  <LogOut size={18} />
  <span className="text-sm">
    Sign Out
  </span>
</button>
      </div>
    </aside>
  );
}

export default Sidebar;