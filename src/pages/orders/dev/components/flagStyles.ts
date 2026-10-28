import type { OrderFlag } from "../../../../features/dev/devOrdersSlice";

/**
 * How a cost problem is named and coloured, everywhere it appears: the Browse
 * filter chips, the dots on a Browse row, and the Problems tab in Edit.
 *
 * Missing cost is red because it makes Ext cost and margin wrong. The other
 * two are amber: a high margin is usually a wrong cost but sometimes a real
 * one, and no case size usually means the item is ordered by the unit, so
 * case cost and unit cost are the same number. Severity tokens, because this
 * grades the data rather than the buyer.
 */
export const FLAG_LABEL: Record<OrderFlag, string> = {
  missingCost: "Missing cost",
  noCaseSize: "No case size",
  highMargin: "High margin",
};

/** A chip that is switched on, or a flag named on its own. */
export const FLAG_ON: Record<OrderFlag, string> = {
  missingCost:
    "border-severity_critical_text bg-severity_critical_bg text-severity_critical_text",
  noCaseSize:
    "border-severity_watch_text bg-severity_watch_bg text-severity_watch_text",
  highMargin:
    "border-severity_watch_text bg-severity_watch_bg text-severity_watch_text",
};

/** Same reading as the chips — red is wrong, amber is worth a look. */
export const FLAG_DOT: Record<OrderFlag, string> = {
  missingCost: "bg-severity_critical_text",
  noCaseSize: "bg-severity_watch_text",
  highMargin: "bg-severity_watch_text/60",
};

export const FLAG_TITLE: Record<OrderFlag, string> = {
  missingCost: "No cost on this line — Ext cost and margin are wrong",
  noCaseSize:
    "No case size — usually ordered by the unit, so case cost and unit cost are the same",
  highMargin: "Margin over the threshold, usually a wrong cost",
};
