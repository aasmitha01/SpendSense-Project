

import { useCallback, useEffect, useState } from "react";


import api from "../services/api";

import IntelligenceHealth from "../components/IntelligenceHealth";

import SmartSpendingSuggestions from "../components/SmartSpendingSuggestions";

import {

  BrainCircuit,

  TrendingUp,

  TrendingDown,

  Wallet,

  PiggyBank,

  Target,

  Lightbulb,

  AlertTriangle,

  CheckCircle2,

  Info,

  CalendarClock,

  RefreshCw,

  LoaderCircle,

  Sparkles,

  ArrowUpRight,

  ArrowDownRight,

} from "lucide-react";



const money = (value) =>

  new Intl.NumberFormat("en-IN", {

    style: "currency",

    currency: "INR",

    maximumFractionDigits: 0,

  }).format(Number(value) || 0);



const dateLabel = (value) => {

  if (!value) return "No deadline";



  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);



  return Number.isNaN(date.getTime())

    ? "Date unavailable"

    : date.toLocaleDateString("en-IN", {

        day: "numeric",

        month: "short",

        year: "numeric",

      });

};



const insightStyle = {

  warning: {

    icon: AlertTriangle,

    container: "border-amber-200 bg-amber-50",

    iconColor: "text-amber-600",

    title: "text-amber-950",

  },

  success: {

    icon: CheckCircle2,

    container: "border-emerald-200 bg-emerald-50",

    iconColor: "text-emerald-600",

    title: "text-emerald-950",

  },

  info: {

    icon: Info,

    container: "border-violet-200 bg-violet-50",

    iconColor: "text-violet-600",

    title: "text-violet-950",

  },

};



function Intelligence() {

  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");



  const fetchInsights = useCallback(async () => {

    const user = JSON.parse(

      localStorage.getItem("user") || "null"

    );



    if (!user?.id) {

      setError("Please log in to view your financial insights.");

      setLoading(false);

      return;

    }



    try {

      setLoading(true);

      setError("");



      const response = await api.get(

        `/intelligence?user_id=${encodeURIComponent(user.id)}`

      );



      setData(response.data);

    } catch (err) {

      console.error("Unable to load intelligence:", err);



      setError(

        err.response?.data?.message ||

          "Unable to load your financial insights. Check your backend and try again."

      );

    } finally {

      setLoading(false);

    }

  }, []);



  useEffect(() => {

    fetchInsights();

  }, [fetchInsights]);



  const summary = data?.summary;

  const topCategory = data?.categories?.[0];



  const cards = [

    {

      label: "Monthly income",

      value: money(summary?.totalIncome),

      icon: TrendingUp,

      color: "text-emerald-600",

      background: "bg-emerald-50",

    },

    {

      label: "Monthly expenses",

      value: money(summary?.totalExpense),

      icon: TrendingDown,

      color: "text-rose-600",

      background: "bg-rose-50",

    },

    {

      label: "Net balance",

      value: money(summary?.balance),

      icon: Wallet,

      color:

        Number(summary?.balance) < 0

          ? "text-rose-600"

          : "text-violet-600",

      background: "bg-violet-50",

    },

    {

      label: "Savings rate",

      value:

        summary?.savingsRate === null ||

        summary?.savingsRate === undefined

          ? "Not available"

          : `${summary.savingsRate}%`,

      icon: PiggyBank,

      color: "text-blue-600",

      background: "bg-blue-50",

    },

  ];



  return (

    <div className="w-full min-w-0 bg-[#f5f6fb]">
      <div className="mx-auto w-full max-w-none space-y-7">



        <IntelligenceHealth />



<SmartSpendingSuggestions />

          {/* Header */}

          <header className="flex flex-wrap items-center justify-between gap-4">

            <div>

              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-600">

                <Sparkles size={16} />

                SMART FINANCIAL ASSISTANT

              </div>



              <h1 className="text-3xl font-bold tracking-tight text-slate-900">

                Intelligence Center

              </h1>



              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">

                Understand your spending, spot potential problems, and

                discover practical ways to improve your financial health.

              </p>

            </div>



            <button

              onClick={fetchInsights}

              disabled={loading}

              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"

            >

              <RefreshCw

                size={16}

                className={loading ? "animate-spin" : ""}

              />

              Refresh insights

            </button>

          </header>



          {/* Hero */}

          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-700 via-violet-600 to-indigo-600 p-6 text-white shadow-lg sm:p-8">

            <div className="relative z-10 max-w-2xl">

              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">

                <BrainCircuit size={15} />

                PERSONALIZED FINANCIAL INSIGHTS

              </div>





              <h2 className="mt-5 text-2xl font-bold sm:text-3xl">

                Your money, explained.

              </h2>



              <p className="mt-3 max-w-xl text-sm leading-6 text-violet-100 sm:text-base">

                Review your recorded financial activity and get clear,

                actionable recommendations based on your data.

              </p>



              <p className="mt-4 text-xs text-violet-200">

                {data?.period?.currentMonth

                  ? `Analysis period: ${new Date(

                      `${data.period.currentMonth}-01T00:00:00`

                    ).toLocaleDateString("en-IN", {

                      month: "long",

                      year: "numeric",

                    })}`

                  : "Your financial overview"}

              </p>

            </div>



            <BrainCircuit

              size={160}

              strokeWidth={0.8}

              className="absolute -bottom-8 -right-6 hidden text-white/10 sm:block"

            />

          </section>



          {error && (

            <div

              role="alert"

              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"

            >

              <span>{error}</span>



              <button

                onClick={fetchInsights}

                className="font-semibold underline"

              >

                Try again

              </button>

            </div>

          )}



          {loading ? (

            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white">

              <LoaderCircle

                size={32}

                className="animate-spin text-violet-600"

              />



              <p className="mt-4 font-semibold text-slate-700">

                Analyzing your financial data...

              </p>



              <p className="mt-1 text-sm text-slate-500">

                Preparing your personalized insights.

              </p>

            </div>

          ) : data ? (

            <>

              {/* Summary cards */}

              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                {cards.map((card) => {

                  const Icon = card.icon;



                  return (



                    <div

                      key={card.label}

                      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"

                    >

                      <div className="flex items-center justify-between gap-3">

                        <p className="text-sm font-medium text-slate-500">

                          {card.label}

                        </p>



                        <div className={`rounded-xl p-3 ${card.background}`}>

                          <Icon size={21} className={card.color} />

                        </div>

                      </div>



                      <p className={`mt-5 break-words text-2xl font-bold ${card.color}`}>

                        {card.value}

                      </p>

                    </div>

                  );

                })}

              </section>



              {/* Personalized insights */}

              <section>

                <div className="mb-4 flex items-end justify-between gap-3">

                  <div>

                    <h2 className="text-xl font-bold text-slate-900">

                      Your personalized insights

                    </h2>



                    <p className="mt-1 text-sm text-slate-500">

                      Recommendations generated from your financial records

                    </p>

                  </div>



                  <span className="shrink-0 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">

                    {data.insights.length} insights

                  </span>

                </div>



                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

                  {data.insights.map((insight) => {

                    const style =

                      insightStyle[insight.type] || insightStyle.info;



                    const Icon = style.icon;





                    return (

                      <article

                        key={insight.id}

                        className={`rounded-2xl border p-5 ${style.container}`}

                      >

                        <div className="flex items-start gap-3">

                          <div className="rounded-xl bg-white/80 p-3">

                            <Icon

                              size={21}

                              className={style.iconColor}

                            />

                          </div>



                          <div className="min-w-0 flex-1">

                            <h3 className={`font-bold ${style.title}`}>

                              {insight.title}

                            </h3>



                            <p className="mt-2 text-sm leading-6 text-slate-700">

                              {insight.message}

                            </p>



                            <div className="mt-4 rounded-xl bg-white/70 p-3">

                              <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">

                                <Lightbulb size={14} />

                                Suggested action

                              </p>



                              <p className="text-sm leading-6 text-slate-700">

                                {insight.recommendation}

                              </p>

                            </div>

                          </div>

                        </div>

                      </article>

                    );

                  })}

                </div>

              </section>



              {/* Category trends */}

              <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

                  <div className="mb-5 flex items-center gap-3">

                    <div className="rounded-xl bg-violet-50 p-3 text-violet-600">

                      <TrendingUp size={21} />

                    </div>



                    <div>

                      <h2 className="font-bold text-slate-900">

                        Expense categories

                      </h2>



                      <p className="text-sm text-slate-500">

                        Current month spending

                      </p>

                    </div>

                  </div>



                  {data.categories.length === 0 ? (

                    <EmptyState message="No expenses recorded this month." />

                  ) : (

                    <div className="space-y-5">

                      {data.categories.slice(0, 6).map((item) => {

                        const maxAmount = Math.max(

                          ...data.categories.map((c) => c.spent),

                          1

                        );



                        return (

                          <div key={item.category}>

                            <div className="mb-2 flex items-center justify-between gap-3">

                              <span className="truncate text-sm font-medium text-slate-700">

                                {item.category}

                              </span>



                              <span className="shrink-0 text-sm font-bold text-slate-900">

                                {money(item.spent)}

                              </span>

                            </div>



                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">

                              <div

                                className="h-full rounded-full bg-violet-500 transition-all"

                                style={{

                                  width: `${(item.spent / maxAmount) * 100}%`,

                                }}

                              />

                            </div>



                            <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">

                              {item.changePercent === null ? (

                                "No previous-month comparison"

                              ) : (

                                <>

                                  {item.changePercent >= 0 ? (

                                    <ArrowUpRight size={14} />

                                  ) : (

                                    <ArrowDownRight size={14} />

                                  )}



                                  {Math.abs(item.changePercent)}%{" "}

                                  {item.changePercent >= 0

                                    ? "higher"

                                    : "lower"}{" "}

                                  than last month

                                </>

                              )}

                            </p>

                          </div>

                        );

                      })}

                    </div>

                  )}

                </div>



                {/* Budget health */}

                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

                  <div className="mb-5 flex items-center gap-3">

                    <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">

                      <Wallet size={21} />

                    </div>



                    <div>

                      <h2 className="font-bold text-slate-900">

                        Budget health

                      </h2>



                      <p className="text-sm text-slate-500">

                        Spending compared with your limits

                      </p>

                    </div>

                  </div>



                  {data.budgets.length === 0 ? (

                    <EmptyState message="Create a budget to start tracking category limits." />

                  ) : (

                    <div className="space-y-5">

                      {data.budgets.map((budget) => {

                        const percent = budget.percentUsed ?? 0;



                        const barColor =

                          budget.status === "exceeded"

                            ? "bg-rose-500"

                            : budget.status === "warning"

                              ? "bg-amber-500"

                              : "bg-emerald-500";



                        return (

                          <div key={budget.id}>

                            <div className="mb-2 flex items-center justify-between gap-3">

                              <span className="font-semibold text-slate-800">

                                {budget.category}

                              </span>



                              <span

                                className={`text-xs font-bold ${

                                  budget.status === "exceeded"

                                    ? "text-rose-600"

                                    : budget.status === "warning"

                                      ? "text-amber-600"

                                      : "text-emerald-600"

                                }`}

                              >

                                {budget.percentUsed === null

                                  ? "Invalid limit"

                                  : `${percent}% used`}

                              </span>

                            </div>



                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">

                              <div

                                className={`h-full rounded-full ${barColor}`}

                                style={{

                                  width: `${Math.min(100, Math.max(0, percent))}%`,

                                }}

                              />

                            </div>



                            <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500">

                              <span>

                                Spent {money(budget.spent)} of{" "}

                                {money(budget.limit)}

                              </span>



                              <span>

                                {budget.remaining < 0

                                  ? `${money(Math.abs(budget.remaining))} over`

                                  : `${money(budget.remaining)} left`}

                              </span>

                            </div>

                          </div>

                        );

                      })}

                    </div>

                  )}

                </div>

              </section>



              {/* Goals and bills */}

              <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

                  <div className="mb-5 flex items-center gap-3">

                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">

                      <Target size={21} />

                    </div>



                    <div>

                      <h2 className="font-bold text-slate-900">

                        Savings goals

                      </h2>



                      <p className="text-sm text-slate-500">

                        Progress and estimated timelines

                      </p>

                    </div>

                  </div>



                  {data.goals.length === 0 ? (

                    <EmptyState message="Create a savings goal to track your progress." />

                  ) : (

                    <div className="space-y-5">

                      {data.goals.map((goal) => (

                        <div key={goal.id}>

                          <div className="flex items-start justify-between gap-3">

                            <div>

                              <p className="font-semibold text-slate-800">

                                {goal.name}

                              </p>



                              <p className="mt-1 text-xs text-slate-500">

                                Deadline: {dateLabel(goal.deadline)}

                              </p>

                            </div>



                            <span className="text-sm font-bold text-violet-700">

                              {goal.progress}%

                            </span>

                          </div>



                          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">

                            <div

                              className="h-full rounded-full bg-violet-500"

                              style={{

                                width: `${goal.progress}%`,

                              }}

                            />

                          </div>



                          <p className="mt-2 text-xs text-slate-500">

                            {money(goal.saved)} saved of{" "}

                            {money(goal.target)}

                          </p>



                          {goal.estimatedMonths !== null && (

                            <p className="mt-1 text-xs font-medium text-violet-700">

                              Estimated time remaining:{" "}

                              {goal.estimatedMonths} month(s)

                            </p>

                          )}

                        </div>

                      ))}

                    </div>

                  )}

                </div>



                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

                  <div className="mb-5 flex items-center gap-3">

                    <div className="rounded-xl bg-amber-50 p-3 text-amber-600">

                      <CalendarClock size={21} />

                    </div>



                    <div>

                      <h2 className="font-bold text-slate-900">

                        Upcoming bills

                      </h2>



                      <p className="text-sm text-slate-500">

                        Unpaid bills and due dates

                      </p>

                    </div>

                  </div>



                  <div className="mb-5 grid grid-cols-2 gap-3">

                    <div className="rounded-xl bg-amber-50 p-4">

                      <p className="text-xs font-medium text-amber-700">

                        Unpaid bills

                      </p>



                      <p className="mt-1 text-xl font-bold text-amber-900">

                        {data.bills.pendingCount}

                      </p>

                    </div>



                    <div className="rounded-xl bg-violet-50 p-4">

                      <p className="text-xs font-medium text-violet-700">

                        Outstanding amount

                      </p>



                      <p className="mt-1 break-words text-xl font-bold text-violet-900">

                        {money(data.bills.pendingAmount)}

                      </p>

                    </div>

                  </div>



                  {data.bills.items.length === 0 ? (

                    <EmptyState message="You have no unpaid bills recorded." />

                  ) : (

                    <div className="space-y-3">

                      {data.bills.items.slice(0, 6).map((bill) => (

                        <div

                          key={bill.id}

                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"

                        >

                          <div className="min-w-0">

                            <p className="truncate font-semibold text-slate-800">

                              {bill.name}

                            </p>



                            <p className="mt-1 text-xs text-slate-500">

                              Due: {dateLabel(bill.dueDate)}

                            </p>

                          </div>



                          <div className="shrink-0 text-right">

                            <p className="font-bold text-slate-900">

                              {money(bill.amount)}

                            </p>



                            <p

                              className={`mt-1 text-xs font-semibold ${

                                bill.status === "overdue"

                                  ? "text-rose-600"

                                  : bill.status === "due_soon"

                                    ? "text-amber-600"

                                    : "text-slate-500"

                              }`}

                            >

                              {bill.status === "overdue"

                                ? "Overdue"

                                : bill.status === "due_soon"

                                  ? "Due soon"

                                  : bill.status === "unknown"

                                    ? "Date unavailable"

                                    : "Upcoming"}

                            </p>

                          </div>

                        </div>

                      ))}

                    </div>

                  )}

                </div>

              </section>



              <footer className="pb-4 text-center text-xs leading-5 text-slate-400">

                SpendSense Intelligence uses rule-based analysis of recorded

                data. Spending comparisons and goal forecasts are estimates,

                not guarantees.

              </footer>

            </>

          ) : null}
      </div>
    </div>
  );
}

function EmptyState({ message }) {

  return (

    <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">

      {message}

    </div>

  );

}



export default Intelligence;
