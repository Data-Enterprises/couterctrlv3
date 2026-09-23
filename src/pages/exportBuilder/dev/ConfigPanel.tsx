import { useState, type ReactNode } from "react";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import Checkbox from "../../../components-dev/Checkbox";
import TextField from "../../../components-dev/inputs/TextField";
import SelectFilter, {
  type SelectFilterOption,
} from "../../../components-dev/filters/SelectFilter";
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
}: {
  label: string;
  summary: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) => (
  <div className="bg-card_bg border border-brand_line rounded-lg overflow-hidden flex flex-col flex-shrink-0">
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
/**
 * What to call a store in the list.
 *
 * `store_name` usually arrives with the number already in it ("001 - IGA
 * GLASGOW KY"), so printing `store_number` beside it reads as two stores. The
 * number is only prefixed when the name does not already carry it.
 */
const storeLabel = ({
  store_number,
  store_name,
}: {
  store_number: string;
  store_name: string;
}) =>
  (() => {
    // Compare the numbers, not the text: "1" is in "IGA 100" by accident.
    const leading = store_name.match(/^\s*0*(\d+)/)?.[1];
    const number = store_number.replace(/^0+/, "") || store_number;
    return leading === number ? store_name : `${store_number} - ${store_name}`;
  })();

/** What the export endpoint accepts for `fileFormat`. */
const FILE_FORMATS: SelectFilterOption[] = [
  { value: "csv", label: "CSV" },
  { value: "text", label: "Text" },
  { value: "binary", label: "Binary" },
];

const ConfigPanel = () => {
  const ctx = useExportBuilderCtx();
  const [open, setOpen] = useState<Section | null>(null);

  const shown = ctx.columnOrder
    .map((name) => ctx.columns.find((c) => c.name === name))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .filter((c) =>
      c.name.toLowerCase().includes(ctx.columnFilter.toLowerCase()),
    );

  /**
   * The personal columns, on or off together.
   *
   * Eight of the 102 are customer identity, and the decision about them is one
   * decision — hunting them out of a 102-row list one at a time is how half of
   * them end up in the file by accident.
   */
  const piiNames = ctx.columns.map((c) => c.name).filter(isPii);
  const piiOn = piiNames.some((n) => ctx.selectedColumns.includes(n));
  const togglePii = (on: boolean) =>
    ctx.dispatch(
      setSelectedColumns(
        on
          ? [...new Set([...ctx.selectedColumns, ...piiNames])]
          : ctx.selectedColumns.filter((n) => !isPii(n)),
      ),
    );

  const allStores = ctx.stores.length;
  const allTypes = ctx.saleTypes.length;

  return (
    <div className="w-[340px] flex-shrink-0 flex flex-col min-h-0 bg-custom-white border border-brand_line rounded-xl overflow-hidden">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-content/60 px-3 pt-3 pb-2 flex-shrink-0">
        Configuration
      </span>
      <div className="flex flex-col gap-2 px-2.5 pb-2.5 min-h-0 overflow-y-auto thin-scrollbar">

      <Row
        label="Stores"
        isOpen={open === "stores"}
        onToggle={() => setOpen(open === "stores" ? null : "stores")}
        summary={
          ctx.selectedStoreIds.length === allStores
            ? `all ${allStores}`
            : `${ctx.selectedStoreIds.length} of ${allStores}`
        }
      >
        <div className="px-3 pb-3 flex flex-col gap-2">
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
          <div className="overflow-y-auto thin-scrollbar flex flex-col max-h-[38vh]">
            {ctx.stores.map((s) => (
              <Checkbox
                key={s.storeid}
                checked={ctx.selectedStoreIds.includes(s.storeid)}
                onChange={() => ctx.dispatch(toggleStore(s.storeid))}
                label={<span className="truncate">{storeLabel(s)}</span>}
                className="py-1.5 text-[12.5px] border-b border-brand_line last:border-0"
              />
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
            <Checkbox
              key={t}
              checked={ctx.selectedSaleTypes.includes(t)}
              onChange={() => ctx.dispatch(toggleSaleType(t))}
              label={t}
              className="text-[12.5px]"
            />
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
      >
        <div className="px-3 pb-3 flex flex-col gap-2">
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
          {piiNames.length > 0 && (
            <div
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 border ${
                piiOn
                  ? "bg-amber-50 border-amber-200"
                  : "bg-custom-white border-brand_line"
              }`}
            >
              <Checkbox
                checked={piiOn}
                onChange={togglePii}
                className="text-[12px] flex-1"
                label={
                  <span className="flex items-center gap-1.5">
                    Personal columns
                    <span className="text-[11px] text-content/55">
                      {piiNames.filter((n) =>
                        ctx.selectedColumns.includes(n),
                      ).length}{" "}
                      of {piiNames.length}
                    </span>
                  </span>
                }
              />
              {piiOn && (
                <span className="text-[9.5px] font-semibold tracking-wide text-amber-900">
                  IN THE FILE
                </span>
              )}
            </div>
          )}
          <input
            type="search"
            value={ctx.columnFilter}
            onChange={(e) => ctx.dispatch(setColumnFilter(e.target.value))}
            placeholder="Find a column..."
            aria-label="Find a column"
            className="w-full border border-brand_line rounded-lg px-2.5 py-1.5 text-[12.5px]"
          />
          <div className="overflow-y-auto thin-scrollbar flex flex-col max-h-[38vh]">
            {shown.map((c) => (
              <Checkbox
                key={c.name}
                checked={ctx.selectedColumns.includes(c.name)}
                onChange={() => ctx.dispatch(toggleColumn(c.name))}
                className={`w-full py-1.5 px-1 text-[12.5px] border-b border-brand_line last:border-0 ${
                  isPii(c.name) ? "bg-amber-50" : ""
                }`}
                label={
                  <span className="flex items-center gap-2 w-full min-w-0">
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
                  </span>
                }
              />
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
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-content">Format</span>
            <SelectFilter
              plain
              options={FILE_FORMATS}
              value={ctx.flags.fileFormat}
              onChange={(value) =>
                ctx.dispatch(setFlag({ key: "fileFormat", value }))
              }
              className="w-full"
            />
          </label>
          <TextField
            label="File name"
            value={ctx.flags.filePrefix}
            placeholder="sales"
            hint={`${ctx.flags.filePrefix || "sales"}.${
              ctx.flags.fileFormat === "csv" ? "csv" : "txt"
            }`}
            onChange={(value) =>
              ctx.dispatch(setFlag({ key: "filePrefix", value }))
            }
          />
          <Checkbox
            checked={ctx.flags.excludeVoids}
            onChange={(value) =>
              ctx.dispatch(setFlag({ key: "excludeVoids", value }))
            }
            label="Exclude voided lines"
            className="text-[12.5px]"
          />
          <Checkbox
            checked={ctx.flags.ordered}
            onChange={(value) => ctx.dispatch(setFlag({ key: "ordered", value }))}
            className="text-[12.5px]"
            label={
              <span className="flex items-center gap-2">
                Sort the file
                <span className="text-[11px] text-content/55">slower</span>
              </span>
            }
          />
          <Checkbox
            checked={ctx.flags.dryRun}
            onChange={(value) => ctx.dispatch(setFlag({ key: "dryRun", value }))}
            className="text-[12.5px]"
            label={
              <span className="flex items-center gap-2">
                Dry run
                <span className="text-[11px] text-content/55">
                  returns the SQL, writes nothing
                </span>
              </span>
            }
          />
        </div>
      </Row>
      </div>
    </div>
  );
};

export default ConfigPanel;
