import { UserPlus } from "lucide-react";

export default function RequestSection() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">

      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

        <div>
          <h2 className="text-base font-bold text-slate-900">
            Recent Requests
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Connection and help requests from students.
          </p>
        </div>

        <button className="text-xs font-semibold text-indigo-600 hover:underline">
          View all
        </button>

      </div>

      <div className="flex flex-col items-center justify-center px-6 py-12 text-center">

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
          <UserPlus className="h-5 w-5 text-slate-400" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-slate-800">
          No pending requests
        </h3>

        <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
          Connection requests from other students will appear here.
        </p>

      </div>
    </section>
  );
}