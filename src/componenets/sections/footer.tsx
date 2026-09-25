export default function Footer() {
  return (
    <footer className="border-t border-white/10 px-6 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <p className="font-mono text-xs uppercase tracking-widest text-[#9A9CA5]">
          © {new Date().getFullYear()} AI Description Generator
        </p>
        <p className="text-xs text-[#9A9CA5]">Built by Muhammad Fahreza.</p>
      </div>
    </footer>
  );
}