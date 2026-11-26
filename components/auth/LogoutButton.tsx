"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import type { ApiResponse } from "@/types";

type LogoutButtonProps = {
  className: string;
  iconClassName?: string;
};

export default function LogoutButton({
  className,
  iconClassName = "h-4 w-4",
}: LogoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });
      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Unable to log out. Please try again.");
        return;
      }

      window.location.replace("/login");
    } catch {
      setError("Unable to log out. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        aria-busy={loading}
        className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <LogOut className={iconClassName} />
        <span>{loading ? "Logging out..." : "Logout"}</span>
      </button>
      {error && (
        <p role="alert" className="mt-2 px-3 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
