import { useState } from "react";
import api from "../services/api";

function BillModal({
  isOpen,
  onClose,
  fetchBills,
}) {
  const [formData, setFormData] = useState({
    bill_name: "",
    amount: "",
    due_date: "",
    recurring: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } =
      e.target;

    setFormData({
      ...formData,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    });
  };

  const handleSubmit = async () => {
    try {
      const user = JSON.parse(
        localStorage.getItem("user")
      );

      if (!user) {
        alert("Please login first");
        return;
      }

      await api.post("/bills", {
        user_id: user.id,
        bill_name: formData.bill_name,
        amount: formData.amount,
        due_date: formData.due_date,
        recurring: formData.recurring,
      });

      alert("Bill Added Successfully");

      await fetchBills();

      setFormData({
        bill_name: "",
        amount: "",
        due_date: "",
        recurring: false,
      });

      onClose();
    } catch (error) {
      console.log(error);

      alert(
        error.response?.data?.message ||
          "Failed to Add Bill"
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

      <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg">

        <h2 className="text-xl font-bold mb-4">
          Add Bill
        </h2>

        <div className="space-y-4">

          <input
            type="text"
            name="bill_name"
            value={formData.bill_name}
            onChange={handleChange}
            placeholder="Bill Name"
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Amount"
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="date"
            name="due_date"
            value={formData.due_date}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
          />

          <label className="flex items-center gap-2">

            <input
              type="checkbox"
              name="recurring"
              checked={formData.recurring}
              onChange={handleChange}
            />

            Recurring Bill

          </label>

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
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Save
          </button>

        </div>

      </div>

    </div>
  );
}

export default BillModal;