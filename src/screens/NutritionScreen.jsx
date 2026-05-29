const stats = [
  { label: "Calories", icon: "local_fire_department" },
  { label: "Protein", icon: "fitness_center" },
  { label: "Carbs", icon: "grain" },
];

export default function NutritionScreen() {
  return (
    <div className="flex min-h-full items-center justify-center">
      <section className="relative w-full max-w-5xl overflow-hidden rounded-xl border border-white/20 bg-[#1A1A1A] p-6 md:p-8">
        <div className="absolute right-5 top-5 rounded-full border border-[#B8F04A]/30 bg-[#B8F04A]/10 px-3 py-1 font-label-caps text-label-caps text-[#B8F04A]">
          COMING SOON
        </div>

        <div className="mx-auto max-w-2xl pt-10 text-center md:pt-4">
          <h2 className="font-display-lg text-display-lg leading-none text-on-surface">
            Nutrition
          </h2>
          <p className="mt-4 font-body-md text-body-md text-on-surface-variant">
            Track macros, meals, and energy — coming soon.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-gutter md:grid-cols-3">
          {stats.map((stat) => (
            <div
              className="rounded-xl border border-white/20 bg-[#0D0D0D] p-6"
              key={stat.label}
            >
              <div className="mb-8 flex items-start justify-between gap-4">
                <p className="font-label-caps text-label-caps text-on-surface-variant">
                  {stat.label}
                </p>
                <span className="material-symbols-outlined text-[#F5A623]">{stat.icon}</span>
              </div>
              <p className="font-data-lg text-[40px] leading-none text-on-surface">—</p>
              <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-[#2A2A2A]">
                <div className="h-full w-0 bg-[#B8F04A]" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-[#F5A623]/30 bg-[#F5A623]/10 p-5 text-center font-body-md text-body-md text-on-surface">
          Meal logging, macro targets, and weekly energy trends are queued for the
          next product pass.
        </div>
      </section>
    </div>
  );
}
