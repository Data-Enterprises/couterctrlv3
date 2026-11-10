// Hooks
import { NavLink } from "react-router";
import { useRef, useEffect } from "react";

// Interfaces
import type { Navigation } from "../../interfaces";


interface NavSheetProps {
  cat: { name: string; pages: any[] };
  visiblePages: Navigation[];
  onClose: () => void;
  onNavigate: (href: string) => void;
  currentPath: string;
}

const NavSheet = ({
  cat,
  visiblePages,
  onClose,
  onNavigate,
  currentPath,
}: NavSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startY: number; currentY: number } | null>(null);

  const slideDown = () => {
    const el = sheetRef.current;
    if (!el) {
      onClose();
      return;
    }
    el.style.transition = "transform 0.25s ease";
    el.style.transform = "translateY(100%)";
    setTimeout(onClose, 220);
  };

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
    if (dragState.current.currentY > 80) {
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
    <div className="fixed inset-0 z-50" style={{ top: 48, bottom: 56 }}>
      <div className="absolute inset-0 backdrop-blur-sm" onClick={slideDown} />
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-custom-white rounded-t-2xl"
        style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.12)" }}
      >
        <div
          className="flex justify-center pt-2.5 pb-1 flex-shrink-0 cursor-grab active:cursor-grabbing"
          style={{ touchAction: "none" }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="w-9 h-1 bg-gray-200 rounded-full" />
        </div>
        <p className="text-[9px] font-semibold uppercase tracking-wider text-content/40 px-4 pb-1">
          {cat.name}
        </p>
        <div className="pb-2">
          {visiblePages.map((page) => {
            const isActive = currentPath === page.href;
            return (
              <NavLink
                key={page.href}
                to={page.href}
                onClick={() => {
                  slideDown();
                  setTimeout(() => onNavigate(page.href), 0);
                }}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${isActive ? "bg-gray-50" : "hover:bg-gray-50"}`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isActive
                      ? "rgb(var(--color-brand-navy))"
                      : "rgb(var(--color-brand-navy) / 0.07)",
                  }}
                >
                  <page.icon
                    className="h-4 w-4"
                    style={{
                      color: isActive ? "#fff" : "rgb(var(--color-brand-navy))",
                    }}
                  />
                </div>
                <span
                  className={`text-[13px] ${isActive ? "font-semibold text-brand_navy" : "font-medium text-content"}`}
                >
                  {page.name}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NavSheet;