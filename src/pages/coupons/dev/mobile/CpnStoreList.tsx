import { useMemo, useState } from "react";
import {
  applyStoreNumberToName,
  numbersByStoreId,
} from "../../../../utils/storeIdentity";
import { resolveStoreName } from "../../../../utils";
import { useAppSelector } from "../../../../hooks";
import type { CouponItem } from "../../../../interfaces";
import PerfCardHeader from "../../../../components-dev/mobile/perf/PerfCardHeader";
import InfoModal from "../../../../components-dev/InfoModal";
import CpnExportSheet from "./CpnExportSheet";
import CpnListControls from "./CpnListControls";
import CpnSectionRow from "./CpnSectionRow";
import CpnTotalsCard from "./CpnTotalsCard";
import { sumCouponAmount } from "../../../../utils/couponValue";

interface Props {
  coupons: CouponItem[];
  groupName: string;
  dateRangeLabel: string;
  sortMetric: "amount" | "qty";
  onSortMetric: (v: "amount" | "qty") => void;
  /** `null, null` is the "All stores" row — the whole group, unscoped. */
  onSelect: (storeId: number | null, storeNumber: string | null) => void;
  onSearch: () => void;
}

const CpnStoreList = ({
  coupons,
  groupName,
  dateRangeLabel,
  sortMetric,
  onSortMetric,
  onSelect,
  onSearch,
}: Props) => {
  const [exportOpen, setExportOpen] = useState(false);
  // Store names come from assignedStores, never the coupon payload — see
  // utils/getStoreName. groupStores covers stores in the searched group that
  // aren't personally assigned to this user, matching CouponListPanel.
  const assignedStores = useAppSelector((s) => s.user.assignedStores);
  const groupStores = useAppSelector((s) => s.user.selectedGroupStores);
  const [infoOpen, setInfoOpen] = useState(false);
  // Still needed for the All-stores row; the card derives its own.
  const totalAmount = sumCouponAmount(coupons);

  const stores = useMemo(() => {
    // Keyed on storeid + store_number — see utils/storeIdentity.
    const numbersById = numbersByStoreId(
      coupons,
      (c) => c.storeid,
      (c) => c.store_number,
    );
    const map = new Map<
      string,
      { storeId: number; storeNumber: string; name: string; rows: CouponItem[] }
    >();
    coupons.forEach((c) => {
      const key = `${c.storeid}__${c.store_number}`;
      // Rows collected first, then totalled — a running sum can't dedupe the
      // transaction-level coupon fallback. See utils/couponValue.
      const cur = map.get(key);
      if (cur) {
        cur.rows.push(c);
        return;
      }
      map.set(key, {
        storeId: c.storeid,
        storeNumber: c.store_number,
        name: applyStoreNumberToName(
          resolveStoreName(assignedStores, groupStores, c.storeid),
          c.store_number,
          numbersById[c.storeid] ?? [],
        ),
        rows: [c],
      });
    });
    const rows = Array.from(map.values()).map((v) => ({
      storeId: v.storeId,
      storeNumber: v.storeNumber,
      name: v.name,
      count: v.rows.length,
      total: sumCouponAmount(v.rows),
    }));
    return sortMetric === "qty"
      ? rows.sort((a, b) => b.count - a.count)
      : rows.sort((a, b) => b.total - a.total);
  }, [coupons, sortMetric, assignedStores, groupStores]);

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden bg-bkg">
      {/* pb-14 clears the fixed bottom tab bar. */}
      <div className="flex-1 overflow-y-auto pb-14">
        <div className="flex flex-col gap-3 p-3">
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
            <PerfCardHeader
              title="Coupons"
              label={groupName}
              when={dateRangeLabel}
              onSearch={onSearch}
              onInfo={() => setInfoOpen(true)}
            />
            <div className="h-2.5" />
          </section>

          <CpnTotalsCard coupons={coupons} caption="Coupon value this week" />

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
            <CpnListControls
              value={sortMetric}
              onChange={onSortMetric}
              onExport={() => setExportOpen(true)}
            />

            {/* Group-wide row, matching desktop's "All stores". Without it the
                group total is visible on the card above but not explorable —
                you could only ever drill into one store at a time. */}
            <CpnSectionRow
              label="All stores"
              count={coupons.length}
              total={totalAmount}
              onClick={() => onSelect(null, null)}
            />

            {stores.map(({ storeId, storeNumber, name, count, total }) => (
              <CpnSectionRow
                key={`${storeId}__${storeNumber}`}
                label={name}
                count={count}
                total={total}
                onClick={() => onSelect(storeId, storeNumber)}
              />
            ))}
          </section>
        </div>
      </div>

      <InfoModal
        page="coupons"
        isOpen={infoOpen}
        onClose={() => setInfoOpen(false)}
      />

      {exportOpen && (
        <CpnExportSheet
          onClose={() => setExportOpen(false)}
          title={groupName}
          subtitle={dateRangeLabel}
          rows={coupons}
        />
      )}
    </div>
  );
};

export default CpnStoreList;
