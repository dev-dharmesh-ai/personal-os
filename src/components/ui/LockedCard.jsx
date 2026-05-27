import CardSurface from "./CardSurface.jsx";

const iconStyle = { fontVariationSettings: "'FILL' 0" };

export default function LockedCard({ title, children, className = "" }) {
  return (
    <CardSurface
      className={`relative flex min-h-[200px] flex-col items-center justify-center overflow-hidden ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiM1MjQ1MzQiLz48L3N2Zz4=')] opacity-20 blur-sm" />
      <div className="z-10 flex flex-col items-center rounded-lg border border-outline-variant/20 bg-[#1A1A1A]/80 p-4 text-center backdrop-blur-md">
        <span
          className="material-symbols-outlined mb-2 text-3xl text-outline-variant"
          style={iconStyle}
        >
          lock
        </span>
        <h3 className="mb-1 font-label-caps text-label-caps tracking-widest text-on-surface-variant">
          {title}
        </h3>
        <p className="font-body-sm text-body-sm text-outline-variant">{children}</p>
      </div>
    </CardSurface>
  );
}
