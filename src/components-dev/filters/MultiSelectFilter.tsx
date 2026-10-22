import { useState, useRef, useEffect, useMemo } from "react";
import {
  ChevronDownIcon,
  CheckIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";

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
 * Long lists get a search box. Picking four items out of three thousand is
 * not a scrolling problem, and the lists this now serves — every UPC in a
 * week of orders, say — are far past the point where a list alone works.
 * Short lists do not get one: a search box above five order types is
 * furniture.
 *
 * The dropdown stays open while options are toggled — closing after each pick
 * would make selecting four things take four round trips. It closes on an
 * outside click, like its single-select sibling.
 */

export interface MultiSelectOption {
  label: string;
  value: string;
  /**
   * No row left that carries this value, once the OTHER filters are applied.
   *
   * Dropped from the list, so everything left in it is something that
   * returns rows -- UNLESS it is selected, in which case it is kept and said
   * so. A pick that quietly vanished would leave the screen empty with the
   * reason nowhere on it, and nothing to click to undo.
   */
  unavailable?: boolean;
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
  /**
   * Force the search box on or off.
   *
   * Left alone it appears once the list is long enough to be worth
   * searching, which is the behaviour every caller wants without saying so.
   */
  searchable?: boolean;
  className?: string;
}

const MultiSelectFilter = ({
  options,
  values,
  onChange,
  placeholder = "All",
  noun = "selected",
  searchable,
  className = "",
}: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const isActive = values.length > 0;
  const showSearch = searchable ?? options.length > 8;

  /**
   * What the list draws: the search, over what is still reachable.
   *
   * An unavailable option is left out unless it is selected. Keeping the
   * dead ones would bury the pickable ones -- the items list runs to
   * thousands -- and the one a reader has to find is the pick of their own
   * that went dead, which is why that one stays and leads.
   */
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const live = options.filter(
      (o) => !o.unavailable || values.includes(o.value),
    );
    const matched = !q
      ? live
      : live.filter(
          (o) =>
            o.label.toLowerCase().includes(q) ||
            o.value.toLowerCase().includes(q),
        );
    const dead = matched.filter(
      (o) => o.unavailable && values.includes(o.value),
    );
    if (dead.length === 0) return matched;
    return [...dead, ...matched.filter((o) => !dead.includes(o))];
  }, [options, query, values]);

  /** How many the other filters have taken off this list, for the line at
   *  the foot of it. Silence would read as a short list, not a narrowed one. */
  const hiddenCount = useMemo(
    () =>
      options.filter((o) => o.unavailable && !values.includes(o.value)).length,
    [options, values],
  );

  /** Every match at once — the reason to search a list this long. */
  /** Over what can actually be picked: "select all" must not add back an
   *  option that returns nothing. */
  const pickable = useMemo(() => shown.filter((o) => !o.unavailable), [shown]);
  const allShownOn =
    pickable.length > 0 && pickable.every((o) => values.includes(o.value));
  const toggleShown = () => {
    const inShown = new Set(pickable.map((o) => o.value));
    onChange(
      allShownOn
        ? values.filter((v) => !inShown.has(v))
        : [...new Set([...values, ...pickable.map((o) => o.value)])],
    );
  };
  const label = !isActive
    ? placeholder
    : values.length === 1
      ? (options.find((o) => o.value === values[0])?.label ?? placeholder)
      : `${values.length} ${noun}`;

  const handleOpen = () => {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    // A query left behind would reopen the list already narrowed, with no
    // sign of why most of it was missing.
    setQuery("");
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
      ) {
        setOpen(false);
        setQuery("");
      }
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
            ? "bg-custom-white border-brand_navy"
            : isActive
              ? "bg-filter_active border-filter_active_border ring-2 ring-filter_active_border/30"
              : "bg-custom-white border-brand_navy/75 hover:border-brand_navy/50"
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
          className={`w-3 h-3 flex-shrink-0 ml-1 ${isActive ? "text-filter_active_border" : "text-brand_navy/60"}`}
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
            maxHeight: 300,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Pinned: searching a long list and then scrolling it must not
              carry the field you are typing in off the top. */}
          {showSearch && (
            <div className="flex items-center gap-1.5 border-b border-gray-100 px-2.5 py-1.5 flex-shrink-0">
              <MagnifyingGlassIcon className="w-3.5 h-3.5 flex-shrink-0 text-content/85" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="min-w-0 flex-1 border-0 bg-transparent text-[12px] text-content placeholder:text-content/85"
                style={{ outline: "none", boxShadow: "none" }}
              />
            </div>
          )}

          <button
            onClick={() => onChange([])}
            className="w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 transition-colors border-b border-gray-100 flex-shrink-0"
            style={{
              color: isActive
                ? "rgb(var(--color-brand-navy) / 0.85)"
                : "rgb(var(--color-brand-navy))",
              fontWeight: isActive ? 400 : 600,
            }}
          >
            {placeholder}
          </button>

          {/* Only while a query is narrowing the list: with everything shown
              this is "select all", which is the opposite of what the row
              above it does. */}
          {showSearch && query.trim() !== "" && shown.length > 0 && (
            <button
              onClick={toggleShown}
              className="w-full text-left px-3 py-1.5 text-[11px] font-semibold text-brand_navy hover:bg-gray-50 transition-colors border-b border-gray-100 flex-shrink-0"
            >
              {allShownOn ? "Clear" : "Select"} {shown.length} match
              {shown.length === 1 ? "" : "es"}
            </button>
          )}

          <div className="flex-1 overflow-y-auto thin-scrollbar">
            {shown.length === 0 ? (
              <div className="px-3 py-3 text-[12px] text-content/85">
                {query.trim()
                  ? `Nothing matches “${query.trim()}”.`
                  : "Nothing here is left by the other filters."}
              </div>
            ) : (
              shown.map((o) => {
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
                          ? "bg-brand_navy border-brand_navy"
                          : "bg-custom-white border-gray-300"
                      }`}
                    >
                      {on && (
                        <CheckIcon className="w-3 h-3 text-custom-white" />
                      )}
                    </span>
                    <span className="truncate">{o.label}</span>
                    {o.unavailable && (
                      <span className="ml-auto flex-shrink-0 text-[10.5px] font-semibold text-severity_watch_text">
                        no rows &mdash; pick another
                      </span>
                    )}
                  </button>
                );
              })
            )}
            {hiddenCount > 0 && (
              <div className="px-3 py-2 border-t border-gray-100 text-[11px] text-content/85">
                {hiddenCount} more{" "}
                {hiddenCount === 1 ? "option has" : "options have"} nothing left
                once the other filters are applied.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectFilter;
