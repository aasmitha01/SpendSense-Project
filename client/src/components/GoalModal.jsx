import { useState } from "react";
import api from "../services/api";

function GoalModal({
  isOpen,
  onClose,
  fetchGoals,
}) {
  const [formData, setFormData] = useState({
    goal_name: "",
    target_amount: "",
    current_amount: "",
    deadline: "",
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

      await api.post("/goals", {
        user_id: user.id,
        ...formData,
      });

      alert("Goal Added Successfully");

      await fetchGoals();

      setFormData({
        goal_name: "",
        target_amount: "",
        current_amount: "",
        deadline: "",
      });

      onClose();
    } catch (error) {
      console.log(error);
      alert("Failed to Add Goal");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg">

        <h2 className="text-xl font-bold mb-4">
          Add Goal
        </h2>

        <div className="space-y-4">

          <input
            type="text"
            name="goal_name"
            value={formData.goal_name}
            onChange={handleChange}
            placeholder="Goal Name"
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="number"
            name="target_amount"
            value={formData.target_amount}
            onChange={handleChange}
            placeholder="Target Amount"
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="number"
            name="current_amount"
            value={formData.current_amount}
            onChange={handleChange}
            placeholder="Current Amount"
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="date"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
          />

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

export default GoalModal;