
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

function nextMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDate(value) {
  if (value instanceof Date) return value;

  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);

  return new Date(year, month - 1, day || 1);
}

function monthLabel(date) {
  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function formatCategory(category) {
  return String(category || "Uncategorized").trim() || "Uncategorized";
}

function money(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

async function getSpendingRecommendations(req, res) {
  const userId = Number(req.query.user_id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      message: "A valid user_id query parameter is required.",
    });
  }

  try {
    const today = new Date();

    const currentStart = monthStart(today);
    const previousStart = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );

    const comparisonDay = Math.min(
      today.getDate(),
      new Date(
        previousStart.getFullYear(),
        previousStart.getMonth() + 1,
        0
      ).getDate()
    );

    const previousComparisonEnd = new Date(
      previousStart.getFullYear(),
      previousStart.getMonth(),
      comparisonDay + 1
    );

    const currentEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    const rows = await query(
      `SELECT category, type, amount, transaction_date
       FROM transactions
       WHERE user_id = ?
         AND transaction_date >= ?
         AND transaction_date < ?
       ORDER BY transaction_date ASC`,
      [userId, dateKey(previousStart), dateKey(currentEnd)]
    );

    const currentCategories = new Map();
    const previousCategories = new Map();

    let currentIncome = 0;
    let currentExpense = 0;
    let previousIncome = 0;
    let previousExpense = 0;

    for (const row of rows) {
      const date = parseDate(row.transaction_date);
      const type = String(row.type || "").toLowerCase();
      const amount = Number(row.amount) || 0;
      const category = formatCategory(row.category);
      const normalizedCategory = category.toLowerCase();

      if (type !== "income" && type !== "expense") continue;

      const isCurrentMonth =
        date >= currentStart && date < currentEnd;

      const isPreviousComparisonPeriod =
        date >= previousStart && date < previousComparisonEnd;

      if (isCurrentMonth) {
        if (type === "income") currentIncome += amount;

        if (type === "expense") {
          currentExpense += amount;

          const existing = currentCategories.get(normalizedCategory) || {
            category,
            amount: 0,
            transactions: 0,
          };

          existing.amount += amount;
          existing.transactions += 1;

          currentCategories.set(normalizedCategory, existing);
        }
      } else if (isPreviousComparisonPeriod) {
        if (type === "income") previousIncome += amount;

        if (type === "expense") {
          previousExpense += amount;

          const existing = previousCategories.get(normalizedCategory) || {
            category,
            amount: 0,
            transactions: 0,
          };

          existing.amount += amount;
          existing.transactions += 1;

          previousCategories.set(normalizedCategory, existing);
        }
      }
    }

    const allCategoryKeys = new Set([
      ...currentCategories.keys(),
      ...previousCategories.keys(),
    ]);

    const categoryComparison = Array.from(allCategoryKeys)
      .map((key) => {
        const current = currentCategories.get(key);
        const previous = previousCategories.get(key);

        const currentAmount = money(current?.amount || 0);
        const previousAmount = money(previous?.amount || 0);
        const difference = money(currentAmount - previousAmount);

        const changePercent =
          previousAmount > 0
            ? money((difference / previousAmount) * 100)
            : null;

        return {
          category: current?.category || previous?.category || "Uncategorized",
          currentAmount,
          previousAmount,
          difference,
          changePercent,
          currentTransactions: current?.transactions || 0,
          previousTransactions: previous?.transactions || 0,
        };
      })
      .sort((a, b) => b.currentAmount - a.currentAmount);

    const recommendations = [];

    // Recommend reviewing categories that increased substantially.
    const increases = categoryComparison
      .filter(
        (item) =>
          item.previousAmount > 0 &&
          item.difference > 0 &&
          item.changePercent >= 20 &&
          item.difference >= 100
      )
      .sort((a, b) => b.difference - a.difference);

    for (const item of increases.slice(0, 3)) {
      recommendations.push({
        id: `increase-${item.category.toLowerCase()}`,
        type: "warning",
        title: `${item.category} spending increased`,
        message: `You spent ₹${item.currentAmount.toLocaleString("en-IN")} so far this month, compared with ₹${item.previousAmount.toLocaleString("en-IN")} during the equivalent period last month.`,
        recommendation: `Review recent ${item.category.toLowerCase()} transactions and consider setting a spending limit.`,
        category: item.category,
        currentAmount: item.currentAmount,
        previousAmount: item.previousAmount,
        difference: item.difference,
        changePercent: item.changePercent,
      });
    }

    // Show the largest current expense categories.
    const topCategories = categoryComparison
      .filter((item) => item.currentAmount > 0)
      .slice(0, 3);

    if (currentExpense > 0 && topCategories.length > 0) {
      const top = topCategories[0];
      const share = (top.currentAmount / currentExpense) * 100;

      recommendations.push({
        id: "top-category",
        type: "info",
        title: `${top.category} is your largest expense`,
        message: `${top.category} accounts for ${share.toFixed(1)}% of your recorded expenses so far this month.`,
        recommendation:
          share >= 40
            ? `Review your ${top.category.toLowerCase()} transactions and decide whether any costs can be reduced.`
            : "Keep tracking your largest expense categories to understand where your money goes.",
        category: top.category,
        currentAmount: top.currentAmount,
        sharePercent: money(share),
      });
    }

    // Celebrate meaningful decreases.
    const decreases = categoryComparison
      .filter(
        (item) =>
          item.previousAmount > 0 &&
          item.difference < 0 &&
          item.changePercent <= -15 &&
          Math.abs(item.difference) >= 100
      )
      .sort((a, b) => a.difference - b.difference);

    for (const item of decreases.slice(0, 2)) {
      recommendations.push({
        id: `decrease-${item.category.toLowerCase()}`,
        type: "success",
        title: `Good progress on ${item.category}`,
        message: `Your recorded ${item.category.toLowerCase()} spending is down ${Math.abs(item.changePercent).toFixed(1)}% compared with the equivalent period last month.`,
        recommendation:
          "Keep the habits that helped you reduce spending, provided they still meet your needs.",
        category: item.category,
        currentAmount: item.currentAmount,
        previousAmount: item.previousAmount,
        difference: item.difference,
        changePercent: item.changePercent,
      });
    }

    if (currentIncome > 0 && currentExpense > currentIncome) {
      recommendations.unshift({
        id: "expenses-exceed-income",
        type: "warning",
        title: "Expenses are higher than income",
        message: `Recorded expenses are ₹${money(currentExpense - currentIncome).toLocaleString("en-IN")} higher than recorded income so far this month.`,
        recommendation:
          "Review non-essential expenses and check that all income and transactions have been recorded.",
      });
    }

    if (recommendations.length === 0) {
      if (currentExpense === 0 && currentIncome === 0) {
        recommendations.push({
          id: "add-transactions",
          type: "info",
          title: "Start tracking your spending",
          message: "There is not enough transaction data for personalized suggestions yet.",
          recommendation:
            "Add your income and expense transactions to receive useful spending insights.",
        });
      } else {
        recommendations.push({
          id: "steady-spending",
          type: "success",
          title: "Keep tracking your finances",
          message:
            "No major spending changes matched the current recommendation rules.",
          recommendation:
            "Continue recording transactions so future suggestions can be more specific.",
        });
      }
    }

    const savingsDifference = money(
      (currentIncome - currentExpense) - (previousIncome - previousExpense)
    );

    return res.json({
      period: {
        current: monthLabel(today),
        previous: monthLabel(previousStart),
        comparison: `First ${today.getDate()} day(s) of the current month versus the first ${comparisonDay} day(s) of the previous month`,
      },
      summary: {
        currentIncome: money(currentIncome),
        currentExpense: money(currentExpense),
        previousIncome: money(previousIncome),
        previousExpense: money(previousExpense),
        savingsDifference,
        categoryCount: currentCategories.size,
      },
      categories: categoryComparison,
      topCategories,
      recommendations,
      methodology:
        "Suggestions are generated from transaction records using transparent rules. They are not predictions, and potential savings are not guaranteed.",
    });
  } catch (error) {
    console.error("Spending recommendations error:", error);

    return res.status(500).json({
      message: "Unable to generate spending recommendations.",
    });
  }
}

module.exports = { getSpendingRecommendations };
