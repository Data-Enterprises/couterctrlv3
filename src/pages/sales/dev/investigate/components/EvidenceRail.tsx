import type { ReactNode } from "react";

/** The slide-in frame the open item's evidence sits in, over the grid. */
const EvidenceRail = ({
  open,
  children,
}: {
  /** An item is picked, so the rail is in. */
  open: boolean;
  children: ReactNode;
}) => {
  /*
    The rail lays OVER the grid rather than beside it.

    Taking its 520px out of the row reflowed every column underneath
    it, so opening a row moved the row that was opened. Over the top
    nothing behind it shifts, and the columns a reader was reading
    are still where they were when the rail closes.

    It slides in rather than appearing, and carries a shadow heavy
    enough to read as a layer — against a dense grid a plain white
    panel reads as a hole in it.
  */
  return (
    <div
      data-help="evidence"
      className={`absolute top-0 right-0 bottom-0 z-20 w-[520px] shadow-rail transition-transform duration-200 ease-out motion-reduce:transition-none ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
      aria-hidden={!open}
    >
      <div className="w-[520px] h-full border-l-2 border-brand_navy/25">
        {children}
      </div>
    </div>
  );
};

export default EvidenceRail;
