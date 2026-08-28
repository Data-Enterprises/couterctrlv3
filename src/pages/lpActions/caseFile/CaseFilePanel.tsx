import { useMemo } from "react";
import { useAppSelector } from "../../../hooks";
import { formatDateSimple } from "../../../utils";
import CaseHeader from "./CaseHeader";
import CaseBreakdown from "./CaseBreakdown";
import CaseCharts from "./charts/CaseCharts";
import CaseTabStrip from "./CaseTabStrip";
import CaseSummaryStrip from "./CaseSummaryStrip";
import TransactionsView from "./transactions/TransactionsView";
import CaseEmpty from "../case/CaseEmpty";
import { buildCaseFile } from "./caseFileModel";
import { buildContribution } from "./contributionModel";

/**
 * The case file — one operator, one period, built to be acted on or put down.
 *
 * The page arrived here from the grading, so the question is no longer "is
 * something happening": it is whether this is worth an investigation. Which
 * makes putting a case DOWN quickly as important as building one up, and is
 * why the zero-count cards, the honest "no baseline" wording and the both-ways
 * evidence summary all earn their space.
 *
 * There is no KPI strip. Exceptions, value, quantity and receipts all sit in
 * the table's own Totals row, and a strip repeating them above the table it
 * summarised was one band of chrome saying what the next band already said.
 *
 * Everything above the transactions step is derived from `rawRows`, which the
 * walk already downloaded. Opening a case, reading it and backing out costs no
 * requests at all — the receipt reads only start when someone commits to the
 * transactions half.
 */
const CaseFilePanel = () => {
  const { rawRows, windows, caseSubject, caseStep } = useAppSelector(
    (s) => s.lpActions,
  );

  const file = useMemo(
    () =>
      caseSubject === null
        ? null
        : buildCaseFile(rawRows, windows, caseSubject),
    [rawRows, windows, caseSubject],
  );

  /** Built here rather than in each consumer: the strip quotes the leading
   *  contributor and the panel draws all of them, and two builds of the same
   *  decomposition would be two chances to disagree about it. */
  const view = useMemo(
    () => (file === null ? null : buildContribution(file)),
    [file],
  );

  /** The week everything on the Summary tab is about. */
  const latest = windows[windows.length - 1];

  const period = useMemo(
    () =>
      latest
        ? `${formatDateSimple(latest.start)} – ${formatDateSimple(latest.end)}`
        : "",
    [latest],
  );

  if (!file || !view) return <CaseEmpty />;

  return (
    <div className="flex-shrink-0 shadow-lg" style={{ width: "65%" }}>
      <div className="bg-custom-white rounded-xl shadow-sm h-full flex flex-col overflow-hidden">
        <CaseHeader headline={file.headline} period={period} />
        <CaseTabStrip />
        {/* Under the tabs rather than inside them: the verdict on the operator
            is as true while you are reading the evidence as it is on the
            summary, and it costs one row to keep it there. */}
        <CaseSummaryStrip
          headline={file.headline}
          view={view}
        />

        {/*
          The stage: the white content between the KPI strip and the footer.
          The receipt sheet in the transactions step is bounded by THIS, not by
          the panel — it is a panel overlay, not a modal, so the header, the
          KPIs and the footer all stay live behind it.
        */}
        <div className="flex-1 min-h-0 relative overflow-hidden">
          {caseStep === "overview" ? (
            <CaseBreakdown file={file} window={latest} view={view}>
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
