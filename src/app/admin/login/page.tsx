import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { authMode } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const mode = authMode();

  // Dev-open mode: no password configured, so the dashboard is already open.
  if (mode === "dev-open") redirect("/admin");

  const { error } = await searchParams;

  if (mode === "prod-blocked") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-6 py-16">
        <h1 className="font-serif text-2xl text-brand-navy">Admin disabled</h1>
        <p className="mt-3 text-brand-ink">
          The admin console is disabled because <code>ADMIN_PASSWORD</code> is
          not set in this production environment.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-serif text-2xl text-brand-navy">Firsthand admin</h1>
      <p className="mt-2 text-sm text-brand-ink/70">
        Sign in to the content review queue.
      </p>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          Incorrect password. Please try again.
        </p>
      ) : null}

      <form
        action="/api/admin/login"
        method="post"
        className="mt-6 space-y-4"
      >
        <label className="block">
          <span className="text-sm font-medium text-brand-ink">Password</span>
          <input
            type="password"
            name="password"
            autoFocus
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-md bg-brand-blue px-4 py-2 font-medium text-white transition hover:bg-brand-navy"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
