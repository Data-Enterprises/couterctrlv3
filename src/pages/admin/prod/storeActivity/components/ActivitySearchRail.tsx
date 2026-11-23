// Interfaces
import type { Company } from "../../../../../interfaces";

// Components
import DatePickers from "../../../../../components/datePickers/DatePickers";
import CompanyPicker from "./CompanyPicker";

interface ActivitySearchRailProps {
  companies: Company[];
  /** The picked company's id, 0 for none. */
  selectedId: number;
  onSelect: (id: number) => void;
  onSearch: () => void;
}

/** Store activity's left rail: the dates, Search (off until a company is
 *  picked) and the company list. */
const ActivitySearchRail = ({
  companies,
  selectedId,
  onSelect,
  onSearch,
}: ActivitySearchRailProps) => (
  <div className="flex flex-col flex-shrink-0">
    <div
      className="border-r border-line_hair p-3 flex-shrink-0"
      style={{ width: "220px" }}
    >
      {/* `data-help` is what the help panel points at */}
      <div data-help="dates">
        <DatePickers showBtn={false} stacked />
      </div>
      <button
        data-help="search"
        onClick={onSearch}
        disabled={selectedId === 0}
        className={`mt-2 w-full text-[12px] font-medium py-1.5 rounded-md transition-colors text-custom-white ${
          selectedId > 0
            ? "bg-brand_navy hover:bg-brand_navy_hover"
            : "bg-fill_track_strong cursor-not-allowed"
        }`}
      >
        Search
      </button>
    </div>
    <CompanyPicker
      helpAnchor="company"
      companies={companies}
      selectedId={selectedId}
      onSelect={onSelect}
    />
  </div>
);

export default ActivitySearchRail;
