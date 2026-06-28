import Sidebar from "../components/Sidebar";
import BudgetModal from "../components/BudgetModal";
import { useState, useEffect } from "react";
import api from "../services/api";

function Budgets() {
  const [showModal, setShowModal] =
    useState(false);

  const [budgets, setBudgets] = useState([]);

  const fetchBudgets = async () => {
    try {
      const user = JSON.parse(
        localStorage.getItem("user")
      );

      const res = await api.get(
        `/budgets?user_id=${user.id}`
      );

      setBudgets(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      <Sidebar />

      <main className="flex-1 overflow-y-auto p-4 md:p-6">

        <div className="flex justify-between items-center mb-6">

          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Budgets
            </h1>

            <p className="text-gray-500">
              Manage your spending limits
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg"
          >
            + Add Budget
          </button>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {budgets.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow-sm">
              No Budgets Found
            </div>
          ) : (
            budgets.map((budget) => (
              <div
                key={budget.id}
                className="bg-white p-4 rounded-xl shadow-sm"
              >

                <div className="flex justify-between">
                  <h2 className="font-semibold">
                    {budget.category}
                  </h2>

                  <span className="text-purple-600">
                    {budget.period}
                  </span>
                </div>

                <p className="text-sm text-gray-500 mt-2">
                  Budget Limit:
                  ₹{budget.limit_amount}
                </p>

                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-3">

                    <div
                      className="bg-purple-600 h-3 rounded-full"
                      style={{
                        width: "100%",
                      }}
                    ></div>

                  </div>
                </div>

              </div>
            ))
          )}

        </div>

        <BudgetModal
          isOpen={showModal}
          onClose={() =>
            setShowModal(false)
          }
          fetchBudgets={fetchBudgets}
        />

      </main>

    </div>
  );
}

export default Budgets;