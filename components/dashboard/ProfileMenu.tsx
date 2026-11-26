"use client";

import { ChevronDown, User, Settings, LogOut } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">

      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
          S
        </div>

        <div className="hidden text-left sm:block">
          <p className="text-xs font-semibold text-slate-800">
            Student
          </p>

          <p className="text-[10px] text-slate-400">
            NMAMIT
          </p>
        </div>

        <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">

          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <User className="h-4 w-4" />
            Profile
          </Link>

          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
            <Settings className="h-4 w-4" />
            Settings
          </button>

          <div className="my-1 border-t border-slate-100" />

          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4" />
            Logout
          </button>

        </div>
      )}
    </div>
  );
}