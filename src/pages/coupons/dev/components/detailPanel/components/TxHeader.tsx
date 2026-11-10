// Utils
import { formatDate } from "../../../../../../utils";

// Interfaces
import type { TransactionListItem } from "../../../../../../interfaces";

// Components
import { ArrowDownTrayIcon, ArrowLeftIcon } from "@heroicons/react/20/solid";

interface TxHeaderProps {
  txMeta: TransactionListItem | null;
  txLines: TransactionListItem[];
  onBack: () => void;
  onExport: () => void;
}

/** Who rang it, when, at which store, with Back and export. */
const TxHeader = ({ txMeta, txLines, onBack, onExport }: TxHeaderProps) => (
    <>
                      <div className="flex-shrink-0 px-3 py-2 flex items-center justify-between border-b border-gray-100 bg-custom-white">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={onBack}
                            className="flex items-center gap-1 text-content/95 hover:text-content transition-colors text-[11px]"
                          >
                            <ArrowLeftIcon className="w-3 h-3" />
                            Back to coupons
                          </button>
                          <div className="w-px h-4 bg-gray-200" />
                          <div>
                            <div className="text-[12px] font-semibold text-content">
                              {txMeta?.cashier_name}
                              <span className="ml-2 text-[10px] font-normal text-content/95">
                                — Terminal {txMeta?.terminal}
                              </span>
                            </div>
                            <div className="text-[10px] text-content/95">
                              {txMeta?.sale_start_time?.replace(
                                /(\d{2})(\d{2})(\d{2})/,
                                "$1:$2",
                              )}{" "}
                              –{" "}
                              {txMeta?.sale_end_time?.replace(
                                /(\d{2})(\d{2})(\d{2})/,
                                "$1:$2",
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {txLines.length > 0 && (
                            <button
                              onClick={onExport}
                              title="Export transaction CSV"
                              className="text-content/95 hover:text-content transition-colors"
                            >
                              <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <div className="w-px h-5 bg-gray-200" />
                          <div className="text-right">
                            <div className="text-[9px] uppercase tracking-wide text-content/95">
                              Trans
                            </div>
                            <div className="text-[12px] font-medium text-content">
                              {txMeta?.transaction_id ??
                                txMeta?.sale_id?.split("-")[1]}
                            </div>
                          </div>
                          <div className="w-px h-5 bg-gray-200" />
                          <div className="text-right">
                            <div className="text-[9px] uppercase tracking-wide text-content/95">
                              Items
                            </div>
                            <div className="text-[12px] font-medium text-content">
                              {txLines.length}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 px-3 py-1.5 flex items-center gap-3 border-b border-gray-100 bg-gray-50">
                        <span className="text-[11px] font-semibold text-content">
                          {txMeta?.store_name}
                        </span>
                        <span className="text-[10px] text-content/95">
                          {txMeta?.store_address}, {txMeta?.store_city}{" "}
                          {txMeta?.store_state}
                        </span>
                        <div className="flex-1" />
                        <span className="text-[10px] font-medium text-content/95">
                          {formatDate(txMeta?.sale_date?.split("T")[0] as string)}
                        </span>
                      </div>
    </>
);

export default TxHeader;
