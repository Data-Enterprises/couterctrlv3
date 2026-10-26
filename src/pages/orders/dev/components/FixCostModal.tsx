import { useMemo, useState } from "react";
import { XMarkIcon } from "@heroicons/react/16/solid";
import { updateOrderFile } from "../../../../api/orders";
import { formatCurrency2 } from "../../../../utils";
import type { AllOrder, JsonError, UpdateFileResp } from "../../../../interfaces";
import { bulkTargets, unitCostOf, type BulkTarget } from "../orderEdit";

interface Props {
  /** What survives the configuration panel — the scope of the fix. */
  rows: AllOrder[];
  /** Every line the search returned; a file carries the whole order. */
  all: AllOrder[];
  url: string;
  token: string;
  /** The orders that saved, so the page can show their new cost. */
  onApplied: (saved: BulkTarget[]) => void;
  onClose: () => void;
}

type Outcome = { target: BulkTarget; ok: boolean; msg?: string };

/**
 * One unit cost, written to every order the configuration panel left.
 *
 * Ben's question was whether an owner can set the cost on one UPC for every
 * store that has it on its report. The panel already answers "which UPC" and
 * "which stores", so this asks only the number.
 *
 * In unit cost, not case cost, because case size is per store: one store's
 * case of 12 and another's case of 24 are the same item at the same unit
 * price and two different case costs. The per-store list shows the case cost
 * each will get before anything is sent, because that is the number that
 * lands in the file and the only place a wrong case size would show.
 *
 * One item at a time. Every line here gets the same unit cost, so a scope
 * holding two different products would give both the same price — the modal
 * refuses that rather than doing it.
 *
 * Each order is its own file and its own `updateOrderFile` call, sent one
 * after another. A refusal from one store does not undo the others: eleven
 * stores at the right cost beats fourteen at the old one. Retry sends only
 * what did not land.
 */
const FixCostModal = ({
  rows: liveRows,
  all: liveAll,
  url,
  token,
  onApplied,
  onClose,
}: Props) => {
  /**
   * The scope as it was when the modal opened, held still.
   *
   * Saving changes the lines, and the lines decide what the panel lets
   * through — fix every "Missing cost" line and none of them are missing a
   * cost any more, so the filtered set the modal was opened on empties out
   * from under it. The modal works on what it was asked about.
   */
  const [rows] = useState(liveRows);
  const [all] = useState(liveAll);

  const items = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rows) m.set(String(r.product_code), r.description);
    return m;
  }, [rows]);

  const oneItem = items.size === 1;
  const [code, desc] = oneItem ? [...items.entries()][0] : ["", ""];

  // Start on the cost already there when the stores agree on one, so a
  // correction is an edit rather than a retype.
  const current = useMemo(() => {
    const costs = new Set(rows.filter((r) => r.base_cost).map((r) => unitCostOf(r).toFixed(4)));
    return costs.size === 1 ? [...costs][0] : "";
  }, [rows]);

  const [unitText, setUnitText] = useState(current);
  const unit = Number(unitText);
  const valid = unitText.trim() !== "" && Number.isFinite(unit) && unit >= 0;

  const targets = useMemo(
    () => (oneItem && valid ? bulkTargets(rows, all, unit) : []),
    [oneItem, valid, rows, all, unit],
  );

  const stores = new Set(targets.map((t) => t.doc.storenumber)).size;

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [outcomes, setOutcomes] = useState<Outcome[] | null>(null);

  /**
   * Sent one at a time rather than all at once.
   *
   * Every call drops a file for the import to pick up, and a burst of them is
   * the one thing that would make this harder to read back than doing it by
   * hand. One at a time also means the count in the footer is true.
   */
  const run = async (list: BulkTarget[]) => {
    setRunning(true);
    setDone(0);
    const results: Outcome[] = [];
    for (const target of list) {
      try {
        const resp = await updateOrderFile(
          url,
          token,
          target.payload.storeid,
          target.payload.lines,
        );
        const j: UpdateFileResp = resp.data;
        results.push(
          j.error === 0
            ? { target, ok: true }
            : { target, ok: false, msg: j.msg },
        );
      } catch (err) {
        results.push({ target, ok: false, msg: (err as JsonError).message });
      }
      setDone((n) => n + 1);
    }
    setRunning(false);

    // A retry only sent the failures, so the earlier successes carry over.
    const previous = (outcomes ?? []).filter(
      (o) => o.ok && !list.some((t) => t.doc.key === o.target.doc.key),
    );
    const merged = [...previous, ...results];
    setOutcomes(merged);

    const saved = results.filter((r) => r.ok).map((r) => r.target);
    if (saved.length) onApplied(saved);
  };

  const saved = outcomes?.filter((o) => o.ok) ?? [];
  const failed = outcomes?.filter((o) => !o.ok) ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={running ? undefined : onClose}
    >
      <div
        className="flex max-h-[88vh] w-[560px] max-w-[94vw] flex-col overflow-hidden rounded-xl bg-custom-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 bg-brand_navy px-4 py-2.5 flex-shrink-0">
          <span className="flex-1 text-[13px] font-medium text-custom-white">
            {outcomes
              ? `Fix cost — ${saved.length} of ${saved.length + failed.length} saved`
              : "Fix cost"}
          </span>
          {!running && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-custom-white/85 transition-colors hover:text-custom-white"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto thin-scrollbar p-4 flex flex-col gap-4">
          {outcomes ? (
            <>
              {saved.length > 0 && (
                <Section title="Saved">
                  {saved.map(({ target }) => (
                    <StoreRow
                      key={target.doc.key}
                      target={target}
                      right={<Pill ok>saved</Pill>}
                    />
                  ))}
                </Section>
              )}
              {failed.length > 0 && (
                <Section title="Not saved" bad>
                  {failed.map(({ target, msg }) => (
                    <StoreRow
                      key={target.doc.key}
                      target={target}
                      note={msg}
                      right={<Pill>failed</Pill>}
                    />
                  ))}
                </Section>
              )}
              {failed.length > 0 && saved.length > 0 && (
                <p className="text-[12px] text-content/85">
                  The {saved.length} saved are written and will not be sent
                  again. Retry sends only the {failed.length}.
                </p>
              )}
              {saved.length > 0 && (
                <p className="text-[12px] text-content/85">
                  The grid shows the new cost now. The order files are
                  submitted for import, and the next fetch of these orders
                  will match once the import has run.
                </p>
              )}
            </>
          ) : !oneItem ? (
            <div className="rounded-lg border border-severity_watch_text/40 bg-severity_watch_bg px-3 py-2.5 text-[12.5px] leading-relaxed text-severity_watch_text">
              <b className="font-semibold">Narrow Items to one UPC first.</b>{" "}
              The grid holds {items.size.toLocaleString()} different items, and
              this gives every line the same unit cost — doing that across
              different products would price them all alike.
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-gray-200 px-3 py-2.5">
                <div className="mb-1 font-display text-[12.5px] font-bold text-content">
                  What this covers
                </div>
                <p className="text-[12.5px] leading-relaxed text-content">
                  <b className="font-semibold">{desc}</b>{" "}
                  <span className="text-content/85">· {code}</span>
                  <br />
                  {rows.length.toLocaleString()} line{rows.length === 1 ? "" : "s"}{" "}
                  across {stores.toLocaleString()} store{stores === 1 ? "" : "s"} and{" "}
                  {targets.length.toLocaleString()} order
                  {targets.length === 1 ? "" : "s"}
                  <br />
                  <span className="text-content/85">
                    Everything surviving the configuration panel.
                  </span>
                </p>
              </div>

              <div>
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-content/85">
                  New unit cost
                </span>
                <div className="flex items-center gap-1 rounded border border-brand_navy/75 bg-custom-white px-2">
                  <span className="text-[13px] text-content/85">$</span>
                  <input
                    autoFocus
                    type="number"
                    min={0}
                    step={0.0001}
                    value={unitText}
                    onChange={(e) => setUnitText(e.target.value)}
                    disabled={running}
                    className="min-w-0 flex-1 border-0 bg-transparent py-1.5 text-[13px] tabular-nums text-content"
                    style={{ outline: "none", boxShadow: "none" }}
                  />
                </div>
              </div>

              {targets.length > 0 && (
                <Section title="Per store">
                  {targets.map((t) => (
                    <StoreRow
                      key={t.doc.key}
                      target={t}
                      right={
                        <span className="tabular-nums">
                          <span className="text-content/85">
                            case of {t.casesize > 0 ? t.casesize : "—"} →{" "}
                          </span>
                          <b className="font-semibold">{formatCurrency2(t.newCaseCost)}</b>
                        </span>
                      }
                    />
                  ))}
                </Section>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-gray-100 px-4 py-2.5 flex-shrink-0">
          <span className="flex-1 text-[12px] text-content/85">
            {running
              ? `Saving ${done} of ${outcomes ? failed.length : targets.length}…`
              : !outcomes && targets.length > 0
                ? `${targets.length} order${targets.length === 1 ? "" : "s"} will be saved, one call each.`
                : ""}
          </span>

          {!running && (
            <button
              onClick={onClose}
              className="rounded border border-content/20 px-3 py-1 text-[12px] font-medium text-content/85 transition-colors hover:border-content/35 hover:text-content"
            >
              {outcomes ? "Close" : "Cancel"}
            </button>
          )}

          {!outcomes ? (
            <button
              onClick={() => run(targets)}
              disabled={running || targets.length === 0}
              className="rounded bg-brand_navy px-3 py-1 text-[12px] font-semibold text-custom-white transition-colors hover:bg-brand_navy_hover disabled:opacity-50"
            >
              Apply to {targets.length}
            </button>
          ) : (
            failed.length > 0 && (
              <button
                onClick={() => run(failed.map((f) => f.target))}
                disabled={running}
                className="rounded bg-brand_navy px-3 py-1 text-[12px] font-semibold text-custom-white transition-colors hover:bg-brand_navy_hover disabled:opacity-50"
              >
                Retry {failed.length}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

const Section = ({
  title,
  bad = false,
  children,
}: {
  title: string;
  bad?: boolean;
  children: React.ReactNode;
}) => (
  <div
    className={`rounded-lg border px-3 py-2 ${
      bad ? "border-severity_critical_text/50" : "border-gray-200"
    }`}
  >
    <div
      className={`mb-1 font-display text-[12.5px] font-bold ${
        bad ? "text-severity_critical_text" : "text-content"
      }`}
    >
      {title}
    </div>
    {children}
  </div>
);

const StoreRow = ({
  target,
  right,
  note,
}: {
  target: BulkTarget;
  right: React.ReactNode;
  note?: string;
}) => (
  <div className="flex items-baseline gap-3 border-t border-gray-100 py-1.5 text-[12px] first:border-t-0">
    <div className="min-w-0 flex-1">
      <div className="truncate text-content">
        {target.doc.storenumber} — {target.doc.storename}
      </div>
      <div className="text-[10.5px] text-content/85">
        Order {target.doc.order_id}
        {note ? ` · ${note}` : ""}
      </div>
    </div>
    <div className="flex-shrink-0 text-right">{right}</div>
  </div>
);

const Pill = ({ ok = false, children }: { ok?: boolean; children: React.ReactNode }) => (
  <span
    className={`rounded px-1.5 py-0.5 text-[10.5px] font-semibold ${
      ok
        ? "bg-severity_healthy_bg text-severity_healthy_text"
        : "bg-severity_critical_bg text-severity_critical_text"
    }`}
  >
    {children}
  </span>
);

export default FixCostModal;
