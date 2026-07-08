import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ScrollFramesCanvas } from "@/components/ScrollFrames";
import { Reveal } from "@/components/Reveal";

import editorial1 from "@/assets/editorial-1.jpg";
import editorial2 from "@/assets/editorial-2.jpg";
import editorial3 from "@/assets/editorial-3.jpg";
import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";
import stylist3 from "@/assets/stylist-3.jpg";
import detailOil from "@/assets/detail-oil.jpg";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "LUXÉ Hair Salon — Bespoke Luxury Hairdressing in Mayfair" },
      {
        name: "description",
        content:
          "LUXÉ is a private hair atelier in Mayfair delivering couture cuts, bespoke colour and restorative rituals in a serene, gold-lit sanctuary.",
      },
    ],
  }),
});

// Scroll length (in viewport heights) reserved for the intro camera move.
const HERO_VH_DESKTOP = 4;
const HERO_VH_MOBILE = 3;

function Index() {
  const [progress, setProgress] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [heroFaded, setHeroFaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroVh, setHeroVh] = useState(HERO_VH_DESKTOP);

  useEffect(() => {
    const setForWidth = () =>
      setHeroVh(window.innerWidth < 768 ? HERO_VH_MOBILE : HERO_VH_DESKTOP);
    setForWidth();
    window.addEventListener("resize", setForWidth);
    return () => window.removeEventListener("resize", setForWidth);
  }, []);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = scrollerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const total = el.offsetHeight - window.innerHeight;
        const p = Math.min(1, Math.max(0, -rect.top / total));
        setProgress(p);
        setHeroFaded(p > 0.05);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);


  return (
    <div className="relative bg-background text-foreground">
      <ScrollFramesCanvas progress={progress} />

      {/* Fixed nav */}
      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-4 md:px-14 md:py-6">
        <div className="font-display text-lg tracking-[0.35em] text-gold-gradient md:text-2xl">
          LUXÉ
        </div>
        <nav className="hidden gap-10 text-[11px] uppercase tracking-[0.28em] text-cream/80 lg:flex">
          <a href="#atelier" className="transition-colors hover:text-gold">Atelier</a>
          <a href="#services" className="transition-colors hover:text-gold">Services</a>
          <a href="#craft" className="transition-colors hover:text-gold">The Craft</a>
          <a href="#stylists" className="transition-colors hover:text-gold">Stylists</a>
          <a href="#gallery" className="transition-colors hover:text-gold">Gallery</a>
          <a href="#journal" className="transition-colors hover:text-gold">Journal</a>
        </nav>
        <div className="flex items-center gap-3">
          <a
            href="#contact"
            className="border border-gold/60 px-3 py-2 text-[9px] uppercase tracking-[0.3em] text-gold transition-all duration-500 hover:bg-gold hover:text-ink sm:px-4 md:px-5 md:text-[10px]"
          >
            Reserve
          </a>
          <button
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 border border-gold/40 text-gold lg:hidden"
          >
            <span
              className="h-px w-4 bg-gold transition-transform duration-300"
              style={{ transform: menuOpen ? "translateY(3px) rotate(45deg)" : "none" }}
            />
            <span
              className="h-px w-4 bg-gold transition-transform duration-300"
              style={{ transform: menuOpen ? "translateY(-3px) rotate(-45deg)" : "none" }}
            />
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-30 bg-background/95 backdrop-blur-md transition-opacity duration-500 lg:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav className="flex h-full flex-col items-center justify-center gap-8 text-sm uppercase tracking-[0.35em] text-cream">
          {[
            ["#atelier", "Atelier"],
            ["#services", "Services"],
            ["#craft", "The Craft"],
            ["#stylists", "Stylists"],
            ["#gallery", "Gallery"],
            ["#journal", "Journal"],
            ["#contact", "Reserve"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="transition-colors hover:text-gold"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>

      {/* Hero scroll driver */}
      <div
        ref={scrollerRef}
        className="relative"
        style={{ height: `${heroVh * 100}vh`, zIndex: 10 }}
      >
        <section className="sticky top-0 flex h-screen flex-col items-center justify-end pb-20 md:pb-24">
          {/* Dim veil — strong at rest so the headline reads, fades out as the camera moves in. */}
          <div
            className="pointer-events-none absolute inset-0 bg-background transition-opacity duration-500 ease-out"
            style={{ opacity: Math.max(0, 0.55 - progress * 1.8) }}
          />
          {/* Vertical vignette — always present, keeps top nav + bottom scroll cue legible. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/70 via-background/10 to-background/80" />

          <div
            className="relative z-10 flex flex-col items-center text-center transition-all duration-700 ease-out"
            style={{
              opacity: heroFaded ? 0 : 1,
              transform: `translateY(${heroFaded ? -20 : 0}px)`,
            }}
          >
            <div className="text-[9px] uppercase tracking-[0.4em] text-gold/80 sm:text-[10px] sm:tracking-[0.5em]">
              Est. 2011 · Private Atelier · Mayfair
            </div>
            <h1 className="mt-5 max-w-3xl px-4 font-display text-4xl leading-[1.05] text-cream sm:text-5xl md:mt-6 md:text-7xl">
              A sanctuary of light,<br />
              <span className="italic text-gold-gradient">shadow &amp; craft.</span>
            </h1>

            <div className="mt-8 flex animate-pulse items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-cream/70">
              <span className="h-px w-10 bg-gold/60" />
              Scroll to enter
              <span className="h-px w-10 bg-gold/60" />
            </div>
          </div>
        </section>
      </div>

      {/* Content — sits above the still-fixed canvas */}
      <div className="relative z-20 bg-background">
        {/* Marquee-style intro line */}
        <section className="overflow-hidden border-y border-gold/15 py-6">
          <div className="marquee flex whitespace-nowrap font-display text-2xl italic text-gold/70 md:text-3xl">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex shrink-0 items-center gap-10 pr-10">
                <span>Couture Cuts</span>
                <Diamond />
                <span>Hand-Painted Colour</span>
                <Diamond />
                <span>Restorative Rituals</span>
                <Diamond />
                <span>Bridal Atelier</span>
                <Diamond />
                <span>Extensions Couture</span>
                <Diamond />
              </div>
            ))}
          </div>
        </section>

        {/* Philosophy pull-quote */}
        <section className="relative overflow-hidden py-32 md:py-48">
          <div className="mx-auto max-w-5xl px-6 text-center md:px-14">
            <Reveal>
              <div className="text-[10px] uppercase tracking-[0.5em] text-gold">
                Our Philosophy
              </div>
            </Reveal>
            <Reveal delay={120}>
              <blockquote className="mt-8 font-display text-3xl leading-[1.25] text-cream md:text-5xl lg:text-6xl">
                &ldquo;Hair is the frame around the face —
                <span className="italic text-gold-gradient">
                  {" "}we build it slowly, and only in gold light.
                </span>
                &rdquo;
              </blockquote>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-10 text-[11px] uppercase tracking-[0.4em] text-muted-foreground">
                — Amara Lévesque, Founder &amp; Creative Director
              </div>
            </Reveal>
          </div>
        </section>

        {/* Atelier — editorial split */}
        <section id="atelier" className="border-t border-gold/10 py-32 md:py-44">
          <div className="mx-auto grid max-w-6xl gap-16 px-6 md:grid-cols-12 md:px-14">
            <Reveal className="md:col-span-5">
              <div className="text-[10px] uppercase tracking-[0.4em] text-gold">
                01 — The Atelier
              </div>
              <h2 className="mt-6 font-display text-4xl leading-[1.1] text-cream md:text-6xl">
                Hair, considered as
                <span className="italic text-gold-gradient"> couture.</span>
              </h2>
              <p className="mt-8 max-w-md text-base leading-relaxed text-muted-foreground">
                LUXÉ is a private-appointment atelier where each guest is met by a
                single master stylist for the entire visit. No queues, no
                interruptions — only the quiet ritual of exceptional hair. Our
                rooms are dressed in warm brass, veined marble and low golden
                light, so the reveal in the mirror is always the loudest thing.
              </p>
              <div className="mt-12 grid grid-cols-3 gap-6 border-t border-gold/20 pt-8">
                <Stat k="14" label="Master stylists" />
                <Stat k="1:1" label="Guest to stylist" />
                <Stat k="12yr" label="Avg. experience" />
              </div>
            </Reveal>
            <Reveal delay={160} className="md:col-span-7">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <ImageFrame src={editorial3} alt="Marble vanity dressed with brass mirror and orchids" ratio="16/10" />
                </div>
                <ImageFrame src={editorial1} alt="Editorial portrait — glossy chignon in gold light" ratio="3/4" />
                <ImageFrame src={editorial2} alt="Precision cut, close-up of stylist's hands" ratio="3/4" />
              </div>
            </Reveal>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="border-t border-gold/10 bg-background py-32 md:py-44">
          <div className="mx-auto max-w-6xl px-6 md:px-14">
            <div className="mb-16 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <Reveal>
                <div className="text-[10px] uppercase tracking-[0.4em] text-gold">
                  02 — The Services
                </div>
                <h2 className="mt-4 font-display text-4xl text-cream md:text-6xl">
                  A concise
                  <span className="italic text-gold-gradient"> menu.</span>
                </h2>
              </Reveal>
              <Reveal delay={120}>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Every service begins with a fifteen-minute consultation over tea
                  and ends with a bespoke home-care ritual.
                </p>
              </Reveal>
            </div>
            <ul className="divide-y divide-gold/15 border-y border-gold/15">
              {SERVICES.map((s, i) => (
                <Reveal key={s.name} as="li" delay={i * 80}>
                  <div className="group grid grid-cols-12 items-baseline gap-4 py-8 transition-colors duration-500 hover:bg-gold/5">
                    <div className="col-span-2 font-display text-xl text-gold/70 md:col-span-1">
                      {s.no}
                    </div>
                    <div className="col-span-10 md:col-span-5">
                      <div className="font-display text-2xl text-cream transition-colors group-hover:text-gold md:text-3xl">
                        {s.name}
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        {s.duration}
                      </div>
                    </div>
                    <div className="col-span-8 text-sm leading-relaxed text-muted-foreground md:col-span-4">
                      {s.desc}
                    </div>
                    <div className="col-span-4 text-right font-display text-xl text-gold md:col-span-2">
                      {s.price}
                    </div>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* The Craft — process timeline with detail image */}
        <section id="craft" className="border-t border-gold/10 py-32 md:py-44">
          <div className="mx-auto grid max-w-6xl gap-16 px-6 md:grid-cols-12 md:px-14">
            <Reveal className="md:col-span-5 md:sticky md:top-32 md:self-start">
              <div className="text-[10px] uppercase tracking-[0.4em] text-gold">
                03 — The Craft
              </div>
              <h2 className="mt-4 font-display text-4xl leading-[1.1] text-cream md:text-6xl">
                Every visit follows
                <span className="italic text-gold-gradient"> a slow arc.</span>
              </h2>
              <div className="mt-10">
                <ImageFrame src={detailOil} alt="Amber hair oil poured into brass bowl" ratio="4/5" />
              </div>
            </Reveal>
            <div className="md:col-span-7">
              <ol className="relative border-l border-gold/25 pl-8">
                {PROCESS.map((step, i) => (
                  <Reveal
                    key={step.title}
                    as="li"
                    delay={i * 100}
                    className="relative mb-14 last:mb-0"
                  >
                    <span className="absolute -left-[41px] flex h-5 w-5 items-center justify-center rounded-full border border-gold bg-background">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                    </span>
                    <div className="text-[10px] uppercase tracking-[0.4em] text-gold">
                      Chapter {step.no}
                    </div>
                    <h3 className="mt-2 font-display text-2xl text-cream md:text-3xl">
                      {step.title}
                    </h3>
                    <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Stylists */}
        <section id="stylists" className="border-t border-gold/10 py-32 md:py-44">
          <div className="mx-auto max-w-6xl px-6 md:px-14">
            <div className="mb-16 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <Reveal>
                <div className="text-[10px] uppercase tracking-[0.4em] text-gold">
                  04 — The Stylists
                </div>
                <h2 className="mt-4 font-display text-4xl text-cream md:text-6xl">
                  A tight bench of
                  <span className="italic text-gold-gradient"> masters.</span>
                </h2>
              </Reveal>
              <Reveal delay={120}>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Fourteen stylists trained across London, Paris, Kyoto and Milan
                  — each with their own signature and a shared vocabulary.
                </p>
              </Reveal>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {STYLISTS.map((s, i) => (
                <Reveal key={s.name} delay={i * 120}>
                  <article className="group cursor-pointer">
                    <div className="relative overflow-hidden">
                      <img
                        src={s.image}
                        alt={s.name}
                        loading="lazy"
                        width={1024}
                        height={1024}
                        className="aspect-[3/4] w-full object-cover grayscale transition-all duration-700 ease-out group-hover:scale-105 group-hover:grayscale-0"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 text-[10px] uppercase tracking-[0.3em] text-gold">
                        {s.role}
                      </div>
                    </div>
                    <div className="mt-5 flex items-start justify-between gap-4">
                      <h3 className="font-display text-2xl text-cream transition-colors group-hover:text-gold">
                        {s.name}
                      </h3>
                      <span className="mt-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        {s.years}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {s.bio}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {s.specialties.map((sp) => (
                        <span
                          key={sp}
                          className="border border-gold/25 px-2.5 py-1 text-[9px] uppercase tracking-[0.25em] text-cream/70"
                        >
                          {sp}
                        </span>
                      ))}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section id="gallery" className="border-t border-gold/10 py-32 md:py-44">
          <div className="mx-auto max-w-6xl px-6 md:px-14">
            <Reveal>
              <div className="text-[10px] uppercase tracking-[0.4em] text-gold">
                05 — The Gallery
              </div>
              <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[1.1] text-cream md:text-6xl">
                Recent work from the
                <span className="italic text-gold-gradient"> atelier chair.</span>
              </h2>
            </Reveal>
            <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
              <Reveal className="md:row-span-2">
                <ImageFrame src={gallery1} alt="Dimensional caramel balayage on chocolate brown" ratio="3/4" hoverZoom />
              </Reveal>
              <Reveal delay={80}>
                <ImageFrame src={gallery2} alt="Platinum voluminous curls" ratio="1/1" hoverZoom />
              </Reveal>
              <Reveal delay={160}>
                <ImageFrame src={editorial1} alt="Chignon in golden light" ratio="1/1" hoverZoom />
              </Reveal>
              <Reveal delay={120}>
                <ImageFrame src={gallery3} alt="Sharp jet-black geometric bob" ratio="1/1" hoverZoom />
              </Reveal>
              <Reveal delay={200}>
                <ImageFrame src={editorial2} alt="Precision cut close-up" ratio="1/1" hoverZoom />
              </Reveal>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="border-t border-gold/10 py-32 md:py-44">
          <div className="mx-auto max-w-6xl px-6 md:px-14">
            <Reveal>
              <div className="text-[10px] uppercase tracking-[0.4em] text-gold">
                06 — The Guests
              </div>
              <h2 className="mt-4 font-display text-4xl text-cream md:text-6xl">
                What our guests
                <span className="italic text-gold-gradient"> whisper.</span>
              </h2>
            </Reveal>
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <Reveal key={t.name} delay={i * 120}>
                  <figure className="flex h-full flex-col border-t border-gold/25 pt-8">
                    <div className="mb-6 flex gap-0.5 text-gold">
                      {"★★★★★".split("").map((s, k) => (
                        <span key={k}>{s}</span>
                      ))}
                    </div>
                    <blockquote className="flex-1 font-display text-xl italic leading-relaxed text-cream md:text-2xl">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                    <figcaption className="mt-8 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                      {t.name} · <span className="text-gold/70">{t.title}</span>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Journal */}
        <section id="journal" className="border-t border-gold/10 py-32 md:py-44">
          <div className="mx-auto max-w-6xl px-6 md:px-14">
            <div className="mb-16 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <Reveal>
                <div className="text-[10px] uppercase tracking-[0.4em] text-gold">
                  07 — The Journal
                </div>
                <h2 className="mt-4 font-display text-4xl text-cream md:text-6xl">
                  Notes from
                  <span className="italic text-gold-gradient"> the chair.</span>
                </h2>
              </Reveal>
              <Reveal delay={120}>
                <a href="#" className="group inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-gold">
                  Read the archive
                  <span className="inline-block h-px w-10 bg-gold transition-all duration-500 group-hover:w-16" />
                </a>
              </Reveal>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {JOURNAL.map((j, i) => (
                <Reveal key={j.title} delay={i * 100}>
                  <a href="#" className="group block">
                    <div className="overflow-hidden">
                      <img
                        src={j.image}
                        alt={j.title}
                        loading="lazy"
                        width={1024}
                        height={1024}
                        className="aspect-[4/3] w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                      />
                    </div>
                    <div className="mt-5 text-[10px] uppercase tracking-[0.3em] text-gold">
                      {j.category} · {j.date}
                    </div>
                    <h3 className="mt-3 font-display text-2xl leading-tight text-cream transition-colors group-hover:text-gold">
                      {j.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {j.excerpt}
                    </p>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-gold/10 py-32 md:py-44">
          <div className="mx-auto grid max-w-6xl gap-16 px-6 md:grid-cols-12 md:px-14">
            <Reveal className="md:col-span-4">
              <div className="text-[10px] uppercase tracking-[0.4em] text-gold">
                08 — The Details
              </div>
              <h2 className="mt-4 font-display text-4xl text-cream md:text-5xl">
                Small
                <span className="italic text-gold-gradient"> questions.</span>
              </h2>
              <p className="mt-6 max-w-xs text-sm text-muted-foreground">
                Anything else — a stylist is on the line during atelier hours.
              </p>
            </Reveal>
            <ul className="md:col-span-8">
              {FAQ.map((f, i) => (
                <Reveal key={f.q} as="li" delay={i * 80}>
                  <FaqItem q={f.q} a={f.a} />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="border-t border-gold/10 py-32 md:py-44">
          <div className="mx-auto max-w-4xl px-6 text-center md:px-14">
            <Reveal>
              <div className="text-[10px] uppercase tracking-[0.4em] text-gold">
                Reservations
              </div>
            </Reveal>
            <Reveal delay={120}>
              <h2 className="mt-6 font-display text-5xl leading-tight text-cream md:text-7xl">
                We keep a
                <span className="italic text-gold-gradient"> short book.</span>
              </h2>
            </Reveal>
            <Reveal delay={220}>
              <p className="mx-auto mt-6 max-w-lg text-sm text-muted-foreground">
                To preserve the calm of the atelier, reservations are limited.
                Please enquire — a stylist will respond within one working day.
              </p>
            </Reveal>
            <Reveal delay={320}>
              <div className="mt-12 flex flex-col items-center gap-4 md:flex-row md:justify-center">
                <a
                  href="mailto:atelier@luxe-salon.com"
                  className="border border-gold px-8 py-4 text-[11px] uppercase tracking-[0.35em] text-gold transition-all duration-500 hover:bg-gold hover:text-ink hover:tracking-[0.45em]"
                >
                  atelier@luxe-salon.com
                </a>
                <a
                  href="tel:+442071234567"
                  className="text-[11px] uppercase tracking-[0.35em] text-cream/80 transition-colors hover:text-gold"
                >
                  +44 20 7123 4567
                </a>
              </div>
            </Reveal>
            <Reveal delay={420}>
              <div className="mt-20 grid gap-8 border-t border-gold/20 pt-10 text-left md:grid-cols-3 md:text-center">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-gold">Atelier</div>
                  <div className="mt-2 text-sm text-cream">14 Marlborough Mews</div>
                  <div className="text-sm text-muted-foreground">Mayfair · London W1</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-gold">Hours</div>
                  <div className="mt-2 text-sm text-cream">Tue – Sat · 10 – 20</div>
                  <div className="text-sm text-muted-foreground">Sunday by request</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-gold">Follow</div>
                  <div className="mt-2 flex gap-4 text-sm text-cream md:justify-center">
                    <a href="#" className="hover:text-gold">Instagram</a>
                    <a href="#" className="hover:text-gold">Journal</a>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <footer className="border-t border-gold/15 py-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-[10px] uppercase tracking-[0.3em] text-muted-foreground md:flex-row md:px-14">
            <div className="font-display text-lg tracking-[0.35em] text-gold-gradient">
              LUXÉ
            </div>
            <div>© {new Date().getFullYear()} LUXÉ Hair Atelier · Mayfair</div>
          </div>
        </footer>
      </div>

      <MarqueeStyles />
    </div>
  );
}

/* ---------- Sub-components ---------- */

function Stat({ k, label }: { k: string; label: string }) {
  return (
    <div>
      <div className="font-display text-4xl text-gold-gradient">{k}</div>
      <div className="mt-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function Diamond() {
  return (
    <span className="inline-block h-1.5 w-1.5 rotate-45 bg-gold" />
  );
}

function ImageFrame({
  src,
  alt,
  ratio,
  hoverZoom = false,
}: {
  src: string;
  alt: string;
  ratio: string;
  hoverZoom?: boolean;
}) {
  return (
    <div
      className="group relative overflow-hidden border border-gold/15"
      style={{ aspectRatio: ratio }}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        width={1024}
        height={1024}
        className={`h-full w-full object-cover transition-transform duration-[1200ms] ease-out ${
          hoverZoom ? "group-hover:scale-110" : "group-hover:scale-[1.03]"
        }`}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-30" />
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gold/15">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-6 py-6 text-left transition-colors hover:text-gold"
      >
        <span className="font-display text-xl text-cream md:text-2xl">{q}</span>
        <span
          className="text-2xl text-gold transition-transform duration-500"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          +
        </span>
      </button>
      <div
        className="grid overflow-hidden transition-all duration-500 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="min-h-0">
          <p className="pb-6 pr-10 text-sm leading-relaxed text-muted-foreground">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

function MarqueeStyles() {
  return (
    <style>{`
      @keyframes luxe-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      .marquee { animation: luxe-marquee 40s linear infinite; }
    `}</style>
  );
}

/* ---------- Content ---------- */

const SERVICES = [
  { no: "I", name: "Signature Cut", duration: "90 min", desc: "A precision cut shaped over ninety minutes with a master stylist.", price: "£210" },
  { no: "II", name: "Bespoke Colour", duration: "3 hr", desc: "Hand-painted balayage and dimensional glossing tailored to skin tone.", price: "£340" },
  { no: "III", name: "Restorative Ritual", duration: "75 min", desc: "A deep botanical treatment with scalp massage and steam infusion.", price: "£160" },
  { no: "IV", name: "Bridal Atelier", duration: "Full day", desc: "Private trial and day-of styling with an on-call second stylist.", price: "From £780" },
  { no: "V", name: "Extensions Couture", duration: "By consult", desc: "Custom-coloured, hand-tied wefts placed for invisible movement.", price: "On request" },
  { no: "VI", name: "Gentlemen's Cut", duration: "60 min", desc: "A tailored cut with hot towel finish and short scalp ritual.", price: "£140" },
];

const PROCESS = [
  { no: "I", title: "The Arrival", body: "You are met at the door with a warm towel, a glass of chilled champagne or Japanese sencha, and shown to a private chair." },
  { no: "II", title: "The Consultation", body: "Fifteen quiet minutes to discuss the shape, the season, and the life your hair is asked to live in — every visit begins with a conversation, never a scissor." },
  { no: "III", title: "The Work", body: "Your stylist begins. Phones are welcome to rest on a linen tray. Music is chosen for you, or by you — the room is yours." },
  { no: "IV", title: "The Ritual", body: "A deep-conditioning ritual, warm scalp massage and a botanical steam — always included, never billed extra." },
  { no: "V", title: "The Departure", body: "A hand-blended home-care set, a written care plan, and a car home for visits after eight in the evening." },
];

const STYLISTS = [
  {
    name: "Amara Lévesque",
    role: "Founder · Creative Director",
    years: "24 yrs",
    image: stylist1,
    bio: "Trained in Paris, opened LUXÉ in 2011 with a single chair and a strong opinion about light.",
    specialties: ["Precision", "Editorial", "Bridal"],
  },
  {
    name: "Kenji Okafor",
    role: "Master Stylist",
    years: "16 yrs",
    image: stylist2,
    bio: "Kyoto-trained. Known for architectural men's cuts and a silent, meticulous chair.",
    specialties: ["Men's", "Precision", "Texture"],
  },
  {
    name: "Isolde Ferrari",
    role: "Head Colourist",
    years: "18 yrs",
    image: stylist3,
    bio: "Colour is a memory of light. Isolde paints — she does not tint — and mixes every formula by hand.",
    specialties: ["Balayage", "Reds", "Gloss"],
  },
];

const TESTIMONIALS = [
  { name: "Elena V.", title: "Guest since 2014", quote: "The only place I trust to touch my hair. Three hours feel like twenty minutes and I always leave feeling like a longer, quieter version of myself." },
  { name: "Marcus D.", title: "Guest since 2019", quote: "Kenji cuts hair the way an architect draws a line. Nothing extra, nothing missing. It grows out beautifully — which is the real test." },
  { name: "Priya S.", title: "Bride, 2024", quote: "Amara did my bridal trial. She listened for forty minutes, then made one small suggestion. It was the perfect thing. I have never felt more myself in a photograph." },
];

const JOURNAL = [
  { category: "Ritual", date: "Jun 2026", image: detailOil, title: "On the quiet luxury of a warm scalp", excerpt: "Why the fifteen minutes at the basin are, secretly, the most important part of the visit." },
  { category: "Colour", date: "May 2026", image: gallery1, title: "The soft return of the dimensional brunette", excerpt: "How Isolde is painting warmth back into rich browns — and why balayage never really left." },
  { category: "Craft", date: "Apr 2026", image: editorial2, title: "A stylist's guide to growing out a bob", excerpt: "The unfashionable truth about the awkward stage, and how to make it beautiful anyway." },
];

const FAQ = [
  { q: "How do I book my first visit?", a: "First-time guests are matched with a stylist by hand. Send us a note about what you are looking for and we will introduce you to the right chair." },
  { q: "What is included in a service?", a: "Every service includes consultation, the treatment itself, our restorative ritual at the basin, a finish with heat protection, and a written home-care plan." },
  { q: "Do you offer men's services?", a: "Yes — the Gentlemen's Cut is a sixty-minute service and includes a short hot-towel ritual. Colour and grey-blending are offered on request." },
  { q: "Can I bring a friend?", a: "Warmly, yes. Guests are welcome in the lounge with tea and a book — the atelier itself is kept quiet for the guest in the chair." },
  { q: "What is your cancellation policy?", a: "We ask for twenty-four hours' notice. Late cancellations are charged fifty percent so we may compensate the stylist." },
];
