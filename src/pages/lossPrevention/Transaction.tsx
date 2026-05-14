import type { JsonError, TransactionListItem } from "../../interfaces";
import { formatCurrency2, formatDate } from "../../utils";
import { exportData } from "../../utils/export";
import { useAppSelector } from "../../hooks";
import { emailTransaction } from "../../api/lossPrevention";
import { useToast } from "../../components/toasts/hooks/useToast";

interface TransactionProps {
  trans: TransactionListItem[];
}
const Transaction = ({ trans }: TransactionProps) => {
  const toast = useToast();
  const context = useAppSelector((state) => state.app);
  const cashier = useAppSelector((state) => state.lossPrevention);
  const extractSaleId = (saleId: string) => {
    return saleId.split("-")[1];
  };

  const formatTime = (start: string, end: string) => {
    if (start[0] !== "0" && start.length === 5) {
      start = "0" + start;
    }

    if (end[0] !== "0" && end.length === 5) {
      end = "0" + end;
    }

    const str1 =
      start.slice(0, 2) + ":" + start.slice(2, 4) + ":" + start.slice(4);
    const str2 = end.slice(0, 2) + ":" + end.slice(2, 4) + ":" + end.slice(4);
    return str1 + " - " + str2;
  };

  const renderStamps = (item: TransactionListItem) => {
    const stamps = [];
    if (item.fs > 0) stamps.push("FS");
    if (item.fsa > 0) stamps.push("FSA");
    if (item.wic > 0) stamps.push("WIC");
    return stamps.join(" ");
  };

  const splitDate = (dateStr: string) => {
    return dateStr.split("T")[0] + " " + dateStr.split("T")[1];
  };

  const handleExportClick = () => {
    const cashierName = trans[0].cashier_name;
    const name = `${cashierName}_${trans[0].sale_id.split("-")[1]}_${formatDate(
      trans[0].sale_date,
    )}.csv`;
    exportData<TransactionListItem>(
      trans,
      [
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
      ],
      name,
    );
  };

  const handleEmailClick = () => {
    emailTransaction(context.url, context.token, trans[0].sale_id)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Transaction emailed successfully");
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error emailing transaction: " + err.message),
      );
  };

  let totalSales = 0;
  let netSales = 0;
  let totalTax = 0;
  let voidAmount = 0;
  let refundAmount = 0;

  // Refunded, Voided need to be addressed
  if (cashier.selectedSaleType.toLowerCase() === "voided") {
    const transaction = trans.filter(
      (t) =>
        t.sale_type.toLowerCase() !== "tender" &&
        t.product_description.toLowerCase() !== "ewic",
      // t.product_code !== null,
    );
    totalTax = transaction.reduce((acc, cur) => {
      if (!cur.sale_type.toLowerCase().includes("void")) {
        return acc + cur.total_rounded_tax;
      }
      return acc;
    }, 0);

    voidAmount = transaction.reduce((acc, cur) => {
      if (cur.sale_type.toLowerCase().includes("void")) {
        return acc + cur.net_sales;
      }
      return acc;
    }, 0);

    totalSales = transaction.reduce((acc, cur) => {
      if (!cur.sale_type.toLowerCase().includes("void")) {
        return acc + cur.total_sales;
      }
      return acc;
    }, 0);

    netSales = transaction.reduce((acc, cur) => {
      if (!cur.sale_type.toLowerCase().includes("void")) {
        return acc + cur.total_sales - cur.total_rounded_tax;
      }
      return acc;
    }, 0);
  } else if (cashier.selectedSaleType.toLowerCase() === "refunded") {
    const transaction = trans.slice(0, -1);
    totalSales = transaction.reduce((acc, cur) => {
      // voided => do not add
      if (cur.sale_type.toLowerCase().includes("void")) {
        return acc;
      }

      return acc + cur.total_sales;
    }, 0);

    netSales = transaction.reduce((acc, cur) => {
      if (
        cur.sale_type.toLowerCase().includes("refund") ||
        cur.sale_type.toLowerCase().includes("sale")
      ) {
        return acc + cur.total_sales - cur.total_rounded_tax;
      }

      return acc;
    }, 0);

    totalTax = transaction.reduce((acc, cur) => {
      // voided => do not add
      if (cur.sale_type.toLowerCase().includes("void")) {
        return acc;
      }

      return acc + cur.total_rounded_tax;
    }, 0);

    refundAmount = transaction.reduce((acc, cur) => {
      if (cur.sale_type.toLowerCase().includes("refund")) {
        return acc + cur.total_sales;
      }
      return acc;
    }, 0);

    voidAmount = transaction.reduce((acc, cur) => {
      if (cur.sale_type.toLowerCase().includes("void")) {
        return acc + cur.net_sales;
      }
      return acc;
    }, 0);
  } else {
    // The default works for No Sale, Backup, Cancelled, and Description
    const bool = cashier.selectedSaleType.toLowerCase() === "description";
    const transaction = bool ? trans.slice(0, -1) : trans;

    totalSales = transaction.reduce((acc, cur) => {
      if (cur.sale_type === "Tender") {
        return acc;
      } else if (cur.is_coupon === 1 || cur.coupon_amount > 0) {
        return acc - (cur.coupon_amount + Math.abs(cur.total_sales));
      } else if (!cur.sale_type.toLowerCase().includes("void")) {
        return acc + cur.total_sales;
      }
      return acc;
    }, 0);

    netSales = transaction.reduce(
      (acc, cur) => {
        if (cur.sale_type === "Tender") {
          return acc;
        } else if (cur.is_coupon === 1 || cur.coupon_amount > 0) {
          return acc - (cur.coupon_amount + Math.abs(cur.total_sales));
        } else if (!cur.sale_type.toLowerCase().includes("void")) {
          return acc + cur.total_sales-cur.total_rounded_tax;
        }
        return acc;
      },
      0,
    );

    totalTax = transaction.reduce((acc, cur) => acc + cur.total_rounded_tax, 0);

    refundAmount = transaction.reduce((acc, cur) => {
      if (cur.sale_type.toLowerCase().includes("refund")) {
        return acc + cur.total_sales;
      }
      return acc;
    }, 0);

    voidAmount = transaction.reduce((acc, cur) => {
      if (cur.sale_type.toLowerCase().includes("void")) {
        return acc + cur.net_sales;
      }
      return acc;
    }, 0);
  }

  return (
    <div className="border border-blue-500 p-2 rounded-lg relative select-none">
      <div className="absolute right-2 top-2 flex gap-2">
        <button
          data-testid="cashier-trans-modal-email-btn"
          className="btn-themeGreen px-4 py-0.5"
          onClick={handleEmailClick}
        >
          Email
        </button>
        {context.isDesktop && (
          <button
            data-testid="cashier-trans-modal-export-btn"
            className="btn-themeBlue px-4 py-0.5"
            onClick={handleExportClick}
          >
            Export
          </button>
        )}
      </div>
      <div className="pb-2 border-b border-content text-[13px] leading-tight">
        <div className="flex gap-1">
          <div className="font-medium">Store Name:</div>
          <div>{trans[0].store_name}</div>
        </div>
        <div className="flex gap-1">
          <div className="font-medium">Sale ID:</div>
          <div>{extractSaleId(trans[0].sale_id)}</div>
        </div>
        <div className="flex gap-1">
          <div className="font-medium">Date:</div>
          <div>{splitDate(trans[0].sale_date)}</div>
        </div>
        <div className="flex gap-1">
          <div className="font-medium">Cashier:</div>
          <div>
            {trans[0].cashier_number}:{trans[0].cashier_name}
          </div>
        </div>
        <div className="flex gap-1">
          <div className="font-medium">Time:</div>
          <div>
            {formatTime(trans[0].sale_start_time, trans[0].sale_end_time)}
          </div>
        </div>
        <div className="flex gap-1">
          <div className="font-medium">Terminal:</div>
          <div>{trans[0].terminal}</div>
        </div>
      </div>
      <div>
        <div className="mt-2 font-medium">Line Items</div>
        {/* Line Items */}
        {trans.map((item, i) => {
          if (context.isMobile) {
            return (
              <div
                key={i}
                className="text-[10px] my-1 pb-0.5 border-b border-content/30"
              >
                <div className="flex justify-between">
                  <div>{item.product_code}</div>
                </div>
                <div className="grid grid-cols-[1.9fr_0.6fr_1fr_0.8fr_0.7fr]">
                  <div className="text-nowrap truncate">{item.product_description}</div>
                  <div className="text-right pr-4">{item.qty}</div>
                  <div>
                    {formatCurrency2(
                      cashier.selectedSaleType === "Description"
                        ? item.total_sales
                        : item.net_sales,
                    )}
                  </div>
                  <div>{renderStamps(item)}</div>
                  <div className="text-right">{item.sale_type}</div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={i}
              className="grid grid-cols-[18%_42%_5%_10%_10%_1fr] gap-1 text-[13px] mt-1.5"
            >
              <div>{item.product_code}</div>
              <div>{item.product_description}</div>
              <div>{item.qty}</div>
              <div>
                {formatCurrency2(
                  cashier.selectedSaleType === "Description"
                    ? item.total_sales
                    : item.net_sales,
                )}
              </div>
              <div>{renderStamps(item)}</div>
              <div>{item.sale_type}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-[13px] font-medium">
        <div className="flex gap-1">
          <div>Net Sales:</div>
          <div>{formatCurrency2(netSales)}</div>
        </div>
        {totalTax > 0 && (
          <div className="flex gap-1">
            <div>Total Tax:</div>
            <div>{formatCurrency2(totalTax)}</div>
          </div>
        )}
        <div className="flex gap-1">
          <div>Total Sales:</div>
          <div>{formatCurrency2(totalSales)}</div>
        </div>
        {voidAmount !== 0 && (
          <div className="flex gap-1">
            <div>Void Amount:</div>
            <div>{formatCurrency2(voidAmount)}</div>
          </div>
        )}
        {refundAmount !== 0 && (
          <div className="flex gap-1">
            <div>Refund Amount:</div>
            <div>{formatCurrency2(refundAmount)}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transaction;
