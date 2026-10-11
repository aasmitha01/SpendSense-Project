import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import EditProfileModal from "../components/EditProfileModal";
import api from "../services/api";

import {
  UserRound,
  Mail,
  CalendarDays,
  Pencil,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Target,
  Receipt,
  PiggyBank,
  ShieldCheck,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
}

function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  );
}

function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(getStoredUser);
  const [showEditModal, setShowEditModal] = useState(false);

  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });

  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [bills, setBills] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const fetchProfileData = useCallback(async () => {
    const storedUser = getStoredUser();

    if (!storedUser?.id) {
      navigate("/login");
      return;
    }

    setPageError("");
    setLoading(true);

    const results = await Promise.allSettled([
      api.get(`/users/${storedUser.id}`),
      api.get(`/transactions/dashboard?user_id=${storedUser.id}`),
      api.get(`/transactions?user_id=${storedUser.id}`),
      api.get(`/goals?user_id=${storedUser.id}`),
      api.get(`/budgets?user_id=${storedUser.id}`),
      api.get(`/bills?user_id=${storedUser.id}`),
    ]);

    if (results[0].status === "fulfilled") {
      const serverUser = results[0].value.data.user ||
        results[0].value.data;

      const normalized = {
        ...storedUser,
        ...serverUser,
        name: serverUser.full_name || serverUser.name ||
          storedUser.full_name || storedUser.name || "",
      };

      setProfile(normalized);
      localStorage.setItem("user", JSON.stringify(normalized));
    } else {
      setProfile(storedUser);
      setPageError(
        "Your saved profile could not be refreshed from the server."
      );
    }

    if (results[1].status === "fulfilled") {
      setStats(results[1].value.data);
    }

    if (results[2].status === "fulfilled") {
      setTransactions(
        Array.isArray(results[2].value.data)
          ? results[2].value.data
          : []
      );
    }

    if (results[3].status === "fulfilled") {
      setGoals(
        Array.isArray(results[3].value.data)
          ? results[3].value.data
          : []
      );
    }

    if (results[4].status === "fulfilled") {
      setBudgets(
        Array.isArray(results[4].value.data)
          ? results[4].value.data
          : []
      );
    }

    if (results[5].status === "fulfilled") {
      setBills(
        Array.isArray(results[5].value.data)
          ? results[5].value.data
          : []
      );
    }

    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleProfileUpdated = (updatedUser) => {
    setProfile(updatedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const displayName =
    profile?.full_name || profile?.name || "User";

  const savingsRate =
    Number(stats.totalIncome) > 0
      ? Math.max(
          0,
          Math.round(
            (Number(stats.balance) /
              Number(stats.totalIncome)) * 100
          )
        )
      : 0;

  const pendingBills = bills.filter(
    (bill) => !(
      bill.paid === true ||
      bill.paid === 1 ||
      bill.paid === "1"
    )
  );

  const statCards = [
    {
      label: "Total income",
      value: currency(stats.totalIncome),
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Total expenses",
      value: currency(stats.totalExpense),
      icon: TrendingDown,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      label: "Available balance",
      value: currency(stats.balance),
      icon: Wallet,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Savings rate",
      value: `${savingsRate}%`,
      icon: PiggyBank,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  const activity = transactions.slice(0, 5);

  return (
    <div className="flex min-h-screen bg-[#f5f6fb]">
      <Sidebar />

      {/* Using flex-1 removes fixed margin calculations and completely hugs the sidebar cleanly */}
      <main className="flex-1 min-h-screen px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Page header */}
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-violet-600">
                ACCOUNT MANAGEMENT
              </p>

              <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
                My Profile
              </h1>

              <p className="mt-1 text-xs text-slate-500">
                Manage your personal information and financial overview.
              </p>
            </div>

            <button
              onClick={fetchProfileData}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </header>

          {pageError && (
            <div
              role="alert"
              className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
            >
              <AlertCircle size={18} />
              {pageError}
            </div>
          )}

          {/* Profile and personal information */}
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">

            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm transition hover:shadow-md">
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-violet-600 to-indigo-500" />

              <div className="relative pt-4">
                {profile?.profile_photo ? (
                  <img
                    src={profile.profile_photo}
                    alt={`${displayName}'s profile`}
                    className="mx-auto h-24 w-24 rounded-full border-4 border-white bg-white object-cover shadow-md"
                  />
                ) : (
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-violet-100 text-2xl font-bold text-violet-700 shadow-md">
                    {getInitials(displayName)}
                  </div>
                )}

                <h2 className="mt-3 break-words text-lg font-bold text-slate-900">
                  {displayName}
                </h2>

                <p className="text-xs text-slate-500">
                  SpendSense Member
                </p>

                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <ShieldCheck size={14} />
                  Personal account
                </div>

                <button
                  onClick={() => setShowEditModal(true)}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  <Pencil size={15} />
                  Edit Profile
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Personal Information
                  </h2>

                  <p className="text-xs text-slate-500">
                    Your registered account details
                  </p>
                </div>

                <button
                  onClick={() => setShowEditModal(true)}
                  aria-label="Edit personal information"
                  className="rounded-xl bg-violet-50 p-2.5 text-violet-600 transition hover:bg-violet-100"
                >
                  <Pencil size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 pt-5 sm:grid-cols-2">
                <InfoItem
                  icon={UserRound}
                  label="Full name"
                  value={displayName}
                />

                <InfoItem
                  icon={Mail}
                  label="Email address"
                  value={profile?.email || "Not provided"}
                />

                <InfoItem
                  icon={CalendarDays}
                  label="Member since"
                  value={
                    profile?.created_at
                      ? new Date(
                          profile.created_at
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Member"
                  }
                />

                <InfoItem
                  icon={ShieldCheck}
                  label="Account type"
                  value="Personal"
                />
              </div>
            </div>
          </section>

          {/* Financial overview */}
          <section>
            <div className="mb-3">
              <h2 className="text-lg font-bold text-slate-900">
                Financial Overview
              </h2>

              <p className="text-xs text-slate-500">
                A summary of your financial activity
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center rounded-2xl bg-white p-8 text-sm text-slate-500">
                <LoaderCircle className="mr-2 animate-spin" size={18} />
                Loading your financial overview...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {statCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <div
                      key={card.label}
                      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-slate-500">
                          {card.label}
                        </p>

                        <div className={`rounded-xl p-2.5 ${card.bg}`}>
                          <Icon size={18} className={card.color} />
                        </div>
                      </div>

                      <p className={`mt-3 break-words text-xl font-bold ${card.color}`}>
                        {card.value}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Account counts */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <CountCard
              icon={ArrowLeftRight}
              label="Transactions"
              value={transactions.length}
              color="text-blue-600"
              bg="bg-blue-50"
            />

            <CountCard
              icon={Target}
              label="Savings goals"
              value={goals.length}
              color="text-violet-600"
              bg="bg-violet-50"
            />

            <CountCard
              icon={Wallet}
              label="Budgets"
              value={budgets.length}
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
          </section>

          {/* Recent activity and account settings */}
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Recent Transactions
                  </h2>

                  <p className="text-xs text-slate-500">
                    Your latest financial activity
                  </p>
                </div>

                <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                  {transactions.length} total
                </span>
              </div>

              {activity.length === 0 ? (
                <div className="rounded-xl bg-slate-50 py-8 text-center">
                  <ArrowLeftRight
                    size={26}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-2 text-sm font-medium text-slate-700">
                    No transactions yet
                  </p>

                  <p className="text-xs text-slate-500">
                    Your recent activity will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {activity.map((item) => {
                    const isIncome = item.type === "income";

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`rounded-xl p-2.5 ${
                              isIncome
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-rose-50 text-rose-600"
                            }`}
                          >
                            {isIncome ? (
                              <TrendingUp size={16} />
                            ) : (
                              <TrendingDown size={16} />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {item.title}
                            </p>

                            <p className="text-xs text-slate-500">
                              {item.category || item.type}
                              {" · "}
                              {item.transaction_date
                                ? new Date(
                                    item.transaction_date
                                  ).toLocaleDateString("en-IN")
                                : "Date unavailable"}
                            </p>
                          </div>
                        </div>

                        <p
                          className={`shrink-0 text-xs font-bold ${
                            isIncome
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >
                          {isIncome ? "+" : "-"}
                          {currency(item.amount)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">
                Account Settings
              </h2>

              <p className="text-xs text-slate-500">
                Manage your account
              </p>

              <div className="mt-4 space-y-3">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-violet-200 hover:bg-violet-50"
                >
                  <div className="rounded-lg bg-violet-100 p-2 text-violet-700">
                    <Pencil size={16} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Edit profile
                    </p>
                    <p className="text-xs text-slate-500">
                      Update name, email and photo
                    </p>
                  </div>
                </button>

                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                      <Receipt size={16} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Pending bills
                      </p>
                      <p className="text-xs text-slate-500">
                        {pendingBills.length} unpaid bills
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full rounded-xl border border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  Sign out
                </button>
              </div>
            </div>
          </section>

          <footer className="pb-2 text-center text-xs text-slate-400">
            SpendSense · Your finances, organized.
          </footer>
        </div>
      </main>

      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        user={profile}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

function CountCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className={`rounded-xl p-2.5 ${bg}`}>
        <Icon size={20} className={color} />
      </div>

      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

export default Profile;