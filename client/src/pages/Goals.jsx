import Sidebar from "../components/Sidebar";
import GoalModal from "../components/GoalModal";
import { useState, useEffect } from "react";
import api from "../services/api";

function Goals() {
  const [showModal, setShowModal] =
    useState(false);

  const [goals, setGoals] = useState([]);

  const fetchGoals = async () => {
    try {
      const user = JSON.parse(
        localStorage.getItem("user")
      );

      const res = await api.get(
        `/goals?user_id=${user.id}`
      );

      setGoals(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      <Sidebar />

      <main className="flex-1 overflow-y-auto p-4 md:p-6">

        <div className="flex justify-between items-center mb-6">

          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Goals
            </h1>

            <p className="text-gray-500">
              Track your savings goals
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg"
          >
            + Add Goal
          </button>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {goals.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow-sm">
              No Goals Found
            </div>
          ) : (
            goals.map((goal) => {
              const percentage = Math.min(
                (
                  (goal.current_amount /
                    goal.target_amount) *
                  100
                ).toFixed(0),
                100
              );

              return (
                <div
                  key={goal.id}
                  className="bg-white rounded-xl p-4 shadow-sm"
                >

                  <div className="flex justify-between">

                    <h2 className="font-semibold">
                      {goal.goal_name}
                    </h2>

                    <span className="text-purple-600 font-medium">
                      {percentage}%
                    </span>

                  </div>

                  <p className="text-gray-500 text-sm mt-2">
                    ₹{goal.current_amount} /
                    ₹{goal.target_amount}
                  </p>

                  <div className="w-full bg-gray-200 rounded-full h-3 mt-4">

                    <div
                      className="bg-purple-600 h-3 rounded-full"
                      style={{
                        width: `${percentage}%`,
                      }}
                    ></div>

                  </div>

                  <p className="text-sm text-gray-500 mt-3">
                    Deadline:
                    {" "}
                    {new Date(
                      goal.deadline
                    ).toLocaleDateString()}
                  </p>

                  {percentage >= 100 && (
                    <p className="text-green-600 font-medium mt-2">
                      🎉 Goal Completed
                    </p>
                  )}

                </div>
              );
            })
          )}

        </div>

        <GoalModal
          isOpen={showModal}
          onClose={() =>
            setShowModal(false)
          }
          fetchGoals={fetchGoals}
        />

      </main>

    </div>
  );
}

export default Goals;