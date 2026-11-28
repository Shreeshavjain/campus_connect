"use client";

import Link from "next/link";
import {
  Clock,
  GraduationCap,
  MessageCircle,
  Sparkles,
  UserCheck,
  UserPlus,
  UserRound,
} from "lucide-react";
import type { DiscoveryStudent } from "@/types";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

type StudentCardProps = {
  student: DiscoveryStudent;
  featured?: boolean;
  busy?: boolean;
  onConnect: (student: DiscoveryStudent) => void;
  onAcceptRequest: (student: DiscoveryStudent) => void;
};

export default function StudentCard({
  student,
  featured = false,
  busy = false,
  onConnect,
  onAcceptRequest,
}: StudentCardProps) {
  const commonSkillSet = new Set(
    student.commonSkills.map((s) => s.trim().toLowerCase())
  );

  // Put shared skills first, then remaining profile skills
  const orderedSkills = [
    ...student.commonSkills,
    ...student.skills.filter(
      (s) => !commonSkillSet.has(s.trim().toLowerCase())
    ),
  ];

  const academicParts = [
    student.branch?.trim() || null,
    student.year ? `Year ${student.year}` : null,
    student.campus?.trim() || null,
  ].filter(Boolean) as string[];

  return (
    <article
      className={`group flex flex-col justify-between rounded-2xl border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-sm ${
        featured
          ? "border-indigo-200/80 hover:border-indigo-300"
          : "border-slate-200 hover:border-indigo-200"
      }`}
    >
      <div>
        {/* Header: Avatar + Name + Academic meta */}
        <div className="flex items-start gap-3.5">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              featured
                ? "bg-indigo-600 text-white"
                : "bg-indigo-50 text-indigo-700"
            }`}
          >
            {getInitials(student.name)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-sm font-bold text-slate-900">
                {student.name}
              </h3>
              {featured && student.score > 0 && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                  <Sparkles className="h-3 w-3" />
                  Top Match
                </span>
              )}
            </div>

            {academicParts.length > 0 ? (
              <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
                <GraduationCap className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{academicParts.join(" · ")}</span>
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-400">
                Campus Connect student
              </p>
            )}
          </div>
        </div>

        {/* Verified Shared-Context Reasons */}
        {student.reasons.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {student.reasons.map((reason) => (
              <span
                key={reason}
                className="inline-flex items-center rounded-full border border-purple-200/80 bg-purple-50 px-2.5 py-0.5 text-[11px] font-medium text-purple-700"
              >
                {reason}
              </span>
            ))}
          </div>
        )}

        {/* Bio snippet */}
        {student.bio?.trim() && (
          <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-600">
            {student.bio}
          </p>
        )}

        {/* Skills */}
        {orderedSkills.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {orderedSkills.slice(0, 4).map((skill) => {
              const isShared = commonSkillSet.has(skill.trim().toLowerCase());
              return (
                <span
                  key={skill}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    isShared
                      ? "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200/70"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {skill}
                </span>
              );
            })}
            {orderedSkills.length > 4 && (
              <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-400">
                +{orderedSkills.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center gap-2 pt-1">
        <Link
          href={`/students/${student.id}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-700"
        >
          <UserRound className="h-3.5 w-3.5" />
          View Profile
        </Link>

        {student.connectionStatus === "none" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onConnect(student)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UserPlus className="h-3.5 w-3.5" />
            {busy ? "Sending..." : "Connect"}
          </button>
        )}

        {student.connectionStatus === "pending_sent" && (
          <button
            type="button"
            disabled
            className="flex flex-1 cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700"
          >
            <Clock className="h-3.5 w-3.5" />
            Pending
          </button>
        )}

        {student.connectionStatus === "pending_received" && (
          <button
            type="button"
            disabled={busy || !student.pendingRequestId}
            onClick={() => onAcceptRequest(student)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UserCheck className="h-3.5 w-3.5" />
            {busy ? "Accepting..." : "Accept Request"}
          </button>
        )}

        {student.connectionStatus === "connected" && (
          <Link
            href="/messages"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Message
          </Link>
        )}
      </div>
    </article>
  );
}
