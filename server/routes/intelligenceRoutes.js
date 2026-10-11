
const express = require("express");
const router = express.Router();

const {
  getIntelligence,
} = require("../controllers/intelligenceController");

router.get("/", getIntelligence);

module.exports = router;
