import { useAppDispatch, useAppSelector } from "../../hooks";
import {
  setLpSelected,
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

const WeekBars = ({
  row,
}: {
  row: Pick<ExceptionRow, "weeks" | "severity">;
}) => {
  const peak = Math.max(...row.weeks.map((w) => w.count), 1);
  return (
    <span className="flex items-end gap-[3px] h-5 flex-shrink-0">
      {row.weeks.map((w, i) => {
        const last = i === row.weeks.length - 1;
        const height = Math.max(2, Math.round((w.count / peak) * 20));
        return (
          <span
            key={w.start}
            title={`${w.start} — ${w.count}`}
            style={{ height }}
            className={`w-2 rounded-sm ${
              last
                ? row.severity === "investigate"
                  ? "bg-severity_critical_text"
                  : row.severity === "watch"
                    ? "bg-severity_watch_text"
                    : "bg-severity_healthy_text"
                : "bg-gray-300"
            }`}
          />
        );
      })}
    </span>
  );
};

const StoreRow = ({ row }: { row: ExceptionRow }) => {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector((s) => s.lpActions.selectedId);
  return (
    <button
      onClick={() => dispatch(setLpSelected(row.id))}
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
      <WeekBars row={row} />
      <span
        className={`text-[12px] tabular-nums w-[58px] text-right flex-shrink-0 ${PCT_TEXT[row.severity]}`}
      >
        {row.changePct === null
          ? row.severity === "investigate"
            ? "new"
            : "—"
          : `${row.changePct >= 0 ? "+" : ""}${row.changePct.toFixed(0)}%`}
      </span>
    </button>
  );
};

const TypeSection = ({ group }: { group: TypeGroup }) => {
  const dispatch = useAppDispatch();
  const expandedTypes = useAppSelector((s) => s.lpActions.expandedTypes);
  const open = expandedTypes.includes(group.saleType);
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
        <WeekBars row={group} />
        <span
          className={`text-[12.5px] tabular-nums w-[58px] text-right flex-shrink-0 ${PCT_TEXT[group.severity]}`}
        >
          {group.changePct === null
            ? group.severity === "investigate"
              ? "new"
              : "—"
            : `${group.changePct >= 0 ? "+" : ""}${group.changePct.toFixed(0)}%`}
        </span>
      </button>
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
