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
  /**
   * For a chooser rather than a filter.
   *
   * The active styling says "this is narrowing the list", which only reads
   * that way when empty is the usual state. A field that always holds a value
   * — a file format, say — would wear it permanently and stop meaning
   * anything.
   */
  plain?: boolean;
  /**
   * A box at the top of the list that narrows it.
   *
   * For the lists that are long enough to be unusable without one — the
   * table has ninety-nine columns, and scrolling to `total_sales` past
   * `fsa_flag` is not picking, it is hunting.
   */
  searchable?: boolean;
  searchPlaceholder?: string;
}

const SelectFilter = ({
  options,
  value,
  onChange,
  placeholder = "All",
  className = "",
  plain = false,
  searchable = false,
  searchPlaceholder = "Type to narrow...",
}: SelectFilterProps) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [query, setQuery] = useState("");
  /** Opening upward, because there was more room there. */
  const [above, setAbove] = useState(false);
  const [room, setRoom] = useState(220);

  const selected = options.find((o) => o.value === value);
  const label = selected?.label ?? placeholder;
  // Matches TextFilter: the filter_active tokens plus a ring mark a filter
  // that's narrowing the list. See TextFilter for why this isn't row_selected.
  const isActive = !plain && value !== "";

  const handleOpen = () => {
    if (btnRef.current) {
      const box = btnRef.current.getBoundingClientRect();
      setRect(box);
      // A list that runs off the bottom of the window cannot be scrolled to,
      // so it opens wherever there is room and is never taller than that.
      const below = window.innerHeight - box.bottom - 12;
      const over = box.top - 12;
      const up = below < 180 && over > below;
      setAbove(up);
      setRoom(Math.max(140, Math.min(320, up ? over : below)));
    }
    setQuery("");
    setOpen((v) => !v);
  };

  const handleSelect = (v: string) => {
    onChange(v);
    setQuery("");
    setOpen(false);
  };

  // The box is the point of opening it, so the cursor starts there.
  useEffect(() => {
    if (open && searchable) searchRef.current?.focus();
  }, [open, searchable]);

  const narrowed = query.trim()
    ? options.filter((o) =>
        `${o.label} ${o.value}`.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : options;

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
          style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
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
            top: above ? undefined : rect.bottom + 2,
            bottom: above ? window.innerHeight - rect.top + 2 : undefined,
            left: rect.left,
            width: Math.max(rect.width, 180),
            zIndex: 9999,
            background: "white",
            border: "1px solid rgba(30,42,74,0.12)",
            borderRadius: 6,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            maxHeight: room,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {searchable && (
            <div className="flex-shrink-0 border-b border-brand_line p-1.5">
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="w-full border border-brand_line rounded px-2 py-1 text-[12px]"
                style={{ outline: "none" }}
              />
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
            {!query.trim() && (
              <button
                onClick={() => handleSelect("")}
                className="w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 transition-colors"
                style={{ color: value === "" ? "#1e2a4a" : "rgba(30,42,74,0.45)", fontWeight: value === "" ? 600 : 400 }}
              >
                {placeholder}
              </button>
            )}
            {narrowed.map((o) => (
              <button
                key={o.value}
                onClick={() => handleSelect(o.value)}
                className="w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 transition-colors"
                style={{ color: "#1e2a4a", fontWeight: value === o.value ? 600 : 400, background: value === o.value ? "rgba(30,42,74,0.04)" : undefined }}
              >
                {o.label}
              </button>
            ))}
            {narrowed.length === 0 && (
              <div className="px-3 py-2 text-[12px] text-content/55">
                Nothing matches that.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectFilter;
