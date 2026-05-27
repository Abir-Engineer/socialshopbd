import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceRoleClient } from "@/app/invite/actions";
import { InviteAcceptForm } from "@/app/invite/[token]/accept-form";
import { ShieldCheck, UserMinus, AlertTriangle } from "lucide-react";

type InviteOrg = {
  name: string;
};

export const dynamic = "force-dynamic";

interface InvitePageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  // 1. Get current logged-in user if any
  const userSupabase = await getSupabaseServerClient();
  const { data: { user } } = await userSupabase.auth.getUser();

  // 2. Fetch invitation details using service role
  const serviceSupabase = await getSupabaseServiceRoleClient();
  
  const { data: invite } = await serviceSupabase
    .from("organization_invitations")
    .select("*, organizations(name)")
    .eq("token", token)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  // 3. Render Expired / Not Found states
  if (!invite || !invite.organizations) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Invitation Invalid</h1>
            <p className="text-sm text-slate-400">
              This invitation link is invalid, has expired, or has already been accepted. Please contact your team administrator.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-500 transition"
          >
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  const orgName = (invite.organizations as InviteOrg).name;
  const roleName = invite.role.charAt(0).toUpperCase() + invite.role.slice(1);

  // 4. Render Logged-out state
  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-blue-400 font-bold">Team Invitation</p>
              <h1 className="text-2xl font-extrabold text-white">Join {orgName}</h1>
              <p className="text-sm text-slate-400 mt-2">
                You have been invited to join this shop as a <span className="font-semibold text-white">{roleName}</span>.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <Link
              href={`/login?next=/invite/${token}`}
              className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-500 active:scale-95 transition"
            >
              Sign In to Accept Invite
            </Link>
            <Link
              href={`/signup?next=/invite/${token}`}
              className="flex w-full items-center justify-center rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 active:scale-95 transition"
            >
              Create Account to Accept
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            This invitation was sent to <span className="text-slate-400">{invite.email}</span>.
          </p>
        </div>
      </main>
    );
  }

  // 5. Render Logged-in as wrong email warning
  if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <UserMinus className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-amber-400 font-bold">Email Mismatch</p>
              <h1 className="text-2xl font-extrabold text-white">Wrong Account</h1>
              <p className="text-sm text-slate-400 mt-2">
                This invitation was sent to <span className="font-semibold text-white">{invite.email}</span>. However, you are currently signed in as <span className="font-semibold text-white">{user.email}</span>.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-500 active:scale-95 transition"
            >
              Sign In with Correct Account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 6. Render Acceptance Form (interactive accept button)
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 animate-pulse">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-blue-400 font-bold">Accept Invitation</p>
            <h1 className="text-2xl font-extrabold text-white">Join {orgName}</h1>
            <p className="text-sm text-slate-400 mt-2">
              You are signed in as <span className="font-semibold text-white">{user.email}</span>. You can now join this shop as a <span className="font-semibold text-white">{roleName}</span>.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <InviteAcceptForm token={token} />
        </div>
      </div>
    </main>
  );
}
