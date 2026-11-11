// Hooks
import { useEffect, useRef, useState } from "react";

// Components
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";

interface ColFilterProps {
  label: string;
  active: boolean;
  align?: "left" | "right";
  onApply: () => void;
  onClear?: () => void;
  children: React.ReactNode;
}

/** A column header button that opens a filter popover. */
const ColFilter = ({ label, active, align = "left", onApply, onClear, children }: ColFilterProps) => {
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
        className={`flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide transition-colors select-none flex-shrink-0 ${
          active ? "text-brand_navy" : "text-content"
        }`}
      >
        {label}
        {active && <span className="w-1 h-1 rounded-full bg-brand_navy flex-shrink-0" />}
      </button>
      {open && <div className="fixed inset-0 z-[199]" onClick={() => setOpen(false)} />}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            ...(align === "right" ? { right: 0 } : { left: 0 }),
            zIndex: 200,
            background: "white",
            border: "1px solid rgb(var(--color-brand-navy) / 0.12)",
            borderRadius: 6,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            padding: "10px 10px 8px",
            minWidth: 168,
          }}
        >
          {children}
          <div className="flex gap-1.5 mt-2">
            <button
              onClick={() => { onApply(); setOpen(false); }}
              className="flex-1 flex items-center justify-center gap-1 rounded py-1 text-[10px] font-medium"
              style={{ background: "rgb(var(--color-brand-navy))", color: "white" }}
            >
              <MagnifyingGlassIcon className="w-3 h-3" /> Apply
            </button>
            {onClear && (
              <button
                onClick={() => { onClear(); setOpen(false); }}
                className="px-2 rounded py-1 text-[10px] text-content border border-line_field hover:text-content transition-colors"
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
