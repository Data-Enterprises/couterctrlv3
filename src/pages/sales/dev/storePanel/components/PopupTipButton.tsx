import type { ReactNode } from "react";
import CursorTip from "../../../../../components-dev/tooltip/CursorTip";
import { useCursorTip } from "../../../../../components-dev/tooltip/useCursorTip";

/**
 * An icon button in the store panel's header with the app's tooltip
 * (CursorTip), following the mouse, rather than the browser's own title
 * box. The label is also the button's accessible name, since the button is
 * icon-only.
 */
const PopupTipButton = ({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) => {
  const { tip, track, clear } = useCursorTip<true>();
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        onMouseMove={track(true)}
        onMouseLeave={clear}
        aria-label={label}
        className="text-custom-white transition-colors"
      >
        {children}
      </button>
      {tip && <CursorTip lines={[label]} x={tip.x} y={tip.y} />}
    </>
  );
};

export default PopupTipButton;
