import { useState } from "react";
import api from "../services/api";

function BudgetModal({
  isOpen,
  onClose,
  fetchBudgets,
}) {
  const [formData, setFormData] = useState({
    category: "",
    limit_amount: "",
    period: "Monthly",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      const user = JSON.parse(
        localStorage.getItem("user")
      );

      await api.post("/budgets", {
        user_id: user.id,
        ...formData,
      });

      alert("Budget Added Successfully");

      await fetchBudgets();

      setFormData({
        category: "",
        limit_amount: "",
        period: "Monthly",
      });

      onClose();
    } catch (error) {
      console.log(error);
      alert("Failed to add budget");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg">

        <h2 className="text-xl font-bold mb-4">
          Add Budget
        </h2>

        <div className="space-y-4">

          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="Category"
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="number"
            name="limit_amount"
            value={formData.limit_amount}
            onChange={handleChange}
            placeholder="Budget Limit"
            className="w-full border p-3 rounded-lg"
          />

          <select
            name="period"
            value={formData.period}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
          >
            <option>Monthly</option>
            <option>Yearly</option>
          </select>

        </div>

        <div className="flex justify-end gap-3 mt-6">

          <button
            onClick={onClose}
            className="border px-4 py-2 rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg"
          >
            Save
          </button>

        </div>

      </div>
    </div>
  );
}

export default BudgetModal;