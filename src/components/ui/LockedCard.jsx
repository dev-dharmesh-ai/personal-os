const iconStyle = { fontVariationSettings: "'FILL' 0" };

export default function LockedCard({ title, subtitle }) {
  return (
    <>
      <div className="absolute inset-0 opacity-20 pointer-events-none blur-sm bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiM1MjQ1MzQiLz48L3N2Zz4=')]" />
      <div className="z-10 flex flex-col items-center text-center p-4 bg-[#1A1A1A]/80 backdrop-blur-md rounded-lg border border-outline-variant/20">
        <span
          className="material-symbols-outlined mb-2 text-3xl text-outline-variant"
          style={iconStyle}
        >
          lock
        </span>
        <h3 className="mb-1 font-label-caps text-label-caps tracking-widest text-on-surface-variant">
          {title}
        </h3>
        <p className="font-body-sm text-body-sm text-outline-variant">{subtitle}</p>
      </div>
    </>
  );
}
