import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Mono kicker above the title — "CounterCtrl Cloud" on every panel. */
  kicker: string;
  title: string;
  /** min(width, 100%). Field Notes 660 · About 620 · forms 560. */
  width: number;
  children: ReactNode;
  /** Sticky bottom bar. Omit for panels that don't have one. */
  footer?: ReactNode;
  /** Restored on close, so keyboard users land back where they started. */
  returnFocusTo?: HTMLElement | null;
}

/** Shared chrome for all four portal slide-overs.
 *
 *  The static build repeated this four times — four scrims, four Esc
 *  listeners, four focus-return calls. Collapsing it here means the focus trap
 *  that HANDOFF §8 lists as missing gets written once and every panel inherits
 *  it, rather than being fixed four times or (more likely) once.
 *
 *  Stays mounted while closed so the slide-in transform animates; visibility
 *  and pointer-events are what actually gate it. */
const PortalPanel = ({
  open,
  onClose,
  kicker,
  title,
  width,
  children,
  footer,
  returnFocusTo,
}: Props) => {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      // Focus trap. Without it Tab walks straight out of the panel and into
      // the sign-in form behind the scrim, which is both confusing and a
      // WCAG failure for a dialog.
      const root = panelRef.current;
      if (!root) return;
      const focusable = root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Move focus in on open, and back to the trigger on close.
  useEffect(() => {
    if (open) {
      panelRef.current?.focus();
    } else {
      returnFocusTo?.focus();
    }
    // Keyed on `open` only. returnFocusTo is deliberately not a dependency:
    // re-running when the trigger element identity changes would yank focus
    // mid-interaction.
  }, [open]);

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-[80] bg-[rgba(15,36,64,0.4)] backdrop-blur-[2px] transition-[opacity,visibility] duration-[220ms] ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-hidden={!open}
        tabIndex={-1}
        style={{ width: `min(${width}px, 100%)` }}
        className={`fixed top-0 right-0 bottom-0 z-[90] bg-custom-white flex flex-col outline-none transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)] motion-reduce:transition-none ${
          open ? "translate-x-0" : "translate-x-[101%]"
        }`}
      >
        <div className="flex items-start justify-between gap-4 px-8 pt-[26px] pb-5 border-b border-brand_line flex-none">
          <div>
            <span className="font-mono text-[9.5px] tracking-[0.16em] uppercase text-brand_green_dark">
              {kicker}
            </span>
            <h2 className="font-display text-[23px] font-extrabold text-brand_navy mt-[5px] tracking-[-0.03em] leading-[1.12]">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex-none border border-brand_line bg-custom-white rounded-lg text-brand_slate text-[15px] leading-none flex items-center justify-center transition-colors hover:bg-bkg hover:text-brand_navy cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto thin-scrollbar">{children}</div>

        {footer && (
          <div className="flex-none border-t border-brand_line bg-brand_paper px-8 py-[15px] flex items-center justify-between gap-4 flex-wrap font-mono text-[9.5px] tracking-[0.12em] uppercase text-brand_slate_2">
            {footer}
          </div>
        )}
      </aside>
    </>
  );
};

export default PortalPanel;
