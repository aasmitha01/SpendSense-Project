
import BillModal from "../components/BillModal";
import { useState, useEffect } from "react";
import api from "../services/api";

function Bills() {
  const [showModal, setShowModal] = useState(false);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBills = async () => {
    try {
      setError("");

      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        setError("Please log in to view your bills.");
        return;
      }

      const user = JSON.parse(storedUser);
      if (!user?.id) {
        setError("User information is missing. Please log in again.");
        return;
      }

      const res = await api.get(
        `/bills?user_id=${encodeURIComponent(user.id)}`
      );

      setBills(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch bills:", err);
      setError(err.response?.data?.message || "Unable to load bills.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const markPaid = async (id) => {
    try {
      setError("");
      await api.put(`/bills/${id}/pay`);
      await fetchBills();
    } catch (err) {
      console.error("Failed to mark bill as paid:", err);
      setError(err.response?.data?.message || "Unable to mark bill as paid.");
    }
  };

  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  const isPaid = (bill) =>
    bill.paid === true ||
    bill.paid === 1 ||
    bill.paid === "1";

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Bills
          </h1>
          <p className="mt-1 text-slate-500">
            Track upcoming and paid bills
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="self-start rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
        >
          + Add Bill
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Bill list */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-xl bg-white p-6 text-slate-500 shadow-sm">
            Loading bills...
          </div>
        ) : bills.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <h2 className="font-semibold text-slate-800">
              No Bills Found
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add a bill to start tracking upcoming payments.
            </p>
          </div>
        ) : (
          bills.map((bill) => {
            const paid = isPaid(bill);

            return (
              <article
                key={bill.id}
                className="flex flex-col justify-between gap-4 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <h2 className="break-words font-semibold text-slate-900">
                    {bill.bill_name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Due:{" "}
                    {bill.due_date
                      ? new Date(bill.due_date).toLocaleDateString("en-IN")
                      : "Date unavailable"}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    {bill.recurring ? "Recurring Bill" : "One-Time Bill"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <div className="sm:text-right">
                    <p
                      className={`font-bold ${
                        paid ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {formatCurrency(bill.amount)}
                    </p>

                    <span
                      className={`text-sm font-medium ${
                        paid ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {paid ? "Paid" : "Pending"}
                    </span>
                  </div>

                  {!paid && (
                    <button
                      type="button"
                      onClick={() => markPaid(bill.id)}
                      className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700"
                    >
                      Mark Paid
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Add bill modal */}
      <BillModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        fetchBills={fetchBills}
      />
    </div>
  );
}

export default Bills;
