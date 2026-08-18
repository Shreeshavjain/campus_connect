import { Search, Users } from "lucide-react";

export default function StudentSection() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">

      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

        <div>
          <h2 className="text-base font-bold text-slate-900">
            Students You May Know
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Discover students and the skills they offer.
          </p>
        </div>

        <button className="text-xs font-semibold text-indigo-600 hover:underline">
          View all
        </button>

      </div>

      <div className="flex flex-col items-center justify-center px-6 py-14 text-center">

        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
          <Users className="h-6 w-6 text-indigo-500" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-slate-800">
          Students will appear here
        </h3>

        <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
          Once student information is available, you can discover
          classmates based on their skills and interests.
        </p>

        <button className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700">
          <Search className="h-4 w-4" />
          Explore Students
        </button>

      </div>
    </section>
  );
}