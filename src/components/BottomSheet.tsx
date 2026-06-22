import { useEffect, useRef } from "react";

interface BottomSheetProps {
  children: React.ReactNode;
  onClose: () => void;
  closeRef?: React.MutableRefObject<(() => void) | null>;
}

const BottomSheet = ({ children, onClose, closeRef }: BottomSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startY: number; currentY: number } | null>(null);

  const slideDown = () => {
    const el = sheetRef.current;
    if (!el) { onClose(); return; }
    el.style.transition = "transform 0.25s ease";
    el.style.transform = "translateY(100%)";
    setTimeout(onClose, 220);
  };

  // Expose slideDown to parent via closeRef
  useEffect(() => {
    if (closeRef) closeRef.current = slideDown;
    return () => { if (closeRef) closeRef.current = null; };
  }, []);

  // Slide up on mount
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    el.style.transform = "translateY(100%)";
    el.style.transition = "none";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = "transform 0.3s ease";
        el.style.transform = "translateY(0)";
      });
    });
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    dragState.current = { startY: e.touches[0].clientY, currentY: 0 };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragState.current || !sheetRef.current) return;
    const delta = e.touches[0].clientY - dragState.current.startY;
    if (delta < 0) return;
    dragState.current.currentY = delta;
    sheetRef.current.style.transform = `translateY(${delta}px)`;
    sheetRef.current.style.transition = "none";
  };

  const onTouchEnd = () => {
    if (!dragState.current || !sheetRef.current) return;
    const delta = dragState.current.currentY;
    if (delta > 80) {
      sheetRef.current.style.transition = "transform 0.25s ease";
      sheetRef.current.style.transform = "translateY(100%)";
      setTimeout(onClose, 220);
    } else {
      sheetRef.current.style.transition = "transform 0.2s ease";
      sheetRef.current.style.transform = "translateY(0)";
    }
    dragState.current = null;
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/35" onClick={slideDown} />
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col"
      >
        {/* Drag handle — only this zone triggers swipe-to-close */}
        <div
          className="flex justify-center pt-2.5 pb-1 flex-shrink-0 cursor-grab active:cursor-grabbing"
          style={{ touchAction: "none" }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="w-9 h-1 bg-gray-200 rounded-full" />
        </div>
        {children}
      </div>
    </div>
  );
};

export default BottomSheet;
