import { useEffect, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/16/solid";

/**
 * A panel that BEHAVES like the "?" card and is coloured by whatever opened it.
 *
 * The behaviour is the part worth sharing: anchored under its trigger, full
 * width of it, dismissed by a click outside or by the X, same slide-down. The
 * navy is not — a card that opens out of an amber strip or a Reprice chip and
 * lands in the header's colours breaks the one thing those tones are for, which
 * is telling you at a glance what kind of thing you are looking at.
 *
 * So the surface comes from the caller. Everything inside inherits `color`, and
 * the rules use `border-current`, so a single class pair on `className` themes
 * the whole card.
 *
 * Anchors to the nearest positioned ancestor — the trigger's wrapper needs
 * `relative`.
 *
 * Takes `open` rather than being mounted conditionally, because a card that is
 * unmounted the instant it closes cannot animate on the way out. It keeps
 * itself on screen for the length of the leave and then removes itself.
 */
/** How long the leave runs. Must match `animate-slideup` in tailwind.config —
 *  too short and the card vanishes mid-slide, too long and it sits invisible
 *  over the content beneath it. */
const LEAVE_MS = 150;
const DetailPopover = ({
  title,
  subtitle,
  open,
  onClose,
  className,
  children,
}: {
  /**
   * Omit it when the trigger already says it.
   *
   * These open directly beneath the control that names them, so a heading is
   * usually the same word twice a line apart — "INVESTIGATE" on the strip and
   * "Investigate" in the card. Closing is covered without one: the trigger
   * flips to Hide, and a click anywhere outside dismisses.
   */
  title?: string;
  /** One line under the title, for the caveat that belongs to the whole card
   *  rather than to any row inside it. */
  subtitle?: string;
  /** False starts the leave; the card removes itself when it finishes. */
  open: boolean;
  onClose: () => void;
  /** Background and text colour, e.g. `bg-amber-50 text-amber-900`. */
  className?: string;
  children: React.ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  /** On screen — true through the whole leave, not just while `open`. */
  const [mounted, setMounted] = useState(open);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setLeaving(false);
      return;
    }
    if (!mounted) return;
    setLeaving(true);
    const t = setTimeout(() => {
      setMounted(false);
      setLeaving(false);
    }, LEAVE_MS);
    return () => clearTimeout(t);
  }, [open, mounted]);

  useEffect(() => {
    // Only while genuinely open. During the leave the card is on its way out
    // already, and a stray outside click asking it to close again is noise.
    if (!open) return;
    /**
     * "Outside" means outside the WRAPPER, not outside this card.
     *
     * The trigger is a sibling of this element, so measuring against the card
     * alone made the trigger count as outside — and clicking it to close ran
     * both halves of the toggle:
     *
     *   mousedown on the trigger -> onClose()            -> false
     *   click on the trigger     -> setOpen((o) => !o)   -> back to true
     *
     * React batches the pair, so the functional update saw the pending false
     * and flipped it straight back. The card shut and reopened under the
     * cursor, and no amount of clicking would close it.
     *
     * The parent is the positioned wrapper this card anchors to — the one the
     * docblock above already requires to be `relative` — and it holds the
     * trigger too. Measuring against it leaves the trigger's own handler as
     * the only thing that runs, which is the one that knows what to do.
     */
    const onOutside = (e: MouseEvent) => {
      const root = ref.current?.parentElement ?? ref.current;
      if (root && !root.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [onClose, open]);

  if (!mounted) return null;

  return (
    <div
      ref={ref}
      // `pointer-events-none` while leaving: it is still on screen but no
      // longer a thing to click, and a card catching a click on its way out is
      // how you end up reopening what you just closed.
      className={`absolute top-full left-0 right-0 rounded-b-lg shadow-xl overflow-hidden z-50 motion-reduce:animate-none ${
        leaving ? "animate-slideup pointer-events-none" : "animate-slidedown"
      } ${className ?? ""}`}
    >
      {(title || subtitle) && (
        <div className="px-4 py-2.5 flex items-start justify-between gap-3 flex-shrink-0 border-b border-current/15">
          <div className="min-w-0">
            {title && <div className="text-[12px] font-semibold">{title}</div>}
            {subtitle && (
              <div className="text-[11px] leading-relaxed opacity-90 mt-0.5">
                {subtitle}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="opacity-90 hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
            aria-label="Close"
          >
            <XMarkIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="max-h-[360px] overflow-y-auto thin-scrollbar">
        {children}
      </div>
    </div>
  );
};

export default DetailPopover;
