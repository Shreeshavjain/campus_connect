"use client";

import { Bell, CheckCheck } from "lucide-react";

export default function NotificationPanel() {
  return (
    <div className="absolute right-0 top-12 z-50 w-[340px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">

        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Notifications
          </h3>

          <p className="mt-0.5 text-[11px] text-slate-400">
            Stay updated with your campus
          </p>
        </div>

        <button className="text-slate-400 hover:text-indigo-600">
          <CheckCheck className="h-4 w-4" />
        </button>

      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center px-6 py-12 text-center">

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
          <Bell className="h-5 w-5 text-indigo-500" />
        </div>

        <h4 className="mt-4 text-sm font-semibold text-slate-800">
          No notifications yet
        </h4>

        <p className="mt-1 max-w-[220px] text-xs leading-5 text-slate-400">
          New connection requests, messages and campus updates will appear here.
        </p>

      </div>
    </div>
  );
}