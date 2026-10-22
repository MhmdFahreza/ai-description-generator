import Link from "next/link";

/**
 * Custom 404 page — shown when a user navigates to a non-existent route.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0F1115] px-6 text-center font-sans text-[#F5F3ED]">
      <p className="font-mono text-6xl font-bold text-[#F2B441]">404</p>

      <h1 className="mt-4 font-serif text-2xl font-semibold">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[#9A9CA5]">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Head back to the home page to explore our AI generators.
      </p>

      <Link
        href="/"
        className="mt-8 rounded-xl bg-[#F2B441] px-6 py-3 text-sm font-semibold text-[#0F1115] transition-all hover:bg-[#e0a436] active:scale-[0.98] shadow-lg shadow-[#F2B441]/15"
      >
        Back to Home
      </Link>
    </div>
  );
}
