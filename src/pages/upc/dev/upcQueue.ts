// Utils
import { createRequestQueue } from "../../../utils/requestQueue";

/** The one queue every UPC List request goes through, shared by the page
 *  and all tabs (module scope on purpose). The endpoints behind it are heavy
 *  and the container is sensitive to how many run at once: concurrency 1 is
 *  the point, so don't raise it without knowing they can take it. The gap
 *  lets the server release memory between jobs. */
export const upcQueue = createRequestQueue({ concurrency: 1, gapMs: 250 });
