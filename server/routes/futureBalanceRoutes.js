
const express = require("express");
const router = express.Router();

const {
  getFutureBalance,
} = require("../controllers/futureBalanceController");

router.get("/", getFutureBalance);

module.exports = router;
