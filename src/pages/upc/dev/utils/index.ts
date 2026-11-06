// Interfaces
import type { UpcAnswer } from "../interfaces";

export const answerOf = (
  j: { error?: number; success?: boolean } | null | undefined,
): UpcAnswer => {
  if (!j) return "failed";
  if (j.error === 0) return "ok";
  return j.success === true ? "empty" : "failed";
};

/** Why a call failed, in words for the screen: the server's reason when it
 *  sent one as a sentence, else its status, else that it couldn't be reached.
 *  axios puts a refused call's body under `response.data`. */
export const failureReason = (err: unknown): string => {
  const e = err as { response?: { status?: number; data?: { detail?: unknown; msg?: unknown } } };
  const body = e.response?.data;
  const said = typeof body?.detail === "string" ? body.detail : typeof body?.msg === "string" ? body.msg : "";
  if (said) return said;
  if (e.response?.status) return `error ${e.response.status}`;
  return "the server couldn't be reached";
};
