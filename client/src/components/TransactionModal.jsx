import { useState, useEffect } from "react";
import api from "../services/api";

function TransactionModal({
  isOpen,
  onClose,
  fetchTransactions,
  transaction,
}) {
  const [formData, setFormData] = useState({
    title: "",
    type: "expense",
    category: "",
    amount: "",
    description: "",
    transaction_date: "",
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        title: transaction.title || "",
        type: transaction.type || "expense",
        category: transaction.category || "",
        amount: transaction.amount || "",
        description: transaction.description || "",
        transaction_date:
          transaction.transaction_date?.split("T")[0] || "",
      });
    } else {
      setFormData({
        title: "",
        type: "expense",
        category: "",
        amount: "",
        description: "",
        transaction_date: "",
      });
    }
  }, [transaction]);

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

      if (!user) {
        alert("Please login first");
        return;
      }

      if (transaction) {
        await api.put(
          `/transactions/${transaction.id}`,
          formData
        );

        alert("Transaction Updated Successfully");
      } else {
        await api.post("/transactions", {
          ...formData,
          user_id: user.id,
        });

        alert("Transaction Added Successfully");
      }

      await fetchTransactions();

      onClose();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Operation Failed"
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-lg">

        <h2 className="text-xl font-bold mb-4">
          {transaction
            ? "Edit Transaction"
            : "Add Transaction"}
        </h2>

        <div className="space-y-4">

          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Transaction Title"
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

          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="Category"
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="date"
            name="transaction_date"
            value={formData.transaction_date}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
          />

          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Description"
            rows="3"
            className="w-full border p-3 rounded-lg"
          />

        </div>

        <div className="flex justify-end gap-3 mt-6">

          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg"
          >
            {transaction ? "Update" : "Save"}
          </button>

        </div>

      </div>
    </div>
  );
}

export default TransactionModal;