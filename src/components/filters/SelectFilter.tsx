import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

export interface SelectFilterOption {
  label: string;
  value: string;
}

interface SelectFilterProps {
  options: SelectFilterOption[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

const SelectFilter = ({ options, value, onChange, placeholder = "All", className = "" }: SelectFilterProps) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const selected = options.find((o) => o.value === value);
  const label = selected?.label ?? placeholder;

  const handleOpen = () => {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setOpen((v) => !v);
  };

  const handleSelect = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropRef.current && !dropRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="w-full flex items-center justify-between rounded pl-1.5 pr-1 py-0.5 text-[10px] text-content outline-none cursor-pointer border-0"
        style={{ background: "rgba(30,42,74,0.06)", boxShadow: "inset 0 1px 3px rgba(30,42,74,0.1)", height: 24 }}
      >
        <span className={value ? "text-content" : "text-content/40"} style={{ fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </span>
        <ChevronDownIcon className="w-3 h-3 text-content/40 flex-shrink-0 ml-1" />
      </button>

      {open && rect && (
        <div
          ref={dropRef}
          style={{
            position: "fixed",
            top: rect.bottom + 2,
            left: rect.left,
            width: Math.max(rect.width, 140),
            zIndex: 9999,
            background: "white",
            border: "1px solid rgba(30,42,74,0.12)",
            borderRadius: 6,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            maxHeight: 220,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
          className="thin-scrollbar"
        >
          <button
            onClick={() => handleSelect("")}
            className="w-full text-left px-3 py-2 text-[11px] hover:bg-gray-50 transition-colors"
            style={{ color: value === "" ? "#1e2a4a" : "rgba(30,42,74,0.45)", fontWeight: value === "" ? 600 : 400 }}
          >
            {placeholder}
          </button>
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => handleSelect(o.value)}
              className="w-full text-left px-3 py-2 text-[11px] hover:bg-gray-50 transition-colors"
              style={{ color: "#1e2a4a", fontWeight: value === o.value ? 600 : 400, background: value === o.value ? "rgba(30,42,74,0.04)" : undefined }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectFilter;
