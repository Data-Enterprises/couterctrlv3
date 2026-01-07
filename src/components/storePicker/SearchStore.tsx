import { useEffect, useRef, useState } from "react";
import { useAppDispatch } from "../../hooks";
import { ChevronUpDownIcon } from "@heroicons/react/24/solid";
import type { Store } from "../../interfaces";
import { setLastStore, setSelectedStore } from "../../features/searchSlice";
import { setUserPrefs } from "../../api/user";
import { useStorePickerContext } from ".";

const SelectStore = () => {
  const dispatch = useAppDispatch();
  const context = useStorePickerContext();
  const componentRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState("flex");
  const [query, setQuery] = useState<string>("");
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);

  useEffect(() => {
    setDisplay(
      context.type === "Store"
        ? "flex flex-col"
        : "flex flex-col opacity-50 pointer-events-none"
    );
    if (context.type === "Stores") {
      listRef.current?.classList.add("hidden");
      setQuery("");
    } else {
      listRef.current?.classList.remove("hidden");
      setQuery(context.selectedStore?.store_name || "");
    }
  }, [context.type]);

  useEffect(() => {
    if (componentRef.current) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setFilteredStores(context.assignedStores);
    const store = context.assignedStores.find(
      (s) => s.storeid === context.lastStore
    );
    if (context.type === "Store") setQuery(store?.store_name || "");
  }, [context.lastStore, context.assignedStores]);

  useEffect(() => {
    if (context.selectedStore && context.type === "Store") {
      setQuery(context.selectedStore.store_name);
      setFilteredStores(context.assignedStores);
    }
  }, [context.selectedStore]);

  // Filter the stores based on the query
  useEffect(() => {
    if (!context.selectedStore || (!query.length && context.selectedStore)) {
      setFilteredStores(context.assignedStores);
    } else if (context.selectedStore && query.length > 0) {
      const filtered = context.assignedStores.filter((store) =>
        store.store_name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredStores(filtered);
    }
  }, [query]);

  const handleClickOutside = (e: MouseEvent) => {
    if (
      componentRef.current &&
      !componentRef.current.contains(e.target as Node)
    ) {
      if (listRef.current) {
        listRef.current.setAttribute("data-display", "closed");
      }
    }
  };

  const handleTriggerClick = () => {
    if (listRef.current) {
      setQuery("");
      const currentStatus = listRef.current.getAttribute("data-display");
      listRef.current.setAttribute(
        "data-display",
        currentStatus === "open" ? "closed" : "open"
      );
    }
  };

  const styling = "w-full px-4 md:px-0";
  const inputStyle =
    "basic-input focus:border bg-custom-white hover:bg-blue-200/50 hover:shadow-inner transition-colors duration-200 cursor-pointer w-full";

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSelect = (store: Store) => {
    dispatch(setSelectedStore(store));
    dispatch(setLastStore(store.storeid));
    setUserPrefs(context.url, context.token, {
      userid: context.userid,
      last_search: store.storeid,
      last_route: context.lastRoute,
      last_search_type: context.type,
    });
    setQuery(store.store_name);

    // Close the dropdown
    if (listRef.current) {
      listRef.current.setAttribute("data-display", "closed");
    }
  };

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
              value={query}
              onChange={handleQueryChange}
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
            max-h-[300px] overflow-y-scroll z-20 rounded-b-xl shadow-lg no-scrollbar
            data-[display=open]:animate-appear
            data-[display=closed]:animate-dissapear
            data-[display=closed]:hidden
            data-[display=open]:pointer-events-auto
            data-[display=closed]:pointer-events-none"
          >
            {/* This needs to be filtered data by query search */}
            {filteredStores.map((store, idx) => (
              <div
                data-testid={`searchstore-${store.storeid}`}
                key={`store-${idx}`}
                onClick={() => handleSelect(store)}
              >
                <div className="p-1 hover:bg-blue-200 transition-all duration-200 cursor-pointer text-sm">
                  {store.store_name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectStore;
