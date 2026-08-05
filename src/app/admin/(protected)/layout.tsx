import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { authMode, isAuthed } from "@/lib/admin-auth";
import { QUEUE_STORAGE_MODE } from "@/lib/queue";
import { logout } from "../actions";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/**
 * Auth gate for every /admin/* route except /admin/login (which lives outside
 * this route group). This is the server-side "per-layout check" — it runs
 * before any dashboard/detail content renders.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mode = authMode();

  // Production without a password: block entirely (403-style page).
  if (mode === "prod-blocked") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
          403 — Forbidden
        </p>
        <h1 className="mt-2 font-serif text-2xl text-brand-navy">
          Admin console disabled
        </h1>
        <p className="mt-3 text-brand-ink">
          <code>ADMIN_PASSWORD</code> is not set in this production
          environment, so the admin console is unavailable.
        </p>
      </main>
    );
  }

  if (!(await isAuthed())) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-brand-mist/40">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="font-serif text-lg font-semibold text-brand-navy"
            >
              Firsthand Admin
            </Link>
            <span className="rounded-full bg-brand-mist px-2 py-0.5 text-xs text-brand-ink/70">
              queue store: {QUEUE_STORAGE_MODE}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="text-brand-blue hover:underline">
              Dashboard
            </Link>
            <Link
              href="/admin/social"
              className="text-brand-blue hover:underline"
            >
              Social
            </Link>
            {mode === "configured" ? (
              <form action={logout}>
                <button
                  type="submit"
                  className="text-brand-ink/70 hover:text-brand-navy hover:underline"
                >
                  Sign out
                </button>
              </form>
            ) : null}
          </div>
        </div>

        {mode === "dev-open" ? (
          <div className="bg-amber-100 px-6 py-2 text-center text-sm font-medium text-amber-900">
            DEV MODE — set <code>ADMIN_PASSWORD</code> to require sign-in. In
            production, an unset password blocks /admin entirely.
          </div>
        ) : null}
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </div>
  );
}
