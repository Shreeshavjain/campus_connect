"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  Award,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleUserRound,
  Clipboard,
  ExternalLink,
  CodeXml,
  Globe,
  Camera,
  Contact,
  Pencil,
  Sparkles,
  UsersRound,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProfileEditModal from "@/components/profile/ProfileEditModal";
import type {
  ApiResponse,
  ProfileUpdate,
  PublicStudentProfile,
  StudentProfile,
} from "@/types";

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getCompletion(profile: StudentProfile): number {
  const checks = [
    Boolean(profile.name.trim()),
    Boolean(profile.bio.trim()),
    Boolean(profile.campus.trim()),
    Boolean(profile.branch.trim()),
    profile.year !== null,
    profile.skills.length > 0,
    profile.interests.length > 0,
    profile.projects.length > 0,
    Object.values(profile.socialLinks).some(Boolean),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function ProfileSkeleton() {
  return (
    <div aria-label="Loading profile" className="animate-pulse space-y-6">
      <div className="h-52 rounded-3xl bg-gradient-to-r from-indigo-100 via-blue-50 to-white" />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <div className="h-48 rounded-2xl bg-white shadow-sm" />
          <div className="h-56 rounded-2xl bg-white shadow-sm" />
        </div>
        <div className="space-y-6">
          <div className="h-48 rounded-2xl bg-white shadow-sm" />
          <div className="h-56 rounded-2xl bg-white shadow-sm" />
        </div>
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  icon: Icon,
  count,
}: {
  eyebrow: string;
  title: string;
  icon: typeof BookOpen;
  count?: number;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-500">
          {eyebrow}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <h2 className="text-base font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          {count !== undefined && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ children }: { children: string }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-center text-sm leading-6 text-slate-500">
      {children}
    </p>
  );
}

export default function ProfilePage({ profileId }: { profileId?: string }) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const isPublicProfile = Boolean(profileId);
  const endpoint = profileId
    ? `/api/students/${encodeURIComponent(profileId)}`
    : "/api/profile";

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      const json: ApiResponse<StudentProfile | PublicStudentProfile> =
        await response.json();

      if (!response.ok || !json.success || !json.data) {
        setProfile(null);
        setNotFound(response.status === 404);
        setError(json.message || "We couldn't load your profile.");
        return;
      }

      setProfile(json.data);
    } catch (fetchError) {
      console.error("Profile fetch error:", fetchError);
      setError("A network error occurred. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    let active = true;

    fetch(endpoint, { cache: "no-store" })
      .then(async (response) => ({
        response,
        json: (await response.json()) as ApiResponse<
          StudentProfile | PublicStudentProfile
        >,
      }))
      .then(({ response, json }) => {
        if (!active) return;
        if (!response.ok || !json.success || !json.data) {
          setProfile(null);
          setNotFound(response.status === 404);
          setError(json.message || "We couldn't load your profile.");
          return;
        }
        setProfile(json.data);
      })
      .catch((fetchError: unknown) => {
        if (!active) return;
        console.error("Profile fetch error:", fetchError);
        setError("A network error occurred. Check your connection and try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [endpoint]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  async function saveProfile(update: ProfileUpdate) {
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    const json: ApiResponse<StudentProfile> = await response.json();

    if (!response.ok || !json.success || !json.data) {
      throw new Error(json.message || "We couldn't save your profile.");
    }

    setProfile(json.data);
    setEditOpen(false);
    setFeedback("Your profile has been updated.");
  }

  async function shareProfile() {
    const url = profile
      ? `${window.location.origin}/students/${profile.id}`
      : window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${profile?.name}'s profile`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setFeedback("Profile link copied to clipboard.");
      }
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name === "AbortError") return;
      console.error("Profile sharing error:", shareError);
      setFeedback("Unable to share this profile from your browser.");
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1120px] pb-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
              <span>Workspace</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-indigo-600">
                {isPublicProfile ? "Student profile" : "My profile"}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Your profile
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Bring your campus story, skills, and work together.
            </p>
          </div>
          {profile && !loading && (
            <button
              className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700 sm:inline-flex"
              onClick={() => void shareProfile()}
              type="button"
            >
              <Clipboard className="h-4 w-4" />
              Share
            </button>
          )}
        </div>

        {loading ? (
          <ProfileSkeleton />
        ) : error ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <CircleUserRound className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              {notFound ? "Profile not found" : "We couldn’t load your profile"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {error}
              {notFound && " Please sign in again to continue."}
            </p>
            <button
              className="mt-6 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              onClick={() => {
                setLoading(true);
                setError(null);
                setNotFound(false);
                void fetchProfile();
              }}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : profile ? (
          <>
            <section className="relative overflow-hidden rounded-3xl border border-indigo-100/80 bg-white shadow-[0_12px_40px_-24px_rgba(79,70,229,0.28)]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.12),transparent_38%),linear-gradient(112deg,#eef2ff_0%,#f8fbff_48%,#ffffff_100%)]" />
              <div className="absolute -right-14 -top-28 h-64 w-64 rounded-full border border-indigo-100/70" />
              <div className="absolute -right-2 -top-16 h-40 w-40 rounded-full border border-blue-100/70" />
              <div className="relative flex flex-col gap-6 p-5 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="relative mx-auto shrink-0 sm:mx-0">
                    <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-500 text-3xl font-bold text-white shadow-lg shadow-indigo-200/80 ring-4 ring-white sm:h-28 sm:w-28 sm:text-4xl">
                      {getInitials(profile.name)}
                    </div>
                    <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-xl border-2 border-white bg-emerald-500 text-white shadow-sm">
                      <Check className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="min-w-0 text-center sm:text-left">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-600 shadow-sm backdrop-blur">
                      <Sparkles className="h-3 w-3" />
                      {isPublicProfile ? "CampusConnect student" : "Student profile"}
                    </span>
                    <h2 className="mt-3 truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                      {profile.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {profile.branch || "Student"}
                      {profile.branch && profile.campus && (
                        <span className="px-1.5 text-slate-300">·</span>
                      )}
                      {profile.campus}
                      {profile.year !== null && (
                        <span className="text-slate-500">
                          {(profile.branch || profile.campus) && (
                            <span className="px-1.5 text-slate-300">·</span>
                          )}
                          Year {profile.year}
                        </span>
                      )}
                    </p>
                    {!isPublicProfile && profile.email && (
                      <p className="mt-1.5 truncate text-xs text-slate-500">
                        {profile.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:pb-1">
                  <div className="min-w-[170px] rounded-2xl border border-white/90 bg-white/75 p-3.5 shadow-sm backdrop-blur">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-medium text-slate-500">
                        Profile strength
                      </span>
                      <span className="font-bold text-indigo-700">
                        {getCompletion(profile)}%
                      </span>
                    </div>
                    <div
                      aria-label={`Profile ${getCompletion(profile)}% complete`}
                      className="mt-2 h-1.5 overflow-hidden rounded-full bg-indigo-100"
                      role="progressbar"
                      aria-valuemax={100}
                      aria-valuemin={0}
                      aria-valuenow={getCompletion(profile)}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 transition-all duration-700"
                        style={{ width: `${getCompletion(profile)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[10px] text-slate-400">
                      Complete details help you get discovered.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!isPublicProfile && (
                      <button
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 sm:flex-none"
                        onClick={() => setEditOpen(true)}
                        type="button"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit profile
                      </button>
                    )}
                    <button
                      aria-label="Share profile"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white bg-white/90 px-3.5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700 sm:hidden"
                      onClick={() => void shareProfile()}
                      type="button"
                    >
                      <Clipboard className="h-4 w-4" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.8fr)]">
              <div className="space-y-6">
                <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.35)] sm:p-6">
                  <SectionHeading eyebrow="The person behind the profile" title="About me" icon={BookOpen} />
                  {profile.bio ? (
                    <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                      {profile.bio}
                    </p>
                  ) : (
                    <EmptyState>
                      Add a short introduction to help classmates get to know you.
                    </EmptyState>
                  )}
                  <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2">
                    <div className="flex items-start gap-3 rounded-xl bg-slate-50/80 p-3.5">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-indigo-500 shadow-sm">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Education
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {profile.campus || "College not added"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl bg-slate-50/80 p-3.5">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-blue-500 shadow-sm">
                        <BriefcaseBusiness className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Department
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {profile.branch || "Department not added"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl bg-slate-50/80 p-3.5 sm:col-span-2">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-violet-500 shadow-sm">
                        <UsersRound className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Academic year
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {profile.year ? `Year ${profile.year}` : "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5">
                    <p className="mb-2.5 text-xs font-semibold text-slate-500">
                      Interests
                    </p>
                    {profile.interests.length ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.interests.map((interest) => (
                          <span
                            className="rounded-full border border-blue-100 bg-blue-50/70 px-3 py-1.5 text-xs font-medium text-blue-700"
                            key={interest}
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">
                        Add interests to find your people.
                      </p>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.35)] sm:p-6">
                  <SectionHeading
                    count={profile.projects.length}
                    eyebrow="Things you’ve made"
                    title="Projects"
                    icon={BriefcaseBusiness}
                  />
                  {profile.projects.length ? (
                    <div className="space-y-3">
                      {profile.projects.map((project) => (
                        <article
                          className="group rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/70 p-4 transition hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-100/40 sm:p-5"
                          key={project.id}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="font-bold text-slate-900">
                                {project.title}
                              </h3>
                              {project.description && (
                                <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-slate-500">
                                  {project.description}
                                </p>
                              )}
                            </div>
                            <div className="flex shrink-0 gap-2">
                              {project.githubUrl && (
                                <a
                                  aria-label={`Open ${project.title} GitHub repository`}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600"
                                  href={project.githubUrl}
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  <CodeXml className="h-4 w-4" />
                                </a>
                              )}
                              {project.liveUrl && (
                                <a
                                  aria-label={`Open ${project.title} live demo`}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600"
                                  href={project.liveUrl}
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          </div>
                          {project.technologies.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-1.5">
                              {project.technologies.map((technology) => (
                                <span
                                  className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700"
                                  key={`${project.id}-${technology}`}
                                >
                                  {technology}
                                </span>
                              ))}
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <EmptyState>
                      Your projects will show here. Add a project to share what
                      you’ve been building.
                    </EmptyState>
                  )}
                </section>
              </div>

              <div className="space-y-6">
                <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.35)] sm:p-6">
                  <SectionHeading
                    count={profile.skills.length}
                    eyebrow="What you bring"
                    title="Skills"
                    icon={Sparkles}
                  />
                  {profile.skills.length ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <span
                          className={`rounded-xl border px-3 py-2 text-xs font-semibold transition hover:-translate-y-0.5 ${
                            index % 3 === 0
                              ? "border-indigo-100 bg-indigo-50/80 text-indigo-700"
                              : index % 3 === 1
                                ? "border-blue-100 bg-blue-50/80 text-blue-700"
                                : "border-violet-100 bg-violet-50/80 text-violet-700"
                          }`}
                          key={skill}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <EmptyState>
                      No skills yet. Add the tools and strengths you’re growing.
                    </EmptyState>
                  )}
                </section>

                <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.35)] sm:p-6">
                  <SectionHeading
                    count={profile.achievements.length}
                    eyebrow="Milestones & recognition"
                    title="Achievements"
                    icon={Award}
                  />
                  {profile.achievements.length ? (
                    <div className="space-y-4">
                      {profile.achievements.map((achievement, index) => (
                        <div
                          className="relative flex gap-3"
                          key={achievement.id}
                        >
                          <div className="relative flex w-9 shrink-0 justify-center">
                            {index < profile.achievements.length - 1 && (
                              <span className="absolute bottom-[-18px] top-9 w-px bg-slate-100" />
                            )}
                            <span className="z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                              <Award className="h-4 w-4" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pb-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h3 className="text-sm font-semibold text-slate-800">
                                {achievement.title}
                              </h3>
                              {achievement.date && (
                                <span className="text-[10px] font-medium text-slate-400">
                                  {achievement.date}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-[11px] font-semibold text-indigo-600">
                              {achievement.category}
                            </p>
                            {achievement.description && (
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {achievement.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState>
                      Certificates, awards, and other milestones will appear here.
                    </EmptyState>
                  )}
                </section>

                <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.35)] sm:p-6">
                  <SectionHeading eyebrow="Find me online" title="Social links" icon={Globe} />
                  <div className="space-y-2">
                    {(
                      [
                        ["github", "GitHub", CodeXml],
                        ["linkedin", "LinkedIn", Contact],
                        ["portfolio", "Portfolio", Globe],
                        ["instagram", "Instagram", Camera],
                      ] as const
                    )
                      .filter(([key]) => profile.socialLinks[key])
                      .map(([key, label, Icon]) => (
                        <a
                          className="group flex items-center gap-3 rounded-xl border border-slate-100 px-3.5 py-3 transition hover:border-indigo-100 hover:bg-indigo-50/50"
                          href={profile.socialLinks[key]}
                          key={key}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <Icon className="h-4 w-4 text-slate-500 group-hover:text-indigo-600" />
                          <span className="flex-1 text-sm font-medium text-slate-600 group-hover:text-indigo-700">
                            {label}
                          </span>
                          <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-indigo-500" />
                        </a>
                      ))}
                    {!Object.values(profile.socialLinks).some(Boolean) && (
                      <EmptyState>
                        Add your GitHub, LinkedIn, or portfolio links to make it
                        easier to connect.
                      </EmptyState>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/80 p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                      <UsersRound className="h-[18px] w-[18px]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-500">
                        Stay in the loop
                      </p>
                      <h2 className="mt-0.5 text-sm font-bold text-slate-900">
                        Activity
                      </h2>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Group memberships and a personal activity feed aren&apos;t
                    available yet. Your profile details and projects are saved
                    and ready to share.
                  </p>
                </section>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {feedback && (
        <div
          className="fixed bottom-5 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-xl"
          role="status"
        >
          <Check className="h-4 w-4 text-emerald-600" />
          {feedback}
        </div>
      )}

      {editOpen && profile && !isPublicProfile && (
        <ProfileEditModal
          onClose={() => setEditOpen(false)}
          onSave={saveProfile}
          profile={profile}
        />
      )}
    </DashboardLayout>
  );
}
