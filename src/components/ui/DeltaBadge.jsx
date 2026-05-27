export default function DeltaBadge({ value, label }) {
  const isPositive = value >= 0;
  const badgeClasses = isPositive
    ? "bg-secondary-fixed/15 text-secondary-fixed"
    : "bg-error/15 text-error";
  const icon = isPositive ? "trending_up" : "trending_down";
  const formattedValue = `${isPositive ? "+" : ""}${value}%`;

  return (
    <span className="flex items-center gap-2">
      <span
        className={`font-label-caps text-label-caps px-2 py-1 rounded flex items-center gap-1 ${badgeClasses}`}
      >
        <span className="material-symbols-outlined text-[14px]">{icon}</span>
        {formattedValue}
      </span>
      {label ? (
        <span className="font-data-md text-data-md text-on-surface-variant">{label}</span>
      ) : null}
    </span>
  );
}
