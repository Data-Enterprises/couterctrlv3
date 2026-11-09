/** The empty state of the receiver detail, asking the user to pick a receiver from the list. */
const NoReceiver = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-1">
      <span className="text-[13px] font-medium text-content/60">
        No receiver selected
      </span>
      <span className="text-[11px] text-content/40">
        Select a receiver from the list to view its line items
      </span>
    </div>
  );
};

export default NoReceiver;
