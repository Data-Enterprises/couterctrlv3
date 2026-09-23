import { useState } from "react";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { useExportBuilderCtx } from "./hooks";
import { isPii } from "./piiColumns";
import {
  setColumnFilter,
  setFlag,
  setSelectedColumns,
  setSelectedStoreIds,
  toggleColumn,
  toggleSaleType,
  toggleStore,
} from "../../../features/dev/devExportBuilderSlice";

type Section = "stores" | "rows" | "columns" | "output";

/**
 * The left panel: four collapsible rows, each showing its answer while shut.
 *
 * Stores, row types and columns are the preview response and nothing else —
 * no groupings or presets of our own, because anything invented here would
 * have to be kept in step with a table the endpoint already describes. The
 * output row is the other half: the export endpoint's switches, which the
 * preview knows nothing about.
 */
const ConfigPanel = () => {
  const ctx = useExportBuilderCtx();
  const [open, setOpen] = useState<Section>("columns");

  const shown = ctx.columns.filter((c) =>
    c.name.toLowerCase().includes(ctx.columnFilter.toLowerCase()),
  );

  const Header = ({
    section,
    label,
    summary,
  }: {
    section: Section;
    label: string;
    summary: string;
  }) => (
    <button
      type="button"
      onClick={() => setOpen(open === section ? ("output" as Section) : section)}
      className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
    >
      <ChevronRightIcon
        className={`w-3.5 h-3.5 flex-shrink-0 text-content/60 transition-transform ${
          open === section ? "rotate-90" : ""
        }`}
      />
      <span className="text-[13px] font-semibold flex-1">{label}</span>
      <span className="text-[12px] text-content/60">{summary}</span>
    </button>
  );

  return (
    <div className="w-[340px] flex-shrink-0 flex flex-col gap-2 min-h-0">
      <div className="flex items-baseline justify-between px-0.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-content/60">
          Configuration
        </span>
      </div>

      {/* Stores */}
      <div className="bg-custom-white border border-brand_line rounded-xl overflow-hidden flex-shrink-0">
        <Header
          section="stores"
          label="Stores"
          summary={`${ctx.selectedStoreIds.length} of ${ctx.stores.length}`}
        />
        {open === "stores" && (
          <div className="px-3 pb-3 flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  ctx.dispatch(
                    setSelectedStoreIds(ctx.stores.map((s) => s.storeid)),
                  )
                }
                className="text-[11.5px] text-brand_navy_hover underline underline-offset-2"
              >
                all
              </button>
              <button
                type="button"
                onClick={() => ctx.dispatch(setSelectedStoreIds([]))}
                className="text-[11.5px] text-brand_navy_hover underline underline-offset-2"
              >
                none
              </button>
            </div>
            <div className="max-h-[220px] overflow-y-auto thin-scrollbar flex flex-col">
              {ctx.stores.map((s) => (
                <label
                  key={s.storeid}
                  className="flex items-center gap-2 py-1.5 text-[12.5px] border-b border-brand_line last:border-0"
                >
                  <input
                    type="checkbox"
                    checked={ctx.selectedStoreIds.includes(s.storeid)}
                    onChange={() => ctx.dispatch(toggleStore(s.storeid))}
                    className="w-3.5 h-3.5 accent-[#1e2a4a]"
                  />
                  <span className="font-medium">{s.store_number}</span>
                  <span className="truncate text-content/75">{s.store_name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rows */}
      <div className="bg-custom-white border border-brand_line rounded-xl overflow-hidden flex-shrink-0">
        <Header
          section="rows"
          label="Rows"
          summary={
            ctx.selectedSaleTypes.length === ctx.saleTypes.length
              ? `all ${ctx.saleTypes.length} types`
              : `${ctx.selectedSaleTypes.length} of ${ctx.saleTypes.length}`
          }
        />
        {open === "rows" && (
          <div className="px-3 pb-3 flex flex-col gap-1.5">
            {ctx.saleTypes.map((t) => (
              <label key={t} className="flex items-center gap-2 text-[12.5px]">
                <input
                  type="checkbox"
                  checked={ctx.selectedSaleTypes.includes(t)}
                  onChange={() => ctx.dispatch(toggleSaleType(t))}
                  className="w-3.5 h-3.5 accent-[#1e2a4a]"
                />
                {t}
              </label>
            ))}
            {ctx.saleTypes.length === 0 && (
              <span className="text-[12px] text-content/60">
                No sale types in this range.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Columns */}
      <div className="bg-card_bg border border-brand_line_2 rounded-xl overflow-hidden flex-1 flex flex-col min-h-0">
        <Header
          section="columns"
          label="Columns"
          summary={`${ctx.selectedColumns.length} of ${ctx.columns.length}`}
        />
        {open === "columns" && (
          <div className="px-3 pb-3 flex flex-col gap-2 min-h-0 flex-1">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  ctx.dispatch(
                    setSelectedColumns(ctx.columns.map((c) => c.name)),
                  )
                }
                className="text-[11.5px] text-brand_navy_hover underline underline-offset-2"
              >
                all
              </button>
              <button
                type="button"
                onClick={() => ctx.dispatch(setSelectedColumns([]))}
                className="text-[11.5px] text-brand_navy_hover underline underline-offset-2"
              >
                none
              </button>
            </div>
            <input
              type="search"
              value={ctx.columnFilter}
              onChange={(e) => ctx.dispatch(setColumnFilter(e.target.value))}
              placeholder="Find a column..."
              aria-label="Find a column"
              className="w-full border border-brand_line rounded-lg px-2.5 py-1.5 text-[12.5px]"
            />
            <div className="flex-1 overflow-y-auto thin-scrollbar flex flex-col">
              {shown.map((c) => (
                <label
                  key={c.name}
                  className={`flex items-center gap-2 py-1.5 px-1 text-[12.5px] border-b border-brand_line last:border-0 ${
                    isPii(c.name) ? "bg-amber-50" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={ctx.selectedColumns.includes(c.name)}
                    onChange={() => ctx.dispatch(toggleColumn(c.name))}
                    className="w-3.5 h-3.5 accent-[#1e2a4a]"
                  />
                  <span className="font-mono text-[11.5px] flex-1 truncate">
                    {c.name}
                  </span>
                  {isPii(c.name) && (
                    <span className="text-[9.5px] font-semibold tracking-wide text-amber-900">
                      PERSONAL
                    </span>
                  )}
                  <span className="text-[10.5px] text-content/50">
                    {c.data_type}
                  </span>
                </label>
              ))}
              {shown.length === 0 && (
                <span className="text-[12px] text-content/60 py-2">
                  No column matches that.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Output — the export endpoint's switches, not the preview's data */}
      <div className="bg-custom-white border border-brand_line rounded-xl overflow-hidden flex-shrink-0">
        <Header
          section="output"
          label="Output"
          summary={ctx.flags.fileFormat.toUpperCase()}
        />
        {open === "output" && (
          <div className="px-3 pb-3 flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <label htmlFor="eb-format" className="text-[12.5px] w-[86px]">
                Format
              </label>
              <select
                id="eb-format"
                value={ctx.flags.fileFormat}
                onChange={(e) =>
                  ctx.dispatch(
                    setFlag({ key: "fileFormat", value: e.target.value }),
                  )
                }
                className="flex-1 border border-brand_line rounded-lg px-2 py-1.5 text-[12.5px] bg-card_bg"
              >
                <option value="csv">csv</option>
                <option value="text">text</option>
                <option value="binary">binary</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="eb-prefix" className="text-[12.5px] w-[86px]">
                File name
              </label>
              <input
                id="eb-prefix"
                type="text"
                value={ctx.flags.filePrefix}
                onChange={(e) =>
                  ctx.dispatch(
                    setFlag({ key: "filePrefix", value: e.target.value }),
                  )
                }
                className="flex-1 border border-brand_line rounded-lg px-2 py-1.5 text-[12.5px]"
              />
            </div>
            <label className="flex items-center gap-2 text-[12.5px]">
              <input
                type="checkbox"
                checked={ctx.flags.excludeVoids}
                onChange={(e) =>
                  ctx.dispatch(
                    setFlag({ key: "excludeVoids", value: e.target.checked }),
                  )
                }
                className="w-3.5 h-3.5 accent-[#1e2a4a]"
              />
              Exclude voided lines
            </label>
            <label className="flex items-center gap-2 text-[12.5px]">
              <input
                type="checkbox"
                checked={ctx.flags.ordered}
                onChange={(e) =>
                  ctx.dispatch(
                    setFlag({ key: "ordered", value: e.target.checked }),
                  )
                }
                className="w-3.5 h-3.5 accent-[#1e2a4a]"
              />
              Sort the file
              <span className="text-[11px] text-content/55">slower</span>
            </label>
            <label className="flex items-center gap-2 text-[12.5px]">
              <input
                type="checkbox"
                checked={ctx.flags.dryRun}
                onChange={(e) =>
                  ctx.dispatch(
                    setFlag({ key: "dryRun", value: e.target.checked }),
                  )
                }
                className="w-3.5 h-3.5 accent-[#1e2a4a]"
              />
              Dry run
              <span className="text-[11px] text-content/55">
                returns the SQL, writes nothing
              </span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigPanel;
