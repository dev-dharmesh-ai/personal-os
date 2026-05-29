export default function SettingsScreen() {
  return (
    <div className="flex min-h-full items-center justify-center">
      <section className="w-full max-w-3xl rounded-xl border border-white/20 bg-[#1A1A1A] p-8 text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-[#F5A623]/30 bg-[#F5A623]/10">
          <span className="material-symbols-outlined text-[#F5A623]">settings</span>
        </div>
        <span className="inline-flex rounded-full border border-[#F5A623]/30 bg-[#F5A623]/15 px-3 py-1 font-label-caps text-label-caps text-[#F5A623]">
          COMING SOON
        </span>
        <h2 className="mt-5 font-display-lg text-display-lg leading-none text-on-surface">
          Settings
        </h2>
        <p className="mx-auto mt-4 max-w-xl font-body-md text-body-md text-on-surface-variant">
          Account controls, workspace preferences, and system configuration are coming soon.
        </p>
      </section>
    </div>
  );
}
