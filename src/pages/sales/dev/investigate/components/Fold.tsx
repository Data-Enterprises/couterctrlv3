// Hooks
import { useState, type ReactNode } from "react";

interface FoldProps {
  title: string;
  children: ReactNode;
}

// Interfaces


/**
 * A section that folds.
 *
 * The panel is four sections deep and a reader chasing one of them should
 * not scroll past the other three every time. Open by default: a panel of
 * shut drawers makes somebody open all four to find out what is in them.
 */
const Fold = ({ title, children }: FoldProps) => {
  const [open, setOpen] = useState(true);
  return (
    /* A seam between sections, not a frame around them: at /15 and above
       it ruled the panel into boxes and competed with the figures. */
    <section className="pt-3 mt-3 border-t border-brand_navy/10 first:border-t-0 first:mt-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 text-left group"
      >
        <span className="text-[12px] font-bold uppercase tracking-wide text-content/95 group-hover:text-content transition-colors">
          {title}
        </span>
        <span className="ml-auto flex-shrink-0 text-[10px] text-content/95">
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </section>
  );
};

export default Fold;
