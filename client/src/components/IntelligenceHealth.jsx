
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  RefreshCw,
} from "lucide-react";
import api from "../services/api";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const factorIcons = {
  savings: Wallet,
  budget: Activity,
  goals: Target,
};

function ScoreRing({ score }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const progress = score === null ? 0 : (score / 100) * circumference;

  return (
    <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-slate-200"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          className={
            score === null
              ? "text-slate-300"
              : score >= 80
                ? "text-emerald-500"
                : score >= 60
                  ? "text-blue-500"
                  : score >= 40
                    ? "text-amber-500"
                    : "text-rose-500"
          }
        />
      </svg>

      <div className="absolute text-center">
        <div className="text-3xl font-bold text-slate-900">
          {score === null ? "—" : score}
        </div>
        <div className="text-xs text-slate-500">out of 100</div>
      </div>
    </div>
  );
}

function IntelligenceHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHealth = async () => {
    setLoading(true);
    setError("");

    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        throw new Error("Please log in to view your financial health.");
      }

      const user = JSON.parse(storedUser);

      if (!user?.id) {
        throw new Error("Your user ID was not found. Please log in again.");
      }

      const response = await api.get(
        `/intelligence/health?user_id=${encodeURIComponent(user.id)}`
      );

      setData(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load financial health data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  if (loading) {
    return (
      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3 text-slate-600">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Calculating your financial health...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-8 rounded-2xl border border-rose-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">
          Financial Health & Spending Trends
        </h2>
        <p className="mt-2 text-sm text-rose-600">{error}</p>
        <button
          onClick={loadHealth}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Try again
        </button>
      </section>
    );
  }

  const health = data?.health;
  const trend = data?.trend || [];

  const bestMonth = trend.reduce(
    (best, month) => (!best || month.net > best.net ? month : best),
    null
  );

  return (
    <div className="mb-8 space-y-6">
      {/* Financial Health Score */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-violet-600" />
              <h2 className="text-xl font-bold text-slate-900">
                Financial Health Score
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              An estimate based on your saved financial data.
            </p>
          </div>

          <button
            onClick={loadHealth}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <ScoreRing score={health?.score ?? null} />

          <div className="flex-1 text-center sm:text-left">
            <p className="text-lg font-semibold text-slate-900">
              {health?.label || "Not enough data"}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {health?.score === null
                ? "Add income transactions, budgets, or savings goals to calculate your score."
                : "Use the breakdown below to understand which financial habits are influencing your score."}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Based on {health?.availableFactors ?? 0} of{" "}
              {health?.totalFactors ?? 3} available factors.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(health?.factors || []).map((factor) => {
            const Icon = factorIcons[factor.key] || Activity;
            const percent =
              factor.maxScore > 0
                ? (factor.score / factor.maxScore) * 100
                : 0;

            return (
              <div
                key={factor.key}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-violet-600" />
                  <span className="text-sm font-semibold text-slate-800">
                    {factor.label}
                  </span>
                </div>

                <div className="mt-3 flex items-end justify-between">
                  <span className="text-2xl font-bold text-slate-900">
                    {factor.score}
                  </span>
                  <span className="text-xs text-slate-500">
                    of {factor.maxScore} points
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  {factor.detail}
                </p>
              </div>
            );
          })}
        </div>

        <p className="mt-5 text-xs leading-5 text-slate-400">
          {data?.methodology}
        </p>
      </section>

      {/* Six-month trend chart */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-violet-600" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Six-Month Spending Trend
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Compare income and expenses month by month.
            </p>
          </div>
        </div>

        {trend.length > 0 ? (
          <>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trend}
                  margin={{ top: 10, right: 8, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis
                    width={75}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) =>
                      value >= 1000
                        ? `₹${(value / 1000).toFixed(0)}k`
                        : `₹${value}`
                    }
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      currency(value),
                      name === "income" ? "Income" : "Expenses",
                    ]}
                  />
                  <Legend />
                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="#10b981"
                    radius={[5, 5, 0, 0]}
                  />
                  <Bar
                    dataKey="expense"
                    name="Expenses"
                    fill="#f97316"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-sm text-emerald-800">
                  <TrendingUp className="h-4 w-4" />
                  Best net-savings month in this period
                </div>
                <p className="mt-2 text-xl font-bold text-emerald-900">
                  {bestMonth?.month || "—"}
                </p>
                <p className="mt-1 text-sm text-emerald-800">
                  {bestMonth ? currency(bestMonth.net) : "No data yet"}
                </p>
              </div>

              <div className="rounded-xl bg-orange-50 p-4">
                <div className="flex items-center gap-2 text-sm text-orange-800">
                  <TrendingDown className="h-4 w-4" />
                  Latest month's net result
                </div>
                <p className="mt-2 text-xl font-bold text-orange-900">
                  {trend.length
                    ? currency(trend[trend.length - 1].net)
                    : "—"}
                </p>
                <p className="mt-1 text-sm text-orange-800">
                  Income minus expenses
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className="py-10 text-center text-sm text-slate-500">
            Add transactions to see your six-month trend.
          </p>
        )}
      </section>
    </div>
  );
}

export default IntelligenceHealth;
