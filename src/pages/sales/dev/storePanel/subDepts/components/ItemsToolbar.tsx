// Hooks
import { useAppDispatch } from "../../../../../../hooks";
import { useSalesCtx } from "../../../hooks";

// Redux
import { setItemThreshold } from "../../../../../../features/dev/devSalesLedgerSlice";

// Interfaces
import type { SevFilter } from "../../../utils/index";

// Components
import SeverityChips from "../../../components/SeverityChips";
import ThresholdChip from "../../../components/ThresholdChip";
import TextFilter from "../../../../../../components-dev/filters/TextFilter";
import SelectFilter from "../../../../../../components-dev/filters/SelectFilter";

interface ItemsToolbarProps {
  sevFilter: SevFilter;
  onSevFilter: (f: SevFilter) => void;
  counts: { critical: number; watch: number; healthy: number };
  text: string;
  onText: (v: string) => void;
  activeFilter: string;
  onActiveFilter: (v: string) => void;
}

/** Above the item list: grade chips, the item threshold, a UPC/description
 *  search and the active/inactive picker. */
const ItemsToolbar = ({
  sevFilter,
  onSevFilter,
  counts,
  text,
  onText,
  activeFilter,
  onActiveFilter,
}: ItemsToolbarProps) => {
  const dispatch = useAppDispatch();
  const { itemThreshold, inactiveSubDeptItems } = useSalesCtx();
  return (
    <div className="flex items-center justify-between gap-1 px-3 py-1 bg-gray-100 border-b border-gray-100 flex-shrink-0">
      <div className="flex items-center gap-1">
        <SeverityChips value={sevFilter} onChange={onSevFilter} counts={counts} />
        <ThresholdChip
          value={itemThreshold}
          onChange={(v) => dispatch(setItemThreshold(v))}
          ariaLabel="Item grading threshold, percent"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-[140px]">
          <TextFilter value={text} onChange={onText} placeholder="UPC/Desc" />
        </div>
        <div data-help="inactive-filter">
          <SelectFilter
            options={[
              { label: "Active", value: "active" },
              {
                label: `Inactive (${inactiveSubDeptItems.length})`,
                value: "inactive",
              },
            ]}
            value={activeFilter}
            onChange={onActiveFilter}
            placeholder="All items"
            className="w-[110px]"
          />
        </div>
      </div>
    </div>
  );
};

export default ItemsToolbar;
