
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

function addMonths(date, months) {
  const result = new Date(date);
  const originalDay = result.getDate();

  result.setDate(1);
  result.setMonth(result.getMonth() + months);

  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0
  ).getDate();

  result.setDate(Math.min(originalDay, lastDay));
  return result;
}

function buildGoalPlan(goal, averageMonthlyNetSavings, today) {
  const targetAmount = Number(goal.target_amount) || 0;
  const currentAmount = Number(goal.current_amount) || 0;
  const remainingAmount = Math.max(0, targetAmount - currentAmount);

  const progress = targetAmount > 0
    ? Math.min(100, Math.max(0, (currentAmount / targetAmount) * 100))
    : 0;

  const deadline = goal.deadline ? parseDate(goal.deadline) : null;
  const daysRemaining = deadline
    ? Math.ceil((deadline - today) / (24 * 60 * 60 * 1000))
    : null;

  const completed = remainingAmount <= 0;
  const overdue = !completed && deadline !== null && daysRemaining < 0;

  let requiredMonthly = null;
  let requiredWeekly = null;

  if (!completed && deadline && daysRemaining > 0) {
    const monthsRemaining = daysRemaining / 30.4375;
    const weeksRemaining = daysRemaining / 7;

    requiredMonthly = roundMoney(remainingAmount / monthsRemaining);
    requiredWeekly = roundMoney(remainingAmount / weeksRemaining);
  }

  let estimatedMonths = null;
  let projectedCompletionDate = null;

  if (completed) {
    estimatedMonths = 0;
    projectedCompletionDate = dateKey(today);
  } else if (averageMonthlyNetSavings > 0) {
    estimatedMonths = Math.ceil(remainingAmount / averageMonthlyNetSavings);
    projectedCompletionDate = dateKey(addMonths(today, estimatedMonths));
  }

  let status;

  if (completed) {
    status = "completed";
  } else if (overdue) {
    status = "overdue";
  } else if (requiredMonthly === null) {
    status = "no_deadline";
  } else if (averageMonthlyNetSavings <= 0) {
    status = "needs_attention";
  } else if (averageMonthlyNetSavings >= requiredMonthly) {
    status = "on_track";
  } else {
    status = "needs_attention";
  }

  return {
    id: goal.id,
    goalName: goal.goal_name,
    targetAmount: roundMoney(targetAmount),
    currentAmount: roundMoney(currentAmount),
    remainingAmount: roundMoney(remainingAmount),
    progress: roundMoney(progress),
    deadline: deadline ? dateKey(deadline) : null,
    daysRemaining,
    requiredMonthly,
    requiredWeekly,
    averageMonthlyNetSavings: roundMoney(averageMonthlyNetSavings),
    estimatedMonths,
    projectedCompletionDate,
    status,
  };
}

async function getGoalPlanner(req, res) {
  const userId = Number(req.query.user_id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      message: "A valid user_id query parameter is required.",
    });
  }

  try {
    const today = new Date();
today.setHours(0, 0, 0, 0);
    const currentMonthStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    // Use three completed calendar months to avoid comparing partial months.
    const historyStart = new Date(
      today.getFullYear(),
      today.getMonth() - 3,
      1
    );

    const [goals, transactions] = await Promise.all([
      query(
        `SELECT id, goal_name, target_amount, current_amount, deadline
         FROM goals
         WHERE user_id = ?
         ORDER BY deadline ASC, id DESC`,
        [userId]
      ),
      query(
        `SELECT type, amount, transaction_date
         FROM transactions
         WHERE user_id = ?
           AND transaction_date >= ?
           AND transaction_date < ?`,
        [
          userId,
          dateKey(historyStart),
          dateKey(currentMonthStart),
        ]
      ),
    ]);

    const monthlyNet = new Map();

    // Include months without transactions as zero-net months.
    for (let offset = 0; offset < 3; offset++) {
      const monthDate = new Date(
        historyStart.getFullYear(),
        historyStart.getMonth() + offset,
        1
      );

      const key = `${monthDate.getFullYear()}-${String(
        monthDate.getMonth() + 1
      ).padStart(2, "0")}`;

      monthlyNet.set(key, 0);
    }

    for (const transaction of transactions) {
      const date = parseDate(transaction.transaction_date);
      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthlyNet.has(key)) continue;

      const amount = Number(transaction.amount) || 0;
      const type = String(transaction.type || "").toLowerCase();

      if (type === "income") {
        monthlyNet.set(key, monthlyNet.get(key) + amount);
      } else if (type === "expense") {
        monthlyNet.set(key, monthlyNet.get(key) - amount);
      }
    }

    const averageMonthlyNetSavings =
      Array.from(monthlyNet.values()).reduce((sum, value) => sum + value, 0) /
      3;

    const plans = goals.map((goal) =>
      buildGoalPlan(goal, averageMonthlyNetSavings, today)
    );

    const totals = plans.reduce(
      (result, plan) => {
        result.targetAmount += plan.targetAmount;
        result.currentAmount += plan.currentAmount;
        result.remainingAmount += plan.remainingAmount;

        if (plan.status === "completed") result.completedGoals += 1;
        if (plan.status === "overdue") result.overdueGoals += 1;
        if (plan.status === "needs_attention") result.needsAttentionGoals += 1;

        return result;
      },
      {
        targetAmount: 0,
        currentAmount: 0,
        remainingAmount: 0,
        completedGoals: 0,
        overdueGoals: 0,
        needsAttentionGoals: 0,
      }
    );

    return res.json({
      generatedAt: new Date().toISOString(),
      historyMonths: 3,
      averageMonthlyNetSavings: roundMoney(averageMonthlyNetSavings),
      totals: {
        targetAmount: roundMoney(totals.targetAmount),
        currentAmount: roundMoney(totals.currentAmount),
        remainingAmount: roundMoney(totals.remainingAmount),
        totalGoals: plans.length,
        completedGoals: totals.completedGoals,
        overdueGoals: totals.overdueGoals,
        needsAttentionGoals: totals.needsAttentionGoals,
      },
      goals: plans,
      methodology:
        "Monthly and weekly targets divide the remaining goal amount by the time until its deadline. The estimated completion date uses average net income minus expenses from the three most recently completed calendar months. Overall net cash flow is only a rough proxy for money available for a particular goal; actual results depend on how much you allocate to that goal.",
    });
  } catch (error) {
    console.error("Goal planner error:", error);

    return res.status(500).json({
      message: "Unable to calculate goal plans.",
    });
  }
}

module.exports = { getGoalPlanner };
