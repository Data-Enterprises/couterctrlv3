interface CaptionProps {
  children: React.ReactNode;
}

/** A small mono caption over a group of facts in the sidebar. */
const Caption = ({ children }: CaptionProps) => (
  <div className="px-3.5 pb-1.5 pt-3.5 cc-caps-mono text-[9.5px]">
    {children}
  </div>
);

export default Caption;
