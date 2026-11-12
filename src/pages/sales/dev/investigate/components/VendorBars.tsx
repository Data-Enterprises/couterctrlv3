// Interfaces
import type { VendorShare } from "../utils/investigationSteps";

interface VendorBarsProps {
  vendors: VendorShare[];
  /** The page's metric: dollars, or units on Quantity. */
  fmt: (v: number) => string;
  onVendor: (vendor: string) => void;
}

/** The shortfall by vendor, every vendor, scrolling inside its slide when
 *  there are more than fit. Picking one narrows the items to it. */
const VendorBars = ({ vendors, fmt, onVendor }: VendorBarsProps) => {
  const widest = Math.max(1, Math.abs(vendors[0]?.dollars ?? 0));
  return (
    <div className="cc-scroll flex flex-col gap-1.5 pr-1">
      {vendors.map((v) => (
        <button
          key={v.vendorName}
          onClick={() => onVendor(v.vendorName)}
          className="flex items-center gap-2.5 text-left rounded px-1 py-0.5 hover:bg-bkg transition-colors"
        >
          <span className="w-[120px] flex-shrink-0 truncate text-[12.5px] text-content">
            {v.vendorName}
          </span>
          <span className="flex-1 min-w-0 h-[15px] rounded-sm bg-bkg">
            <span
              className="block h-[15px] rounded-sm bg-red-500"
              style={{ width: `${(Math.abs(v.dollars) / widest) * 100}%` }}
            />
          </span>
          <span className="w-[80px] flex-shrink-0 text-right text-[12.5px] font-bold tabular-nums text-delta_negative_text">
            {"−"}
            {fmt(Math.abs(v.dollars))}
          </span>
        </button>
      ))}
    </div>
  );
};

export default VendorBars;
