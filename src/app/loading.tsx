/**
 * Root loading skeleton — displayed by Next.js App Router during
 * route transitions and lazy-loaded page segments.
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0F1115]">
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#F2B441] [animation-delay:0ms]" />
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#F2B441] [animation-delay:150ms]" />
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#F2B441] [animation-delay:300ms]" />
      </div>
      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-[#5C5F68]">
        Loading...
      </p>
    </div>
  );
}
