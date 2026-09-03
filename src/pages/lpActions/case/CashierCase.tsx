import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import {
  setLpCase,
  setLpCaseRows,
  setLpJourneyCashier,
} from "../../../features/lpActionsSlice";
import { ALL_TYPES, buildCaseCore, isAll, latestWeekFacts } from "./caseModel";
import { buildStoreShare, storeShareFromGraded } from "./storeShare";
import { buildItemMovement } from "./itemMovement";
import { buildHourProfile } from "./hourProfile";
import { useCaseReceipts, type TypeScope } from "./useCaseReceipts";
import { useCaseIds } from "./useCaseIds";
import { rowsFromLines, typesForCashier } from "./caseSource";
import { isCashier } from "../lpActionsMetrics";
import {
  headlineLine,
  findingLine,
  hourLine,
  storeLine,
  itemLine,
  cautionLine,
} from "./caseNarrative";
import CaseHeader from "./CaseHeader";
import CaseTabs from "./CaseTabs";
import CaseSummary from "./CaseSummary";
import type { EvidenceIcon, EvidenceLine } from "./CaseSummary";
import CaseEvidence from "./CaseEvidence";
import CaseGrids from "./CaseGrids";
import CaseKpis from "./CaseKpis";
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

  // Lands on the exception the reader clicked, and falls back to All rather
  // than to an arbitrary first type — an unrecognised tab means the walk has
  // moved on, and the operator is the one view that is always answerable.
  const selected =
    caseType &&
    (isAll(caseType) || core?.types.some((t) => t.saleType === caseType))
      ? caseType
      : ALL_TYPES;

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

  const facts = useMemo(
    () =>
      caseCashier === null || !selected
        ? null
        : latestWeekFacts(caseRows, windows, caseCashier, selected),
    [caseRows, windows, caseCashier, selected],
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
    if (!detail.lines.length || windows.length === 0) return null;
    const last = windows[windows.length - 1];
    return buildHourProfile(detail.lines, last.start, last.end);
  }, [detail.lines, windows]);

  const latestRows = useMemo(() => {
    if (caseCashier === null || !selected || windows.length === 0) return [];
    const last = windows[windows.length - 1];
    return caseRows.filter(
      (r) =>
        isCashier(r, caseCashier) &&
        (isAll(selected) || r.sale_type === selected) &&
        r.sale_date.slice(0, 10) >= last.start &&
        r.sale_date.slice(0, 10) <= last.end,
    );
  }, [caseRows, windows, caseCashier, selected]);

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

  const evidence = [
    profile ? hourLine(profile, selected, facts) : null,
    share ? storeLine(share, selected) : null,
    itemLine(items, facts),
  ]
    .map((text, i) => (text ? { icon: ICON_ORDER[i], text } : null))
    .filter((l): l is EvidenceLine => !!l);

  return (
    <div className="flex-shrink-0 shadow-lg" style={{ width: "63%" }}>
      <div className="bg-custom-white rounded-xl shadow-sm h-full flex flex-col overflow-hidden relative">
        <CaseHeader
          core={core}
          onBack={onBack}
          backLabel={backLabel}
          onOpenPlot={() => dispatch(setLpJourneyCashier(caseCashier))}
        />

        <CaseTabs
          all={core.all}
          types={core.types}
          selected={selected}
          onSelect={(t) => dispatch(setLpCase({ ref: caseCashier, type: t }))}
        />

        <CaseKpis
          facts={facts}
          profile={profile}
          profileLoading={detail.loading || caseIds.loading}
          saleType={selected}
        />

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
          <CaseSummary
            type={type}
            headline={headlineLine(type, core.types.length)}
            finding={findingLine(type, facts)}
            lines={evidence}
            caution={cautionLine(items, facts)}
          />

          <CaseEvidence
            types={core.types}
            windows={windows}
            selected={selected}
            profile={profile}
            profileLoading={detail.loading || caseIds.loading}
            profileError={detail.error ?? caseIds.error}
          />

          <CaseGrids
            items={items}
            itemsLoading={detail.loading || caseIds.loading}
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

        {receipt.saleId && (
          <ReceiptCase state={receipt} onClose={closeReceipt} />
        )}
      </div>
    </div>
  );
};

export default CashierCase;
