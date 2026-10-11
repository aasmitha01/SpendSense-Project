
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Wallet,
} from "lucide-react";
import api from "../services/api";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const styles = {
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
    border: "border-amber-200",
    label: "Review",
    badge: "bg-amber-100 text-amber-800",
  },
  success: {
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
    border: "border-emerald-200",
    label: "Positive",
    badge: "bg-emerald-100 text-emerald-800",
  },
  info: {
    icon: Lightbulb,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    border: "border-blue-200",
    label: "Insight",
    badge: "bg-blue-100 text-blue-800",
  },
};

function RecommendationCard({ item }) {
  const style = styles[item.type] || styles.info;
  const Icon = style.icon;

  return (
    <article className={`rounded-xl border ${style.border} bg-white p-5`}>
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.iconBg}`}
        >
          <Icon className={`h-5 w-5 ${style.iconColor}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900">{item.title}</h3>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${style.badge}`}
            >
              {style.label}
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {item.message}
          </p>

          <div className="mt-4 rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Suggested action
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              {item.recommendation}
            </p>
          </div>

          {item.difference !== undefined && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              {item.difference > 0 ? (
                <ArrowUpRight className="h-4 w-4 text-rose-500" />
              ) : item.difference < 0 ? (
                <ArrowDownRight className="h-4 w-4 text-emerald-600" />
              ) : null}

              <span className="font-medium text-slate-700">
                Change: {item.difference > 0 ? "+" : ""}
                {formatCurrency(item.difference)}
              </span>

              {item.changePercent !== null &&
                item.changePercent !== undefined && (
                  <span className="text-slate-500">
                    ({item.changePercent > 0 ? "+" : ""}
                    {item.changePercent.toFixed(1)}%)
                  </span>
                )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function SmartSpendingSuggestions() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecommendations = async () => {
    setLoading(true);
    setError("");

    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        throw new Error("Please log in to view your spending suggestions.");
      }

      const user = JSON.parse(storedUser);

      if (!user?.id) {
        throw new Error("Your user ID was not found. Please log in again.");
      }

      const response = await api.get(
        `/intelligence/recommendations?user_id=${encodeURIComponent(user.id)}`
      );

      setData(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load spending recommendations."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
              <Sparkles className="h-5 w-5 text-violet-700" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Smart Spending Suggestions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Practical recommendations from your transactions.
              </p>
            </div>
          </div>

          {data?.period && (
            <p className="mt-3 text-xs leading-5 text-slate-500">
              {data.period.comparison}
            </p>
          )}
        </div>

        <button
          onClick={loadRecommendations}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-500">
          Analyzing your spending patterns...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-white p-5">
          <p className="text-sm text-rose-600">{error}</p>
          <button
            onClick={loadRecommendations}
            className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Wallet className="h-4 w-4" />
                Income so far
              </div>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {formatCurrency(data?.summary?.currentIncome)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <ArrowUpRight className="h-4 w-4" />
                Expenses so far
              </div>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {formatCurrency(data?.summary?.currentExpense)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Lightbulb className="h-4 w-4" />
                Categories tracked
              </div>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {data?.summary?.categoryCount ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Sparkles className="h-4 w-4" />
                Suggestions
              </div>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {data?.recommendations?.length ?? 0}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {(data?.recommendations || []).map((item) => (
              <RecommendationCard key={item.id} item={item} />
            ))}
          </div>

          {(data?.topCategories || []).length > 0 && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900">
                Your highest expense categories
              </h3>

              <div className="mt-4 space-y-4">
                {data.topCategories.map((item) => {
                  const total = Number(data.summary?.currentExpense) || 0;
                  const percentage =
                    total > 0
                      ? Math.min(100, (item.currentAmount / total) * 100)
                      : 0;

                  return (
                    <div key={item.category}>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="font-medium text-slate-700">
                          {item.category}
                        </span>
                        <span className="text-slate-600">
                          {formatCurrency(item.currentAmount)}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-violet-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p className="mt-5 text-xs leading-5 text-slate-400">
            {data?.methodology}
          </p>
        </>
      )}
    </section>
  );
}

export default SmartSpendingSuggestions;
