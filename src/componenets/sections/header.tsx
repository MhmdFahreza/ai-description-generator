export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0F1115]/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#F2B441] font-serif text-lg italic text-[#0F1115]">
            Ai
          </div>
          <div className="leading-tight">
            <p className="font-serif text-lg tracking-tight text-[#F5F3ED]">
              AI Description Generator
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#9A9CA5]">
              Content Writing Toolkit
            </p>
          </div>
        </div>
        <span className="hidden font-mono text-xs uppercase tracking-widest text-[#9A9CA5] sm:block">
          7 Generators · Ready to Use
        </span>
      </div>
    </header>
  );
}