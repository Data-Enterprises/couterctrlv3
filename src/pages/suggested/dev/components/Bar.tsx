/**
 * One shimmering bar. Widths vary per row so the block reads as a list of
 * different names rather than a striped placeholder.
 *
 * Loading states shaped like the thing that is arriving.
 *
 * The page used to drop `LoadingIndicator` into whichever panel was waiting.
 * Two problems with that. It is `position: absolute; inset: 0` with no
 * positioned ancestor in the store tree, so it escaped the panel and floated in
 * the middle of the page — a pill that said "Loading stores" nowhere near the
 * store list. And even contained it is a badge over blank space: it says
 * something is happening, not what, and it appeared alongside "Select a store",
 * so the panel told the reader to pick from a list that did not exist yet.
 *
 * These draw the shape of the incoming content instead. The columns line up
 * with the real ones, so the panel does not jump when the data lands, and
 * nobody has to read a label to know what is on its way.
 */
const Bar = ({ w = "100%" }: { w?: string }) => (
  <div
    className="h-3 rounded bg-gray-200 animate-pulse"
    style={{ width: w }}
    aria-hidden
  />
);

export default Bar;
