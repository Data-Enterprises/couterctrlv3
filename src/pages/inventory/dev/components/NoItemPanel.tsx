interface NoItemPanelProps {
  /** What to open first, in the page's own words. */
  message: string;
}

/** The right-hand panel before an item is picked. */
const NoItemPanel = ({ message }: NoItemPanelProps) => (
  <div className="flex-1 min-w-0 shadow-lg">
    <div className="cc-panel shadow-sm h-full items-center justify-center">
      <p className="text-[14px] text-content/95">{message}</p>
    </div>
  </div>
);

export default NoItemPanel;
