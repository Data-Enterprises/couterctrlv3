/**
 * "East (Houchens) has no stores picked."
 *
 * A group held By store with nothing picked grants nobody anything. The
 * server accepts it — "holds the group, picked nothing yet" — but on this
 * screen it is nearly always an accident: untick every store in East and
 * forget East is still ticked. So it is named before the save is tried.
 *
 * Takes resolved labels rather than ids. The panel can only name a group
 * whose company it has loaded, so left to itself it says "Group 54" for
 * anything the reader has not browsed to — which is the one case this notice
 * exists for, since a group you are looking at is one whose name is on screen
 * anyway.
 */
const EmptyPicksNotice = ({ labels }: { labels: string[] }) => {
  if (labels.length === 0) return null;
  return (
    <div className="px-3 py-2 rounded-lg bg-brand_danger_bg border border-brand_danger_line flex-shrink-0">
      <span className="text-[11.5px] text-content leading-snug">
        <span className="font-semibold">{labels.join(", ")}</span>{" "}
        {labels.length === 1 ? "has" : "have"} no stores picked. Pick at
        least one store, or untick the group.
      </span>
    </div>
  );
};

export default EmptyPicksNotice;
