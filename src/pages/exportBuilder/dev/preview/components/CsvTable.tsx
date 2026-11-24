// Utils
import { isPii } from "../../utils/piiColumns";
import { CORNER_TH, ROW_NUMBER_TD, cellMotion } from "../utils";
// PARKED with the Dates control — see dateFormats.ts.
// import { formatDateValue, isDateColumn } from "../utils/dateFormats";

// Interfaces
import type { RefObject } from "react";
import type { ColumnDrag } from "../hooks";
import type { ExportColumn, ExportRow } from "../../../../../api/salesExport";

interface CsvTableProps {
  /** The file's columns, in order. */
  cols: ExportColumn[];
  rows: ExportRow[];
  drag: ColumnDrag;
  scrollerRef: RefObject<HTMLDivElement | null>;
  /** Alt+arrow: move a column one place left or right. */
  onNudge: (name: string, visibleIndex: number, by: -1 | 1) => void;
}

/** The sample lines as the file will write them, with headings that drag
 *  (or Alt+arrow) to reorder. Personal columns are shaded. */
const CsvTable = ({
  cols,
  rows,
  drag,
  scrollerRef,
  onNudge,
}: CsvTableProps) => (
  <div
    ref={scrollerRef}
    className={`flex-1 overflow-auto thin-scrollbar ${
      drag.name ? "select-none cursor-grabbing" : ""
    }`}
  >
    <table className="border-collapse font-mono text-[11px] w-max">
      <thead>
        <tr>
          <th className={CORNER_TH}></th>
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
                if (e.key === "ArrowLeft") onNudge(c.name, i, -1);
                if (e.key === "ArrowRight") onNudge(c.name, i, 1);
              }}
              tabIndex={0}
              aria-label={`${c.name}, column ${i + 1} of ${cols.length}. Hold and drag to reorder, or alt plus arrow keys.`}
              style={{
                transform: `translateX(${drag.offsetFor(i)}px)`,
                transition: cellMotion(drag, i),
                zIndex: drag.isDragging(i) ? 20 : undefined,
                position: drag.isDragging(i) ? "relative" : undefined,
              }}
              className={`sticky top-0 z-10 border-b border-brand_line_2 border-r border-brand_line px-2.5 py-1.5 text-left font-semibold whitespace-nowrap cursor-grab select-none ${
                drag.isDragging(i)
                  ? "shadow-lg bg-filter_active text-content"
                  : isPii(c.name)
                    ? "bg-severity_watch_bg text-severity_watch_text"
                    : "bg-row_selected text-content"
              }`}
            >
              {c.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r}>
            <td className={ROW_NUMBER_TD}>{r + 1}</td>
            {cols.map((c, i) => {
              // PARKED: written as the file will write it, once the
              // endpoint can write it that way.
              // const raw = isDateColumn(c.data_type)
              //   ? formatDateValue(row[c.name], ctx.flags.dateFormat)
              //   : row[c.name];
              const raw = row[c.name];
              return (
                <td
                  key={c.name}
                  style={{
                    transform: `translateX(${drag.offsetFor(i)}px)`,
                    transition: cellMotion(drag, i),
                  }}
                  className={`border-r border-b border-brand_line px-2.5 py-1.5 whitespace-nowrap ${
                    drag.isDragging(i) ? "bg-filter_active/40" : ""
                  }`}
                >
                  {raw === null || raw === undefined ? "" : String(raw)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default CsvTable;
