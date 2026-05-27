import { NavLink } from "react-router-dom";

const iconStyle = { fontVariationSettings: "'FILL' 0" };

const primaryNavItems = [
  { label: "Dashboard", icon: "grid_view", to: "/" },
  { label: "Operations", icon: "terminal", to: "/tasks" },
  { label: "Strategy", icon: "psychology", to: "/journal" },
  { label: "Analytics", icon: "insights", to: "/finance" },
  { label: "Settings", icon: "settings", to: "/calendar" },
];

const bottomNavItems = [
  { label: "Support", icon: "help_outline", to: "/habits" },
  { label: "Sign Out", icon: "logout", to: "/nutrition" },
];

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

export default function AppShell({ children }) {
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

        <button className="mx-6 mb-8 flex w-[calc(100%-48px)] items-center justify-center gap-2 rounded bg-primary-container px-4 py-3 font-label-caps text-label-caps text-on-primary-container transition-opacity hover:opacity-90">
          <span className="material-symbols-outlined" style={iconStyle}>
            add
          </span>
          NEW INITIATIVE
        </button>

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
        <header className="flex h-header_height w-full items-center justify-between border-b border-outline-variant/20 bg-surface px-margin-desktop text-primary">
          <div className="flex items-center gap-4">
            <h2 className="font-display-lg text-headline-md leading-none text-primary">
              Personal OS
            </h2>
          </div>
          <div className="flex items-center gap-4 font-data-md text-data-md text-on-surface-variant">
            <span>Oct 24, 2023</span>
            <div className="ml-2 h-8 w-8 overflow-hidden rounded-full border border-outline-variant/20">
              <img
                alt="User avatar"
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAE7g4IF_7ZSIjYtdi-nB5eMkq04raowbYFeyWSoPA_KOzS14d2XSKC9TpmWHGeePqNU-zE2mqMXYTQvd9odCUYJ0dg2FmcJblWQ8cHAKUNcQR0XaNFReMSZBt21XPLNxZrNFMy3jlB5Sl_jBtxE4l2jLeImsxP7GO7sBhYYoCGAr7D3M1Fcq98CMzKcG0tjKxiT2x04D2RswhPqkYrTMZcrmlkARl9rUrKym6wmgHxYnaO71yU6Ka1ixU-5EWUuh8YSQCzseCq6LO-"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-margin-desktop">{children}</main>
      </div>
    </div>
  );
}
