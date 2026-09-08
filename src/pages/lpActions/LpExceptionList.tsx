import { useAppDispatch, useAppSelector } from "../../hooks";
import {
  setLpSelected,
  setLpProfileScope,
  setLpSevFilter,
  toggleLpType,
} from "../../features/lpActionsSlice";
import type { LpSevFilter } from "../../features/lpActionsSlice";
import InfoButton from "../../components/InfoButton";
import InfoPopover from "../../components/InfoPopover";
import HeaderIconButton from "../../components/HeaderIconButton";
import {
  MagnifyingGlassIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "@heroicons/react/20/solid";
import { LP_ACTIONS_INFO } from "./lpActionsInfo";
import type { ExceptionRow, LpSeverity, TypeGroup } from "./lpActionsMetrics";
import { buildTypeGroups } from "./lpActionsMetrics";
import { useMemo } from "react";
import { useState } from "react";

/**
 * Every store-and-exception pair, worst movement first.
 *
 * The bar strip is the whole argument in one glance: three grey weeks and a
 * coloured one is a spike, four level bars is a habit. Deliberately unlabelled
 * — the counts are one click away and the shape is the point here.
 */
const DOT: Record<LpSeverity, string> = {
  investigate: "bg-severity_critical_text",
  watch: "bg-severity_watch_text",
  steady: "bg-severity_healthy_text",
};

const PCT_TEXT: Record<LpSeverity, string> = {
  investigate: "text-severity_critical_text",
  watch: "text-severity_watch_text",
  steady: "text-content/85",
};

type SevChipKey = Exclude<LpSevFilter, "all">;

const CHIP: { key: SevChipKey; label: string; cls: string }[] = [
  {
    key: "investigate",
    label: "Investigate",
    cls: "bg-severity_critical_bg text-severity_critical_text",
  },
  {
    key: "watch",
    label: "Watch",
    cls: "bg-severity_watch_bg text-severity_watch_text",
  },
  {
    key: "steady",
    label: "Steady",
    cls: "bg-severity_healthy_bg text-severity_healthy_text",
  },
];

/**
 * The two figures the grade is made of, in the row that carries the grade.
 *
 * These used to be four spark bars here and a KPI strip on the right panel
 * saying the same thing. The bars showed which week without saying how many,
 * and the strip repeated the row you had just clicked — so the numbers moved
 * to where the percentage already lives and the strip came out entirely.
 */
const Grade = ({
  row,
}: {
  row: Pick<ExceptionRow, "latest" | "baseline" | "changePct" | "severity">;
}) => (
  <>
    <span className="text-[12.5px] font-semibold tabular-nums text-content w-[34px] text-right flex-shrink-0">
      {row.latest}
    </span>
    <span
      className="text-[12px] tabular-nums text-content/85 w-[38px] text-right flex-shrink-0"
      title="Average of the weeks before it"
    >
      {row.baseline.toFixed(1)}
    </span>
    <span
      className={`text-[12px] tabular-nums w-[54px] text-right flex-shrink-0 ${PCT_TEXT[row.severity]}`}
    >
      {row.changePct === null
        ? row.severity === "investigate"
          ? "new"
          : "—"
        : `${row.changePct >= 0 ? "+" : ""}${row.changePct.toFixed(0)}%`}
    </span>
  </>
);

const StoreRow = ({ row }: { row: ExceptionRow }) => {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector((s) => s.lpActions.selectedId);
  return (
    <button
      onClick={() => {
        dispatch(setLpSelected(row.id));
        // Leaves the cross-store view if it was open. The detail panel derives
        // its own profiles from `selectedId`, so a store needs no scope of its
        // own — one selection, one source of truth.
        dispatch(setLpProfileScope({ saleType: null, storeid: null }));
      }}
      className={`w-full text-left flex items-center gap-2.5 pl-3 pr-3 py-2 border-b border-gray-100 transition-colors ${
        row.id === selectedId ? "bg-row_selected" : "hover:bg-gray-50"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT[row.severity]}`}
      />
      <span className="min-w-0 flex-1 text-[12.5px] text-content truncate">
        {row.storeName}
      </span>
      <Grade row={row} />
    </button>
  );
};

const TypeSection = ({ group }: { group: TypeGroup }) => {
  const dispatch = useAppDispatch();
  const expandedTypes = useAppSelector((s) => s.lpActions.expandedTypes);
  const { profiles, profileType, profileStore } = useAppSelector(
    (s) => s.lpActions,
  );
  const open = expandedTypes.includes(group.saleType);
  /** Cashiers graded on THIS exception anywhere in the search. The row hides
   *  itself at zero rather than offering an empty panel. */
  const flagged = profiles.filter(
    (c) => c.exceptions[group.saleType] !== undefined,
  ).length;
  const allSelected = profileType === group.saleType && profileStore === null;
  const Chevron = open ? ChevronDownIcon : ChevronRightIcon;

  return (
    <div>
      <button
        onClick={() => dispatch(toggleLpType(group.saleType))}
        className="w-full text-left flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 transition-colors"
      >
        <Chevron className="w-3.5 h-3.5 text-content/85 flex-shrink-0" />
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT[group.severity]}`}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium text-content truncate">
            {group.saleType}
          </span>
          <span className="block text-[12px] text-content/85 truncate">
            {group.stores.length}{" "}
            {group.stores.length === 1 ? "store" : "stores"}
            {group.investigateCount > 0 &&
              ` · ${group.investigateCount} to investigate`}
          </span>
        </span>
        <Grade row={group} />
      </button>
      {open && flagged > 0 && (
        /* Every flagged cashier for this exception, across every store under
           it. The alternative is opening each store in turn to find out who is
           in it, and the data for all of them is already in hand. */
        <button
          onClick={() =>
            dispatch(
              setLpProfileScope({ saleType: group.saleType, storeid: null }),
            )
          }
          className={`w-full text-left flex items-center gap-2 pl-9 pr-3 py-1.5 border-b border-gray-100 text-[12px] font-medium transition-colors ${
            allSelected
              ? "bg-row_selected text-content"
              : "text-primary-a10 hover:bg-gray-50"
          }`}
        >
          All flagged cashiers
          <span className="ml-auto tabular-nums text-content/85">
            {flagged}
          </span>
        </button>
      )}
      {open && (
        // A rule down the left, indented to the parent's chevron. The stores
        // are the type broken apart, and without a guide a long list stops
        // reading as belonging to the row above it.
        <div className="ml-[19px] border-l-2 border-gray-200">
          {group.stores.map((r) => (
            <StoreRow key={r.id} row={r} />
          ))}
        </div>
      )}
    </div>
  );
};

interface Props {
  onSearchOpen: () => void;
}

const LpExceptionList = ({ onSearchOpen }: Props) => {
  const dispatch = useAppDispatch();
  const { rows, sevFilter, weeks, scopeLabel } = useAppSelector(
    (s) => s.lpActions,
  );
  const [infoOpen, setInfoOpen] = useState(false);

  const counts = {
    investigate: rows.filter((r) => r.severity === "investigate").length,
    watch: rows.filter((r) => r.severity === "watch").length,
    steady: rows.filter((r) => r.severity === "steady").length,
  };

  const visible =
    sevFilter === "all" ? rows : rows.filter((r) => r.severity === sevFilter);

  // Grouped by exception type, with the store rows underneath. A group search
  // produces stores x types rows — the type is the level people scan, and the
  // stores are where it is actually happening.
  const windows = rows[0]?.weeks ?? [];
  const groups = useMemo(
    () => buildTypeGroups(visible, windows),
    [visible, windows],
  );

  return (
    <div className="flex-1 min-w-0 shadow-lg">
      <div className="bg-custom-white rounded-xl shadow-sm flex flex-col h-full">
        <div className="flex-shrink-0 bg-[#1e2a4a] rounded-t-xl px-4 pt-1 pb-2.5 flex flex-col gap-0">
          <div className="flex items-center gap-2 min-h-[26px]">
            <span className="min-w-0 flex-1 text-custom-white font-semibold text-[13px] truncate">
              {scopeLabel || "Exceptions"}
            </span>
            <span className="flex-shrink-0 text-[14px] font-semibold text-custom-white tabular-nums">
              {rows.length}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-custom-white/[0.08]">
            <HeaderIconButton onClick={onSearchOpen} title="New search">
              <MagnifyingGlassIcon className="w-3.5 h-3.5" />
            </HeaderIconButton>
            <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />
            <span className="text-[11px] text-custom-white/85">
              {weeks} weeks &middot; latest week graded on the {weeks - 1}{" "}
              before it
            </span>
            <div className="flex-1" />
            <div className="relative flex-shrink-0">
              <InfoButton onClick={() => setInfoOpen((v) => !v)} />
              {infoOpen && (
                <InfoPopover
                  title={LP_ACTIONS_INFO.title}
                  purpose={LP_ACTIONS_INFO.purpose}
                  glossary={LP_ACTIONS_INFO.glossary}
                  onClose={() => setInfoOpen(false)}
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 px-3 py-2 border-b border-gray-100 flex items-center gap-2">
          {CHIP.map(({ key, label, cls }) => (
            <button
              key={key}
              onClick={() =>
                dispatch(setLpSevFilter(sevFilter === key ? "all" : key))
              }
              className={`text-[12px] font-semibold px-2 py-1 rounded-full transition-shadow ${cls} ${
                sevFilter === key ? "ring-2 shadow-sm ring-current/40" : ""
              }`}
            >
              {label} <span className="tabular-nums">{counts[key]}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar rounded-b-xl">
          {groups.length === 0 && (
            <div className="py-8 text-center text-[12px] text-content/85">
              No exceptions matched.
            </div>
          )}
          {groups.map((g) => (
            <TypeSection key={g.saleType} group={g} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LpExceptionList;
