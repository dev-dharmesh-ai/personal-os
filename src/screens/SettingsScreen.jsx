import { useState } from "react";
import CardSurface from "../components/ui/CardSurface.jsx";

const iconStyle = { fontVariationSettings: "'FILL' 0" };

const defaultPreferences = {
  displayName: "Dharmesh",
  role: "Founder / Operator",
  workspace: "Personal OS",
  dailyBriefTime: "08:30",
  currency: "INR",
  defaultView: "Dashboard",
  emailDigest: true,
  focusReminders: true,
  compactMode: false,
};

function ToggleField({ checked, description, label, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-outline-variant/20 bg-white/[0.03] px-4 py-3">
      <span>
        <span className="block font-body-md text-body-md text-on-surface">{label}</span>
        <span className="mt-1 block font-body-sm text-body-sm text-on-surface-variant">
          {description}
        </span>
      </span>
      <input
        checked={checked}
        className="h-5 w-5 accent-primary-container"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}

export default function SettingsScreen() {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [savedAt, setSavedAt] = useState("Saved just now");

  function updatePreference(key, value) {
    setPreferences((current) => ({ ...current, [key]: value }));
    setSavedAt("Unsaved changes");
  }

  function savePreferences() {
    setSavedAt(
      `Saved ${new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="flex flex-col justify-between gap-4 border-b border-outline-variant/20 pb-6 lg:flex-row lg:items-end">
        <div>
          <p className="font-label-caps text-label-caps text-secondary">SYSTEM PROFILE</p>
          <h2 className="mt-2 font-display-lg text-display-lg leading-none text-on-surface">
            Settings
          </h2>
          <p className="mt-3 max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Keep your profile, workspace defaults, and reminder preferences aligned for the daily demo flow.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="font-data-md text-data-md text-on-surface-variant">{savedAt}</span>
          <button
            className="flex items-center justify-center gap-2 rounded bg-primary-container px-4 py-3 font-label-caps text-label-caps text-on-primary-container transition-opacity hover:opacity-90"
            onClick={savePreferences}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]" style={iconStyle}>
              save
            </span>
            SAVE CHANGES
          </button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <CardSurface className="gap-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-primary-container/30 bg-primary-container/10 text-primary-container">
              <span className="material-symbols-outlined" style={iconStyle}>
                account_circle
              </span>
            </div>
            <div>
              <h3 className="font-display-lg text-headline-md leading-none text-on-surface">
                Profile
              </h3>
              <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                Demo-ready account details.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                DISPLAY NAME
              </span>
              <input
                className="rounded-lg border border-outline-variant/30 bg-[#0D0D0D] px-4 py-3 font-body-md text-body-md text-on-surface outline-none transition-colors focus:border-primary-container"
                onChange={(event) => updatePreference("displayName", event.target.value)}
                value={preferences.displayName}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant">ROLE</span>
              <input
                className="rounded-lg border border-outline-variant/30 bg-[#0D0D0D] px-4 py-3 font-body-md text-body-md text-on-surface outline-none transition-colors focus:border-primary-container"
                onChange={(event) => updatePreference("role", event.target.value)}
                value={preferences.role}
              />
            </label>
            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                WORKSPACE
              </span>
              <input
                className="rounded-lg border border-outline-variant/30 bg-[#0D0D0D] px-4 py-3 font-body-md text-body-md text-on-surface outline-none transition-colors focus:border-primary-container"
                onChange={(event) => updatePreference("workspace", event.target.value)}
                value={preferences.workspace}
              />
            </label>
          </div>
        </CardSurface>

        <CardSurface className="gap-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-secondary/30 bg-secondary/10 text-secondary">
              <span className="material-symbols-outlined" style={iconStyle}>
                tune
              </span>
            </div>
            <div>
              <h3 className="font-display-lg text-headline-md leading-none text-on-surface">
                Preferences
              </h3>
              <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                Defaults used across dashboard summaries.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                DAILY BRIEF
              </span>
              <input
                className="rounded-lg border border-outline-variant/30 bg-[#0D0D0D] px-4 py-3 font-body-md text-body-md text-on-surface outline-none transition-colors focus:border-primary-container"
                onChange={(event) => updatePreference("dailyBriefTime", event.target.value)}
                type="time"
                value={preferences.dailyBriefTime}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                CURRENCY
              </span>
              <select
                className="rounded-lg border border-outline-variant/30 bg-[#0D0D0D] px-4 py-3 font-body-md text-body-md text-on-surface outline-none transition-colors focus:border-primary-container"
                onChange={(event) => updatePreference("currency", event.target.value)}
                value={preferences.currency}
              >
                <option>INR</option>
                <option>USD</option>
                <option>EUR</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                DEFAULT VIEW
              </span>
              <select
                className="rounded-lg border border-outline-variant/30 bg-[#0D0D0D] px-4 py-3 font-body-md text-body-md text-on-surface outline-none transition-colors focus:border-primary-container"
                onChange={(event) => updatePreference("defaultView", event.target.value)}
                value={preferences.defaultView}
              >
                <option>Dashboard</option>
                <option>Tasks</option>
                <option>Journal</option>
                <option>Finance</option>
              </select>
            </label>
          </div>
        </CardSurface>

        <CardSurface className="gap-4 xl:col-span-2">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h3 className="font-display-lg text-headline-md leading-none text-on-surface">
                Notification Controls
              </h3>
              <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
                Lightweight controls that update immediately in this session.
              </p>
            </div>
            <span className="inline-flex w-fit rounded border border-outline-variant/30 px-3 py-2 font-label-caps text-label-caps text-on-surface-variant">
              LOCAL SESSION
            </span>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <ToggleField
              checked={preferences.emailDigest}
              description="Send one summary of task, finance, and journal signals."
              label="Email digest"
              onChange={(value) => updatePreference("emailDigest", value)}
            />
            <ToggleField
              checked={preferences.focusReminders}
              description="Nudge high-priority tasks during the active day."
              label="Focus reminders"
              onChange={(value) => updatePreference("focusReminders", value)}
            />
            <ToggleField
              checked={preferences.compactMode}
              description="Use tighter spacing for information-dense walkthroughs."
              label="Compact mode"
              onChange={(value) => updatePreference("compactMode", value)}
            />
          </div>
        </CardSurface>
      </div>
    </div>
  );
}
