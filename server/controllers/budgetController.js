const db = require("../config/db");

const addBudget = (req, res) => {
  const {
    user_id,
    category,
    limit_amount,
    period,
  } = req.body;

  const sql = `
    INSERT INTO budgets
    (
      user_id,
      category,
      limit_amount,
      period
    )
    VALUES (?,?,?,?)
  `;

  db.query(
    sql,
    [
      user_id,
      category,
      limit_amount,
      period,
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      res.status(201).json({
        message: "Budget Added",
      });
    }
  );
};

const getBudgets = (req, res) => {
  const { user_id } = req.query;

  const sql =
    "SELECT * FROM budgets WHERE user_id=? ORDER BY id DESC";

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
  addBudget,
  getBudgets,
};