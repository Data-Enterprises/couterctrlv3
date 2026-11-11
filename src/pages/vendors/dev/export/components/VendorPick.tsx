// Interfaces
import type { VendorRow } from "../../utils";

// Components
import MultiSelectFilter from "../../../../../components-dev/filters/MultiSelectFilter";

interface VendorPickProps {
  rows: VendorRow[];
  value: string[];
  onChange: (v: string[]) => void;
}

/** Which vendors the two store-wide datasets cover; empty means all. */
const VendorPick = ({ rows, value, onChange }: VendorPickProps) => {
  return (
    <div className="flex items-center gap-2 pt-3 border-t border-line_hair">
      <span className="text-[11px] text-content">Vendors</span>
      <MultiSelectFilter
        options={rows.map((v) => ({
          label: v.vendorName,
          value: v.vendorId,
        }))}
        values={value}
        onChange={onChange}
        placeholder="All vendors"
        noun="vendors"
        className="w-[220px]"
      />
      <span className="text-[10px] text-content">
        Applies to both datasets below.
      </span>
    </div>
  );
};

export default VendorPick;
