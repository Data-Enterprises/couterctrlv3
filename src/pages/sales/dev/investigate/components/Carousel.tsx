// Hooks
import { useEffect, useRef, useState } from "react";

// Interfaces
import type { Slide } from "../interfaces";

interface CarouselProps {
  slides: Slide[];
  /** The slide to show, when something outside the carousel picks it. Left
   *  out, the carousel keeps its own place. */
  at?: number;
  /** Told whenever the carousel moves, by a tab, an arrow or a swipe. */
  onAt?: (i: number) => void;
  /** Fill the height it is given, so each slide can scroll inside itself
   *  rather than the card growing past the page. */
  fill?: boolean;
}

/* ------------------------------------------------------------------ */
/* One card at a time                                                  */
/* ------------------------------------------------------------------ */

/**
 * Several cards in one card's space.
 *
 * Three supporting cards stacked down a column made the page a scroll, and
 * the third was never read. They are peers — three ways of asking the same
 * question — so they share one frame and the reader picks. Named tabs
 * rather than dots alone, because a dot does not say what it hides.
 *
 * It is a scroll container, so a trackpad swipe works and the tabs stay
 * honest about where it ended up.
 */
const Carousel = ({ slides, at: picked, onAt, fill = false }: CarouselProps) => {
  const track = useRef<HTMLDivElement>(null);
  const [own, setOwn] = useState(0);
  const at = picked ?? own;
  const setAt = (i: number) => (onAt ? onAt(i) : setOwn(i));

  /**
   * Where a click is taking it, while it is still on the way.
   *
   * A smooth `scrollTo` fires `scroll` for every frame of its animation, so
   * the handler below read the position it was LEAVING and set the tab back
   * to it — the underline jumped to the new tab, back to the old one, then
   * forward again. The journey is ignored; only the arrival counts.
   */
  const bound = useRef<number | null>(null);
  const giveUp = useRef(0);

  const slideTo = (n: number, smooth: boolean) => {
    const el = track.current;
    if (!el) return;
    bound.current = n;
    /* And if it never lands exactly — a sub-pixel width, an interrupted
       animation — stop waiting, or a swipe would stop moving the tabs. */
    window.clearTimeout(giveUp.current);
    giveUp.current = window.setTimeout(() => {
      bound.current = null;
    }, 600);
    el.scrollTo({ left: n * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
  };

  const go = (i: number) => {
    const n = Math.max(0, Math.min(slides.length - 1, i));
    slideTo(n, true);
    setAt(n);
  };

  /* Picked from outside: slide there, unless it is already there. The first
     time lands without the animation, so the card opens on its slide. */
  const first = useRef(true);
  useEffect(() => {
    const smooth = !first.current;
    first.current = false;
    const el = track.current;
    if (picked === undefined || !el) return;
    if (Math.round(el.scrollLeft / Math.max(1, el.clientWidth)) === picked) return;
    slideTo(picked, smooth);
  }, [picked]);

  return (
    <div
      className={`rounded-lg bg-custom-white shadow-card overflow-hidden flex flex-col min-w-0 ${
        fill ? "h-full min-h-0" : ""
      }`}
    >
      <div className="flex items-center gap-0.5 px-2 pt-1.5 border-b border-brand_navy/15">
        {slides.map((sl, i) => (
          <button
            key={sl.label}
            onClick={() => go(i)}
            aria-current={i === at}
            className={`relative px-2.5 pt-1.5 pb-2 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap transition-colors ${
              i === at ? "text-content" : "text-content/95 hover:text-content"
            }`}
          >
            {sl.label}
            {sl.count !== undefined && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-bkg text-[10px] tabular-nums tracking-normal">
                {sl.count}
              </span>
            )}
            {i === at && (
              <span className="absolute left-1.5 right-1.5 -bottom-px h-0.5 bg-brand_navy" />
            )}
          </button>
        ))}

        <span className="ml-auto flex gap-1 pb-1">
          {[-1, 1].map((step) => (
            <button
              key={step}
              onClick={() => go(at + step)}
              disabled={step < 0 ? at === 0 : at === slides.length - 1}
              aria-label={step < 0 ? "Previous" : "Next"}
              className="w-7 h-7 rounded-md border border-brand_navy/20 text-[12px] text-content hover:bg-bkg disabled:opacity-35 disabled:hover:bg-transparent transition-colors"
            >
              {step < 0 ? "‹" : "›"}
            </button>
          ))}
        </span>
      </div>

      <div
        ref={track}
        onScroll={() => {
          const el = track.current;
          if (!el) return;
          const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
          if (bound.current !== null) {
            if (i === bound.current) bound.current = null;
            return;
          }
          setAt(i);
        }}
        className={`flex overflow-x-auto no-scrollbar snap-x snap-mandatory overscroll-x-contain ${
          fill ? "flex-1 min-h-0" : ""
        }`}
      >
        {slides.map((sl) => (
          <div
            key={sl.label}
            className={`flex-none w-full snap-start px-4 py-3.5 min-w-0 ${
              fill ? "h-full min-h-0 flex flex-col" : ""
            }`}
          >
            {sl.body}
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-1.5 pb-2.5" aria-hidden>
        {slides.map((sl, i) => (
          <span
            key={sl.label}
            className={`h-1.5 rounded-full transition-all ${
              i === at ? "w-4 bg-brand_navy" : "w-1.5 bg-brand_navy/25"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;
