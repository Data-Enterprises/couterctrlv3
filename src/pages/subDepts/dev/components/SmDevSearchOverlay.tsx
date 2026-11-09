// Hooks
import { useAppDispatch } from "../../../../hooks";
import { useSubMarginCtx, useSubMarginActions } from "../hooks";

// Components
import SingleDatePicker from "../../../../components-dev/datePickers/SingleDatePicker";
import SingleStoreSearchCard from "../../../../components-dev/SingleStoreSearchCard";
import SearchPopup from "../../../../components-dev/SearchPopup";

interface SmDevSearchOverlayProps {
  onSearch: () => void;
  onClose: () => void;
}

/** The store and week picker as a blurred pop-up over Sub Dept Margins; a click outside the card closes it. */
const SmDevSearchOverlay = ({ onSearch, onClose }: SmDevSearchOverlayProps) => {
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const ctx = useSubMarginCtx();

  return (
    <SearchPopup onClose={onClose}>
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
      />
    </SearchPopup>
  );
};

export default SmDevSearchOverlay;
