"use client";

import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        {/* Main content */}
        <div className="min-w-0 flex-1">

          {/* Top navigation */}
          <TopBar
            onMenuClick={() => setMobileMenuOpen(true)}
          />

          {/* Page content */}
          <main className="mx-auto w-full max-w-[1500px] px-5 py-6 sm:px-8">
            {children}
          </main>

        </div>
      </div>
    </div>
  );
}