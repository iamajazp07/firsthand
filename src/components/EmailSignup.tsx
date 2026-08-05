"use client";

import { useState } from "react";
import Link from "next/link";

type Status = "idle" | "loading" | "success" | "error";

/**
 * Reusable newsletter capture form. Posts { email, source, website } to
 * /api/subscribe and renders inline success/error states. Includes a hidden
 * honeypot field (`website`) for spam bots and a privacy note.
 *
 * variant:
 *  - "band"    — white inputs on a dark (navy) background (homepage band).
 *  - "compact" — bordered inputs on a light background (article/quiz).
 */
export default function EmailSignup({
  source,
  variant = "compact",
  className = "",
}: {
  source: string;
  variant?: "band" | "compact";
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const onBand = variant === "band";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source, website }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (res.ok && data.ok) {
        setStatus("success");
        setMessage("You're subscribed — welcome to Firsthand.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(
          data.error ?? "Please enter a valid email address.",
        );
      }
    } catch {
      setStatus("error");
      setMessage("Network error — please try again.");
    }
  }

  const inputClasses = onBand
    ? "w-full rounded-md border-0 bg-white px-4 py-2.5 text-sm text-brand-ink placeholder:text-slate-400 focus:ring-2 focus:ring-brand-blue"
    : "w-full rounded-md border border-brand-navy/20 bg-white px-4 py-2.5 text-sm text-brand-ink placeholder:text-slate-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue";

  const buttonClasses = onBand
    ? "shrink-0 rounded-md bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-white hover:text-brand-navy disabled:opacity-60"
    : "shrink-0 rounded-md bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue disabled:opacity-60";

  const noteClasses = onBand
    ? "mt-2 text-xs text-white/70"
    : "mt-2 text-xs text-brand-ink/60";

  const privacyLinkClasses = onBand
    ? "font-medium text-white underline hover:text-white/80"
    : "font-medium text-brand-blue hover:underline";

  if (status === "success") {
    return (
      <div className={className} aria-live="polite">
        <p
          className={
            onBand
              ? "text-sm font-semibold text-white"
              : "rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
          }
        >
          ✓ {message}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md gap-2"
        aria-label="Newsletter signup"
        noValidate
      >
        <label htmlFor={`email-${source}`} className="sr-only">
          Email address
        </label>
        <input
          id={`email-${source}`}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputClasses}
        />

        {/* Honeypot — visually hidden, off-screen; real users never fill it. */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label htmlFor={`website-${source}`}>
            Leave this field empty
          </label>
          <input
            id={`website-${source}`}
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className={buttonClasses}
        >
          {status === "loading" ? "…" : "Subscribe"}
        </button>
      </form>

      {status === "error" && (
        <p
          className={
            onBand
              ? "mt-2 text-xs font-medium text-amber-200"
              : "mt-2 text-xs font-medium text-red-600"
          }
          aria-live="polite"
        >
          {message}
        </p>
      )}

      <p className={noteClasses}>
        We never sell your email. Unsubscribe anytime. See our{" "}
        <Link href="/privacy" className={privacyLinkClasses}>
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
