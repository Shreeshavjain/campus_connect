"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatsCards from "@/components/dashboard/StatsCards";
import StudentSection from "@/components/dashboard/StudentSection";
import RequestSection from "@/components/dashboard/RequestSection";
import type { ApiResponse, DashboardData } from "@/types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch("/api/dashboard");
        const json: ApiResponse<DashboardData> = await response.json();

        if (json.success && json.data) {
          setData(json.data);
        } else {
          setError(json.message || "Failed to load dashboard data");
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("A network error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  return (
    <DashboardLayout>
      {/* Welcome Section */}
      <section className="mb-8">
        <div className="mt-1 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Discover students, skills and communities around your campus.
            </p>
          </div>
        </div>
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100">
            {error}
          </div>
        )}
      </section>

      {/* Statistics */}
      <section>
        <StatsCards stats={data?.stats} loading={loading} error={!!error} />
      </section>

      {/* Quick Actions */}
      <section className="mt-7">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
          <p className="text-sm text-slate-500">Quickly access the things you use most.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link
            href="/students"
            className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-sm"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              👥
            </div>
            <p className="text-sm font-semibold text-slate-900">Find Students</p>
            <p className="mt-1 text-xs text-slate-400">Discover classmates</p>
          </Link>

          <a
            href="/requests"
            className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-sm"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              ✨
            </div>
            <p className="text-sm font-semibold text-slate-900">Requests</p>
            <p className="mt-1 text-xs text-slate-400">Manage connections</p>
          </a>

          <a
            href="/messages"
            className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-sm"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              💬
            </div>
            <p className="text-sm font-semibold text-slate-900">Messages</p>
            <p className="mt-1 text-xs text-slate-400">Chat with students</p>
          </a>

          <a
            href="/clubs"
            className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-sm"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              🏫
            </div>
            <p className="text-sm font-semibold text-slate-900">Explore Clubs</p>
            <p className="mt-1 text-xs text-slate-400">Find campus clubs</p>
          </a>
        </div>
      </section>

      {/* Main Dashboard */}
      <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
        {/* Left */}
        <div className="min-w-0 space-y-6">
          <StudentSection students={data?.students} loading={loading} />
        </div>

        {/* Right */}
        <div className="space-y-6">
          <RequestSection recentRequests={data?.recentRequests} loading={loading} />

          {/* Profile */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Complete your profile</h2>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Add your skills and interests to help other students discover you.
                </p>
              </div>
              <div className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
                Profile
              </div>
            </div>

            {/* Progress */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500">Profile completion</span>
                <span className="font-semibold text-slate-700">—</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-0 rounded-full bg-indigo-600" />
              </div>
              <p className="mt-2 text-right text-[11px] text-slate-400">
                Your profile information will appear here.
              </p>
            </div>
          </section>
        </div>
      </section>
    </DashboardLayout>
  );
}