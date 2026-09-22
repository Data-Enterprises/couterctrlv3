import { useEffect, useRef, useState } from "react";
import { useAppDispatch } from "../../../hooks/index";
import { useLegacySelector as useAppSelector } from "../../hooks";
import { setLastGroup, setSelectedGroup } from "../../../features/searchSlice";
import { setUserPrefs } from "../../api/user";
import { useStorePickerContext } from ".";
import { ChevronUpDownIcon } from "@heroicons/react/24/solid";
import type { Group } from "../../features/groupSlice";

const SelectGroup = () => {
  const context = useStorePickerContext();
  const app = useAppSelector((state) => state.app);
  const dispatch = useAppDispatch();
  const componentRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState<string>("");
  const [filtered, setFiltered] = useState<Group[]>([]);

  // The dropdown shows one side or the other, never both: "Shared" lists the
  // base groups a manager pushed to this user, "Group" the ones they built
  // themselves. Both are ordinary user_groups rows, so everything downstream
  // still treats the pick as a plain group id.
  const scopedGroups = context.groups.filter((g) =>
    context.type === "Shared" ? g.is_shared : !g.is_shared,
  );

  useEffect(() => {
    setFiltered(scopedGroups);
    const group = scopedGroups.find((g) => g.id === context.lastGroup);
    setQuery(group?.group_name || "");
  }, [context.lastGroup, context.groups, context.type]);

  useEffect(() => {
    if (context.selectedGroup) {
      setQuery(context.selectedGroup.group_name);
      setFiltered(scopedGroups);
    }
  }, [context.selectedGroup]);

  useEffect(() => {
    if (!context.selectedGroup || (!query.length && context.selectedGroup)) {
      setFiltered(scopedGroups);
    } else if (context.selectedGroup && query.length > 0) {
      const filteredGroups = scopedGroups.filter((group) =>
        group.group_name.toLowerCase().includes(query.toLowerCase())
      );
      setFiltered(filteredGroups);
    }
  }, [query]);

  useEffect(() => {
    if (componentRef.current) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  const handleSelect = (group: Group) => {
    dispatch(setSelectedGroup(group));
    dispatch(setLastGroup(group.id));
    setUserPrefs(context.url, context.token, {
      userid: context.userid,
      last_group: group.id,
      last_route: context.lastRoute,
      last_search_type: context.type,
    });
    setQuery(group.group_name);

    // Close the dropdown
    if (listRef.current) {
      listRef.current.setAttribute("data-display", "closed");
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

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const styling = "w-full md:px-0";
  const inputStyle =
    "basic-input focus:border bg-custom-white hover:bg-blue-200/50 hover:shadow-inner transition-colors duration-200 cursor-pointer w-full";

  const width = app.isDesktop ? "relative w-full w-full" : "relative w-full";
  return (
    <div data-testid="select-group" ref={componentRef} className={styling}>
      <div className="flex flex-col">
        <label
          htmlFor="group-search"
          data-testid="store-label"
          className="block text-[12px] pl-0.5 font-medium "
        >
          Group
        </label>
        <div className={`relative ${width}`}>
          <div
            data-testid="selectgroup-trigger-ref"
            ref={triggerRef}
            onClick={handleTriggerClick}
          >
            <input
              data-testid="search-group-input"
              value={query}
              onChange={handleQueryChange}
              autoComplete="off"
              type="text"
              name="group-search"
              className={`${inputStyle} text-[13px] py-1 select-none`}
            />
            <div className="absolute top-2 right-2 cursor-pointer">
              <ChevronUpDownIcon className="fill-content" />
            </div>
          </div>
          <div
            data-testid="list-ref"
            ref={listRef}
            data-display="closed"
            className="absolute w-full bg-custom-white text-content
            max-h-[300px] overflow-y-scroll z-20 rounded-b-xl shadow-lg
            data-[display=open]:animate-appear
            data-[display=closed]:animate-dissapear
            data-[display=closed]:hidden
            data-[display=open]:pointer-events-auto
            data-[display=closed]:pointer-events-none"
          >
            {/* This needs to be filtered data by query search */}
            {filtered.map((group, idx) => (
              <div
                data-testid={`selectgroup-${group.id}`}
                key={`group-${idx}`}
                onClick={() => handleSelect(group)}
              >
                <div className="p-1 hover:bg-blue-200 transition-all duration-200 cursor-pointer text-sm">
                  {group.group_name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectGroup;
