
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

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function money(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

async function findOwnedChallenge(challengeId, userId) {
  const rows = await query(
    `SELECT * FROM savings_challenges WHERE id = ? AND user_id = ?`,
    [challengeId, userId]
  );

  return rows[0] || null;
}

async function listChallenges(req, res) {
  const userId = Number(req.query.user_id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "A valid user_id is required." });
  }

  try {
    const rows = await query(
      `SELECT
          c.*,
          COUNT(l.id) AS check_in_count
       FROM savings_challenges c
       LEFT JOIN savings_challenge_logs l
         ON l.challenge_id = c.id AND l.user_id = c.user_id
       WHERE c.user_id = ?
       GROUP BY c.id
       ORDER BY
         CASE c.status WHEN 'active' THEN 0 WHEN 'completed' THEN 1 ELSE 2 END,
         c.created_at DESC`,
      [userId]
    );

    const challenges = rows.map((challenge) => {
      const checkInCount = Number(challenge.check_in_count) || 0;
      const target = Number(challenge.target_amount) || 0;
      const saved = Number(challenge.saved_amount) || 0;
      const isNoSpend = challenge.challenge_type === "no_spend";

      const progress = isNoSpend
        ? Math.min(100, (checkInCount / Number(challenge.duration_days || 1)) * 100)
        : target > 0
          ? Math.min(100, (saved / target) * 100)
          : 0;

      return {
        ...challenge,
        target_amount: target,
        saved_amount: saved,
        duration_days: Number(challenge.duration_days),
        check_in_count: checkInCount,
        progress: money(progress),
        remaining_amount: money(Math.max(0, target - saved)),
      };
    });

    return res.json({ challenges });
  } catch (error) {
    console.error("List savings challenges error:", error);
    return res.status(500).json({ message: "Unable to load challenges." });
  }
}

async function createChallenge(req, res) {
  const userId = Number(req.body.user_id);
  const {
    title,
    challenge_type: challengeType,
    target_amount: targetAmountInput,
    duration_days: durationDaysInput,
    start_date: startDateInput,
    category,
  } = req.body;

  const allowedTypes = ["weekly_savings", "no_spend", "custom"];
  const targetAmount = Number(targetAmountInput);
  const durationDays = Number(durationDaysInput);
  const startDate = startDateInput || dateKey(new Date());

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "A valid user_id is required." });
  }

  if (!title || !String(title).trim() || String(title).trim().length > 150) {
    return res.status(400).json({ message: "Enter a title up to 150 characters." });
  }

  if (!allowedTypes.includes(challengeType)) {
    return res.status(400).json({ message: "Choose a valid challenge type." });
  }

  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 366) {
    return res.status(400).json({ message: "Duration must be between 1 and 366 days." });
  }

  if (!validDate(startDate)) {
    return res.status(400).json({ message: "Enter a valid start date." });
  }

  if (challengeType !== "no_spend" &&
      (!Number.isFinite(targetAmount) || targetAmount <= 0 || targetAmount > 1000000000)) {
    return res.status(400).json({ message: "Enter a valid positive savings target." });
  }

  if (challengeType === "no_spend" && category && String(category).length > 100) {
    return res.status(400).json({ message: "Category must be 100 characters or fewer." });
  }

  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + durationDays - 1);
  const endDate = end.toISOString().slice(0, 10);

  try {
    const result = await query(
      `INSERT INTO savings_challenges
        (user_id, title, challenge_type, target_amount, saved_amount,
         duration_days, start_date, end_date, category, status)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, 'active')`,
      [
        userId,
        String(title).trim(),
        challengeType,
        challengeType === "no_spend" ? 0 : money(targetAmount),
        durationDays,
        startDate,
        endDate,
        category ? String(category).trim() : null,
      ]
    );

    return res.status(201).json({
      message: "Savings challenge created successfully.",
      challengeId: result.insertId,
    });
  } catch (error) {
    console.error("Create savings challenge error:", error);
    return res.status(500).json({ message: "Unable to create challenge." });
  }
}

async function logChallengeActivity(req, res) {
  const challengeId = Number(req.params.id);
  const userId = Number(req.body.user_id);
  const logDate = req.body.log_date || dateKey(new Date());
  const amountInput = req.body.amount;
  const note = req.body.note ? String(req.body.note).trim() : null;

  if (!Number.isInteger(challengeId) || challengeId <= 0 ||
      !Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "A valid challenge ID and user ID are required." });
  }

  if (!validDate(logDate)) {
    return res.status(400).json({ message: "Enter a valid check-in date." });
  }

  if (note && note.length > 255) {
    return res.status(400).json({ message: "Note must be 255 characters or fewer." });
  }

  try {
    const challenge = await findOwnedChallenge(challengeId, userId);

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found." });
    }

    if (challenge.status !== "active") {
      return res.status(400).json({ message: "Only active challenges can be updated." });
    }

    if (logDate < String(challenge.start_date).slice(0, 10) ||
        logDate > String(challenge.end_date).slice(0, 10)) {
      return res.status(400).json({
        message: "The check-in date must fall within the challenge dates.",
      });
    }

    const isNoSpend = challenge.challenge_type === "no_spend";
    const amount = isNoSpend ? 0 : Number(amountInput);

    if (!isNoSpend && (!Number.isFinite(amount) || amount <= 0 || amount > 1000000000)) {
      return res.status(400).json({ message: "Enter a positive contribution amount." });
    }

    if (isNoSpend && amountInput !== undefined && Number(amountInput) !== 0) {
      return res.status(400).json({
        message: "No-spend check-ins cannot record a savings contribution.",
      });
    }

    await query(
      `INSERT INTO savings_challenge_logs
        (challenge_id, user_id, log_date, amount, note)
       VALUES (?, ?, ?, ?, ?)`,
      [challengeId, userId, logDate, money(amount), note]
    );

    if (!isNoSpend) {
      await query(
        `UPDATE savings_challenges
         SET saved_amount = saved_amount + ?
         WHERE id = ? AND user_id = ?`,
        [money(amount), challengeId, userId]
      );
    }

    const updated = await findOwnedChallenge(challengeId, userId);

    const logRows = await query(
      `SELECT COUNT(*) AS check_in_count
       FROM savings_challenge_logs
       WHERE challenge_id = ? AND user_id = ?`,
      [challengeId, userId]
    );

    const saved = Number(updated.saved_amount) || 0;
    const target = Number(updated.target_amount) || 0;
    const checkInCount = Number(logRows[0]?.check_in_count) || 0;

    const completed = isNoSpend
      ? checkInCount >= Number(updated.duration_days)
      : saved >= target;

    if (completed) {
      await query(
        `UPDATE savings_challenges
         SET status = 'completed'
         WHERE id = ? AND user_id = ? AND status = 'active'`,
        [challengeId, userId]
      );
    }

    return res.status(201).json({
      message: completed ? "Challenge completed! Congratulations!" : "Progress recorded.",
      challengeId,
      savedAmount: saved,
      targetAmount: target,
      checkInCount,
      completed,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "You have already recorded activity for this challenge on that date.",
      });
    }

    console.error("Log savings challenge error:", error);
    return res.status(500).json({ message: "Unable to record challenge progress." });
  }
}

async function cancelChallenge(req, res) {
  const challengeId = Number(req.params.id);
  const userId = Number(req.body.user_id);

  if (!Number.isInteger(challengeId) || challengeId <= 0 ||
      !Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "A valid challenge ID and user ID are required." });
  }

  try {
    const result = await query(
      `UPDATE savings_challenges
       SET status = 'cancelled'
       WHERE id = ? AND user_id = ? AND status = 'active'`,
      [challengeId, userId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Active challenge not found.",
      });
    }

    return res.json({ message: "Challenge cancelled successfully." });
  } catch (error) {
    console.error("Cancel savings challenge error:", error);
    return res.status(500).json({ message: "Unable to cancel challenge." });
  }
}

module.exports = {
  listChallenges,
  createChallenge,
  logChallengeActivity,
  cancelChallenge,
};
