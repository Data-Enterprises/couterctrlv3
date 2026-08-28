import { useMemo } from "react";
import { useAppSelector } from "../../../hooks";
import { formatDateSimple } from "../../../utils";
import CaseHeader from "./CaseHeader";
import CaseKpiStrip from "./CaseKpiStrip";
import CaseBreakdown from "./CaseBreakdown";
import CaseCharts from "./charts/CaseCharts";
import CaseTabStrip from "./CaseTabStrip";
import TransactionsView from "./transactions/TransactionsView";
import CaseEmpty from "../case/CaseEmpty";
import { buildCaseFile } from "./caseFileModel";

/**
 * The case file — one operator, one period, built to be acted on or put down.
 *
 * The page arrived here from the grading, so the question is no longer "is
 * something happening": it is whether this is worth an investigation. Which
 * makes putting a case DOWN quickly as important as building one up, and is
 * why the zero-count cards, the honest "no baseline" wording and the both-ways
 * evidence summary all earn their space.
 *
 * Everything above the transactions step is derived from `rawRows`, which the
 * walk already downloaded. Opening a case, reading it and backing out costs no
 * requests at all — the receipt reads only start when someone commits to the
 * transactions half.
 */
const CaseFilePanel = () => {
  const { rawRows, windows, caseCashier, caseStep } = useAppSelector(
    (s) => s.lpActions,
  );

  const file = useMemo(
    () =>
      caseCashier === null
        ? null
        : buildCaseFile(rawRows, windows, caseCashier),
    [rawRows, windows, caseCashier],
  );

  const period = useMemo(() => {
    const last = windows[windows.length - 1];
    if (!last) return "";
    return `${formatDateSimple(last.start)} – ${formatDateSimple(last.end)}`;
  }, [windows]);

  if (!file) return <CaseEmpty />;

  return (
    <div className="flex-shrink-0 shadow-lg" style={{ width: "68%" }}>
      <div className="bg-custom-white rounded-xl shadow-sm h-full flex flex-col overflow-hidden">
        <CaseHeader headline={file.headline} period={period} />
        <CaseKpiStrip headline={file.headline} />
        <CaseTabStrip />

        {/*
          The stage: the white content between the KPI strip and the footer.
          The receipt sheet in the transactions step is bounded by THIS, not by
          the panel — it is a panel overlay, not a modal, so the header, the
          KPIs and the footer all stay live behind it.
        */}
        <div className="flex-1 min-h-0 relative overflow-hidden">
          {caseStep === "overview" ? (
            <CaseBreakdown file={file}>
              <CaseCharts file={file} />
            </CaseBreakdown>
          ) : (
            <TransactionsView file={file} />
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseFilePanel;
