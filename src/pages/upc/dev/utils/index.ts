// Interfaces
import type { CtaTone, UpcAnswer } from "../interfaces";

export const answerOf = (
  j: { error?: number; success?: boolean } | null | undefined,
): UpcAnswer => {
  if (!j) return "failed";
  if (j.error === 0) return "ok";
  return j.success === true ? "empty" : "failed";
};

/** Why a call failed, for the screen: the server's sentence, else its
 *  status, else unreachable. axios puts a refused call's body under
 *  `response.data`. */
export const failureReason = (err: unknown): string => {
  const e = err as { response?: { status?: number; data?: { detail?: unknown; msg?: unknown } } };
  const body = e.response?.data;
  const said = typeof body?.detail === "string" ? body.detail : typeof body?.msg === "string" ? body.msg : "";
  if (said) return said;
  if (e.response?.status) return `error ${e.response.status}`;
  return "the server couldn't be reached";
};

/** Each insight tone's fill, hover fill, text and border classes. */
export const TONE_CLASSES: Record<CtaTone, { bg: string; hoverBg: string; text: string; border: string }> = {
  up: {
    bg: "bg-severity_healthy_bg",
    hoverBg: "hover:bg-severity_healthy_text/10",
    text: "text-severity_healthy_text",
    border: "border-severity_healthy_text/25",
  },
  down: {
    bg: "bg-severity_critical_bg",
    hoverBg: "hover:bg-severity_critical_text/10",
    text: "text-severity_critical_text",
    border: "border-severity_critical_text/25",
  },
  flat: {
    bg: "bg-fill_muted",
    hoverBg: "hover:bg-gray-200",
    text: "text-content",
    border: "border-line_strong",
  },
  muted: {
    bg: "bg-fill_muted",
    hoverBg: "hover:bg-gray-200",
    text: "text-content",
    border: "border-line_strong",
  },
};

/** UPCs from pasted text: split on commas, semicolons, tabs, spaces and line breaks; digits only. */
export const parseUpcs = (text: string): string[] =>
  text
    .split(/[\n,;\r\t ]+/)
    .map((u) => u.trim())
    .filter((u) => u.length > 0 && /^\d+$/.test(u));

/** Everything but the UPC list that decides whether loaded data is still
 *  valid, from the search selection (not resolved storeids) so the check is
 *  free. Same key, fewer UPCs: a pure removal answered from state. */
export const buildScopeKey = (
  type: string,
  storeid: number | string | undefined,
  groupId: number | string | undefined,
  startDate: string,
  endDate: string,
) => [type, type === "Store" ? storeid ?? "" : groupId ?? "", startDate, endDate].join("|");

/** Whether two comma-joined store lists hold the same stores, in any order. */
export const sameStores = (a: string, b: string) => {
  const norm = (s: string) =>
    s
      .split(",")
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((x, y) => x - y)
      .join(",");
  return norm(a) === norm(b);
};
