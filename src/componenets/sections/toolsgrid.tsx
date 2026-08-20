import Link from "next/link";
import Reveal from "@/componenets/reveal";
import { categories, ACCENT_HOVER_BORDER } from "@/constants/tools";
import { IconArrow } from "@/componenets/icons";

export default function ToolsGrid() {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-24">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c, i) => (
          <Reveal
            key={c.code}
            delay={i * 70}
            className={c.featured ? "sm:col-span-2 lg:col-span-2" : ""}
          >
            <Link
              href={c.href}
              className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-[#171A21] p-5 transition-all duration-300 hover:-translate-y-1 ${ACCENT_HOVER_BORDER[c.accentKey]}`}
            >
              {/* dog-ear fold, signature detail */}
              <span
                className="pointer-events-none absolute right-0 top-0 h-7 w-7 transition-all duration-300 group-hover:h-10 group-hover:w-10"
                style={{
                  background: `linear-gradient(135deg, transparent 50%, ${c.accent} 50%)`,
                }}
              />

              <div>
                <div className="flex items-center justify-between pr-4">
                  <span
                    className="font-mono text-[11px] tracking-widest"
                    style={{ color: c.accent }}
                  >
                    GEN.{c.code}
                  </span>
                  {c.featured && (
                    <span className="rounded-full border border-white/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[#9A9CA5]">
                      Populer
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5"
                    style={{ color: c.accent }}
                  >
                    {c.icon}
                  </span>
                  <h2 className="font-serif text-xl text-[#F5F3ED]">{c.title}</h2>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-[#9A9CA5]">
                  {c.desc}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-[#F5F3ED]/70 transition-transform duration-300 group-hover:translate-x-1">
                Mulai <IconArrow />
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
