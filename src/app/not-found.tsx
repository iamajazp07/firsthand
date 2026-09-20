import Link from "next/link";

/**
 * Root 404. Reached by notFound() from the [vertical] route and by any path
 * that matches no route at all.
 *
 * Deliberately unbranded: a 404 cannot know which vertical the visitor wanted,
 * and guessing would render a half-branded page, which is the thing the
 * vertical guard exists to prevent.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-1 flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
        404
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
        We could not find that page
      </h1>
      <p className="mt-3 max-w-prose text-neutral-600 dark:text-neutral-400">
        The link may be out of date, or the address may have a typo in it.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
      >
        Go to the homepage
      </Link>
    </main>
  );
}
