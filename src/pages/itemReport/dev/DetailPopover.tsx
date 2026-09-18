import { useEffect, useRef } from "react";
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
 */
const DetailPopover = ({
  title,
  subtitle,
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
  onClose: () => void;
  /** Background and text colour, e.g. `bg-amber-50 text-amber-900`. */
  className?: string;
  children: React.ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={`absolute top-full left-0 right-0 rounded-b-lg shadow-xl overflow-hidden z-50 animate-slidedown ${className ?? ""}`}
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
