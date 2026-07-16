import type { TransactionListItem } from "../../../interfaces";
import { formatCurrency2 } from "../../../utils";
import { exportData } from "../../../utils/export";
import { useAppSelector } from "../../../hooks";
import { emailTransaction } from "../../../api/lossPrevention";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";

const chipStyle = {
  background: "rgba(30,42,74,0.06)",
  boxShadow: "inset 0 1px 2px rgba(30,42,74,0.08)",
};

interface Props {
  trans: TransactionListItem[];
}

const fmtTime = (raw: string) => {
  const s = raw.length === 5 ? "0" + raw : raw;
  return `${s.slice(0, 2)}:${s.slice(2, 4)}:${s.slice(4)}`;
};

const Transaction = ({ trans }: Props) => {
  const toast = useToast();
  const context = useAppSelector((s) => s.app);
  const { selectedSaleType } = useAppSelector((s) => s.cashier);

  const first = trans[0];
  const saleId = first.sale_id.split("-")[1];
  const rawDate = first.sale_date.split("T")[0];
  const fmtDate = new Date(rawDate + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = `${fmtTime(first.sale_start_time)} – ${fmtTime(first.sale_end_time)}`;

  let totalSales = 0;
  let netSales = 0;
  let totalTax = 0;
  let voidAmount = 0;
  let refundAmount = 0;

  if (selectedSaleType.toLowerCase() === "voided") {
    const t = trans.filter(
      (t) =>
        t.sale_type.toLowerCase() !== "tender" &&
        t.product_description.toLowerCase() !== "ewic",
    );
    totalTax = t.reduce(
      (acc, cur) =>
        !cur.sale_type.toLowerCase().includes("void")
          ? acc + cur.total_rounded_tax
          : acc,
      0,
    );
    voidAmount = t.reduce(
      (acc, cur) =>
        cur.sale_type.toLowerCase().includes("void")
          ? acc + cur.net_sales
          : acc,
      0,
    );
    totalSales = t.reduce(
      (acc, cur) =>
        !cur.sale_type.toLowerCase().includes("void")
          ? acc + cur.total_sales
          : acc,
      0,
    );
    netSales = t.reduce(
      (acc, cur) =>
        !cur.sale_type.toLowerCase().includes("void")
          ? acc + cur.total_sales - cur.total_rounded_tax
          : acc,
      0,
    );
  } else if (selectedSaleType.toLowerCase() === "refunded") {
    const t = trans.slice(0, -1);
    totalSales = t.reduce(
      (acc, cur) =>
        cur.sale_type.toLowerCase().includes("void")
          ? acc
          : acc + cur.total_sales,
      0,
    );
    netSales = t.reduce(
      (acc, cur) =>
        cur.sale_type.toLowerCase().includes("refund") ||
        cur.sale_type.toLowerCase().includes("sale")
          ? acc + cur.total_sales - cur.total_rounded_tax
          : acc,
      0,
    );
    totalTax = t.reduce(
      (acc, cur) =>
        cur.sale_type.toLowerCase().includes("void")
          ? acc
          : acc + cur.total_rounded_tax,
      0,
    );
    refundAmount = t.reduce(
      (acc, cur) =>
        cur.sale_type.toLowerCase().includes("refund")
          ? acc + cur.total_sales
          : acc,
      0,
    );
    voidAmount = t.reduce(
      (acc, cur) =>
        cur.sale_type.toLowerCase().includes("void")
          ? acc + cur.net_sales
          : acc,
      0,
    );
  } else {
    totalSales = trans.reduce((acc, cur) => {
      if (cur.sale_type === "Tender") return acc;
      if (cur.is_coupon === 1 || cur.coupon_amount > 0)
        return acc - (cur.coupon_amount + Math.abs(cur.total_sales));
      if (!cur.sale_type.toLowerCase().includes("void"))
        return acc + cur.total_sales;
      return acc;
    }, 0);
    netSales = trans.reduce((acc, cur) => {
      if (cur.sale_type === "Tender") return acc;
      if (cur.is_coupon === 1 || cur.coupon_amount > 0)
        return acc - (cur.coupon_amount + Math.abs(cur.total_sales));
      if (!cur.sale_type.toLowerCase().includes("void"))
        return acc + cur.total_sales - cur.total_rounded_tax;
      return acc;
    }, 0);
    totalTax = trans.reduce((acc, cur) => acc + cur.total_rounded_tax, 0);
  }

  const handleExport = () => {
    const name = `${first.cashier_name}_${saleId}_${rawDate}.csv`;
    exportData<TransactionListItem>(
      trans,
      [
        { headerName: "Sale Date", field: "sale_date" },
        { headerName: "Terminal", field: "terminal" },
        { headerName: "Transaction ID", field: "transaction_id" },
        { headerName: "Product Code", field: "product_code" },
        { headerName: "Product Description", field: "product_description" },
        { headerName: "Sale Start Time", field: "sale_start_time" },
        { headerName: "Sale End Time", field: "sale_end_time" },
        { headerName: "Quantity", field: "qty" },
        { headerName: "Net Sales", field: "net_sales" },
        { headerName: "Sale Type", field: "sale_type" },
      ],
      name,
    );
  };

  const handleEmail = () => {
    emailTransaction(context.url, context.token, first.sale_id)
      .then((resp) => {
        if (resp.data.error === 0)
          toast.success("Transaction emailed successfully");
      })
      .catch(() => toast.error("Error emailing transaction"));
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Sub-header */}
      <div className="flex-shrink-0 px-4 pt-2.5 pb-3 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="text-[13px] font-medium text-[#1e2a4a]">
              {first.cashier_name}
            </div>
            <div className="text-[11px] text-content/70 mt-0.5">
              #{saleId} · {fmtDate}
            </div>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <button
              onClick={handleEmail}
              className="flex items-center gap-1 text-[11px] font-medium bg-[#1e2a4a] text-custom-white rounded-md px-2.5 py-1.5"
            >
              Email
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 text-[11px] font-medium bg-[#1e2a4a] text-custom-white rounded-md px-2.5 py-1.5"
            >
              <ArrowDownTrayIcon className="w-3 h-3" />
              CSV
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { label: "Time", value: timeStr },
            { label: "Cashier", value: `#${first.cashier_number}` },
            { label: "Terminal", value: first.terminal },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-baseline gap-1 rounded px-1.5 py-0.5"
              style={chipStyle}
            >
              <span className="text-[10px] text-content/60">{label}</span>
              <span className="text-[11px] font-semibold text-content">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Line items + sticky totals */}
      <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar px-4 pt-3 relative">
        {/* Column headers */}
        <div
          className="grid gap-1 pb-1.5 border-b border-gray-100 mb-1"
          style={{ gridTemplateColumns: "80px 1fr 28px 62px 55px" }}
        >
          {["UPC", "Description", "Qty", "Net", "Type"].map((h, i) => (
            <div
              key={h}
              className="text-[9px] font-semibold uppercase tracking-wide text-content/55"
              style={{ textAlign: i >= 2 ? "right" : "left" }}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {trans.map((item, i) => {
          const isVoid = item.sale_type.toLowerCase().includes("void");
          const isCoupon = item.is_coupon === 1 || item.coupon_amount > 0;
          return (
            <div
              key={i}
              className="grid gap-1 py-1.5 border-b border-gray-50 items-center"
              style={{ gridTemplateColumns: "80px 1fr 28px 62px 55px" }}
            >
              <div className="text-[9px] text-content/65 truncate">
                {item.product_code || "—"}
              </div>
              <div className="text-[10px] text-content truncate">
                {item.product_description}
              </div>
              <div className="text-[10px] text-content/75 text-right">
                {item.qty ?? 0}
              </div>
              <div
                className={`text-[10px] font-medium text-right ${isVoid ? "text-content/55 line-through" : isCoupon ? "text-red-500" : "text-content"}`}
              >
                {formatCurrency2(item.net_sales)}
              </div>
              <div className="flex items-center justify-end">
                <span className="text-[8px] uppercase tracking-wide px-1 py-px rounded bg-gray-100 text-content/65">
                  {item.sale_type}
                </span>
              </div>
            </div>
          );
        })}

        {/* Sticky totals */}
        <div
          className="flex justify-end pt-3 pb-3 border-t border-gray-100 bg-custom-white"
          style={{ position: "sticky", bottom: 0 }}
        >
          <div style={{ minWidth: 160 }}>
            <div className="flex justify-between text-[10px] py-0.5">
              <span className="text-content/65">Net sales</span>
              <span className="font-medium text-content">
                {formatCurrency2(netSales)}
              </span>
            </div>
            {totalTax > 0 && (
              <div className="flex justify-between text-[10px] py-0.5">
                <span className="text-content/65">Tax</span>
                <span className="font-medium text-content">
                  {formatCurrency2(totalTax)}
                </span>
              </div>
            )}
            {voidAmount !== 0 && (
              <div className="flex justify-between text-[10px] py-0.5">
                <span className="text-content/65">Voided</span>
                <span className="font-medium text-content">
                  {formatCurrency2(voidAmount)}
                </span>
              </div>
            )}
            {refundAmount !== 0 && (
              <div className="flex justify-between text-[10px] py-0.5">
                <span className="text-content/65">Refunded</span>
                <span className="font-medium text-content">
                  {formatCurrency2(refundAmount)}
                </span>
              </div>
            )}
            <div className="border-t border-dashed border-gray-200 mt-1 pt-1.5 flex justify-between">
              <span className="text-[11px] font-semibold text-content">
                Total
              </span>
              <span className="text-[12px] font-semibold text-content">
                {formatCurrency2(totalSales)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transaction;
