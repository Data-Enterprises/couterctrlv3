// Color key for BeforeAfterBar's two shades — rendered once above a group
// of bars rather than repeated per bar.
const BeforeAfterLegend = () => {
  return (
    <div className="flex items-center gap-2.5 text-[10px] text-content/85">
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-sm bg-[#1e2a4a]/60 inline-block" />
        Before
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-sm bg-blue-600/60 inline-block" />
        After
      </span>
    </div>
  );
};

export default BeforeAfterLegend;
