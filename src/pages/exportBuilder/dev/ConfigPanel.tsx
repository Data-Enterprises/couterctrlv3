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
import { aliasFor, fnsFor, FN_LABELS } from "./aggregates";
import { parseProductCodes } from "./productCodes";
import {
  setFlag,
  setMode,
  toggleGroupBy,
  setGroupBy,
  addAggregate,
  setAggregate,
  removeAggregate,
  resetExportBuilder,
  setSelectedColumns,
  setSelectedRingTypes,
  setSelectedSaleTypes,
  setSelectedStoreIds,
  setSelectedSubDepartments,
  setSelectedVendors,
  setSelectedCashiers,
  setSelectedSaleDates,
  setProductCodes,
  toggleColumn,
  toggleRingType,
  toggleSaleType,
  toggleStore,
  toggleSubDepartment,
  toggleVendor,
  toggleCashier,
  toggleSaleDate,
} from "../../../features/dev/devExportBuilderSlice";

type Section =
  | "stores"
  | "groupBy"
  | "measures"
  | "saleDates"
  | "cashiers"
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

/**
 * The three states of a flag filter.
 *
 * "Only" is not a rarity here: the line someone is hunting for is usually the
 * voided or refunded one, and a file of nothing else is the fastest way to
 * find it. The endpoint reads null, 0 and 1 — and tests COALESCE(flag, 0)
 * rather than equality, so "only refunds" catches every marker that column
 * uses rather than the literal 1.
 */
const VOID_CHOICES: SelectFilterOption[] = [
  { value: "all", label: "All lines" },
  { value: "exclude", label: "Exclude voids" },
  { value: "only", label: "Only voids" },
];

const REFUND_CHOICES: SelectFilterOption[] = [
  { value: "all", label: "All lines" },
  { value: "exclude", label: "Exclude refunds" },
  { value: "only", label: "Only refunds" },
];

const flagToChoice = (flag: number | null) =>
  flag === null ? "all" : flag ? "only" : "exclude";

const choiceToFlag = (choice: string) =>
  choice === "all" ? null : choice === "only" ? 1 : 0;

/**
 * A day, with its weekday.
 *
 * The weekday is the point of this list — "every Saturday in the month" is
 * the question it exists to answer, and picking those out of bare dates means
 * counting on your fingers. Read in UTC, because the strings are plain days
 * and a local reading turns one of them into the evening before.
 */
const dayLabel = (day: string) => {
  const at = new Date(day + "T00:00:00Z");
  if (Number.isNaN(at.getTime())) return day;
  const weekday = at.toLocaleDateString(undefined, {
    weekday: "short",
    timeZone: "UTC",
  });
  return `${weekday} · ${day}`;
};

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
  const [cashierQueryText, setCashierQueryText] = useState("");
  const [groupQuery, setGroupQuery] = useState("");
  const [subDeptQueryText, setSubDeptQueryText] = useState("");
  const [codeText, setCodeText] = useState("");
  const [fileName, setFileName] = useState(ctx.flags.filePrefix);

  // A new config is a new scope; last question's typing does not belong to it.
  useEffect(() => {
    setColumnQuery("");
    setVendorQueryText("");
    setSubDeptQueryText("");
    setCashierQueryText("");
    setGroupQuery("");
    setCodeText("");
    // The output flags survive a reload, so this one is a resync, not a clear.
    //
    // Deliberately not keyed on the flag as well: the store gets the name a
    // beat after typing stops, and reacting to that would write the settled
    // value back over whatever had been typed in the meantime.
    setFileName(ctx.flags.filePrefix);
  }, [ctx.columns]);

  /**
   * The codes do have to reach the store — they filter the sample and go to
   * the endpoint — but not on every keystroke. Parsed a beat after typing
   * stops, so a pasted column of four hundred codes costs one pass, not four
   * hundred.
   */
  const parseTimer = useRef<number | undefined>(undefined);
  const nameTimer = useRef<number | undefined>(undefined);
  useEffect(
    () => () => {
      window.clearTimeout(parseTimer.current);
      window.clearTimeout(nameTimer.current);
    },
    [],
  );

  // The file name is read once, when the export runs, so it can settle first
  // for the same reason the codes do.
  const onFileName = (value: string) => {
    setFileName(value);
    window.clearTimeout(nameTimer.current);
    nameTimer.current = window.setTimeout(() => {
      ctx.dispatch(setFlag({ filePrefix: value }));
    }, 250);
  };
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

  const shownGroupColumns = useMemo(() => {
    const q = groupQuery.trim().toLowerCase();
    return ctx.columns.filter((c) => c.name.toLowerCase().includes(q));
  }, [ctx.columns, groupQuery]);

  const shownCashiers = useMemo(() => {
    const q = cashierQueryText.trim().toLowerCase();
    return ctx.cashiers.filter(
      (c) =>
        String(c.cashier_name ?? "")
          .toLowerCase()
          .includes(q) || String(c.cashier_number).includes(q),
    );
  }, [ctx.cashiers, cashierQueryText]);

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

  /**
   * A measure's column changed, so its function may no longer be legal.
   *
   * sum and avg exist only for numeric columns — seven columns on this table
   * look numeric and are varchar — and the endpoint rejects the pair rather
   * than failing mid-export. Moving to the nearest allowed function keeps a
   * row from sitting there invalid.
   */
  const changeMeasureColumn = (at: number, column: string) => {
    const allowed = fnsFor(column, ctx.columns);
    const current = ctx.aggregates[at]?.fn;
    ctx.dispatch(
      setAggregate({
        at,
        measure: {
          column,
          fn: current && allowed.includes(current) ? current : allowed[0],
        },
      }),
    );
  };

  const measureColumns: SelectFilterOption[] = [
    { value: "*", label: "All rows (count)" },
    ...ctx.columns.map((c) => ({ value: c.name, label: c.name })),
  ];

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
      {/*
        * What the file is, not what is in it.
        *
        * Above the sections because it decides which of them apply: a summary
        * has no column list and an export of the lines has nothing to group.
        * The endpoint refuses a request that carries both.
        */}
      <div className="px-2.5 pb-2 flex-shrink-0">
        <div className="flex rounded-lg border border-brand_line_2 overflow-hidden">
          {([
            ["lines", "Every line"],
            ["summary", "Summary"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => ctx.dispatch(setMode(value))}
              aria-pressed={ctx.mode === value}
              className={`flex-1 text-[12px] font-medium py-1.5 transition-colors ${
                ctx.mode === value
                  ? "bg-[#1e2a4a] text-custom-white"
                  : "bg-card_bg text-content/70 hover:text-content"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
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

      {ctx.saleDates.length > 1 && (
        <Row
          label="Days"
          isOpen={open === "saleDates"}
          onToggle={() => setOpen(open === "saleDates" ? null : "saleDates")}
          summary={
            ctx.selectedSaleDates.length === ctx.saleDates.length
              ? `all ${ctx.saleDates.length}`
              : `${ctx.selectedSaleDates.length} of ${ctx.saleDates.length}`
          }
        >
          <div className="px-3 pb-3 flex flex-col gap-1.5">
            <AllNone
              onAll={() => ctx.dispatch(setSelectedSaleDates(ctx.saleDates))}
              onNone={() => ctx.dispatch(setSelectedSaleDates([]))}
            />
            <span className="text-[11px] text-content/55">
              Particular days inside the range, not a second range.
            </span>
            <div className="overflow-y-auto thin-scrollbar flex flex-col max-h-[38vh]">
              {ctx.saleDates.map((d) => (
                <Checkbox
                  key={d}
                  checked={ctx.selectedSaleDates.includes(d)}
                  onChange={() => ctx.dispatch(toggleSaleDate(d))}
                  className="py-1.5 text-[12.5px] border-b border-brand_line last:border-0"
                  label={
                    <span className="font-mono text-[11.5px]">
                      {dayLabel(d)}
                    </span>
                  }
                />
              ))}
            </div>
          </div>
        </Row>
      )}

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
        label="Cashiers"
        isOpen={open === "cashiers"}
        onToggle={() => setOpen(open === "cashiers" ? null : "cashiers")}
        summary={
          ctx.selectedCashiers.length === ctx.cashiers.length
            ? `all ${ctx.cashiers.length}`
            : `${ctx.selectedCashiers.length} of ${ctx.cashiers.length}`
        }
      >
        <div className="px-3 pb-3 flex flex-col gap-1.5">
          <AllNone
            onAll={() =>
              ctx.dispatch(
                setSelectedCashiers(ctx.cashiers.map((c) => c.cashier_number)),
              )
            }
            onNone={() => ctx.dispatch(setSelectedCashiers([]))}
          />
          <ListSearch
            label="Find a cashier..."
            value={cashierQueryText}
            onChange={setCashierQueryText}
            shown={shownCashiers.length}
            total={ctx.cashiers.length}
          />
          <div className="overflow-y-auto thin-scrollbar flex flex-col max-h-[38vh]">
            {shownCashiers.map((c) => (
              <Checkbox
                key={c.cashier_number}
                checked={ctx.selectedCashiers.includes(c.cashier_number)}
                onChange={() => ctx.dispatch(toggleCashier(c.cashier_number))}
                className="py-1.5 text-[12.5px] border-b border-brand_line last:border-0"
                label={
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[11.5px] text-content/70">
                      {c.cashier_number}
                    </span>
                    <span className="truncate">{c.cashier_name || "—"}</span>
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

      {!ctx.aggregating && (
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

      )}

      {ctx.aggregating && (
      <Row
        label="Group By"
        isOpen={open === "groupBy"}
        onToggle={() => setOpen(open === "groupBy" ? null : "groupBy")}
        summary={
          ctx.groupBy.length === 0
            ? "nothing yet"
            : `${ctx.groupBy.length} key${ctx.groupBy.length === 1 ? "" : "s"}`
        }
      >
        <div className="px-3 pb-3 flex flex-col gap-1.5">
          <span className="text-[11px] text-content/55">
            One row per combination of these, in the order you tick them.
          </span>
          {ctx.groupBy.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {ctx.groupBy.map((name, i) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => ctx.dispatch(toggleGroupBy(name))}
                  title="Remove this key"
                  className="font-mono text-[10.5px] bg-filter_active border border-brand_line_2 rounded px-1.5 py-0.5"
                >
                  {i + 1}. {name} ×
                </button>
              ))}
              <button
                type="button"
                onClick={() => ctx.dispatch(setGroupBy([]))}
                className="text-[11px] text-brand_navy_hover underline underline-offset-2 px-1"
              >
                clear
              </button>
            </div>
          )}
          <ListSearch
            label="Find a column..."
            value={groupQuery}
            onChange={setGroupQuery}
            shown={shownGroupColumns.length}
            total={ctx.columns.length}
          />
          <div className="overflow-y-auto thin-scrollbar flex flex-col max-h-[38vh]">
            {shownGroupColumns.map((c) => (
              <Checkbox
                key={c.name}
                checked={ctx.groupBy.includes(c.name)}
                onChange={() => ctx.dispatch(toggleGroupBy(c.name))}
                className={`w-full py-1.5 px-1 text-[12.5px] border-b border-brand_line last:border-0 ${
                  isPii(c.name) ? "bg-amber-50" : ""
                }`}
                label={
                  <span className="flex items-center gap-2 w-full min-w-0">
                    <span className="font-mono text-[11.5px] flex-1 truncate">
                      {c.name}
                    </span>
                    <span className="text-[10.5px] text-content/50">
                      {c.data_type}
                    </span>
                  </span>
                }
              />
            ))}
          </div>
        </div>
      </Row>
      )}

      {ctx.aggregating && (
      <Row
        label="Measures"
        isOpen={open === "measures"}
        onToggle={() => setOpen(open === "measures" ? null : "measures")}
        summary={
          ctx.aggregates.length === 0
            ? "none yet"
            : `${ctx.aggregates.length} measure${
                ctx.aggregates.length === 1 ? "" : "s"
              }`
        }
      >
        <div className="px-3 pb-3 flex flex-col gap-2">
          <span className="text-[11px] text-content/55">
            What to work out for each row. The name in the file carries the
            operation, so nothing reads as something it is not.
          </span>
          {ctx.aggregates.map((m, i) => (
            <div
              key={`${m.column}-${m.fn}-${i}`}
              className="flex flex-col gap-1 border border-brand_line rounded-lg p-2 bg-custom-white"
            >
              <div className="flex items-center gap-1.5">
                <SelectFilter
                  plain
                  options={measureColumns}
                  value={m.column}
                  onChange={(value) => changeMeasureColumn(i, value)}
                  className="flex-1 min-w-0"
                />
                <SelectFilter
                  plain
                  options={fnsFor(m.column, ctx.columns).map((fn) => ({
                    value: fn,
                    label: FN_LABELS[fn],
                  }))}
                  value={m.fn}
                  onChange={(value) =>
                    ctx.dispatch(
                      setAggregate({
                        at: i,
                        measure: { column: m.column, fn: value as typeof m.fn },
                      }),
                    )
                  }
                  className="w-[130px] flex-shrink-0"
                />
                <button
                  type="button"
                  onClick={() => ctx.dispatch(removeAggregate(i))}
                  aria-label={`Remove ${aliasFor(m.column, m.fn)}`}
                  className="w-[22px] h-[22px] flex-shrink-0 rounded border border-brand_line_2 text-content/60 hover:text-content hover:border-brand_slate transition-colors"
                >
                  ×
                </button>
              </div>
              <span className="font-mono text-[10.5px] text-content/55">
                {aliasFor(m.column, m.fn)}
              </span>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              ctx.dispatch(addAggregate({ column: "*", fn: "count" }))
            }
            className="text-[11.5px] text-brand_navy_hover underline underline-offset-2 self-start"
          >
            add a measure
          </button>
          {ctx.aggregates.length === 0 && (
            <span className="text-[11.5px] text-content/60">
              A summary with no measures is just the list of groups.
            </span>
          )}
        </div>
      </Row>
      )}

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
                ctx.dispatch(setFlag({ fileFormat: value }))
              }
              className="w-full"
            />
          </label>
          <TextField
            label="File name"
            value={fileName}
            placeholder="sales"
            hint={`${fileName || "sales"}.${
              ctx.flags.fileFormat === "csv" ? "csv" : "txt"
            }`}
            onChange={onFileName}
          />
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-content">
              Voided lines
            </span>
            <SelectFilter
              plain
              options={VOID_CHOICES}
              value={flagToChoice(ctx.flags.voidFlag)}
              onChange={(value) =>
                ctx.dispatch(setFlag({ voidFlag: choiceToFlag(value) }))
              }
              className="w-full"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-content">
              Refunds
            </span>
            <SelectFilter
              plain
              options={REFUND_CHOICES}
              value={flagToChoice(ctx.flags.refundFlag)}
              onChange={(value) =>
                ctx.dispatch(setFlag({ refundFlag: choiceToFlag(value) }))
              }
              className="w-full"
            />
          </label>
          <Checkbox
            checked={ctx.flags.ordered}
            onChange={(value) => ctx.dispatch(setFlag({ ordered: value }))}
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
