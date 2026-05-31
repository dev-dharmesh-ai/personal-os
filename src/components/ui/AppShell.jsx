import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { journalEntries, tasks } from "../../data/mockData.js";

const iconStyle = { fontVariationSettings: "'FILL' 0" };

const primaryNavItems = [
  { label: "Dashboard", icon: "grid_view", to: "/" },
  { label: "Tasks", icon: "terminal", to: "/tasks" },
  { label: "Journal", icon: "psychology", to: "/journal" },
  { label: "Finance", icon: "insights", to: "/finance" },
  { label: "Calendar", icon: "calendar_month", to: "/calendar" },
  { label: "Habit", icon: "routine", to: "/habits" },
  { label: "Nutrition", icon: "restaurant", to: "/nutrition" },
];

const bottomNavItems = [
  { label: "Settings", icon: "settings", to: "/settings" },
  { label: "Sign Out", icon: "logout", to: "/sign-out" },
];

const mobileNavItems = [...primaryNavItems, ...bottomNavItems];

function formatHeaderDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildAiBrief(run) {
  const openTasks = tasks.filter((task) => !task.done);
  const highPriorityTasks = openTasks.filter((task) => task.priority === "High");
  const firstHighPriorityTask = highPriorityTasks[0]?.title || openTasks[0]?.title || "review the day";
  const journalSignal = journalEntries[0]?.firstSentence?.split(".")[0] || "Journal signal is clear";
  const moves = [
    `Start with ${firstHighPriorityTask}.`,
    `Batch ${Math.max(openTasks.length - 1, 0)} follow-up tasks after the first deep-work block.`,
    `${journalSignal}. Keep the next move narrow.`,
  ];

  return {
    generatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    headline: moves[run % moves.length],
    detail: `${openTasks.length} open tasks, ${highPriorityTasks.length} high priority, finance and journal signals reviewed.`,
  };
}

function SidebarLink({ item }) {
  return (
    <NavLink
      end={item.to === "/"}
      to={item.to}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 px-4 py-3 font-label-caps text-label-caps transition-colors",
          isActive
            ? "border-r-2 border-primary-container bg-primary-container/5 text-primary-container"
            : "border-l-2 border-transparent text-on-surface-variant hover:bg-primary-container/5 hover:text-primary-container",
        ].join(" ")
      }
    >
      <span className="material-symbols-outlined" style={iconStyle}>
        {item.icon}
      </span>
      <span>{item.label}</span>
    </NavLink>
  );
}

function MobileNavLink({ item }) {
  return (
    <NavLink
      end={item.to === "/"}
      to={item.to}
      className={({ isActive }) =>
        [
          "flex min-w-[76px] flex-col items-center gap-1 rounded-lg px-3 py-2 text-center transition-colors",
          isActive
            ? "bg-primary-container/15 text-primary-container"
            : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface",
        ].join(" ")
      }
    >
      <span className="material-symbols-outlined text-[20px]" style={iconStyle}>
        {item.icon}
      </span>
      <span className="font-label-caps text-[9px] leading-none">{item.label}</span>
    </NavLink>
  );
}

export default function AppShell({ children }) {
  const [briefRun, setBriefRun] = useState(0);
  const headerDate = useMemo(() => formatHeaderDate(new Date()), []);
  const aiBrief = useMemo(() => buildAiBrief(briefRun), [briefRun]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0D0D0D] text-on-surface font-body-md text-body-md">
      <nav className="fixed left-0 top-0 z-50 hidden h-full w-sidebar_width flex-col border-r border-outline-variant/20 bg-surface py-6 text-primary-container md:flex">
        <div className="px-6 mb-8 flex items-center gap-3">
          <img
            src="/logo-mark.png"
            alt="System Logo"
            className="w-8 h-8 rounded-full border border-outline-variant/20"
          />
          <div className="flex flex-col min-w-0">
            <h1 className="font-display-lg text-primary text-xl uppercase tracking-widest leading-none">
              MISSION CONTROL
            </h1>
            <p className="font-label-caps text-label-caps text-on-surface-variant mt-1 text-xs">
              Active Session
            </p>
          </div>
        </div>

        <NavLink
          className="mx-6 mb-8 flex w-[calc(100%-48px)] items-center justify-center gap-2 rounded bg-primary-container px-4 py-3 font-label-caps text-label-caps text-on-primary-container transition-opacity hover:opacity-90"
          to="/tasks"
        >
          <span className="material-symbols-outlined" style={iconStyle}>
            add
          </span>
          ADD TASK
        </NavLink>

        <ul className="flex flex-1 flex-col gap-2 px-4">
          {primaryNavItems.map((item) => (
            <li key={item.label}>
              <SidebarLink item={item} />
            </li>
          ))}
        </ul>

        <ul className="mt-auto flex flex-col gap-2 px-4">
          {bottomNavItems.map((item) => (
            <li key={item.label}>
              <SidebarLink item={item} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="relative flex flex-1 flex-col md:ml-sidebar_width">
        <header className="flex h-header_height w-full items-center justify-between border-b border-outline-variant/20 bg-surface px-margin-mobile text-primary md:px-margin-desktop">
          <div className="flex items-center gap-4">
            <h2 className="font-display-lg text-xl leading-none text-primary md:text-headline-md">
              Personal OS
            </h2>
          </div>
          <div className="flex items-center gap-3 font-data-md text-[11px] text-on-surface-variant md:gap-4 md:text-data-md">
            <span>{headerDate}</span>
            <div className="ml-2 h-8 w-8 overflow-hidden rounded-full border border-outline-variant/20">
              <img
                alt="User avatar"
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAE7g4IF_7ZSIjYtdi-nB5eMkq04raowbYFeyWSoPA_KOzS14d2XSKC9TpmWHGeePqNU-zE2mqMXYTQvd9odCUYJ0dg2FmcJblWQ8cHAKUNcQR0XaNFReMSZBt21XPLNxZrNFMy3jlB5Sl_jBtxE4l2jLeImsxP7GO7sBhYYoCGAr7D3M1Fcq98CMzKcG0tjKxiT2x04D2RswhPqkYrTMZcrmlkARl9rUrKym6wmgHxYnaO71yU6Ka1ixU-5EWUuh8YSQCzseCq6LO-"
              />
            </div>
          </div>
        </header>

        <section className="border-b border-outline-variant/20 bg-surface-container-low px-margin-mobile py-3 md:px-margin-desktop">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="material-symbols-outlined mt-0.5 text-[22px] text-secondary">
                auto_awesome
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="font-label-caps text-label-caps text-secondary">AI DAILY BRIEF</p>
                  <span className="font-data-md text-[11px] text-on-surface-variant">
                    Updated {aiBrief.generatedAt}
                  </span>
                </div>
                <p className="mt-1 font-body-md text-body-md text-on-surface">
                  {aiBrief.headline}
                </p>
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  {aiBrief.detail}
                </p>
              </div>
            </div>
            <button
              className="flex w-full items-center justify-center gap-2 rounded border border-secondary/40 px-4 py-2 font-label-caps text-label-caps text-secondary transition-colors hover:bg-secondary/10 lg:w-auto"
              onClick={() => setBriefRun((current) => current + 1)}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              REFRESH AI BRIEF
            </button>
          </div>
        </section>

        <main className="flex-1 overflow-y-auto p-margin-mobile pb-28 md:p-margin-desktop">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-outline-variant/20 bg-surface/95 px-2 py-2 backdrop-blur md:hidden">
        <ul className="flex gap-1 overflow-x-auto">
          {mobileNavItems.map((item) => (
            <li key={item.label}>
              <MobileNavLink item={item} />
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
