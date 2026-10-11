
import { useEffect, useState } from "react";
import {
  Target,
  CalendarDays,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Wallet,
} from "lucide-react";
import api from "../services/api";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const statusStyles = {
  completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-800",
    icon: CheckCircle2,
  },
  on_track: {
    label: "On track",
    className: "bg-blue-100 text-blue-800",
    icon: TrendingUp,
  },
  needs_attention: {
    label: "Needs attention",
    className: "bg-amber-100 text-amber-800",
    icon: AlertTriangle,
  },
  overdue: {
    label: "Overdue",
    className: "bg-rose-100 text-rose-800",
    icon: Clock,
  },
  no_deadline: {
    label: "No deadline",
    className: "bg-slate-100 text-slate-700",
    icon: CalendarDays,
  },
};

function GoalPlanCard({ goal }) {
  const status = statusStyles[goal.status] || statusStyles.needs_attention;
  const StatusIcon = status.icon;

  const deadlineText = goal.deadline
    ? new Date(`${goal.deadline}T00:00:00`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "No deadline set";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100">
            <Target className="h-5 w-5 text-violet-700" />
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">
              {goal.goalName}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Deadline: {deadlineText}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.className}`}
        >
          <StatusIcon className="h-3.5 w-3.5" />
          {status.label}
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Already saved</p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {currency(goal.currentAmount)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-slate-500">Target amount</p>
          <p className="mt-1 text-lg font-semibold text-slate-800">
            {currency(goal.targetAmount)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-slate-600">Goal progress</span>
          <span className="font-semibold text-violet-700">
            {goal.progress.toFixed(1)}%
          </span>
        </div>

        <div
          className="h-2.5 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-label={`${goal.goalName} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={goal.progress}
        >
          <div
            className="h-full rounded-full bg-violet-600 transition-all duration-500"
            style={{ width: `${goal.progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-violet-50 p-3">
          <p className="text-xs leading-5 text-violet-700">
            Remaining amount
          </p>
          <p className="mt-1 break-words text-lg font-bold text-violet-950">
            {currency(goal.remainingAmount)}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs leading-5 text-slate-600">
            Days remaining
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {goal.daysRemaining === null
              ? "—"
              : goal.daysRemaining < 0
                ? `${Math.abs(goal.daysRemaining)} days overdue`
                : `${goal.daysRemaining} days`}
          </p>
        </div>
      </div>

      {goal.status !== "completed" && goal.status !== "overdue" && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-sm text-slate-500">Required monthly saving</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {goal.requiredMonthly === null
                ? "Set a deadline"
                : currency(goal.requiredMonthly)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-sm text-slate-500">Required weekly saving</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {goal.requiredWeekly === null
                ? "Set a deadline"
                : currency(goal.requiredWeekly)}
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-xl bg-slate-50 p-3">
        <p className="text-sm font-medium text-slate-800">
          Savings pace estimate
        </p>

        <p className="mt-1 text-sm leading-6 text-slate-600">
          {goal.status === "completed"
            ? "Congratulations! You have reached this goal."
            : goal.status === "overdue"
              ? "The deadline has passed. Update your deadline or set a new savings plan."
              : goal.estimatedMonths !== null
                ? `At your recent overall net savings pace, you could reach this goal in about ${goal.estimatedMonths} month(s), around ${new Date(`${goal.projectedCompletionDate}T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}.`
                : "There is not enough positive recent net savings to estimate a completion date. Consider reviewing your expenses and setting aside a specific amount for this goal."}
        </p>
      </div>

      {goal.status === "needs_attention" &&
        goal.requiredMonthly !== null && (
          <p className="mt-3 text-sm leading-6 text-amber-800">
            To meet your deadline, aim to save {currency(goal.requiredMonthly)} per
            month. Your recent overall net savings pace is{" "}
            {currency(goal.averageMonthlyNetSavings)} per month.
          </p>
        )}
    </article>
  );
}

function GoalAchievementPlanner() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPlanner = async () => {
    setLoading(true);
    setError("");

    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        throw new Error("Please log in to view your goal planner.");
      }

      const user = JSON.parse(storedUser);

      if (!user?.id) {
        throw new Error("Your user ID was not found. Please log in again.");
      }

      const response = await api.get(
        `/goals/planner?user_id=${encodeURIComponent(user.id)}`
      );

      setData(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load your goal plans."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlanner();
  }, []);

  return (
    <section className="mb-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
              <Target className="h-5 w-5 text-violet-700" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Goal Achievement Planner
            </h2>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Turn your savings goals into weekly and monthly targets.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPlanner}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Calculating your goal plans...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-white p-5">
          <p className="text-sm text-rose-600">{error}</p>
          <button
            type="button"
            onClick={loadPlanner}
            className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
          >
            Try again
          </button>
        </div>
      ) : !data?.goals?.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <Target className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-3 font-semibold text-slate-900">
            No savings goals yet
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Create a goal using your existing Goals page, and your planner will
            calculate the savings targets for you.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Total goals</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {data.totals.totalGoals}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Total saved</p>
              <p className="mt-2 break-words text-2xl font-bold text-emerald-700">
                {currency(data.totals.currentAmount)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Still needed</p>
              <p className="mt-2 break-words text-2xl font-bold text-violet-700">
                {currency(data.totals.remainingAmount)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Completed goals</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {data.totals.completedGoals}
              </p>
            </div>
          </div>

          <div className="mb-5 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
            <div>
              <p className="text-sm font-semibold text-blue-900">
                Recent overall net savings pace
              </p>
              <p className="mt-1 text-sm leading-6 text-blue-800">
                {currency(data.averageMonthlyNetSavings)} per month, averaged
                over the three most recently completed calendar months.
                This is an estimate based on income minus expenses, not a
                record of deposits made to individual goals.
              </p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {data.goals.map((goal) => (
              <GoalPlanCard key={goal.id} goal={goal} />
            ))}
          </div>

          <p className="mt-5 text-xs leading-5 text-slate-400">
            {data.methodology}
          </p>
        </>
      )}
    </section>
  );
}

export default GoalAchievementPlanner;
