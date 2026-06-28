import Sidebar from "../components/Sidebar";
import { useEffect, useState } from "react";
import api from "../services/api";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

function Analytics() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const user = JSON.parse(
        localStorage.getItem("user")
      );

      const res = await api.get(
        `/transactions?user_id=${user.id}`
      );

      setTransactions(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  // Income
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

  // Expense
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

  // Savings Rate
  const savingsRate =
    totalIncome > 0
      ? Math.round(
          ((totalIncome - totalExpense) /
            totalIncome) *
            100
        )
      : 0;

  // Income vs Expense Chart
  const incomeExpenseData = [
    {
      month: "Current",
      income: totalIncome,
      expense: totalExpense,
    },
  ];

  // Expense Categories Pie Chart
  const categoryMap = {};

  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      categoryMap[t.category] =
        (categoryMap[t.category] || 0) +
        Number(t.amount);
    });

  const expenseCategoryData =
    Object.keys(categoryMap).map(
      (key) => ({
        name: key,
        value: categoryMap[key],
      })
    );

  const COLORS = [
    "#8B5CF6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#3B82F6",
    "#EC4899",
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-4 md:p-6">

        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Analytics
        </h1>

        <p className="text-gray-500 mb-6">
          Financial insights and spending trends
        </p>

        {/* Top Cards */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-gray-500">
              Savings Rate
            </p>

            <h2 className="text-2xl font-bold text-green-600">
              {savingsRate}%
            </h2>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-gray-500">
              Total Income
            </p>

            <h2 className="text-2xl font-bold text-purple-600">
              ₹{totalIncome}
            </h2>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-gray-500">
              Total Expense
            </p>

            <h2 className="text-2xl font-bold text-red-500">
              ₹{totalExpense}
            </h2>
          </div>

        </div>

        {/* Charts */}

        <div className="grid md:grid-cols-2 gap-4">

          {/* Income vs Expense */}

          <div className="bg-white rounded-xl p-4 shadow-sm">

            <h2 className="font-semibold mb-4">
              Income vs Expense
            </h2>

            <div className="h-72">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={incomeExpenseData}
                >
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />

                  <Bar
                    dataKey="income"
                    fill="#8B5CF6"
                  />

                  <Bar
                    dataKey="expense"
                    fill="#EF4444"
                  />
                </BarChart>
              </ResponsiveContainer>

            </div>

          </div>

          {/* Expense Categories */}

          <div className="bg-white rounded-xl p-4 shadow-sm">

            <h2 className="font-semibold mb-4">
              Expense Categories
            </h2>

            <div className="h-72">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>

                  <Pie
                    data={expenseCategoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label
                  >
                    {expenseCategoryData.map(
                      (entry, index) => (
                        <Cell
                          key={index}
                          fill={
                            COLORS[
                              index %
                                COLORS.length
                            ]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip />

                </PieChart>
              </ResponsiveContainer>

            </div>

          </div>

        </div>

      </main>
    </div>
  );
}

export default Analytics;