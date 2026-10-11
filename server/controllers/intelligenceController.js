
const db = require("../config/db");

const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

const number = (value) => Number(value) || 0;

const roundMoney = (value) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const dateKey = (value) => {
  if (!value) return null;

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getIntelligence = async (req, res) => {
  const userId = Number(req.query.user_id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      message: "A valid user_id is required.",
    });
  }

  try {
    // Fetch only this user's financial records.
    const [
      transactions,
      budgets,
      goals,
      bills,
    ] = await Promise.all([
      query(
        `SELECT id, title, type, category, amount,
                transaction_date
         FROM transactions
         WHERE user_id = ?
         ORDER BY transaction_date DESC, id DESC`,
        [userId]
      ),

      query(
        `SELECT id, category, limit_amount, period
         FROM budgets
         WHERE user_id = ?`,
        [userId]
      ),

      query(
        `SELECT id, goal_name, target_amount,
                current_amount, deadline
         FROM goals
         WHERE user_id = ?`,
        [userId]
      ),

      query(
        `SELECT id, bill_name, amount, due_date,
                recurring, paid
         FROM bills
         WHERE user_id = ?`,
        [userId]
      ),
    ]);

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    const previousDate = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    const previousMonth = `${previousDate.getFullYear()}-${String(
      previousDate.getMonth() + 1
    ).padStart(2, "0")}`;

    const currentTransactions = transactions.filter(
      (t) => dateKey(t.transaction_date)?.slice(0, 7) === currentMonth
    );

    const previousTransactions = transactions.filter(
      (t) => dateKey(t.transaction_date)?.slice(0, 7) === previousMonth
    );

    const sumType = (items, type) =>
      roundMoney(
        items
          .filter((t) => t.type === type)
          .reduce((sum, t) => sum + number(t.amount), 0)
      );

    const totalIncome = sumType(currentTransactions, "income");
    const totalExpense = sumType(currentTransactions, "expense");
    const previousExpense = sumType(previousTransactions, "expense");
    const previousIncome = sumType(previousTransactions, "income");

    const balance = roundMoney(totalIncome - totalExpense);

    const savingsRate =
      totalIncome > 0
        ? roundMoney((balance / totalIncome) * 100)
        : null;

    const expenseByCategory = {};

    currentTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const category = String(t.category || "Uncategorized").trim();

        expenseByCategory[category] =
          (expenseByCategory[category] || 0) + number(t.amount);
      });

    const categories = Object.entries(expenseByCategory)
      .map(([category, amount]) => ({
        category,
        spent: roundMoney(amount),
      }))
      .sort((a, b) => b.spent - a.spent);

    const previousByCategory = {};

    previousTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const category = String(t.category || "Uncategorized").trim();

        previousByCategory[category] =
          (previousByCategory[category] || 0) + number(t.amount);
      });

    const categoryTrends = categories.map((item) => {
      const previous = number(previousByCategory[item.category]);

      return {
        ...item,
        previousMonth: roundMoney(previous),
        changePercent:
          previous > 0
            ? roundMoney(((item.spent - previous) / previous) * 100)
            : null,
      };
    });

    const expenseChangePercent =
      previousExpense > 0
        ? roundMoney(
            ((totalExpense - previousExpense) / previousExpense) * 100
          )
        : null;

    // Match budgets to transaction categories.
    const budgetInsights = budgets.map((budget) => {
      const spent = roundMoney(
        categories.find(
          (item) =>
            item.category.toLowerCase() ===
            String(budget.category || "").trim().toLowerCase()
        )?.spent || 0
      );

      const limit = number(budget.limit_amount);
      const percentUsed =
        limit > 0 ? roundMoney((spent / limit) * 100) : null;

      return {
        id: budget.id,
        category: budget.category,
        period: budget.period,
        limit: roundMoney(limit),
        spent,
        remaining: roundMoney(limit - spent),
        percentUsed,
        status:
          limit <= 0
            ? "invalid_limit"
            : spent > limit
              ? "exceeded"
              : spent >= limit * 0.8
                ? "warning"
                : "healthy",
      };
    });

    const today = dateKey(now);

    const isPaid = (bill) =>
      bill.paid === true ||
      bill.paid === 1 ||
      bill.paid === "1";

    const pendingBills = bills
      .filter((bill) => !isPaid(bill))
      .map((bill) => {
        const dueDate = dateKey(bill.due_date);

        const daysUntilDue = dueDate
          ? Math.round(
              (new Date(`${dueDate}T00:00:00`).getTime() -
                new Date(`${today}T00:00:00`).getTime()) /
                86400000
            )
          : null;

        return {
          id: bill.id,
          name: bill.bill_name,
          amount: roundMoney(number(bill.amount)),
          dueDate,
          recurring: Boolean(bill.recurring),
          daysUntilDue,
          status:
            daysUntilDue === null
              ? "unknown"
              : daysUntilDue < 0
                ? "overdue"
                : daysUntilDue <= 7
                  ? "due_soon"
                  : "upcoming",
        };
      })
      .sort((a, b) => {
        if (a.daysUntilDue === null) return 1;
        if (b.daysUntilDue === null) return -1;
        return a.daysUntilDue - b.daysUntilDue;
      });

    const pendingBillAmount = roundMoney(
      pendingBills.reduce((sum, bill) => sum + bill.amount, 0)
    );

    const goalInsights = goals.map((goal) => {
      const target = number(goal.target_amount);
      const saved = number(goal.current_amount);

      const progress =
        target > 0
          ? Math.min(100, roundMoney((saved / target) * 100))
          : 0;

      const remaining = roundMoney(Math.max(0, target - saved));
      const deadline = dateKey(goal.deadline);

      return {
        id: goal.id,
        name: goal.goal_name,
        target: roundMoney(target),
        saved: roundMoney(saved),
        remaining,
        progress,
        deadline,
        status:
          target <= 0
            ? "invalid_target"
            : saved >= target
              ? "completed"
              : deadline && deadline < today
                ? "past_deadline"
                : "in_progress",
      };
    });

    // Use completed monthly contributions to estimate goal timelines.
    // A single month of data is not enough to make a reliable estimate.
    const monthlySavings = {};

    transactions.forEach((t) => {
      const month = dateKey(t.transaction_date)?.slice(0, 7);

      if (!month) return;

      if (!monthlySavings[month]) {
        monthlySavings[month] = { income: 0, expense: 0 };
      }

      if (t.type === "income") {
        monthlySavings[month].income += number(t.amount);
      } else if (t.type === "expense") {
        monthlySavings[month].expense += number(t.amount);
      }
    });

    const completedMonths = Object.entries(monthlySavings)
      .filter(([month]) => month < currentMonth)
      .map(([, value]) => value);

    const averageMonthlySavings =
      completedMonths.length >= 2
        ? completedMonths.reduce(
            (sum, value) => sum + value.income - value.expense,
            0
          ) / completedMonths.length
        : null;

    const goalsWithForecast = goalInsights.map((goal) => {
      let estimatedMonths = null;

      if (
        goal.status === "in_progress" &&
        averageMonthlySavings > 0 &&
        goal.remaining > 0
      ) {
        estimatedMonths = Math.ceil(
          goal.remaining / averageMonthlySavings
        );
      }

      return { ...goal, estimatedMonths };
    });

    const insights = [];

    if (transactions.length === 0) {
      insights.push({
        id: "no-transactions",
        type: "info",
        title: "Start tracking your money",
        message:
          "Add your first transaction to unlock personalized spending trends and financial insights.",
        recommendation:
          "Record your income and expenses regularly to build a useful financial history.",
      });
    } else {
      if (expenseChangePercent !== null) {
        if (expenseChangePercent >= 20) {
          insights.push({
            id: "expense-increase",
            type: "warning",
            title: "Spending has increased",
            message: `Your recorded expenses are ${expenseChangePercent}% higher than last month.`,
            recommendation:
              "Review your highest-spending categories and identify expenses you can reduce.",
          });
        } else if (expenseChangePercent <= -10) {
          insights.push({
            id: "expense-decrease",
            type: "success",
            title: "You're spending less",
            message: `Your recorded expenses are ${Math.abs(expenseChangePercent)}% lower than last month.`,
            recommendation:
              "Keep reviewing your spending and consider directing any genuine surplus toward a savings goal.",
          });
        }
      } else if (previousExpense === 0 && totalExpense > 0) {
        insights.push({
          id: "new-expense-history",
          type: "info",
          title: "Your spending baseline is starting",
          message:
            "This is your first recorded month with expenses, so a month-to-month comparison isn't available yet.",
          recommendation:
            "Keep recording expenses so future comparisons can reveal meaningful trends.",
        });
      }

      if (savingsRate !== null && savingsRate < 0) {
        insights.push({
          id: "negative-balance",
          type: "warning",
          title: "Expenses exceed income",
          message:
            "Your recorded expenses are greater than your recorded income this month.",
          recommendation:
            "Review discretionary expenses and make sure upcoming bills are covered.",
        });
      } else if (savingsRate !== null && savingsRate >= 20) {
        insights.push({
          id: "positive-savings",
          type: "success",
          title: "Good savings progress",
          message: `Your recorded income exceeds expenses by ${savingsRate}% this month.`,
          recommendation:
            "Consider keeping part of this surplus for emergencies or your existing savings goals.",
        });
      }

      if (categories.length > 0) {
        const top = categories[0];

        insights.push({
          id: "top-category",
          type: "info",
          title: "Your biggest expense category",
          message: `${top.category} is your largest recorded expense category this month at ₹${top.spent.toLocaleString("en-IN")}.`,
          recommendation:
            "Review recent transactions in this category to find opportunities to save.",
        });
      }
    }

    budgetInsights.forEach((budget) => {
      if (budget.status === "exceeded") {
        insights.push({
          id: `budget-${budget.id}`,
          type: "warning",
          title: `${budget.category} budget exceeded`,
          message: `Recorded spending is ₹${Math.abs(budget.remaining).toLocaleString("en-IN")} above the ₹${budget.limit.toLocaleString("en-IN")} limit.`,
          recommendation:
            "Pause nonessential spending in this category and review the transactions counted toward this budget.",
        });
      } else if (budget.status === "warning") {
        insights.push({
          id: `budget-${budget.id}`,
          type: "warning",
          title: `${budget.category} budget is nearly used`,
          message: `${budget.percentUsed}% of this budget has been used.`,
          recommendation:
            "Check the remaining balance before making more purchases in this category.",
        });
      }
    });

    pendingBills.forEach((bill) => {
      if (bill.status === "overdue") {
        insights.push({
          id: `bill-${bill.id}`,
          type: "warning",
          title: `${bill.name} may be overdue`,
          message: `This unpaid bill is ₹${bill.amount.toLocaleString("en-IN")} and its due date has passed.`,
          recommendation:
            "Check the bill's actual payment status and pay it if it is still outstanding.",
        });
      } else if (bill.status === "due_soon") {
        insights.push({
          id: `bill-${bill.id}`,
          type: "info",
          title: `${bill.name} is due soon`,
          message: `This unpaid bill of ₹${bill.amount.toLocaleString("en-IN")} is due within 7 days.`,
          recommendation:
            "Set aside the required amount so you are prepared for the payment.",
        });
      }
    });

    goalsWithForecast.forEach((goal) => {
      if (goal.status === "completed") {
        insights.push({
          id: `goal-${goal.id}`,
          type: "success",
          title: `${goal.name} goal completed`,
          message: `You've reached your ₹${goal.target.toLocaleString("en-IN")} savings target.`,
          recommendation:
            "Celebrate your progress and decide whether to create your next savings goal.",
        });
      } else if (
        goal.status === "in_progress" &&
        goal.estimatedMonths !== null
      ) {
        insights.push({
          id: `goal-forecast-${goal.id}`,
          type: "info",
          title: `${goal.name} savings forecast`,
          message: `At your historical average monthly net savings, this goal could take approximately ${goal.estimatedMonths} more month(s).`,
          recommendation:
            "This is a rough estimate, not a guarantee. Keep your goal contribution and spending history up to date.",
        });
      }
    });

    if (insights.length === 0) {
      insights.push({
        id: "steady",
        type: "info",
        title: "Keep building your financial history",
        message:
          "There are no significant alerts from the records currently available.",
        recommendation:
          "Continue recording transactions, budgets, goals, and bill payments to improve your insights.",
      });
    }

    return res.status(200).json({
      generatedAt: now.toISOString(),
      period: {
        currentMonth,
        previousMonth,
      },
      summary: {
        totalIncome,
        totalExpense,
        balance,
        savingsRate,
        previousIncome,
        previousExpense,
        expenseChangePercent,
        transactionCount: currentTransactions.length,
        totalTransactions: transactions.length,
      },
      categories: categoryTrends,
      budgets: budgetInsights,
      goals: goalsWithForecast,
      bills: {
        pendingCount: pendingBills.length,
        pendingAmount: pendingBillAmount,
        items: pendingBills,
      },
      insights,
      methodology: {
        type: "rule_based",
        note:
          "Insights use recorded financial data. Budget spending is matched by category to this month's expenses; forecasts are estimates and may not reflect future changes.",
      },
    });
  } catch (error) {
    console.error("Intelligence Center error:", error);

    return res.status(500).json({
      message: "Unable to generate financial insights.",
    });
  }
};

module.exports = {
  getIntelligence,
};
