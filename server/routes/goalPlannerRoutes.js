
const express = require("express");
const router = express.Router();

const {
  getGoalPlanner,
} = require("../controllers/goalPlannerController");

router.get("/", getGoalPlanner);

module.exports = router;
