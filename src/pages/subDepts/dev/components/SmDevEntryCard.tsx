// Hooks
import { useAppDispatch } from "../../../../hooks";
import { useSubMarginCtx, useSubMarginActions } from "../hooks";

// Components
import SingleDatePicker from "../../../../components-dev/datePickers/SingleDatePicker";
import SingleStoreSearchCard from "../../../../components-dev/SingleStoreSearchCard";

interface SmDevEntryCardProps {
  onSearch: () => void;
  notice?: string;
}

/** The Sub Dept Margins start screen: a centred card to pick a store and week ending date, then Search. */
const SmDevEntryCard = ({ onSearch, notice }: SmDevEntryCardProps) => {
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const ctx = useSubMarginCtx();

  return (
    <div className="h-[calc(100vh-3rem)] flex items-center justify-center mx-4 pb-12">
      <SingleStoreSearchCard
        title="Sub Dept Margins"
        description="Select a store and week ending date to load sub departments."
        buttonLabel="Search"
        stores={ctx.assignedStores}
        selectedStoreId={ctx.searchValue}
        onStoreSelect={(id) => dispatch(actions.setSearchValue(id))}
        onSearch={onSearch}
        loading={ctx.loadingSubDepts}
        loadingMessage="Finding sub dept margins..."
        datePicker={<SingleDatePicker />}
        notice={notice}
      />
    </div>
  );
};

export default SmDevEntryCard;
