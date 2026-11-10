// Hooks
import { useState, useEffect, useRef } from "react";

// Components
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";

interface ColFilterProps {
  label: string;
  active: boolean;
  appliedDisplay?: string;
  align?: "left" | "right";
  onApply: () => void;
  onClear?: () => void;
  children: React.ReactNode;
}

/** A column heading that opens its own filter, with the applied value as a chip. */
const ColFilter = ({
  label,
  active,
  appliedDisplay,
  align = "left",
  onApply,
  onClear,
  children,
}: ColFilterProps) => {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const handleApply = () => {
    onApply();
    setOpen(false);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleApply();
  };
  const labelColor =
    open || active
      ? "rgb(var(--color-brand-navy))"
      : hovered
        ? "rgb(var(--color-brand-navy) / 0.65)"
        : "rgb(var(--color-brand-navy) / 0.4)";

  return (
    <div
      ref={wrapRef}
      className={`relative flex items-center gap-1 min-w-0 ${align === "right" ? "justify-end" : ""}`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wide transition-colors select-none flex-shrink-0"
        style={{ color: labelColor }}
      >
        {label}
      </button>
      {active && appliedDisplay && (
        <span
          className="flex items-center gap-0.5 rounded px-1 py-0.5 flex-shrink-0"
          style={{ background: "rgb(var(--color-brand-navy) / 0.08)", maxWidth: 90 }}
        >
          <span className="text-[8px] font-medium text-brand_navy truncate">
            {appliedDisplay}
          </span>
          {onClear && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="text-[8px] text-brand_navy/95 hover:text-brand_navy leading-none flex-shrink-0 ml-0.5"
            >
              ✕
            </button>
          )}
        </span>
      )}
      {open && (
        <div className="fixed inset-0 z-[199]" onClick={() => setOpen(false)} />
      )}
      {open && (
        <div
          onKeyDown={handleKeyDown}
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
            minWidth: 176,
          }}
        >
          {children}
          <button
            onClick={handleApply}
            className="mt-2 w-full flex items-center justify-center gap-1.5 rounded py-1 text-[10px] font-medium"
            style={{ background: "rgb(var(--color-brand-navy))", color: "white" }}
          >
            <MagnifyingGlassIcon className="w-3 h-3" />
            Apply
          </button>
        </div>
      )}
    </div>
  );
};

export default ColFilter;
