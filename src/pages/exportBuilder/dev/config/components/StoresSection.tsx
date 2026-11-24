// Redux
import {
  setSelectedStoreIds,
  toggleStore,
} from "../../../../../features/dev/devExportBuilderSlice";

// Utils
import { storeLabel } from "../utils";

// Interfaces
import type { AppDispatch } from "../../../../../store";
import type { ExportCtx } from "../interfaces";

// Components
import Checkbox from "../../../../../components-dev/Checkbox";
import AllNone from "./AllNone";
import ConfigRow from "./ConfigRow";

interface StoresSectionProps {
  stores: ExportCtx["stores"];
  selectedStoreIds: ExportCtx["selectedStoreIds"];
  dispatch: AppDispatch;
  isOpen: boolean;
  onToggle: () => void;
}

/** The Stores row: the loaded stores, each ticked in or out, with all/none. */
const StoresSection = ({
  stores,
  selectedStoreIds,
  dispatch,
  isOpen,
  onToggle,
}: StoresSectionProps) => (
  <ConfigRow
    label="Stores"
    isOpen={isOpen}
    onToggle={onToggle}
    summary={
      selectedStoreIds.length === stores.length
        ? `all ${stores.length}`
        : `${selectedStoreIds.length} of ${stores.length}`
    }
  >
    <div className="px-3 pb-3 flex flex-col gap-2">
      <AllNone
        onAll={() =>
          dispatch(setSelectedStoreIds(stores.map((s) => s.storeid)))
        }
        onNone={() => dispatch(setSelectedStoreIds([]))}
      />
      <div className="overflow-y-auto thin-scrollbar flex flex-col max-h-[38vh]">
        {stores.map((s) => (
          <Checkbox
            key={s.storeid}
            checked={selectedStoreIds.includes(s.storeid)}
            onChange={() => dispatch(toggleStore(s.storeid))}
            label={<span className="truncate">{storeLabel(s)}</span>}
            className="py-1.5 text-[12.5px] border-b border-brand_line last:border-0"
          />
        ))}
      </div>
    </div>
  </ConfigRow>
);

export default StoresSection;
