import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeUpc } from ".";

/**
 * A handheld scan gun (Zebra MC2200 and friends) typing into a text field.
 *
 * Measured on a real MC2200 (2026-09-17): DataWedge's keystroke output does
 * NOT type the barcode key by key. It commits the whole string through the
 * Android input connection, so one trigger pull is exactly one keydown
 * (`key: "Unidentified"`, keyCode 229) and one `beforeinput`/`input` pair with
 * `inputType: "insertText"` and the full code as `data`. No Enter follows.
 *
 * So a scan is detected by the event's shape, not by timing or by device:
 * a person cannot put eight-plus digits into a single insertText. A paste is
 * `insertFromPaste` and autofill `insertReplacementText`, so neither is
 * mistaken for one.
 */
export const isWedgeScan = (e: InputEvent): e is InputEvent & { data: string } =>
  e.inputType === "insertText" && typeof e.data === "string" && /^\d{8,14}$/.test(e.data);

/** Zebra's handheld families, by the model Client Hints report (MC2200, TC52…). */
const ZEBRA_MODEL = /^(MC|TC|EC|ET|WT|CC|PS|L10|VC)\d/i;

type HighEntropyNavigator = Navigator & {
  userAgentData?: { getHighEntropyValues?: (hints: string[]) => Promise<{ model?: string }> };
};

let modelLookup: Promise<string> | null = null;

/**
 * The device model, once per session.
 *
 * The user-agent string cannot say it — Chrome freezes the model to "K" on
 * every Android device — but Client Hints can (Chromium only, https only, and
 * asynchronous). Undefined on Safari and Firefox, which just means "not a gun".
 */
const deviceModel = (): Promise<string> =>
  (modelLookup ??=
    (navigator as HighEntropyNavigator).userAgentData?.getHighEntropyValues?.(["model"])
      .then((v) => v.model ?? "")
      .catch(() => "") ?? Promise.resolve(""));

/**
 * Whether this is scan-gun hardware. A hint for defaults only (keep a field
 * focused, hold back the soft keyboard) — never the gate on whether a scan is
 * accepted; any device that produces a wedge scan gets one.
 */
export const useIsScanGunDevice = (): boolean => {
  const [isGun, setIsGun] = useState(false);
  useEffect(() => {
    let live = true;
    deviceModel().then((m) => {
      if (live) setIsGun(ZEBRA_MODEL.test(m));
    });
    return () => {
      live = false;
    };
  }, []);
  return isGun;
};

/**
 * Makes a text field accept scan-gun input.
 *
 *   const gun = useScanGun((upc) => dispatch(scannedUpc(upc)));
 *   <input ref={gun.ref} inputMode={gun.inputMode ?? "search"} ... />
 *
 * A scan is cancelled before it lands as typed text and handed to `onScan`
 * normalized exactly as the camera normalizes it (`normalizeUpc`) — so a gun
 * scan and a camera scan reach the page as the same code. If the browser won't
 * cancel it, it lands in the field too; `onScan` replacing the field's value
 * (as the pages' handlers do) covers that.
 *
 * On scan-gun hardware the field also:
 *   - takes focus when it mounts, and takes it back when focus drops to
 *     nothing — the wedge commits into the focused field, and with nothing
 *     focused a trigger pull produces no event at all;
 *   - keeps the soft keyboard down (`inputMode="none"`) until the field is
 *     tapped, so the keyboard doesn't cover the screen between scans but
 *     typing is still one tap away.
 *
 * Listens natively on `beforeinput`: React's onBeforeInput is a polyfill that
 * doesn't carry `inputType`.
 */
export const useScanGun = (onScan: (upc: string, raw: string) => void) => {
  const isGun = useIsScanGunDevice();
  const [typing, setTyping] = useState(false);

  // Read at scan time, so the page's latest handler runs.
  const cb = useRef(onScan);
  cb.current = onScan;
  const gunRef = useRef(isGun);
  gunRef.current = isGun;

  const cleanup = useRef<(() => void) | null>(null);
  const node = useRef<HTMLInputElement | null>(null);

  const ref = useCallback((el: HTMLInputElement | null) => {
    cleanup.current?.();
    cleanup.current = null;
    node.current = el;
    if (!el) return;

    const onBeforeInput = (e: InputEvent) => {
      if (!isWedgeScan(e)) return;
      if (e.cancelable) e.preventDefault();
      // Normalized for a lookup, raw as printed — same pair the camera hands
      // back, since a page showing the code needs the digits the clerk sees.
      cb.current(normalizeUpc(e.data), e.data);
    };
    const onPointerDown = () => setTyping(true);
    const onBlur = () => {
      setTyping(false);
      if (!gunRef.current) return;
      // Only when focus went nowhere: tapping another field or button keeps it.
      setTimeout(() => {
        if (node.current && (document.activeElement === document.body || !document.activeElement))
          node.current.focus({ preventScroll: true });
      }, 0);
    };

    el.addEventListener("beforeinput", onBeforeInput);
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("blur", onBlur);
    cleanup.current = () => {
      el.removeEventListener("beforeinput", onBeforeInput);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("blur", onBlur);
    };
  }, []);

  // On gun hardware, start focused so the first trigger pull lands.
  useEffect(() => {
    if (isGun) node.current?.focus({ preventScroll: true });
  }, [isGun]);

  useEffect(() => () => cleanup.current?.(), []);

  return {
    ref,
    /** "none" on gun hardware until the field is tapped; otherwise undefined,
     *  so the caller keeps its own inputMode. */
    inputMode: isGun && !typing ? ("none" as const) : undefined,
  };
};
