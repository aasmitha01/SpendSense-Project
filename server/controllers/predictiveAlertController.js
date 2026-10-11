
const db = require("../config/db");

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
}

const roundMoney = (value) =>
  Math.round((Number(value) || 0) * 100) / 100;

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function getPredictiveAlerts(req, res) {
  const userId = Number(req.query.user_id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      message: "A valid user_id is required.",
    });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yearStart = new Date(today.getFullYear(), 0, 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const nextDay = new Date(today);
    nextDay.setDate(nextDay.getDate() + 1);

    const budgets = await query(
      `SELECT id, category, limit_amount, period
       FROM budgets
       WHERE user_id = ?`,
      [userId]
    );

    const transactions = await query(
      `SELECT category, amount, transaction_date
       FROM transactions
       WHERE user_id = ?
         AND type = 'expense'
         AND transaction_date >= ?
         AND transaction_date < ?`,
      [userId, dateKey(yearStart), dateKey(nextDay)]
    );

    const alerts = [];
    const currentDay = today.getDate();
    const daysInMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate();

    const daysInYear = (
      new Date(today.getFullYear(), 11, 31) -
      new Date(today.getFullYear(), 0, 1)
    ) / 86400000 + 1;

    const dayOfYear = Math.floor(
      (today - yearStart) / 86400000
    ) + 1;

    for (const budget of budgets) {
      const limit = Number(budget.limit_amount) || 0;
      if (limit <= 0) continue;

      const period = String(budget.period || "monthly").toLowerCase();
      const isYearly = period.includes("year");

      // Treat non-yearly budgets as monthly, matching the existing budget page.
      const startDate = isYearly ? yearStart : monthStart;
      const elapsedDays = isYearly ? dayOfYear : currentDay;
      const totalDays = isYearly ? daysInYear : daysInMonth;

      const categoryTransactions = transactions.filter((transaction) => {
        const categoryMatches =
          String(transaction.category || "").trim().toLowerCase() ===
          String(budget.category || "").trim().toLowerCase();

        if (!categoryMatches) return false;

        const transactionDate =
          transaction.transaction_date instanceof Date
            ? dateKey(transaction.transaction_date)
            : String(transaction.transaction_date).slice(0, 10);

        return (
          transactionDate >= dateKey(startDate) &&
          transactionDate < dateKey(nextDay)
        );
      });

      const spent = roundMoney(
        categoryTransactions.reduce(
          (sum, transaction) => sum + Number(transaction.amount || 0),
          0
        )
      );

      const usagePercent = (spent / limit) * 100;
      const projectedSpend = roundMoney(
        elapsedDays > 0 ? (spent / elapsedDays) * totalDays : 0
      );
      const projectedPercent = (projectedSpend / limit) * 100;
      const remaining = roundMoney(limit - spent);

      let severity = "";
      let title = "";
      let message = "";
      let recommendation = "";

      if (spent > limit) {
        severity = "critical";
        title = `${budget.category}: budget exceeded`;
        message = `You've spent ₹${spent.toFixed(2)} against a ₹${limit.toFixed(2)} ${period} budget.`;
        recommendation = "Review recent purchases and reduce further spending in this category.";
      } else if (projectedSpend > limit && projectedPercent >= 100) {
        severity = "warning";
        title = `${budget.category}: likely to exceed budget`;
        message = `At your current spending pace, spending may reach ₹${projectedSpend.toFixed(2)} by the end of this ${isYearly ? "year" : "month"}, against a ₹${limit.toFixed(2)} limit.`;
        recommendation = "Consider reducing discretionary spending for the rest of the period.";
      } else if (usagePercent >= 80) {
        severity = "warning";
        title = `${budget.category}: budget nearly used`;
        message = `You've used ${usagePercent.toFixed(0)}% of your budget, with ₹${Math.max(0, remaining).toFixed(2)} remaining.`;
        recommendation = "Check your remaining planned expenses before making new purchases.";
      } else {
        continue;
      }

      alerts.push({
        id: `budget-${budget.id}-${severity}`,
        budgetId: budget.id,
        category: budget.category,
        period,
        severity,
        title,
        message,
        recommendation,
        spent,
        limit,
        remaining: Math.max(0, remaining),
        usagePercent: roundMoney(usagePercent),
        projectedSpend,
        projectedPercent: roundMoney(projectedPercent),
        generatedAt: new Date().toISOString(),
      });
    }

    const priority = { critical: 0, warning: 1, info: 2 };
    alerts.sort(
      (a, b) =>
        priority[a.severity] - priority[b.severity] ||
        b.projectedPercent - a.projectedPercent
    );

    return res.json({
      alerts,
      count: alerts.length,
      generatedAt: new Date().toISOString(),
      methodology:
        "Predictions extrapolate current period spending using average daily expenses. Actual spending can differ.",
    });
  } catch (error) {
    console.error("Predictive budget alerts error:", error);
    return res.status(500).json({
      message: "Unable to calculate predictive budget alerts.",
    });
  }
}

module.exports = { getPredictiveAlerts };
