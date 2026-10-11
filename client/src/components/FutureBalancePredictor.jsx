
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw,
  AlertTriangle,
  CalendarDays,
} from "lucide-react";
import api from "../services/api";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

function FutureBalancePredictor() {
  const [currentBalance, setCurrentBalance] = useState("0");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadForecast = async (event) => {
    if (event) event.preventDefault();

    const balance = Number(currentBalance);

    if (
      currentBalance.trim() === "" ||
      !Number.isFinite(balance) ||
      Math.abs(balance) > 1000000000000
    ) {
      setError("Enter a valid current balance.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        throw new Error("Please log in to view your forecast.");
      }

      const user = JSON.parse(storedUser);

      if (!user?.id) {
        throw new Error("Your user ID was not found. Please log in again.");
      }

      const response = await api.get(
        `/forecast?user_id=${encodeURIComponent(user.id)}&current_balance=${encodeURIComponent(balance)}`
      );

      setData(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to calculate your forecast."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load uses a zero balance until the user enters their actual balance.
    // No forecast request is sent automatically.
  }, []);

  const outlook =
    data?.outlook === "improving"
      ? {
          label: "Positive cash-flow trend",
          icon: TrendingUp,
          color: "text-emerald-700",
          bg: "bg-emerald-50",
        }
      : data?.outlook === "declining"
        ? {
            label: "Negative cash-flow trend",
            icon: TrendingDown,
            color: "text-rose-700",
            bg: "bg-rose-50",
          }
        : {
            label: "Mostly stable cash flow",
            icon: Wallet,
            color: "text-slate-700",
            bg: "bg-slate-100",
          };

  const OutlookIcon = outlook.icon;

  return (
    <section className="space-y-6">
      <form
        onSubmit={loadForecast}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100">
            <Wallet className="h-5 w-5 text-violet-700" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Enter your current balance
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Enter the combined balance you want to forecast. Your balance is
              used as the starting point and is not saved to the database.
            </p>
          </div>
        </div>

        <label className="mt-5 block text-sm font-medium text-slate-700">
          Current balance (₹)
          <input
            type="number"
            step="0.01"
            value={currentBalance}
            onChange={(event) => setCurrentBalance(event.target.value)}
            placeholder="e.g. 25000"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-lg outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Calculating..." : "Predict future balance"}
        </button>

        {error && (
          <p className="mt-3 text-sm text-rose-600" role="alert">
            {error}
          </p>
        )}
      </form>

      {!data && !loading && !error && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-3 font-semibold text-slate-900">
            Your forecast starts here
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Enter your current balance and generate a 30-, 60-, and 90-day
            projection.
          </p>
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Analyzing your recent cash flow...
        </div>
      )}

      {data && !loading && (
        <>
          <div className={`rounded-2xl p-5 ${outlook.bg}`}>
            <div className={`flex items-center gap-2 font-semibold ${outlook.color}`}>
              <OutlookIcon className="h-5 w-5" />
              {outlook.label}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your estimated monthly net cash flow is{" "}
              <strong>{currency(data.averageMonthlyNet)}</strong>, based on the
              three most recently completed calendar months.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.forecast.map((point) => (
              <div
                key={point.days}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm text-slate-500">
                  {point.days === 0 ? "Current balance" : `In ${point.days} days`}
                </p>
                <p className="mt-2 break-words text-2xl font-bold text-slate-900">
                  {currency(point.projectedBalance)}
                </p>
                <p
                  className={`mt-2 text-sm ${
                    point.projectedChange > 0
                      ? "text-emerald-700"
                      : point.projectedChange < 0
                        ? "text-rose-700"
                        : "text-slate-500"
                  }`}
                >
                  {point.projectedChange > 0 ? "+" : ""}
                  {currency(point.projectedChange)} estimated change
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Projected Balance Trend
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Estimated balance if your recent average cash flow continues.
            </p>

            <div className="mt-6 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.forecast}
                  margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis
                    width={80}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) =>
                      value >= 1000 || value <= -1000
                        ? `₹${(value / 1000).toFixed(0)}k`
                        : `₹${value}`
                    }
                  />
                  <Tooltip
                    formatter={(value) => [currency(value), "Projected balance"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="projectedBalance"
                    name="Projected balance"
                    stroke="#7c3aed"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {data.warnings?.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-center gap-2 font-semibold text-amber-900">
                <AlertTriangle className="h-5 w-5" />
                Forecast notes
              </div>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-amber-900">
                {data.warnings.map((warning, index) => (
                  <li key={`${index}-${warning}`}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">
              Historical monthly cash flow
            </h2>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-3 pr-4 font-medium">Month</th>
                    <th className="py-3 pr-4 text-right font-medium">Income</th>
                    <th className="py-3 pr-4 text-right font-medium">Expenses</th>
                    <th className="py-3 text-right font-medium">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {data.history.map((month) => (
                    <tr key={month.yearMonth} className="border-b border-slate-100">
                      <td className="py-3 pr-4 text-slate-700">{month.month}</td>
                      <td className="py-3 pr-4 text-right text-emerald-700">
                        {currency(month.income)}
                      </td>
                      <td className="py-3 pr-4 text-right text-rose-700">
                        {currency(month.expenses)}
                      </td>
                      <td className="py-3 text-right font-medium text-slate-900">
                        {currency(month.net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs leading-5 text-slate-400">
            {data.methodology}
          </p>
        </>
      )}
    </section>
  );
}

export default FutureBalancePredictor;
