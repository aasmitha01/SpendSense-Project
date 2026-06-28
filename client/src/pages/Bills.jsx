import Sidebar from "../components/Sidebar";
import BillModal from "../components/BillModal";
import { useState, useEffect } from "react";
import api from "../services/api";

function Bills() {
  const [showModal, setShowModal] =
    useState(false);

  const [bills, setBills] = useState([]);

  const fetchBills = async () => {
    try {
      const user = JSON.parse(
        localStorage.getItem("user")
      );

      const res = await api.get(
        `/bills?user_id=${user.id}`
      );

      setBills(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const markPaid = async (id) => {
    try {
      await api.put(
        `/bills/${id}/pay`
      );

      fetchBills();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      <Sidebar />

      <main className="flex-1 overflow-y-auto p-4 md:p-6">

        <div className="flex justify-between items-center mb-6">

          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Bills
            </h1>

            <p className="text-gray-500">
              Track upcoming and paid bills
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg"
          >
            + Add Bill
          </button>

        </div>

        <div className="space-y-4">

          {bills.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow-sm">
              No Bills Found
            </div>
          ) : (
            bills.map((bill) => (
              <div
                key={bill.id}
                className="bg-white rounded-xl p-4 shadow-sm flex justify-between items-center"
              >

                <div>

                  <h2 className="font-semibold">
                    {bill.bill_name}
                  </h2>

                  <p className="text-sm text-gray-500">
                    Due:
                    {" "}
                    {new Date(
                      bill.due_date
                    ).toLocaleDateString()}
                  </p>

                  <p className="text-sm text-gray-400">
                    {bill.recurring
                      ? "Recurring Bill"
                      : "One Time Bill"}
                  </p>

                </div>

                <div className="text-right">

                  <p
                    className={`font-bold ${
                      bill.paid
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    ₹{bill.amount}
                  </p>

                  <span
                    className={`text-sm ${
                      bill.paid
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {bill.paid
                      ? "Paid"
                      : "Pending"}
                  </span>

                  {!bill.paid && (
                    <div>
                      <button
                        onClick={() =>
                          markPaid(bill.id)
                        }
                        className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Mark Paid
                      </button>
                    </div>
                  )}

                </div>

              </div>
            ))
          )}

        </div>

        <BillModal
          isOpen={showModal}
          onClose={() =>
            setShowModal(false)
          }
          fetchBills={fetchBills}
        />

      </main>

    </div>
  );
}

export default Bills;