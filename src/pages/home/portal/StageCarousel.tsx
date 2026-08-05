import { useCallback, useEffect, useRef, useState } from "react";
import { SLIDES, type ChipTone, type TitleSegment } from "./portalContent";

/** 6s dwell — the Aug 2026 revision cut the carousel to four slides and
 *  shortened the dwell with it (4 x 6s = 24s for a full pass). */
const DURATION = 6000;

const CHIP_TONE: Record<ChipTone, string> = {
  neutral: "border-brand_line_2 text-brand_navy bg-custom-white",
  critical: "border-brand_danger_line text-brand_danger bg-brand_danger_bg",
  watch: "border-[#F3D9A8] text-[#9A5B04] bg-[#FEF8EC]",
  ok: "border-[#B7E3C8] text-brand_green_dark bg-brand_green_tint",
};

const Title = ({ segments }: { segments: TitleSegment[] }) => (
  <>
    {segments.map((seg, i) =>
      seg.em ? (
        <em key={i} className="not-italic text-brand_green">
          {seg.text}
        </em>
      ) : (
        <span key={i}>{seg.text}</span>
      ),
    )}
  </>
);

interface Props {
  /** Slide 7's CTA opens Field Notes. Passes its own button so the panel
   *  can return focus there on close. */
  onOpenNotes?: (trigger: HTMLElement) => void;
  /** Held while any slide-over is open. The static build did this with a bare
   *  clearInterval on open and restart() on close; here the parent owns which
   *  panel is up, so it passes the flag down. Without it slides advance behind
   *  the panel and you return to a different screen than you left. */
  paused?: boolean;
}

const StageCarousel = ({ onOpenNotes, paused: externallyPaused = false }: Props) => {
  const [idx, setIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const paused = hovered || externallyPaused;
  const reduced = useRef(
    typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  ).current;

  const go = useCallback(
    (n: number) => setIdx(((n % SLIDES.length) + SLIDES.length) % SLIDES.length),
    [],
  );

  useEffect(() => {
    if (paused || reduced) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), DURATION);
    return () => clearInterval(t);
  }, [paused, reduced, idx]);

  // Arrow keys drive the carousel, matching the static build. Ignored while a
  // field has focus so typing a password never advances a slide.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") go(idx + 1);
      if (e.key === "ArrowLeft") go(idx - 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [idx, go]);

  return (
    <section
      className="relative h-dvh overflow-hidden bg-bkg portal_stack:h-auto portal_stack:overflow-visible"
      aria-roledescription="carousel"
      aria-label="About CounterCtrl Cloud"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ambient wash + dot grid, from `.stage::before` */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(680px 460px at 76% 24%,rgba(30,158,82,.09),transparent 68%)," +
            "radial-gradient(760px 520px at 22% 82%,rgba(37,99,235,.07),transparent 70%)," +
            "radial-gradient(circle at 1px 1px,#CBD8E8 1px,transparent 0)",
          backgroundSize: "auto,auto,30px 30px",
        }}
      />

      {SLIDES.map((s, i) => (
        <div
          key={s.key}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${SLIDES.length}`}
          aria-hidden={i !== idx}
          className={`absolute inset-0 transition-[opacity,visibility] duration-[650ms] portal_stack:relative portal_stack:inset-auto portal_stack:transition-none ${
            i === idx
              ? "opacity-100 visible portal_stack:block"
              : "opacity-0 invisible portal_stack:hidden"
          }`}
        >
          {/* art */}
          <div className="absolute top-[54%] left-[46%] right-[clamp(28px,3.4vw,64px)] -translate-y-1/2 flex items-center justify-center pointer-events-none z-[1] portal_wide:left-[50%] portal_wide:right-[clamp(20px,2.4vw,40px)] portal_wide:opacity-90 portal_mid:left-auto portal_mid:right-6 portal_mid:w-[66%] portal_mid:opacity-30 portal_stack:static portal_stack:translate-y-0 portal_stack:w-[calc(100%-40px)] portal_stack:mx-auto portal_stack:mt-4 portal_stack:opacity-45">
            <div className="w-full max-w-[600px] portal_wide:max-w-[480px] portal_mid:max-w-none [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[80vh] [&>svg]:block [&>svg]:mx-auto portal_stack:[&>svg]:max-h-none">
              {s.art}
            </div>
          </div>

          {/* Copy sits above the art (z-2 over z-1) and the two boxes overlap
              by design — copy is capped at 56%, art starts at 46%. Harmless
              now that every slide is an SVG illustration, all of which are
              mostly empty on the left where the text crosses them. The
              opaque-screenshot slide that needed a narrower cap was cut in the
              Aug 2026 revision. */}
          {/* Top padding clears the band stack — measured, not fixed. Stage
              publishes --band-h from the stack's real bottom edge; the clamp
              is the breathing room under it. This was three hard-coded
              paddings, which held only while the stack's height was known and
              broke the moment the Perspectives strip was added beneath the
              mission band. */}
          <div
            style={{
              paddingTop: "calc(var(--band-h, 190px) + clamp(14px,3.4vh,46px))",
            }}
            className="absolute inset-0 flex flex-col items-start justify-center z-[2] pb-[104px] px-[clamp(30px,4.4vw,72px)] max-w-[min(640px,56%)] portal_short:pb-[88px] portal_shorter:pb-[76px] portal_wide:max-w-[56%] portal_mid:max-w-[88%] portal_stack:static portal_stack:max-w-full portal_stack:!pt-[54px] portal_stack:pb-[110px] portal_stack:px-[26px] portal_narrow:!pt-[34px]"
          >
            <span className="inline-flex items-center gap-3 font-mono text-[10px] font-semibold tracking-[0.2em] uppercase text-brand_green_dark before:content-[''] before:w-7 before:h-0.5 before:bg-brand_green">
              {s.eyebrow}
            </span>

            <h2 className="font-display text-brand_navy text-[clamp(30px,3.5vw,49px)] portal_short:text-[clamp(28px,3vw,40px)] font-extrabold mt-[18px] tracking-[-0.042em] leading-[1.06] text-balance">
              <Title segments={s.title} />
            </h2>

            <span className="block w-16 h-1 rounded-sm bg-brand_green mt-[22px]" />

            <p className="mt-5 portal_shorter:mt-4 text-[15.5px] portal_shorter:text-[14.5px] leading-[1.72] text-brand_slate max-w-[50ch]">
              {s.sub}
            </p>

            {s.chips.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-6">
                {s.chips.map((c) => (
                  <span
                    key={c.text}
                    className={`font-mono text-[10px] tracking-[0.11em] uppercase border rounded-md px-3 py-[7px] shadow-[0_1px_2px_rgba(15,36,64,.05)] ${CHIP_TONE[c.tone]}`}
                  >
                    {c.text}
                  </span>
                ))}
              </div>
            )}

            {s.cta && (
              <button
                onClick={(e) => onOpenNotes?.(e.currentTarget)}
                className="mt-6 font-display font-semibold text-[14px] text-brand_navy bg-custom-white border border-brand_line_2 rounded-[9px] px-5 py-3 transition-colors hover:border-brand_green hover:text-brand_green_dark cursor-pointer"
              >
                {s.cta}
              </button>
            )}
          </div>
        </div>
      ))}

      {/* HUD — progress dots, counter, arrows */}
      <div className="absolute left-0 right-0 bottom-[42px] flex items-center gap-4 px-[clamp(30px,4.4vw,72px)] z-[5] portal_shorter:bottom-[26px] portal_stack:bottom-[26px] portal_stack:px-[26px]">
        <div className="flex gap-2 flex-1">
          {SLIDES.map((s, i) => (
            <button
              key={s.key}
              onClick={() => go(i)}
              aria-label={`Slide ${i + 1} of ${SLIDES.length}`}
              aria-current={i === idx}
              className="w-[46px] portal_narrow:w-[30px] h-[3px] rounded-sm bg-brand_line_2 relative overflow-hidden transition-colors hover:bg-[#A9BDD3] cursor-pointer"
            >
              <span
                className="absolute inset-0 bg-brand_green rounded-sm"
                style={{
                  width: i === idx ? "100%" : "0%",
                  // Fills across the dwell so the bar doubles as a timer.
                  // Frozen on hover-pause and for reduced-motion.
                  transition:
                    i === idx && !paused && !reduced
                      ? `width ${DURATION}ms linear`
                      : "none",
                }}
              />
            </button>
          ))}
        </div>

        <span className="font-mono text-[10.5px] tracking-[0.14em] text-brand_slate">
          {String(idx + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
        </span>

        <div className="flex gap-1.5">
          <button
            onClick={() => go(idx - 1)}
            aria-label="Previous slide"
            className="w-8 h-8 rounded-lg border border-brand_line_2 bg-custom-white text-brand_navy text-[13px] flex items-center justify-center transition-colors hover:bg-brand_paper hover:border-brand_green shadow-[0_1px_2px_rgba(15,36,64,.06)] cursor-pointer"
          >
            ‹
          </button>
          <button
            onClick={() => go(idx + 1)}
            aria-label="Next slide"
            className="w-8 h-8 rounded-lg border border-brand_line_2 bg-custom-white text-brand_navy text-[13px] flex items-center justify-center transition-colors hover:bg-brand_paper hover:border-brand_green shadow-[0_1px_2px_rgba(15,36,64,.06)] cursor-pointer"
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
};

export default StageCarousel;
