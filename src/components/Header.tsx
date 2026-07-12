"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { NAV_CATEGORIES, NAV_PRIMARY_COUNT } from "@/lib/site";

/**
 * Sticky news-style header: logo left, category nav center (first 6 + "More"
 * dropdown), Subscribe button right. Collapses to a hamburger menu on mobile.
 */
export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const primary = NAV_CATEGORIES.slice(0, NAV_PRIMARY_COUNT);
  const more = NAV_CATEGORIES.slice(NAV_PRIMARY_COUNT);

  return (
    <header className="sticky top-0 z-50 border-b-4 border-brand-navy bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Logo />

        {/* Desktop nav */}
        <nav
          aria-label="Categories"
          className="hidden items-center gap-1 lg:flex"
        >
          {primary.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="rounded px-2.5 py-1.5 text-sm font-medium text-brand-ink hover:bg-brand-mist hover:text-brand-navy"
            >
              {c.name}
            </Link>
          ))}

          {/* "More" dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setMoreOpen(true)}
            onMouseLeave={() => setMoreOpen(false)}
          >
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-haspopup="true"
              onClick={() => setMoreOpen((v) => !v)}
              className="flex items-center gap-1 rounded px-2.5 py-1.5 text-sm font-medium text-brand-ink hover:bg-brand-mist hover:text-brand-navy"
            >
              More
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-full w-56 rounded-b-md border border-t-0 border-brand-mist bg-white py-1 shadow-lg">
                {more.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/category/${c.slug}`}
                    className="block px-4 py-2 text-sm text-brand-ink hover:bg-brand-mist hover:text-brand-navy"
                    onClick={() => setMoreOpen(false)}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-2">
          {/* Subscribe → homepage newsletter band anchor */}
          <Link
            href="/#newsletter"
            className="hidden rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy sm:block"
          >
            Subscribe
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded p-2 text-brand-navy hover:bg-brand-mist lg:hidden"
          >
            {mobileOpen ? (
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav
          aria-label="Categories (mobile)"
          className="border-t border-brand-mist bg-white lg:hidden"
        >
          <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6">
            {NAV_CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="block rounded px-2 py-2.5 text-sm font-medium text-brand-ink hover:bg-brand-mist hover:text-brand-navy"
                onClick={() => setMobileOpen(false)}
              >
                {c.name}
              </Link>
            ))}
            <Link
              href="/#newsletter"
              onClick={() => setMobileOpen(false)}
              className="mt-2 mb-3 block w-full rounded-md bg-brand-blue px-4 py-2 text-center text-sm font-semibold text-white"
            >
              Subscribe
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
