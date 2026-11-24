// Hooks
import { useAppDispatch } from "../../../hooks";
import { useItemPerfCtx, useItemPerfState } from "../hooks";

// Redux
import { setItemPerfInfoOpen } from "../../../features/itemPerfSlice";

// Utils
import { HELP_PAGE } from "../utils";

// Components
import InfoModal from "../../InfoModal";

/** The help sheet. One screen serves all three groupings, so the help
 *  follows the dimension. */
const ItemPerfInfoSheet = () => {
  const dispatch = useAppDispatch();
  const { perf } = useItemPerfState();
  const { dimension } = useItemPerfCtx();
  return (
    <InfoModal
      page={HELP_PAGE[dimension]}
      isOpen={perf.infoOpen}
      onClose={() => dispatch(setItemPerfInfoOpen(false))}
    />
  );
};

export default ItemPerfInfoSheet;
