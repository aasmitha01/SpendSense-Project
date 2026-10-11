
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  X,
} from "lucide-react";
import api from "../services/api";

function PredictiveAlertBell() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("spendsense-read-alerts") || "[]");
    } catch {
      return [];
    }
  });

  const fetchAlerts = useCallback(async () => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      setAlerts([]);
      return;
    }

    let user;

    try {
      user = JSON.parse(storedUser);
    } catch {
      setError("Please log in again to view alerts.");
      return;
    }

    if (!user?.id) {
      setAlerts([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        `/alerts?user_id=${encodeURIComponent(user.id)}`
      );

      setAlerts(response.data.alerts || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load budget alerts."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    const intervalId = setInterval(fetchAlerts, 60000);

    return () => clearInterval(intervalId);
  }, [fetchAlerts]);

  const unreadCount = alerts.filter(
    (alert) => !readIds.includes(alert.id)
  ).length;

  const markAllRead = () => {
    const updated = [
      ...new Set([...readIds, ...alerts.map((alert) => alert.id)]),
    ];

    setReadIds(updated);
    localStorage.setItem("spendsense-read-alerts", JSON.stringify(updated));
  };

  const openBudget = (alert) => {
    markAllRead();
    setOpen(false);
    navigate("/budgets");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          const nextOpen = !open;
          setOpen(nextOpen);
          if (nextOpen) fetchAlerts();
        }}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition hover:bg-violet-50 hover:text-violet-700"
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-14 w-[min(92vw,390px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
            <div>
              <h2 className="font-bold text-slate-900">Notifications</h2>
              <p className="mt-1 text-xs text-slate-500">
                Predictive budget alerts
              </p>
            </div>

            <div className="flex items-center gap-2">
              {alerts.length > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs font-medium text-violet-700 hover:text-violet-900"
                >
                  Mark read
                </button>
              )}

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[65vh] overflow-y-auto">
            {loading && alerts.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin" />
                Checking your budgets...
              </div>
            ) : error && alerts.length === 0 ? (
              <div className="p-5">
                <p className="text-sm text-rose-600">{error}</p>
                <button
                  type="button"
                  onClick={fetchAlerts}
                  className="mt-3 text-sm font-semibold text-violet-700"
                >
                  Try again
                </button>
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-7 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                <p className="mt-3 font-semibold text-slate-900">
                  You're looking good!
                </p>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  No predictive budget alerts right now.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {alerts.map((alert) => {
                  const unread = !readIds.includes(alert.id);
                  const critical = alert.severity === "critical";

                  return (
                    <button
                      type="button"
                      key={alert.id}
                      onClick={() => openBudget(alert)}
                      className={`block w-full px-4 py-4 text-left transition hover:bg-slate-50 ${
                        unread ? "bg-violet-50/40" : "bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            critical
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className="text-sm font-semibold text-slate-900">
                              {alert.title}
                            </span>

                            {unread && (
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-600" />
                            )}
                          </span>

                          <span className="mt-1 block text-xs leading-5 text-slate-600">
                            {alert.message}
                          </span>

                          <span className="mt-2 block text-xs font-medium text-violet-700">
                            View budget <ArrowRight className="ml-1 inline h-3 w-3" />
                          </span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/budgets");
              }}
              className="w-full rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-violet-50"
            >
              View all budgets
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PredictiveAlertBell;
