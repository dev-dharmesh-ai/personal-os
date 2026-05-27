export default function GhostButton({ children, className = "", ...props }) {
  return (
    <button
      className={`flex items-center justify-center gap-2 rounded border border-secondary-fixed px-4 py-3 font-label-caps text-label-caps text-secondary-fixed transition-colors hover:bg-secondary-fixed/5 ${className}`}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}
