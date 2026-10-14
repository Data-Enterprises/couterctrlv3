import { useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import SingleStoreSearchCard from "../../../components-dev/SingleStoreSearchCard";
import InfoButton from "../../../components/InfoButton";
import {
  addScan,
  setScanStore,
  setSent,
  type ScanSource,
} from "../../../features/dev/devUpcScannerSlice";
import CaptureCard from "./CaptureCard";
import BatchList from "./BatchList";
import SendSheet from "./SendSheet";
import { useScanResolve } from "./useScanResolve";

/**
 * Upc Scanner, on the phone or the handheld.
 *
 * One screen, built the way every other mobile module screen is: the scope
 * card that never collapses, then the capture card directly under it, then the
 * list. No second screen, no page header slab, and the camera is not a mode
 * you navigate into — it is one of the two faces of the capture card.
 *
 * Opens on the store card, because a batch belongs to exactly one store: every
 * row carries that store into the file, so the store has to be settled before
 * the first scan rather than asked for at the end.
 */
const UpcScannerMobile = () => {
  const dispatch = useAppDispatch();
  const resolve = useScanResolve();
  const { assignedStores } = useAppSelector((s) => s.user);
  const { storeId, rows, sent } = useAppSelector((s) => s.dev.upcScanner);

  const [infoOpen, setInfoOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [draftStore, setDraftStore] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);

  const store = assignedStores.find((s) => s.storeid === storeId);
  const unverified = rows.filter((r) => r.status !== "named").length;
  const lastScan = rows.length
    ? new Date(Math.max(...rows.map((r) => r.at))).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

  const handleScan = (code: string, raw: string, source: ScanSource) => {
    const at = Date.now();
    // A code already in the batch adds no row — the file is one row per UPC —
    // so there is nothing new to look up either. `addScan` stamps the row it
    // repeats so the clerk still sees the tag react.
    const known = rows.some((r) => r.code === code);
    dispatch(addScan({ raw, code, source, at }));
    if (!known) resolve({ raw, code, source, at, status: "pending" });
  };

  if (!storeId || picking) {
    const switching = storeId > 0 && draftStore > 0 && draftStore !== storeId;
    return (
      <div className="h-[calc(100dvh-3rem)] overflow-y-auto pb-14">
        <div className="mx-4 flex justify-center pb-2 pt-4">
          <SingleStoreSearchCard
            title="Upc Scanner"
            description="Pick the store these tags are for, then scan the shelf."
            buttonLabel={storeId ? "Switch store" : "Start scanning"}
            stores={assignedStores}
            selectedStoreId={draftStore || storeId}
            onStoreSelect={setDraftStore}
            onSearch={() => {
              dispatch(setScanStore(draftStore || storeId));
              setPicking(false);
            }}
            onBack={storeId ? () => setPicking(false) : undefined}
            backLabel="Back to the batch"
            notice={
              switching && rows.length
                ? `Switching stores starts a new batch — the ${rows.length} scanned here will be cleared.`
                : undefined
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col gap-3 overflow-hidden p-3 pb-14">
      {/* 1. The scope card. Store, the batch's headline figure, and the way
          back to the store list. Never collapses. */}
      <section className="shrink-0 rounded-2xl border border-gray-200 bg-custom-white shadow-md p-3">
        <div className="flex items-start gap-2">
          <button
            type="button"
            aria-label="Pick a different store"
            onClick={() => {
              setDraftStore(storeId);
              setPicking(true);
            }}
            className="-my-2.5 -ml-2.5 -mr-1 flex h-11 w-11 shrink-0 items-center justify-center text-brand_navy"
          >
            <MagnifyingGlassIcon className="h-[17px] w-[17px]" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="font-display text-[15px] font-bold tracking-tight text-content/85">
              {store ? `${store.store_number} — ${store.store_name}` : `Store ${storeId}`}
            </div>
            <div className="mt-0.5 font-mono text-[9.5px] uppercase tracking-wide text-brand_slate/85">
              Shelf tag batch
            </div>
          </div>
          {/* Opens in place rather than on its own screen — there is one
              screen here. `light` is the variant for a white card; the navy
              one would paint a white glyph on white. */}
          <InfoButton
            variant="light"
            title="What this page shows"
            onClick={() => setInfoOpen((open) => !open)}
            className="-my-2 -mr-2 h-11 w-11 shrink-0"
          />
        </div>

        {infoOpen && (
          <p className="mt-2 rounded-lg bg-bkg p-2.5 text-[11.5px] leading-relaxed text-content/85">
            Scan the shelf tags you need printed. Each code is checked against
            this store, so a tag scanned off the wrong shelf shows up here
            before it becomes a wrong label — and any code can be corrected in
            the list. Sending writes a file of UPCs for this store that your tag
            printer picks up.
          </p>
        )}

        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="font-display text-[31px] font-extrabold leading-none tracking-tight text-content/85">
            {rows.length}
          </span>
          <span className="pb-1 font-mono text-[9.5px] font-semibold uppercase tracking-wide text-brand_slate/85">
            UPCs collected
          </span>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2.5 border-t border-gray-100 pt-2.5">
          <div>
            <div className="font-mono text-[9.5px] uppercase tracking-wide text-brand_slate/85">
              Last scan
            </div>
            <div className="mt-0.5 text-[15px] font-bold text-content/85">{lastScan}</div>
          </div>
          <div>
            <div className="font-mono text-[9.5px] uppercase tracking-wide text-brand_slate/85">
              Unverified
            </div>
            <div className="mt-0.5 text-[15px] font-bold text-content/85">
              {rows.length ? unverified : "—"}
            </div>
          </div>
        </div>
      </section>

      {sent && (
        <section className="shrink-0 rounded-2xl border border-gray-200 bg-custom-white shadow-md p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-display text-[14px] font-bold text-content/85">
                {sent.count} UPCs sent for tags
              </div>
              <div className="mt-1 break-all font-mono text-[11px] text-brand_slate/85">
                {sent.file}
              </div>
            </div>
            <button
              type="button"
              onClick={() => dispatch(setSent(null))}
              className="shrink-0 font-mono text-[9.5px] uppercase tracking-wide text-content/85 underline"
            >
              Dismiss
            </button>
          </div>
        </section>
      )}

      {/* 2. The find row, in its own card, directly under the scope card. */}
      <CaptureCard onScan={handleScan} />

      {/* 3. What has been scanned. */}
      <BatchList />

      <div className="shrink-0">
        {unverified > 0 && (
          <p className="pb-1.5 text-[11px] font-semibold text-content/85">
            {unverified} {unverified === 1 ? "code has" : "codes have"} no item name —
            worth a look before sending.
          </p>
        )}
        <button
          type="button"
          disabled={rows.length === 0}
          onClick={() => setSheetOpen(true)}
          className="h-[46px] w-full rounded-xl bg-brand_navy font-display text-[14.5px] font-bold tracking-tight text-custom-white shadow-md disabled:bg-brand_navy/20 disabled:text-content/40 disabled:shadow-none"
        >
          {rows.length ? `Send ${rows.length} UPCs for tags` : "Send for tags"}
        </button>
      </div>

      {sheetOpen && <SendSheet onClose={() => setSheetOpen(false)} />}
    </div>
  );
};

export default UpcScannerMobile;
