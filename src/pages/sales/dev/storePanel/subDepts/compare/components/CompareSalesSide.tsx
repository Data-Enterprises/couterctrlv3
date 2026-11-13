// Utils
import { SALES_BAR } from "../utils";

// Interfaces
import type { Side } from "../../interfaces";
import type { SalesCell } from "../interfaces";

interface CompareSalesSideProps {
  side: Side;
  cell: SalesCell;
  /** The bar's length, percent of the biggest figure in the chart. */
  share: number;
  /** This week: a bolder figure and a full-strength bar. */
  now: boolean;
  chip: { text: string; cls: string } | null;
}

/** One list's half of a sales row: the figure (and its change) over a bar that
 *  grows away from the centre. A mirrors B. */
const CompareSalesSide = ({ side, cell, share, now, chip }: CompareSalesSideProps) => {
  const a = side === "A";
  return (
    <span className={`flex flex-col gap-1 min-w-0 ${a ? "items-end pr-2" : "items-start pl-2"}`}>
      <span className={`flex items-center gap-2 whitespace-nowrap ${a ? "flex-row" : "flex-row-reverse"}`}>
        {chip ? <span className={`cc-tag py-0 text-[11px] ${chip.cls}`}>{chip.text}</span> : null}
        <span className={now ? "text-[15px] font-bold" : "text-[12.5px] font-semibold"}>{cell.fig}</span>
      </span>
      <span className={`flex w-full h-1.5 ${a ? "justify-end" : "justify-start"}`}>
        <span className={`block h-full rounded-sm ${SALES_BAR[side][now ? 0 : 1]}`} style={{ width: `${share}%` }} />
      </span>
    </span>
  );
};

export default CompareSalesSide;
