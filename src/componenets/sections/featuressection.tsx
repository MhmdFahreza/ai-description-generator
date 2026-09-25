import Reveal from "@/componenets/reveal";
import { features } from "@/constants/features";

export default function FeaturesSection() {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-24">
      <Reveal className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#F2B441]">
          Why choose us
        </p>
        <h2 className="mx-auto mt-3 max-w-xl font-serif text-3xl leading-tight text-[#F5F3ED] sm:text-4xl">
          Built so you can stay focused on creating, not on finding the right words
        </h2>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <Reveal
            key={f.title}
            delay={i * 80}
            className="flex flex-col items-center text-center"
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5"
              style={{ color: f.accent }}
            >
              {f.icon}
            </span>
            <h3 className="mt-4 font-serif text-lg text-[#F5F3ED]">{f.title}</h3>
            <p className="mt-2 max-w-[220px] text-sm leading-relaxed text-[#9A9CA5]">
              {f.desc}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
