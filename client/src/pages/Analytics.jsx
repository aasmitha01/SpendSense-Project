import { useEffect, useState, useCallback } from "react";
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
  CartesianGrid,
  Legend,
} from "recharts";

function Analytics() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");

      if (!user?.id) {
        setTransactions([]);
        return;
      }

      const res = await api.get(`/transactions?user_id=${user.id}`);
      setTransactions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch analytics transactions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const formatAmount = (amount) =>
    Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const savingsRate =
    totalIncome > 0
      ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100)
      : 0;

  const incomeExpenseData = [
    {
      month: "All Transactions",
      income: totalIncome,
      expense: totalExpense,
    },
  ];

  const categoryMap = {};

  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const category = t.category || "Uncategorized";
      categoryMap[category] =
        (categoryMap[category] || 0) + (Number(t.amount) || 0);
    });

  const expenseCategoryData = Object.entries(categoryMap).map(
    ([name, value]) => ({ name, value })
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
    <div className="w-full min-w-0 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          Analytics
        </h1>
        <p className="mt-1 text-gray-500">
          Financial insights and spending trends
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          Loading your financial analytics...
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                Savings Rate
              </p>
              <h2
                className={`mt-2 text-2xl font-bold ${
                  savingsRate >= 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {savingsRate}%
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Based on total recorded income and expenses
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                Total Income
              </p>
              <h2 className="mt-2 text-2xl font-bold text-purple-600">
                ₹{formatAmount(totalIncome)}
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                All recorded income transactions
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                Total Expense
              </p>
              <h2 className="mt-2 text-2xl font-bold text-red-500">
                ₹{formatAmount(totalExpense)}
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                All recorded expense transactions
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Income vs Expense */}
            <section className="min-w-0 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="mb-1 text-lg font-semibold text-gray-900">
                Income vs Expense
              </h2>
              <p className="mb-4 text-sm text-gray-500">
                Comparison of all recorded transactions
              </p>

              <div className="h-72 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={incomeExpenseData}
                    margin={{ top: 10, right: 10, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(value) =>
                        `₹${Number(value).toLocaleString("en-IN")}`
                      }
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={75}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        `₹${formatAmount(value)}`,
                        name === "income" ? "Income" : "Expense",
                      ]}
                    />
                    <Legend />
                    <Bar
                      dataKey="income"
                      name="Income"
                      fill="#8B5CF6"
                      radius={[5, 5, 0, 0]}
                    />
                    <Bar
                      dataKey="expense"
                      name="Expense"
                      fill="#EF4444"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Expense Categories */}
            <section className="min-w-0 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="mb-1 text-lg font-semibold text-gray-900">
                Expense Categories
              </h2>
              <p className="mb-4 text-sm text-gray-500">
                Breakdown of your recorded expenses by category
              </p>

              {expenseCategoryData.length === 0 ? (
                <div className="flex h-72 flex-col items-center justify-center text-center">
                  <div className="mb-3 text-4xl">📊</div>
                  <p className="font-medium text-gray-700">
                    No expense data available
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Add expense transactions to see your category breakdown.
                  </p>
                </div>
              ) : (
                <div className="h-72 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseCategoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius="65%"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        labelLine={false}
                      >
                        {expenseCategoryData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => `₹${formatAmount(value)}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>

          {/* No Transactions */}
          {transactions.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
              <p className="font-medium text-gray-800">
                No transactions found
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Add income and expense transactions to populate your analytics.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Analytics;
