import { Search, Users } from "lucide-react";
import type { DashboardStudent } from "@/types";

export default function StudentSection({
  students,
  loading,
}: {
  students?: DashboardStudent[];
  loading: boolean;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Students You May Know</h2>
          <p className="mt-1 text-xs text-slate-400">Discover students and the skills they offer.</p>
        </div>
        <button className="text-xs font-semibold text-indigo-600 hover:underline">
          View all
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <div className="h-14 w-14 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-4 h-4 w-32 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-3 w-48 animate-pulse rounded bg-slate-100" />
        </div>
      ) : students && students.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {students.map((student) => (
            <div key={student.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{student.name}</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {student.campus || "Unknown Campus"} {student.branch ? `· ${student.branch}` : ""}
                </p>
                {student.commonSkills.length > 0 && (
                  <p className="mt-1 text-xs font-medium text-indigo-600">
                    Matches: {student.commonSkills.join(", ")}
                  </p>
                )}
              </div>
              <button className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition">
                View
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
            <Users className="h-6 w-6 text-indigo-500" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-800">Students will appear here</h3>
          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
            Once student information is available, you can discover classmates based on their skills and interests.
          </p>
          <button className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700">
            <Search className="h-4 w-4" />
            Explore Students
          </button>
        </div>
      )}
    </section>
  );
}