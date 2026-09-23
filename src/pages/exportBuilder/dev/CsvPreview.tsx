import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { useExportBuilderCtx } from "./hooks";
import { isPii, maskValue } from "./piiColumns";

/**
 * The right panel: the file, not a report.
 *
 * Same columns in the same order the export writes them, so ticking one on the
 * left adds a column here and to the CSV at once. The rows are the ten the
 * preview returned — unordered, because the endpoint takes them without an
 * ORDER BY, which is a fair sample of a short window and costs nothing.
 *
 * Personal columns show a mask rather than the value. The file carries the
 * real thing; this is a screen someone else can be standing behind.
 */
const CsvPreview = () => {
  const ctx = useExportBuilderCtx();
  const cols = ctx.columns.filter((c) => ctx.selectedColumns.includes(c.name));
  const name = `${ctx.flags.filePrefix || "sales"}_${ctx.startDate}_${ctx.endDate}.${
    ctx.flags.fileFormat === "csv" ? "csv" : "txt"
  }`;

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
          {ctx.rows.length} sample rows
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
        <div className="flex-1 overflow-auto thin-scrollbar">
          <table className="border-collapse font-mono text-[11px]">
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-20 w-[38px] bg-row_selected border-b border-brand_line_2 border-r border-brand_line px-2 py-1.5 text-right text-content/50 font-medium"></th>
                {cols.map((c) => (
                  <th
                    key={c.name}
                    className={`sticky top-0 z-10 border-b border-brand_line_2 border-r border-brand_line px-2.5 py-1.5 text-left font-semibold whitespace-nowrap ${
                      isPii(c.name)
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
              {ctx.rows.map((row, i) => (
                <tr key={i}>
                  <td className="sticky left-0 z-10 bg-custom-white border-r border-brand_line border-b border-brand_line px-2 py-1.5 text-right text-content/50">
                    {i + 1}
                  </td>
                  {cols.map((c) => {
                    const raw = row[c.name];
                    const masked = isPii(c.name);
                    return (
                      <td
                        key={c.name}
                        className={`border-r border-b border-brand_line px-2.5 py-1.5 whitespace-nowrap ${
                          masked ? "text-amber-900" : ""
                        }`}
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

      <div className="flex items-center gap-3 px-4 py-2 bg-custom-white border-t border-brand_line flex-shrink-0">
        <span className="text-[11.5px] text-content/60">
          Columns appear in the order they will be written. Personal values are
          hidden here and written to the file.
        </span>
      </div>
    </div>
  );
};

export default CsvPreview;
