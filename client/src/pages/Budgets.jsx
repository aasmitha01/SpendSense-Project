import { useState, useEffect, useCallback } from "react";
import BudgetModal from "../components/BudgetModal";
import api from "../services/api";

function Budgets() {
  const [showModal, setShowModal] = useState(false);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBudgets = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");

      if (!user?.id) {
        setBudgets([]);
        return;
      }

      const res = await api.get(`/budgets?user_id=${user.id}`);
      setBudgets(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch budgets:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const formatAmount = (amount) =>
    Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Budgets
          </h1>
          <p className="mt-1 text-gray-500">
            Manage your spending limits and stay on track.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-4 py-2.5 font-medium text-white transition hover:bg-purple-700"
        >
          + Add Budget
        </button>
      </div>

      {/* Budget List */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Your Budgets
          </h2>

          <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
            {budgets.length} {budgets.length === 1 ? "Budget" : "Budgets"}
          </span>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
            Loading your budgets...
          </div>
        ) : budgets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <div className="mb-3 text-4xl">💰</div>

            <h3 className="text-lg font-semibold text-gray-800">
              No Budgets Found
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Create a budget to set a spending limit for a category.
            </p>

            <button
              onClick={() => setShowModal(true)}
              className="mt-4 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700"
            >
              Create Your First Budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {budgets.map((budget) => {
              const limit = Number(budget.limit_amount) || 0;

              return (
                <div
                  key={budget.id}
                  className="min-w-0 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="break-words font-semibold text-gray-900">
                        {budget.category || "Uncategorized"}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Spending limit
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-purple-50 px-2.5 py-1 text-sm font-medium capitalize text-purple-700">
                      {budget.period || "Monthly"}
                    </span>
                  </div>

                  <div className="mt-5">
                    <p className="text-sm text-gray-500">Budget Limit</p>

                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      ₹{formatAmount(limit)}
                    </p>
                  </div>

                  <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full w-full rounded-full bg-purple-600"
                      aria-label="Budget limit indicator"
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                    <span className="text-gray-500">Budget period</span>
                    <span className="font-medium capitalize text-gray-700">
                      {budget.period || "Monthly"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Add Budget Modal */}
      <BudgetModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        fetchBudgets={fetchBudgets}
      />
    </div>
  );
}

export default Budgets;