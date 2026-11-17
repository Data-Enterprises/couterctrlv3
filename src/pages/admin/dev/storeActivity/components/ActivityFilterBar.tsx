// Components
import TextFilter from "../../../../../components-dev/filters/TextFilter";

interface ActivityFilterBarProps {
  storeNameFilter: string;
  onFilter: (value: string) => void;
  onMissing: () => void;
  onAll: () => void;
}

/** Over the activity rows: a store search, View all missing and View all. */
const ActivityFilterBar = ({
  storeNameFilter,
  onFilter,
  onMissing,
  onAll,
}: ActivityFilterBarProps) => (
  <div className="flex items-center gap-2 px-3 py-2 border-b border-line_hair flex-shrink-0">
    <TextFilter
      value={storeNameFilter}
      onChange={onFilter}
      placeholder="Search stores…"
    />
    <button
      data-help="missing-filter"
      onClick={onMissing}
      className="text-[10px] font-medium text-brand_navy border border-line_field rounded-md px-2.5 py-1.5 flex-shrink-0"
    >
      View all missing
    </button>
    <button
      onClick={onAll}
      className="text-[10px] font-medium text-content px-2.5 py-1.5 flex-shrink-0"
    >
      View all
    </button>
  </div>
);

export default ActivityFilterBar;
