import { useCallback, useRef } from "react";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { useExportBuilderCtx } from "./hooks";
import { isPii, maskValue } from "./piiColumns";
import { useColumnDrag } from "./useColumnDrag";
import { moveColumn } from "../../../features/dev/devExportBuilderSlice";

/**
 * The right panel: the file, not a report.
 *
 * Same columns in the same order the export writes them, so ticking one on the
 * left adds a column here and to the CSV at once, and dragging a header
 * changes both. The rows are the fifty the preview returned — unordered, so
 * they show the file's shape accurately but not its variety: fifty rows from
 * one scan position is often a single store and two sale types.
 *
 * Personal columns show a mask rather than the value. The file carries the
 * real thing; this is a screen someone else can be standing behind.
 */
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

  /**
   * The carried column tracks the cursor, so it must not lag behind a
   * transition; the ones stepping aside should glide, which is the whole
   * point. And on the frame a drop commits, nothing animates at all —
   * offsets clear and the order changes together, and animating that reads
   * as the column sliding back where it came from.
   */
  const motion = (index: number) =>
    drag.settling || drag.isDragging(index)
      ? "none"
      : "transform 180ms cubic-bezier(.2,.8,.3,1)";

  const name = `${ctx.flags.filePrefix || "sales"}_${ctx.startDate}_${ctx.endDate}.${
    ctx.flags.fileFormat === "csv" ? "csv" : "txt"
  }`;

  /** Alt+arrows do the same thing from the keyboard, since a drag cannot. */
  const nudge = (colName: string, visibleIndex: number, by: -1 | 1) => {
    const neighbour = cols[visibleIndex + by];
    if (!neighbour) return;
    ctx.dispatch(
      moveColumn({ name: colName, to: ctx.columnOrder.indexOf(neighbour.name) }),
    );
  };

  return (
    <div className="flex-1 min-w-0 bg-card_bg border border-brand_line rounded-xl flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-custom-white border-b border-brand_line flex-shrink-0">
        <DocumentTextIcon className="w-4 h-4 text-content/60 flex-shrink-0" />
        <span className="font-mono text-[12.5px] font-semibold truncate">
          {name}
        </span>
        <span className="text-[11.5px] text-content/60 flex-shrink-0">
          {cols.length} column{cols.length === 1 ? "" : "s"} ·{" "}
          {ctx.selectedStoreIds.length} store
          {ctx.selectedStoreIds.length === 1 ? "" : "s"}
        </span>
        <div className="flex-1" />
        <span className="text-[11.5px] text-content/60 flex-shrink-0">
          {drag.name
            ? `Moving ${drag.name}`
            : ctx.visibleRows.length === ctx.rows.length
              ? "Drag a heading to reorder · scroll for the rest"
              : `${ctx.visibleRows.length} of ${ctx.rows.length} sample lines match`}
        </span>
      </div>

      {cols.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center px-6">
          <div className="max-w-[34ch]">
            <div className="text-[13px] font-semibold">No columns selected</div>
            <div className="text-[12.5px] text-content/70 mt-1.5">
              Tick a column on the left and it appears here, in the order the
              file will be written.
            </div>
          </div>
        </div>
      ) : (
        <div
          ref={scroller}
          className={`flex-1 overflow-auto thin-scrollbar ${
            drag.name ? "select-none cursor-grabbing" : ""
          }`}
        >
          <table className="border-collapse font-mono text-[11px] w-max">
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-30 w-[38px] bg-row_selected border-b border-brand_line_2 border-r border-brand_line px-2 py-1.5"></th>
                {cols.map((c, i) => (
                  <th
                    key={c.name}
                    ref={drag.registerCell(i)}
                    onPointerDown={(e) => {
                      if (e.button !== 0) return;
                      e.preventDefault();
                      drag.start(i, c.name, e);
                    }}
                    onKeyDown={(e) => {
                      if (!e.altKey) return;
                      if (e.key === "ArrowLeft") nudge(c.name, i, -1);
                      if (e.key === "ArrowRight") nudge(c.name, i, 1);
                    }}
                    tabIndex={0}
                    aria-label={`${c.name}, column ${i + 1} of ${cols.length}. Hold and drag to reorder, or alt plus arrow keys.`}
                    style={{
                      transform: `translateX(${drag.offsetFor(i)}px)`,
                      transition: motion(i),
                      zIndex: drag.isDragging(i) ? 20 : undefined,
                      position: drag.isDragging(i) ? "relative" : undefined,
                    }}
                    className={`sticky top-0 z-10 border-b border-brand_line_2 border-r border-brand_line px-2.5 py-1.5 text-left font-semibold whitespace-nowrap cursor-grab select-none ${
                      drag.isDragging(i)
                        ? "shadow-lg bg-filter_active text-content"
                        : isPii(c.name)
                          ? "bg-amber-50 text-amber-900"
                          : "bg-row_selected text-content"
                    }`}
                  >
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ctx.visibleRows.map((row, r) => (
                <tr key={r}>
                  <td className="sticky left-0 z-10 bg-custom-white border-r border-brand_line border-b border-brand_line px-2 py-1.5 text-right text-content/50">
                    {r + 1}
                  </td>
                  {cols.map((c, i) => {
                    const raw = row[c.name];
                    const masked = isPii(c.name);
                    return (
                      <td
                        key={c.name}
                        style={{
                          transform: `translateX(${drag.offsetFor(i)}px)`,
                          transition: motion(i),
                        }}
                        className={`border-r border-b border-brand_line px-2.5 py-1.5 whitespace-nowrap ${
                          drag.isDragging(i) ? "bg-filter_active/40" : ""
                        } ${masked ? "text-amber-900" : ""}`}
                      >
                        {masked
                          ? maskValue(raw)
                          : raw === null || raw === undefined
                            ? ""
                            : String(raw)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ctx.visibleRows.length === 0 && cols.length > 0 && (
        <div className="px-4 py-3 border-t border-brand_line bg-custom-white text-[12px] text-content/70 flex-shrink-0">
          None of the sample lines match what you have kept. The file can still
          hold plenty: the sample is fifty lines taken where the scan landed,
          often one store and a couple of sale types.
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-2 bg-custom-white border-t border-brand_line flex-shrink-0">
        <span className="text-[11.5px] text-content/60">
          Columns are written in the order shown. Personal values are hidden
          here and written to the file.
        </span>
      </div>
    </div>
  );
};

export default CsvPreview;
