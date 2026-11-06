// Components
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import MobileSortChips from "../../../../components-dev/mobile/MobileSortChips";

interface Props {
  value: "amount" | "qty";
  onChange: (v: "amount" | "qty") => void;
  onExport: () => void;
}

/**
 * The sort chips above a coupon list, with Export on the end of the row
 * (`PerfCardHeader` has no actions slot for it).
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
