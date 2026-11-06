// Interfaces
import type { VendorOption } from "../../../interfaces";

/**
 * The vendor on an added line.
 *
 * `items/itemlookup` returns the item but not a `vendor_id`, and `vendor_id`
 * is `NOT NULL` on the order — so it is asked for rather than guessed. The
 * options are the vendors already on this store's orders, because a vendor id
 * the POS does not know is worse than no line at all.
 */
const VendorField = ({
  value,
  vendors,
  onChange,
}: {
  value: string;
  vendors: VendorOption[];
  onChange: (vendorId: string) => void;
}) => (
    <select
      value={value}
      aria-label="Vendor for the added line"
      onChange={(e) => onChange(e.target.value)}
      className={`w-[142px] rounded-[5px] border bg-custom-white px-1 py-0.5 text-[11px] text-content ${
        value ? "border-brand_green" : "border-brand_line_2"
      }`}
      style={{ outline: "none" }}
    >
      <option value="">Vendor…</option>
      {vendors.map((v) => (
        <option key={v.id} value={v.id} title={v.id}>
          {v.name}
        </option>
      ))}
    </select>
);

export default VendorField;
