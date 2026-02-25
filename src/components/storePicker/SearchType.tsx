import { ChevronUpDownIcon } from "@heroicons/react/16/solid";
import { useAppSelector } from "../../hooks";
import { type SEARCH_TYPE, setType } from "../../features/searchSlice";
import { useDispatch } from "react-redux";
import { useEffect, useState, useRef } from "react";
import { setUserPrefs } from "../../api/user";

interface Props {
  singleStoreOnly?: boolean;
}

interface iOption {
  id: number;
  name: string;
  type: SEARCH_TYPE;
}

const options: iOption[] = [
  // { id: 1, name: "Stores", type: "Stores" },
  { id: 3, name: "Store", type: "Store" },
  { id: 2, name: "Group", type: "Group" },
];

const SearchType = ({ singleStoreOnly = false }: Props) => {
  const user = useAppSelector((state) => state.user);
  const context = useAppSelector((state) => state.app);
  const type = useAppSelector((state) => state.search.type);
  const nav = useAppSelector((state) => state.nav);
  const search = useAppSelector((state) => state.search);
  const [query, setQuery] = useState("");
  const dispatch = useDispatch();

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
      }
    }
  };

  useEffect(() => {
    // determine the type from the users preferences
    getType();
    if (componentRef.current) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    if (singleStoreOnly) {
      dispatch(setType("Store"));
      setQuery("Store");
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getType = () => {
    if (singleStoreOnly) {
      return "Store";
    }

    switch (type) {
      case "Group":
        setQuery("Group");
        break;
      case "Store":
        setQuery("Store");
        break;
      default:
        setQuery("Store");
        break;
    }
  };

  const handleSelect = (selection: iOption) => {
    dispatch(setType(selection.type as SEARCH_TYPE));
    setQuery(selection.name);

    // use selection.type to update the user prefs
    setUserPrefs(context.url, context.token, {
      userid: user.userid,
      last_search_type: selection.type,
      last_route: nav.lastRoute,
      last_search: search.lastStore,
      last_group: search.lastGroup,
    }).then((resp) => console.log(resp.data));

    if (listRef.current) {
      listRef.current.setAttribute("data-display", "closed");
    }
  };

  const handleTriggerClick = () => {
    if (listRef.current) {
      const currentStatus = listRef.current.getAttribute("data-display");
      listRef.current.setAttribute(
        "data-display",
        currentStatus === "open" ? "closed" : "open"
      );
    }
  };

  const styling = context.isDesktop ? "px-4 md:px-0 md:w-full" : "w-full";
  const width = context.isDesktop
    ? "relative w-full w-full"
    : "relative w-full";

  return (
    <div ref={componentRef} className={styling}>
      <div className="flex flex-col">
        <label
          htmlFor="search"
          data-testid="type-label"
          className="block text-sm font-medium "
        >
          Type
        </label>
        <div className={width}>
          <div
            data-testid="type-trigger-ref"
            ref={triggerRef}
            onClick={handleTriggerClick}
          >
            <input
              data-testid="type-input"
              defaultValue={query}
              autoComplete="off"
              type="text"
              name="search"
              className="basic-input bg-custom-white hover:bg-blue-200/50 hover:shadow-inner transition-colors duration-200 cursor-pointer focus:border"
            />
            <div className={`${type === 'Store' ? "hidden" : "absolute"} top-2 right-0 w-[24px] cursor-pointer `}>
              <ChevronUpDownIcon className="fill-content" />
            </div>
          </div>
          <div
            data-testid="type-list-ref"
            ref={listRef}
            data-display="closed"
            className="absolute w-full bg-custom-white text-content
            max-h-[350px] overflow-y-scroll z-20 rounded-lg shadow-lg no-scrollbar
            data-[display=open]:animate-appear
            data-[display=closed]:animate-dissapear
            data-[display=closed]:hidden"
          >
            {singleStoreOnly ? (
              <div
                data-testid="searchtype-single-store-option"
                onClick={() =>
                  handleSelect({ id: 3, name: "Store", type: "Store" })
                }
                className="px-2 hover:bg-scroll_hover transition-all duration-500 cursor-pointer"
              >
                <span
                  data-testid="test-single-store"
                  className="block truncate font-normal group-data-[selected]:font-semibold"
                >
                  Store
                </span>
              </div>
            ) : (
              <>
                {options.map((option) => {
                  return (
                    <div
                      data-testid={`st-option-${option.id}`}
                      onClick={() => handleSelect(option)}
                      key={`st-option-${option.id}`}
                      className="px-2 py-2 hover:bg-blue-200 transition-all duration-500 cursor-pointer"
                    >
                      <span className="block truncate font-normal group-data-[selected]:font-semibold">
                        {option.name}
                      </span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchType;
