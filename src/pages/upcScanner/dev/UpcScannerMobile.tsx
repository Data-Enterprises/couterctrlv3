import { useEffect, useState } from "react";
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

  const handleScan = (code: string, raw: string, source: ScanSource) => {
    // A code already in the batch adds no row — the file is one row per UPC.
    // `addScan` stamps the row it repeats instead, so the clerk still sees the
    // tag react rather than reading the silence as a scan that failed.
    dispatch(addScan({ raw, code, source, at: Date.now() }));
  };

  // Anything still pending gets looked up, wherever it came from.
  //
  // Keyed off the rows rather than called beside the scan, because a scan is
  // not the only way a row becomes pending: correcting a code in the list
  // replaces it with a new one, and that one needs a name just as much. Doing
  // it here means every path is covered by construction, including the ones
  // added later.
  //
  // Asking twice is `resolve`'s problem, not this effect's — it holds the
  // in-flight set itself, outside the component, so a remount mid-lookup does
  // not re-ask. Terminates either way: resolve always moves a row off
  // `pending`, and one it cannot name is left `error` rather than retried.
  useEffect(() => {
    rows.forEach((row) => {
      if (row.status === "pending") void resolve(row);
    });
  }, [rows, resolve]);

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
    // The screen scrolls; the list is not asked to fit.
    //
    // It used to be a fixed-height column with the list on `flex-1`, which is
    // fine on a tall phone and wrong on a handheld: the scope card, the capture
    // card, the send bar and the tab bar take their share first, and on a short
    // screen there is nothing left — the list collapsed to a sliver and a scan
    // that had landed looked like a scan that had not. Letting the page scroll
    // means rows are always rendered at their own height, and the send bar
    // sticks to the bottom so it stays reachable without pinning everything
    // above it.
    <div className="h-[calc(100dvh-3rem)] overflow-y-auto pb-14">
      <div className="flex flex-col gap-3 p-3">
      {/* 1. The scope card, which is also the capture. Which store, and the
          field that scans for it — one card, because they are one thought. */}
      <section className="rounded-2xl border border-gray-200 bg-custom-white shadow-md p-3">
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
            {/* `store_name` already leads with the store's number — "001 - IGA
                GLASGOW KY" — so prefixing store_number prints it twice. */}
            <div className="font-display text-[17px] font-bold tracking-tight text-content">
              {store?.store_name ?? `Store ${storeId}`}
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
          <p className="mt-2 rounded-lg bg-bkg p-2.5 text-[11.5px] leading-relaxed text-content/95">
            Scan the shelf tags you need printed. Each code is checked against
            this store, so a tag scanned off the wrong shelf shows up here
            before it becomes a wrong label — and any code can be corrected in
            the list. Sending writes a file of UPCs for this store that your tag
            printer picks up.
          </p>
        )}

        {/* 2. The capture, in the same card as the store it scans for. No
            count: the list below is the count, and the send button names it. */}
        <div className="mt-3">
          <CaptureCard onScan={handleScan} />
        </div>
      </section>

      {sent && (
        <section className="shrink-0 rounded-2xl border border-gray-200 bg-custom-white shadow-md p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-display text-[14px] font-bold text-content/95">
                {sent.count} UPCs sent for tags
              </div>
              <div className="mt-1 break-all font-mono text-[11px] text-brand_slate/95">
                {sent.file}
              </div>
            </div>
            <button
              type="button"
              onClick={() => dispatch(setSent(null))}
              className="shrink-0 font-mono text-[9.5px] uppercase tracking-wide text-content/95 underline"
            >
              Dismiss
            </button>
          </div>
        </section>
      )}

      {/* 3. What has been scanned. */}
      <BatchList />

      {/* In the flow, not pinned. Pinned, it printed itself over the top of
          the list on a short screen — which is the whole screen here. */}
      <button
        type="button"
        disabled={rows.length === 0}
        onClick={() => setSheetOpen(true)}
        className="h-14 w-full rounded-xl bg-brand_navy font-display text-[17px] font-bold tracking-tight text-custom-white shadow-md disabled:bg-brand_navy/20 disabled:text-content/40 disabled:shadow-none"
      >
        {rows.length === 0
          ? "Send for tags"
          : `Send ${rows.length} ${rows.length === 1 ? "tag" : "tags"}`}
      </button>

        {sheetOpen && <SendSheet onClose={() => setSheetOpen(false)} />}
      </div>
    </div>
  );
};

export default UpcScannerMobile;
