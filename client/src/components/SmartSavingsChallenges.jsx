
import { useEffect, useState } from "react";
import {
  Trophy,
  Plus,
  Target,
  CalendarDays,
  Wallet,
  CheckCircle2,
  Clock,
  RefreshCw,
  X,
  Sparkles,
  Flame,
} from "lucide-react";
import api from "../services/api";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const todayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const challengeTypes = {
  weekly_savings: {
    label: "52-Week Savings",
    icon: CalendarDays,
    description: "Build a regular savings habit.",
  },
  no_spend: {
    label: "No-Spend Challenge",
    icon: Flame,
    description: "Avoid optional purchases and check in each day.",
  },
  custom: {
    label: "Custom Savings",
    icon: Target,
    description: "Choose your own target and duration.",
  },
};

const statusStyle = {
  active: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-100 text-slate-600",
};

function SmartSavingsChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    challenge_type: "custom",
    target_amount: "5000",
    duration_days: "30",
    start_date: todayKey(),
    category: "",
  });

  const getUserId = () => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      throw new Error("Please log in to manage your savings challenges.");
    }

    const user = JSON.parse(storedUser);

    if (!user?.id) {
      throw new Error("Your user ID was not found. Please log in again.");
    }

    return user.id;
  };

  const loadChallenges = async () => {
    setLoading(true);
    setError("");

    try {
      const userId = getUserId();
      const response = await api.get(
        `/challenges?user_id=${encodeURIComponent(userId)}`
      );
      setChallenges(response.data.challenges || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load challenges."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  const updateForm = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const choosePreset = (type) => {
    const presets = {
      weekly_savings: {
        title: "52-Week Savings Challenge",
        challenge_type: "weekly_savings",
        target_amount: "1378",
        duration_days: "364",
        category: "",
      },
      no_spend: {
        title: "30-Day No-Spend Challenge",
        challenge_type: "no_spend",
        target_amount: "0",
        duration_days: "30",
        category: "",
      },
      custom: {
        title: "",
        challenge_type: "custom",
        target_amount: "5000",
        duration_days: "30",
        category: "",
      },
    };

    setForm((previous) => ({
      ...previous,
      ...presets[type],
      start_date: todayKey(),
    }));
    setShowForm(true);
    setNotice("");
  };

  const createChallenge = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const userId = getUserId();
      const payload = {
        ...form,
        user_id: userId,
        duration_days: Number(form.duration_days),
        target_amount: Number(form.target_amount),
      };

      if (payload.challenge_type === "no_spend") {
        payload.target_amount = 0;
      }

      const response = await api.post("/challenges", payload);

      setNotice(response.data.message || "Challenge created successfully.");
      setShowForm(false);
      await loadChallenges();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to create challenge."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const recordActivity = async (challenge) => {
    setError("");
    setNotice("");

    let amount = 0;
    let note = "";

    if (challenge.challenge_type !== "no_spend") {
      const input = window.prompt(
        `How much did you save for "${challenge.title}" today? Enter the amount in ₹.`
      );

      if (input === null) return;

      amount = Number(input);

      if (!Number.isFinite(amount) || amount <= 0) {
        setError("Enter a valid positive savings amount.");
        return;
      }

      note = "Savings contribution";
    } else {
      const confirmed = window.confirm(
        `Record a no-spend day for "${challenge.title}"? You can only check in once per date.`
      );

      if (!confirmed) return;

      note = "No-spend day completed";
    }

    setBusyId(challenge.id);

    try {
      const userId = getUserId();

      const response = await api.post(`/challenges/${challenge.id}/log`, {
        user_id: userId,
        log_date: todayKey(),
        amount,
        note,
      });

      setNotice(response.data.message || "Progress recorded.");
      await loadChallenges();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to record challenge progress."
      );
    } finally {
      setBusyId(null);
    }
  };

  const cancelChallenge = async (challenge) => {
    const confirmed = window.confirm(
      `Cancel "${challenge.title}"? Your recorded progress will remain saved.`
    );

    if (!confirmed) return;

    setBusyId(challenge.id);
    setError("");
    setNotice("");

    try {
      const userId = getUserId();

      const response = await api.patch(
        `/challenges/${challenge.id}/cancel`,
        { user_id: userId }
      );

      setNotice(response.data.message || "Challenge cancelled.");
      await loadChallenges();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to cancel challenge."
      );
    } finally {
      setBusyId(null);
    }
  };

  const activeChallenges = challenges.filter((item) => item.status === "active");
  const completedChallenges = challenges.filter(
    (item) => item.status === "completed"
  );
  const totalSaved = challenges.reduce(
    (sum, item) => sum + (Number(item.saved_amount) || 0),
    0
  );

  return (
    <section className="mb-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100">
              <Trophy className="h-6 w-6 text-violet-700" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Smart Savings Challenges
            </h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Turn your savings goals into simple habits and track your progress.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowForm((value) => !value);
            setError("");
            setNotice("");
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Close" : "Create challenge"}
        </button>
      </div>

      {notice && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Challenge presets */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {Object.entries(challengeTypes).map(([type, details]) => {
          const Icon = details.icon;

          return (
            <button
              key={type}
              type="button"
              onClick={() => choosePreset(type)}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-violet-300 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                <Icon className="h-5 w-5 text-violet-700" />
              </div>
              <h3 className="mt-3 font-semibold text-slate-900">
                {details.label}
              </h3>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                {details.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Create challenge form */}
      {showForm && (
        <form
          onSubmit={createChallenge}
          className="mb-6 rounded-2xl border border-violet-200 bg-white p-5 shadow-sm"
        >
          <h3 className="mb-4 font-semibold text-slate-900">
            Create your challenge
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Challenge title
              <input
                required
                maxLength={150}
                value={form.title}
                onChange={(event) => updateForm("title", event.target.value)}
                placeholder="e.g. Save for a new laptop"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Challenge type
              <select
                value={form.challenge_type}
                onChange={(event) => {
                  const type = event.target.value;
                  updateForm("challenge_type", type);
                  if (type === "no_spend") updateForm("target_amount", "0");
                  else if (Number(form.target_amount) <= 0) {
                    updateForm("target_amount", "5000");
                  }
                }}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-500"
              >
                <option value="weekly_savings">52-Week Savings</option>
                <option value="no_spend">No-Spend</option>
                <option value="custom">Custom Savings</option>
              </select>
            </label>

            {form.challenge_type !== "no_spend" && (
              <label className="block text-sm font-medium text-slate-700">
                Target amount (₹)
                <input
                  type="number"
                  min="1"
                  max="1000000000"
                  step="0.01"
                  required
                  value={form.target_amount}
                  onChange={(event) =>
                    updateForm("target_amount", event.target.value)
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500"
                />
              </label>
            )}

            <label className="block text-sm font-medium text-slate-700">
              Duration (days)
              <input
                type="number"
                min="1"
                max="366"
                required
                value={form.duration_days}
                onChange={(event) =>
                  updateForm("duration_days", event.target.value)
                }
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Start date
              <input
                type="date"
                required
                value={form.start_date}
                onChange={(event) =>
                  updateForm("start_date", event.target.value)
                }
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500"
              />
            </label>

            {form.challenge_type === "no_spend" && (
              <label className="block text-sm font-medium text-slate-700">
                Optional category
                <input
                  maxLength={100}
                  value={form.category}
                  onChange={(event) =>
                    updateForm("category", event.target.value)
                  }
                  placeholder="e.g. Eating out"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500"
                />
              </label>
            )}
          </div>

          {form.challenge_type === "weekly_savings" && (
            <p className="mt-4 rounded-lg bg-blue-50 p-3 text-sm leading-5 text-blue-800">
              The classic 52-week challenge has a ₹1,378 total target when you
              save ₹1 in week 1, ₹2 in week 2, and continue up to ₹52 in week
              52. This version tracks contributions toward the total; it does
              not automatically enforce each week's amount.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Save challenge"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Active challenges</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {activeChallenges.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Challenge contributions</p>
          <p className="mt-2 break-words text-2xl font-bold text-emerald-700">
            {currency(totalSaved)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Completed challenges</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {completedChallenges.length}
          </p>
        </div>
      </div>

      {/* Challenge list */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-slate-900">Your challenges</h3>
        <button
          type="button"
          onClick={loadChallenges}
          disabled={loading}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-violet-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading your challenges...
        </div>
      ) : challenges.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">

          <h3 className="mt-3 font-semibold text-slate-900">
            Start your first savings challenge
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Choose one of the challenges above or create your own.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {challenges.map((challenge) => {
            const type = challengeTypes[challenge.challenge_type] || challengeTypes.custom;
            const Icon = type.icon;
            const isNoSpend = challenge.challenge_type === "no_spend";

            return (
              <article
                key={challenge.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100">
                      <Icon className="h-5 w-5 text-violet-700" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {challenge.title}
                      </h4>
                      <p className="mt-1 text-sm text-slate-500">{type.label}</p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle[challenge.status] || statusStyle.active}`}
                  >
                    {challenge.status}
                  </span>
                </div>

                <div className="mt-5 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">
                      {isNoSpend ? "Days checked in" : "Saved so far"}
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {isNoSpend
                        ? `${challenge.check_in_count} / ${challenge.duration_days} days`
                        : currency(challenge.saved_amount)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-slate-500">
                      {isNoSpend ? "Duration" : "Savings target"}
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {isNoSpend
                        ? `${challenge.duration_days} days`
                        : currency(challenge.target_amount)}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-500">Progress</span>
                    <span className="font-semibold text-violet-700">
                      {Number(challenge.progress || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-violet-600 transition-all"
                      style={{
                        width: `${Math.min(100, Number(challenge.progress) || 0)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" />
                    Ends {new Date(`${String(challenge.end_date).slice(0, 10)}T00:00:00`).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>

                  {challenge.category && (
                    <span>Category: {challenge.category}</span>
                  )}
                </div>

                {challenge.status === "active" && (
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={busyId === challenge.id}
                      onClick={() => recordActivity(challenge)}
                      className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                    >
                      {busyId === challenge.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : isNoSpend ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Wallet className="h-4 w-4" />
                      )}
                      {isNoSpend ? "Check in today" : "Record savings"}
                    </button>

                    <button
                      type="button"
                      disabled={busyId === challenge.id}
                      onClick={() => cancelChallenge(challenge)}
                      className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel challenge
                    </button>
                  </div>
                )}

                {challenge.status === "completed" && (
                  <div className="mt-5 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" />
                    Congratulations on completing this challenge!
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <p className="mt-5 text-xs leading-5 text-slate-400">
        Challenge contributions are tracked separately from your Goals and Transactions. Recording a challenge contribution does not create a bank transfer or transaction automatically.
      </p>
    </section>
  );
}

export default SmartSavingsChallenges;
