import { TableCellsIcon } from "@heroicons/react/24/outline";
import { useExportBuilderCtx } from "./hooks";
import { isPii, maskValue } from "./piiColumns";
// PARKED with the Dates control — see dateFormats.ts.
// import { formatDateValue, isDateColumn } from "./dateFormats";

/**
 * The right panel when the file is a rollup rather than the lines.
 *
 * No dragging here: the column order of an aggregated file is the group keys
 * in the order they were picked, then the measures in theirs, and the endpoint
 * writes it that way. Moving a heading would be a promise this file cannot
 * keep.
 *
 * The numbers are the honest part to get right. They are this configuration's
 * arithmetic over the sample lines, not over the range — a month does
 * not fit in two hundred rows — so the strip above them says so plainly rather than
 * letting a total on screen be read as the total in the file.
 */
const SummaryPreview = () => {
  const ctx = useExportBuilderCtx();
  const { columns, rows } = ctx.summary;
  const keys = ctx.groupBy;

  const name = `${ctx.flags.filePrefix || "sales"}_${ctx.startDate}_${ctx.endDate}.${
    ctx.flags.fileFormat === "csv" ? "csv" : "txt"
  }`;

  return (
    <div className="flex-1 min-w-0 bg-card_bg border border-brand_line rounded-xl flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-custom-white border-b border-brand_line flex-shrink-0">
        <TableCellsIcon className="w-4 h-4 text-content/85 flex-shrink-0" />
        <span className="font-mono text-[12.5px] font-semibold truncate">
          {name}
        </span>
        <span className="text-[11.5px] text-content/85 flex-shrink-0">
          {keys.length} key{keys.length === 1 ? "" : "s"} ·{" "}
          {ctx.aggregates.length} measure
          {ctx.aggregates.length === 1 ? "" : "s"}
        </span>
        <div className="flex-1" />
        <span className="text-[11.5px] text-content/85 flex-shrink-0">
          {ctx.selectedStoreIds.length} store
          {ctx.selectedStoreIds.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex-shrink-0">
        <span className="text-[11.5px] text-amber-900">
          These rows are this summary run over the {ctx.visibleRows.length}{" "}
          sample line{ctx.visibleRows.length === 1 ? "" : "s"} — the columns are
          the file's, the numbers are not. The file is built from every line in
          the range.
        </span>
      </div>

      {columns.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center px-6">
          <div className="max-w-[36ch]">
            <div className="text-[13px] font-semibold">Nothing to group yet</div>
            <div className="text-[12.5px] text-content/85 mt-1.5">
              Pick what the rows should be on the left, then what to measure for
              each one.
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto thin-scrollbar">
          <table className="border-collapse font-mono text-[11px] w-max">
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-30 w-[38px] bg-row_selected border-b border-brand_line_2 border-r border-brand_line px-2 py-1.5"></th>
                {columns.map((c) => {
                  const isKey = keys.includes(c);
                  return (
                    <th
                      key={c}
                      className={`sticky top-0 z-10 border-b border-brand_line_2 border-r border-brand_line px-2.5 py-1.5 text-left font-semibold whitespace-nowrap ${
                        isPii(c)
                          ? "bg-amber-50 text-amber-900"
                          : isKey
                            ? "bg-row_selected text-content"
                            : "bg-filter_active text-content"
                      }`}
                    >
                      {c}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={r}>
                  <td className="sticky left-0 z-10 bg-custom-white border-r border-brand_line border-b border-brand_line px-2 py-1.5 text-right text-content/85">
                    {r + 1}
                  </td>
                  {columns.map((c) => {
                    // PARKED: a group key can be a date, and would be
                    // written the chosen way once the endpoint can.
                    // const type = ctx.columns.find((col) => col.name === c);
                    // const raw =
                    //   type && isDateColumn(type.data_type)
                    //     ? formatDateValue(row[c], ctx.flags.dateFormat)
                    //     : row[c];
                    const raw = row[c];
                    const masked = isPii(c);
                    return (
                      <td
                        key={c}
                        className={`border-r border-b border-brand_line px-2.5 py-1.5 whitespace-nowrap ${
                          masked ? "text-amber-900" : ""
                        } ${keys.includes(c) ? "" : "text-right"}`}
                      >
                        {masked
                          ? maskValue(raw)
                          : raw === null || raw === undefined
                            ? // A group key that is null is its own row in the
                              // file — the tender lines land there — so it is
                              // named rather than left blank.
                              keys.includes(c)
                              ? "(blank)"
                              : ""
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

      {columns.length > 0 && rows.length === 0 && (
        <div className="px-4 py-3 border-t border-brand_line bg-custom-white text-[12px] text-content/85 flex-shrink-0">
          None of the sample lines survive the filters, so there is nothing to
          group here. The file can still hold plenty: the sample is two hundred
          lines taken where the scan landed.
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-2 bg-custom-white border-t border-brand_line flex-shrink-0">
        <span className="text-[11.5px] text-content/85">
          Measure names carry the operation, so a file says what it holds.
          Totals here are the table's own lines — tender rows, voids and
          transfers included — not a sales report.
        </span>
      </div>
    </div>
  );
};

export default SummaryPreview;
