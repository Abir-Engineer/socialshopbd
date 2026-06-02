"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ToastItem = { id: number; message: string; variant: "success" | "error" };

function compressAndResizeImage(file: File, maxW = 128, maxH = 128): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxW) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          }
        } else {
          if (height > maxH) {
            width = Math.round((width * maxH) / height);
            height = maxH;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export function ProfileForm() {
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastSeq = useRef(0);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        setError(error.message);
      }
      if (data.user) {
        setUser(data.user);
        setFullName(data.user.user_metadata?.full_name || "");
        setPhone(data.user.user_metadata?.phone || "");
        setEmail(data.user.email || "");
        setProfileImageUrl(data.user.user_metadata?.profile_image_url || null);
      }
      setIsLoading(false);
    });
  }, []);



  const showToast = (message: string, variant: ToastItem["variant"]) => {
    const id = ++toastSeq.current;
    setToasts((prev) => [...prev, { id, message, variant }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    setProfileImageFile(file);
    if (profileImageUrl && profileImageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(profileImageUrl);
    }
    setProfileImageUrl(URL.createObjectURL(file));
    setError(null);
    setInfo(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (newPassword && newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setIsSaving(true);
    const supabase = getSupabaseBrowserClient();
    let profileImageData = user?.user_metadata?.profile_image_url || null;

    if (profileImageFile) {
      try {
        profileImageData = await compressAndResizeImage(profileImageFile);
      } catch {
        setIsSaving(false);
        setError("Unable to read profile image. Please try a different file.");
        return;
      }
    }

    const metadata = {
      ...((user?.user_metadata as Record<string, unknown>) || {}),
      full_name: fullName.trim(),
      phone: phone.trim(),
      profile_image_url: profileImageData,
    };

    const updates: { data: Record<string, unknown>; password?: string } = {
      data: metadata,
    };

    if (newPassword) {
      updates.password = newPassword;
    }

    const { error: updateError } = await supabase.auth.updateUser(updates);
    setIsSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setInfo("Profile saved successfully.");
    showToast("Profile updated.", "success");
    setNewPassword("");
    setConfirmPassword("");
    setCurrentPassword("");
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-5 w-64 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Profile</p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">User profile</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Keep your account details fresh and secure.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <section className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Profile photo</p>
            <div className="flex items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-muted">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="Profile preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm text-muted-foreground">No image</span>
                )}
              </div>
              <div>
                <label className="inline-flex cursor-pointer items-center rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground transition hover:bg-slate-700">
                  Upload image
                  <input type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
                </label>
                <p className="mt-2 text-sm text-muted-foreground">JPEG or PNG up to 2MB.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your full name"
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">Email address</label>
              <input
                type="email"
                value={email}
                readOnly
                className="mt-2 w-full rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-foreground outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">Phone number</label>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+8801XXXXXXXXX"
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
              />
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Security</p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">Change password</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Update your password periodically to keep your account secure.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground">Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Current password"
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="New password"
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</div>
          ) : null}
          {info ? (
            <div className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm text-emerald-700">{info}</div>
          ) : null}

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? "Saving profile…" : "Save profile"}
          </button>
        </section>
      </form>

      <div className="space-y-3">
        <div className="rounded-3xl border border-border bg-card p-5 text-sm text-muted-foreground">
          <h3 className="text-base font-semibold text-foreground">Profile preview</h3>
          <p className="mt-2">
            Use the profile form above to keep your name, phone and profile photo up to date. Your email is managed by Supabase.
          </p>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-3xl px-4 py-3 text-sm shadow-lg ${
              toast.variant === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
