"use client";

import { Bell, Search, Menu } from "lucide-react";
import { useState } from "react";
import NotificationPanel from "./NotificationPanel";
import ProfileMenu from "./ProfileMenu";

type TopBarProps = {
  onMenuClick?: () => void;
};

export default function TopBar({ onMenuClick }: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="relative flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">

      {/* Mobile menu */}
      <button
  onClick={onMenuClick}
  className="mr-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
  aria-label="Open menu"
>
  <Menu className="h-5 w-5" />
</button>

      {/* Search */}
      <div className="relative max-w-[520px] flex-1">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          type="search"
          placeholder="Search students, skills or services..."
          className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-50"
        />
      </div>

      {/* Right side */}
      <div className="ml-4 flex items-center gap-2">

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          >
            <Bell className="h-5 w-5" />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white" />
          </button>

          {showNotifications && <NotificationPanel />}
        </div>

        {/* Profile */}
        <ProfileMenu />

      </div>
    </header>
  );
}