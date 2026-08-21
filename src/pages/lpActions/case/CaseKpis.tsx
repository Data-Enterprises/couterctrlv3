import { formatCurrency2, formatDateSimple } from "../../../utils";
import { hourLabel } from "./chartTheme";
import { peakHourOf } from "./hourProfile";
import type { HourProfile } from "./hourProfile";
import type { TypeFacts } from "./caseModel";

/**
 * The selected week, in five numbers.
 *
 * Directly under the tabs because these are the facts the tab changes — the
 * header above carries the operator, which does not. Peak day and peak hour
 * earn their place by being the two the prose can only claim conditionally:
 * the sentences below refuse to call four hours a cluster, but a reader still
 * wants to know when the week concentrated.
 */
interface Props {
  facts: TypeFacts;
  profile: HourProfile | null;
  profileLoading: boolean;
  saleType: string;
}

const Kpi = ({
  value,
  label,
  sub,
}: {
  value: string;
  label: string;
  sub?: string;
}) => (
  <div className="flex-1 min-w-0 px-3 py-1.5 border-r border-gray-100 last:border-r-0">
    <div className="text-[15px] font-semibold tabular-nums text-content leading-tight truncate">
      {value}
    </div>
    <div className="text-[10.5px] uppercase tracking-wide text-content/85 truncate">
      {label}
      {sub ? <span className="normal-case"> · {sub}</span> : null}
    </div>
  </div>
);

const CaseKpis = ({ facts, profile, profileLoading, saleType }: Props) => {
  const peakHour = profile ? peakHourOf(profile, saleType) : null;

  return (
    <div className="flex items-stretch border-b border-gray-100 bg-gray-50">
      <Kpi value={String(facts.occurrences)} label="this week" />
      <Kpi value={String(facts.receipts)} label="receipts" />
      <Kpi value={formatCurrency2(facts.value)} label="value" />
      <Kpi
        value={facts.peakDay ? formatDateSimple(facts.peakDay) : "—"}
        label="peak day"
        sub={facts.peakDay ? String(facts.peakDayCount) : undefined}
      />
      <Kpi
        value={
          peakHour && peakHour.hour >= 0
            ? hourLabel(peakHour.hour)
            : profileLoading
              ? "…"
              : "—"
        }
        label="peak hour"
        sub={
          peakHour && peakHour.hour >= 0 ? String(peakHour.count) : undefined
        }
      />
    </div>
  );
};

export default CaseKpis;
