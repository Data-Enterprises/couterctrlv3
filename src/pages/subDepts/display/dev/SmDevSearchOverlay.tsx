import { useAppDispatch } from "../../../../hooks";
import { useSubMarginCtx } from "../../hooks";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import SingleDatePicker from "../../../../components/datePickers/SingleDatePicker";
import SingleStoreSearchCard from "../../../../components/SingleStoreSearchCard";

interface Props {
  onSearch: () => void;
  onClose: () => void;
}

const SmDevSearchOverlay = ({ onSearch, onClose }: Props) => {
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const ctx = useSubMarginCtx();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div className="mx-4" onClick={(e) => e.stopPropagation()}>
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
        />
      </div>
    </div>
  );
};

export default SmDevSearchOverlay;
