import { useCallback, useEffect, useRef } from "react";
import StageCarousel from "./StageCarousel";
import { MISSION, TOP_NAV } from "./portalContent";
import { PERSPECTIVES_STRIP, type SeatId } from "./perspectives/perspectivesContent";
import logoMark from "../../../assets/portal/logo-mark.webp";

interface Props {
  /** Fired with the nav item's key, plus the button that was clicked so the
   *  panel can hand focus back to it on close. */
  onNavigate?: (key: string, trigger: HTMLElement) => void;
  /** A Perspectives pill — opens the panel *and* selects that seat. */
  onOpenPerspective?: (seat: SeatId, trigger: HTMLElement) => void;
  /** True while any slide-over is open — stops the carousel behind it. */
  paused?: boolean;
}

/** The right column: company nav, mission band, Perspectives strip, and the
 *  carousel beneath.
 *
 *  Nav items are <button> not <a href="#"> deliberately — the handoff notes
 *  anchors triggered a navigation warning in preview.
 *
 *  Above 900px the nav and the band stack are absolutely positioned over the
 *  carousel. Below it they drop into normal flow and the stage grows to fit
 *  its content instead of filling the viewport. */
const Stage = ({ onNavigate, onOpenPerspective, paused }: Props) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);

  /** Publish the band stack's bottom edge as --band-h, which the carousel's
   *  copy column uses to reserve its top padding.
   *
   *  PERSPECTIVES-IMPLEMENTATION.md is explicit that this must be measured
   *  rather than hard-coded: the stack's height is a function of how its text
   *  wraps, which is a function of viewport *width*, so no breakpoint can
   *  track it. It was a fixed 236px before the strip existed and would have
   *  started clipping the slide headline the moment a second band appeared. */
  const measure = useCallback(() => {
    const stage = stageRef.current;
    const stack = stackRef.current;
    if (!stage || !stack) return;
    const h = stack.getBoundingClientRect().bottom - stage.getBoundingClientRect().top;
    stage.style.setProperty("--band-h", `${Math.round(h)}px`);
  }, []);

  useEffect(() => {
    measure();

    const ro = new ResizeObserver(measure);
    if (stackRef.current) ro.observe(stackRef.current);
    window.addEventListener("resize", measure);
    // Webfonts land after first paint and reflow the band; without this the
    // reserved space is a font too short until something else triggers a
    // resize.
    document.fonts?.ready.then(measure).catch(() => {});

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  return (
    <div
      ref={stageRef}
      // Seeded close to the measured value so the first paint doesn't jump.
      style={{ "--band-h": "190px" } as React.CSSProperties}
      className="relative h-dvh overflow-hidden portal_stack:h-auto portal_stack:min-h-[620px] portal_stack:overflow-visible"
    >
      <img
        src={logoMark}
        alt=""
        aria-hidden="true"
        className="absolute right-[clamp(-40px,-2vw,0px)] -bottom-14 w-[clamp(320px,34%,520px)] h-auto opacity-[0.05] z-0 pointer-events-none select-none portal_narrow:hidden"
      />

      {/* The handoff's own CSS carries a note here: when the mission band
          returned to normal flow at this breakpoint the nav was still
          absolute, and the two landed on top of each other. Both go into flow
          together. */}
      <nav
        aria-label="Company"
        className="absolute top-0 left-0 right-0 z-[6] flex items-center justify-end gap-1.5 pt-[30px] px-[clamp(30px,4.4vw,72px)] portal_stack:relative portal_stack:top-auto portal_stack:justify-start portal_stack:flex-wrap portal_stack:gap-1 portal_stack:bg-bkg portal_stack:border-b portal_stack:border-brand_line portal_stack:px-5 portal_stack:py-3 portal_narrow:pb-3.5"
      >
        {TOP_NAV.map((item) =>
          item.cta ? (
            <button
              key={item.key}
              onClick={(e) => onNavigate?.(item.key, e.currentTarget)}
              className="font-display text-[13.5px] font-semibold text-custom-white bg-brand_green rounded-lg px-4 py-2.5 ml-2 whitespace-nowrap transition-colors hover:bg-brand_green_dark shadow-[0_1px_2px_rgba(15,36,64,.08)] cursor-pointer portal_stack:ml-auto portal_narrow:w-full portal_narrow:ml-0 portal_narrow:mt-2 portal_narrow:text-center"
            >
              {item.label}
            </button>
          ) : (
            <button
              key={item.key}
              onClick={(e) => onNavigate?.(item.key, e.currentTarget)}
              className="font-body text-[13.5px] font-medium text-brand_slate px-3 py-2 rounded-[7px] transition-colors hover:text-brand_navy hover:bg-custom-white/75 cursor-pointer portal_narrow:text-[12.5px] portal_narrow:px-2.5"
            >
              {item.label}
            </button>
          ),
        )}
      </nav>

      {/* Band stack — mission band and Perspectives strip travel together, so
          the measurement above has one element to watch. Its 82px offset is
          tied to the nav stack height above 900px; below that both are in flow
          and the offset stops applying. */}
      <div
        ref={stackRef}
        className="absolute top-[82px] left-0 right-0 z-[4] portal_stack:relative portal_stack:top-auto"
      >
        <div className="flex items-center gap-[clamp(16px,1.8vw,24px)] pt-[18px] pb-[19px] px-[clamp(30px,4.4vw,72px)] border-b border-brand_line bg-custom-white/70 backdrop-blur-[6px] portal_short:pt-3.5 portal_short:pb-[15px] portal_stack:flex-wrap portal_stack:gap-3 portal_stack:px-[26px] portal_stack:pt-4 portal_stack:pb-[18px]">
          <span className="flex-none font-mono text-[9.5px] font-semibold tracking-[0.18em] uppercase text-brand_green_dark leading-none [writing-mode:vertical-rl] rotate-180 portal_narrow:hidden">
            {MISSION.label}
          </span>
          <p className="flex-1 min-w-0 font-display text-[clamp(15px,1.5vw,21px)] font-bold leading-[1.32] tracking-[-0.025em] text-brand_navy portal_narrow:basis-full portal_narrow:text-[15px]">
            {MISSION.lead}
            <em className="not-italic text-brand_green_dark">{MISSION.emphasis}</em>
            {MISSION.tail}
          </p>
        </div>

        {/* Perspectives strip. Lighter fill than the mission band above it so
            the two read as separate bands without either competing with the
            artwork behind them. */}
        <div className="flex items-center gap-[clamp(12px,1.4vw,18px)] py-[11px] px-[clamp(30px,4.4vw,72px)] border-b border-brand_line bg-custom-white/45 backdrop-blur-[6px] portal_stack:flex-wrap portal_stack:gap-2.5 portal_stack:px-[26px] portal_stack:py-3">
          <span className="flex-none font-mono text-[9.5px] font-semibold tracking-[0.16em] uppercase text-brand_slate_2 portal_persp_label:hidden">
            {PERSPECTIVES_STRIP.labelFull}
          </span>
          {/* Short label takes over under 1200px, and steps out entirely
              between 901 and 1000 where even it would push the pills to wrap. */}
          <span className="flex-none font-mono text-[9.5px] font-semibold tracking-[0.16em] uppercase text-brand_slate_2 hidden portal_persp_label:inline portal_persp_squeeze:hidden">
            {PERSPECTIVES_STRIP.labelShort}
          </span>

          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {PERSPECTIVES_STRIP.buttons.map((b) => (
              <button
                key={b.id}
                onClick={(e) => onOpenPerspective?.(b.id, e.currentTarget)}
                className="font-display text-[12.5px] font-semibold text-brand_navy bg-custom-white border border-brand_line_2 rounded-full px-[15px] py-[7px] whitespace-nowrap transition-[color,border-color,background-color,transform] hover:text-brand_green_dark hover:border-brand_green_dark hover:bg-brand_green_tint hover:-translate-y-px cursor-pointer portal_narrow:text-[12px] portal_narrow:px-3"
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <StageCarousel
        paused={paused}
        onOpenNotes={(e) => onNavigate?.("notes", e)}
      />
    </div>
  );
};

export default Stage;
