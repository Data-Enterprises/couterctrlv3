// Interfaces
import type { ReactNode } from "react";

/** The navy band, with the way back to the read-only grid. */
/** The navy band with the Browse / Edit switch. Shared with the Problems
 *  tab's item view, so the two read as one screen in two states. */
const Band = ({
  children,
  onLeaveEdit,
}: {
  children: ReactNode;
  onLeaveEdit: () => void;
}) => (
  <div className="bg-brand_navy px-3 pt-2 pb-2.5 flex-shrink-0 flex items-center gap-2.5">
    <div className="flex rounded-md bg-custom-white/10 p-0.5 gap-0.5 flex-shrink-0">
      <button
        onClick={onLeaveEdit}
        className="rounded px-2.5 py-0.5 text-[11.5px] font-bold text-custom-white/95 transition-colors hover:text-custom-white"
      >
        Browse
      </button>
      <span className="rounded bg-custom-white px-2.5 py-0.5 text-[11.5px] font-bold text-brand_navy">
        Edit
      </span>
    </div>
    {children}
  </div>
);

export default Band;
