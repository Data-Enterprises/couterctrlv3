import { useEffect, useMemo, useState } from "react";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";
import { computeUpcSalesCompStats } from "./salesCompStats";
import SalesCompLeftList from "./SalesCompLeftList";
import SalesCompDetailPanel from "./SalesCompDetailPanel";

const SalesCompTab = () => {
  const ctx = useUpcDevCtx();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return ctx.selectedUpcs.length > 0
      ? ctx.salesComp.filter((s) => ctx.selectedUpcs.includes(s.product_code))
      : ctx.salesComp;
  }, [ctx.salesComp, ctx.selectedUpcs]);

  const filteredLY = useMemo(() => {
    return ctx.selectedUpcs.length > 0
      ? ctx.salesCompLY.filter((s) => ctx.selectedUpcs.includes(s.product_code))
      : ctx.salesCompLY;
  }, [ctx.salesCompLY, ctx.selectedUpcs]);

  const upcCodes = useMemo(
    () => [...new Set(filtered.map((r) => r.product_code))],
    [filtered],
  );

  const upcStats = useMemo(
    () => computeUpcSalesCompStats(upcCodes, filtered, filteredLY, ctx.endDate),
    [upcCodes, filtered, filteredLY, ctx.endDate],
  );

  // Keep the detail panel pointed at a valid item — default to the first
  // one on load, and re-pick whenever the current selection drops out of
  // the filtered set (e.g. a re-search or UPC deselect).
  useEffect(() => {
    if (!upcStats.length) {
      setSelectedCode(null);
      return;
    }
    if (!selectedCode || !upcStats.some((s) => s.code === selectedCode)) {
      setSelectedCode(upcStats[0].code);
    }
  }, [upcStats, selectedCode]);

  if (!filtered.length) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/85">
        No sales comparison data
      </div>
    );
  }

  const selectedStats =
    upcStats.find((s) => s.code === selectedCode) ?? upcStats[0];

  return (
    <div className="flex-1 overflow-hidden flex min-h-0">
      <SalesCompLeftList
        stats={upcStats}
        selectedCode={selectedCode}
        onSelect={setSelectedCode}
      />
      {selectedStats && <SalesCompDetailPanel stats={selectedStats} />}
    </div>
  );
};

export default SalesCompTab;
