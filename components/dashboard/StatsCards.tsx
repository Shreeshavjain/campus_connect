import { Users, UserPlus, MessageCircle } from "lucide-react";
import type { DashboardStats } from "@/types";

export default function StatsCards({
  stats,
  loading,
  error,
}: {
  stats?: DashboardStats;
  loading: boolean;
  error?: boolean;
}) {
  const statConfig = [
    { label: "Connections", icon: Users, value: stats?.connections },
    { label: "Pending Requests", icon: UserPlus, value: stats?.incomingPendingRequests },
    { label: "Messages", icon: MessageCircle, value: stats?.unreadMessages },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {statConfig.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-100 hover:shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">{stat.label}</p>
                {loading ? (
                  <div className="mt-2 h-7 w-12 animate-pulse rounded-md bg-slate-100" />
                ) : (
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {error ? "—" : stat.value ?? 0}
                  </p>
                )}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                <Icon className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
