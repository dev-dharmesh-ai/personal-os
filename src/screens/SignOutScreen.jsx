export default function SignOutScreen() {
  return (
    <div className="flex min-h-full items-center justify-center">
      <section className="w-full max-w-3xl rounded-xl border border-white/20 bg-[#1A1A1A] p-8 text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-[#B8F04A]/30 bg-[#B8F04A]/10">
          <span className="material-symbols-outlined text-[#B8F04A]">logout</span>
        </div>
        <span className="inline-flex rounded-full border border-[#B8F04A]/30 bg-[#B8F04A]/10 px-3 py-1 font-label-caps text-label-caps text-[#B8F04A]">
          COMING SOON
        </span>
        <h2 className="mt-5 font-display-lg text-display-lg leading-none text-on-surface">
          Sign Out
        </h2>
        <p className="mx-auto mt-4 max-w-xl font-body-md text-body-md text-on-surface-variant">
          Session management and secure sign-out controls are coming soon.
        </p>
      </section>
    </div>
  );
}
