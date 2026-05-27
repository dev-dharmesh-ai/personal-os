export default function PrimaryButton({ children, onClick, className = "" }) {
  return (
    <button
      className={`w-full py-3 border border-secondary-fixed text-secondary-fixed hover:bg-secondary-fixed/5 font-label-caps text-label-caps rounded transition-colors flex justify-center items-center gap-2 ${className}`}
      onClick={onClick}
      type="button"
    >
      {children}
      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
    </button>
  );
}
