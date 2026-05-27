export default function GhostButton({ children, onClick, className = "" }) {
  return (
    <button
      className={`bg-transparent border border-outline-variant/30 text-on-surface-variant font-label-caps text-label-caps rounded px-4 py-2 transition-colors hover:border-outline-variant/60 hover:text-on-surface ${className}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
