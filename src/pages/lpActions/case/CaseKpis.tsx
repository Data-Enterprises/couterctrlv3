import { formatCurrency2, formatDateSimple } from "../../../utils";
import KpiTileGrid, { type KpiCell } from "../../../components/KpiTileGrid";
import { hourLabel } from "./chartTheme";
import { peakHourOf } from "./hourProfile";
import type { HourProfile } from "./hourProfile";
import type { TypeFacts } from "./caseModel";

/**
 * The selected week, in four figures.
 *
 * Directly under the tabs because these are the facts the tab changes — the
 * header above carries the operator, which does not. Peak day and peak hour
 * earn their place by being the two the prose can only claim conditionally:
 * the sentences below refuse to call four hours a cluster, but a reader still
 * wants to know when the week concentrated.
 *
 * Rendered by the shared band, so this strip, the store panel's above it and
 * Item Actions' are one component rather than three that drift.
 */
interface Props {
  facts: TypeFacts;
  profile: HourProfile | null;
  profileLoading: boolean;
  saleType: string;
}

const CaseKpis = ({ facts, profile, profileLoading, saleType }: Props) => {
  const peakHour = profile ? peakHourOf(profile, saleType) : null;

  const items: KpiCell[] = [
    {
      label: "This week",
      value: String(facts.occurrences),
      sub: `${facts.receipts} rcpt`,
      variant: facts.occurrences > 0 ? "down" : undefined,
      subVariant: "neutral",
    },
    {
      label: "Value",
      value: formatCurrency2(facts.value),
      sub:
        facts.largest > 0 ? `max ${formatCurrency2(facts.largest)}` : undefined,
      subVariant: "neutral",
    },
    {
      label: "Peak day",
      value: facts.peakDay ? formatDateSimple(facts.peakDay) : "—",
      sub: facts.peakDay ? String(facts.peakDayCount) : undefined,
      subVariant: "neutral",
    },
    {
      label: "Peak hour",
      value:
        peakHour && peakHour.hour >= 0
          ? hourLabel(peakHour.hour)
          : profileLoading
            ? "…"
            : "—",
      // Receipts, not lines — the hour profile folds a basket to one entry.
      // Unlabelled it sat beside a line count and read as a contradiction.
      sub:
        peakHour && peakHour.hour >= 0
          ? `${peakHour.count} ${peakHour.count === 1 ? "rcpt" : "rcpts"}`
          : undefined,
      subVariant: "neutral",
    },
  ];

  return <KpiTileGrid items={items} />;
};

export default CaseKpis;
