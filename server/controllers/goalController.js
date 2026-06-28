const db = require("../config/db");

const addGoal = (req, res) => {
  const {
    user_id,
    goal_name,
    target_amount,
    current_amount,
    deadline,
  } = req.body;

  const sql = `
    INSERT INTO goals
    (
      user_id,
      goal_name,
      target_amount,
      current_amount,
      deadline
    )
    VALUES (?,?,?,?,?)
  `;

  db.query(
    sql,
    [
      user_id,
      goal_name,
      target_amount,
      current_amount,
      deadline,
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      res.status(201).json({
        message: "Goal Added",
      });
    }
  );
};

const getGoals = (req, res) => {
  const { user_id } = req.query;

  const sql =
    "SELECT * FROM goals WHERE user_id=? ORDER BY id DESC";

  db.query(sql, [user_id], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: err.message,
      });
    }

    res.status(200).json(result);
  });
};

module.exports = {
  addGoal,
  getGoals,
};