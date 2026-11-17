// Hooks
import { useMemo } from "react";

// Utils
import {
  contributionOf,
  deptRollups,
  topItemsTotals,
  type TopItemCompared,
} from "../utils/topItems";

// Components
import DeptShareList from "./components/DeptShareList";
import TotalsStrip from "./components/TotalsStrip";

interface Top200LandingProps {
  ranked: TopItemCompared[];
  /** The store's own net sales for each period, which the shares are of. */
  netSales: { ty: number; lw: number | null; ly: number | null };
  oneDay: boolean;
  start: string;
  end: string;
  lwStart: string;
  lwEnd: string;
  lyStart: string;
  lyEnd: string;
}

/** What the right side shows before an item is picked: the three periods'
 *  totals and shares, and where the week's money came from by department.
 *  Rolled up from the rows already on screen, so it costs no call and cannot
 *  disagree with the list beside it. */
const Top200Landing = ({
  ranked,
  netSales,
  oneDay,
  start,
  end,
  lwStart,
  lwEnd,
  lyStart,
  lyEnd,
}: Top200LandingProps) => {
  const rollups = useMemo(() => deptRollups(ranked), [ranked]);
  const totals = useMemo(() => topItemsTotals(ranked), [ranked]);

  /** The share of each period's week these items carried. */
  const share = useMemo(
    () => ({
      ty: contributionOf(totals.ty, netSales.ty),
      lw: contributionOf(totals.lw, netSales.lw),
      ly: contributionOf(totals.ly, netSales.ly),
    }),
    [totals, netSales],
  );
  const landing = useMemo(() => {
    const byMoney = [...rollups].sort((a, b) => b.ty - a.ty);
    // Every department, biggest first: the list is short enough to read
    // whole, and a tail folded into "8 more" hid where the rest went.
    return {
      shown: byMoney,
      // The bar runs against the biggest department, not against the whole
      // list: scaled to the total, most of the bars would be stubs.
      top: byMoney.length ? byMoney[0].ty : 0,
      total: byMoney.reduce((n, d) => n + d.ty, 0),
    };
  }, [rollups]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <TotalsStrip
        oneDay={oneDay}
        start={start}
        end={end}
        lwStart={lwStart}
        lwEnd={lwEnd}
        lyStart={lyStart}
        lyEnd={lyEnd}
        totals={totals}
        share={share}
      />

      <DeptShareList landing={landing} />
    </div>
  );
};

export default Top200Landing;
