const db = require("../config/db");

const addBill = (req, res) => {
  const {
    user_id,
    bill_name,
    amount,
    due_date,
    recurring,
  } = req.body;

  const sql = `
    INSERT INTO bills
    (
      user_id,
      bill_name,
      amount,
      due_date,
      recurring
    )
    VALUES (?,?,?,?,?)
  `;

  db.query(
    sql,
    [
      user_id,
      bill_name,
      amount,
      due_date,
      recurring,
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      res.status(201).json({
        message: "Bill Added",
      });
    }
  );
};

const getBills = (req, res) => {
  const { user_id } = req.query;

  const sql =
    "SELECT * FROM bills WHERE user_id=? ORDER BY due_date ASC";

  db.query(sql, [user_id], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: err.message,
      });
    }

    res.status(200).json(result);
  });
};

const markBillPaid = (req, res) => {
  const { id } = req.params;

  const sql =
    "UPDATE bills SET paid=true WHERE id=?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: err.message,
      });
    }

    res.status(200).json({
      message: "Bill Marked Paid",
    });
  });
};

module.exports = {
  addBill,
  getBills,
  markBillPaid,
};