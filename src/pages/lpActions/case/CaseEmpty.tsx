/**
 * The right panel with nobody selected.
 *
 * Reachable in one situation only: the walk came back with no exceptions at
 * all, so the roster has nobody to auto-select. It still renders the panel
 * shell rather than leaving a hole, because a missing panel reads as a broken
 * page and an empty one reads as an answer.
 */
const CaseEmpty = () => (
  <div className="flex-shrink-0 shadow-lg" style={{ width: "68%" }}>
    <div className="bg-custom-white rounded-xl shadow-sm h-full flex items-center justify-center">
      <p className="text-[12px] text-content/85 px-6 text-center">
        Pick a cashier to open their case.
      </p>
    </div>
  </div>
);

export default CaseEmpty;
