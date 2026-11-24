// Interfaces
import type { ColumnDrag } from "../hooks";

/** The file's name as the export writes it. */
export const previewFileName = (
  filePrefix: string,
  startDate: string,
  endDate: string,
  fileFormat: string,
) =>
  `${filePrefix}_${startDate}_${endDate}.${fileFormat === "csv" ? "csv" : "txt"}`;

/** The empty cell over the row numbers, pinned to both edges. */
export const CORNER_TH =
  "sticky top-0 left-0 z-30 w-[38px] bg-row_selected border-b border-brand_line_2 border-r border-brand_line px-2 py-1.5";

/** A sample line's number, pinned to the left edge. */
export const ROW_NUMBER_TD =
  "sticky left-0 z-10 bg-custom-white border-r border-brand_line border-b border-brand_line px-2 py-1.5 text-right text-content/95";

/**
 * The carried column tracks the cursor, so it must not lag behind a
 * transition; the ones stepping aside glide. On the frame a drop commits
 * nothing animates, or the column would seem to slide back where it came from.
 */
export const cellMotion = (drag: ColumnDrag, index: number) =>
  drag.settling || drag.isDragging(index)
    ? "none"
    : "transform 180ms cubic-bezier(.2,.8,.3,1)";
