import { useState, useEffect, useRef } from "react";
import ChevronUpDownIcon from "../svgs/ChevronUpDownIcon";

interface SingleSelectProps<T> {
  data: T[];
  valueKey: keyof T;
  displayKey: keyof T;
  label: string;
  onSelect?: (selection: string | number) => void;
  id?: number;
  value?: number;
  className?: string;
  keepOpen?: boolean;
  defaultQuery?: string;
  innerClass?: string;
  resetQuery?: boolean;
  listClass?: string;
  defaultValue?: string | number;
}

const SingleSelect = <T,>({
  data,
  valueKey,
  displayKey,
  label,
  onSelect,
  id = 0,
  value,
  className = "",
  keepOpen = false,
  defaultQuery = "",
  innerClass = "",
  resetQuery = false,
  listClass = "",
}: SingleSelectProps<T>) => {
  const [query, setQuery] = useState(defaultQuery);
  const [filteredData, setFilteredData] = useState<T[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const componentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset the query when the data changes => this is useful when the data is fetched or updated
  useEffect(() => {
    if (resetQuery) setQuery(defaultQuery);
  }, [data, defaultQuery]);

  const handleClickOutside = (e: MouseEvent) => {
    if (listRef.current && triggerRef.current) {
      if (!listRef.current.contains(e.target as Node)) {
        if (!triggerRef.current.contains(e.target as Node)) {
          listRef.current.setAttribute("data-display", "closed");
        }
      }
    }
  };

  useEffect(() => {
    if (!data || data.length === 0) return;
    setFilteredData(data);
    positionDiv();

    if (data) {
      const existing = data.find((d) => d[valueKey] == value);

      if (existing) {
        setQuery(existing[displayKey] as string);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    if (componentRef.current) {
      const parent = componentRef.current.parentElement;
      if (parent) {
        parent.addEventListener("mousedown", handleClickOutside);
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (componentRef.current) {
        const parent = componentRef.current.parentElement;
        if (parent) {
          parent.removeEventListener("mousedown", handleClickOutside);
        }
      }
    };
  }, [data, value]);

  const handleTriggerClick = () => {
    // every time the user clicks on the trigger, just show the whole data set
    if (listRef.current) {
      const currentStatus = listRef.current.getAttribute("data-display");
      listRef.current.setAttribute(
        "data-display",
        currentStatus === "open" ? "closed" : "open"
      );
      setFilteredData(data);
    }
  };

  const handleSelect = (selection: T) => {
    if (onSelect) onSelect(selection[valueKey] as string);
    setQuery(selection[displayKey] as string);
    if (listRef.current && !keepOpen) {
      listRef.current.setAttribute("data-display", "closed");
    }
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (e.target.value.length == 0) {
      setFilteredData(data);
      return;
    }
    const filtered = data.filter((r) =>
      (r[displayKey] as string)
        .toString()
        .toLowerCase()
        .includes(e.target.value.toLowerCase())
    );

    // if there is filtered data, then show the list as the user types
    setFilteredData(filtered);
    if (listRef.current) {
      listRef.current.setAttribute("data-display", "open");
    }
  };

  const positionDiv = () => {
    if (!triggerRef.current || !listRef.current) return;
    const box = triggerRef.current.getBoundingClientRect();
    const availableSpace = window.innerHeight - box.bottom;
    const listBox = listRef.current.getBoundingClientRect();

    if (availableSpace < 350) {
      listRef.current.style.top = `-${listBox.height + 10}px`;
      listRef.current.style.borderTopLeftRadius = "10px";
      listRef.current.style.borderTopRightRadius = "10px";
    }
  };

  return (
    <div
      data-testid={`single-select-${id}`}
      ref={componentRef}
      className={`single-select ${className}`}
    >
      <div className="flex flex-col">
        <label htmlFor="search" className="text-sm font-medium ml-1">
          {label}
        </label>
        <div className="relative">
          <div data-testid="single-select-trigger" ref={triggerRef}>
            <input
              data-testid="single-select-input"
              ref={inputRef}
              value={query}
              onChange={handleQueryChange}
              onFocus={(e) => e.target.select()}
              name="search"
              type="text"
              autoComplete="off"
              className={`basic-input bg-custom-white focus:border ${innerClass}`}
            />
            <div
              data-testid={`single-select-trigger-icon-${id}`}
              onClick={handleTriggerClick}
              className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none"
            >
              <ChevronUpDownIcon
                className="cursor-pointer fill-content"
                aria-hidden="true"
              />
            </div>
          </div>

          <div
            ref={listRef}
            data-display="closed"
            className={`absolute no-scrollbar w-full hover:cursor-pointer text-content rounded-lg bg-custom-white 
                overflow-y-auto z-20 shadow-lg
                data-[display=open]:animate-appear
                data-[display=closed]:animate-dissapear
                data-[display=closed]:pointer-events-none
                data-[display=open]:max-h-[280px]
                data-[display=closed]:h-0 ${listClass}`}
          >
            {filteredData.map((d, idx) => (
              <div
                data-testid={`single-select-option-${id}-${idx}`}
                key={`d-${id}-${idx}`}
                onClick={() => handleSelect(d)}
                className="flex hover:bg-panel_active py-0.5 hover:text-custom-white transition-all duration-300 items-center"
                data-value={d[valueKey]}
              >
                <div className="grid grid-cols-[14px_1fr] min-h-[27px]">
                  <div className="flex items-center"></div>
                  <div className="flex items-center">
                    {" "}
                    {d[displayKey] as string}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleSelect;
