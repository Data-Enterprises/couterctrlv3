import type { CSSProperties, ReactNode } from "react";

/**
 * The list panel's navy-headed card.
 *
 * Deliberately list-only. Receivers, Orders and Coupons build their two panels
 * differently on purpose: the list header is two rows at `px-3 pt-1 pb-2.5`
 * with a hairline between them, while the detail header is a single
 * `px-4 py-[11px]` row with the title and its metadata pushed to opposite
 * edges. An earlier version of this tried to serve both through a `variant`
 * prop and produced a stacked detail header that no other page has — the
 * detail panel now renders its own header, the way Receivers does.
 *
 * Page-local: promoting it while only this page uses it would add a variant
 * that looks canonical without being what anything else renders.
 */
interface PanelFrameProps {
  /** Row 1, left. */
  title: string;
  /** Row 1, beside the title — the window, bare, with no leading label. */
  subtitle?: string;
  /** Row 1, right. Receivers' "Total 217" cluster sits here. */
  headerRight?: ReactNode;
  /** Row 2, under the hairline: re-search, scope, info. */
  secondRow?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Inline sizing, because the Data pages size panels as a percentage of the
   *  viewport rather than with a fixed width class. */
  style?: CSSProperties;
}

const PanelFrame = ({
  title,
  subtitle,
  headerRight,
  secondRow,
  children,
  className = "",
  style,
}: PanelFrameProps) => (
  <div
    className={`flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white min-h-0 ${className}`}
    style={style}
  >
    <div
      className="flex-shrink-0 px-3 pt-1 pb-2.5 flex flex-col gap-0"
      style={{ background: "#1e2a4a" }}
    >
      <div className="flex items-end gap-3 min-h-[24px]">
        <span className="text-[13px] font-semibold text-custom-white flex-shrink-0">
          {title}
        </span>
        {subtitle && (
          <span className="text-custom-white text-[10px] flex-shrink-0">
            {subtitle}
          </span>
        )}
        <div className="flex-1" />
        {headerRight}
      </div>
      {secondRow && (
        <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-custom-white/[0.08]">
          {secondRow}
        </div>
      )}
    </div>
    {children}
  </div>
);

export default PanelFrame;
