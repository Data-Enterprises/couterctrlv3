import { useEffect, useRef, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";

interface Props {
  label: string;
  active: boolean;
  align?: "left" | "right";
  onApply: () => void;
  onClear?: () => void;
  children: React.ReactNode;
}

// Matches the established column-filter popover pattern already duplicated
// across MarginPerfItemsTable.tsx, CouponDetailPanel.tsx, OrderReportPanel.tsx,
// and others — centralized here instead of adding a 7th copy. Label toggles
// an absolutely-positioned popover holding whatever filter control is passed
// as children (typically a text input), with built-in Apply/Clear.
const ColFilter = ({ label, active, align = "left", onApply, onClear, children }: Props) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative flex items-center gap-1 min-w-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide transition-colors select-none flex-shrink-0 ${
          active ? "text-[#1e2a4a]" : "text-content"
        }`}
      >
        {label}
        {active && <span className="w-1 h-1 rounded-full bg-[#1e2a4a] flex-shrink-0" />}
      </button>
      {open && <div className="fixed inset-0 z-[199]" onClick={() => setOpen(false)} />}
      {open && (
        <div
          className="bg-custom-white"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            ...(align === "right" ? { right: 0 } : { left: 0 }),
            zIndex: 200,
            border: "1px solid rgba(30,42,74,0.12)",
            borderRadius: 6,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            padding: "10px 10px 8px",
            minWidth: 168,
          }}
        >
          {children}
          <div className="flex gap-1.5 mt-2">
            <button
              onClick={() => {
                onApply();
                setOpen(false);
              }}
              className="flex-1 flex items-center justify-center gap-1 rounded py-1 text-[10px] font-medium text-custom-white"
              style={{ background: "#1e2a4a" }}
            >
              <MagnifyingGlassIcon className="w-3 h-3" /> Apply
            </button>
            {onClear && (
              <button
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
                className="px-2 rounded py-1 text-[10px] text-content border border-gray-200 hover:text-content transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColFilter;
