import { useEffect, useRef } from "react";
import { useAppSelector } from "../../hooks";
// import { useDispatch } from "react-redux";
// import { JsonError } from "../../interfaces";
// import {
//   setAssignedStores,
//   setLastStoreName,
// } from "../../features/searchSlice";
// import { setLastStore } from "../../features/searchSlice";
// import { assignedStores } from "../../apis/assign";
import { ChevronUpDownIcon } from "@heroicons/react/24/solid";
// import { AssignedStore } from "../../interfaces";
// import { setSelectedStore } from "../../features/salesSlice";

interface Props {
  onOutsideClick?: () => void;
}

const SelectStore = ({ onOutsideClick }: Props) => {
  const context = useAppSelector((state) => state.app);
  // const searchState = useAppSelector((state) => state.search);
  // const userState = useAppSelector((state) => state.user);
  // const [error, setError] = useState("");
  // const [query, setQuery] = useState("");
  // const [filteredData, setFilteredData] = useState<AssignedStore[]>([]);
  // const dispatch = useDispatch();

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

  // useEffect(() => {
  //   const selectedStore = filteredData.find(
  //     (s) => s.storeid == +searchState.lastStore
  //   );
  //   if (selectedStore) {
  //     setQuery(selectedStore.store_Name);
  //   }
  // }, [filteredData, userState.lastSearch, searchState.type]);

  // const getData = () => {
  //   assignedStores(context.url, context.token, userState.userid)
  //     .then((resp) => {
  //       const j = resp.data;
  //       if (j.error == "0") {
  //         dispatch(setAssignedStores(j.stores));
  //         setFilteredData(j.stores);
  //       } else {
  //         setError(j.msg);
  //         dispatch(setAssignedStores([]));
  //       }
  //     })
  //     .catch((e: JsonError) => {
  //       setError(e.message);
  //       dispatch(setAssignedStores([]));
  //     });
  // };

  // const handleSelect = (store: AssignedStore) => {
  //   dispatch(setLastStore(store.storeid));
  //   dispatch(setLastStoreName(store.store_Name));

  //   setQuery(store.store_Name);
  //   if (listRef.current) {
  //     listRef.current.setAttribute("data-display", "closed");
  //   }
  // };

  // const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setQuery(e.target.value);
  //   if (e.target.value.length === 0) {
  //     setFilteredData(searchState.assignedStores);
  //   } else {
  //     const filtered = searchState.assignedStores.filter((store) =>
  //       store.store_Name.toLowerCase().includes(e.target.value.toLowerCase())
  //     );
  //     setFilteredData(filtered);
  //   }
  // };

  const handleTriggerClick = () => {
    if (listRef.current) {
      const currentStatus = listRef.current.getAttribute("data-display");
      listRef.current.setAttribute(
        "data-display",
        currentStatus === "open" ? "closed" : "open"
      );
    }
  };

  const styling = context.isDesktop ? "w-3/4 px-4 md:px-0 md:w-full" : "w-full";
  const inputStyle = context.isDesktop
    ? "basic-input bg-custom-white w-full md:w-72"
    : "basic-input bg-custom-white w-full";

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
            max-h-[350px] overflow-y-scroll z-20 rounded-b-xl shadow-lg
            data-[display=open]:animate-appear
            data-[display=closed]:animate-dissapear
            data-[display=open]:pointer-events-auto
            data-[display=closed]:pointer-events-none"
          >
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
