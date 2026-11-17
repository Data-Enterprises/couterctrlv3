// Hooks
import { useCallback, useRef } from "react";
import { useExportBuilderCtx } from "../hooks";
import { useColumnDrag } from "./hooks";

// Redux
import { moveColumn } from "../../../../features/dev/devExportBuilderSlice";

// Utils
import { previewFileName } from "./utils";

// Components
import PreviewHeader from "./components/PreviewHeader";
import PreviewEmpty from "./components/PreviewEmpty";
import CsvTable from "./components/CsvTable";
import SampleMissNote from "./components/SampleMissNote";
import PiiFooter from "./components/PiiFooter";

/** The right panel when the file is the lines: the sample as the file will
 *  write it, with columns that drag into the file's order. */
const CsvPreview = () => {
  const ctx = useExportBuilderCtx();
  const scroller = useRef<HTMLDivElement>(null);
  const cols = ctx.orderedColumns;

  /**
   * The drag hands back a position among the VISIBLE columns; the order it
   * lands in holds every column, hidden ones included. Dropping before a
   * neighbour means taking that neighbour's place in the full order.
   */
  const drop = useCallback(
    (name: string, toVisible: number) => {
      const neighbour = cols[toVisible];
      if (!neighbour) return;
      const to = ctx.columnOrder.indexOf(neighbour.name);
      ctx.dispatch(moveColumn({ name, to }));
    },
    [cols, ctx],
  );

  const drag = useColumnDrag(scroller, drop);

  const name = previewFileName(
    ctx.flags.filePrefix || ctx.source.filePrefix,
    ctx.startDate,
    ctx.endDate,
    ctx.flags.fileFormat,
  );

  const stores = ctx.selectedStoreIds.length;
  const counts = `${cols.length} column${cols.length === 1 ? "" : "s"} · ${stores} store${
    stores === 1 ? "" : "s"
  }`;
  const status = drag.name
    ? `Moving ${drag.name}`
    : ctx.visibleRows.length === ctx.rows.length
      ? "Drag a heading to reorder · scroll for the rest"
      : `${ctx.visibleRows.length} of ${ctx.rows.length} sample lines match`;

  /** Alt+arrows do the same thing from the keyboard, since a drag cannot. */
  const nudge = (colName: string, visibleIndex: number, by: -1 | 1) => {
    const neighbour = cols[visibleIndex + by];
    if (!neighbour) return;
    ctx.dispatch(
      moveColumn({
        name: colName,
        to: ctx.columnOrder.indexOf(neighbour.name),
      }),
    );
  };

  return (
    <div className="flex-1 min-w-0 bg-card_bg border border-brand_line rounded-xl flex flex-col min-h-0 overflow-hidden">
      <PreviewHeader
        kind="lines"
        fileName={name}
        counts={counts}
        status={status}
      />

      {cols.length === 0 ? (
        <PreviewEmpty kind="lines" />
      ) : (
        <CsvTable
          cols={cols}
          rows={ctx.visibleRows}
          drag={drag}
          scrollerRef={scroller}
          onNudge={nudge}
        />
      )}

      {ctx.visibleRows.length === 0 && cols.length > 0 && (
        <SampleMissNote
          kind="lines"
          noun={ctx.source.lists[0]?.noun ?? "values"}
        />
      )}

      <PiiFooter />
    </div>
  );
};

export default CsvPreview;
