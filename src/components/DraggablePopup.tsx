import { useState, useRef, useEffect, type ReactNode } from "react";
import { XMarkIcon } from "@heroicons/react/20/solid";

interface DraggablePopupProps {
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  initialX?: number;
  initialY?: number;
  width?: number;
}

const DraggablePopup = ({
  title,
  subtitle,
  onClose,
  children,
  initialX,
  initialY,
  width = 480,
}: DraggablePopupProps) => {
  const [position, setPosition] = useState({
    x: initialX ?? window.innerWidth - width - 24,
    y: initialY ?? 72,
  });

  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    dragging.current = true;
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPosition({
        x: e.clientX - offset.current.x,
        y: e.clientY - offset.current.y,
      });
    };

    const handleMouseUp = () => {
      dragging.current = false;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div
      className="fixed z-50 bg-custom-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
      style={{ left: position.x, top: position.y, width }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-start justify-between px-4 py-3 bg-[#1e2a4a] cursor-grab active:cursor-grabbing select-none"
      >
        <div>
          <p className="text-custom-white text-sm font-semibold leading-tight">
            {title}
          </p>
          {subtitle && <div className="mt-1">{subtitle}</div>}
        </div>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onClose}
          className="text-custom-white/50 hover:text-custom-white transition-colors mt-0.5"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto no-scrollbar max-h-[calc(100vh-8rem)]">
        {children}
      </div>
    </div>
  );
};

export default DraggablePopup;
