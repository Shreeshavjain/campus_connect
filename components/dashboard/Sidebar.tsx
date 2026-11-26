"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  MessageCircle,
  Building2,
  Bell,
  User,
  Settings,
  LogOut,
  GraduationCap,
  X,
} from "lucide-react";

const navigation = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "All Students",
    icon: Users,
    href: "/students",
  },
  {
    label: "Requests",
    icon: UserPlus,
    href: "/requests",
  },
  {
    label: "My Connections",
    icon: Users,
    href: "/connections",
  },
  {
    label: "Messages",
    icon: MessageCircle,
    href: "/messages",
  },
  {
    label: "Clubs",
    icon: Building2,
    href: "/clubs",
  },
  {
    label: "Notifications",
    icon: Bell,
    href: "/notifications",
  },
];

type SidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({
  mobileOpen = false,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[250px] shrink-0 self-start border-r border-slate-200 bg-white lg:flex lg:flex-col">

        {/* Logo */}
        <div className="flex h-[76px] items-center border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
              <GraduationCap className="h-5 w-5 text-indigo-600" />
            </div>

            <div>
              <h1 className="text-[15px] font-bold text-slate-900">
                Campus Connect
              </h1>

              <p className="text-[11px] text-slate-400">
                Student Portal
              </p>
            </div>

          </div>
        </div>

        <SidebarNavigation />

        <SidebarBottom />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[270px] flex-col bg-white shadow-xl transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >

        {/* Mobile header */}
        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
              <GraduationCap className="h-5 w-5 text-indigo-600" />
            </div>

            <div>
              <h1 className="text-[15px] font-bold text-slate-900">
                Campus Connect
              </h1>

              <p className="text-[11px] text-slate-400">
                Student Portal
              </p>
            </div>

          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>

        </div>

        <SidebarNavigation onNavigate={onClose} />

        <SidebarBottom />

      </aside>
    </>
  );
}


/* Navigation */
function SidebarNavigation({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">

      {navigation.map((item) => {
        const Icon = item.icon;

        const isActive = pathname === item.href;

        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Icon className="h-[18px] w-[18px]" />
            <span>{item.label}</span>
          </Link>
        );
      })}

    </nav>
  );
}


/* Bottom section */
function SidebarBottom() {
  return (
    <div className="border-t border-slate-100 px-3 py-4">

      <Link
        href="/profile"
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        <User className="h-[18px] w-[18px]" />
        Profile
      </Link>

      <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
        <Settings className="h-[18px] w-[18px]" />
        Settings
      </button>

      <button className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600">
        <LogOut className="h-[18px] w-[18px]" />
        Logout
      </button>

    </div>
  );
}