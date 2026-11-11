import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowPathIcon,
  ChevronRightIcon,
} from "@heroicons/react/20/solid";
import InfoButton from "../../../components-dev/InfoButton";
import HelpPanel from "../../../components-dev/help/HelpPanel";
import { HELP_CONTENT } from "../../../components-dev/help/content";
import Checkbox from "../../../components-dev/Checkbox";
import TextField from "../../../components-dev/inputs/TextField";
import SelectFilter from "../../../components-dev/filters/SelectFilter";
import type { SelectFilterOption } from "../../../components-dev/filters/interfaces";
import { useExportBuilderCtx } from "./hooks";
import { isPii } from "./piiColumns";
import { aliasFor, fnsFor, FN_LABELS } from "./aggregates";
import { sketchExpr } from "./query/sketchExpr";

import { parseProductCodes, parseDescriptionTerms } from "./productCodes";
import type { FlagFilter, ListFilter } from "./sources";
import {
  setFlag,
  clearSelections,
  toggleGroupBy,
  setGroupBy,
  addAggregate,
  setAggregate,
  setAggregateAlias,
  setComputedAlias,
  removeAggregate,
  removeComputed,
  setOrderBy,
  toggleSortKey,
  setSelectedColumns,
  setSelectedStoreIds,
  setSelectedDays,
  setPicks,
  setProductCodes,
  setProductDescriptions,
  setRowFlag,
  toggleColumn,
  toggleDay,
  togglePick,
  toggleStore,
  type ExportListItem,
} from "../../../features/dev/devExportBuilderSlice";

/** Which row is open: one of the fixed rows, or a list by its filter name. */
type Section = string;

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
  warn = false,
}: {
  label: string;
  summary: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  /** This section is the one standing between here and a file. */
  warn?: boolean;
}) => (
  <div
    className={`rounded-lg overflow-hidden flex flex-col flex-shrink-0 border ${
      warn ? "bg-severity_watch_bg border-severity_watch_text/20" : "bg-card_bg border-brand_line"
    }`}
  >
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className="w-full flex items-center gap-2 px-3 py-2.5 text-left flex-shrink-0"
    >
      <ChevronRightIcon
        className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-150 ${
          warn ? "text-severity_watch_text" : "text-content/95"
        } ${isOpen ? "rotate-90" : ""}`}
      />
      <span
        className={`text-[13px] font-semibold flex-1 ${
          warn ? "text-severity_watch_text" : ""
        }`}
      >
        {label}
      </span>
      <span
        className={`text-[12px] ${
          warn ? "text-severity_watch_text font-semibold" : "text-content/95"
        }`}
      >
        {summary}
      </span>
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
const flagChoices = (flag: FlagFilter): SelectFilterOption[] => [
  { value: "all", label: "All lines" },
  { value: "exclude", label: `Exclude ${flag.plural}` },
  { value: "only", label: `Only ${flag.plural}` },
];

/**
 * How one choice in a list reads, by the list's look.
 *
 * At module scope for the same reason as Row: it builds JSX for a list that
 * re-renders on every tick.
 */
const choiceLabel = (list: ListFilter, item: ExportListItem): ReactNode => {
  switch (list.look) {
    case "idName":
      return (
        <span className="flex items-center gap-2 min-w-0">
          <span className="font-medium">{item.value}</span>
          <span className="truncate text-content/95">{item.label}</span>
        </span>
      );
    case "name":
      return <span className="truncate">{item.label || item.value}</span>;
    case "codeName":
      return (
        <span className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[11.5px] text-content/95">{item.value}</span>
          <span className="truncate">{item.label || "—"}</span>
        </span>
      );
    default:
      return list.blankHint && item.value === "" ? (
        <span className="flex items-center gap-1.5">
          {item.label}
          <span className="text-[11px] text-content/95">{list.blankHint}</span>
        </span>
      ) : (
        item.label
      );
  }
};

/**
 * What the endpoint will take as a file name.
 *
 * It names the build's folder in S3, one segment along from the one that
 * makes a listing yours, so dots are refused outright rather than
 * special-cased — `sales.csv` is a 400 there and is caught here first.
 */
const PREFIX_OK = /^[A-Za-z0-9_-]{1,60}$/;

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
      <span className="text-[11px] text-content/95">
        {shown} of {total} shown · ticking is unaffected by the search
      </span>
    )}
  </div>
);

interface ConfigPanelProps {
  /** Change on the Data line: the search card, over the page. */
  onChangeSearch: () => void;
}

const ConfigPanel = ({ onChangeSearch }: ConfigPanelProps) => {
  const ctx = useExportBuilderCtx();
  const [open, setOpen] = useState<Section | null>(null);
  const [help, setHelp] = useState(false);

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
  /** What is typed in each long list's search box, by filter name. */
  const [listQuery, setListQuery] = useState<Record<string, string>>({});
  const [groupQuery, setGroupQuery] = useState("");
  const [codeText, setCodeText] = useState("");
  const [descriptionText, setDescriptionText] = useState("");
  const [fileName, setFileName] = useState(ctx.flags.filePrefix);

  // A new config is a new scope; last question's typing does not belong to it.
  useEffect(() => {
    setColumnQuery("");
    setListQuery({});
    setGroupQuery("");
    setCodeText("");
    setDescriptionText("");
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
  const termTimer = useRef<number | undefined>(undefined);
  const nameTimer = useRef<number | undefined>(undefined);
  useEffect(
    () => () => {
      window.clearTimeout(parseTimer.current);
      window.clearTimeout(termTimer.current);
      window.clearTimeout(nameTimer.current);
    },
    [],
  );

  const onDescriptionText = (value: string) => {
    setDescriptionText(value);
    window.clearTimeout(termTimer.current);
    termTimer.current = window.setTimeout(() => {
      termTimer.current = undefined;
      ctx.dispatch(setProductDescriptions(parseDescriptionTerms(value)));
    }, 250);
  };

  // The file name is read once, when the export runs, so it can settle first
  // for the same reason the codes do.
  const onFileName = (value: string) => {
    setFileName(value);
    window.clearTimeout(nameTimer.current);
    nameTimer.current = window.setTimeout(() => {
      nameTimer.current = undefined;
      ctx.dispatch(setFlag({ filePrefix: value }));
    }, 250);
  };
  const onCodeText = (value: string) => {
    setCodeText(value);
    window.clearTimeout(parseTimer.current);
    parseTimer.current = window.setTimeout(() => {
      parseTimer.current = undefined;
      ctx.dispatch(setProductCodes(parseProductCodes(value)));
    }, 250);
  };

  /**
   * The three boxes follow the store when something else writes to it.
   *
   * Loading a saved configuration, reloading a build or applying the query
   * all set the codes, the description terms and the file name in the store,
   * and the boxes kept showing what had been typed before -- so the filter in
   * force and the text on screen disagreed. Each box is rewritten from the
   * store only when the two no longer mean the same thing, so someone's own
   * spacing survives, and never while their typing is still waiting to
   * settle: the store is a beat behind the box then, by design.
   */
  const codesKey = ctx.productCodes.join("\n");
  useEffect(() => {
    if (parseTimer.current !== undefined) return;
    if (parseProductCodes(codeText).join("\n") === codesKey) return;
    setCodeText(codesKey);
  }, [codesKey]);

  const termsKey = ctx.productDescriptions.join("\n");
  useEffect(() => {
    if (termTimer.current !== undefined) return;
    if (parseDescriptionTerms(descriptionText).join("\n") === termsKey) return;
    setDescriptionText(termsKey);
  }, [termsKey]);

  useEffect(() => {
    if (nameTimer.current !== undefined) return;
    if (fileName !== ctx.flags.filePrefix) setFileName(ctx.flags.filePrefix);
  }, [ctx.flags.filePrefix]);

  const shown = useMemo(() => {
    const q = columnQuery.trim().toLowerCase();
    return ctx.columnOrder
      .map((name) => ctx.columns.find((c) => c.name === name))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .filter((c) => c.name.toLowerCase().includes(q));
  }, [ctx.columnOrder, ctx.columns, columnQuery]);

  const shownGroupColumns = useMemo(() => {
    const q = groupQuery.trim().toLowerCase();
    return ctx.columns.filter((c) => c.name.toLowerCase().includes(q));
  }, [ctx.columns, groupQuery]);

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

  /**
   * Measures, and nothing to group them by.
   *
   * The one configuration someone reaches by accident: adding a measure makes
   * the file a summary, and a summary with no keys has no rows to put the
   * numbers in. The endpoint refuses it, so the page points at the fix rather
   * than greying a button and waiting.
   */
  const needsKey = ctx.measureItems.length > 0 && ctx.groupBy.length === 0;

  const allStores = ctx.stores.length;

  return (
    // Width belongs to the shell now, which animates it. This keeps its own
    // so the contents hold their layout while the sleeve closes over them —
    // text reflowing through a width transition is what makes one look
    // broken rather than smooth.
    <div className="w-[340px] h-full cc-panel min-h-0 border border-brand_line">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 flex-shrink-0">
        <span className="text-[11px] cc-caps flex-1">
          Configuration
        </span>
        <InfoButton
          variant="light"
          onClick={() => setHelp(true)}
          title="How this page works"
        />
        <button
          type="button"
          onClick={() => {
            ctx.dispatch(clearSelections());
            setOpen(null);
          }}
          title="Clear every pick — the loaded range stays"
          aria-label="Clear every pick, keeping the loaded range"
          className="w-[22px] h-[22px] rounded border border-brand_line_2 text-content/95 hover:text-content hover:border-brand_slate flex items-center justify-center transition-colors"
        >
          <ArrowPathIcon className="w-3.5 h-3.5" />
        </button>
      </div>
      {/*
        * Which table this is, and the way to another search. Change opens
        * the search card over the page with this table, store and dates on
        * it: another table keeps this one as it is, and coming back to it is
        * not a second fetch. Not while a build is running, whose answer
        * belongs to this source.
        */}
      <div className="px-2.5 pb-1.5 flex-shrink-0" data-help="source">
        <div className="flex items-baseline gap-2 rounded-lg border border-brand_line_2 bg-card_bg px-2.5 py-1.5">
          <span className="text-[11px] cc-caps">
            Data
          </span>
          <span className="text-[12px] font-semibold flex-1">{ctx.source.label}</span>
          <button
            type="button"
            onClick={onChangeSearch}
            disabled={ctx.building}
            title={
              ctx.building
                ? "Wait for the build to finish"
                : "Search another table, store or dates"
            }
            className="text-[11.5px] font-medium text-brand_navy_hover underline underline-offset-2 disabled:opacity-50 disabled:no-underline"
          >
            Change
          </button>
        </div>
      </div>
      {/*
        * What the file is, read off the configuration rather than switched.
        *
        * Group keys or measures mean a summary; their absence means the
        * lines. A switch for it meant flipping back and forth to reach the
        * section you wanted, and asking for a rollup is already asking for
        * a rollup.
        */}
      <div className="px-2.5 pb-2 flex-shrink-0">
        <div className="flex items-baseline gap-2 rounded-lg border border-brand_line_2 bg-card_bg px-2.5 py-1.5">
          <span className="text-[11px] cc-caps">
            File
          </span>
          <span className="text-[12px] font-semibold flex-1">
            {ctx.aggregating ? "Summary" : "Every line"}
          </span>
          <span className="text-[11px] text-content/95">
            {ctx.aggregating
              ? `${ctx.groupBy.length} key${ctx.groupBy.length === 1 ? "" : "s"} · ${ctx.measureItems.length} measure${ctx.measureItems.length === 1 ? "" : "s"}`
              : `${ctx.selectedColumns.length} of ${ctx.columns.length} columns`}
          </span>
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

      {ctx.days.length > 1 && (
        <Row
          label="Days"
          isOpen={open === "days"}
          onToggle={() => setOpen(open === "days" ? null : "days")}
          summary={
            ctx.selectedDays.length === ctx.days.length
              ? `all ${ctx.days.length}`
              : `${ctx.selectedDays.length} of ${ctx.days.length}`
          }
        >
          <div className="px-3 pb-3 flex flex-col gap-1.5">
            <AllNone
              onAll={() => ctx.dispatch(setSelectedDays(ctx.days))}
              onNone={() => ctx.dispatch(setSelectedDays([]))}
            />
            <span className="text-[11px] text-content/95">
              Particular days inside the range, not a second range.
            </span>
            <div className="overflow-y-auto thin-scrollbar flex flex-col max-h-[38vh]">
              {ctx.days.map((d) => (
                <Checkbox
                  key={d}
                  checked={ctx.selectedDays.includes(d)}
                  onChange={() => ctx.dispatch(toggleDay(d))}
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

      {/*
        * The source's lists, in its order. Each reads the same way: all or
        * none, a line of explanation where the source has one, a search box
        * for a long list, and the choices as the list's look draws them.
        */}
      {ctx.source.lists.map((list) => {
        const items = ctx.lists[list.filter] ?? [];
        const picked = ctx.picks[list.filter] ?? [];
        // A long list matches on what is on screen, the id or the name,
        // since people have only one of the two.
        const query = (listQuery[list.filter] ?? "").trim().toLowerCase();
        const shownItems = list.search
          ? items.filter(
              (i) =>
                i.value.toLowerCase().includes(query) ||
                i.label.toLowerCase().includes(query),
            )
          : items;
        const choice = (item: ExportListItem) => (
          <Checkbox
            key={item.value}
            checked={picked.includes(item.value)}
            onChange={() =>
              ctx.dispatch(togglePick({ filter: list.filter, value: item.value }))
            }
            className={
              list.search
                ? "py-1.5 text-[12.5px] border-b border-brand_line last:border-0"
                : "text-[12.5px]"
            }
            label={choiceLabel(list, item)}
          />
        );
        return (
          <Row
            key={list.filter}
            label={list.label}
            isOpen={open === list.filter}
            onToggle={() => setOpen(open === list.filter ? null : list.filter)}
            summary={
              picked.length === items.length
                ? `all ${items.length}`
                : `${picked.length} of ${items.length}`
            }
          >
            <div className="px-3 pb-3 flex flex-col gap-1.5">
              <AllNone
                onAll={() =>
                  ctx.dispatch(
                    setPicks({ filter: list.filter, values: items.map((i) => i.value) }),
                  )
                }
                onNone={() => ctx.dispatch(setPicks({ filter: list.filter, values: [] }))}
              />
              {list.note && (
                <span className="text-[11px] text-content/95">{list.note}</span>
              )}
              {list.search ? (
                <>
                  <ListSearch
                    label={list.search}
                    value={listQuery[list.filter] ?? ""}
                    onChange={(value) =>
                      setListQuery((q) => ({ ...q, [list.filter]: value }))
                    }
                    shown={shownItems.length}
                    total={items.length}
                  />
                  <div className="overflow-y-auto thin-scrollbar flex flex-col max-h-[38vh]">
                    {shownItems.map(choice)}
                  </div>
                </>
              ) : (
                items.map(choice)
              )}
              {list.empty && items.length === 0 && (
                <span className="text-[12px] text-content/95">{list.empty}</span>
              )}
            </div>
          </Row>
        );
      })}

      <Row
        label="Products"
        isOpen={open === "productCodes"}
        onToggle={() =>
          setOpen(open === "productCodes" ? null : "productCodes")
        }
        summary={
          ctx.productCodes.length === 0 && ctx.productDescriptions.length === 0
            ? "all"
            : [
                ctx.productCodes.length > 0 &&
                  `${ctx.productCodes.length} code${ctx.productCodes.length === 1 ? "" : "s"}`,
                ctx.productDescriptions.length > 0 &&
                  `${ctx.productDescriptions.length} word${ctx.productDescriptions.length === 1 ? "" : "s"}`,
              ]
                .filter(Boolean)
                .join(" · ")
        }
      >
        <div className="px-3 pb-3 flex flex-col gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-content">Codes</span>
            <textarea
              value={codeText}
              onChange={(e) => onCodeText(e.target.value)}
              rows={3}
              placeholder="Paste or type codes — commas, spaces or new lines"
              aria-label="Product codes"
              className="w-full border border-brand_line rounded-lg px-2.5 py-1.5 text-[12px] font-mono resize-y"
            />
          </label>
          <div className="flex items-center gap-3">
            <span className="text-[11.5px] text-content/95 flex-1">
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

          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-content">
              Description holds
            </span>
            <textarea
              value={descriptionText}
              onChange={(e) => onDescriptionText(e.target.value)}
              rows={2}
              placeholder="MILK — one per line, or separated by commas"
              aria-label="Product description words"
              className="w-full border border-brand_line rounded-lg px-2.5 py-1.5 text-[12px] font-mono resize-y"
            />
          </label>
          <div className="flex items-center gap-3">
            <span className="text-[11.5px] text-content/95 flex-1">
              {/*
                * Not split on spaces, unlike the codes: WHOLE MILK is one
                * thing to look for. A line is kept if its description holds
                * any of these, case ignored.
                */}
              {ctx.productDescriptions.length === 0
                ? "Found anywhere in the description, case ignored."
                : `Any of: ${ctx.productDescriptions.join(", ")}`}
            </span>
            {ctx.productDescriptions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setDescriptionText("");
                  window.clearTimeout(termTimer.current);
                  ctx.dispatch(setProductDescriptions([]));
                }}
                className="text-[11.5px] text-brand_navy_hover underline underline-offset-2"
              >
                clear
              </button>
            )}
          </div>

          {ctx.productCodes.length > 0 && ctx.productDescriptions.length > 0 && (
            <span className="text-[11.5px] text-severity_watch_text bg-severity_watch_bg border border-severity_watch_text/20 rounded px-2 py-1.5">
              Both are filled, so a line has to match a code AND a word. Clear
              one to widen it.
            </span>
          )}
        </div>
      </Row>

      <Row
        label="Columns"
        isOpen={open === "columns"}
        onToggle={() => setOpen(open === "columns" ? null : "columns")}
        summary={
          ctx.aggregating
            ? "not in this file"
            : ctx.selectedColumns.length === ctx.columns.length
              ? `all ${ctx.columns.length}`
              : `${ctx.selectedColumns.length} of ${ctx.columns.length}`
        }
      >
        <div className="px-3 pb-3 flex flex-col gap-2">
          {ctx.aggregating && (
            <span className="text-[11.5px] text-severity_watch_text bg-severity_watch_bg border border-severity_watch_text/20 rounded px-2 py-1.5">
              This file is a summary, so its columns are the keys and the
              measures. Clear those to go back to exporting the lines.
            </span>
          )}
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
                  ? "bg-severity_watch_bg border-severity_watch_text/20"
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
                    <span className="text-[11px] text-content/95">
                      {piiNames.filter((n) =>
                        ctx.selectedColumns.includes(n),
                      ).length}{" "}
                      of {piiNames.length}
                    </span>
                  </span>
                }
              />
              {piiOn && (
                <span className="text-[9.5px] font-semibold tracking-wide text-severity_watch_text">
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
                  isPii(c.name) ? "bg-severity_watch_bg" : ""
                }`}
                label={
                  <span className="flex items-center gap-2 w-full min-w-0">
                    <span className="font-mono text-[11.5px] flex-1 truncate">
                      {c.name}
                    </span>
                    {isPii(c.name) && (
                      <span className="text-[9.5px] font-semibold tracking-wide text-severity_watch_text">
                        PERSONAL
                      </span>
                    )}
                    <span className="text-[10.5px] text-content/95">
                      {c.data_type}
                    </span>
                  </span>
                }
              />
            ))}
            {shown.length === 0 && (
              <span className="text-[12px] text-content/95 py-2">
                No column matches that.
              </span>
            )}
          </div>
        </div>
      </Row>

      <Row
        label="Group By"
        warn={needsKey}
        isOpen={open === "groupBy"}
        onToggle={() => setOpen(open === "groupBy" ? null : "groupBy")}
        summary={
          ctx.groupBy.length > 0
            ? `${ctx.groupBy.length} key${ctx.groupBy.length === 1 ? "" : "s"}`
            : ctx.measureItems.length > 0
              ? "needed for aggregates"
              : "nothing yet"
        }
      >
        <div className="px-3 pb-3 flex flex-col gap-1.5">
          <span className="text-[11px] text-content/95">
            One row per combination of these, in the order you tick them.
            Ticking one makes the file a summary.
          </span>
          {ctx.groupBy.length === 0 && ctx.measureItems.length > 0 && (
            <span className="text-[11.5px] text-severity_watch_text bg-severity_watch_bg border border-severity_watch_text/20 rounded px-2 py-1.5">
              There are measures but nothing to group them by, so the export
              has nothing to put in a row. Pick a key — storeid for one row per
              store, product_code for one per item.
            </span>
          )}
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
                  isPii(c.name) ? "bg-severity_watch_bg" : ""
                }`}
                label={
                  <span className="flex items-center gap-2 w-full min-w-0">
                    <span className="font-mono text-[11.5px] flex-1 truncate">
                      {c.name}
                    </span>
                    <span className="text-[10.5px] text-content/95">
                      {c.data_type}
                    </span>
                  </span>
                }
              />
            ))}
          </div>
        </div>
      </Row>

      <Row
        label="Aggregates"
        isOpen={open === "aggregates"}
        onToggle={() => setOpen(open === "aggregates" ? null : "aggregates")}
        summary={
          ctx.measureItems.length === 0
            ? "none yet"
            : `${ctx.measureItems.length} aggregate${
                ctx.measureItems.length === 1 ? "" : "s"
              }`
        }
      >
        <div className="px-3 pb-3 flex flex-col gap-2">
          <span className="text-[11px] text-content/95">
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
                  searchable
                  searchPlaceholder="Find a column..."
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
                  className="w-[22px] h-[22px] flex-shrink-0 rounded border border-brand_line_2 text-content/95 hover:text-content hover:border-brand_slate transition-colors"
                >
                  ×
                </button>
              </div>
              <TextField
                label={
                  <span className="text-[11px] font-normal text-content/95">
                    Called in the file
                  </span>
                }
                value={m.alias ?? ""}
                placeholder={aliasFor(m.column, m.fn)}
                onChange={(value) =>
                  ctx.dispatch(setAggregateAlias({ at: i, alias: value.trim() }))
                }
              />
            </div>
          ))}

          {/*
            * Computed measures come from the query window rather than from
            * these two dropdowns: a column and a function cannot say
            * `sum(qty) * max(price)`. They are shown here because this is
            * where someone looks for what the file holds, and removable here
            * because that is where they would look for that too.
            */}
          {ctx.computed.map((m, i) => (
            <div
              key={`computed-${i}`}
              className="flex flex-col gap-1 border border-brand_line_2 rounded-lg p-2 bg-filter_active"
            >
              <div className="flex items-center gap-1.5">
                <span className="flex-1 min-w-0 font-mono text-[11px] text-content/95 truncate">
                  {sketchExpr(m.expr)}
                </span>
                <span className="text-[9.5px] font-semibold tracking-wide text-content/95">
                  COMPUTED
                </span>
                <button
                  type="button"
                  onClick={() => ctx.dispatch(removeComputed(i))}
                  aria-label={`Remove ${m.alias}`}
                  className="w-[22px] h-[22px] flex-shrink-0 rounded border border-brand_line_2 text-content/95 hover:text-content hover:border-brand_slate transition-colors"
                >
                  ×
                </button>
              </div>
              <TextField
                label={
                  <span className="text-[11px] font-normal text-content/95">
                    Called in the file
                  </span>
                }
                value={m.alias}
                onChange={(value) =>
                  ctx.dispatch(setComputedAlias({ at: i, alias: value.trim() }))
                }
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              ctx.dispatch(addAggregate({ column: "*", fn: "count" }))
            }
            className="text-[11.5px] text-brand_navy_hover underline underline-offset-2 self-start"
          >
            add an aggregate
          </button>
          {ctx.measureItems.length === 0 && (
            <span className="text-[11.5px] text-content/95">
              A summary with no aggregates is just the list of groups.
              Arithmetic between them comes from the query box.
            </span>
          )}
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
                ctx.dispatch(setFlag({ fileFormat: value }))
              }
              className="w-full"
            />
          </label>
          {ctx.dateFormats.length > 0 && (
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-content">
                Dates
              </span>
              <SelectFilter
                plain
                options={ctx.dateFormats.map((f) => ({
                  value: f.value,
                  label: `${f.label} — ${f.example}`,
                }))}
                value={ctx.flags.dateFormat}
                onChange={(value) => ctx.dispatch(setFlag({ dateFormat: value }))}
                className="w-full"
              />
              <span className="text-[11px] text-content/95">
                How the file spells its date columns. The preview above shows
                them as the table stores them. Sorting stays chronological
                whichever is picked.
              </span>
            </label>
          )}
          <TextField
            label="File name"
            value={fileName}
            placeholder={ctx.source.filePrefix}
            hint={
              fileName && !PREFIX_OK.test(fileName) ? (
                <span className="text-severity_watch_text">
                  Letters, digits, - and _ only, up to 60. It names the build's
                  folder, so a dot is refused rather than cleaned up.
                </span>
              ) : (
                `${fileName || ctx.source.filePrefix}.${
                  ctx.flags.fileFormat === "csv" ? "csv" : "txt"
                }`
              )
            }
            onChange={onFileName}
          />
          {ctx.source.flags.map((flag) => (
            <label key={flag.filter} className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-content">
                {flag.label}
              </span>
              <SelectFilter
                plain
                options={flagChoices(flag)}
                value={flagToChoice(ctx.rowFlags[flag.filter] ?? null)}
                onChange={(value) =>
                  ctx.dispatch(setRowFlag({ filter: flag.filter, value: choiceToFlag(value) }))
                }
                className="w-full"
              />
            </label>
          ))}
          {/*
            * The sort is the file's own columns, in the order they are
            * clicked: ascending, descending, gone. Sorting by something the
            * file does not carry is a question about rows nobody can see, so
            * this offers nothing else.
            */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-[12px] font-medium text-content flex-1">
                Sort by
              </span>
              {ctx.orderBy.length > 0 && (
                <button
                  type="button"
                  onClick={() => ctx.dispatch(setOrderBy([]))}
                  className="text-[11px] text-brand_navy_hover underline underline-offset-2"
                >
                  clear
                </button>
              )}
            </div>
            {ctx.orderBy.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {ctx.orderBy.map((s, i) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => ctx.dispatch(toggleSortKey(s.key))}
                    title="Click to turn it around, again to remove it"
                    className="font-mono text-[10.5px] bg-filter_active border border-brand_line_2 rounded px-1.5 py-0.5"
                  >
                    {i + 1}. {s.key} {s.desc ? "\u2193" : "\u2191"}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1 max-h-[18vh] overflow-y-auto thin-scrollbar">
              {ctx.sortableKeys
                .filter((key) => !ctx.orderBy.some((s) => s.key === key))
                .map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => ctx.dispatch(toggleSortKey(key))}
                    className="font-mono text-[10.5px] bg-card_bg border border-brand_line rounded px-1.5 py-0.5 hover:border-brand_slate transition-colors"
                  >
                    + {key}
                  </button>
                ))}
            </div>
            <span className="text-[11px] text-content/95">
              {ctx.orderBy.length === 0
                ? "Unsorted unless the switch below is on. Sorting a long file takes longer to build."
                : "Click a key to turn it around, again to drop it."}
            </span>
          </div>
          <Checkbox
            checked={ctx.flags.ordered}
            onChange={(value) => ctx.dispatch(setFlag({ ordered: value }))}
            disabled={ctx.orderBy.length > 0}
            className="text-[12.5px]"
            label={
              <span className="flex items-center gap-2">
                Sort the file
                <span className="text-[11px] text-content/95">
                  {ctx.orderBy.length > 0
                    ? "the keys above win"
                    : ctx.aggregating
                      ? "by its group keys · slower"
                      : "by store, date and line · slower"}
                </span>
              </span>
            }
          />
        </div>
      </Row>
      </div>

      {help && (
        <HelpPanel content={HELP_CONTENT["data-export"]} onClose={() => setHelp(false)} />
      )}
    </div>
  );
};

export default ConfigPanel;
