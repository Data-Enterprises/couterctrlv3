// Hooks
import { useEffect } from "react";

interface GridStoresOverlayProps {
  open: boolean;
  /** Store names, A to Z. */
  stores: string[];
  onClose: () => void;
}

/** The list the Stores figure drops down over the grid: every store in the
 *  rows the filters keep. A click outside or Escape closes it. */
const GridStoresOverlay = ({ open, stores, onClose }: GridStoresOverlayProps) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {open && <div className="fixed inset-0 z-20" onClick={onClose} />}
      <div
        role="region"
        aria-label="Stores in the grid"
        aria-hidden={!open}
        className={`absolute left-0 right-0 top-full z-30 max-h-[50vh] overflow-y-auto thin-scrollbar border-b border-brand_navy/15 bg-custom-white shadow-lg transition-all duration-200 ${
          open
            ? "opacity-100 translate-y-0"
            : "pointer-events-none opacity-0 -translate-y-2"
        }`}
      >
        <ul className="grid grid-cols-3 gap-x-6 gap-y-1 px-4 py-3 text-[13px] text-content/95">
          {stores.map((name) => (
            <li key={name} className="truncate">
              {name}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default GridStoresOverlay;
