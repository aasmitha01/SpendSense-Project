
const db = require("../config/db");

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
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

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

async function getFutureBalance(req, res) {
  const userId = Number(req.query.user_id);
  const openingBalance = Number(req.query.current_balance);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      message: "A valid user_id query parameter is required.",
    });
  }

  if (
    req.query.current_balance === undefined ||
    req.query.current_balance === "" ||
    !Number.isFinite(openingBalance) ||
    Math.abs(openingBalance) > 1000000000000
  ) {
    return res.status(400).json({
      message: "Enter a valid current balance.",
    });
  }

  try {
    const today = new Date();
    const currentMonthStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    // Three fully completed calendar months.
    const historyStart = new Date(
      today.getFullYear(),
      today.getMonth() - 3,
      1
    );

    const transactions = await query(
      `SELECT type, amount, transaction_date
       FROM transactions
       WHERE user_id = ?
         AND transaction_date >= ?
         AND transaction_date < ?
       ORDER BY transaction_date ASC`,
      [userId, dateKey(historyStart), dateKey(currentMonthStart)]
    );

    const monthlyTotals = new Map();

    for (let offset = 0; offset < 3; offset++) {
      const monthDate = new Date(
        historyStart.getFullYear(),
        historyStart.getMonth() + offset,
        1
      );

      const key = `${monthDate.getFullYear()}-${String(
        monthDate.getMonth() + 1
      ).padStart(2, "0")}`;

      monthlyTotals.set(key, {
        month: monthDate.toLocaleDateString("en-IN", { month: "short" }),
        income: 0,
        expenses: 0,
      });
    }

    for (const transaction of transactions) {
      const date = parseDate(transaction.transaction_date);
      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      const totals = monthlyTotals.get(key);
      if (!totals) continue;

      const amount = Number(transaction.amount) || 0;
      const type = String(transaction.type || "").toLowerCase();

      if (type === "income") totals.income += amount;
      if (type === "expense") totals.expenses += amount;
    }

    const history = Array.from(monthlyTotals.entries()).map(
      ([yearMonth, totals]) => ({
        yearMonth,
        month: totals.month,
        income: roundMoney(totals.income),
        expenses: roundMoney(totals.expenses),
        net: roundMoney(totals.income - totals.expenses),
      })
    );

    const averageMonthlyIncome =
      history.reduce((sum, month) => sum + month.income, 0) / 3;

    const averageMonthlyExpenses =
      history.reduce((sum, month) => sum + month.expenses, 0) / 3;

    const averageMonthlyNet =
      averageMonthlyIncome - averageMonthlyExpenses;

    const forecastDays = [0, 30, 60, 90];

    const forecast = forecastDays.map((days) => {
      const projectedChange = averageMonthlyNet * (days / 30.4375);

      return {
        days,
        label: days === 0 ? "Today" : `${days} days`,
        projectedChange: roundMoney(projectedChange),
        projectedBalance: roundMoney(openingBalance + projectedChange),
      };
    });

    const projected90DayBalance = forecast[forecast.length - 1].projectedBalance;

    let outlook = "stable";

    if (averageMonthlyNet > 0.01) outlook = "improving";
    else if (averageMonthlyNet < -0.01) outlook = "declining";

    return res.json({
      generatedAt: new Date().toISOString(),
      currentBalance: roundMoney(openingBalance),
      averageMonthlyIncome: roundMoney(averageMonthlyIncome),
      averageMonthlyExpenses: roundMoney(averageMonthlyExpenses),
      averageMonthlyNet: roundMoney(averageMonthlyNet),
      outlook,
      forecast,
      history,
      warnings: [
        ...(averageMonthlyNet < 0
          ? ["Your recent historical cash flow is negative."]
          : []),
        ...(projected90DayBalance < 0
          ? ["Your estimated balance may become negative within 90 days."]
          : []),
        ...(transactions.length === 0
          ? ["No transactions were found in the three completed months used for this forecast."]
          : []),
      ],
      methodology:
        "Forecasts assume your average monthly income and expenses from the three most recently completed calendar months continue at a similar rate. They start from the current balance you entered and do not include future one-off expenses, changes in income, transfers, interest, or investment returns. This is an estimate, not a guarantee.",
    });
  } catch (error) {
    console.error("Future balance prediction error:", error);

    return res.status(500).json({
      message: "Unable to calculate the future balance forecast.",
    });
  }
}

module.exports = { getFutureBalance };
