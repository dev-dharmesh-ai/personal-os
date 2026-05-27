export default function PriorityBadge({ children, className = "" }) {
  return (
    <span
      className={`rounded-full bg-primary-container/15 px-3 py-1 font-label-caps text-label-caps text-primary-container ${className}`}
    >
      {children}
    </span>
  );
}
