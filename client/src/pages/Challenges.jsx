
import SmartSavingsChallenges from "../components/SmartSavingsChallenges";
import { Trophy } from "lucide-react";

function Challenges() {
  return (
    <div className="w-full min-w-0 space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-violet-700 to-indigo-600 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <Trophy className="h-8 w-8" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm text-violet-100">
              Build better saving habits
            </p>

            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              Smart Savings Challenges
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-violet-100">
              Turn small daily actions into consistent saving habits.
              Start a challenge, record your progress, and celebrate your
              milestones.
            </p>
          </div>
        </div>
      </section>

      <SmartSavingsChallenges />
    </div>
  );
}

export default Challenges;
