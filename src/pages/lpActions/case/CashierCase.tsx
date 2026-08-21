import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import {
  setLpCase,
  setLpJourneyCashier,
} from "../../../features/lpActionsSlice";
import { ALL_TYPES, buildCaseCore, isAll, latestWeekFacts } from "./caseModel";
import { buildStoreShare } from "./storeShare";
import { buildItemMovement } from "./itemMovement";
import { buildHourProfile } from "./hourProfile";
import { useCaseReceipts, type TypeScope } from "./useCaseReceipts";
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
  const { rawRows, windows, caseCashier, caseType } = useAppSelector(
    (s) => s.lpActions,
  );
  const [showAllItems, setShowAllItems] = useState(false);
  const { receipt, openReceipt, closeReceipt } = useReceiptCase();

  const core = useMemo(
    () =>
      caseCashier === null
        ? null
        : buildCaseCore(rawRows, windows, caseCashier),
    [rawRows, windows, caseCashier],
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
    if (caseCashier === null || !core) return [];
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
  }, [rawRows, caseCashier, core]);

  const detail = useCaseReceipts(scopes);

  const facts = useMemo(
    () =>
      caseCashier === null || !selected
        ? null
        : latestWeekFacts(rawRows, windows, caseCashier, selected),
    [rawRows, windows, caseCashier, selected],
  );

  const share = useMemo(
    () =>
      core && selected
        ? buildStoreShare(
            rawRows,
            windows,
            core.storeid,
            core.cashierNumber,
            selected,
          )
        : null,
    [rawRows, windows, core, selected],
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
    return rawRows.filter(
      (r) =>
        isCashier(r, caseCashier) &&
        (isAll(selected) || r.sale_type === selected) &&
        r.sale_date.slice(0, 10) >= last.start &&
        r.sale_date.slice(0, 10) <= last.end,
    );
  }, [rawRows, windows, caseCashier, selected]);

  if (!core || !facts || caseCashier === null) return null;

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
          profileLoading={detail.loading}
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
            profileLoading={detail.loading}
            profileError={detail.error}
          />

          <CaseGrids
            items={items}
            itemsLoading={detail.loading}
            itemsError={detail.error}
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
