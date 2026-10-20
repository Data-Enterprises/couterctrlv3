import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import EditableCell from "./EditableCell";
import type { InvoiceRow } from "./present";
import type { InvoiceEdit } from "./vendors/awg/applyEdit";

/**
 * #, item, UPC, AWG code, size, qty, unit cost, ext cost, ext retail.
 *
 * The eight editable columns, in the order the source tool shows them, with a
 * line number in front. Right-aligned numbers get a wider gutter than the 8px
 * the app uses elsewhere: four money columns side by side with no gap read as
 * one long number. The Item column absorbs the difference.
 */
const LINE_COLS = "26px minmax(0,1.6fr) 96px 72px 62px 44px 72px 78px 78px";

interface Props {
  row: InvoiceRow;
  open: boolean;
  onToggle: () => void;
  /** Which fields on this invoice have been corrected, as `field` or
   *  `rowIndex:field`. */
  editedKeys: Set<string>;
  onEdit: (edit: Omit<InvoiceEdit, "docId">) => void;
  onRevert: (key: Omit<InvoiceEdit, "docId" | "value">) => void;
  onMerge: (group: { itemCode: string; retailPrice: string }) => void;
}

const Figure = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0">
    <div className="font-mono text-[9.5px] uppercase tracking-wider text-content/85">
      {label}
    </div>
    <div className="truncate font-display text-[14px] font-bold text-content">
      {value}
    </div>
  </div>
);

/**
 * One invoice, opening where it sits.
 *
 * Collapsed it carries the answer the file was opened for: does this invoice
 * balance. A file holds ten of them and the first question is which one does
 * not, so every card states its verdict without being opened.
 *
 * Open, the four checks come first and the lines second. The checks are the
 * only thing here that says whether to believe the rest — a hundred and fifty
 * lines look equally convincing whether the decode was right or wrong.
 */
const InvoiceCard = ({
  row,
  open,
  onToggle,
  editedKeys,
  onEdit,
  onRevert,
  onMerge,
}: Props) => {
  const Chevron = open ? ChevronDownIcon : ChevronRightIcon;

  const headerCell = (
    field: "delv_date" | "retail_dept",
    label: string,
    value: string,
  ) => (
    <EditableCell
      label={label}
      value={value}
      field={field}
      edited={editedKeys.has(field)}
      onCommit={(next) => onEdit({ kind: "header", field, value: next })}
      onRevert={() => onRevert({ kind: "header", field })}
    />
  );

  return (
    <section
      className={`overflow-hidden rounded-xl border bg-custom-white shadow-sm ${
        open ? "border-gray-300" : "border-gray-200"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-bkg"
      >
        <Chevron className="h-4 w-4 flex-none text-content/85" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-[13.5px] font-bold text-content">
            Invoice {row.invoiceNbr}
          </span>
          <span className="block truncate font-mono text-[10px] uppercase tracking-wider text-content/85">
            Store {row.storeNbr}
            {row.deliveryDate ? ` · ${row.deliveryDate}` : ""}
            {row.retailDept ? ` · dept ${row.retailDept}` : ""} ·{" "}
            {row.lineCount} {row.lineCount === 1 ? "line" : "lines"}
          </span>
        </span>
        <span className="flex-none text-right">
          <span className="block font-display text-[14px] font-bold text-content">
            ${row.totalCost}
          </span>
          <span
            className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
              row.reconciled
                ? "bg-severity_healthy_bg text-severity_healthy_text"
                : "bg-severity_critical_bg text-severity_critical_text"
            }`}
          >
            {row.reconciled ? "Reconciled" : "Check"}
          </span>
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-100">
          {/* ── what the invoice says about itself ─────────────────── */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-3.5 py-3 sm:grid-cols-4">
            <Figure label="Total cost" value={`$${row.totalCost}`} />
            <Figure label="Total retail" value={`$${row.totalRetail}`} />
            <Figure label="Allowances" value={`$${row.totalAllowances}`} />
            <Figure label="Cases" value={row.totalCases} />
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-gray-100 px-3.5 py-3">
            <div className="min-w-0">
              <div className="mb-0.5 font-mono text-[9.5px] uppercase tracking-wider text-content/85">
                Invoice date
              </div>
              {headerCell("delv_date", "Invoice date", row.deliveryDate ?? "")}
            </div>
            <div className="min-w-0">
              <div className="mb-0.5 font-mono text-[9.5px] uppercase tracking-wider text-content/85">
                Department
              </div>
              {headerCell("retail_dept", "Department", row.retailDept)}
            </div>
          </div>

          {/* ── the checks ─────────────────────────────────────────── */}
          <div className="border-t border-gray-100 px-3.5 py-3">
            <div className="mb-1.5 font-mono text-[9.5px] uppercase tracking-wider text-content/85">
              Reconciliation
            </div>
            {row.note && (
              <p className="mb-2 rounded bg-severity_watch_bg px-2 py-1.5 text-[12px] text-severity_watch_text">
                {row.note}
              </p>
            )}
            <div className="overflow-hidden rounded border border-gray-200">
              <div className="grid grid-cols-[1fr_84px_84px_80px] gap-2 border-b border-gray-200 bg-gray-50 px-2 py-1.5 font-mono text-[9.5px] uppercase tracking-wider text-content/85">
                <span>Check</span>
                <span className="text-right">Derived</span>
                <span className="text-right">Reported</span>
                <span className="text-right">Difference</span>
              </div>
              {row.checks.map((check) => (
                <div
                  key={check.label}
                  className={`grid grid-cols-[1fr_84px_84px_80px] gap-2 px-2 py-1.5 text-[12px] tabular-nums ${
                    check.ok ? "" : "bg-severity_critical_bg"
                  }`}
                >
                  <span
                    className={
                      check.ok
                        ? "text-content"
                        : "font-semibold text-severity_critical_text"
                    }
                  >
                    {check.label}
                  </span>
                  <span className="text-right text-content">{check.derived}</span>
                  <span className="text-right text-content">{check.reported}</span>
                  <span
                    className={`text-right ${
                      check.ok
                        ? "text-content/85"
                        : "font-semibold text-severity_critical_text"
                    }`}
                  >
                    {check.ok ? "—" : check.difference}
                  </span>
                </div>
              ))}
            </div>

            {/* Repeated random-weight lines each carry the group's extended
                retail, so the derived retail counts it once per line. One
                line per group is how the vendor's total reads it. */}
            {row.mergeGroups.map((group) => (
              <div
                key={`${group.itemCode}-${group.retailPrice}`}
                className="mt-2 flex items-center gap-3 rounded bg-severity_watch_bg px-2 py-1.5 text-[12px] text-severity_watch_text"
              >
                <span className="min-w-0 flex-1">
                  {group.lineCount} lines of {group.itemCode}{" "}
                  {group.description} repeat the same ext retail. Combined:
                  qty {group.cases}, ext cost ${group.extCost}, ext retail $
                  {group.extRetail}.
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onMerge({
                      itemCode: group.itemCode,
                      retailPrice: group.retailPrice,
                    })
                  }
                  className="flex-none rounded-md bg-brand_navy px-2.5 py-1 text-[11px] font-semibold text-custom-white hover:bg-brand_navy_hover"
                >
                  Combine lines
                </button>
              </div>
            ))}
          </div>

          {/* ── the lines ──────────────────────────────────────────── */}
          <div className="border-t border-gray-100 px-3.5 py-3">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="font-mono text-[9.5px] uppercase tracking-wider text-content/85">
                Lines
              </span>
              <span className="text-[11px] text-content/85">
                Click a value to correct it
              </span>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[760px]">
                <div
                  className="grid gap-2.5 border-b border-gray-200 pb-1.5 font-mono text-[9.5px] uppercase tracking-wider text-content/85"
                  style={{ gridTemplateColumns: LINE_COLS }}
                >
                  <span>#</span>
                  <span>Item</span>
                  <span>UPC</span>
                  <span>AWG code</span>
                  <span>Size</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right">Unit cost</span>
                  <span className="text-right">Ext cost</span>
                  <span className="text-right">Ext retail</span>
                </div>

                {row.lines.map((line, index) => {
                  const cell = (
                    field: string,
                    label: string,
                    value: string,
                    align: "left" | "right" = "left",
                    mono = false,
                  ) => (
                    <EditableCell
                      label={`Line ${line.lineNumber} ${label}`}
                      value={value}
                      field={field}
                      align={align}
                      mono={mono}
                      edited={editedKeys.has(`${index}:${field}`)}
                      onCommit={(next) =>
                        onEdit({
                          kind: "line",
                          field,
                          value: next,
                          rowIndex: index,
                        })
                      }
                      onRevert={() =>
                        onRevert({ kind: "line", field, rowIndex: index })
                      }
                    />
                  );

                  return (
                    <div
                      key={line.lineNumber}
                      className="grid items-center gap-2.5 border-b border-gray-100 py-0.5 odd:bg-row_stripe"
                      style={{ gridTemplateColumns: LINE_COLS }}
                    >
                      <span className="px-1 text-[11px] tabular-nums text-content/85">
                        {line.lineNumber}
                      </span>
                      {cell("item_desc", "item", line.description)}
                      {cell("upc_code", "UPC", line.upc, "left", true)}
                      {cell("item_code_bil", "AWG code", line.awgCode, "left", true)}
                      {cell("size", "size", line.size)}
                      {cell("case_qty_billed", "quantity", line.cases, "right")}
                      {cell("mbr_case_cost", "unit cost", line.caseCost, "right")}
                      {cell("cost_ext", "extended cost", line.extCost, "right")}
                      {cell("ba_retail_ext", "extended retail", line.extRetail, "right")}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default InvoiceCard;
