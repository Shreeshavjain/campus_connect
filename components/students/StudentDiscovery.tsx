"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  GraduationCap,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  Wrench,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StudentCard from "@/components/students/StudentCard";
import ConnectModal from "@/components/students/ConnectModal";
import type {
  ApiResponse,
  DiscoveryStudent,
  RequestType,
  StudentConnectionStatus,
  StudentDiscoveryData,
  StudentDiscoveryFilter,
} from "@/types";

const FILTER_TABS: {
  id: StudentDiscoveryFilter;
  label: string;
  icon: typeof Sparkles;
  badge?: string;
}[] = [
  { id: "for_you", label: "For You", icon: Sparkles },
  { id: "same_class", label: "Same Class", icon: GraduationCap },
  { id: "same_clubs", label: "Same Clubs", icon: Building2, badge: "Soon" },
  { id: "skills", label: "Skills", icon: Wrench },
  { id: "all", label: "All Students", icon: Users },
];

function CardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-2xl border border-slate-200 bg-white p-5"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 animate-pulse rounded-full bg-slate-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-28 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="mt-5 flex gap-2">
            <div className="h-9 flex-1 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-9 flex-1 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StudentDiscovery() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<StudentDiscoveryFilter>("for_you");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [page, setPage] = useState(1);

  const [recommendations, setRecommendations] = useState<DiscoveryStudent[]>(
    []
  );
  const [students, setStudents] = useState<DiscoveryStudent[]>([]);
  const [pagination, setPagination] = useState<
    StudentDiscoveryData["pagination"] | null
  >(null);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [userContext, setUserContext] = useState<
    StudentDiscoveryData["filters"]["currentUserContext"] | null
  >(null);
  const [capabilities, setCapabilities] = useState<
    StudentDiscoveryData["capabilities"]
  >({ clubs: false, section: false });

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [connectTarget, setConnectTarget] = useState<DiscoveryStudent | null>(
    null
  );
  const [submittingConnect, setSubmittingConnect] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [busyStudentId, setBusyStudentId] = useState<string | null>(null);
  const [actionBanner, setActionBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Debounce search input cleanly
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery((prev) => {
        const next = searchInput.trim();
        if (prev !== next) {
          setLoading(true);
          setPage(1);
        }
        return next;
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const applyDiscoveryPayload = useCallback(
    (payload: StudentDiscoveryData, targetPage: number, append: boolean) => {
      if (targetPage === 1) {
        setRecommendations(payload.recommendations);
      }
      setStudents((prev) => {
        if (!append) return payload.students;
        const existingIds = new Set(prev.map((s) => s.id));
        const next = payload.students.filter((s) => !existingIds.has(s.id));
        return [...prev, ...next];
      });
      setPagination(payload.pagination);
      setAvailableSkills(payload.filters.availableSkills);
      setUserContext(payload.filters.currentUserContext);
      setCapabilities(payload.capabilities);
    },
    []
  );

  const buildQueryString = useCallback(
    (targetPage: number) => {
      const params = new URLSearchParams({
        filter: activeFilter,
        page: String(targetPage),
        limit: "12",
      });
      if (debouncedQuery) params.set("q", debouncedQuery);
      if (activeFilter === "skills" && selectedSkill) {
        params.set("skill", selectedSkill);
      }
      return params.toString();
    },
    [activeFilter, debouncedQuery, selectedSkill]
  );

  const fetchStudents = useCallback(
    async (targetPage: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const res = await fetch(`/api/students?${buildQueryString(targetPage)}`, {
          cache: "no-store",
        });
        const json: ApiResponse<StudentDiscoveryData> = await res.json();

        if (!res.ok || !json.success || !json.data) {
          setError(json.message || "Failed to load students.");
          return;
        }

        applyDiscoveryPayload(json.data, targetPage, append);
      } catch (err) {
        console.error("Student discovery fetch error:", err);
        setError("A network error occurred while loading students.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [applyDiscoveryPayload, buildQueryString]
  );

  useEffect(() => {
    let active = true;

    fetch(`/api/students?${buildQueryString(1)}`, { cache: "no-store" })
      .then(async (res) => ({
        res,
        json: (await res.json()) as ApiResponse<StudentDiscoveryData>,
      }))
      .then(({ res, json }) => {
        if (!active) return;
        if (!res.ok || !json.success || !json.data) {
          setError(json.message || "Failed to load students.");
          return;
        }
        setError(null);
        applyDiscoveryPayload(json.data, 1, false);
      })
      .catch((err) => {
        if (!active) return;
        console.error("Student discovery fetch error:", err);
        setError("A network error occurred while loading students.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [applyDiscoveryPayload, buildQueryString]);

  const handleFilterChange = (nextFilter: StudentDiscoveryFilter) => {
    setLoading(true);
    setError(null);
    setActiveFilter(nextFilter);
    if (nextFilter !== "skills") {
      setSelectedSkill("");
    }
    setPage(1);
  };

  const handleLoadMore = () => {
    if (!pagination?.hasMore || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchStudents(nextPage, true);
  };

  const updateStudentConnectionState = (
    studentId: string,
    nextStatus: StudentConnectionStatus
  ) => {
    const patchList = (list: DiscoveryStudent[]) =>
      list.map((s) =>
        s.id === studentId ? { ...s, connectionStatus: nextStatus } : s
      );

    setStudents(patchList);
    setRecommendations(patchList);
  };

  const handleSendConnection = async (payload: {
    toUserId: string;
    type: RequestType;
    title: string;
    message?: string;
    skills?: string[];
  }) => {
    setSubmittingConnect(true);
    setConnectError(null);
    setBusyStudentId(payload.toUserId);

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json: ApiResponse<{ id: string; status: string; toUser: string }> =
        await res.json();

      if (!res.ok || !json.success) {
        setConnectError(json.message || "Could not send connection request.");
        return;
      }

      updateStudentConnectionState(payload.toUserId, "pending_sent");
      const targetName = connectTarget?.name ?? "student";
      setConnectTarget(null);
      setActionBanner({
        type: "success",
        text: `Connection request sent to ${targetName}.`,
      });
    } catch (err) {
      console.error("Connect request error:", err);
      setConnectError("Network error while sending request. Please try again.");
    } finally {
      setSubmittingConnect(false);
      setBusyStudentId(null);
    }
  };

  const handleAcceptRequest = async (student: DiscoveryStudent) => {
    if (!student.pendingRequestId) return;
    setBusyStudentId(student.id);
    setActionBanner(null);

    try {
      const res = await fetch(
        `/api/requests/${encodeURIComponent(student.pendingRequestId)}/accept`,
        { method: "POST" }
      );
      const json: ApiResponse<{ conversationId: string }> = await res.json();

      if (!res.ok || !json.success) {
        setActionBanner({
          type: "error",
          text: json.message || "Could not accept request.",
        });
        return;
      }

      updateStudentConnectionState(student.id, "connected");
      setActionBanner({
        type: "success",
        text: `You are now connected with ${student.name}.`,
      });
    } catch (err) {
      console.error("Accept request error:", err);
      setActionBanner({
        type: "error",
        text: "Network error while accepting request.",
      });
    } finally {
      setBusyStudentId(null);
    }
  };

  const showRecommendationsSection =
    !loading &&
    !error &&
    recommendations.length > 0 &&
    !debouncedQuery &&
    activeFilter === "for_you";

  const topRecommendations = showRecommendationsSection
    ? recommendations.slice(0, 3)
    : [];
  const recommendedIds = new Set(topRecommendations.map((s) => s.id));
  const directoryStudents = showRecommendationsSection
    ? students.filter((s) => !recommendedIds.has(s.id))
    : students;

  return (
    <DashboardLayout>
      {/* Page Header */}
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Discover Students
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Find classmates across your branch, year, and shared technical skills.
          </p>
        </div>

        {userContext &&
          (!userContext.branch ||
            !userContext.year ||
            userContext.skillsCount === 0) && (
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 self-start rounded-xl border border-indigo-200 bg-indigo-50/70 px-3.5 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Complete profile for better matches
            </Link>
          )}
      </section>

      {/* Action Feedback Banner */}
      {actionBanner && (
        <div
          className={`mb-5 flex items-center justify-between rounded-xl border px-4 py-3 text-xs font-medium ${
            actionBanner.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <span>{actionBanner.text}</span>
          <button
            type="button"
            onClick={() => setActionBanner(null)}
            aria-label="Dismiss notification"
            className="rounded p-1 hover:bg-black/5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Search + Filter Controls */}
      <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search students by name, branch, skills, or interests..."
            aria-label="Search students"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-50"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {FILTER_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleFilterChange(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                  isActive
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Skill Sub-Chips when Skills filter is active */}
        {activeFilter === "skills" && availableSkills.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
            <span className="mr-1 text-[11px] font-semibold text-slate-400">
              Filter skill:
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedSkill("");
                setPage(1);
              }}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                selectedSkill === ""
                  ? "bg-purple-100 text-purple-800"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Any skill
            </button>
            {availableSkills.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => {
                  setSelectedSkill(skill);
                  setPage(1);
                }}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                  selectedSkill.toLowerCase() === skill.toLowerCase()
                    ? "bg-purple-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-700"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Ranked Recommendations Section (Top) */}
      {showRecommendationsSection && (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                Recommended For You
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Prioritized by shared branch &amp; year, skills, and interests.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {topRecommendations.map((student) => (
              <StudentCard
                key={`rec-${student.id}`}
                student={student}
                featured
                busy={busyStudentId === student.id}
                onConnect={(target) => {
                  setConnectError(null);
                  setConnectTarget(target);
                }}
                onAcceptRequest={handleAcceptRequest}
              />
            ))}
          </div>
        </section>
      )}

      {/* Main Directory Results */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {activeFilter === "for_you"
                ? debouncedQuery
                  ? "Matching Students"
                  : "Discover More Peers"
                : activeFilter === "same_class"
                ? "Same Branch & Year"
                : activeFilter === "same_clubs"
                ? "Same Clubs"
                : activeFilter === "skills"
                ? selectedSkill
                  ? `Students with "${selectedSkill}"`
                  : "Students by Skills"
                : "All Campus Students"}
            </h2>
            {!loading && !error && pagination && activeFilter !== "same_clubs" && (
              <p className="mt-0.5 text-xs text-slate-500">
                Showing {directoryStudents.length} of{" "}
                {Math.max(0, pagination.total - topRecommendations.length)}{" "}
                {Math.max(0, pagination.total - topRecommendations.length) === 1
                  ? "student"
                  : "students"}
              </p>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <CardSkeletonGrid count={6} />
        ) : error ? (
          /* Error State */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-white px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-slate-900">
              Unable to load students
            </h3>
            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
              {error}
            </p>
            <button
              type="button"
              onClick={() => fetchStudents(1, false)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        ) : activeFilter === "same_clubs" && !capabilities.clubs ? (
          /* Unsupported Club Matching Empty State */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-600">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-slate-900">
              Club matching is coming soon
            </h3>
            <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
              Campus club memberships are not stored in student profiles yet.
              Use <span className="font-semibold text-slate-700">For You</span>,{" "}
              <span className="font-semibold text-slate-700">Same Class</span>, or{" "}
              <span className="font-semibold text-slate-700">Skills</span> to
              discover peers now.
            </p>
            <button
              type="button"
              onClick={() => handleFilterChange("for_you")}
              className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
            >
              Browse For You
            </button>
          </div>
        ) : directoryStudents.length === 0 ? (
          /* Empty State */
          showRecommendationsSection ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-8 text-center">
              <p className="text-xs text-slate-500">
                All currently registered students are shown in{" "}
                <span className="font-semibold text-slate-700">
                  Recommended For You
                </span>{" "}
                above.
              </p>
            </div>
          ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-slate-900">
              {activeFilter === "same_class" &&
              !userContext?.branch &&
              !userContext?.year
                ? "Add your branch and year first"
                : debouncedQuery
                ? "No students match your search"
                : "No students found here yet"}
            </h3>
            <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
              {activeFilter === "same_class" &&
              !userContext?.branch &&
              !userContext?.year
                ? "Update your profile with your branch and academic year so we can match classmates accurately."
                : debouncedQuery
                ? "Try clearing your search or switching to All Students."
                : "Check back as more students join Campus Connect or try another filter."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {activeFilter === "same_class" &&
                !userContext?.branch &&
                !userContext?.year && (
                  <Link
                    href="/profile"
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Update Profile
                  </Link>
                )}
              {(debouncedQuery || activeFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setDebouncedQuery("");
                    setSelectedSkill("");
                    setActiveFilter("all");
                    setPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  View All Students
                </button>
              )}
            </div>
          </div>
          )
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {directoryStudents.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  busy={busyStudentId === student.id}
                  onConnect={(target) => {
                    setConnectError(null);
                    setConnectTarget(target);
                  }}
                  onAcceptRequest={handleAcceptRequest}
                />
              ))}
            </div>

            {/* Incremental Pagination */}
            {pagination?.hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={handleLoadMore}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingMore ? "Loading more..." : "Load more students"}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Connect Request Modal */}
      <ConnectModal
        key={connectTarget?.id ?? "closed"}
        student={connectTarget}
        submitting={submittingConnect}
        error={connectError}
        onClose={() => {
          setConnectTarget(null);
          setConnectError(null);
        }}
        onSubmit={handleSendConnection}
      />
    </DashboardLayout>
  );
}
