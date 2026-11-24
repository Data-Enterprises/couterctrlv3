// Interfaces
import type { GrantMode } from "../../../../../../interfaces";

interface GrantModeChipProps {
  mode: GrantMode;
  className?: string;
}

/**
 * `auto` or `fixed`, the same chip on the assignments panel, the review step
 * and Edit user. Filter-active colours, not severity: neither is a verdict.
 */
const GrantModeChip = ({ mode, className = "" }: GrantModeChipProps) => (
  <span
    title={
      mode === "all"
        ? "The whole group. Stores added to it later appear for this person automatically."
        : "Only the stores picked. A store added to the group later does not reach this person."
    }
    className={`inline-block text-[9.5px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full flex-shrink-0 ${
      mode === "all"
        ? "bg-filter_active text-brand_navy"
        : "bg-row_stripe text-content/95"
    } ${className}`}
  >
    {mode === "all" ? "auto" : "fixed"}
  </span>
);

export default GrantModeChip;
