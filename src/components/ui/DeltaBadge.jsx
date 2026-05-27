export default function DeltaBadge({ children, className = "" }) {
  return (
    <span
      className={`flex items-center gap-1 rounded bg-secondary-fixed/15 px-2 py-1 font-label-caps text-label-caps text-secondary-fixed ${className}`}
    >
      <span className="material-symbols-outlined text-[14px]">trending_up</span>
      {children}
    </span>
  );
}
