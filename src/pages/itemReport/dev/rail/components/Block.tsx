// Interfaces
import type { ReactNode } from "react";

// Components
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

interface BlockProps {
  /** Stable across renders, unlike `label` — two of these interpolate a day
   *  count into their heading, and a key that changes would lose the fold. */
  id: string;
  label: string;
  /** Sits opposite the label. For a fact qualifying the whole section — how
   *  stale the deliveries are, say — which belongs with the heading rather than
   *  dangling under a list it isn't a row of. */
  note?: string;
  noteTone?: string;
  collapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/**
 * One section of the rail.
 *
 * Sections divide on navy at 15% rather than a grey hairline — the same colour
 * the panel headers use, so the rail reads as one panel instead of a stack of
 * unrelated cards.
 */
const Block = ({
  // `id` arrives via the spread and is only there so the caller can key the
  // fold; the component itself has no use for it.
  label,
  note,
  noteTone = "text-content",
  collapsed,
  onToggle,
  children,
}: BlockProps) => (
  <div className="px-3 py-2.5 border-b border-brand_navy/15">
    {/* The whole heading is the hit area, not just the chevron — a 12px target
        in a panel this narrow is a miss waiting to happen. */}
    <div
      onClick={onToggle}
      className={`flex items-center justify-between gap-2 cursor-pointer select-none ${
        collapsed ? "" : "mb-1.5"
      }`}
    >
      <span className="flex items-center gap-1 min-w-0">
        {collapsed ? (
          <ChevronRightIcon className="w-3.5 h-3.5 text-content flex-shrink-0" />
        ) : (
          <ChevronDownIcon className="w-3.5 h-3.5 text-content flex-shrink-0" />
        )}
        <span className="text-[11.5px] font-medium uppercase tracking-wide text-content truncate">
          {label}
        </span>
      </span>
      {note && (
        <span
          className={`text-[12px] font-medium tabular-nums flex-shrink-0 ${noteTone}`}
        >
          {note}
        </span>
      )}
    </div>
    {!collapsed && children}
  </div>
);

export default Block;
