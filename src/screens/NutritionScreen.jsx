import ProgressBar from "../components/ui/ProgressBar.jsx";

const macroStats = [
  {
    label: "Calories",
    icon: "local_fire_department",
    value: "1,820",
    unit: "kcal",
    target: "2,200 kcal target",
    progress: 83,
  },
  {
    label: "Protein",
    icon: "fitness_center",
    value: "118",
    unit: "g",
    target: "150 g target",
    progress: 79,
  },
  {
    label: "Carbs",
    icon: "grain",
    value: "205",
    unit: "g",
    target: "260 g target",
    progress: 79,
  },
  {
    label: "Fat",
    icon: "egg_alt",
    value: "62",
    unit: "g",
    target: "70 g target",
    progress: 89,
  },
];

const mealPreview = [
  { label: "Breakfast", meal: "Greek yogurt, berries, oats", macros: "430 kcal / 32g protein" },
  { label: "Lunch", meal: "Paneer rice bowl with greens", macros: "640 kcal / 38g protein" },
  { label: "Snack", meal: "Banana and whey shake", macros: "260 kcal / 28g protein" },
  { label: "Dinner", meal: "Lentil soup with roti", macros: "490 kcal / 20g protein" },
];

export default function NutritionScreen() {
  return (
    <div className="flex min-h-full justify-center">
      <section className="relative w-full max-w-6xl overflow-hidden rounded-xl border border-white/20 bg-[#1A1A1A] p-5 md:p-8">
        <div className="absolute right-5 top-5 rounded-full border border-[#B8F04A]/30 bg-[#B8F04A]/10 px-3 py-1 font-label-caps text-label-caps text-[#B8F04A]">
          ROADMAP PREVIEW
        </div>

        <div className="max-w-2xl pt-10 md:pt-0">
          <h2 className="font-display-lg text-display-lg leading-none text-on-surface">
            Nutrition
          </h2>
          <p className="mt-4 font-body-md text-body-md text-on-surface-variant">
            A seeded macro snapshot for preview only. Full meal logging stays queued
            behind Dashboard, Tasks, Finance, Journal, and AI narrative work.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-4">
          {macroStats.map((stat) => (
            <div
              className="rounded-lg border border-white/20 bg-[#0D0D0D] p-5"
              key={stat.label}
            >
              <div className="mb-7 flex items-start justify-between gap-4">
                <p className="font-label-caps text-label-caps text-on-surface-variant">
                  {stat.label}
                </p>
                <span className="material-symbols-outlined text-[#F5A623]">{stat.icon}</span>
              </div>
              <p className="font-data-lg text-[40px] leading-none text-on-surface">
                {stat.value}
                <span className="ml-2 align-baseline font-data-md text-data-md text-on-surface-variant">
                  {stat.unit}
                </span>
              </p>
              <p className="mt-3 font-body-sm text-body-sm text-on-surface-variant">
                {stat.target}
              </p>
              <div className="mt-5">
                <ProgressBar value={stat.progress} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-gutter lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-lg border border-white/20 bg-[#0D0D0D] p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h3 className="font-label-caps text-label-caps text-on-surface-variant">
                Today's Meal Preview
              </h3>
              <span className="font-data-md text-data-md text-[#B8F04A]">1,820 kcal</span>
            </div>
            <div className="divide-y divide-white/10">
              {mealPreview.map((meal) => (
                <div className="grid gap-2 py-4 md:grid-cols-[120px_1fr_auto]" key={meal.label}>
                  <p className="font-label-caps text-label-caps text-[#F5A623]">{meal.label}</p>
                  <p className="font-body-md text-body-md text-on-surface">{meal.meal}</p>
                  <p className="font-data-md text-data-md text-on-surface-variant">
                    {meal.macros}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-lg border border-[#F5A623]/30 bg-[#F5A623]/10 p-5">
            <p className="font-label-caps text-label-caps text-[#F5A623]">Queued Scope</p>
            <p className="mt-4 font-body-md text-body-md text-on-surface">
              Meal logging, macro targets, and weekly energy trends remain roadmap
              items. This preview keeps the route useful without pulling focus from
              core hackathon screens.
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}
