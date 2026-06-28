const db = require("../config/db");

const addTransaction = (req, res) => {

  const {
    user_id,
    title,
    type,
    category,
    amount,
    description,
    transaction_date,
  } = req.body;

  const sql = `
    INSERT INTO transactions
    (
      user_id,
      title,
      type,
      category,
      amount,
      description,
      transaction_date
    )
    VALUES (?,?,?,?,?,?,?)
  `;

  db.query(
    sql,
    [
      user_id,
      title,
      type,
      category,
      amount,
      description,
      transaction_date,
    ],
    (err, result) => {

      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      res.status(201).json({
        message: "Transaction Added",
      });
    }
  );
};

const getTransactions = (req, res) => {

  const { user_id } = req.query;

  const sql =
    "SELECT * FROM transactions WHERE user_id=? ORDER BY id DESC";

  db.query(sql, [user_id], (err, result) => {

    if (err) {
      return res.status(500).json({
        message: err.message,
      });
    }

    res.status(200).json(result);
  });
};
const getDashboardStats = (req, res) => {
  const { user_id } = req.query;

  const sql = `
    SELECT
      SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS totalIncome,
      SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS totalExpense
    FROM transactions
    WHERE user_id=?
  `;

  db.query(sql, [user_id], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: err.message,
      });
    }

    const income =
      Number(result[0].totalIncome) || 0;

    const expense =
      Number(result[0].totalExpense) || 0;

    res.status(200).json({
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
    });
  });
};
const deleteTransaction = (req, res) => {
  const { id } = req.params;

  const sql =
    "DELETE FROM transactions WHERE id=?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: err.message,
      });
    }

    res.status(200).json({
      message: "Transaction Deleted",
    });
  });
};
const updateTransaction = (req, res) => {
  const { id } = req.params;

  const {
    title,
    type,
    category,
    amount,
    description,
    transaction_date,
  } = req.body;

  const sql = `
    UPDATE transactions
    SET
      title=?,
      type=?,
      category=?,
      amount=?,
      description=?,
      transaction_date=?
    WHERE id=?
  `;

  db.query(
    sql,
    [
      title,
      type,
      category,
      amount,
      description,
      transaction_date,
      id,
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      res.status(200).json({
        message: "Transaction Updated",
      });
    }
  );
};

module.exports = {
  addTransaction,
  getTransactions,
  getDashboardStats,
  deleteTransaction,
  updateTransaction,
};