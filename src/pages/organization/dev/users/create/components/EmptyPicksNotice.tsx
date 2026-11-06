/**
 * "East (Houchens) has no stores picked." A group held By store with nothing
 * picked grants nothing; the server accepts it, but here it is nearly always
 * an accident. Takes resolved labels, since the panel can only name groups it
 * has loaded.
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
