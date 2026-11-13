// Interfaces
import type { CouponItem } from "../../../../../../interfaces";
import type { AggRow, GridFilters } from "../interfaces";

// Components
import GridHeader from "./GridHeader";
import CouponRow from "./CouponRow";

interface CouponGridProps {
  gridRows: CouponItem[];
  selectedSection: string | null;
  filters: GridFilters;
  aggCouponRows: AggRow[];
  expandedCoupons: Set<string>;
  toggleCoupon: (key: string) => void;
  handleRowClick: (row: CouponItem) => void;
}

/** The coupons in the picked group, one row per coupon. */
const CouponGrid = ({
  gridRows,
  selectedSection,
  filters,
  aggCouponRows,
  expandedCoupons,
  toggleCoupon,
  handleRowClick,
}: CouponGridProps) => (
    <>
      {gridRows.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[12px] text-content/95">
            {selectedSection
              ? "No coupons to display"
              : "Select a group to drill down"}
          </span>
        </div>
      ) : (
        <div className="flex-1 overflow-auto thin-scrollbar">
          <table data-help="products" className="w-full border-collapse text-[12px]">
            <thead>
              <GridHeader filters={filters} />
            </thead>
            <tbody className="divide-y divide-brand_navy/15 text-[13px]">
              {aggCouponRows.map((agg, idx) => {
                const isExp = expandedCoupons.has(agg.product_code);
                return (
                  <CouponRow
                    key={agg.product_code}
                    agg={agg}
                    idx={idx}
                    isExp={isExp}
                    toggleCoupon={toggleCoupon}
                    handleRowClick={handleRowClick}
                  />
                );
              })}
              {aggCouponRows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-[12px] text-content/95"
                  >
                    No results match the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
);

export default CouponGrid;
