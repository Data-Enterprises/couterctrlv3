import { useState, type ReactNode } from "react";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { useExportBuilderCtx } from "./hooks";
import { isPii } from "./piiColumns";
import {
  setColumnFilter,
  setFlag,
  setSelectedColumns,
  setSelectedSaleTypes,
  setSelectedStoreIds,
  toggleColumn,
  toggleSaleType,
  toggleStore,
} from "../../../features/dev/devExportBuilderSlice";

type Section = "stores" | "saleTypes" | "columns" | "output";

/**
 * One collapsible row.
 *
 * Declared here rather than inside ConfigPanel on purpose: a component
 * defined in a render body is a NEW component type on every render, so React
 * unmounts the old tree and mounts a fresh one — which took the focus out of
 * the column search box after a single keystroke.
 */
const Row = ({
  label,
  summary,
  isOpen,
  onToggle,
  children,
  grow = false,
}: {
  label: string;
  summary: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  grow?: boolean;
}) => (
  <div
    className={`bg-custom-white border border-brand_line rounded-xl overflow-hidden flex flex-col ${
      isOpen && grow ? "flex-1 min-h-0" : "flex-shrink-0"
    }`}
  >
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className="w-full flex items-center gap-2 px-3 py-2.5 text-left flex-shrink-0"
    >
      <ChevronRightIcon
        className={`w-3.5 h-3.5 flex-shrink-0 text-content/60 transition-transform duration-150 ${
          isOpen ? "rotate-90" : ""
        }`}
      />
      <span className="text-[13px] font-semibold flex-1">{label}</span>
      <span className="text-[12px] text-content/60">{summary}</span>
    </button>
    {isOpen && children}
  </div>
);

/**
 * The left panel: four rows that each open to show their own question.
 *
 * Stores, sale types and columns are the preview response and nothing else —
 * no groupings or presets of our own, because anything invented here would
 * have to be kept in step with a table the endpoint already describes. Output
 * is the other half: the export endpoint's switches, which the preview knows
 * nothing about.
 *
 * Everything starts shut. The summary on each row is the answer, so the panel
 * reads as a list of decisions already made; opening one is for changing it.
 */
const ConfigPanel = () => {
  const ctx = useExportBuilderCtx();
  const [open, setOpen] = useState<Section | null>(null);

  const shown = ctx.columnOrder
    .map((name) => ctx.columns.find((c) => c.name === name))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .filter((c) =>
      c.name.toLowerCase().includes(ctx.columnFilter.toLowerCase()),
    );

  const allStores = ctx.stores.length;
  const allTypes = ctx.saleTypes.length;

  return (
    <div className="w-[340px] flex-shrink-0 flex flex-col gap-2 min-h-0">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-content/60 px-0.5">
        Configuration
      </span>

      <Row
        label="Stores"
        isOpen={open === "stores"}
        onToggle={() => setOpen(open === "stores" ? null : "stores")}
        summary={
          ctx.selectedStoreIds.length === allStores
            ? `all ${allStores}`
            : `${ctx.selectedStoreIds.length} of ${allStores}`
        }
        grow
      >
        <div className="px-3 pb-3 flex flex-col gap-2 min-h-0">
          <div className="flex gap-3">
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
          <div className="overflow-y-auto thin-scrollbar flex flex-col max-h-[300px]">
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
      </Row>

      <Row
        label="Sale Types"
        isOpen={open === "saleTypes"}
        onToggle={() => setOpen(open === "saleTypes" ? null : "saleTypes")}
        summary={
          ctx.selectedSaleTypes.length === allTypes
            ? `all ${allTypes}`
            : `${ctx.selectedSaleTypes.length} of ${allTypes}`
        }
      >
        <div className="px-3 pb-3 flex flex-col gap-1.5">
          <div className="flex gap-3 mb-0.5">
            <button
              type="button"
              onClick={() => ctx.dispatch(setSelectedSaleTypes(ctx.saleTypes))}
              className="text-[11.5px] text-brand_navy_hover underline underline-offset-2"
            >
              all
            </button>
            <button
              type="button"
              onClick={() => ctx.dispatch(setSelectedSaleTypes([]))}
              className="text-[11.5px] text-brand_navy_hover underline underline-offset-2"
            >
              none
            </button>
          </div>
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
          {allTypes === 0 && (
            <span className="text-[12px] text-content/60">
              No sale types in this range.
            </span>
          )}
        </div>
      </Row>

      <Row
        label="Columns"
        isOpen={open === "columns"}
        onToggle={() => setOpen(open === "columns" ? null : "columns")}
        summary={
          ctx.selectedColumns.length === ctx.columns.length
            ? `all ${ctx.columns.length}`
            : `${ctx.selectedColumns.length} of ${ctx.columns.length}`
        }
        grow
      >
        <div className="px-3 pb-3 flex flex-col gap-2 min-h-0 flex-1">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() =>
                ctx.dispatch(setSelectedColumns(ctx.columns.map((c) => c.name)))
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
      </Row>

      {/* The export endpoint's switches, not the preview's data */}
      <Row
        label="Output"
        isOpen={open === "output"}
        onToggle={() => setOpen(open === "output" ? null : "output")}
        summary={ctx.flags.fileFormat.toUpperCase()}
      >
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
                ctx.dispatch(setFlag({ key: "dryRun", value: e.target.checked }))
              }
              className="w-3.5 h-3.5 accent-[#1e2a4a]"
            />
            Dry run
            <span className="text-[11px] text-content/55">
              returns the SQL, writes nothing
            </span>
          </label>
        </div>
      </Row>
    </div>
  );
};

export default ConfigPanel;
