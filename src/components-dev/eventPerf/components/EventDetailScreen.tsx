// Hooks
import { useAppDispatch } from "../../../hooks";
import { useEventPerfCtx } from "../hooks";

// Redux
import {
  clearEventCashier,
  closeReceipt,
  openEventDetail,
  openReceipt,
  selectEventCashier,
  setEventQuery,
  setEventSort,
  setEventView,
  showMoreEvents,
} from "../../../features/dev/devEventPerfSlice";

// Utils
import { formatDateSimple } from "../../../utils";
import { eventDirOf } from "../utils";
import { sortOptions } from "../utils/display";

// Components
import BottomSheet from "../../BottomSheet";
import MobilePerfDetail from "../../mobile/MobilePerfDetail";
import EventDrillList from "./EventDrillList";
import Receipt from "./Receipt";

interface EventDetailScreenProps {
  title: string;
  measure: "transactions" | "amount";
}

/** A breakdown on its own screen: the open card's cashiers or
 *  transactions, and a receipt sheet. The card stays open behind it. */
const EventDetailScreen = ({ title, measure }: EventDetailScreenProps) => {
  const dispatch = useAppDispatch();
  const {
    perf,
    DETAIL_TABS,
    detailScope,
    dayLabel,
    weekLabel,
    multiStore,
    detailBuilding,
    shownCashiers,
    shownReceipts,
    receipts,
    cashierRows,
    openTxn,
    openReceiptState,
  } = useEventPerfCtx();
  return (
    <>
      <MobilePerfDetail
        tabs={DETAIL_TABS}
        active={perf.view}
        onTab={(k) => dispatch(setEventView(k))}
        scopeName={detailScope}
        when={`${dayLabel || weekLabel}${perf.lens ? ` · ${perf.lens}` : ""}`}
        backLabel={multiStore ? "Stores" : title}
        onBack={() => dispatch(openEventDetail(false))}
        levelKey={`${perf.view}|${perf.selectedCashierKey ?? ""}`}
      >
        <EventDrillList
          view={perf.view}
          building={detailBuilding}
          measure={measure}
          rows={shownCashiers}
          sortOptions={sortOptions(measure, "cashier")}
          sort={perf.sort.cashiers?.key ?? null}
          sortDir={
            perf.sort.cashiers
              ? eventDirOf(perf.sort.cashiers.key, perf.sort.cashiers.reversed)
              : null
          }
          onSort={(key) =>
            dispatch(setEventSort({ list: "cashiers", sort: key }))
          }
          onSelectCashier={(row) => dispatch(selectEventCashier(row))}
          receipts={shownReceipts}
          query={perf.query}
          onQuery={(q) => dispatch(setEventQuery(q))}
          onOpenReceipt={(id) => dispatch(openReceipt(id))}
          cashierLabel={perf.selectedCashierLabel}
          onClearCashier={() => dispatch(clearEventCashier())}
          remaining={
            perf.view === "receipts"
              ? receipts.length - shownReceipts.length
              : cashierRows.length - shownCashiers.length
          }
          onShowMore={() => dispatch(showMoreEvents())}
        />
      </MobilePerfDetail>

      {openTxn && (
        <BottomSheet onClose={() => dispatch(closeReceipt())}>
          <Receipt
            txn={openTxn}
            receipt={openReceiptState}
            when={openTxn.day ? formatDateSimple(openTxn.day) : ""}
          />
        </BottomSheet>
      )}
    </>
  );
};

export default EventDetailScreen;
