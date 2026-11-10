/** One labelled figure in the sidebar, label left and value right. */
const Fact = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between gap-3 px-3.5 py-[5px] text-[12px]">
    <span className="text-content/95">{label}</span>
    <span className="font-semibold tabular-nums">{value}</span>
  </div>
);

export default Fact;
