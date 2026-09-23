import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import Checkbox from "../../../components-dev/Checkbox";
import TextField from "../../../components-dev/inputs/TextField";
import SelectFilter, {
  type SelectFilterOption,
} from "../../../components-dev/filters/SelectFilter";
import { useExportBuilderCtx } from "./hooks";
import { isPii } from "./piiColumns";
import { parseProductCodes } from "./productCodes";
import {
  setFlag,
  resetExportBuilder,
  setSelectedColumns,
  setSelectedRingTypes,
  setSelectedSaleTypes,
  setSelectedStoreIds,
  setSelectedSubDepartments,
  setSelectedVendors,
  setProductCodes,
  toggleColumn,
  toggleRingType,
  toggleSaleType,
  toggleStore,
  toggleSubDepartment,
  toggleVendor,
} from "../../../features/dev/devExportBuilderSlice";

type Section =
  | "stores"
  | "productCodes"
  | "saleTypes"
  | "ringTypes"
  | "subDepartments"
  | "vendors"
  | "columns"
  | "output";

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
    const name = String(store_name ?? "");
    const id = String(store_number ?? "");
    // Compare the numbers, not the text: "1" is in "IGA 100" by accident.
    const leading = name.match(/^\s*0*(\d+)/)?.[1];
    const number = id.replace(/^0+/, "") || id;
    return leading === number ? name : `${id} - ${name}`;
  })();

/** What the export endpoint accepts for `fileFormat`. */
const FILE_FORMATS: SelectFilterOption[] = [
  { value: "csv", label: "CSV" },
  { value: "text", label: "Text" },
  { value: "binary", label: "Binary" },
];

/** all / none, for the lists that have too many rows to tick by hand. */
const AllNone = ({
  onAll,
  onNone,
}: {
  onAll: () => void;
  onNone: () => void;
}) => (
  <div className="flex gap-3">
    <button
      type="button"
      onClick={onAll}
      className="text-[11.5px] text-brand_navy_hover underline underline-offset-2"
    >
      all
    </button>
    <button
      type="button"
      onClick={onNone}
      className="text-[11.5px] text-brand_navy_hover underline underline-offset-2"
    >
      none
    </button>
  </div>
);

/**
 * The narrowing box that sits above a long list.
 *
 * At module scope, like Row: a component declared inside a render body is a
 * new component type every render, React unmounts the old tree, and the input
 * being typed into loses the focus after a single character. That is exactly
 * what happened to the column search.
 */
const ListSearch = ({
  value,
  onChange,
  label,
  shown,
  total,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  shown: number;
  total: number;
}) => (
  <div className="flex flex-col gap-1">
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={label}
      aria-label={label}
      className="w-full border border-brand_line rounded-lg px-2.5 py-1.5 text-[12.5px]"
    />
    {value.trim().length > 0 && (
      <span className="text-[11px] text-content/55">
        {shown} of {total} shown · ticking is unaffected by the search
      </span>
    )}
  </div>
);

const ConfigPanel = () => {
  const ctx = useExportBuilderCtx();
  const [open, setOpen] = useState<Section | null>(null);

  /**
   * Typing lives here, not in the store.
   *
   * A keystroke dispatched to Redux changes the slice object, and everything
   * reading it re-renders — including the CSV table, which is fifty rows of up
   * to ninety-nine columns. Five thousand cells diffed per character is what
   * made these boxes feel heavy. None of this text is needed outside the
   * panel, so none of it goes through the store.
   */
  const [columnQuery, setColumnQuery] = useState("");
  const [vendorQueryText, setVendorQueryText] = useState("");
  const [subDeptQueryText, setSubDeptQueryText] = useState("");
  const [codeText, setCodeText] = useState("");

  // A new config is a new scope; last question's typing does not belong to it.
  useEffect(() => {
    setColumnQuery("");
    setVendorQueryText("");
    setSubDeptQueryText("");
    setCodeText("");
  }, [ctx.columns]);

  /**
   * The codes do have to reach the store — they filter the sample and go to
   * the endpoint — but not on every keystroke. Parsed a beat after typing
   * stops, so a pasted column of four hundred codes costs one pass, not four
   * hundred.
   */
  const parseTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(parseTimer.current), []);
  const onCodeText = (value: string) => {
    setCodeText(value);
    window.clearTimeout(parseTimer.current);
    parseTimer.current = window.setTimeout(() => {
      ctx.dispatch(setProductCodes(parseProductCodes(value)));
    }, 250);
  };

  const shown = useMemo(() => {
    const q = columnQuery.trim().toLowerCase();
    return ctx.columnOrder
      .map((name) => ctx.columns.find((c) => c.name === name))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .filter((c) => c.name.toLowerCase().includes(q));
  }, [ctx.columnOrder, ctx.columns, columnQuery]);

  // Both match on what is on screen: a sub department by its number or its
  // description, a vendor by name or id, since people have only one of the two.
  const shownSubDepartments = useMemo(() => {
    const q = subDeptQueryText.trim().toLowerCase();
    return ctx.subDepartments.filter(
      (s) =>
        String(s.sub_department).toLowerCase().includes(q) ||
        String(s.sub_department_description ?? "")
          .toLowerCase()
          .includes(q),
    );
  }, [ctx.subDepartments, subDeptQueryText]);

  const shownVendors = useMemo(() => {
    const q = vendorQueryText.trim().toLowerCase();
    return ctx.vendors.filter(
      (v) =>
        String(v.vendor_name ?? "")
          .toLowerCase()
          .includes(q) || String(v.vendor_id).toLowerCase().includes(q),
    );
  }, [ctx.vendors, vendorQueryText]);

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
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 flex-shrink-0">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-content/60 flex-1">
          Configuration
        </span>
        <button
          type="button"
          onClick={() => ctx.dispatch(resetExportBuilder())}
          title="New search — clears this configuration"
          aria-label="New search, clears this configuration"
          className="w-[22px] h-[22px] rounded border border-brand_line_2 text-content/70 hover:text-content hover:border-brand_slate flex items-center justify-center transition-colors"
        >
          <MagnifyingGlassIcon className="w-3.5 h-3.5" />
        </button>
      </div>
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
          <AllNone
            onAll={() =>
              ctx.dispatch(setSelectedStoreIds(ctx.stores.map((s) => s.storeid)))
            }
            onNone={() => ctx.dispatch(setSelectedStoreIds([]))}
          />
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
          <AllNone
            onAll={() => ctx.dispatch(setSelectedSaleTypes(ctx.saleTypes))}
            onNone={() => ctx.dispatch(setSelectedSaleTypes([]))}
          />
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
        label="Ring Types"
        isOpen={open === "ringTypes"}
        onToggle={() => setOpen(open === "ringTypes" ? null : "ringTypes")}
        summary={
          ctx.selectedRingTypes.length === ctx.itemRingTypes.length
            ? `all ${ctx.itemRingTypes.length}`
            : `${ctx.selectedRingTypes.length} of ${ctx.itemRingTypes.length}`
        }
      >
        <div className="px-3 pb-3 flex flex-col gap-1.5">
          <AllNone
            onAll={() =>
              ctx.dispatch(setSelectedRingTypes(ctx.itemRingTypes))
            }
            onNone={() => ctx.dispatch(setSelectedRingTypes([]))}
          />
          {ctx.itemRingTypes.map((r) => (
            <Checkbox
              key={r}
              checked={ctx.selectedRingTypes.includes(r)}
              onChange={() => ctx.dispatch(toggleRingType(r))}
              label={r}
              className="text-[12.5px]"
            />
          ))}
        </div>
      </Row>

      <Row
        label="Sub Departments"
        isOpen={open === "subDepartments"}
        onToggle={() =>
          setOpen(open === "subDepartments" ? null : "subDepartments")
        }
        summary={
          ctx.selectedSubDepartments.length === ctx.subDepartments.length
            ? `all ${ctx.subDepartments.length}`
            : `${ctx.selectedSubDepartments.length} of ${ctx.subDepartments.length}`
        }
      >
        <div className="px-3 pb-3 flex flex-col gap-1.5">
          <AllNone
            onAll={() =>
              ctx.dispatch(
                setSelectedSubDepartments(
                  ctx.subDepartments.map((s) => String(s.sub_department)),
                ),
              )
            }
            onNone={() => ctx.dispatch(setSelectedSubDepartments([]))}
          />
          <ListSearch
            label="Find a sub department..."
            value={subDeptQueryText}
            onChange={setSubDeptQueryText}
            shown={shownSubDepartments.length}
            total={ctx.subDepartments.length}
          />
          <div className="overflow-y-auto thin-scrollbar flex flex-col max-h-[38vh]">
            {shownSubDepartments.map((s) => (
              <Checkbox
                key={String(s.sub_department)}
                checked={ctx.selectedSubDepartments.includes(
                  String(s.sub_department),
                )}
                onChange={() =>
                  ctx.dispatch(toggleSubDepartment(String(s.sub_department)))
                }
                className="py-1.5 text-[12.5px] border-b border-brand_line last:border-0"
                label={
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="font-medium">{s.sub_department}</span>
                    <span className="truncate text-content/75">
                      {s.sub_department_description}
                    </span>
                  </span>
                }
              />
            ))}
          </div>
        </div>
      </Row>

      <Row
        label="Vendors"
        isOpen={open === "vendors"}
        onToggle={() => setOpen(open === "vendors" ? null : "vendors")}
        summary={
          ctx.selectedVendors.length === ctx.vendors.length
            ? `all ${ctx.vendors.length}`
            : `${ctx.selectedVendors.length} of ${ctx.vendors.length}`
        }
      >
        <div className="px-3 pb-3 flex flex-col gap-1.5">
          <AllNone
            onAll={() =>
              ctx.dispatch(
                setSelectedVendors(ctx.vendors.map((v) => v.vendor_id)),
              )
            }
            onNone={() => ctx.dispatch(setSelectedVendors([]))}
          />
          <ListSearch
            label="Find a vendor..."
            value={vendorQueryText}
            onChange={setVendorQueryText}
            shown={shownVendors.length}
            total={ctx.vendors.length}
          />
          <div className="overflow-y-auto thin-scrollbar flex flex-col max-h-[38vh]">
            {shownVendors.map((v) => (
              <Checkbox
                key={v.vendor_id}
                checked={ctx.selectedVendors.includes(v.vendor_id)}
                onChange={() => ctx.dispatch(toggleVendor(v.vendor_id))}
                className="py-1.5 text-[12.5px] border-b border-brand_line last:border-0"
                label={
                  <span className="truncate">
                    {v.vendor_name || v.vendor_id}
                  </span>
                }
              />
            ))}
          </div>
        </div>
      </Row>

      <Row
        label="Product Codes"
        isOpen={open === "productCodes"}
        onToggle={() =>
          setOpen(open === "productCodes" ? null : "productCodes")
        }
        summary={
          ctx.productCodes.length === 0
            ? "all"
            : `${ctx.productCodes.length} code${ctx.productCodes.length === 1 ? "" : "s"}`
        }
      >
        <div className="px-3 pb-3 flex flex-col gap-2">
          <textarea
            value={codeText}
            onChange={(e) => onCodeText(e.target.value)}
            rows={3}
            placeholder="Paste or type codes — commas, spaces or new lines"
            aria-label="Product codes"
            className="w-full border border-brand_line rounded-lg px-2.5 py-1.5 text-[12px] font-mono resize-y"
          />
          <div className="flex items-center gap-3">
            <span className="text-[11.5px] text-content/60 flex-1">
              {ctx.productCodes.length === 0
                ? "Empty means every product."
                : `${ctx.productCodes.length} code${
                    ctx.productCodes.length === 1 ? "" : "s"
                  } — anything that is not a number is ignored.`}
            </span>
            {ctx.productCodes.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCodeText("");
                  window.clearTimeout(parseTimer.current);
                  ctx.dispatch(setProductCodes([]));
                }}
                className="text-[11.5px] text-brand_navy_hover underline underline-offset-2"
              >
                clear
              </button>
            )}
          </div>
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
          <AllNone
            onAll={() =>
              ctx.dispatch(setSelectedColumns(ctx.columns.map((c) => c.name)))
            }
            onNone={() => ctx.dispatch(setSelectedColumns([]))}
          />
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
          <ListSearch
            label="Find a column..."
            value={columnQuery}
            onChange={setColumnQuery}
            shown={shown.length}
            total={ctx.columns.length}
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
        </div>
      </Row>
      </div>
    </div>
  );
};

export default ConfigPanel;
