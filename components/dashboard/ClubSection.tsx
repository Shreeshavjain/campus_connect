import { Building2, Compass } from "lucide-react";

export default function ClubSection() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">

      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

        <div>
          <h2 className="text-base font-bold text-slate-900">
            Campus Clubs
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Discover clubs and communities around your campus.
          </p>
        </div>

        <button className="text-xs font-semibold text-indigo-600 hover:underline">
          Explore all
        </button>

      </div>

      <div className="flex flex-col items-center justify-center px-6 py-12 text-center">

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50">
          <Building2 className="h-5 w-5 text-purple-500" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-slate-800">
          Discover campus clubs
        </h3>

        <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
          Clubs, communities and their activities will appear here.
        </p>

        <button className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          <Compass className="h-4 w-4" />
          Explore Clubs
        </button>

      </div>
    </section>
  );
}