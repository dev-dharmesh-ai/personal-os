const habits = ["Morning Run", "Deep Work", "Read 30 min", "No Sugar"];
const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function HabitCard({ habit }) {
  return (
    <div className="rounded-xl border border-white/20 bg-[#1A1A1A] p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="font-label-caps text-label-caps text-on-surface-variant">
            HABIT LOOP
          </p>
          <h3 className="mt-2 font-body-lg text-body-lg text-on-surface">{habit}</h3>
        </div>
        <span className="rounded-full border border-white/20 bg-[#0D0D0D] px-3 py-1 font-data-md text-[11px] text-on-surface-variant">
          V2
        </span>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div className="flex flex-col items-center gap-2" key={`${habit}-${day}`}>
            <span className="font-data-md text-[10px] uppercase text-on-surface-variant">
              {day}
            </span>
            <span className="h-8 w-8 rounded-full border border-white/20 bg-[#0D0D0D]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HabitsScreen() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <h2 className="font-display-lg text-display-lg leading-none text-on-surface">
              Habit Tracker
            </h2>
            <span className="rounded-full border border-[#F5A623]/30 bg-[#F5A623]/15 px-3 py-1 font-label-caps text-label-caps text-[#F5A623]">
              BETA
            </span>
          </div>
          <p className="max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Early preview of weekly rituals. Real tracking, completion states, and streak
            logic are still being wired in.
          </p>
        </div>
        <div className="rounded-xl border border-white/20 bg-[#1A1A1A] px-4 py-3 font-data-md text-data-md text-on-surface-variant">
          0 active streaks
        </div>
      </section>

      <section className="grid grid-cols-1 gap-gutter md:grid-cols-2">
        {habits.map((habit) => (
          <HabitCard habit={habit} key={habit} />
        ))}
      </section>

      <section className="rounded-xl border border-[#F5A623]/30 bg-[#F5A623]/10 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-label-caps text-label-caps text-[#F5A623]">V2 ROADMAP</p>
            <p className="mt-2 font-body-md text-body-md text-on-surface">
              Full habit tracking with streaks and analytics — coming in v2
            </p>
          </div>
          <span className="material-symbols-outlined text-[#F5A623]">timeline</span>
        </div>
      </section>
    </div>
  );
}
