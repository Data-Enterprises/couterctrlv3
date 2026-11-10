// Utils
import { DAY_CARD } from "../utils/recapGrid";

// Interfaces
import type { ReactNode } from "react";
import type { StatRow } from "../interfaces";

interface RecapStatCardProps {
  title: string;
  hero: string;
  heroSub: string;
  rows: StatRow[];
  short: boolean;
  action?: ReactNode;
  children?: ReactNode;
}

/**
 * One card of a day's recap: a title, one headline figure with a few words
 * beside it, then the lines that make it up.
 *
 * Money, Baskets and Exceptions are all this shape, so they read alike: the
 * figure that answers the card first, the working underneath. `children`
 * goes under the lines (Money's price mix); `action` sits at the right of
 * the title (Baskets' View items).
 */
const RecapStatCard = ({
  title,
  hero,
  heroSub,
  rows,
  short,
  action,
  children,
}: RecapStatCardProps) => (
  <section
    aria-label={title}
    className={`${DAY_CARD} h-full min-w-0 flex flex-col px-[18px] ${short ? "pt-2.5 pb-2" : "pt-3.5 pb-3"}`}
  >
    <div className="flex items-center justify-between gap-2">
      <h4 className="text-[14px] font-semibold text-content">{title}</h4>
      {action}
    </div>
    <div className={`flex flex-wrap items-baseline gap-x-2 ${short ? "mt-1" : action ? "mt-1" : "mt-1.5"}`}>
      <span
        className={`${short ? "text-[22px]" : "text-[26px]"} font-bold leading-tight text-content tabular-nums`}
      >
        {hero}
      </span>
      <span className="text-[14px] text-content">{heroSub}</span>
    </div>
    {rows.length > 0 && (
      <div className={`${short ? "mt-1.5" : "mt-2.5"} border-t border-brand_line`}>
        {rows.map((r) => (
          <div
            key={r.label}
            className={`flex items-baseline justify-between gap-2.5 border-b border-gray-100 ${
              short ? "py-1" : "py-[7px]"
            } text-[14px] text-content`}
          >
            <span className="min-w-0 truncate">{r.label}</span>
            <span className="tabular-nums whitespace-nowrap">
              <span className="font-semibold">{r.value}</span>
              {r.sub && <span className="text-[13px]">{r.sub}</span>}
            </span>
          </div>
        ))}
      </div>
    )}
    {children}
  </section>
);

export default RecapStatCard;
