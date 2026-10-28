import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import MobileSortChips from "../../../../components-dev/mobile/MobileSortChips";

interface Props {
  value: "amount" | "qty";
  onChange: (v: "amount" | "qty") => void;
  onExport: () => void;
}

/**
 * The sort chips above a coupon list, with Export on the end of the row.
 *
 * Sort used to be a two-button toggle in the navy header's `actions` slot,
 * wearing white-on-navy because that is where it lived. Off the navy it is an
 * ordinary list control and takes `MobileSortChips`, the same row every other
 * mobile list sorts with.
 *
 * EXPORT SITS HERE, which is a compromise worth naming. `PerfCardHeader` has
 * slots for search, help and the title picker and no general actions slot —
 * the Performance pages have nothing to export. Rather than widen a component
 * four other pages depend on, the button rides the control row. Coupons,
 * Orders and Receivers are the only mobile pages that export and the only
 * three still on the navy header, so the header's `actions` slot is precisely
 * what has kept them there; if the other two follow, the better answer may be
 * to give `PerfCardHeader` that slot and move all three at once.
 */
const CpnListControls = ({ value, onChange, onExport }: Props) => (
  <div className="flex items-center border-b border-brand_line">
    <div className="min-w-0 flex-1">
      <MobileSortChips
        options={[
          { key: "amount", label: "Amount" },
          { key: "qty", label: "Qty" },
        ]}
        value={value}
        onChange={onChange}
      />
    </div>
    <button
      type="button"
      onClick={onExport}
      aria-label="Export CSV"
      title="Export CSV"
      className="mr-2.5 flex h-7 w-7 flex-none items-center justify-center rounded border border-gray-200 text-content/95 active:bg-bkg"
    >
      <ArrowDownTrayIcon className="h-3.5 w-3.5" />
    </button>
  </div>
);

export default CpnListControls;
