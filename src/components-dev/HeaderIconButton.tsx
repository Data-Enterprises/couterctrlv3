import type { ReactNode } from "react";

/**
 * A 22px icon button in a navy panel header.
 *
 * The same class string had been written out five times — `InfoButton`, the
 * search and back buttons in `MobilePerfHeader`, and the export buttons on the
 * Data pages — and had already drifted once (28px on Coupons and Receivers,
 * 22px everywhere else, so the Data-page headers sat a row taller than the
 * Performance ones). It lives here now so the next change lands once.
 *
 * `InfoButton` stays its own component: it owns the "?" glyph and the default
 * title, and eleven desktop panels already import it by that name.
 */
interface Props {
  onClick: () => void;
  /** Doubles as the accessible name — every one of these is icon-only. */
  title: string;
  /** Size it `w-3.5 h-3.5` to match the "?" and the search glyph. */
  children: ReactNode;
  className?: string;
}

const HeaderIconButton = ({ onClick, title, children, className }: Props) => (
  <button
    onClick={onClick}
    title={title}
    aria-label={title}
    className={`w-[22px] h-[22px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/75 hover:text-custom-white hover:border-custom-white/40 transition-colors flex-shrink-0 ${className ?? ""}`}
  >
    {children}
  </button>
);

export default HeaderIconButton;
