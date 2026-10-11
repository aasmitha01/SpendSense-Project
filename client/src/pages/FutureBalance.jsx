
import { TrendingUp } from "lucide-react";
import FutureBalancePredictor from "../components/FutureBalancePredictor";

function FutureBalance() {
  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-700 to-violet-600 p-6 text-white shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <TrendingUp className="h-8 w-8" />
          </div>

          <div className="min-w-0">
            <p className="text-sm text-indigo-100">
              Plan ahead with your finances
            </p>

            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              Future Balance Predictor
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100">
              Explore how your balance may change over the next 30, 60, and
              90 days based on your recent income and expenses.
            </p>
          </div>
        </div>
      </div>

      {/* Future Balance Prediction */}
      <section className="w-full min-w-0">
        <FutureBalancePredictor />
      </section>
    </div>
  );
}

export default FutureBalance;
