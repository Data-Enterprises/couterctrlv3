// Hooks
import { useEffect, useRef, useState, type ReactNode } from "react";

// Interfaces
import type { AssignPanelItem } from "./interfaces";

// Components
import TextFilter from "./filters/TextFilter";
import ConfirmModal from "./ConfirmModal";
import SelectShown from "./SelectShown";

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
  //
  // "global" ignores the SEARCH BOX. It does not ignore `leftPredicate`: that
  // is a scoping control, not a find-as-you-type, and a button that assigns
  // 372 people while the column above it says 1 is not a parity decision, it
  // is a mass write nobody asked for.
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
  // An extra control beside the left search box. Only the caller knows what
  // else there is to filter by -- "already in company X" is the useful one
  // for a user list and means nothing to a list of stores.
  //
  // Rendered in the open, not behind a disclosure. It sat behind a funnel
  // first and that was wrong twice over: nobody finds a filter by clicking an
  // unlabelled icon, and a column narrowed by a control you cannot see just
  // looks like a short column.
  leftFilters?: ReactNode;
  // Applied alongside the left search box. It narrows what is LISTED without
  // changing `leftItems`, so the heading can still say "12 of 405" -- a
  // caller that pre-filtered its own array would have thrown that 405 away.
  leftPredicate?: (item: AssignPanelItem) => boolean;
  // One line under the left search box saying what is worth typing into it.
  // A placeholder can say "name or email"; it has no room to say that an
  // email DOMAIN pulls back a whole company at once, which is the thing
  // nobody guesses and the thing that saves the most work.
  searchHint?: ReactNode;
  /** A write is running: every button is off until it finishes, so a second
   *  click can't fire against a list that is about to change. */
  moving?: boolean;
  /**
   * What Assign all / Unassign all ask first, or null to go straight ahead.
   * The caller words it, since only it knows what is being given and who is
   * pressing. Leaving it out keeps the old no-question behaviour.
   */
  confirmBulk?: (
    direction: "in" | "out",
    ids: number[],
  ) => { message: string; confirmLabel: string } | null;
}

/** Two searchable columns with Assign / Unassign buttons between them: pick rows
 *  in one column and move them to the other, or move all of them after a
 *  confirm. */
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
  searchHint,
  moving = false,
  confirmBulk,
}: AssignPanelProps) => {
  const [leftFilter, setLeftFilter] = useState("");
  /** An Assign all / Unassign all waiting on its question, with the rows
   *  it would move, so the question can show exactly who. */
  const [pending, setPending] = useState<{
    direction: "in" | "out";
    ids: number[];
    rows: AssignPanelItem[];
    message: string;
    confirmLabel: string;
  } | null>(null);
  const [rightFilter, setRightFilter] = useState("");
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

  // Two stages, because "Assign all" needs the middle one. The predicate is
  // the caller's scope and always applies; the search box is the reader's and
  // "global" steps over it.
  const scopedLeft = leftItems.filter((i) => leftPredicate?.(i) ?? true);
  const filteredLeft = scopedLeft.filter((i) => matches(i, leftFilter));
  const assignAllLeft =
    assignAllScope === "global" ? scopedLeft : filteredLeft;

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

  /** Assign all and Unassign all: asked first when the caller says so. */
  const bulk = (direction: "in" | "out", ids: number[]) => {
    const ask = confirmBulk?.(direction, ids);
    if (ask) {
      const byId = new Map(
        (direction === "in" ? leftItems : rightItems).map((i) => [i.id, i]),
      );
      const rows = ids
        .map((id) => byId.get(id))
        .filter((i): i is AssignPanelItem => i !== undefined);
      setPending({ direction, ids, rows, ...ask });
      return;
    }
    if (direction === "in") handleAssign(ids);
    else handleUnassign(ids);
  };

  return (
    <div className="flex gap-3">
      {pending && (
        <ConfirmModal
          title={pending.direction === "in" ? `${verbs.assign} all?` : `${verbs.unassign} all?`}
          message={pending.message}
          confirmLabel={pending.confirmLabel}
          onConfirm={() => {
            const { direction, ids } = pending;
            setPending(null);
            if (direction === "in") handleAssign(ids);
            else handleUnassign(ids);
          }}
          onCancel={() => setPending(null)}
        >
          {/* Who is about to move, by name: the count alone didn't say
              whether the search had narrowed it the way you meant. */}
          <ul
            aria-label={pending.direction === "in" ? "Being assigned" : "Being unassigned"}
            className="max-h-[40vh] overflow-y-auto thin-scrollbar border border-line_hair rounded-md divide-y divide-line_hair m-0 p-0 list-none"
          >
            {pending.rows.map((r) => (
              <li key={r.id} className="px-2.5 py-1.5 text-[12px] text-content">
                <div className="truncate">{r.label}</div>
                {r.sublabel && (
                  <div className="text-[10.5px] text-content/95 truncate">{r.sublabel}</div>
                )}
              </li>
            ))}
          </ul>
        </ConfirmModal>
      )}
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
          {leftFilters && <div className="flex-shrink-0">{leftFilters}</div>}
        </div>
        {searchHint && (
          <p className="text-[10px] text-content/95 leading-snug mb-1">
            {searchHint}
          </p>
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
        <div className="h-[17.8rem] overflow-y-auto thin-scrollbar border border-line_hair">
          {filteredLeft.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleStaged(item.id)}
              className={`px-2.5 py-1.5 text-[12px] border-b border-line_hair cursor-pointer transition-colors ${
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
            disabled={moving || staged.size === 0}
            className="flex-1 text-[11px] font-medium py-1.5 rounded-md text-custom-white bg-brand_navy hover:bg-brand_navy/85 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {verbs.assign}
          </button>
          <button
            onClick={() => bulk("in", assignAllLeft.map((i) => i.id))}
            disabled={moving || assignAllLeft.length === 0}
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
        <div className="h-[17.8rem] overflow-y-auto thin-scrollbar border border-line_hair">
          {filteredRight.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleUnstaged(item.id)}
              className={`px-2.5 py-1.5 text-[12px] border-b border-line_hair cursor-pointer transition-colors ${
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
            disabled={moving || unstaged.size === 0}
            className="flex-1 text-[11px] font-medium py-1.5 rounded-md text-custom-white bg-red-600 hover:bg-red-600/85 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {verbs.unassign}
          </button>
          <button
            onClick={() =>
              bulk(
                "out",
                (assignAllScope === "global" ? rightItems : filteredRight).map(
                  (i) => i.id,
                ),
              )
            }
            disabled={moving || rightItems.length === 0}
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
