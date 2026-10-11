
const express = require("express");
const router = express.Router();

const {
  listChallenges,
  createChallenge,
  logChallengeActivity,
  cancelChallenge,
} = require("../controllers/savingsChallengeController");

router.get("/", listChallenges);
router.post("/", createChallenge);
router.post("/:id/log", logChallengeActivity);
router.patch("/:id/cancel", cancelChallenge);

module.exports = router;
