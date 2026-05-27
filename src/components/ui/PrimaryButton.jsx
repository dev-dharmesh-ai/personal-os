export default function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`flex items-center justify-center gap-2 rounded bg-primary-container px-4 py-3 font-label-caps text-label-caps text-on-primary-container transition-opacity hover:opacity-90 ${className}`}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}
