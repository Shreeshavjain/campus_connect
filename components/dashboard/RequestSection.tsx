import { UserPlus } from "lucide-react";
import type { DashboardRecentRequest } from "@/types";

export default function RequestSection({
  recentRequests,
  loading,
}: {
  recentRequests?: DashboardRecentRequest[];
  loading: boolean;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Recent Requests</h2>
          <p className="mt-1 text-xs text-slate-400">Connection and help requests from students.</p>
        </div>
        <button className="text-xs font-semibold text-indigo-600 hover:underline">
          View all
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="h-12 w-12 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-4 h-4 w-32 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-3 w-48 animate-pulse rounded bg-slate-100" />
        </div>
      ) : recentRequests && recentRequests.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {recentRequests.map((req) => (
            <div key={req.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{req.counterpart.name}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                      req.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : req.status === "accepted"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {req.direction === "sent" ? "You asked: " : "Asked you: "}
                  {req.title}
                </p>
              </div>
              <button className="text-xs font-semibold text-indigo-600 hover:underline">
                View
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
            <UserPlus className="h-5 w-5 text-slate-400" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-800">No pending requests</h3>
          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
            Connection requests from other students will appear here.
          </p>
        </div>
      )}
    </section>
  );
}