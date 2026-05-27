export default function ProgressBar({ value = 0, className = "" }) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`h-2 overflow-hidden rounded-full bg-surface-variant ${className}`}>
      <div
        className="h-full rounded-full bg-secondary-fixed"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
