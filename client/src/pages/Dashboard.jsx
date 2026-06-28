import Sidebar from "../components/Sidebar";
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
      const user = JSON.parse(
        localStorage.getItem("user")
      );

      const statsRes = await api.get(
        `/transactions/dashboard?user_id=${user.id}`
      );

      setStats(statsRes.data);

      const transactionRes = await api.get(
        `/transactions?user_id=${user.id}`
      );

      setTransactions(
        transactionRes.data.slice(0, 5)
      );

      const goalsRes = await api.get(
        `/goals?user_id=${user.id}`
      );

      setGoals(goalsRes.data);

      const budgetsRes = await api.get(
        `/budgets?user_id=${user.id}`
      );

      setBudgets(budgetsRes.data);

      const billsRes = await api.get(
        `/bills?user_id=${user.id}`
      );

      setBills(billsRes.data);

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      <Sidebar />

      <main className="flex-1 overflow-y-auto p-4 md:p-6">

        <h1 className="text-2xl md:text-3xl font-bold">
          Dashboard
        </h1>

        <p className="text-gray-500 mt-1 mb-6">
          Track your income, expenses and savings in real time.
        </p>

        {/* Summary Cards */}

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">

          <div className="bg-green-50 p-4 rounded-xl shadow-sm">
            <h3 className="font-semibold text-green-700">
              Income
            </h3>

            <p className="text-xl font-bold mt-2">
              ₹{stats.totalIncome}
            </p>
          </div>

          <div className="bg-red-50 p-4 rounded-xl shadow-sm">
            <h3 className="font-semibold text-red-700">
              Expense
            </h3>

            <p className="text-xl font-bold mt-2">
              ₹{stats.totalExpense}
            </p>
          </div>

          <div className="bg-purple-50 p-4 rounded-xl shadow-sm">
            <h3 className="font-semibold text-purple-700">
              Balance
            </h3>

            <p className="text-xl font-bold mt-2">
              ₹{stats.balance}
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl shadow-sm">
            <h3 className="font-semibold text-blue-700">
              Goals
            </h3>

            <p className="text-xl font-bold mt-2">
              {goals.length}
            </p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-xl shadow-sm">
            <h3 className="font-semibold text-yellow-700">
              Budgets
            </h3>

            <p className="text-xl font-bold mt-2">
              {budgets.length}
            </p>
          </div>

          <div className="bg-pink-50 p-4 rounded-xl shadow-sm">
            <h3 className="font-semibold text-pink-700">
              Pending Bills
            </h3>

            <p className="text-xl font-bold mt-2">
              {
                bills.filter(
                  (bill) => !bill.paid
                ).length
              }
            </p>
          </div>

        </div>

        {/* Recent Transactions */}

        <div className="bg-white rounded-xl shadow-sm mt-6">

          <div className="border-b p-4">
            <h2 className="text-xl font-semibold">
              Recent Transactions
            </h2>
          </div>

          <div className="p-4 space-y-3">

            {transactions.length === 0 ? (
              <p className="text-gray-500">
                No Transactions Found
              </p>
            ) : (
              transactions.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 rounded-lg p-3 flex justify-between items-center"
                >

                  <div>
                    <h3 className="font-medium">
                      {item.title}
                    </h3>

                    <p className="text-gray-500 text-sm">
                      {new Date(
                        item.transaction_date
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <span
                    className={`font-semibold ${
                      item.type === "income"
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {item.type === "income"
                      ? "+"
                      : "-"}
                    ₹{item.amount}
                  </span>

                </div>
              ))
            )}

          </div>

        </div>

        {/* Upcoming Bills */}

        <div className="bg-white rounded-xl shadow-sm mt-6">

          <div className="border-b p-4">
            <h2 className="text-xl font-semibold">
              Upcoming Bills
            </h2>
          </div>

          <div className="p-4 space-y-3">

            {bills
              .filter(
                (bill) => !bill.paid
              )
              .slice(0, 3)
              .map((bill) => (
                <div
                  key={bill.id}
                  className="bg-gray-50 rounded-lg p-3 flex justify-between items-center"
                >

                  <div>
                    <h3 className="font-medium">
                      {bill.bill_name}
                    </h3>

                    <p className="text-sm text-gray-500">
                      Due:
                      {" "}
                      {new Date(
                        bill.due_date
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <span className="text-red-500 font-semibold">
                    ₹{bill.amount}
                  </span>

                </div>
              ))}

            {bills.filter(
              (bill) => !bill.paid
            ).length === 0 && (
              <p className="text-gray-500">
                No Pending Bills
              </p>
            )}

          </div>

        </div>

      </main>

    </div>
  );
}

export default Dashboard;