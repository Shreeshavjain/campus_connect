"use client";

import { useState, type FormEvent } from "react";
import {
  ExternalLink,
  CodeXml,
  Globe,
  Camera,
  Contact,
  LoaderCircle,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type {
  ProfileAchievement,
  ProfileProject,
  ProfileUpdate,
  StudentProfile,
} from "@/types";

type ProfileEditModalProps = {
  profile: StudentProfile;
  onClose: () => void;
  onSave: (profile: ProfileUpdate) => Promise<void>;
};

const inputClassName =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50";

function splitList(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

export default function ProfileEditModal({
  profile,
  onClose,
  onSave,
}: ProfileEditModalProps) {
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [campus, setCampus] = useState(profile.campus);
  const [branch, setBranch] = useState(profile.branch);
  const [year, setYear] = useState(profile.year?.toString() ?? "");
  const [skills, setSkills] = useState(profile.skills.join(", "));
  const [interests, setInterests] = useState(profile.interests.join(", "));
  const [socialLinks, setSocialLinks] = useState(profile.socialLinks);
  const [projects, setProjects] = useState(profile.projects);
  const [projectTechDrafts, setProjectTechDrafts] = useState<Record<string, string>>(
    Object.fromEntries(
      profile.projects.map((project) => [
        project.id,
        project.technologies.join(", "),
      ])
    )
  );
  const [achievements, setAchievements] = useState(profile.achievements);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateProject(
    id: string,
    field: Exclude<keyof ProfileProject, "technologies">,
    value: string
  ) {
    setProjects((current) =>
      current.map((project) =>
        project.id === id
          ? { ...project, [field]: value }
          : project
      )
    );
  }

  function updateAchievement(
    id: string,
    field: keyof ProfileAchievement,
    value: string
  ) {
    setAchievements((current) =>
      current.map((achievement) =>
        achievement.id === id
          ? { ...achievement, [field]: value }
          : achievement
      )
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await onSave({
        name: name.trim(),
        bio: bio.trim(),
        campus: campus.trim(),
        branch: branch.trim(),
        year: year ? Number(year) : null,
        skills: splitList(skills),
        interests: splitList(interests),
        socialLinks,
        projects: projects.map((project) => ({
          ...project,
          technologies: splitList(
            projectTechDrafts[project.id] ?? project.technologies.join(", ")
          ),
        })),
        achievements,
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "We couldn't save your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        aria-labelledby="edit-profile-title"
        aria-modal="true"
        className="max-h-[94vh] w-full max-w-3xl overflow-hidden rounded-t-3xl border border-white/70 bg-white shadow-2xl sm:rounded-3xl"
        role="dialog"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
              Your profile
            </p>
            <h2
              className="mt-1 text-xl font-bold tracking-tight text-slate-900"
              id="edit-profile-title"
            >
              Make it yours
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Share what you&apos;re learning and building.
            </p>
          </div>
          <button
            aria-label="Close edit profile"
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="flex max-h-[calc(94vh-88px)] flex-col" onSubmit={handleSubmit}>
          <div className="space-y-7 overflow-y-auto px-5 py-6 sm:px-7">
            <section className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Full name
                <input
                  autoComplete="name"
                  className={inputClassName}
                  maxLength={100}
                  minLength={2}
                  onChange={(event) => setName(event.target.value)}
                  required
                  value={name}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                College / campus
                <input
                  className={inputClassName}
                  maxLength={120}
                  onChange={(event) => setCampus(event.target.value)}
                  placeholder="Your campus"
                  value={campus}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Branch / department
                <input
                  className={inputClassName}
                  maxLength={120}
                  onChange={(event) => setBranch(event.target.value)}
                  placeholder="e.g. Computer Science"
                  value={branch}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Year of study
                <select
                  className={inputClassName}
                  onChange={(event) => setYear(event.target.value)}
                  value={year}
                >
                  <option value="">Not specified</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((studyYear) => (
                    <option key={studyYear} value={studyYear}>
                      Year {studyYear}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Short bio
                <textarea
                  className={`${inputClassName} min-h-24 resize-y`}
                  maxLength={500}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="A little about what you do, learn, or hope to build..."
                  value={bio}
                />
                <span className="mt-1 block text-right text-xs text-slate-400">
                  {bio.length}/500
                </span>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Skills
                <textarea
                  className={`${inputClassName} min-h-20 resize-y`}
                  onChange={(event) => setSkills(event.target.value)}
                  placeholder="React, Python, UI/UX"
                  value={skills}
                />
                <span className="mt-1 block text-xs font-normal text-slate-400">
                  Separate skills with commas or new lines.
                </span>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Interests
                <textarea
                  className={`${inputClassName} min-h-20 resize-y`}
                  onChange={(event) => setInterests(event.target.value)}
                  placeholder="Open source, robotics, design"
                  value={interests}
                />
                <span className="mt-1 block text-xs font-normal text-slate-400">
                  Separate interests with commas or new lines.
                </span>
              </label>
            </section>

            <section>
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Social links
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Use complete links starting with https://
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["github", "GitHub", CodeXml],
                    ["linkedin", "LinkedIn", Contact],
                    ["portfolio", "Portfolio", Globe],
                    ["instagram", "Instagram", Camera],
                  ] as const
                ).map(([key, label, Icon]) => (
                  <label
                    className="text-sm font-medium text-slate-700"
                    key={key}
                  >
                    {label}
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        className={`${inputClassName} pl-9`}
                        onChange={(event) =>
                          setSocialLinks((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                        placeholder="https://"
                        type="url"
                        value={socialLinks[key]}
                      />
                    </div>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Projects
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Highlight work you&apos;re proud of.
                  </p>
                </div>
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  onClick={() =>
                    setProjects((current) => [
                      ...current,
                      {
                        id: crypto.randomUUID(),
                        title: "",
                        description: "",
                        technologies: [],
                        githubUrl: "",
                        liveUrl: "",
                      },
                    ])
                  }
                  type="button"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add project
                </button>
              </div>
              {projects.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-500">
                  No projects added yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {projects.map((project, index) => (
                    <div
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                      key={project.id}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Project {index + 1}
                        </p>
                        <button
                          aria-label={`Remove ${project.title || `project ${index + 1}`}`}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          onClick={() =>
                            setProjects((current) =>
                              current.filter((item) => item.id !== project.id)
                            )
                          }
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-xs font-medium text-slate-600 sm:col-span-2">
                          Title
                          <input
                            className={inputClassName}
                            maxLength={120}
                            onChange={(event) =>
                              updateProject(project.id, "title", event.target.value)
                            }
                            placeholder="Project name"
                            value={project.title}
                          />
                        </label>
                        <label className="text-xs font-medium text-slate-600 sm:col-span-2">
                          Description
                          <textarea
                            className={`${inputClassName} min-h-20 resize-y`}
                            maxLength={1000}
                            onChange={(event) =>
                              updateProject(
                                project.id,
                                "description",
                                event.target.value
                              )
                            }
                            placeholder="What does it do?"
                            value={project.description}
                          />
                        </label>
                        <label className="text-xs font-medium text-slate-600 sm:col-span-2">
                          Technologies
                          <input
                            className={inputClassName}
                            onChange={(event) =>
                              setProjectTechDrafts((current) => ({
                                ...current,
                                [project.id]: event.target.value,
                              }))
                            }
                            placeholder="Next.js, MongoDB, Tailwind"
                            value={
                              projectTechDrafts[project.id] ??
                              project.technologies.join(", ")
                            }
                          />
                        </label>
                        <label className="text-xs font-medium text-slate-600">
                          GitHub repository
                          <input
                            className={inputClassName}
                            onChange={(event) =>
                              updateProject(
                                project.id,
                                "githubUrl",
                                event.target.value
                              )
                            }
                            placeholder="https://github.com/..."
                            type="url"
                            value={project.githubUrl}
                          />
                        </label>
                        <label className="text-xs font-medium text-slate-600">
                          Live demo
                          <input
                            className={inputClassName}
                            onChange={(event) =>
                              updateProject(
                                project.id,
                                "liveUrl",
                                event.target.value
                              )
                            }
                            placeholder="https://"
                            type="url"
                            value={project.liveUrl}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Achievements
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Certificates, awards, hackathons, and milestones.
                  </p>
                </div>
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  onClick={() =>
                    setAchievements((current) => [
                      ...current,
                      {
                        id: crypto.randomUUID(),
                        title: "",
                        category: "Certificate",
                        description: "",
                        date: "",
                      },
                    ])
                  }
                  type="button"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add achievement
                </button>
              </div>
              {achievements.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-500">
                  No achievements added yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {achievements.map((achievement, index) => (
                    <div
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                      key={achievement.id}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Achievement {index + 1}
                        </p>
                        <button
                          aria-label={`Remove ${achievement.title || `achievement ${index + 1}`}`}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          onClick={() =>
                            setAchievements((current) =>
                              current.filter(
                                (item) => item.id !== achievement.id
                              )
                            )
                          }
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-xs font-medium text-slate-600">
                          Title
                          <input
                            className={inputClassName}
                            maxLength={120}
                            onChange={(event) =>
                              updateAchievement(
                                achievement.id,
                                "title",
                                event.target.value
                              )
                            }
                            placeholder="Achievement title"
                            value={achievement.title}
                          />
                        </label>
                        <label className="text-xs font-medium text-slate-600">
                          Type
                          <select
                            className={inputClassName}
                            onChange={(event) =>
                              updateAchievement(
                                achievement.id,
                                "category",
                                event.target.value
                              )
                            }
                            value={achievement.category}
                          >
                            {[
                              "Certificate",
                              "Hackathon",
                              "Award",
                              "Academic",
                              "Other",
                            ].map((category) => (
                              <option key={category}>{category}</option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs font-medium text-slate-600">
                          Date
                          <input
                            className={inputClassName}
                            onChange={(event) =>
                              updateAchievement(
                                achievement.id,
                                "date",
                                event.target.value
                              )
                            }
                            placeholder="e.g. 2025"
                            value={achievement.date}
                          />
                        </label>
                        <label className="text-xs font-medium text-slate-600">
                          Description
                          <input
                            className={inputClassName}
                            maxLength={500}
                            onChange={(event) =>
                              updateAchievement(
                                achievement.id,
                                "description",
                                event.target.value
                              )
                            }
                            placeholder="Optional details"
                            value={achievement.description}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="border-t border-slate-100 bg-white px-5 py-4 sm:px-7">
            {error && (
              <p
                className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
                role="alert"
              >
                {error}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                disabled={saving}
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={saving}
                type="submit"
              >
                {saving ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                {saving ? "Saving profile..." : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
