export default function ProgressBar({ value = 0 }) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full h-1 bg-outline-variant/20 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-secondary-fixed"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
