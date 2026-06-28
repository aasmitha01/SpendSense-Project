import Sidebar from "../components/Sidebar";
import TransactionModal from "../components/TransactionModal";
import { useState, useEffect } from "react";
import api from "../services/api";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
function Transactions() {
  const [showModal, setShowModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

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

  useEffect(() => {
    fetchTransactions();
  }, []);

  const deleteTransaction = async (id) => {
    const confirmDelete = window.confirm(
      "Delete this transaction?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(
        `/transactions/${id}`
      );

      fetchTransactions();
    } catch (error) {
      console.log(error);
      alert("Failed to delete transaction");
    }
  };
  const exportCSV = () => {
  const csvRows = [
    [
      "Title",
      "Type",
      "Category",
      "Amount",
      "Date",
    ],
  ];

  transactions.forEach((t) => {
    csvRows.push([
      t.title,
      t.type,
      t.category,
      t.amount,
      t.transaction_date,
    ]);
  });

  const csvContent =
    csvRows
      .map((row) => row.join(","))
      .join("\n");

  const blob = new Blob(
    [csvContent],
    {
      type: "text/csv;charset=utf-8;",
    }
  );

  saveAs(
    blob,
    "transactions.csv"
  );
};
const exportPDF = () => {
  const doc = new jsPDF();

  doc.text(
    "SpendSense Transactions",
    14,
    15
  );

  autoTable(doc, {
    head: [
      [
        "Title",
        "Type",
        "Category",
        "Amount",
      ],
    ],
    body: transactions.map(
      (t) => [
        t.title,
        t.type,
        t.category,
        t.amount,
      ]
    ),
  });

  doc.save(
    "transactions.pdf"
  );
};
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-4 md:p-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Transactions
            </h1>

            <p className="text-gray-500">
              Manage your income and expenses
            </p>
          </div>

          <button
  onClick={() => {
    setSelectedTransaction(null);
    setShowModal(true);
  }}
  className="bg-purple-600 text-white px-4 py-2 rounded-lg"
>
  + Add Transaction
</button>
          <button
            onClick={exportCSV}
            className="ml-2 bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            Export CSV
          </button>
          <button
  onClick={exportPDF}
  className="bg-red-600 text-white px-4 py-2 rounded-lg"
>
  Export PDF
</button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <select className="border rounded-lg p-2">
            <option>All Transactions</option>
            <option>Income</option>
            <option>Expense</option>
          </select>
        </div>

        {/* Transaction List */}
        <div className="space-y-4">

          {transactions.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow-sm text-center text-gray-500">
              No transactions found
            </div>
          ) : (
            transactions.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold">
                    {item.title}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {item.type} • {item.category}
                  </p>

                  <p className="text-xs text-gray-400">
                    {new Date(
                      item.transaction_date
                    ).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right">
                  <h3
                    className={`font-bold ${
                      item.type === "income"
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {item.type === "income"
                      ? "+"
                      : "-"} ₹{item.amount}
                  </h3>
                  <button
  onClick={() => {
    setSelectedTransaction(item);
    setShowModal(true);
  }}
  className="mt-2 mr-2 bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200"
>
  Edit
</button>
                  <button
                    onClick={() =>
                      deleteTransaction(item.id)
                    }
                    className="mt-2 bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>

              </div>
            ))
          )}

        </div>

        <TransactionModal
  isOpen={showModal}
  onClose={() => {
    setShowModal(false);
    setSelectedTransaction(null);
  }}
  fetchTransactions={fetchTransactions}
  transaction={selectedTransaction}
/>
      </main>
    </div>
  );
}

export default Transactions;