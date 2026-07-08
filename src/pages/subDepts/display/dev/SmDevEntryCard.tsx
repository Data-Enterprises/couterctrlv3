import { useAppDispatch } from "../../../../hooks";
import { useSubMarginCtx } from "../../hooks";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import SingleDatePicker from "../../../../components/datePickers/SingleDatePicker";
import SingleStoreSearchCard from "../../../../components/SingleStoreSearchCard";

interface Props {
  onSearch: () => void;
  notice?: string;
}

const SmDevEntryCard = ({ onSearch, notice }: Props) => {
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
        datePicker={<SingleDatePicker />}
        notice={notice}
      />
    </div>
  );
};

export default SmDevEntryCard;
