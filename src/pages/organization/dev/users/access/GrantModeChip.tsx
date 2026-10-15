import type { GrantMode } from "../../../../../interfaces";

/**
 * `auto` or `fixed`, as the handoff's legend names them.
 *
 * Two words doing a lot of work, so they are a chip rather than prose and
 * they read the same everywhere — the assignments panel, the review step and
 * Edit user all show the same pair.
 *
 * `auto` borrows the filter-active tokens rather than a severity family.
 * Nothing here is being graded against a threshold: a group held as `auto` is
 * not better or worse than one held as `fixed`, it just behaves differently
 * when a store joins the group. Severity colours would read as a verdict.
 */
const GrantModeChip = ({
  mode,
  className = "",
}: {
  mode: GrantMode;
  className?: string;
}) => (
  <span
    title={
      mode === "all"
        ? "The whole group. Stores added to it later appear for this person automatically."
        : "Only the stores picked. A store added to the group later does not reach this person."
    }
    className={`inline-block text-[9.5px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full flex-shrink-0 ${
      mode === "all"
        ? "bg-filter_active text-brand_navy"
        : "bg-row_stripe text-content/85"
    } ${className}`}
  >
    {mode === "all" ? "auto" : "fixed"}
  </span>
);

export default GrantModeChip;
