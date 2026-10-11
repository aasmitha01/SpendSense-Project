
const express = require("express");
const router = express.Router();

const {
  getIntelligenceHealth,
} = require("../controllers/intelligenceHealthController");

router.get("/", getIntelligenceHealth);

module.exports = router;
