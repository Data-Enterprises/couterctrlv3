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
 *
 * The UPC column fits a whole 15-digit UPC at the cell's 12px monospace —
 * every UPC on the file is that long, and a truncated one cannot be read off
 * against a label.
 */
const LINE_COLS = "26px minmax(0,1.6fr) 124px 72px 62px 44px 72px 78px 78px";

interface Props {
  row: InvoiceRow;
  open: boolean;
  onToggle: () => void;
  /** Which fields on this invoice have been corrected, as `field` or
   *  `rowIndex:field`. */
  editedKeys: Set<string>;
  onEdit: (edit: Omit<InvoiceEdit, "docId">) => void;
  onRevert: (key: Omit<InvoiceEdit, "docId" | "value">) => void;
}

type Check = InvoiceRow["checks"][number];

/**
 * One figure, and — for the four the vendor's total checks — whether it
 * agrees. A figure that is off reads red with its difference under it, so a
 * miss is visible on the card without opening the checks.
 */
const Figure = ({
  label,
  value,
  check,
  money = true,
  title,
}: {
  label: string;
  value: string;
  check?: Check;
  money?: boolean;
  /** Hover text explaining the figure. */
  title?: string;
}) => {
  const off = check && !check.ok;
  const prefix = money ? "$" : "";
  return (
    <span className="block min-w-0" title={title}>
      <span className="block font-mono text-[11px] uppercase tracking-wider text-content">
        {label}
      </span>
      <span
        className={`block truncate font-display text-[14px] font-bold ${
          off ? "text-severity_critical_text" : "text-content"
        }`}
      >
        {prefix}
        {value}
      </span>
      {off && (
        <span
          className="block truncate text-[10.5px] font-semibold text-severity_critical_text"
          title={`AWG reports ${prefix}${check.reported}`}
        >
          {check.offBy.startsWith("-") ? "-" : "+"}
          {prefix}
          {check.offBy.replace(/^[+-]/, "")} vs AWG
        </span>
      )}
    </span>
  );
};

/**
 * One invoice, opening where it sits.
 *
 * Collapsed it carries the answer the file was opened for: does this invoice
 * balance. A file holds ten of them and the first question is which one does
 * not, so every card states its verdict without being opened — and its
 * figures, cost through cases, so reading them is not a click per invoice.
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
}: Props) => {
  const Chevron = open ? ChevronDownIcon : ChevronRightIcon;
  const checkFor = (id: Check["id"]) =>
    row.checks.find((check) => check.id === id);

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
      {/* The whole visible card opens it — header and figures — not just
          the title row: the figures are most of what is on screen, and a
          click on them should not be a miss. */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="block w-full text-left hover:bg-bkg"
      >
        <span className="flex items-center gap-3 px-3.5 py-2.5">
          <Chevron className="h-4 w-4 flex-none text-content/85" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display text-[13.5px] font-bold text-content">
              Invoice {row.invoiceNbr}
            </span>
            <span className="block truncate font-mono text-[11px] uppercase tracking-wider text-content">
              Store {row.storeNbr}
              {row.deliveryDate ? ` · ${row.deliveryDate}` : ""}
              {row.retailDept ? ` · dept ${row.retailDept}` : ""} ·{" "}
              {row.lineCount} {row.lineCount === 1 ? "line" : "lines"}
            </span>
          </span>
          <span className="flex-none text-right">
            <span
              className={`inline-block whitespace-nowrap rounded px-2 py-1 text-[11px] font-bold ${
                row.status === "nothingBilled"
                  ? "bg-bkg text-content/85"
                  : row.reconciled
                    ? "bg-severity_healthy_bg text-severity_healthy_text"
                    : "bg-severity_critical_bg text-severity_critical_text"
              }`}
            >
              {row.status === "nothingBilled"
                ? "Nothing billed"
                : row.status === "noTotal"
                  ? "No total row"
                  : row.reconciled
                    ? "Reconciled"
                    : "Check"}
            </span>
          </span>
        </span>

        {/* ── what the invoice says about itself ─────────────────────
          On the card itself, open or closed: these are what a file is
          scanned for, and opening each invoice to read them is a click per
          invoice. The cost and what it is made of first — line items plus
          delivery, less pallet allowances — then the rest. An invoice that
          billed nothing has no figures to show. */}
        {row.status !== "nothingBilled" && (
          <span className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-gray-100 px-3.5 py-2 sm:grid-cols-4 lg:grid-cols-8">
            <Figure
              label="Total cost"
              value={row.totalCost}
              check={checkFor("cost")}
            />
            <Figure label="Total line item cost" value={row.lineItemsCost} />
            <Figure label="Delivery fees" value={row.deliveryFees} />
            <Figure label="Pallet allowances" value={row.palletAllowances} />
            {/* Computed — rate × weight on per-pound deals, less what the line
              already took off — so a dash until suggested corrections are
              applied, rather than a zero that reads as "none". */}
            <Figure
              label="Per-lb deals"
              value={row.perLbDeals ?? "—"}
              money={row.perLbDeals !== null}
              title={
                row.perLbDeals === null
                  ? "Apply suggested corrections to read per-pound deals"
                  : "Per-pound deals at rate × weight, less the rate the lines already took off"
              }
            />
            <Figure
              label="Allowances"
              value={row.totalAllowances}
              check={checkFor("allowances")}
            />
            <Figure
              label="Total retail"
              value={row.totalRetail}
              check={checkFor("retail")}
            />
            <Figure
              label="Cases"
              value={row.totalCases}
              check={checkFor("cases")}
              money={false}
            />
          </span>
        )}
      </button>

      {open && (
        <div className="border-t border-gray-100">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-3.5 py-3">
            <div className="min-w-0">
              <div className="mb-0.5 font-mono text-[11px] uppercase tracking-wider text-content">
                Invoice date
              </div>
              {headerCell("delv_date", "Invoice date", row.deliveryDate ?? "")}
            </div>
            <div className="min-w-0">
              <div className="mb-0.5 font-mono text-[11px] uppercase tracking-wider text-content">
                Department
              </div>
              {headerCell("retail_dept", "Department", row.retailDept)}
            </div>
          </div>

          {/* ── the checks ─────────────────────────────────────────── */}
          <div className="border-t border-gray-100 px-3.5 py-3">
            <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-content">
              Reconciliation
            </div>
            {row.note && (
              <p
                className={`mb-2 rounded px-2 py-1.5 text-[12px] ${
                  row.status === "noTotal"
                    ? "bg-severity_critical_bg font-semibold text-severity_critical_text"
                    : row.status === "nothingBilled"
                      ? "bg-bkg text-content"
                      : "bg-severity_watch_bg text-severity_watch_text"
                }`}
              >
                {row.note}
              </p>
            )}
            {row.checks.length > 0 && (
              <div className="overflow-hidden rounded border border-gray-200">
                <div className="grid grid-cols-[1fr_84px_84px_80px] gap-2 border-b border-gray-200 bg-gray-50 px-2 py-1.5 font-mono text-[11px] uppercase tracking-wider text-content">
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
                    <span className="text-right text-content">
                      {check.derived}
                    </span>
                    <span className="text-right text-content">
                      {check.reported}
                    </span>
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
            )}

            {row.unitemizedAllowance && (
              <p className="mt-2 rounded bg-severity_watch_bg px-2 py-1.5 text-[12px] text-severity_watch_text">
                The vendor&rsquo;s total includes ${row.unitemizedAllowance} of
                allowances that no deal record in the file carries. Cost and
                allowances both differ by exactly that amount.
              </p>
            )}
          </div>

          {/* ── what did not ship ───────────────────────────────────── */}
          {row.status === "nothingBilled" && row.exceptions.length > 0 && (
            <div className="border-t border-gray-100 px-3.5 py-3">
              <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-content">
                Exceptions
              </div>
              <div className="overflow-hidden rounded border border-gray-200">
                {row.exceptions.map((exception, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[72px_minmax(0,1fr)_minmax(0,1fr)] gap-2.5 border-b border-gray-100 px-2 py-1.5 text-[12px] last:border-b-0"
                  >
                    <span className="font-mono text-content/85">
                      {exception.itemCode}
                    </span>
                    <span className="truncate text-content">
                      {exception.description}
                    </span>
                    <span className="truncate text-content/85">
                      {exception.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── the lines ──────────────────────────────────────────── */}
          {row.status !== "nothingBilled" && (
            <div className="border-t border-gray-100 px-3.5 py-3">
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-content">
                  Lines
                </span>
                <span className="text-[11px] text-content/85">
                  Click a value to correct it
                </span>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[788px]">
                  <div
                    className="grid gap-2.5 border-b border-gray-200 pb-1.5 font-mono text-[11px] uppercase tracking-wider text-content"
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
                        {cell(
                          "item_code_bil",
                          "AWG code",
                          line.awgCode,
                          "left",
                          true,
                        )}
                        {cell("size", "size", line.size)}
                        {cell(
                          "case_qty_billed",
                          "quantity",
                          line.cases,
                          "right",
                        )}
                        {cell(
                          "mbr_case_cost",
                          "unit cost",
                          line.caseCost,
                          "right",
                        )}
                        {cell(
                          "cost_ext",
                          "extended cost",
                          line.extCost,
                          "right",
                        )}
                        {cell(
                          "ba_retail_ext",
                          "extended retail",
                          line.extRetail,
                          "right",
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default InvoiceCard;
