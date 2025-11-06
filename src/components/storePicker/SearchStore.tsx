import { useEffect, useRef } from "react";
import { useAppSelector } from "../../hooks";
import { ChevronUpDownIcon } from "@heroicons/react/24/solid";

interface Props {
  onOutsideClick?: () => void;
}

const SelectStore = ({ onOutsideClick }: Props) => {
  const context = useAppSelector((state) => state.app);
  const componentRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

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
  const inputStyle = "basic-input focus:border bg-custom-white w-full";

  return (
    <div ref={componentRef} className={styling}>
      <div className="flex flex-col">
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
              value={"<store name>"}
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
            className="absolute w-full p-2 py-2 bg-custom-white text-content
            max-h-[350px] overflow-y-scroll z-20 rounded-b-xl shadow-lg no-scrollbar
            data-[display=open]:animate-appear
            data-[display=closed]:animate-dissapear
            data-[display=open]:pointer-events-auto
            data-[display=closed]:pointer-events-none"
          >
            <div>Houchens</div>
            <div>IGA</div>
            {/* {filteredData.map((store, idx) => (
              <div key={`store-${idx}`} onClick={() => handleSelect(store)}>
                <div className="px-2 hover:bg-scroll_hover transition-all duration-500 cursor-pointer">
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
