
const express = require("express");
const router = express.Router();

const {
  getSpendingRecommendations,
} = require("../controllers/spendingRecommendationsController");

router.get("/", getSpendingRecommendations);

module.exports = router;
