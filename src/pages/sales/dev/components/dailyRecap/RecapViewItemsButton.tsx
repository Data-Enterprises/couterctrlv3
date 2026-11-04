import RecapTextTip from "./RecapTextTip";
import { useCursorTip } from "./useCursorTip";

/**
 * View items, top right of the Baskets card (board 17): switches Summary to
 * its item view. Hovering it says what the list will hold, for the week or
 * the day picked, in a tip that follows the mouse like the hour chart's.
 */
const RecapViewItemsButton = ({ tip: text, onClick }: { tip: string; onClick: () => void }) => {
  const { tip, track, clear } = useCursorTip<true>();
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        onMouseMove={track(true)}
        onMouseLeave={clear}
        className="flex-none px-2.5 py-1 rounded-md bg-brand_navy hover:bg-brand_navy_hover text-custom-white text-[12px] font-semibold transition-colors"
      >
        View items
      </button>
      {tip && <RecapTextTip lines={[text]} x={tip.x} y={tip.y} />}
    </>
  );
};

export default RecapViewItemsButton;
