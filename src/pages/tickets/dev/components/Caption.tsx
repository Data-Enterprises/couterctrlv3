/** A small mono caption over a group of facts in the sidebar. */
const Caption = ({ children }: { children: React.ReactNode }) => (
  <div className="px-3.5 pb-1.5 pt-3.5 font-mono text-[9.5px] uppercase tracking-wider text-content/85">
    {children}
  </div>
);

export default Caption;
