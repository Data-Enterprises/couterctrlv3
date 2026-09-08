import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import {
  setLpCase,
  setLpCaseRows,
  setLpCaseView,
  setLpJourneyCashier,
  toggleLpQuiet,
} from "../../../features/lpActionsSlice";
import { ALL_TYPES, buildCaseCore, isAll, latestWeekFacts } from "./caseModel";
import { buildStoreShare, storeShareFromGraded } from "./storeShare";
import { buildItemMovement } from "./itemMovement";
import { buildHourProfile } from "./hourProfile";
import { useCaseReceipts, type TypeScope } from "./useCaseReceipts";
import { useCaseIds } from "./useCaseIds";
import { rowsFromLines, typesForCashier } from "./caseSource";
import { caseLines } from "./caseExport";
import { isCashier } from "../lpActionsMetrics";
import { formatDateSimple } from "../../../utils";
import {
  buildStandings,
  peakWeek,
  type CashierStanding,
} from "../profiles/rollupStats";
import { decideVerdict, storeContext } from "./caseVerdict";
import LpWhoList from "../profiles/LpWhoList";
import {
  findingLine,
  hourLine,
  storeLine,
  itemLine,
  cautionLine,
} from "./caseNarrative";
import CaseHeader from "./CaseHeader";
import CaseSummary from "./CaseSummary";
import type { EvidenceIcon, EvidenceLine } from "./CaseSummary";
import CaseEvidence from "./CaseEvidence";
import CaseEvidenceBar from "./CaseEvidenceBar";
import CaseGrids from "./CaseGrids";
import CaseKpis from "./CaseKpis";
import CaseTypeMatrix from "./CaseTypeMatrix";
import ReceiptCase from "../ReceiptCase";
import { useReceiptCase } from "../useReceiptCase";

/**
 * One cashier's case, in the right panel rather than an overlay.
 *
 * The case is the thing this page exists to produce, so it sits where the
 * reader's attention already is and keeps the ledger visible beside it. Only
 * the connection plot — exploratory, and genuinely wanting the width — stays a
 * modal.
 *
 * Three things sit still while the reader works: the roster on the left, the
 * week strip, and the type tabs. The roster is the reason the case stopped
 * replacing the store panel — moving from one flagged cashier to the next used
 * to mean going back, finding the row again and losing the week you were on.
 * The two views under it are one case read twice: what the numbers say, then
 * the rows they were counted from, which is also what gets exported.
 *
 * Switching a chip re-points emphasis rather than navigating: the charts keep
 * their shape and only the narrative, the items and the receipts change.
 */
interface Props {
  onBack: () => void;
  backLabel: string;
}

const ICON_ORDER: EvidenceIcon[] = ["clock", "store", "items"];

const CashierCase = ({ onBack, backLabel }: Props) => {
  const dispatch = useAppDispatch();
  const {
    rawRows,
    rows: gradedRows,
    rollup,
    caseRows: sourceRows,
    windows,
    caseCashier,
    caseType,
    caseWeek,
    caseView,
    quietOpen,
    rollupRows,
  } = useAppSelector((s) => s.lpActions);
  const [showAllItems, setShowAllItems] = useState(false);
  const { receipt, openReceipt, closeReceipt } = useReceiptCase();

  /**
   * Where this case's rows come from.
   *
   * On the prod walk they are already in hand — the overview downloaded every
   * exception row, so drilling costs nothing. The rollup carries counts and no
   * rows, so the case fetches this cashier's baskets and rebuilds the rows from
   * their lines. Everything below reads `sourceRows` and cannot tell which
   * happened.
   */
  const caseTypes = useMemo(
    () =>
      caseCashier === null ? [] : typesForCashier(gradedRows, caseCashier),
    [gradedRows, caseCashier],
  );
  const caseIds = useCaseIds(caseCashier, caseTypes, rollup);

  // The rebuilt rows live in Redux, not local state: the connection plot is a
  // sibling component that needs the same ones, and fetching them again there
  // would be a second identical round trip for a modal opened out of this very
  // panel.
  const caseRows = rollup ? sourceRows : rawRows;

  const core = useMemo(
    () =>
      caseCashier === null
        ? null
        : buildCaseCore(caseRows, windows, caseCashier),
    [caseRows, windows, caseCashier],
  );

  /**
   * The exception this case is written about.
   *
   * Always one, never All. The reader arrives from a store row that already
   * named a type, and the type table below re-points this rather than a strip
   * of chips. An unrecognised type means the walk has moved on since — fall
   * back to their biggest rather than to a combined view, because every
   * sentence, chart and receipt below reads better about one thing.
   */
  const selected =
    caseType && core?.types.some((t) => t.saleType === caseType)
      ? caseType
      : (core?.types[0]?.saleType ?? caseType ?? ALL_TYPES);

  // Grouped by type because that is how `transaction_list` is asked: each type
  // carries its own receipts, and the whole window rather than the latest week
  // so "new item" and "unusual hour" have a baseline to stand on.
  const scopes = useMemo<TypeScope[]>(() => {
    if (caseCashier === null) return [];
    // Rollup: one id list for every type, and `transaction_list` narrows by
    // type itself. The types come off the graded rows rather than off `core`,
    // which does not exist yet — core is built from the rows these receipts
    // produce.
    if (rollup) {
      return caseIds.ids.length === 0
        ? []
        : caseTypes.map((saleType) => ({ saleType, saleIds: caseIds.ids }));
    }
    if (!core) return [];
    return core.types.map((t) => ({
      saleType: t.saleType,
      saleIds: [
        ...new Set(
          rawRows
            .filter(
              (r) => isCashier(r, caseCashier) && r.sale_type === t.saleType,
            )
            .map((r) => r.sale_id),
        ),
      ].sort(),
    }));
  }, [rawRows, caseCashier, core, rollup, caseIds.ids, caseTypes]);

  const detail = useCaseReceipts(scopes);

  // The lines are the only source of rows in rollup mode, so they are folded
  // back to `cashier_table` grain as they land. Held in state rather than
  // derived inline because `core` reads it and `scopes` feeds it — deriving it
  // in a memo that `scopes` also depends on is the cycle.
  useEffect(() => {
    if (!rollup) return;
    dispatch(setLpCaseRows(rowsFromLines(detail.lines, new Set(caseTypes))));
  }, [rollup, detail.lines, caseTypes, dispatch]);

  /**
   * The week everything below is about.
   *
   * One definition, read by the KPIs, the hour profile and the receipts grid.
   * They each used to reach for the last window, which was the same thing
   * until the strip let the reader pick — and in rollup mode the rows in hand
   * are only the picked week's, so "the last window" answered zero for
   * anybody whose spike was earlier.
   */
  const focus = useMemo(
    () =>
      (caseWeek !== null ? windows[caseWeek] : undefined) ??
      windows[windows.length - 1],
    [windows, caseWeek],
  );

  const facts = useMemo(
    () =>
      caseCashier === null || !selected || !focus
        ? null
        : latestWeekFacts(caseRows, windows, caseCashier, selected, focus),
    [caseRows, windows, caseCashier, selected, focus],
  );

  /**
   * Off the graded rows in rollup mode, off the transactions otherwise.
   *
   * `caseRows` holds this cashier and nobody else there, and store share is the
   * one figure on the page that is about everybody else. Feeding it a
   * single-cashier set does not fail — it confidently reports that the store
   * rose by her amount alone and no colleague moved.
   */
  const share = useMemo(
    () =>
      core && selected
        ? rollup
          ? storeShareFromGraded(gradedRows, core, selected)
          : buildStoreShare(
              caseRows,
              windows,
              core.storeid,
              core.cashierNumber,
              selected,
            )
        : null,
    [caseRows, windows, core, selected, rollup, gradedRows],
  );

  const items = useMemo(
    () =>
      detail.lines.length && selected
        ? buildItemMovement(detail.lines, windows, selected)
        : [],
    [detail.lines, windows, selected],
  );

  const profile = useMemo(() => {
    if (!detail.lines.length || !focus) return null;
    return buildHourProfile(detail.lines, focus.start, focus.end);
  }, [detail.lines, focus]);

  const latestRows = useMemo(() => {
    if (caseCashier === null || !selected || !focus) return [];
    return caseRows.filter(
      (r) =>
        isCashier(r, caseCashier) &&
        (isAll(selected) || r.sale_type === selected) &&
        r.sale_date.slice(0, 10) >= focus.start &&
        r.sale_date.slice(0, 10) <= focus.end,
    );
  }, [caseRows, caseCashier, selected, focus]);

  /** The lines the evidence view shows and exports: this type, this week,
   *  ordered the way somebody reads a day. */
  const evidenceLines = useMemo(
    () => caseLines(detail.lines, selected, caseTypes),
    [detail.lines, selected, caseTypes],
  );

  const weekLabel = focus
    ? `Week of ${formatDateSimple(focus.start)}`
    : `${windows.length} weeks`;

  // In rollup mode the rows arrive over the network, so there is a real window
  // where the case is open and `core` cannot be built yet. Returning null there
  // blanks the right panel with no explanation — the reader clicked a cashier
  // and got an empty half-screen. The prod path never reaches this: its rows
  // are already in memory, so `core` exists on the first render.
  //
  // Deliberately NOT keyed on the loading flags. The case makes two requests in
  // sequence, and between them there is a render where the first has finished
  // and the second has not yet started its effect — both flags false, still no
  // rows. Keying on them returned null for that one frame, so the panel blinked
  // out and back on every cashier click, which reads as a crash rather than a
  // fetch. Having a case open with no rows yet IS the loading state, whatever
  // the flags say.
  const sourcing = rollup && caseCashier !== null;
  if (!core || !facts || caseCashier === null) {
    if (!sourcing && !caseIds.error) return null;
    return (
      <div className="flex-shrink-0 shadow-lg" style={{ width: "63%" }}>
        <div className="bg-custom-white rounded-xl shadow-sm h-full flex items-center justify-center">
          <p className="text-[12px] text-content/85">
            {caseIds.error ?? "Reading this cashier's receipts…"}
          </p>
        </div>
      </div>
    );
  }

  const type = isAll(selected)
    ? core.all
    : (core.types.find((t) => t.saleType === selected) ?? core.all);

  /**
   * What kind of thing this is.
   *
   * Decided from the figures already on screen — the week's counts, the hour
   * profile, the items, and this cashier's peers at the same store — so the
   * headline can never say something the tables below contradict. The peers
   * come from call 1 because it is the only source that holds the store's
   * quiet cashiers, and "did everyone rise?" is unanswerable without them.
   */
  const weekIndex = caseWeek ?? windows.length - 1;
  const peers = buildStandings(rollupRows, windows.length).filter(
    (p) => p.storeid === core.storeid && p.saleType === selected,
  );
  const standing =
    peers.find((p) => p.cashierNumber === core.cashierNumber) ?? null;
  const verdict = decideVerdict({
    standing,
    facts,
    profile,
    items,
    saleType: selected,
    weekIndex,
    ctx: storeContext(peers, weekIndex),
  });

  const evidence = [
    profile ? hourLine(profile, selected, facts) : null,
    share ? storeLine(share, selected) : null,
    itemLine(items, facts),
  ]
    .map((text, i) => (text ? { icon: ICON_ORDER[i], text } : null))
    .filter((l): l is EvidenceLine => !!l);

  const busy = detail.loading || caseIds.loading;

  return (
    <div className="flex-shrink-0 shadow-lg" style={{ width: "63%" }}>
      <div className="bg-custom-white rounded-xl shadow-sm h-full flex flex-col overflow-hidden relative">
        <CaseHeader
          core={core}
          onBack={onBack}
          backLabel={backLabel}
          onOpenPlot={() => dispatch(setLpJourneyCashier(caseCashier))}
          view={caseView}
          onView={(v) => dispatch(setLpCaseView(v))}
        />

        {/* The week's figures lead, spanning the roster as well as the
            report — they are the store-and-week this whole panel answers for,
            and a band that starts where the roster ends reads as belonging to
            the column it sits in. Same placement as the store panel. */}
        <CaseKpis
          facts={facts}
          profile={profile}
          profileLoading={busy}
          saleType={selected}
        />

        <div className="flex-1 min-h-0 flex">
          {/* The roster. Split by the reader's own rule — over their store's
              average, the peer average, or either in money — so moving to the
              next person worth opening is one click from anywhere in the
              case, and the ones who cleared stay reachable underneath. */}
          <aside className="w-[212px] flex-shrink-0 min-h-0 flex flex-col border-r border-[#1e2a4a]/15">
            <LpWhoList
              variant="column"
              saleType={isAll(selected) ? null : selected}
              storeid={core.storeid}
              selected={caseCashier}
              showQuiet={quietOpen}
              onToggleQuiet={() => dispatch(toggleLpQuiet())}
              onOpen={(c: CashierStanding) =>
                dispatch(
                  setLpCase({
                    // Cashier numbers are issued per store, so identity is
                    // always the pair — 19 is a different person at every
                    // store.
                    ref: {
                      storeid: c.storeid,
                      cashierNumber: c.cashierNumber,
                    },
                    type: c.saleType,
                    // Opens on their worst week. The evidence is about the
                    // week that flagged; the others are the baseline it was
                    // measured against.
                    week: peakWeek(c).index,
                  }),
                )
              }
            />
          </aside>

          <div className="flex-1 min-w-0 min-h-0 flex flex-col">
            {caseView === "case" ? (
              <>
                <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
                  <CaseSummary
                    verdict={verdict}
                    finding={findingLine(type, facts)}
                    lines={evidence}
                    caution={cautionLine(items, facts)}
                  />

                  <CaseEvidence
                    types={core.types}
                    windows={windows}
                    selected={selected}
                    profile={profile}
                    profileLoading={busy}
                    profileError={detail.error ?? caseIds.error}
                  />

                  {/* Their whole record, and the control that re-points this
                      case — what the tab strip used to be, with the weeks
                      spelled out instead of folded into a multiplier. */}
                  <CaseTypeMatrix cashier={caseCashier} selected={selected} />
                </div>
              </>
            ) : (
              <>
                <CaseEvidenceBar
                  lines={evidenceLines}
                  receipts={new Set(evidenceLines.map((l) => l.sale_id)).size}
                  loading={busy}
                  scope={{
                    cashierName: core.cashierName,
                    cashierNumber: core.cashierNumber,
                    storeName: core.storeName,
                    saleType: isAll(selected) ? "All exceptions" : selected,
                    weekLabel,
                  }}
                />

                <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
                  <CaseGrids
                    items={items}
                    itemsLoading={busy}
                    itemsError={detail.error ?? caseIds.error}
                    showAllItems={showAllItems}
                    onToggleItems={() => setShowAllItems((v) => !v)}
                    rows={latestRows}
                    lines={detail.lines}
                    saleType={selected}
                    onOpenReceipt={openReceipt}
                  />

                  {detail.truncated > 0 && (
                    <div className="px-4 py-2 border-t border-gray-100 text-[12px] text-content/85">
                      {detail.truncated} receipts beyond the cap were not read
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {receipt.saleId && (
          <ReceiptCase state={receipt} onClose={closeReceipt} />
        )}
      </div>
    </div>
  );
};

export default CashierCase;
