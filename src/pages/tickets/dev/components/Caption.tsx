interface CaptionProps {
  children: React.ReactNode;
}

/** A small mono caption over a group of facts in the sidebar. */
const Caption = ({ children }: CaptionProps) => (
  <div className="px-3.5 pb-1.5 pt-3.5 font-mono text-[9.5px] uppercase tracking-wider text-content/95">
    {children}
  </div>
);

export default Caption;
