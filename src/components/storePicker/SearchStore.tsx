import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../../hooks";
import { ChevronUpDownIcon } from "@heroicons/react/24/solid";

interface Props {
  onOutsideClick?: () => void;
}

const SelectStore = ({ onOutsideClick }: Props) => {
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const componentRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState("flex");

  useEffect(() => {
    setDisplay(
      search.type === "Store"
        ? "flex flex-col"
        : "flex flex-col opacity-50 pointer-events-none"
    );
  }, [search.type]);

  const handleClickOutside = (e: MouseEvent) => {
    if (
      componentRef.current &&
      !componentRef.current.contains(e.target as Node)
    ) {
      if (listRef.current) {
        listRef.current.setAttribute("data-display", "closed");
        if (onOutsideClick) onOutsideClick();
      }
    }
  };

  useEffect(() => {
    if (!context.token) return;
    // getData();
    if (componentRef.current) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [context.token]);

  const handleTriggerClick = () => {
    if (listRef.current) {
      const currentStatus = listRef.current.getAttribute("data-display");
      listRef.current.setAttribute(
        "data-display",
        currentStatus === "open" ? "closed" : "open"
      );
    }
  };

  const styling = "w-full px-4 md:px-0";
  const inputStyle = "basic-input focus:border bg-custom-white hover:bg-blue-200 transition-colors duration-200 cursor-pointer w-full";

  return (
    <div data-testid="search-store" ref={componentRef} className={styling}>
      <div className={display}>
        <label
          htmlFor="search"
          data-testid="store-label"
          className="block text-sm/6 font-medium "
        >
          Store
        </label>
        <div className="relative">
          <div
            data-testid="trigger-ref"
            ref={triggerRef}
            onClick={handleTriggerClick}
          >
            <input
              data-testid="search-store-input"
              // value={query}
              value={"Needs Data"}
              onFocus={(e) => e.target.select()}
              // onChange={handleQueryChange}
              autoComplete="off"
              type="text"
              name="search"
              className={inputStyle}
            />
            <div className="absolute top-2 right-2 cursor-pointer ">
              <ChevronUpDownIcon className="fill-content" />
            </div>
          </div>
          <div
            data-testid="list-ref"
            ref={listRef}
            data-display="closed"
            className="absolute w-full bg-custom-white text-content
            max-h-[350px] overflow-y-scroll z-20 rounded-b-xl shadow-lg no-scrollbar
            data-[display=open]:animate-appear
            data-[display=closed]:animate-dissapear
            data-[display=closed]:hidden
            data-[display=open]:pointer-events-auto
            data-[display=closed]:pointer-events-none"
          >
            <div className="px-2 py-1 hover:bg-blue-200 transition-all duration-200 cursor-pointer">Houchens</div>
            <div className="px-2 py-1 hover:bg-blue-200 transition-all duration-200 cursor-pointer">IGA</div>
            {/* {filteredData.map((store, idx) => (
              <div key={`store-${idx}`} onClick={() => handleSelect(store)}>
                <div className="px-2 hover:bg-scroll_hover transition-all duration-200 cursor-pointer">
                  {store.store_Name}
                </div>
              </div>
            ))} */}
          </div>
          {/* {error.length > 0 ? <div data-testid="error">{error}</div> : null} */}
        </div>
      </div>
    </div>
  );
};

export default SelectStore;
