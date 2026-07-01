"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useTheme } from "@/hooks/use-theme";

const ROLE_LABELS: Record<string, string> = {
  owner: "মালিক",
  admin: "অ্যাডমিন",
  manager: "ম্যানেজার",
  staff: "স্টাফ",
  viewer: "দর্শক",
};

function getInitials(name: string | null): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function ProfileDropdown() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [lang, setLang] = useState(() => typeof window !== "undefined" ? localStorage.getItem("lang") || "bn" : "bn");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data, error }) => {
      if (!error && data.user) {
        setUserEmail(data.user.email || null);
        setUserName(data.user.user_metadata?.full_name || null);
        setProfileImage(data.user.user_metadata?.profile_image_url || null);

        const { data: membership } = await supabase
          .from("organization_members")
          .select("role")
          .eq("user_id", data.user.id)
          .limit(1)
          .maybeSingle();

        if (membership) {
          setUserRole(membership.role);
        }
      }
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 transition hover:bg-muted"
        aria-label={`User menu${userName ? `: ${userName}` : ""}`}
      >
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-sm font-semibold text-white">
          {profileImage ? (
            <img src={profileImage} alt="" className="h-full w-full object-cover" />
          ) : (
            getInitials(userName)
          )}
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-sm font-medium leading-tight text-foreground">
            {userName ?? "ব্যবহারকারী"}
          </p>
          <p className="text-xs leading-tight text-muted-foreground">
            {userRole ? ROLE_LABELS[userRole] ?? userRole : "লোড হচ্ছে..."}
          </p>
        </div>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-border bg-card shadow-lg">
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-lg font-semibold text-white">
                {profileImage ? (
                  <img src={profileImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  getInitials(userName)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {userName ?? "ব্যবহারকারী"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {userEmail ?? "ইমেল নেই"}
                </p>
                {userRole && (
                  <span className="mt-1 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                    {ROLE_LABELS[userRole] ?? userRole}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1 px-2 py-2">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition hover:bg-muted"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 text-muted-foreground">
                <path d="M12 2l.95 2.43a8.5 8.5 0 0 1 3.3 1.37l2.47-1.06 1.06 2.47-2.43.95a8.5 8.5 0 0 1 0 3.68l2.43.95-1.06 2.47-2.47-1.06a8.5 8.5 0 0 1-3.3 1.37L12 22l-.95-2.43a8.5 8.5 0 0 1-3.3-1.37l-2.47 1.06-1.06-2.47 2.43-.95a8.5 8.5 0 0 1 0-3.68l-2.43-.95 1.06-2.47 2.47 1.06a8.5 8.5 0 0 1 3.3-1.37L12 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              সেটিংস
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition hover:bg-muted"
            >
              <span className="flex h-5 w-5 items-center justify-center text-muted-foreground">
                {isDark ? "☀️" : "🌙"}
              </span>
              {isDark ? "লাইট মোড" : "ডার্ক মোড"}
            </button>

            <button
              type="button"
              onClick={() => {
                const next = lang === "en" ? "bn" : "en";
                localStorage.setItem("lang", next);
                setLang(next);
                window.location.reload();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition hover:bg-muted"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 text-muted-foreground">
                <path d="M12 2a10 10 0 1 0 10 10M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {lang === "en" ? "BN" : "EN"}
            </button>
          </div>

          <div className="border-t border-border px-2 py-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14l5-5-5-5m5 5H9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              লগআউট
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
