/**
 * A headed block, so the panel reads as sections rather than a column of
 * loose figures.
 *
 * The two pieces every store-vs-store panel is built from.
 *
 * They were written for the department comparison and the Top 200 comparison
 * wanted exactly the same vocabulary, so they live here rather than in one of
 * them. Two copies of a comparison's dress is how two comparisons on the same
 * screen end up disagreeing about which store is which colour.
 */
const Block = ({
  title,
  action,
  children,
}: {
  title: string;
  /** Sits on the heading's own line, where a section has something to do. */
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  /* A rule BETWEEN blocks, which the first one is not under — against the
     strip above it, it read as a stray line with a gap over it. */
  <div className="border-t border-brand_navy/15 pt-2.5 mt-3 first:border-t-0 first:pt-0 first:mt-0">
    <div className="flex items-center gap-3 mb-1.5">
      <div className="text-[10px] font-bold uppercase tracking-wide text-content/85">
        {title}
      </div>
      {action && <span className="ml-auto flex-shrink-0">{action}</span>}
    </div>
    {children}
  </div>
);

export default Block;
