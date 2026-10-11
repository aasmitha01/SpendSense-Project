require("dotenv").config();

const express = require("express");
const cors = require("cors");
const intelligenceRoutes = require("./routes/intelligenceRoutes");
const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const goalRoutes = require("./routes/goalRoutes");
const billRoutes = require("./routes/billRoutes");
const userRoutes=require("./routes/userRoutes");
const intelligenceHealthRoutes = require("./routes/intelligenceHealthRoutes");
const spendingRecommendationsRoutes = require("./routes/spendingRecommendationsRoutes");
const goalPlannerRoutes = require("./routes/goalPlannerRoutes");
const savingsChallengeRoutes = require("./routes/savingsChallengeRoutes");
const futureBalanceRoutes = require("./routes/futureBalanceRoutes");
const predictiveAlertRoutes = require("./routes/predictiveAlertRoutes");
const app = express();

app.use(cors());
app.use(express.json({ limit: "4mb" }));
app.use("/api/budgets", budgetRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/intelligence", intelligenceRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/users",userRoutes);
app.use("/api/intelligence/health", intelligenceHealthRoutes);
app.use(
  "/api/intelligence/recommendations",
  spendingRecommendationsRoutes
);
app.use("/api/alerts", predictiveAlertRoutes);
app.use("/api/forecast", futureBalanceRoutes);
app.use("/api/challenges", savingsChallengeRoutes);
app.use("/api/goals/planner", goalPlannerRoutes);
app.get("/", (req, res) => {
  res.send("SpendSense API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server Running on Port ${PORT}`);
});