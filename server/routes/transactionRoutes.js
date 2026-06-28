const express = require("express");
const router = express.Router();

const transactionController = require(
  "../controllers/transactionController"
);

router.post("/", transactionController.addTransaction);
router.get(
  "/dashboard",
  transactionController.getDashboardStats
);

router.get("/", transactionController.getTransactions);
router.delete(
  "/:id",
  transactionController.deleteTransaction
);
router.put(
  "/:id",
  transactionController.updateTransaction
);


module.exports = router;