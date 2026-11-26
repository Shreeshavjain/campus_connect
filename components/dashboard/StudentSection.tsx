
"use client";

import Link from "next/link";
import { ArrowRight, UserRound, Users } from "lucide-react";

export type Student = {
  id: string;
  name: string;
  branch?: string;
  college?: string;
  campus?: string;
  avatar?: string;
  skills?: string[];
  commonSkills?: string[];
};

type StudentSectionProps = {
  students?: Student[];
  loading?: boolean;
};

export default function StudentSection({
  students = [],
  loading = false,
}: StudentSectionProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Students You May Know
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Discover students and the skills they offer.
          </p>
        </div>

        <Link
          href="/students"
          className="flex items-center gap-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-100 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded-full bg-slate-100" />

                <div className="flex-1">
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                  <div className="mt-2 h-3 w-32 animate-pulse rounded bg-slate-100" />
                </div>
              </div>

              <div className="mt-4 h-6 w-20 animate-pulse rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      ) : students.length > 0 ? (

        /* Student Cards */
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
          {students.map((student) => {
            const skills =
              student.skills?.length
                ? student.skills
                : student.commonSkills || [];

            return (
              <div
                key={student.id}
                className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-sm"
              >
                {/* Student Info */}
                <div className="flex items-center gap-3">

                  {/* Avatar */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-50 text-indigo-600">
                    {student.avatar ? (
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold">
                        {student.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Name and College */}
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-slate-900">
                      {student.name}
                    </h3>

                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {student.branch || "Student"}
                      {(student.college || student.campus) &&
                        ` • ${student.college || student.campus}`}
                    </p>
                  </div>
                </div>

                {/* Skills */}
                {skills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-600"
                      >
                        {skill}
                      </span>
                    ))}

                    {skills.length > 3 && (
                      <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-400">
                        +{skills.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* View Profile */}
                <Link
                  href={`/students/${student.id}`}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <UserRound className="h-3.5 w-3.5" />
                  View Profile
                </Link>
              </div>
            );
          })}
        </div>

      ) : (

        /* Empty State */
        <div className="flex min-h-[230px] items-center justify-center px-6 py-10">
          <div className="max-w-sm text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
              <Users className="h-5 w-5 text-indigo-500" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-800">
              No students to show yet
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Student recommendations will appear here once student data is
              connected.
            </p>

            <Link
              href="/students"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
            >
              <Users className="h-4 w-4" />
              Explore Students
            </Link>
          </div>
        </div>
      )}

    </section>
  );
}
