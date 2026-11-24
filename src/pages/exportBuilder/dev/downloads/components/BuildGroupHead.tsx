interface BuildGroupHeadProps {
  /** The configuration the builds came from, or Ad-hoc. */
  name: string;
  count: number;
}

/** A group's heading: the configuration's name and how many builds it has. */
const BuildGroupHead = ({ name, count }: BuildGroupHeadProps) => (
  <div className="flex items-baseline gap-2">
    <span className="text-[11px] cc-caps">{name}</span>
    <span className="text-[11px] text-content/95">
      {count} build
      {count === 1 ? "" : "s"}
    </span>
  </div>
);

export default BuildGroupHead;
