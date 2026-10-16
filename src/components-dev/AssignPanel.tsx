import { useEffect, useRef, useState, type ReactNode } from "react";
import { FunnelIcon } from "@heroicons/react/20/solid";
import TextFilter from "./filters/TextFilter";

interface AssignPanelItem {
  id: number;
  label: string;
  sublabel?: string;
}

interface AssignPanelProps {
  leftTitle: string;
  rightTitle: string;
  leftItems: AssignPanelItem[];
  rightItems: AssignPanelItem[];
  onAssign: (ids: number[]) => void;
  onUnassign: (ids: number[]) => void;
  // "filtered" (default) scopes Assign all/Unassign all to whatever the search
  // box currently shows — matches legacy's Stores assign flow. Companies and
  // Base Groups tabs pass "global" since legacy's assign_all/unassign_all
  // there always recomputed from the full unfiltered list, ignoring search.
  assignAllScope?: "filtered" | "global";
  // Optional: reports the right column's current selection to the parent, so a
  // caller can offer an action over the selected rows without this component
  // having to know what that action is. Base Groups uses it for Sync.
  onRightSelectionChange?: (ids: number[]) => void;
  // Change this to clear the right column's selection from outside — after an
  // action has consumed it, say. The selection lives here, so a caller can't
  // clear it by resetting whatever it mirrored the ids into.
  rightSelectionResetKey?: number;
  // What the buttons call the action. Defaults to Assign / Unassign; a panel
  // whose action isn't an assignment says what it does (Shared Groups: Share).
  verbs?: { assign: string; unassign: string };
  // Extra controls for the left column, behind the funnel beside its search
  // box. Only the caller knows what else there is to filter by -- the
  // Companies tab offers "already in company X", which means nothing to the
  // panel that assigns stores to a base group.
  leftFilters?: ReactNode;
  // Applied alongside the left search box. It narrows what is LISTED without
  // changing `leftItems`, so the heading can still say "12 of 405" -- a
  // caller that pre-filtered its own array would have thrown that 405 away.
  leftPredicate?: (item: AssignPanelItem) => boolean;
}

/**
 * Stage or clear every row the column is currently showing.
 *
 * The complaint these filters came from was the clicking, and narrowing 405
 * users down to 12 is no help if all twelve still have to be clicked one at a
 * time. This acts on what is SHOWN and never on the hidden rest -- `Assign
 * all` is the button that ignores the search, and it does so deliberately.
 *
 * Selecting ADDS to what is already staged rather than replacing it, so a
 * selection can be built across several searches: narrow to one company, take
 * all of them, narrow to the next, take those too, then assign once. The
 * running count is there because that only makes sense if you can see it.
 */
const SelectShown = ({
  shown,
  selected,
  onSelectAll,
  onClear,
}: {
  shown: number;
  selected: number;
  onSelectAll: () => void;
  onClear: () => void;
}) => (
  <div className="flex items-center gap-2 mb-1 text-[10px] text-content/85">
    <button
      onClick={onSelectAll}
      disabled={shown === 0}
      className="font-semibold hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
    >
      Select all {shown} shown
    </button>
    {selected > 0 && (
      <>
        <span aria-hidden="true">·</span>
        <span className="font-semibold text-content">{selected} selected</span>
        <button onClick={onClear} className="hover:underline">
          Clear
        </button>
      </>
    )}
  </div>
);

// Shared staged dual-column assign/unassign control — used by the create-user
// wizard's Assignments step, the user profile's Companies/Base groups/Stores
// tabs, and a base group's Assign stores panel.
const AssignPanel = ({
  leftTitle,
  rightTitle,
  leftItems,
  rightItems,
  onAssign,
  onUnassign,
  verbs = { assign: "Assign", unassign: "Unassign" },
  assignAllScope = "filtered",
  onRightSelectionChange,
  rightSelectionResetKey,
  leftFilters,
  leftPredicate,
}: AssignPanelProps) => {
  const [leftFilter, setLeftFilter] = useState("");
  const [rightFilter, setRightFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [staged, setStaged] = useState<Set<number>>(new Set());
  const [unstaged, setUnstaged] = useState<Set<number>>(new Set());

  useEffect(() => {
    onRightSelectionChange?.(Array.from(unstaged));
  }, [unstaged]);

  // Compared against the previous value rather than just firing on mount, so
  // simply rendering the panel doesn't push an empty selection back out.
  const prevResetKey = useRef(rightSelectionResetKey);
  useEffect(() => {
    if (prevResetKey.current === rightSelectionResetKey) return;
    prevResetKey.current = rightSelectionResetKey;
    setUnstaged(new Set());
  }, [rightSelectionResetKey]);

  // The sublabel is searched as well as the label, because it is the email,
  // and "who is on houchens.com" is a question people actually arrive with.
  // Searching only the username made the address visible but not findable.
  const matches = (i: AssignPanelItem, query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      i.label.toLowerCase().includes(q) ||
      (i.sublabel?.toLowerCase().includes(q) ?? false)
    );
  };

  const filteredLeft = leftItems.filter(
    (i) => (leftPredicate?.(i) ?? true) && matches(i, leftFilter),
  );

  // Whether the caller's filter is actually holding anything back. The funnel
  // wears the active state while it is, even when the controls are collapsed
  // — a short list under a plain button looks like a short column, and the
  // reason it is short has to stay visible.
  const filtersNarrowing = leftPredicate
    ? leftItems.some((i) => !leftPredicate(i))
    : false;
  const filteredRight = rightItems.filter((i) => matches(i, rightFilter));

  // The count says what the column shows: while a search narrows it, "4 of 17".
  const countLabel = (shown: number, total: number) =>
    shown === total ? String(total) : `${shown} of ${total}`;

  const toggleStaged = (id: number) => {
    setStaged((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleUnstaged = (id: number) => {
    setUnstaged((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAssign = (ids: number[]) => {
    onAssign(ids);
    setStaged(new Set());
  };

  const handleUnassign = (ids: number[]) => {
    onUnassign(ids);
    setUnstaged(new Set());
  };

  return (
    <div className="flex gap-3">
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="text-[9px] font-bold uppercase tracking-wide text-content mb-1.5">
          {leftTitle} ({countLabel(filteredLeft.length, leftItems.length)})
        </div>
        <div className="mb-1.5 flex items-center gap-1.5">
          <TextFilter
            value={leftFilter}
            onChange={setLeftFilter}
            placeholder={
              leftItems.some((i) => i.sublabel)
                ? "Search name or email…"
                : "Search…"
            }
            className="flex-1 min-w-0"
          />
          {leftFilters && (
            <button
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              title={showFilters ? "Hide filters" : "More filters"}
              className={`w-[26px] h-[26px] flex items-center justify-center rounded-md border flex-shrink-0 transition-colors ${
                showFilters || filtersNarrowing
                  ? "bg-brand_navy border-brand_navy text-custom-white"
                  : "bg-custom-white border-gray-200 text-content/85 hover:bg-gray-50"
              }`}
            >
              <FunnelIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {leftFilters && showFilters && (
          <div className="mb-1.5 animate-nb-drop motion-reduce:animate-none">
            {leftFilters}
          </div>
        )}
        <SelectShown
          shown={filteredLeft.length}
          selected={staged.size}
          onSelectAll={() =>
            setStaged(
              (prev) =>
                new Set([...prev, ...filteredLeft.map((i) => i.id)]),
            )
          }
          onClear={() => setStaged(new Set())}
        />
        <div className="h-[17.8rem] overflow-y-auto thin-scrollbar border border-gray-100">
          {filteredLeft.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleStaged(item.id)}
              className={`px-2.5 py-1.5 text-[12px] border-b border-gray-100 cursor-pointer transition-colors ${
                staged.has(item.id)
                  ? "bg-brand_navy text-custom-white"
                  : "hover:bg-gray-50 text-content"
              }`}
            >
              <div className="truncate">{item.label}</div>
              {item.sublabel && (
                <div className="text-[10px] opacity-70 truncate">
                  {item.sublabel}
                </div>
              )}
            </div>
          ))}
          {filteredLeft.length === 0 && (
            <div className="flex items-center justify-center py-6 text-[11px] text-content">
              Nothing here
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => handleAssign(Array.from(staged))}
            disabled={staged.size === 0}
            className="flex-1 text-[11px] font-medium py-1.5 rounded-md text-custom-white bg-brand_navy hover:bg-brand_navy/85 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {verbs.assign}
          </button>
          <button
            onClick={() =>
              handleAssign(
                (assignAllScope === "global" ? leftItems : filteredLeft).map(
                  (i) => i.id,
                ),
              )
            }
            disabled={leftItems.length === 0}
            className="flex-1 text-[11px] font-medium py-1.5 rounded-md text-custom-white bg-brand_navy hover:bg-brand_navy/85 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {verbs.assign} all
          </button>
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="text-[9px] font-bold uppercase tracking-wide text-content mb-1.5">
          {rightTitle} ({countLabel(filteredRight.length, rightItems.length)})
        </div>
        <div className="mb-1.5">
          <TextFilter
            value={rightFilter}
            onChange={setRightFilter}
            placeholder={
              rightItems.some((i) => i.sublabel)
                ? "Search name or email…"
                : "Search…"
            }
          />
        </div>
        <SelectShown
          shown={filteredRight.length}
          selected={unstaged.size}
          onSelectAll={() =>
            setUnstaged(
              (prev) =>
                new Set([...prev, ...filteredRight.map((i) => i.id)]),
            )
          }
          onClear={() => setUnstaged(new Set())}
        />
        <div className="h-[17.8rem] overflow-y-auto thin-scrollbar border border-gray-100">
          {filteredRight.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleUnstaged(item.id)}
              className={`px-2.5 py-1.5 text-[12px] border-b border-gray-100 cursor-pointer transition-colors ${
                unstaged.has(item.id)
                  ? "bg-red-600 text-custom-white"
                  : "hover:bg-gray-50 text-content"
              }`}
            >
              <div className="truncate">{item.label}</div>
              {item.sublabel && (
                <div className="text-[10px] opacity-70 truncate">
                  {item.sublabel}
                </div>
              )}
            </div>
          ))}
          {filteredRight.length === 0 && (
            <div className="flex items-center justify-center py-6 text-[11px] text-content">
              Nothing here
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => handleUnassign(Array.from(unstaged))}
            disabled={unstaged.size === 0}
            className="flex-1 text-[11px] font-medium py-1.5 rounded-md text-custom-white bg-red-600 hover:bg-red-600/85 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {verbs.unassign}
          </button>
          <button
            onClick={() =>
              handleUnassign(
                (assignAllScope === "global" ? rightItems : filteredRight).map(
                  (i) => i.id,
                ),
              )
            }
            disabled={rightItems.length === 0}
            className="flex-1 text-[11px] font-medium py-1.5 rounded-md text-custom-white bg-red-600 hover:bg-red-600/85 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {verbs.unassign} all
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignPanel;
