import { useState, useEffect, useCallback } from "react";
import GoalModal from "../components/GoalModal";
import GoalAchievementPlanner from "../components/GoalAchievementPlanner";
import api from "../services/api";

function Goals() {
  const [showModal, setShowModal] = useState(false);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");

      if (!user?.id) {
        setGoals([]);
        return;
      }

      const res = await api.get(`/goals?user_id=${user.id}`);
      setGoals(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch goals:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

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
            Goals
          </h1>
          <p className="mt-1 text-gray-500">
            Track your savings goals and celebrate your progress.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-4 py-2.5 font-medium text-white transition hover:bg-purple-700"
        >
          + Add Goal
        </button>
      </div>

      {/* Goal Achievement Planner */}
      <GoalAchievementPlanner />

      {/* Goals List */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            My Savings Goals
          </h2>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
            {goals.length} {goals.length === 1 ? "Goal" : "Goals"}
          </span>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
            Loading your goals...
          </div>
        ) : goals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <div className="mb-3 text-4xl">🎯</div>
            <h3 className="text-lg font-semibold text-gray-800">
              No Goals Found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Create your first savings goal and start tracking your progress.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700"
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {goals.map((goal) => {
              const currentAmount = Number(goal.current_amount) || 0;
              const targetAmount = Number(goal.target_amount) || 0;

              const percentage =
                targetAmount > 0
                  ? Math.min(
                      Math.max(
                        Math.round((currentAmount / targetAmount) * 100),
                        0
                      ),
                      100
                    )
                  : 0;

              const completed = targetAmount > 0 && currentAmount >= targetAmount;

              return (
                <div
                  key={goal.id}
                  className="min-w-0 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="break-words font-semibold text-gray-900">
                        {goal.goal_name || "Savings Goal"}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {completed ? "Goal achieved!" : "Keep saving!"}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-purple-50 px-2.5 py-1 text-sm font-semibold text-purple-700">
                      {percentage}%
                    </span>
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-xs text-gray-500">Saved so far</p>
                      <p className="mt-1 text-xl font-bold text-gray-900">
                        ₹{formatAmount(currentAmount)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-500">Target amount</p>
                      <p className="mt-1 font-semibold text-gray-700">
                        ₹{formatAmount(targetAmount)}
                      </p>
                    </div>
                  </div>

                  <div
                    className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-100"
                    role="progressbar"
                    aria-valuenow={percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${goal.goal_name || "Savings goal"} progress`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        completed ? "bg-green-500" : "bg-purple-600"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 text-sm">
                    <span className="text-gray-500">Deadline</span>
                    <span className="text-right font-medium text-gray-700">
                      {goal.deadline
                        ? new Date(goal.deadline).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Not set"}
                    </span>
                  </div>

                  {completed && (
                    <div className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
                      🎉 Congratulations! Goal completed.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Add Goal Modal */}
      <GoalModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        fetchGoals={fetchGoals}
      />
    </div>
  );
}

export default Goals;