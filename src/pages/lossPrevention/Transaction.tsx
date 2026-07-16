import { EnvelopeIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import type { TransactionListItem } from "../../interfaces";
import { formatCurrency2 } from "../../utils";
import { exportData } from "../../utils/export";
import { useAppSelector } from "../../hooks";
import { emailTransaction } from "../../api/lossPrevention";
import { useToast } from "../../components/toasts/hooks/useToast";


interface TransactionProps {
  trans: TransactionListItem[];
}

const fmtTime = (raw: string) => {
  const s = raw.length === 5 ? "0" + raw : raw;
  return `${s.slice(0, 2)}:${s.slice(2, 4)}:${s.slice(4)}`;
};


const renderStamps = (item: TransactionListItem) => {
  const stamps = [];
  if (item.fs > 0) stamps.push("FS");
  if (item.fsa > 0) stamps.push("FSA");
  if (item.wic > 0) stamps.push("WIC");
  return stamps.join(" · ") || null;
};

const typeBadgeClass = (isVoid: boolean, saleType: string) => {
  if (isVoid) return "bg-gray-100 text-gray-500";
  return saleType === "Tender"
    ? "bg-blue-100 text-blue-800"
    : "bg-amber-100 text-amber-800";
};

const Transaction = ({ trans }: TransactionProps) => {
  const toast = useToast();
  const context = useAppSelector((s) => s.app);
  const { selectedSaleType } = useAppSelector((s) => s.lossPrevention);

  const first = trans[0];
  const saleId = first.sale_id.split("-")[1];
  const rawDate = first.sale_date.split("T")[0];
  const fmtDate = new Date(rawDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = `${fmtTime(first.sale_start_time)}–${fmtTime(first.sale_end_time)}`;

  // ── Totals (unchanged calculation logic) ─────────────────────────────────
  let totalSales = 0;
  let netSales = 0;
  let totalTax = 0;
  let voidAmount = 0;
  let refundAmount = 0;

  if (selectedSaleType.toLowerCase() === "voided") {
    const t = trans.filter(
      (t) => t.sale_type.toLowerCase() !== "tender" && t.product_description.toLowerCase() !== "ewic",
    );
    totalTax = t.reduce((acc, cur) => (!cur.sale_type.toLowerCase().includes("void") ? acc + cur.total_rounded_tax : acc), 0);
    voidAmount = t.reduce((acc, cur) => (cur.sale_type.toLowerCase().includes("void") ? acc + cur.net_sales : acc), 0);
    totalSales = t.reduce((acc, cur) => (!cur.sale_type.toLowerCase().includes("void") ? acc + cur.total_sales : acc), 0);
    netSales = t.reduce((acc, cur) => (!cur.sale_type.toLowerCase().includes("void") ? acc + cur.total_sales - cur.total_rounded_tax : acc), 0);
  } else if (selectedSaleType.toLowerCase() === "refunded") {
    const t = trans.slice(0, -1);
    totalSales = t.reduce((acc, cur) => (cur.sale_type.toLowerCase().includes("void") ? acc : acc + cur.total_sales), 0);
    netSales = t.reduce((acc, cur) =>
      cur.sale_type.toLowerCase().includes("refund") || cur.sale_type.toLowerCase().includes("sale")
        ? acc + cur.total_sales - cur.total_rounded_tax : acc, 0);
    totalTax = t.reduce((acc, cur) => (cur.sale_type.toLowerCase().includes("void") ? acc : acc + cur.total_rounded_tax), 0);
    refundAmount = t.reduce((acc, cur) => (cur.sale_type.toLowerCase().includes("refund") ? acc + cur.total_sales : acc), 0);
    voidAmount = t.reduce((acc, cur) => (cur.sale_type.toLowerCase().includes("void") ? acc + cur.net_sales : acc), 0);
  } else {
    const isDesc = selectedSaleType.toLowerCase() === "description";
    const t = isDesc ? trans.slice(0, -1) : trans;
    totalSales = t.reduce((acc, cur) => {
      if (cur.sale_type === "Tender") return acc;
      if (cur.is_coupon === 1 || cur.coupon_amount > 0) return acc - (cur.coupon_amount + Math.abs(cur.total_sales));
      if (!cur.sale_type.toLowerCase().includes("void")) return acc + cur.total_sales;
      return acc;
    }, 0);
    netSales = t.reduce((acc, cur) => {
      if (cur.sale_type === "Tender") return acc;
      if (cur.is_coupon === 1 || cur.coupon_amount > 0) return acc - (cur.coupon_amount + Math.abs(cur.total_sales));
      if (!cur.sale_type.toLowerCase().includes("void")) return acc + cur.total_sales - cur.total_rounded_tax;
      return acc;
    }, 0);
    totalTax = t.reduce((acc, cur) => acc + cur.total_rounded_tax, 0);
    refundAmount = t.reduce((acc, cur) => (cur.sale_type.toLowerCase().includes("refund") ? acc + cur.total_sales : acc), 0);
    voidAmount = t.reduce((acc, cur) => (cur.sale_type.toLowerCase().includes("void") ? acc + cur.net_sales : acc), 0);
  }

  const handleExport = () => {
    const name = `${first.cashier_name}_${saleId}_${rawDate}.csv`;
    exportData<TransactionListItem>(trans, [
      { headerName: "Sale Date", field: "sale_date" },
      { headerName: "Register", field: "terminal" },
      { headerName: "Transaction ID", field: "transaction_id" },
      { headerName: "Product Code", field: "product_code" },
      { headerName: "Product Description", field: "product_description" },
      { headerName: "Sale Start Time", field: "sale_start_time" },
      { headerName: "Sale End Time", field: "sale_end_time" },
      { headerName: "Quantity", field: "qty" },
      { headerName: "Net Sales", field: "net_sales" },
      { headerName: "Sale Type", field: "sale_type" },
    ], name);
  };

  const handleEmail = () => {
    emailTransaction(context.url, context.token, first.sale_id)
      .then((resp) => {
        if (resp.data.error === 0) toast.success("Transaction emailed successfully");
      })
      .catch(() => toast.error("Error emailing transaction"));
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Sub-header — trans id + terminal, date/time subtext, action icons */}
      <div className="flex-shrink-0 flex items-start justify-between gap-2 px-4 py-2.5 border-b border-gray-100">
        <div>
          <div className="text-[13px] font-bold text-content">
            Trans #{saleId}
            <span className="ml-2 text-[10px] font-normal text-content/85">
              Terminal {first.terminal}
            </span>
          </div>
          <div className="text-[10px] text-content/85 mt-0.5">
            {fmtDate} · {timeStr}
          </div>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={handleEmail}
            aria-label="Email transaction"
            className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-content/85 hover:text-content hover:border-gray-300 transition-colors"
          >
            <EnvelopeIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleExport}
            aria-label="Export transaction CSV"
            className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-content/85 hover:text-content hover:border-gray-300 transition-colors"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex-shrink-0 grid gap-1 px-4 py-1.5 bg-gray-100 border-b border-gray-100" style={{ gridTemplateColumns: "84px 1fr 28px 62px 55px" }}>
        {["UPC", "Description", "Qty", "Net", "Type"].map((h, i) => (
          <div key={h} className="text-[9px] font-semibold uppercase tracking-wide text-content" style={{ textAlign: i >= 2 ? "right" : "left" }}>
            {h}
          </div>
        ))}
      </div>

      {/* Line items */}
      <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar px-4 pt-3">
        {trans.map((item, i) => {
          const isVoid = item.sale_type.toLowerCase().includes("void");
          const isCoupon = item.is_coupon === 1 || item.coupon_amount > 0;
          // const displayNet = selectedSaleType === "Description" ? item.total_sales : item.net_sales;
          const displayNet = item.net_sales;
          const stamps = !context.isMobile ? renderStamps(item) : null;
          return (
            <div key={i} className="grid gap-1 py-1.5 border-b border-b-[#1e2a4a]/15 items-center" style={{ gridTemplateColumns: "84px 1fr 28px 62px 55px" }}>
              <div className="text-[10px] text-content truncate">{item.product_code || "—"}</div>
              <div className="text-[10px] font-medium text-content truncate">
                {item.product_description}
                {stamps && <span className="ml-1.5 text-[8px] font-semibold bg-bkg text-content px-1 py-px rounded">{stamps}</span>}
              </div>
              <div className="text-[10px] text-content text-right">{item.qty ?? 0}</div>
              <div className={`text-[10px] font-semibold text-right ${isVoid ? "text-content/55 line-through" : isCoupon ? "text-severity_critical_text" : "text-content"}`}>
                {formatCurrency2(displayNet)}
              </div>
              <div className="flex items-center justify-end">
                <span className={`text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 ${typeBadgeClass(isVoid, item.sale_type)}`}>
                  {item.sale_type}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals — single inline line */}
      <div className="flex-shrink-0 flex items-baseline justify-end gap-4 px-4 py-2.5 border-t border-gray-100 bg-gray-50">
        <span className="text-[11px] text-content/65">
          Net sales <span className="font-semibold text-content">{formatCurrency2(netSales)}</span>
        </span>
        {totalTax > 0 && (
          <span className="text-[11px] text-content/65">
            Tax <span className="font-semibold text-content">{formatCurrency2(totalTax)}</span>
          </span>
        )}
        {voidAmount !== 0 && (
          <span className="text-[11px] text-content/65">
            Voided <span className="font-semibold text-content">{formatCurrency2(voidAmount)}</span>
          </span>
        )}
        {refundAmount !== 0 && (
          <span className="text-[11px] text-content/65">
            Refunded <span className="font-semibold text-content">{formatCurrency2(refundAmount)}</span>
          </span>
        )}
        <span className="text-[13px] font-bold text-content">
          Total {formatCurrency2(totalSales)}
        </span>
      </div>
    </div>
  );
};

export default Transaction;
