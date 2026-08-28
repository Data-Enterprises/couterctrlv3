import { useMemo } from "react";
import { useAppSelector } from "../../../../hooks";
import { isCashier } from "../../lpActionsMetrics";
import { useCaseReceipts } from "../../case/useCaseReceipts";
import { buildTypeScopes } from "../caseScopes";
import StackedBarChart from "./StackedBarChart";
import ChartLegend from "./ChartLegend";
import ChartCard from "./ChartCard";
import {
  byShift,
  byWeekday,
  byHour,
  baselinePerDay,
  stackOrder,
} from "./chartsModel";
import type { CaseFile } from "../caseFileModel";

/**
 * Where this week's exceptions actually fell.
 *
 * The cards above state the numbers; these say whether they cluster. Same
 * claim, twice — which is why there is no heading between them.
 *
 * Two of the three draw immediately from rows already in hand. The hour chart
 * needs `sale_start_time`, which only exists on receipt lines, so this
 * component starts that read as soon as a case opens rather than waiting for
 * someone to reach the transactions half. The panel is on screen either way,
 * and by the time anyone gets to the evidence the answer is already cached.
 */
interface Props {
  file: CaseFile;
}

const CaseCharts = ({ file }: Props) => {
  const { rawRows, windows, caseCashier } = useAppSelector((s) => s.lpActions);

  const scopes = useMemo(
    () => buildTypeScopes(rawRows, caseCashier),
    [rawRows, caseCashier],
  );
  const receipts = useCaseReceipts(scopes);

  const mine = useMemo(
    () =>
      caseCashier === null
        ? []
        : rawRows.filter((r) => isCashier(r, caseCashier)),
    [rawRows, caseCashier],
  );

  /** Only the types this operator actually touched get a series. A legend
   *  listing four zeroes is noise; the zero CARDS above already make that
   *  point, in the one place it reads as an answer. */
  const types = useMemo(
    () => stackOrder(file.cards.filter((c) => c.count > 0).map((c) => c.saleType)),
    [file.cards],
  );

  const counts = useMemo(
    () =>
      Object.fromEntries(file.cards.map((c) => [c.saleType, c.count])) as Record<
        string,
        number
      >,
    [file.cards],
  );

  const window = windows[windows.length - 1];

  const latestRows = useMemo(() => {
    if (!window) return [];
    return mine.filter((r) => {
      const day = r.sale_date.slice(0, 10);
      return day >= window.start && day <= window.end;
    });
  }, [mine, window]);

  const shift = useMemo(
    () => (window ? byShift(latestRows, window, types) : []),
    [latestRows, window, types],
  );
  const weekday = useMemo(() => byWeekday(mine, types), [mine, types]);
  const hours = useMemo(
    () => byHour(receipts.lines, types),
    [receipts.lines, types],
  );

  const perDay = window ? baselinePerDay(file.headline.baseline, window) : 0;

  if (types.length === 0) return null;

  return (
    <div className="mt-3.5 flex flex-col gap-2.5">
      <ChartCard
        title="Exceptions per shift"
        caption={`${window?.start ?? ""} – ${window?.end ?? ""} · stacked by type · shaded columns are weekends`}
      >
        <ChartLegend types={types} counts={counts} />
        <StackedBarChart
          categories={shift}
          types={types}
          barWidth={30}
          reference={{
            value: perDay,
            label: `their baseline ${perDay.toFixed(1)} / day`,
          }}
          label="Exceptions per shift, stacked by exception type"
        />
      </ChartCard>

      <div className="grid gap-2.5 grid-cols-[repeat(auto-fit,minmax(320px,1fr))]">
        <ChartCard
          title="By hour of day"
          caption="Trading hours only · from the receipt lines"
          loading={receipts.loading && hours.length === 0}
          empty={
            !receipts.loading && hours.length === 0
              ? receipts.error ?? "No timed lines came back for this operator."
              : undefined
          }
        >
          <StackedBarChart
            categories={hours}
            types={types}
            width={392}
            height={172}
            barWidth={18}
            label="Exceptions by hour of day"
          />
        </ChartCard>

        <ChartCard
          title="By day of week"
          caption={`All ${windows.length} weeks · weekends shaded`}
        >
          <StackedBarChart
            categories={weekday}
            types={types}
            width={392}
            height={172}
            barWidth={26}
            label="Exceptions by day of week"
          />
        </ChartCard>
      </div>
    </div>
  );
};

export default CaseCharts;
