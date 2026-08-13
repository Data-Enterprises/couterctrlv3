import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useAppDispatch } from "../../hooks";
import { setItemReportHandoff } from "../../features/itemReportSlice";
import type { SubDeptMargin } from "../../interfaces";
import type { ItemReportHandoff } from "../../features/itemReportSlice";

/**
 * "See item actions" — the hop from a graded page into Item Actions.
 *
 * The performance pages decide *what* is wrong; Item Actions says what to do
 * about it. Until now the only bridge between them was exporting a CSV and
 * uploading it again, which is a lot of ceremony for a question the app already
 * has the answer to.
 *
 * The list travels through Redux rather than the URL. A critical department can
 * run to several hundred UPCs, which is far past what a query string will carry
 * — and the codes are only meaningful next to the store and week they were
 * graded in, so a link that survived a paste into someone else's browser would
 * be a liability rather than a feature.
 *
 * **Nothing is re-graded on arrival.** The caller passes items it has already
 * graded, because it is the only thing that knows which metric and threshold
 * were on screen. Re-deriving severity here would let the report disagree with
 * the chip the user just clicked.
 *
 * Dates are deliberately absent from the payload. Both sides read `singleDate`
 * off `searchSlice` and derive their own seven-day week from it, so the windows
 * match by construction instead of by being copied in step.
 */

/** The minimum an item has to carry to be handed over: what it is, and which
 *  department it sells under. Both graded pages already tag their items with a
 *  department — a vendor's items routinely span several, and that set is what
 *  narrows the fan-out on the other side. */
export interface HandoffItem {
  productCode: string;
  dept: string;
}

export interface CriticalHandoffInput {
  storeId: number;
  /** The finished list, when the caller already graded it. Omitted by callers
   *  that pass `grade` instead and let the report resolve it after fetching. */
  items?: HandoffItem[];
  /** Defer grading to the report. See the note on `ItemReportHandoff.grade`. */
  grade?: ItemReportHandoff["grade"];
  /** The window the caller's data covers, as yyyy-mm-dd. */
  window: { start: string; end: string };
  /** The three periods' item rows, when the caller already holds them — which
   *  it does whenever it graded the items itself. Skips a fan-out the report
   *  would otherwise repeat call for call. */
  rows?: { ty: SubDeptMargin[]; lw: SubDeptMargin[]; ly: SubDeptMargin[] };
  /** What the list is of — "Soft Drinks", "Clark Beverage Group". */
  sourceLabel: string;
  /** How it was graded, so the report can say why these items and not others.
   *  Without it the same department yields different lists on different days
   *  and nothing on screen explains the change. */
  basisLabel: string;
}

export const useCriticalReport = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return useCallback(
    ({
      storeId,
      items,
      grade,
      window,
      rows,
      sourceLabel,
      basisLabel,
    }: CriticalHandoffInput) => {
      // Deduped because the same UPC can appear on more than one source row —
      // an item sold on several days, or under more than one price type.
      const upcs = [...new Set((items ?? []).map((i) => i.productCode))];
      // Blank departments are dropped rather than passed through: an empty
      // string matches nothing on the far side, and one unmatched name would
      // widen the read back out to every department without saying so.
      const departments = [
        ...new Set((items ?? []).map((i) => i.dept).filter((d) => d.length > 0)),
      ];

      dispatch(
        setItemReportHandoff({
          storeId,
          upcs,
          departments,
          grade,
          window,
          rows,
          sourceLabel,
          basisLabel,
        }),
      );
      navigate("/item-report");
    },
    [dispatch, navigate],
  );
};
