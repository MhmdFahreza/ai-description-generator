import Reveal from "@/componenets/reveal";
import { IconArrow, IconFormDoc, IconSparkle } from "@/componenets/icons";

const steps = [
  {
    title: "Pilih generator yang sesuai",
    desc: "Klik salah satu dari 7 kategori di atas, sesuai kebutuhan kontenmu.",
  },
  {
    title: "Isi detail yang jelas",
    desc: "Semakin lengkap detail yang kamu kasih, semakin relevan hasil tulisannya.",
  },
  {
    title: "Generate, lalu sesuaikan",
    desc: "Dapatkan draft dalam hitungan detik, lalu edit gaya bahasanya sesuai brand kamu.",
  },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-28">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Illustration */}
        <Reveal className="order-2 lg:order-1">
          <div className="flex items-center justify-center gap-4 rounded-2xl border border-white/10 bg-[#171A21] p-10 sm:gap-6 sm:p-14">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[#9A9CA5] sm:h-20 sm:w-20">
              <IconFormDoc className="h-7 w-7 sm:h-9 sm:w-9" />
            </span>
            <span className="shrink-0 text-[#4FB6A8] motion-safe:animate-pulse">
              <IconArrow className="h-6 w-6" />
            </span>
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[#F2B441] sm:h-20 sm:w-20">
              <IconSparkle className="h-7 w-7 sm:h-9 sm:w-9" />
            </span>
          </div>
        </Reveal>

        {/* Steps */}
        <Reveal delay={100} className="order-1 lg:order-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#F2B441]">
            Cara kerja
          </p>
          <h2 className="mt-3 font-serif text-3xl leading-tight text-[#F5F3ED] sm:text-4xl">
            Cara Membuat Deskripsi yang Menarik
          </h2>

          <ol className="mt-8 space-y-6">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#F2B441]/40 font-mono text-xs text-[#F2B441]">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-[#F5F3ED]">{s.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#9A9CA5]">
                    {s.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
