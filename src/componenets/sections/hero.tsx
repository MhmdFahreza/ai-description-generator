import Reveal from "@/componenets/reveal";

export default function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-8 pt-14">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#F2B441]">
          Start here
        </p>
        <h1 className="mt-3 max-w-xl font-serif text-3xl leading-tight text-[#F5F3ED] sm:text-4xl lg:text-5xl">
          Choose the type of description you want to create
        </h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#9A9CA5]">
          Each card below is a dedicated generator. Pick one, fill in the
          details, and let AI write it for you.
        </p>
      </Reveal>
    </section>
  );
}
