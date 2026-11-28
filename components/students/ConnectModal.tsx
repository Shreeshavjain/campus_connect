"use client";

import { useEffect, useState } from "react";
import { UserPlus, X } from "lucide-react";
import type { DiscoveryStudent, RequestType } from "@/types";

type ConnectModalProps = {
  student: DiscoveryStudent | null;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: {
    toUserId: string;
    type: RequestType;
    title: string;
    message?: string;
    skills?: string[];
  }) => Promise<void>;
};

export default function ConnectModal({
  student,
  submitting,
  error,
  onClose,
  onSubmit,
}: ConnectModalProps) {
  const [type, setType] = useState<RequestType>("FREE");
  const [title, setTitle] = useState("Let's connect on Campus Connect");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!student) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [student, submitting, onClose]);

  if (!student) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3) return;
    await onSubmit({
      toUserId: student.id,
      type,
      title: trimmedTitle,
      message: message.trim() || undefined,
      skills: student.commonSkills.slice(0, 5),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-modal-title"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="connect-modal-title"
                className="text-base font-bold text-slate-900"
              >
                Connect with {student.name}
              </h2>
              <p className="text-xs text-slate-500">
                Send a connection or skill-swap request
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Request Type
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {(
                [
                  { value: "FREE", label: "Connect" },
                  { value: "SKILL_SWAP", label: "Skill Swap" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    type === option.value
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="connect-title"
              className="block text-xs font-semibold text-slate-700"
            >
              Subject
            </label>
            <input
              id="connect-title"
              type="text"
              required
              minLength={3}
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-50"
            />
          </div>

          <div>
            <label
              htmlFor="connect-message"
              className="block text-xs font-semibold text-slate-700"
            >
              Note <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="connect-message"
              rows={3}
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Say hi to ${student.name} or mention what you'd like to collaborate on...`}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-50"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || title.trim().length < 3}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Sending..." : "Send Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
