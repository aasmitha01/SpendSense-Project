
const express = require("express");
const router = express.Router();

const {
  getPredictiveAlerts,
} = require("../controllers/predictiveAlertController");

router.get("/", getPredictiveAlerts);

module.exports = router;
