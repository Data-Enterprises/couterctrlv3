/** The drill list's empty state, naming the search when there is one. */
const Empty = ({ query }: { query: string }) => (
  <div className="px-4 py-8 text-center text-[12.5px] text-content/85">
    {query
      ? `Nothing matches "${query}".`
      : "Nothing recorded for this selection."}
  </div>
);

export default Empty;
