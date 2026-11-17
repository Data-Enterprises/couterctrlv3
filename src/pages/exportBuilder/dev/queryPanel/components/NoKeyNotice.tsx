/** The warning over the query box when a summary has aggregates and nothing
 *  to group them by, pointing at the fix on the left. */
const NoKeyNotice = () => (
  <div className="bg-severity_watch_bg border-b border-severity_watch_text/20 px-3 py-2">
    <span className="text-[12.5px] font-semibold text-severity_watch_text">
      This summary has no key to group by.
    </span>{" "}
    <span className="text-[12.5px] text-severity_watch_text">
      Measures need rows to sit in, so the export refuses a summary without at
      least one. Pick one under <strong>Group By</strong> on the left — storeid
      for one row per store, product_code for one per item.
    </span>
  </div>
);

export default NoKeyNotice;
