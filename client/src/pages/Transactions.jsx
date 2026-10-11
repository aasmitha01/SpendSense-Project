
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
  const [filter, setFilter] = useState("all");

  const fetchTransactions = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;

      const user = JSON.parse(storedUser);
      if (!user?.id) return;

      const res = await api.get(
        `/transactions?user_id=${encodeURIComponent(user.id)}`
      );

      setTransactions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const deleteTransaction = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;

    try {
      await api.delete(`/transactions/${id}`);
      await fetchTransactions();
    } catch (error) {
      console.error(error);
      alert("Failed to delete transaction.");
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    if (filter === "all") return true;
    return transaction.type?.toLowerCase() === filter;
  });

  const exportCSV = () => {
    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csvRows = [
      ["Title", "Type", "Category", "Amount", "Date"],
      ...filteredTransactions.map((transaction) => [
        transaction.title,
        transaction.type,
        transaction.category,
        transaction.amount,
        transaction.transaction_date,
      ]),
    ];

    const csvContent = csvRows
      .map((row) => row.map(escapeCSV).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    saveAs(blob, "transactions.csv");
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("SpendSense Transactions", 14, 15);

    autoTable(doc, {
      startY: 24,
      head: [["Title", "Type", "Category", "Amount", "Date"]],
      body: filteredTransactions.map((transaction) => [
        transaction.title || "",
        transaction.type || "",
        transaction.category || "",
        `Rs. ${transaction.amount ?? 0}`,
        transaction.transaction_date
          ? new Date(transaction.transaction_date).toLocaleDateString("en-IN")
          : "",
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [109, 40, 217] },
    });

    doc.save("transactions.pdf");
  };

  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Page heading and actions */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Transactions
          </h1>
          <p className="mt-1 text-slate-500">
            Manage your income and expenses
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedTransaction(null);
              setShowModal(true);
            }}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            + Add Transaction
          </button>

          <button
            type="button"
            onClick={exportCSV}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Export CSV
          </button>

          <button
            type="button"
            onClick={exportPDF}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Transaction type filter */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <label
          htmlFor="transaction-filter"
          className="mr-3 text-sm font-medium text-slate-700"
        >
          Filter:
        </label>

        <select
          id="transaction-filter"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white p-2 text-sm outline-none focus:border-violet-500"
        >
          <option value="all">All Transactions</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <span className="ml-3 text-sm text-slate-500">
          {filteredTransactions.length} transaction
          {filteredTransactions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Transaction list */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="font-medium text-slate-700">
              No transactions found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Add a transaction or choose another filter.
            </p>
          </div>
        ) : (
          filteredTransactions.map((item) => (
            <article
              key={item.id}
              className="flex flex-col justify-between gap-4 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center"
            >
              <div className="min-w-0">
                <h3 className="break-words font-semibold text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-1 text-sm capitalize text-slate-500">
                  {item.type} • {item.category || "Uncategorized"}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {item.transaction_date
                    ? new Date(item.transaction_date).toLocaleDateString(
                        "en-IN"
                      )
                    : "Date unavailable"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span
                  className={`mr-2 font-bold ${
                    item.type === "income"
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {item.type === "income" ? "+" : "-"}
                  {formatCurrency(item.amount)}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedTransaction(item);
                    setShowModal(true);
                  }}
                  className="rounded-lg bg-blue-100 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-200"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => deleteTransaction(item.id)}
                  className="rounded-lg bg-red-100 px-3 py-1.5 text-sm text-red-700 hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Add/edit transaction modal */}
      <TransactionModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedTransaction(null);
        }}
        fetchTransactions={fetchTransactions}
        transaction={selectedTransaction}
      />
    </div>
  );
}

export default Transactions;
