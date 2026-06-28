const express = require("express");
const router = express.Router();

const billController = require(
  "../controllers/billController"
);

router.post("/", billController.addBill);

router.get("/", billController.getBills);

router.put(
  "/:id/pay",
  billController.markBillPaid
);

module.exports = router;