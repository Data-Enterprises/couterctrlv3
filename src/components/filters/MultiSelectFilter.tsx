import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, CheckIcon } from "@heroicons/react/20/solid";

/**
 * A checkbox dropdown, styled to match `SelectFilter` exactly.
 *
 * The single-select version couldn't cover "just these four vendors" — the case
 * that actually comes up when someone is chasing one supplier out of forty.
 *
 * **Empty means all, not none.** An untouched filter has to produce the whole
 * set; the alternative is a control that silently empties an export before the
 * user has touched it, which is the worst possible default for a file someone
 * takes away and acts on.
 *
 * The dropdown stays open while options are toggled — closing after each pick
 * would make selecting four things take four round trips. It closes on an
 * outside click, like its single-select sibling.
 */

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface Props {
  options: MultiSelectOption[];
  /** Selected values. Empty means every option, which is what the button says. */
  values: string[];
  onChange: (values: string[]) => void;
  /** Shown when nothing is selected. Name the whole set — "All departments" —
   *  rather than a bare "All", so the button reads as a sentence. */
  placeholder?: string;
  /** Plural noun for the count label, e.g. "departments". */
  noun?: string;
  className?: string;
}

const MultiSelectFilter = ({
  options,
  values,
  onChange,
  placeholder = "All",
  noun = "selected",
  className = "",
}: Props) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const isActive = values.length > 0;
  const label = !isActive
    ? placeholder
    : values.length === 1
      ? (options.find((o) => o.value === values[0])?.label ?? placeholder)
      : `${values.length} ${noun}`;

  const handleOpen = () => {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setOpen((v) => !v);
  };

  const toggle = (value: string) => {
    onChange(
      values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value],
    );
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (
        btnRef.current &&
        !btnRef.current.contains(e.target as Node) &&
        dropRef.current &&
        !dropRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={`w-full flex items-center justify-between rounded pl-1.5 pr-1 py-0.5 text-[12px] text-content outline-none cursor-pointer border transition-colors ${
          open
            ? "bg-custom-white border-[#1e2a4a]"
            : isActive
              ? "bg-filter_active border-filter_active_border ring-2 ring-filter_active_border/30"
              : "bg-custom-white border-[#1e2a4a]/75 hover:border-[#1e2a4a]/50"
        }`}
        style={{
          height: 24,
          boxShadow:
            open || isActive
              ? "0 1px 4px rgba(30,42,74,0.18)"
              : "0 1px 2px rgba(30,42,74,0.08)",
        }}
      >
        <span
          className={isActive ? "text-content font-medium" : "text-content/85"}
          style={{
            fontSize: 12,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
        <ChevronDownIcon
          className={`w-3 h-3 flex-shrink-0 ml-1 ${isActive ? "text-filter_active_border" : "text-[#1e2a4a]/60"}`}
        />
      </button>

      {open && rect && (
        <div
          ref={dropRef}
          style={{
            position: "fixed",
            top: rect.bottom + 2,
            left: rect.left,
            width: Math.max(rect.width, 200),
            zIndex: 9999,
            background: "white",
            border: "1px solid rgba(30,42,74,0.12)",
            borderRadius: 6,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            maxHeight: 260,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
          className="thin-scrollbar"
        >
          <button
            onClick={() => onChange([])}
            className="w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 transition-colors border-b border-gray-100"
            style={{
              color: isActive ? "rgba(30,42,74,0.85)" : "#1e2a4a",
              fontWeight: isActive ? 400 : 600,
            }}
          >
            {placeholder}
          </button>
          {options.map((o) => {
            const on = values.includes(o.value);
            return (
              <button
                key={o.value}
                onClick={() => toggle(o.value)}
                className="w-full flex items-center gap-2 text-left px-3 py-2 text-[12px] text-content hover:bg-gray-50 transition-colors"
              >
                <span
                  className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                    on
                      ? "bg-[#1e2a4a] border-[#1e2a4a]"
                      : "bg-custom-white border-gray-300"
                  }`}
                >
                  {on && <CheckIcon className="w-3 h-3 text-custom-white" />}
                </span>
                <span className="truncate">{o.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiSelectFilter;
