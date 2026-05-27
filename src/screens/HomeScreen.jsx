import { tasks, financeStats, journalEntries } from "../data/mockData.js";
import CardSurface from "../components/ui/CardSurface.jsx";
import PriorityBadge from "../components/ui/PriorityBadge.jsx";
import PrimaryButton from "../components/ui/PrimaryButton.jsx";
import DeltaBadge from "../components/ui/DeltaBadge.jsx";
import LockedCard from "../components/ui/LockedCard.jsx";

const priorityDotClasses = {
  High: "bg-error",
  Medium: "bg-primary-container",
  Low: "bg-secondary-fixed",
};

export default function HomeScreen() {
  const todaysTasks = tasks.filter((task) => task.dueLabel.includes("Today"));
  const dueTodayCount = todaysTasks.filter((task) => !task.done).length;
  const journalEntry = journalEntries[0];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        <CardSurface className="md:col-span-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-md text-headline-md text-on-surface">Tasks</h3>
            <span className="font-label-caps text-label-caps bg-primary-container/15 text-primary-container px-3 py-1 rounded-full">
              {dueTodayCount} DUE TODAY
            </span>
          </div>
          <ul className="flex flex-col flex-1 border-t border-outline-variant/10">
            {todaysTasks.map((task) => (
              <li
                className="flex items-center justify-between py-5 border-b border-outline-variant/10 group"
                key={task.id}
              >
                <div className="flex items-center gap-4">
                  <input
                    checked={task.done}
                    className="w-5 h-5 rounded-sm border-outline-variant/50 bg-[#0D0D0D] text-primary-container focus:ring-primary-container focus:ring-offset-[#1A1A1A]"
                    readOnly
                    type="checkbox"
                  />
                  <span
                    className={`font-body-lg text-body-lg text-on-surface group-hover:text-primary-container transition-colors ${
                      task.done ? "line-through" : ""
                    }`}
                  >
                    {task.title}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      priorityDotClasses[task.priority] || priorityDotClasses.Low
                    }`}
                  />
                  <span className="font-data-md text-data-md text-on-surface-variant">
                    {task.timeLabel}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </CardSurface>

        <CardSurface className="md:col-span-4 justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-label-caps text-label-caps text-on-surface-variant">
                LIQUID ASSETS
              </h3>
              <span className="material-symbols-outlined text-on-surface-variant">
                account_balance_wallet
              </span>
            </div>
            <div className="font-data-lg text-display-lg text-secondary-fixed mb-2 tracking-tight">
              ₹{financeStats.balance.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="mt-16">
            <DeltaBadge value={financeStats.delta} label="vs last week" />
          </div>
        </CardSurface>

        <CardSurface className="md:col-span-6 justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-md text-headline-md text-on-surface">Journal Log</h3>
            <span className="font-data-md text-data-md text-on-surface-variant">
              {journalEntry.dateLabel}
            </span>
          </div>
          <div className="mb-8 flex-1">
            <p className="font-body-md text-body-lg text-on-surface-variant line-clamp-2 italic border-l-2 border-outline-variant/30 pl-4 py-1">
              &quot;{journalEntry.firstSentence}&quot;
            </p>
          </div>
          <PrimaryButton>CONTINUE ENTRY</PrimaryButton>
        </CardSurface>

        <CardSurface className="md:col-span-6 relative overflow-hidden justify-center items-center min-h-[200px]">
          <LockedCard
            title="HABIT TRACKER"
            subtitle="Module currently offline. Coming in v2.1."
          />
        </CardSurface>
      </div>
    </div>
  );
}
