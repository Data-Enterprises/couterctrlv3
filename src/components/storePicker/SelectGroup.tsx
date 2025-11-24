import { useEffect, useRef, useState } from "react";
import { useAppDispatch } from "../../hooks";
import { setLastGroup, setSelectedGroup } from "../../features/searchSlice";
import { setUserPrefs } from "../../api/user";
import { useStorePickerContext } from ".";
import { ChevronUpDownIcon } from "@heroicons/react/24/solid";
import type { Group } from "../../features/groupSlice";

interface Props {
  onOutsideClick?: () => void;
}

const SelectGroup = ({ onOutsideClick }: Props) => {
  const context = useStorePickerContext();
  const dispatch = useAppDispatch();
  const componentRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState<string>("");
  const [filtered, setFiltered] = useState<Group[]>([]);

  useEffect(() => {
    setFiltered(context.groups);
    const group = context.groups.find((g) => g.id === context.lastGroup);
    setQuery(group?.group_name || "");
  }, [context.lastGroup, context.groups]);

  useEffect(() => {
    if (context.selectedGroup) {
      setQuery(context.selectedGroup.group_name);
      setFiltered(context.groups);
    }
  }, [context.selectedGroup]);

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
        if (onOutsideClick) onOutsideClick();
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
      if (onOutsideClick) onOutsideClick();
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

  const styling = "w-full px-4 md:px-0";
  const inputStyle =
    "basic-input focus:border bg-custom-white hover:bg-blue-200/50 hover:shadow-inner transition-colors duration-200 cursor-pointer w-full";

  return (
    <div data-testid="select-group" ref={componentRef} className={styling}>
      <div className="flex flex-col">
        <label
          htmlFor="group-search"
          data-testid="store-label"
          className="block text-sm/6 font-medium "
        >
          Group
        </label>
        <div className="relative">
          <div
            data-testid="trigger-ref"
            ref={triggerRef}
            onClick={handleTriggerClick}
          >
            <input
              data-testid="search-group-input"
              value={query}
              onFocus={(e) => e.target.select()}
              autoComplete="off"
              type="text"
              name="group-search"
              className={`${inputStyle} select-none`}
              readOnly
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
            max-h-[300px] overflow-y-scroll z-20 rounded-b-xl shadow-lg no-scrollbar
            data-[display=open]:animate-appear
            data-[display=closed]:animate-dissapear
            data-[display=closed]:hidden
            data-[display=open]:pointer-events-auto
            data-[display=closed]:pointer-events-none"
          >
            {/* This needs to be filtered data by query search */}
            {filtered.map((group, idx) => (
              <div key={`group-${idx}`} onClick={() => handleSelect(group)}>
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
