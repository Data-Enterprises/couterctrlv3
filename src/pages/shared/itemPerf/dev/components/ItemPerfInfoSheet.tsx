// Hooks
import { useAppDispatch, useAppSelector } from "../../../../../hooks";
import { useItemPerfCtx } from "../hooks";

// Redux
import { setItemPerfInfoOpen } from "../../../../../features/dev/devItemPerfSlice";

// Utils
import { HELP_PAGE } from "../utils";

// Components
import InfoModal from "../../../../../components-dev/InfoModal";

/** The help sheet. One screen serves all three groupings, so the help
 *  follows the dimension. */
const ItemPerfInfoSheet = () => {
  const dispatch = useAppDispatch();
  const perf = useAppSelector((s) => s.dev.itemPerf);
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
