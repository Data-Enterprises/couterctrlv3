// Hooks
import { useAppDispatch } from "../../../hooks";
import { useEventPerfCtx } from "../hooks";

// Redux
import {
  GROUP_KEY,
  setEventInfoOpen,
  setEventSearchOpen,
  toggleEventCard,
} from "../../../features/dev/devEventPerfSlice";

// Utils
import { formatCurrency2 } from "../../../utils";
import { fmtInt } from "../utils/display";

// Components
import PairedBars from "../../mobile/perf/PairedBars";
import PerfCardHeader from "../../mobile/perf/PerfCardHeader";
import PerfDelta from "../../mobile/perf/PerfDelta";

interface ScopeCardProps {
  allLabel: string;
  measure: "transactions" | "amount";
}

/** The scope card: the lens (picked from its title), the hero figure against
 *  the prior average, and four supporting figures. */
const ScopeCard = ({ allLabel, measure }: ScopeCardProps) => {
  const dispatch = useAppDispatch();
  const {
    perf,
    scopeOpen,
    multiStore,
    current,
    groupDayLabel,
    weekLabel,
    pages,
    setTypePickerOpen,
    groupAlwaysOpen,
    heroCaption,
    fmt,
    valueOf,
    baseOf,
    cardBusiest,
    pageIndex,
  } = useEventPerfCtx();
  return (
    <div className="px-3 pt-3">
      <section
        className={`overflow-hidden rounded-2xl border bg-custom-white shadow-md transition-colors ${
          scopeOpen ? "border-gray-300" : "border-gray-200"
        }`}
      >
        <PerfCardHeader
          title={perf.lens ?? allLabel}
          label={multiStore ? `${current.stores} stores` : ""}
          when={groupDayLabel || weekLabel}
          onSearch={() => dispatch(setEventSearchOpen(true))}
          onInfo={() => dispatch(setEventInfoOpen(true))}
          // Only offered when there is more than one type to choose from.
          onTitleTap={
            pages.length > 1 ? () => setTypePickerOpen(true) : undefined
          }
          onToggle={
            groupAlwaysOpen
              ? undefined
              : () =>
                  dispatch(
                    toggleEventCard({
                      key: GROUP_KEY,
                      label: current.storeName ?? "All stores",
                    }),
                  )
          }
          open={scopeOpen}
        />

        <div className="px-4 pb-4 pt-2">
          <div className="mt-1 text-[11px] font-semibold text-content/95">
            {heroCaption}
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2.5">
            <span className="font-display text-[31px] font-extrabold leading-none tracking-tight text-content">
              {fmt(valueOf(current))}
            </span>
            {/* Same gate as the bar below. */}
            {baseOf(current) !== null && (
              <PerfDelta
                ty={valueOf(current)}
                ly={baseOf(current) as number}
                format={fmt}
                className="ml-auto"
              />
            )}
          </div>

          {/* No second bar when the comparison period has nothing at this
              level — LP's baseline knows stores, never people, and a zero
              would read as "none last time" rather than "not measured". */}
          {baseOf(current) !== null && (
            <div className="mt-3">
              <PairedBars
                ty={valueOf(current)}
                ly={baseOf(current) as number}
                max={Math.max(valueOf(current), baseOf(current) as number)}
                labels={["WK", "AVG"]}
                format={fmt}
                compact
              />
              <p className="mt-1.5 text-[11px] text-content/95">
                WK {groupDayLabel ? "selected day" : "this week"} · AVG
                prior 2-wk avg{groupDayLabel ? ", same weekday" : ""}
              </p>
            </div>
          )}

          <div className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-brand_line pt-3">
            {(
              [
                ...(measure === "amount"
                  ? [
                      ["Coupons", fmtInt(current.lines)],
                      ["Transactions", fmtInt(current.transactions)],
                    ]
                  : [
                      ["Amount", formatCurrency2(current.amount)],
                      ["Cashiers", fmtInt(current.cashiers)],
                    ]),
                ["Per txn", formatCurrency2(current.perTransaction)],
                ["Busiest", cardBusiest[pageIndex] ?? "—"],
              ] as [string, string][]
            ).map(([k, v]) => (
              <div key={k} className="flex flex-col items-center text-center">
                <span className="font-mono text-[10px] uppercase tracking-wider text-content/95">
                  {k}
                </span>
                <span className="font-display text-[15px] font-bold text-content">
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ScopeCard;
