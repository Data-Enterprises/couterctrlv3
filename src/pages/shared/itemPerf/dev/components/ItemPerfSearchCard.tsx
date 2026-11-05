// Hooks
import { useAppDispatch, useAppSelector } from "../../../../../hooks";
import { useItemPerfCtx } from "../hooks";

// Redux
import {
  setItemPerfHasSearched,
  setItemPerfStore,
} from "../../../../../features/dev/devItemPerfSlice";

// Components
import SingleStoreSearchCard from "../../../../../components-dev/SingleStoreSearchCard";
import SingleDatePicker from "../../../../../components-dev/datePickers/SingleDatePicker";

interface ItemPerfSearchCardProps {
  title: string;
  onSearch: () => void;
}

/** The search card: the first visit, a return via the range chip, or a
 *  search that came back empty. */
const ItemPerfSearchCard = ({ title, onSearch }: ItemPerfSearchCardProps) => {
  const dispatch = useAppDispatch();
  const perf = useAppSelector((s) => s.dev.itemPerf);
  const assignedStores = useAppSelector((s) => s.user.assignedStores);
  const { listLabel } = useItemPerfCtx();
  return (
    <div className="flex h-[calc(100dvh-3rem)] items-start justify-center overflow-y-auto p-4">
      <SingleStoreSearchCard
        title={title}
        description="Select a store and week ending date."
        buttonLabel="Load items"
        stores={assignedStores}
        selectedStoreId={perf.storeId}
        onStoreSelect={(id) => dispatch(setItemPerfStore(id))}
        onSearch={onSearch}
        loading={perf.loading}
        loadingMessage="Loading items..."
        datePicker={<SingleDatePicker />}
        onBack={
          // Only when there is something to go back TO. Landing here for the
          // first time has no results behind it.
          perf.itemsTy.length > 0
            ? () => dispatch(setItemPerfHasSearched(true))
            : undefined
        }
        backLabel={`Back to ${listLabel.toLowerCase()}`}
        notice={
          perf.hasSearched
            ? "No items found for that store and week."
            : undefined
        }
      />
    </div>
  );
};

export default ItemPerfSearchCard;
