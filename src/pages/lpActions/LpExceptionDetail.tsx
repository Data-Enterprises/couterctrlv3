import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { setLpCase, toggleLpQuiet } from "../../features/lpActionsSlice";
import LpWhoList from "./profiles/LpWhoList";
import LpStoreCards from "./profiles/LpStoreCards";
import LpWeekMatrix from "./profiles/LpWeekMatrix";
import KpiTileGrid, { type KpiCell } from "../../components/KpiTileGrid";
import { buildStoreCall2 } from "./profiles/call2Model";
import type { CashierStanding } from "./profiles/rollupStats";
import { PlusIcon } from "@heroicons/react/20/solid";
import { bandOf, buildStandings, peakWeek } from "./profiles/rollupStats";

/**
 * One store on one exception — the report before anybody is opened.
 *
 * Two bands, and each answers a different question with a different call. The
 * roster on the left is call 1: the whole population, split by the rule the
 * reader gave — over their store's weekly average, over the peer average, or
 * over either in money. The figures and cards beside it are call 2: how far
 * out, in which weeks, and whether the same person keeps coming back.
 *
 * What is deliberately NOT here is the baseline. The ledger on the left of the
 * page already carries this week against the weeks before it for every row,
 * and the same figure printed twice in two shapes is two figures that
 * eventually disagree.
 *
 * The roster stays in the same column when a cashier is opened, so moving
 * between people never costs a trip back to this screen.
 */
interface Props {
  onAddWeek: () => void;
  addingWeek: boolean;
}

const Empty = ({ text }: { text: string }) => (
  <div className="flex-shrink-0 shadow-lg" style={{ width: "63%" }}>
    <div className="bg-custom-white rounded-xl shadow-sm h-full flex items-center justify-center px-4">
      <p className="text-[12px] text-content text-center leading-relaxed">
        {text}
      </p>
    </div>
  </div>
);

const LpExceptionDetail = ({ onAddWeek, addingWeek }: Props) => {
  const dispatch = useAppDispatch();
  const {
    rows,
    selectedId,
    rollupRows,
    windows,
    profiles,
    benchmarks,
    quietOpen,
  } = useAppSelector((s) => s.lpActions);
  const row = rows.find((r) => r.id === selectedId) ?? null;

  /** Everyone at this store on this exception. All from call 1, so the panel
   *  has its roster the moment the search lands. */
  const standings = useMemo(
    () =>
      row
        ? buildStandings(rollupRows, windows.length).filter(
            (s) => s.storeid === row.storeid && s.saleType === row.saleType,
          )
        : [],
    [rollupRows, windows.length, row],
  );

  const call2 = useMemo(
    () =>
      row
        ? buildStoreCall2(profiles, benchmarks, row.storeid, row.saleType)
        : null,
    [profiles, benchmarks, row],
  );

  if (!row || !call2)
    return <Empty text="Pick an exception for its cashiers and its report." />;

  const toInvestigate = standings.filter((s) => bandOf(s) !== "quiet").length;
  const peerWeekly = call2.peer?.weekly.avg_line_count ?? 0;
  const worst = call2.worst;

  /**
   * Four figures, in the order the reader needs them: how many people, how far
   * the worst one is out, what the line they are measured against is, and how
   * long it has been going on. All from call 2 except the first, whose
   * denominator only call 1 has — call 2 was never sent the clean ones.
   */
  const figures: KpiCell[] = [
    {
      label: "To investigate",
      value: String(toInvestigate),
      sub: `of ${standings.length}`,
      variant: toInvestigate > 0 ? "down" : "up",
      subVariant: "neutral",
    },
    {
      label: "Worst index",
      value: worst?.index != null ? `${worst.index.toFixed(1)}×` : "—",
      sub: worst ? worst.cashierName : undefined,
      variant: worst ? "down" : undefined,
      subVariant: "neutral",
    },
    {
      label: "Peer average",
      value: `${peerWeekly.toFixed(1)}/wk`,
      sub: call2.peer ? `${call2.peer.peer_count} peers` : undefined,
      subVariant: "neutral",
    },
    {
      label: "Flagged weeks",
      value: String(call2.maxWeeksFlagged),
      sub: `of ${windows.length}`,
      variant: call2.maxWeeksFlagged > 1 ? "down" : undefined,
      subVariant: "neutral",
    },
  ];

  return (
    <div className="flex-shrink-0 shadow-lg" style={{ width: "63%" }}>
      <div className="bg-custom-white rounded-xl shadow-sm h-full flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-[#1e2a4a] px-4 py-2.5 flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-custom-white text-[14px] font-bold truncate">
              {row.saleType}
            </p>
            <p className="text-custom-white/85 text-[12px] truncate">
              {row.storeName} · {standings.length}{" "}
              {standings.length === 1 ? "cashier" : "cashiers"} rang it
            </p>
          </div>
          {/* Widening the window changes every figure below it, which is why
              it lives up here rather than beside any one of them. */}
          <button
            onClick={onAddWeek}
            disabled={addingWeek}
            title="Read one more week of history — the baseline widens with it"
            className="ml-auto flex-shrink-0 flex items-center gap-1 text-[12px] font-medium text-custom-white/85 hover:text-custom-white border border-custom-white/35 rounded-lg px-2.5 py-1 disabled:opacity-50 transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            {addingWeek ? "Reading…" : "week"}
          </button>
        </div>

        {/* The store's headline, above both columns rather than inside one.
            These four are about the store, not about the roster beside them or
            the sections under them — a band that starts halfway across reads
            as belonging to the column it sits in. */}
        <KpiTileGrid items={figures} />

        <div className="flex-1 min-h-0 flex">
          {/* The roster, in the column it will stay in once a case is open. */}
          <aside className="w-[212px] flex-shrink-0 min-h-0 flex flex-col border-r border-[#1e2a4a]/15">
            <LpWhoList
              variant="column"
              saleType={row.saleType}
              storeid={row.storeid}
              showQuiet={quietOpen}
              onToggleQuiet={() => dispatch(toggleLpQuiet())}
              onOpen={(c: CashierStanding) =>
                dispatch(
                  setLpCase({
                    ref: {
                      storeid: c.storeid,
                      cashierNumber: c.cashierNumber,
                    },
                    type: row.saleType,
                    // Opens on their worst week. The evidence is about the
                    // week that flagged; the others are the baseline it was
                    // measured against.
                    week: peakWeek(c).index,
                  }),
                )
              }
            />
          </aside>

          <div className="flex-1 min-w-0 min-h-0 overflow-y-auto thin-scrollbar">
            <LpStoreCards
              data={call2}
              people={standings.length}
              windowWeeks={windows.length}
            />
            {/* The whole population, under the summary of its flagged half.
                Call 2 only ever returned the flagged cashiers, so without
                this a store with two of them has a report about two people. */}
            <LpWeekMatrix saleType={row.saleType} storeid={row.storeid} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LpExceptionDetail;
