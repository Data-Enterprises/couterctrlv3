/**
 * "East (Houchens) is set to pick stores with none picked."
 *
 * A group held as `selected` with nothing selected is a 400 from the server —
 * "only these stores, and there are none" is not a grant — and it is a real
 * place to land: tick a group, choose Pick stores, tick nothing. So it is
 * named before the save is tried rather than failing one group at a time.
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
        {labels.length === 1 ? "is" : "are"} set to pick stores with none
        picked. Pick at least one store, switch to Auto, or untick the group.
      </span>
    </div>
  );
};

export default EmptyPicksNotice;
