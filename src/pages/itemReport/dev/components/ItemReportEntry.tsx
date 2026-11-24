// Hooks
import { useItemReportCtx } from "../hooks";

// Utils
import { RECEIVING_LOOKBACK_DAYS, WINDOW_DAYS } from "../utils";

// Interfaces
import type { Store } from "../../../../interfaces";

// Components
import SingleStoreSearchCard from "../../../../components-dev/SingleStoreSearchCard";
import SingleDatePicker from "../../../../components-dev/datePickers/SingleDatePicker";
import UpcListField from "./UpcListField";

interface ItemReportEntryProps {
  stores: Store[];
  storeId: number;
  onStoreSelect: (id: number) => void;
  onRun: (upcs: string[], departments: string[]) => void;
  loading: boolean;
  loadingMessage: string;
}

/**
 * The entry screen: a store, a week, and a list of UPCs.
 *
 * The date is a single week-ending picker, not a range — the same contract the
 * graded pages work to. Every window on this page is seven days, so letting
 * someone pick an arbitrary range would only give them a way to make the three
 * periods incomparable.
 *
 * The UPC input copies the UPC List card exactly: a paste box, Add / Upload CSV
 * / Clear all, and chips for what's been collected. That page is where these
 * users already build lists, and a second, different upload affordance in the
 * same nav category is a thing to relearn for no reason.
 */
const ItemReportEntry = ({
  stores,
  storeId,
  onStoreSelect,
  onRun,
  loading,
  loadingMessage,
}: ItemReportEntryProps) => {
  const { pendingUpcs: upcs, pendingDepartments: departments } =
    useItemReportCtx();

  return (
    <SingleStoreSearchCard
      title="Item Actions"
      description="Upload a UPC list exported from Sub Dept Margins or Vendors to get a suggested next step for each item, with the deliveries, prices and sales behind it."
      buttonLabel="Build actions"
      stores={stores}
      selectedStoreId={storeId}
      onStoreSelect={onStoreSelect}
      onSearch={() => onRun(upcs, departments)}
      // A list is required, not optional. The report answers for the codes it
      // is given and nothing else, and the fetch now asks the API for exactly
      // those — so without one there is no question to ask. It used to read
      // the whole store and then keep none of it.
      blockedLabel={upcs.length === 0 ? "Add a UPC list" : undefined}
      loading={loading}
      loadingMessage={loadingMessage}
      datePicker={
        <div className="flex flex-col gap-1.5">
          <SingleDatePicker />
          <span className="text-[10.5px] text-content/95 leading-snug">
            The {WINDOW_DAYS} days ending on that date, against the same week
            last week and last year. Deliveries are read back{" "}
            {RECEIVING_LOOKBACK_DAYS} days.
          </span>
        </div>
      }
      fields={<UpcListField />}
    />
  );
};

export default ItemReportEntry;
