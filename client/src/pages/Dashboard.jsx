
import { useEffect, useState } from "react";
import api from "../services/api";

function Dashboard() {
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });

  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [bills, setBills] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        console.error("User not found. Please log in.");
        return;
      }

      const user = JSON.parse(storedUser);

      if (!user?.id) {
        console.error("User ID not found.");
        return;
      }

      const statsRes = await api.get(
        `/transactions/dashboard?user_id=${encodeURIComponent(user.id)}`
      );
      setStats(statsRes.data);

      const transactionRes = await api.get(
        `/transactions?user_id=${encodeURIComponent(user.id)}`
      );
      setTransactions(
        Array.isArray(transactionRes.data)
          ? transactionRes.data.slice(0, 5)
          : []
      );

      const goalsRes = await api.get(
        `/goals?user_id=${encodeURIComponent(user.id)}`
      );
      setGoals(Array.isArray(goalsRes.data) ? goalsRes.data : []);

      const budgetsRes = await api.get(
        `/budgets?user_id=${encodeURIComponent(user.id)}`
      );
      setBudgets(Array.isArray(budgetsRes.data) ? budgetsRes.data : []);

      const billsRes = await api.get(
        `/bills?user_id=${encodeURIComponent(user.id)}`
      );
      setBills(Array.isArray(billsRes.data) ? billsRes.data : []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const pendingBills = bills.filter(
    (bill) => !bill.paid && bill.paid !== 1
  );

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-slate-500">
          Track your income, expenses and savings in real time.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <div className="rounded-xl bg-green-50 p-4 shadow-sm">
          <h3 className="font-semibold text-green-700">Income</h3>
          <p className="mt-2 break-words text-xl font-bold text-slate-900">
            {formatCurrency(stats.totalIncome)}
          </p>
        </div>

        <div className="rounded-xl bg-red-50 p-4 shadow-sm">
          <h3 className="font-semibold text-red-700">Expense</h3>
          <p className="mt-2 break-words text-xl font-bold text-slate-900">
            {formatCurrency(stats.totalExpense)}
          </p>
        </div>

        <div className="rounded-xl bg-purple-50 p-4 shadow-sm">
          <h3 className="font-semibold text-purple-700">Balance</h3>
          <p className="mt-2 break-words text-xl font-bold text-slate-900">
            {formatCurrency(stats.balance)}
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 p-4 shadow-sm">
          <h3 className="font-semibold text-blue-700">Goals</h3>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {goals.length}
          </p>
        </div>

        <div className="rounded-xl bg-yellow-50 p-4 shadow-sm">
          <h3 className="font-semibold text-yellow-700">Budgets</h3>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {budgets.length}
          </p>
        </div>

        <div className="rounded-xl bg-pink-50 p-4 shadow-sm">
          <h3 className="font-semibold text-pink-700">Pending Bills</h3>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {pendingBills.length}
          </p>
        </div>
      </div>

      {/* Recent transactions */}
      <section className="min-w-0 rounded-xl bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Recent Transactions
          </h2>
        </div>

        <div className="space-y-3 p-4">
          {transactions.length === 0 ? (
            <p className="text-slate-500">No Transactions Found</p>
          ) : (
            transactions.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3"
              >
                <div className="min-w-0">
                  <h3 className="break-words font-medium text-slate-900">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {item.transaction_date
                      ? new Date(item.transaction_date).toLocaleDateString(
                          "en-IN"
                        )
                      : "Date unavailable"}
                  </p>
                </div>

                <span
                  className={`shrink-0 font-semibold ${
                    item.type === "income"
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {item.type === "income" ? "+" : "-"}
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Upcoming bills */}
      <section className="min-w-0 rounded-xl bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Upcoming Bills
          </h2>
        </div>

        <div className="space-y-3 p-4">
          {pendingBills.length === 0 ? (
            <p className="text-slate-500">No Pending Bills</p>
          ) : (
            pendingBills.slice(0, 3).map((bill) => (
              <div
                key={bill.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3"
              >
                <div className="min-w-0">
                  <h3 className="break-words font-medium text-slate-900">
                    {bill.bill_name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    Due:{" "}
                    {bill.due_date
                      ? new Date(bill.due_date).toLocaleDateString("en-IN")
                      : "Date unavailable"}
                  </p>
                </div>

                <span className="shrink-0 font-semibold text-red-500">
                  {formatCurrency(bill.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
