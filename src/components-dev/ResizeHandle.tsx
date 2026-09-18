interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
}

// Bottom-right drag grip for a resizable container — pairs with
// useResizableBox. The parent container must be `relative` for this to
// anchor to its corner instead of the viewport.
const ResizeHandle = ({ onMouseDown }: ResizeHandleProps) => (
  <div
    onMouseDown={onMouseDown}
    title="Drag to resize"
    className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-end justify-end p-0.5 z-20"
  >
    <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-content/30">
      <path
        d="M9 1L1 9M9 4.5L4.5 9M9 8L8 9"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

export default ResizeHandle;
