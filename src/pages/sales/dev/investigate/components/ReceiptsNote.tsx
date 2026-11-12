/** Says the receipts could not be read, so the missing supply causes read as
 *  missing data rather than as items nobody had to explain. */
const ReceiptsNote = () => (
  <p role="status" className="cc-notice mx-4 mt-3 text-[12.5px] leading-snug">
    <span className="font-bold">
      We couldn&rsquo;t get the receipts information at this time.
    </span>{" "}
    Until it loads, no item here is called never ordered, no receiver on file
    or received but unsold. Items this store did not ring read as Receipts
    unavailable.
  </p>
);

export default ReceiptsNote;
