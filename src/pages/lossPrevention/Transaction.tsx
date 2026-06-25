import { forwardRef, useImperativeHandle } from "react";
import type { TransactionListItem } from "../../interfaces";
import { formatCurrency2 } from "../../utils";
import { exportData } from "../../utils/export";
import { useAppSelector } from "../../hooks";
import { emailTransaction } from "../../api/lossPrevention";
import { useToast } from "../../components/toasts/hooks/useToast";


export interface TransactionHandle {
  email: () => void;
  export: () => void;
}

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

const Transaction = forwardRef<TransactionHandle, TransactionProps>(({ trans }, ref) => {
  const toast = useToast();
  const context = useAppSelector((s) => s.app);
  const { selectedSaleType } = useAppSelector((s) => s.lossPrevention);

  const first = trans[0];
  const saleId = first.sale_id.split("-")[1];
  const rawDate = first.sale_date.split("T")[0];
  const fmtDate = new Date(rawDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = `${fmtTime(first.sale_start_time)} – ${fmtTime(first.sale_end_time)}`;

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

  useImperativeHandle(ref, () => ({
    email: handleEmail,
    export: handleExport,
  }));

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* KPI strip: Trans ID / Date / Time / Cashier / Terminal */}
      <div className="flex-shrink-0 grid divide-x divide-gray-100 border-b border-gray-100 bg-white" style={{ gridTemplateColumns: "0.97fr 1.15fr 0.97fr 0.97fr 0.97fr 0.97fr" }}>
        {[
          { label: "Trans ID",    value: `#${saleId}` },
          { label: "Date",        value: fmtDate },
          { label: "Start Time",  value: fmtTime(first.sale_start_time) },
          { label: "End Time",    value: fmtTime(first.sale_end_time) },
          { label: "Cashier",     value: `#${first.cashier_number}` },
          { label: "Terminal",    value: first.terminal },
        ].map(({ label, value }) => (
          <div key={label} className="px-3 py-2">
            <div className="text-[8px] font-bold uppercase tracking-wide text-content/40">{label}</div>
            <div className="text-[11px] font-medium text-[#1e2a4a] mt-0.5">{value}</div>
          </div>
        ))}
      </div>

      {/* Column headers */}
      <div className="flex-shrink-0 grid gap-1 px-4 py-1.5 bg-gray-100 border-b border-gray-100" style={{ gridTemplateColumns: "80px 1fr 28px 62px 55px" }}>
        {["UPC", "Description", "Qty", "Net", "Type"].map((h, i) => (
          <div key={h} className="text-[9px] font-bold uppercase tracking-wide text-content/40" style={{ textAlign: i >= 2 ? "right" : "left" }}>
            {h}
          </div>
        ))}
      </div>

      {/* Line items + sticky totals */}
      <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar px-4 pt-3 relative">
        {/* Rows */}
        {trans.map((item, i) => {
          const isVoid = item.sale_type.toLowerCase().includes("void");
          const isCoupon = item.is_coupon === 1 || item.coupon_amount > 0;
          // const displayNet = selectedSaleType === "Description" ? item.total_sales : item.net_sales;
          const displayNet = item.net_sales;
          const stamps = !context.isMobile ? renderStamps(item) : null;
          return (
            <div key={i} className="grid gap-1 py-1.5 border-b border-gray-50 items-center" style={{ gridTemplateColumns: "80px 1fr 28px 62px 55px" }}>
              <div className="text-[9px] text-content/65 truncate">{item.product_code || "—"}</div>
              <div className="text-[10px] text-content truncate">
                {item.product_description}
                {stamps && <span className="ml-1.5 text-[8px] font-semibold text-white px-1 py-px rounded" style={{ background: "#1e2a4a" }}>{stamps}</span>}
              </div>
              <div className="text-[10px] text-content/75 text-right">{item.qty ?? 0}</div>
              <div className={`text-[10px] font-medium text-right ${isVoid ? "text-content/55 line-through" : isCoupon ? "text-red-500" : "text-content"}`}>
                {formatCurrency2(displayNet)}
              </div>
              <div className="flex items-center justify-end">
                <span className="text-[8px] uppercase tracking-wide px-1 py-px rounded bg-gray-100 text-content/65">
                  {item.sale_type}
                </span>
              </div>
            </div>
          );
        })}

        {/* Totals — sticky to bottom of scroll area */}
        <div className="flex justify-end pt-3 pb-3 border-t border-gray-100 bg-custom-white" style={{ position: "sticky", bottom: 0 }}>
          <div style={{ minWidth: 160 }}>
            <div className="flex justify-between text-[10px] py-0.5">
              <span className="text-content/65">Net sales</span>
              <span className="font-medium text-content">{formatCurrency2(netSales)}</span>
            </div>
            {totalTax > 0 && (
              <div className="flex justify-between text-[10px] py-0.5">
                <span className="text-content/65">Tax</span>
                <span className="font-medium text-content">{formatCurrency2(totalTax)}</span>
              </div>
            )}
            {voidAmount !== 0 && (
              <div className="flex justify-between text-[10px] py-0.5">
                <span className="text-content/65">Voided</span>
                <span className="font-medium text-content">{formatCurrency2(voidAmount)}</span>
              </div>
            )}
            {refundAmount !== 0 && (
              <div className="flex justify-between text-[10px] py-0.5">
                <span className="text-content/65">Refunded</span>
                <span className="font-medium text-content">{formatCurrency2(refundAmount)}</span>
              </div>
            )}
            <div className="border-t border-dashed border-gray-200 mt-1 pt-1.5 flex justify-between">
              <span className="text-[11px] font-semibold text-content">Total</span>
              <span className="text-[12px] font-semibold text-content">{formatCurrency2(totalSales)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Transaction.displayName = "Transaction";

export default Transaction;
