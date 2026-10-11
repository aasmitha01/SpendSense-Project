
const db = require("../config/db");

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
}

function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatMonth(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function parseDate(value) {
  if (value instanceof Date) return value;

  // Avoid timezone shifts for MySQL DATE strings.
  const valueString = String(value).slice(0, 10);
  const [year, month, day] = valueString.split("-").map(Number);

  return new Date(year, month - 1, day || 1);
}

function calculateFactorScores({ income, expense, budgets, goals, monthlyExpenses, yearlyExpenses }) {
  const factors = [];
  const netSavings = income - expense;

  // Savings behavior: maximum weight 40.
  if (income > 0) {
    const savingsRate = (netSavings / income) * 100;
    let points = 0;

    if (savingsRate >= 20) points = 40;
    else if (savingsRate >= 10) points = 30;
    else if (savingsRate > 0) points = 20;
    else if (savingsRate === 0) points = 10;

    factors.push({
      key: "savings",
      label: "Savings behavior",
      score: points,
      maxScore: 40,
      detail: `Your current-month savings rate is ${savingsRate.toFixed(1)}%.`,
    });
  }

  // Budget control: maximum weight 35.
  if (budgets.length > 0) {
    const budgetScores = budgets.map((budget) => {
      const limit = Number(budget.limit_amount) || 0;
      const period = String(budget.period || "monthly").toLowerCase();

      const spent =
        period.includes("year")
          ? yearlyExpenses[String(budget.category || "").toLowerCase()] || 0
          : monthlyExpenses[String(budget.category || "").toLowerCase()] || 0;

      if (limit <= 0) return 0;

      const usage = (spent / limit) * 100;

      if (usage <= 70) return 1;
      if (usage <= 85) return 0.8;
      if (usage <= 100) return 0.6;
      return 0.2;
    });

    const average = budgetScores.reduce((sum, score) => sum + score, 0) / budgetScores.length;

    factors.push({
      key: "budget",
      label: "Budget control",
      score: Math.round(average * 35),
      maxScore: 35,
      detail: "Based on spending against your saved budgets.",
    });
  }

  // Goal progress: maximum weight 25.
  const validGoals = goals.filter((goal) => Number(goal.target_amount) > 0);

  if (validGoals.length > 0) {
    const averageProgress =
      validGoals.reduce((sum, goal) => {
        const target = Number(goal.target_amount) || 0;
        const saved = Number(goal.current_amount) || 0;

        return sum + Math.min(100, Math.max(0, (saved / target) * 100));
      }, 0) / validGoals.length;

    factors.push({
      key: "goals",
      label: "Savings-goal progress",
      score: Math.round((averageProgress / 100) * 25),
      maxScore: 25,
      detail: `Your average goal progress is ${averageProgress.toFixed(1)}%.`,
    });
  }

  const availablePoints = factors.reduce((sum, factor) => sum + factor.score, 0);
  const availableWeight = factors.reduce((sum, factor) => sum + factor.maxScore, 0);

  return {
    score:
      availableWeight > 0
        ? Math.max(0, Math.min(100, Math.round((availablePoints / availableWeight) * 100)))
        : null,
    factors,
    availableFactors: factors.length,
    totalFactors: 3,
  };
}

async function getIntelligenceHealth(req, res) {
  const userId = Number(req.query.user_id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      message: "A valid user_id query parameter is required.",
    });
  }

  try {
    const now = new Date();
    const currentMonthStart = monthStart(now);
    const sixMonthStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const currentMonthKey = formatMonth(currentMonthStart);
    const sixMonthStartKey = formatMonth(sixMonthStart);
    const yearStartKey = formatMonth(yearStart);

    const [transactions, budgets, goals] = await Promise.all([
      query(
        `SELECT type, category, amount, transaction_date
         FROM transactions
         WHERE user_id = ? AND transaction_date >= ?`,
        [userId, `${yearStartKey}-01`]
      ),
      query(
        `SELECT category, limit_amount, period
         FROM budgets
         WHERE user_id = ?`,
        [userId]
      ),
      query(
        `SELECT goal_name, target_amount, current_amount
         FROM goals
         WHERE user_id = ?`,
        [userId]
      ),
    ]);

    const monthMap = new Map();
    const monthlyExpenses = {};
    const yearlyExpenses = {};

    // Pre-create all six months, including months without transactions.
    for (let offset = 0; offset < 6; offset++) {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - offset), 1);
      const key = formatMonth(date);

      monthMap.set(key, {
        month: date.toLocaleDateString("en-US", { month: "short" }),
        yearMonth: key,
        income: 0,
        expense: 0,
        net: 0,
      });
    }

    let currentIncome = 0;
    let currentExpense = 0;

    for (const transaction of transactions) {
      const amount = Number(transaction.amount) || 0;
      const type = String(transaction.type || "").toLowerCase();
      const date = parseDate(transaction.transaction_date);
      const key = formatMonth(date);
      const categoryKey = String(transaction.category || "").toLowerCase();

      if (type === "expense") {
        yearlyExpenses[categoryKey] = (yearlyExpenses[categoryKey] || 0) + amount;
      }

      if (key >= currentMonthKey) {
        if (type === "income") currentIncome += amount;
        if (type === "expense") {
          currentExpense += amount;
          monthlyExpenses[categoryKey] = (monthlyExpenses[categoryKey] || 0) + amount;
        }
      }

      const month = monthMap.get(key);

      if (month) {
        if (type === "income") month.income += amount;
        if (type === "expense") month.expense += amount;
      }
    }

    const trend = Array.from(monthMap.values()).map((month) => ({
      ...month,
      net: Number((month.income - month.expense).toFixed(2)),
      income: Number(month.income.toFixed(2)),
      expense: Number(month.expense.toFixed(2)),
    }));

    const health = calculateFactorScores({
      income: currentIncome,
      expense: currentExpense,
      budgets,
      goals,
      monthlyExpenses,
      yearlyExpenses,
    });

    const scoreLabel =
      health.score === null
        ? "Not enough data"
        : health.score >= 80
          ? "Strong"
          : health.score >= 60
            ? "Good"
            : health.score >= 40
              ? "Needs attention"
              : "Needs improvement";

    return res.json({
      generatedAt: new Date().toISOString(),
      health: {
        score: health.score,
        label: scoreLabel,
        availableFactors: health.availableFactors,
        totalFactors: health.totalFactors,
        factors: health.factors,
        currentMonth: currentMonthKey,
      },
      trend,
      methodology:
        "An educational estimate based on current-month savings, saved budget usage, and savings-goal progress. Missing categories are excluded and remaining categories are normalized. It is not a credit score or professional financial advice.",
    });
  } catch (error) {
    console.error("Intelligence health error:", error);

    return res.status(500).json({
      message: "Unable to calculate financial health and spending trends.",
    });
  }
}

module.exports = { getIntelligenceHealth };
