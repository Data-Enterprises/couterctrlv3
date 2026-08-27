import { createRequestQueue } from "../../../utils/requestQueue";

/** The one queue every UPC List request goes through.
 *
 *  The five marketing/* and items/item_association endpoints behind this page
 *  each do moderate-to-heavy server-side processing, and the container's memory
 *  is sensitive to how many run *at once* rather than how many run in total.
 *  Module scope on purpose: one queue shared by the page and all four tabs, so
 *  "the user opened Trend while last year's sales comp was still loading" is
 *  two requests back to back instead of two at the same time.
 *
 *  concurrency 1 is the whole point — don't raise it without knowing the
 *  endpoints can take it. The gap gives the server a moment to release memory
 *  between heavy jobs rather than meeting the next one at peak.
 */
export const upcQueue = createRequestQueue({ concurrency: 1, gapMs: 250 });
