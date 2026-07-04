"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

function getValidationError(email: string, password: string) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return "Please enter a valid email address.";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters.";
  }

  return null;
}

function isEmailNotConfirmedError(err: { message?: string; code?: string } | null) {
  if (!err) return false;
  if (err.code === "email_not_confirmed") return true;
  return /email not confirmed/i.test(err.message ?? "");
}

const oauthProviders = [
  { provider: "google", label: "Sign in with Google" },
  { provider: "github", label: "Sign in with GitHub" },
] as const;

type OAuthProvider = (typeof oauthProviders)[number]["provider"];

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [pendingConfirmEmail, setPendingConfirmEmail] = useState<string | null>(null);

  useEffect(() => {
    for (const c of document.cookie.split("; ")) {
      const [name] = c.split("=");
      if (/^sb-.+-auth-token/.test(name ?? "")) {
        document.cookie = `${name}=; Path=/; Max-Age=0; Domain=${location.hostname}`;
        document.cookie = `${name}=; Path=/; Max-Age=0`;
      }
    }
  }, []);

  const isLogin = mode === "login";
  const title = isLogin ? "Welcome Back" : "Create Account";
  const subtitle = isLogin
    ? "Sign in to your SocialShopBD account."
    : "Start your business with SocialShopBD.";

  const redirectTo = useMemo(() => {
    const nextParam = searchParams.get("next");
    return nextParam && nextParam.startsWith("/") ? nextParam : "/";
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setPendingConfirmEmail(null);

    const validationError = getValidationError(email.trim(), password);
    if (validationError) {
      setError(validationError);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    setIsLoading(true);

    if (isLogin) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      setIsLoading(false);

      if (signInError) {
        if (isEmailNotConfirmedError(signInError)) {
          setPendingConfirmEmail(email.trim());
          setError(
            "Please confirm your email before signing in. Check your inbox and spam. You can resend below.",
          );
        } else {
          setError("Invalid email or password. Please try again.");
        }
        return;
      }

      setIsRedirecting(true);
      setTimeout(() => {
        router.replace(redirectTo);
        router.refresh();
      }, 650);
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/login`,
      },
    });

    setIsLoading(false);

    if (signUpError) {
      setError("Something went wrong. Please try again.");
      return;
    }

    if (signUpData.session) {
      router.replace(redirectTo);
      router.refresh();
      return;
    }

    setPendingConfirmEmail(email.trim());
    setInfo(
      "We've sent a confirmation email. Click the link and sign in again. Please also check your spam folder.",
    );
  };

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    setError(null);
    setInfo(null);
    setIsLoading(true);

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    setIsLoading(false);
    if (error) {
      setError("Something went wrong. Please try again.");
    }
  };

  const handleResendConfirmation = async () => {
    const target = pendingConfirmEmail ?? email.trim();
    if (!target) return;

    setError(null);
    setInfo(null);
    setIsLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: target,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    setIsLoading(false);

    if (resendError) {
      setError("Something went wrong. Please try again.");
      return;
    }

    setInfo("Confirmation email resent. Check your inbox and spam.");
  };

  return (
    <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      {isRedirecting ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-slate-950/95 px-6 py-8 text-center">
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-100">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-600 border-t-sky-400" />
            </div>
            <p className="text-lg font-semibold text-white">Signing you in…</p>
            <p className="max-w-xs text-sm leading-6 text-slate-400">
              Secure login in progress. Redirecting to Dashboard…
            </p>
          </div>
        </div>
      ) : null}

      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">SocialShopBD</p>
        <h1 className="mt-2 text-2xl font-semibold text-card-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="space-y-3">
        {oauthProviders.map(({ provider, label }) => (
          <button
            key={provider}
            type="button"
            disabled={isLoading}
            onClick={() => handleOAuthSignIn(provider)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
          >
            {label}
          </button>
        ))}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>Or use email and password</span>
          <span className="h-px flex-1 bg-border" />
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-card-foreground">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-card-foreground">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500"
            required
          />
        </label>

        {error && <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p>}
        {info && <p className="rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-700">{info}</p>}

        {pendingConfirmEmail && (
          <button
            type="button"
            disabled={isLoading}
            onClick={handleResendConfirmation}
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
          >
            Resend Confirmation Email
          </button>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
        </button>
      </form>

      <p className="mt-4 text-sm text-muted-foreground">
        {isLogin ? "No account?" : "Already have an account?"}{" "}
        <Link href={isLogin ? "/signup" : "/login"} className="font-medium text-blue-600 hover:underline">
          {isLogin ? "Sign Up" : "Sign In"}
        </Link>
      </p>
    </div>
  );
}
