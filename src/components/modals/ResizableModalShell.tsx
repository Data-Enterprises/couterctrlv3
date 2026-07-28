import { useEffect, useRef, type ReactNode } from "react";
import { useResizableBox } from "../../hooks/useResizableBox";
import ResizeHandle from "../ResizeHandle";

/**
 * Backdrop + drag-to-resize panel for the dev export modals — the same
 * useResizableBox treatment the Config page containers use, wrapped once so all
 * of them share one implementation of the tricky part.
 *
 * The tricky part is the interaction with click-outside-to-close. Pressing the
 * handle is safe on its own (it sits inside the panel, so the event never
 * reaches the backdrop), but a drag that ENDS with the cursor over the backdrop
 * fires a click there on mouseup — closing the modal mid-resize and throwing
 * away the size the user just set. Two guards prevent that:
 *
 *   1. Only a click whose target IS the backdrop counts, so anything
 *      bubbling up from inside the panel is ignored.
 *   2. Clicks are swallowed while resizing AND for one frame after it ends,
 *      which is where the stray mouseup-click lands.
 *
 * Size is applied as width + maxHeight rather than a fixed height: these
 * panels size to their content and each has its own internal scroll regions,
 * so capping the height lets a drag shrink them without a fixed height
 * squashing headers and footers that were never laid out for it.
 */
interface ResizableModalShellProps {
  onClose: () => void;
  /** localStorage key — unique per modal so sizes don't bleed across pages. */
  storageKey: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  /** False for modals that intentionally don't close on backdrop click. */
  closeOnBackdrop?: boolean;
  /** Extra classes for the panel. */
  className?: string;
  children: ReactNode;
}

const ResizableModalShell = ({
  onClose,
  storageKey,
  defaultWidth,
  defaultHeight,
  minWidth = 420,
  maxWidth = 1600,
  minHeight = 320,
  maxHeight = 1100,
  closeOnBackdrop = true,
  className = "",
  children,
}: ResizableModalShellProps) => {
  const { width, height, isResizing, boxRef, handleProps } = useResizableBox({
    storageKey,
    defaultWidth,
    defaultHeight,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
  });

  // Stays true for one frame past the end of a drag — long enough to absorb
  // the click that mouseup synthesises on the backdrop.
  const justResized = useRef(false);
  useEffect(() => {
    if (isResizing) {
      justResized.current = true;
      return;
    }
    if (!justResized.current) return;
    const id = requestAnimationFrame(() => {
      justResized.current = false;
    });
    return () => cancelAnimationFrame(id);
  }, [isResizing]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (!closeOnBackdrop) return;
    if (e.target !== e.currentTarget) return;
    if (isResizing || justResized.current) return;
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={boxRef}
        style={{ width, maxHeight: height }}
        className={`relative bg-custom-white rounded-xl shadow-xl overflow-hidden flex flex-col ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <ResizeHandle onMouseDown={handleProps.onMouseDown} />
      </div>
    </div>
  );
};

export default ResizableModalShell;
