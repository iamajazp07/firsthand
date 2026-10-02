"use client";

import { useState } from "react";

/**
 * "Find the best ___" box for the portal hero. Not a full-text search: it
 * matches what the reader types against the rankings that actually exist and
 * sends them to the closest one, so it can never return an empty results page.
 */
export default function FindTheBest({
  options,
}: {
  options: { label: string; href: string }[];
}) {
  const [query, setQuery] = useState("");
  const [miss, setMiss] = useState(false);

  function go(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    const words = q.split(/\s+/);
    const hit =
      options.find((o) => o.label.toLowerCase() === q) ??
      options.find((o) => words.every((w) => o.label.toLowerCase().includes(w))) ??
      options.find((o) => words.some((w) => w.length > 3 && o.label.toLowerCase().includes(w)));
    if (hit) window.location.href = hit.href;
    else setMiss(true);
  }

  return (
    <form onSubmit={go} className="mx-auto mt-8 w-full max-w-xl" role="search">
      <label htmlFor="find-best" className="sr-only">
        Find the best
      </label>
      <div className="flex overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black/5">
        <span className="hidden select-none items-center pl-4 text-sm text-brand-ink/60 sm:flex">
          Find the best
        </span>
        <input
          id="find-best"
          list="find-best-options"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setMiss(false);
          }}
          placeholder="sleep supplements, savings accounts, earbuds…"
          className="min-w-0 flex-1 px-3 py-3.5 text-sm text-brand-ink outline-none placeholder:text-brand-ink/40"
        />
        <datalist id="find-best-options">
          {options.map((o) => (
            <option key={o.href} value={o.label} />
          ))}
        </datalist>
        <button
          type="submit"
          className="bg-brand-blue px-5 text-sm font-semibold text-white hover:bg-brand-navy"
        >
          Search
        </button>
      </div>
      {miss && (
        <p className="mt-2 text-sm text-white/90">
          We have not ranked that yet. Try one of the rankings below.
        </p>
      )}
    </form>
  );
}
