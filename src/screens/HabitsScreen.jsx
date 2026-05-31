import { useMemo, useState } from "react";

const habits = [
  {
    id: "morning-run",
    name: "Morning Run",
    days: [true, true, false, true, true, false, true],
  },
  {
    id: "deep-work",
    name: "Deep Work",
    days: [true, true, true, true, true, false, false],
  },
  {
    id: "read",
    name: "Read 30 min",
    days: [false, true, true, false, true, true, true],
  },
  {
    id: "no-sugar",
    name: "No Sugar",
    days: [true, false, true, true, false, false, false],
  },
];
const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function calculateStreak(days) {
  let streak = 0;

  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (!days[index]) break;
    streak += 1;
  }

  return streak;
}

function HabitCard({ habit, onToggle }) {
  const streak = calculateStreak(habit.days);

  return (
    <div className="rounded-xl border border-white/20 bg-[#1A1A1A] p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="font-label-caps text-label-caps text-on-surface-variant">
            HABIT LOOP
          </p>
          <h3 className="mt-2 font-body-lg text-body-lg text-on-surface">{habit.name}</h3>
        </div>
        <span className="rounded-full border border-[#34C759]/30 bg-[#34C759]/15 px-3 py-1 font-data-md text-[11px] text-[#34C759]">
          {streak} day{streak === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, dayIndex) => {
          const isComplete = habit.days[dayIndex];

          return (
            <div className="flex flex-col items-center gap-2" key={`${habit.id}-${day}`}>
              <span className="font-data-md text-[10px] uppercase text-on-surface-variant">
                {day}
              </span>
              <button
                aria-label={`${isComplete ? "Clear" : "Mark"} ${habit.name} for ${day}`}
                aria-pressed={isComplete}
                className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                  isComplete
                    ? "border-[#34C759]/70 bg-[#34C759]/20 text-[#34C759]"
                    : "border-white/20 bg-[#0D0D0D] text-transparent hover:border-white/40"
                }`}
                onClick={() => onToggle(habit.id, dayIndex)}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px] leading-none">check</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HabitsScreen() {
  const [trackedHabits, setTrackedHabits] = useState(habits);

  const activeStreakCount = useMemo(
    () => trackedHabits.filter((habit) => calculateStreak(habit.days) > 0).length,
    [trackedHabits],
  );

  function toggleHabitDay(habitId, dayIndex) {
    setTrackedHabits((currentHabits) =>
      currentHabits.map((habit) => {
        if (habit.id !== habitId) return habit;

        return {
          ...habit,
          days: habit.days.map((isComplete, index) =>
            index === dayIndex ? !isComplete : isComplete,
          ),
        };
      }),
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <h2 className="font-display-lg text-display-lg leading-none text-on-surface">
              Habit Tracker
            </h2>
          </div>
          <p className="max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Track weekly rituals, tap a day to mark it complete, and keep streaks visible
            while planning the week.
          </p>
        </div>
        <div className="rounded-xl border border-white/20 bg-[#1A1A1A] px-4 py-3 font-data-md text-data-md text-on-surface-variant">
          {activeStreakCount} active streak{activeStreakCount === 1 ? "" : "s"}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-gutter md:grid-cols-2">
        {trackedHabits.map((habit) => (
          <HabitCard habit={habit} key={habit.id} onToggle={toggleHabitDay} />
        ))}
      </section>

      <section className="rounded-xl border border-white/20 bg-[#1A1A1A] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-label-caps text-label-caps text-on-surface-variant">THIS WEEK</p>
            <p className="mt-2 font-body-md text-body-md text-on-surface">
              Sunday completions keep active streaks alive. Clearing a completed day updates
              the count immediately.
            </p>
          </div>
          <span className="material-symbols-outlined text-secondary-fixed">timeline</span>
        </div>
      </section>
    </div>
  );
}
