const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function monthLabel(date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function CalendarScreen() {
  const today = new Date();
  const todayDate = today.getDate();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const startOffset = (monthStart.getDay() + 6) % 7;
  const days = Array.from({ length: 35 }, (_, index) => {
    const day = index - startOffset + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });

  return (
    <div className="flex min-h-full items-center justify-center">
      <section className="w-full max-w-4xl rounded-xl border border-white/20 bg-[#1A1A1A] p-6 md:p-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display-lg text-display-lg leading-none text-on-surface">
            Calendar
          </h2>
          <p className="mt-4 font-body-md text-body-md text-on-surface-variant">
            Unified scheduling across all your life domains — coming soon.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-white/20 bg-[#0D0D0D] p-4 md:p-5">
          <div className="mb-5 flex items-center justify-between">
            <p className="font-headline-md text-headline-md text-on-surface">
              {monthLabel(today)}
            </p>
            <span className="rounded-full border border-[#F5A623]/30 bg-[#F5A623]/15 px-3 py-1 font-label-caps text-label-caps text-[#F5A623]">
              SOON
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <div
                className="pb-2 text-center font-data-md text-[10px] uppercase text-on-surface-variant"
                key={day}
              >
                {day}
              </div>
            ))}

            {days.map((day, index) => {
              const isToday = day === todayDate;

              return (
                <div
                  className={`flex aspect-square items-start rounded-lg border p-2 font-data-md text-[11px] ${
                    isToday
                      ? "border-[#F5A623] bg-[#F5A623]/15 text-[#F5A623]"
                      : "border-white/10 bg-[#1A1A1A] text-on-surface-variant"
                  }`}
                  key={`${day || "blank"}-${index}`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 rounded-xl border border-white/20 bg-[#0D0D0D] p-4 md:flex-row">
          <input
            className="min-w-0 flex-1 rounded-lg border border-white/20 bg-[#1A1A1A] px-4 py-3 font-body-sm text-body-sm text-on-surface outline-none placeholder:text-on-surface-variant focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623]"
            placeholder="Email address"
            readOnly
            type="email"
          />
          <button
            className="rounded-lg bg-[#F5A623] px-5 py-3 font-label-caps text-label-caps text-black"
            type="button"
          >
            Notify me when it launches
          </button>
        </div>
      </section>
    </div>
  );
}
